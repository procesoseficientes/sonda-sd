
var TransferenciaDetalleControlador = (function () {

    function TransferenciaDetalleControlador() {

    };

    TransferenciaDetalleControlador.prototype.delegarTransferenciaDetalleControlador = function () {
        var _this = this;

        $("#UiDetailTransferPage").on("pageshow",
             function () { 
                 console.log("Mostrando pantalla de Detalle de Transferencia...");
                 var ulListaDetalle = $("#UiListaSkusEnTransferencia");
                 ulListaDetalle.trigger("create");
                 ulListaDetalle.listview("refresh");
                 ulListaDetalle = null;
             });

        $("#UiBtnSalirDeDetalleDeTransferencia").on("click",
            function () {
                _this.IrAPantalla("UiNotificationPage");
            });

        $("#UiBtnAceptarTransferencia").on("click",
            function () {
                InteraccionConUsuarioServicio.bloquearPantalla();
                var idTransferencia = $("#UiIdDocumentoDeTransferencia").text();
                if (idTransferencia === "...") {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("La transferencia " + idTransferencia + " no es valida...");
                } else {
                    idTransferencia = parseInt(idTransferencia);
                    _this.AceptarTransferencia(idTransferencia,
                        function (error) {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            notify(error);
                        }, LugarDeEnvioDeTransferenciaAceptada.DetalleDeTransferencia);
                }

            });
    }

    TransferenciaDetalleControlador.prototype.delegarSockets = function (socketIo) {
        var _this = this;
        socketIo.on("SendAcceptedTransfer_Request" + LugarDeEnvioDeTransferenciaAceptada.DetalleDeTransferencia,
            function (data) {
                switch (data.option) {
                    case "success":
                    InsertarListaDePrecioFueraDeRuta(data.skus, data.conversiones, function () {
                        _this.ProcesarSkusDeTransferencia(parseInt(data.data.transferId),
                            function () {
                                var uiBtnAceptarTransferencia = $("#UiBtnAceptarTransferencia");
                                uiBtnAceptarTransferencia.removeClass("ui-btn-active");
                                uiBtnAceptarTransferencia.addClass("ui-disabled");
                                uiBtnAceptarTransferencia = null;
                                notify("Transferencia aceptada exitosamente...");
                                var tiempoDeEspera = setTimeout(function() {
                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                    clearTimeout(tiempoDeEspera);
                                }, 1000);
                            },
                            function (error) {
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                                notify(error);
                            });
                        });
                        break;

                    case "fail":
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify(data.message);
                        break;
                }
            });
    }

    TransferenciaDetalleControlador.prototype.MostrarDetalleDeTransferencia = function (transferencia) {
        try {
            var _this = this;
            window.gIsOnNotificationPage = false;
            var lblIdDeTransferencia = $("#UiIdDocumentoDeTransferencia");
            var lblOrigenDeTransferencia = $("#UiBodegaOrigenDeTransferencia");
            var uiBtnAceptarTransferencia = $("#UiBtnAceptarTransferencia");

            if (transferencia !== undefined) {
                // ReSharper disable once QualifiedExpressionMaybeNull
                if (transferencia.STATUS === EstadoDeTransferencia.Completado) {
                    uiBtnAceptarTransferencia.removeClass("ui-disabled");
                    uiBtnAceptarTransferencia.addClass("ui-btn-active");
                } else {
                    uiBtnAceptarTransferencia.removeClass("ui-btn-active");
                    uiBtnAceptarTransferencia.addClass("ui-disabled");
                }
                lblIdDeTransferencia.text(transferencia.TRANSFER_ID);
                lblOrigenDeTransferencia.text(transferencia.CODE_WAREHOUSE_SOURCE);

                _this.CrearListadoDeDetalleDeTransferencia(transferencia, function () {
                    _this.IrAPantalla("UiDetailTransferPage");
                });

            } else {
                lblIdDeTransferencia.text("...");
                lblOrigenDeTransferencia.text("...");
                uiBtnAceptarTransferencia.removeClass("ui-btn-active");
                uiBtnAceptarTransferencia.addClass("ui-disabled");
            }

        } catch (e) {
            notify("Error al mostrar el detalle de la transferencia: " + e.message);
        }
    }

    TransferenciaDetalleControlador.prototype.CrearListadoDeDetalleDeTransferencia = function (transferencia, callBack) {
        try {
            var decimalesServicio = new ManejoDeDecimalesServicio();
            decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (configuracionDeDecimales) {
                var ulListaDeProductosEnTransferencia = $("#UiListaSkusEnTransferencia");
                ulListaDeProductosEnTransferencia.children().remove("li");
                var li = "";
                for (var i = 0; i < transferencia.TRANSFER_DETAIL.length; i++) {
                    var skuDetalle = transferencia.TRANSFER_DETAIL[i];
                    li = "<li>";
                    li += '<p><b>SKU:</b> ' + skuDetalle.SKU_CODE + " <br/><b>DESC.:</b> " + skuDetalle.DESCRIPTION_SKU + " <br/><b>CANT.:</b> " + format_number(skuDetalle.QTY, configuracionDeDecimales.defaultDisplayDecimalsForSkuQty) + "</p>";
                    if (skuDetalle.REQUERIES_SERIE === 1 || skuDetalle.REQUERIES_SERIE === "1") {
                        li += '<div data-role="collapsible" data-mini="true">';
                        li += "<h5>Series</h5>";
                        li += '<ul data-role="listview">';
                        for (var j = 0; j < skuDetalle.SERIES.length; j++) {
                            li += "<li><p>" + skuDetalle.SERIES[j] + "</p></li>";
                        }
                        li += "</ul>";
                    }
                    li += "</li>";
                    ulListaDeProductosEnTransferencia.append(li);
                }
                callBack();
            });
        } catch (e) {
            notify("Error al crear el listado de detalle de transferencia: " + e.message);
        }
    }

    TransferenciaDetalleControlador.prototype.IrAPantalla = function (pantalla) {
        $.mobile.changePage("#" + pantalla, {
            transition: "flow",
            reverse: true,
            changeHash: false,
            showLoadMsg: false
        });
    }



    TransferenciaDetalleControlador.prototype.AceptarTransferencia =
        function (idTransferencia, errorCallBack, origenDeAceptacion) {
            try {
                if (gIsOnline === EstaEnLinea.No) {
                    errorCallBack("Por favor, asegúrese de tener conexión hacia el servidor y vuelva a intentar.");
                } else {
                    ObtenerSkusSinListaDePrecios(function(skus){
                        var data = {
                            'routeid': gCurrentRoute,
                            'loginid': gLastLogin,
                            'Source': origenDeAceptacion,
                            'transferId': idTransferencia,
                            'dbuser': gdbuser,
                            'dbuserpass': gdbuserpass,
                            'listadoSkus': skus  
                        };
                        SocketControlador.socketIo.emit("SendAcceptedTransfer", data);
                    }, errorCallBack);
                   
                }
            } catch (e) {
                errorCallBack(e.message);
            }
        }

    TransferenciaDetalleControlador.prototype.ProcesarSkusDeTransferencia = function (transferId, callBack, errorCallBack) {
        try {
            var _this = this;
            ObtenerTransferencia(parseInt(transferId),
                 ObteniendoTransferenciaDesde.ProcesoDeTransferencia,
                 function (transferencia) {
                     if (transferencia.TRANSFER_DETAIL.length > 0) {
                        ObtenerSeriesDeSkuEnTransferencia(parseInt(transferId), transferencia.TRANSFER_DETAIL, 0, function() {
                            _this.ProcesarTransferenciaCompleta(transferencia, callBack, function (error) {
                                errorCallBack(error);
                            });
                        }, function(error) {
                            console.log("Error al obtener el detalle de la transferencia seleccionada, por favor, vuelva a intentar. " + error);
                            notify("Error al obtener el detalle de la transferencia seleccionada, por favor, vuelva a intentar.");
                        });
                     } else {
                         errorCallBack("No se encontro el detalle de la transferencia seleccionada...");
                     }
                 },
                 function (error) {
                     errorCallBack(error);
                 });
        } catch (e) {
            errorCallBack(e.message);
        }
    }

    TransferenciaDetalleControlador.prototype.ProcesarTransferenciaCompleta = function (transferencia,
        callBack,
        errorCallBack) {
        try {
            var _this = this;
            var transferenciaGuardada = transferencia;
            _this.ValidarExistenciaDeSkuEnElMovil(transferencia.TRANSFER_DETAIL,
                0,
                function () {
                    transferenciaGuardada.STATUS = EstadoDeTransferencia.Transferido;
                    ActualizarEstadoDeTransferencia(transferenciaGuardada, function () {
                        callBack();
                    }, function (error) {
                        errorCallBack(error);
                    });
                },
                function (error) {
                    errorCallBack(error);
                },
                (transferencia.TRANSFER_DETAIL.length) === 0);
        } catch (e) {
            errorCallBack(e.message);
        }
    }


    // SE COLOCA PARTE DEL SERVICIO ACA POR FALTA DE ESTRUCTURA EN EL ARCHIVO TransferenciaServicio.js

    TransferenciaDetalleControlador.prototype.ValidarExistenciaDeSkuEnElMovil = function (listaSkusEnTransferencia,
        indice,
        callBack,
        errorCallBack,
        esUltimo) {
        var _this = this;
        if (esUltimo === false) {
            SONDA_DB_Session.transaction(function (trans) {
                var skuDetalle = listaSkusEnTransferencia[indice];
                var sql = "SELECT SKU, REQUERIES_SERIE FROM SKUS WHERE SKU = '" + skuDetalle.SKU_CODE + "'";
                console.log(sql);

                trans.executeSql(sql,
                    [],
                    function (transExist, resultsExist) {
                        if (resultsExist.rows.length > 0) {
                            sql = "UPDATE SKUS SET ON_HAND = (ON_HAND + " +
                                skuDetalle.QTY +
                                ") WHERE SKU = '" +
                                skuDetalle.SKU_CODE +
                                "'";
                            console.log(sql);
                            transExist.executeSql(sql);

                            if (skuDetalle.REQUERIES_SERIE === 1) {
                                for (var i = 0; i < skuDetalle.SERIES.length; i++) {
                                    sql = "INSERT INTO SKU_SERIES (SKU" +
                                        ", SERIE" +
                                        ", STATUS" +
                                        ", LOADED_LAST_UPDATED) VALUES('" +
                                        skuDetalle.SKU_CODE +
                                        "', '" +
                                        skuDetalle.SERIES[i] +
                                        "',0,DATETIME())";
                                    console.log(sql);
                                    transExist.executeSql(sql);
                                }
                                return _this
                                    .ValidarExistenciaDeSkuEnElMovil(listaSkusEnTransferencia,
                                        (indice + 1),
                                        callBack,
                                        errorCallBack,
                                        (listaSkusEnTransferencia.length) === (indice + 1));
                            } else {
                                return _this
                                    .ValidarExistenciaDeSkuEnElMovil(listaSkusEnTransferencia,
                                        (indice + 1),
                                        callBack,
                                        errorCallBack,
                                        (listaSkusEnTransferencia.length) === (indice + 1));
                            }
                        } else {
                            console.log("No existe, procede a insertar sku...");

                            //inserta el SKU en la tabla de SKUS
                            sql =
                                "INSERT INTO SKUS(SKU" +
                                ", SKU_NAME" +
                                ", SKU_PRICE" +
                                ", SKU_LINK" +
                                ", REQUERIES_SERIE" +
                                ", IS_KIT" +
                                ", ON_HAND" +
                                ", ROUTE_ID" +
                                ", IS_PARENT" +
                                ", PARENT_SKU" +
                                ", EXPOSURE" +
                                ", PRIORITY" +
                                ", QTY_RELATED" +
                                ", LOADED_LAST_UPDATED, CODE_PACK_UNIT_STOCK, SALES_PACK_UNIT, TAX_CODE) VALUES(";
                            sql += "'" +
                                skuDetalle.SKU_CODE +
                                "', '" +
                                skuDetalle.DESCRIPTION_SKU +
                                "', 0, '...', " +
                                skuDetalle.REQUERIES_SERIE +
                                ", 0, " +
                                skuDetalle.QTY +
                                ", '" +
                                gDefaultWhs +
                                "', 0, '" +
                                skuDetalle.SKU_CODE +
                                "', 1, 0, 0,DATETIME(),'" + 
                                skuDetalle.CODE_PACK_UNIT_STOCK + 
                                "', '" + 
                                skuDetalle.SALES_PACK_UNIT + 
                                "', '" + 
                                skuDetalle.VAT_CODE + 
                                "' )";

                            console.log(sql);
                            transExist.executeSql(sql);

                            // inserta el SKU en la tabla SKU_HISTORY
                            sql =
                                "INSERT INTO SKU_HISTORY(SKU" +
                                ", SKU_NAME" +
                                ", SKU_PRICE" +
                                ", SKU_LINK" +
                                ", REQUERIES_SERIE" +
                                ", IS_KIT" +
                                ", ON_HAND" +
                                ", ROUTE_ID" +
                                ", IS_PARENT" +
                                ", PARENT_SKU" +
                                ", EXPOSURE" +
                                ", PRIORITY" +
                                ", QTY_RELATED" +
                                ", LOADED_LAST_UPDATED" +
                                ", QTY_SOLD" +
                                ", QTY_CONSIGNED" +
                                ", QTY_COLLECTED" +
                                ", QTY_TRANSFERED) VALUES(";
                            sql += "'" +
                                skuDetalle.SKU_CODE +
                                "', '" +
                                skuDetalle.DESCRIPTION_SKU +
                                "', 0, '...', " +
                                skuDetalle.REQUERIES_SERIE +
                                ", 0, 0, '" +
                                gDefaultWhs +
                                "', 0, '" +
                                skuDetalle.SKU_CODE +
                                "', 1, 0, 0,DATETIME(),0,0,0,0 )";

                            console.log(sql);
                            transExist.executeSql(sql);

                            if (skuDetalle.REQUERIES_SERIE === 1) {
                                for (var j = 0; j < skuDetalle.SERIES.length; j++) {
                                    sql = "INSERT INTO SKU_SERIES (SKU" +
                                        ", SERIE" +
                                        ", STATUS" +
                                        ", LOADED_LAST_UPDATED) VALUES('" +
                                        skuDetalle.SKU_CODE +
                                        "', '" +
                                        skuDetalle.SERIES[j] +
                                        "',0,DATETIME())";
                                    console.log(sql);
                                    transExist.executeSql(sql);
                                }
                                return _this
                                    .ValidarExistenciaDeSkuEnElMovil(listaSkusEnTransferencia,
                                        (indice + 1),
                                        callBack,
                                        errorCallBack,
                                        (listaSkusEnTransferencia.length) === (indice + 1));
                            } else {
                                return _this
                                    .ValidarExistenciaDeSkuEnElMovil(listaSkusEnTransferencia,
                                        (indice + 1),
                                        callBack,
                                        errorCallBack,
                                        (listaSkusEnTransferencia.length) === (indice + 1));
                            }

                        }
                    },
                    function (transExist, errorExist) {
                        if (errorExist.code !== 0) {
                            errorCallBack(errorExist.message);
                        }
                    });
            },
                function (error) {
                    errorCallBack(error.message);
                });
        } else {
            callBack();
        }
    }
    return TransferenciaDetalleControlador;
}
());

TransferenciaDetalleControlador.prototype.ValidarListasDePreciosFueraDeRuta = function ()
    {/*
        var _this = this;        
        socketIo.on("PriceListOusideRoute",listaPreciosFueraDeRuta, function (data)
        {
            switch (data.option) {
                case "success":*/
                    for (var j = 0; j < listaPreciosFueraDeRuta.length; j++) 
                    {
                        addPriceListBySckuPackScale(listaPreciosFueraDeRuta[j]);
                    }
       /*             break;
                case "fail": 
                notify(data.message);
                break; 
            }
        }); */
    }