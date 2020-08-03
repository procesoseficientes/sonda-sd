var ListaSkuControlador = (function () {
    function ListaSkuControlador(mensajero) {
        this.mensajero = mensajero;
        this.skuServicio = new SkuServicio();
        this.decimalesServicio = new ManejoDeDecimalesServicio();
        this.descuentoServicio = new DescuentoServicio();
        this.tareaServicio = new TareaServcio();
        this.razonServicio = new RazonServicio();
        this.consultaDeInventarioPorZonaControlador = new ConsultaDeInventarioPorZonaControlador();
        this.listaSkuQueNoSeModifica = [];
        this.listaSkuOriginal = [];
        this.listaSku = [];
        this.permiterRegregarPantallaAnterior = true;
        this.promoServicio = new PromoServicio();
        this.pivotLimit = 25;
        this.currentLimit = 0;
        this.lastLowLimit = 0;
        this.esPrimeraVez = true;
        this.listaDeSkuOrdenDeVenta = [];
        this.listaDeDescuentoPorMontoGeneralYFamilia = [];
        this.listaDeDescuentoPorFamiliaYTipoPago = [];
        this.tokenAgregarOQuitarDeListaSkuMensaje = mensajero.subscribe(this.agregarOQuitarDeListaSkuMensajeEntregado, getType(AgregarOQuitarDeListaSkuMensaje), this);
        this.tokenListaSku = mensajero.subscribe(this.listaSkuEntregado, getType(ListaSkuMensaje), this);
    }
    ListaSkuControlador.prototype.delegadoListaSkuControlador = function () {
        var _this = this;
        var este = this;
        $(document).on("pagebeforechange", function (event, data) {
            if (data.toPage === "skus_list_page") {
                este.cliente = data.options.data.cliente;
                este.tarea = data.options.data.tarea;
                este.configuracionDecimales = data.options.data.configuracionDecimales;
                este.esPrimeraVez = data.options.data.esPrimeraVez;
                este.listaDeSkuOrdenDeVenta = data.options.data.listaDeSkuOrdenDeVenta;
                este.obtenerDescuentosPorMontoYFamiliaYTipoPago(function () {
                    if (este.esPrimeraVez) {
                        este.publicarEsPrimeraVez(este);
                    }
                    $.mobile.changePage("#skus_list_page");
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }
            if (data.toPage === "pos_skus_page") {
                este.cliente = data.options.data.cliente;
                este.tarea = data.options.data.tarea;
                este.configuracionDecimales = data.options.data.configuracionDecimales;
                este.obtenerDescuentosPorMontoYFamiliaYTipoPago(function () {
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }
        });
        $("#skus_list_page").on("pageshow", function () {
            var criterioDeBusquedaSku = $("#uiTxtFilterListSkusPage");
            criterioDeBusquedaSku.val("");
            criterioDeBusquedaSku.trigger("click");
            criterioDeBusquedaSku.focus();
            criterioDeBusquedaSku = null;
            if (este.configuracionDecimales == undefined || este.configuracionDecimales == null || !este.configuracionDecimales) {
                _this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
                    este.configuracionDecimales = decimales;
                    este.obtenerDescuentosPorMontoYFamiliaYTipoPago(function () {
                        este.cargarPantalla(este);
                    }, function (resultado) {
                        notify(resultado.mensaje);
                    });
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }
            else {
                este.obtenerDescuentosPorMontoYFamiliaYTipoPago(function () {
                    este.cargarPantalla(este);
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }
        });
        document.addEventListener("backbutton", function () {
            este.volverAPantallaAnterior();
            return false;
        }, true);
        $("#skus_list_page").on("click", "#skus_listview_panel li", function (event) {
            var id = event.currentTarget.attributes["id"].nodeValue;
            _this.usuarioSeleccionoSku(id);
        });
        $("#UiBotonAgruparListaSku").bind("touchstart", function () {
            _this.usuarioDeseaAgruparListaSku();
        });
        $("#uiBtnIrAPaginaAnteriorDeSkus").on("click", function () {
            if (_this.lastLowLimit !== 0) {
                _this.cargarListaSku(_this.listaSku.slice(_this.lastLowLimit - _this.pivotLimit, _this.lastLowLimit), _this.configuracionDecimales);
                _this.currentLimit = _this.lastLowLimit;
                _this.lastLowLimit = _this.lastLowLimit - _this.pivotLimit;
            }
        });
        $("#uiBtnIrAPaginaSiguienteDeSkus").on("click", function () {
            if (_this.currentLimit <= _this.listaSku.length) {
                _this.cargarListaSku(_this.listaSku.slice(_this.currentLimit, _this.currentLimit + _this.pivotLimit), _this.configuracionDecimales);
                _this.lastLowLimit = _this.currentLimit;
                _this.currentLimit = _this.currentLimit + _this.pivotLimit;
            }
        });
        $("#uiBtnFilterListSkus").on("click", function () {
            var codigoSku = $("#uiTxtFilterListSkusPage");
            var skusFiltrados = este.listaSkuOriginal.filter(function (skuFiltered) {
                var n = skuFiltered.sku.toUpperCase().includes(codigoSku.val().toUpperCase());
                var m = skuFiltered.skuDescription.toUpperCase().includes(codigoSku.val().toUpperCase());
                if (n || m) {
                    return true;
                }
                else {
                    return false;
                }
            });
            console.log(skusFiltrados.length);
            _this.listaSku = skusFiltrados;
            _this.cargarListaSku(skusFiltrados.slice(0, _this.pivotLimit), _this.configuracionDecimales);
            _this.lastLowLimit = 0;
            _this.currentLimit = _this.pivotLimit;
        });
        $(document).on("click", "#form-search-skus .ui-input-clear", function () {
            _this.listaSku = _this.listaSkuOriginal;
            _this.cargarListaSku(_this.listaSku.slice(0, _this.pivotLimit), _this.configuracionDecimales);
            _this.lastLowLimit = 0;
            _this.currentLimit = _this.pivotLimit;
        });
        $("#uiTxtFilterListSkusPage").on("keypress", function (e) {
            if (e.keyCode === 13 || e.keyCode === 9) {
                e.preventDefault();
                if (e.target.value === "") {
                    notify("Debe proporcionar un criterio de busqueda, por favor verifique y vuelva a intentar.");
                }
                else {
                    var skusFiltrados = _this.listaSkuOriginal.filter(function (skuFiltered) {
                        var n = skuFiltered.sku.toUpperCase().includes(e.target.value.toUpperCase());
                        var m = skuFiltered.skuDescription.toUpperCase().includes(e.target.value.toUpperCase());
                        if (n || m) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    });
                    console.log(skusFiltrados.length);
                    _this.listaSku = skusFiltrados;
                    _this.cargarListaSku(skusFiltrados.slice(0, _this.pivotLimit), _this.configuracionDecimales);
                    _this.lastLowLimit = 0;
                    _this.currentLimit = _this.pivotLimit;
                }
            }
            else if (e.keyCode === 8 && e.target.value === "") {
                e.preventDefault();
                _this.listaSku = _this.listaSkuOriginal;
                _this.cargarListaSku(_this.listaSku.slice(0, _this.pivotLimit), _this.configuracionDecimales);
                _this.lastLowLimit = 0;
                _this.currentLimit = _this.pivotLimit;
            }
            else {
                return true;
            }
        });
        $("#UiBotonOrdenarLisadoDeSkus").on("click", function () {
            este.usuarioDeseaCambiarElOrdenDelListado();
        });
    };
    ListaSkuControlador.prototype.listaSkuEntregado = function (mensaje, subcriber) {
        subcriber.listaDeSkuOrdenDeVenta.map(function (skuFiltrado) {
            if (skuFiltrado.sku === mensaje.listaSku[0].sku) {
                skuFiltrado.deleted = true;
                var resultadoDeBusqueda = mensaje.listaSku.filter(function (sku) {
                    return sku.codePackUnit === skuFiltrado.codePackUnit;
                });
                if (resultadoDeBusqueda && resultadoDeBusqueda.length > 0) {
                    if (resultadoDeBusqueda[0].qty > 0 && !(isNaN(resultadoDeBusqueda[0].qty))) {
                        skuFiltrado.qty = trunc_number(resultadoDeBusqueda[0].qty, subcriber.configuracionDecimales.defaultCalculationsDecimals);
                        skuFiltrado.total = trunc_number((resultadoDeBusqueda[0].qty * resultadoDeBusqueda[0].cost), subcriber.configuracionDecimales.defaultCalculationsDecimals);
                        skuFiltrado.appliedDiscount = resultadoDeBusqueda[0].appliedDiscount;
                        skuFiltrado.discount = resultadoDeBusqueda[0].discount;
                        skuFiltrado.discountType = resultadoDeBusqueda[0].discountType;
                        skuFiltrado.cost = resultadoDeBusqueda[0].cost;
                        skuFiltrado.listPromo = resultadoDeBusqueda[0].listPromo;
                        skuFiltrado.deleted = false;
                    }
                }
                resultadoDeBusqueda = null;
            }
        });
        mensaje.listaSku.map(function (skuFiltrado) {
            var seAgregarSku = true;
            for (var _i = 0, _a = subcriber.listaDeSkuOrdenDeVenta; _i < _a.length; _i++) {
                var sku = _a[_i];
                if (sku.sku === skuFiltrado.sku && sku.codePackUnit === skuFiltrado.codePackUnit) {
                    seAgregarSku = false;
                }
            }
            if (seAgregarSku) {
                subcriber.listaDeSkuOrdenDeVenta.push(skuFiltrado);
            }
        });
    };
    ListaSkuControlador.prototype.limpiarListaDeSku = function (callback, errCallback) {
        try {
            var skulist = $("#skus_listview_panel");
            skulist.children().remove("li");
            skulist = null;
            this.listaSkuQueNoSeModifica = null;
            callback();
        }
        catch (err) {
            errCallback({ codigo: -1, mensaje: "Error al limpiar el listado de sku " + err.mensaje });
        }
    };
    ListaSkuControlador.prototype.usuarioDeseaAgruparListaSku = function () {
        var _this = this;
        this.skuServicio.obtenerFamiliaSku(function (familiaSku) {
            var listaDeFamiliaSku = [];
            listaDeFamiliaSku.push({
                text: "Todos",
                value: "ALL"
            });
            for (var i = 0; i < familiaSku.rows.length; i++) {
                listaDeFamiliaSku.push({
                    text: familiaSku.rows.item(i).DESCRIPTION_FAMILY_SKU,
                    value: familiaSku.rows.item(i).CODE_FAMILY_SKU
                });
            }
            var configoptions = {
                title: "Listado de productos",
                items: listaDeFamiliaSku,
                doneButtonLabel: "Ok",
                cancelButtonLabel: "Cancelar"
            };
            ShowListPicker(configoptions, function (item) {
                var prevCodeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", item);
                _this.obtenerListaSku(function (operacion) {
                    if (operacion.resultado === ResultadoOperacionTipo.Error) {
                        notify(operacion.mensaje);
                        localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", prevCodeFamilySku);
                    }
                });
            });
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    ListaSkuControlador.prototype.obtenerListaSku = function (callback) {
        var _this = this;
        try {
            var sku = new Sku();
            if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
            }
            sku.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
            this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
                if (_this.tarea.taskType === TareaTipo.Venta) {
                    _this.skuServicio.obtenerSkuParaVenta(_this.cliente, sku, decimales, function (listaSku) {
                        _this.cargarListaSku(listaSku, decimales);
                    }, callback);
                }
                else if (_this.tarea.taskType === TareaTipo.Preventa) {
                    _this.skuServicio.obtenerSkuParaPreVenta(_this.cliente, sku, decimales, localStorage.getItem("SORT_BY"), localStorage.getItem("SORT_OPTION"), function (listaSku) {
                        _this.listaSkuOriginal = listaSku;
                        _this.listaSku = listaSku;
                        _this.lastLowLimit = 0;
                        _this.currentLimit = _this.pivotLimit;
                        _this.cargarListaSku(listaSku, decimales);
                    }, callback);
                }
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        catch (err) {
            notify(err.mensaje);
        }
    };
    ListaSkuControlador.prototype.cargarListaSku = function (listaSku, decimales) {
        var _this = this;
        try {
            my_dialog('Sonda® ' + SondaVersion, "Cargando Sku...", "open");
            this.obtenerDescuentos(function () {
                var skulist = $("#skus_listview_panel");
                skulist.listview();
                skulist.children().remove("li");
                if (listaSku.length >= 1) {
                    var li = "";
                    for (var i = 0; i < listaSku.length; i++) {
                        var sku = listaSku[i];
                        li += _this.obtnerLiParaListaSku(sku, decimales);
                    }
                    skulist.append(li);
                    skulist.listview("refresh");
                }
                else {
                    notify("No se encontraron Sku para preventa.");
                }
                skulist = null;
                my_dialog("", "", "close");
            });
        }
        catch (err) {
            notify(err.message);
        }
    };
    ListaSkuControlador.prototype.obtnerLiParaListaSku = function (sku, decimales) {
        var li;
        li = "<li data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'";
        li += " id='lstSku" + sku.sku.replace(" ", "_") + "'>";
        li += " <a href='#'";
        li += " <p>";
        li += " <span style='background-color: #005599; border-radius: 4px; color: #ffffff; padding: 3px; ";
        li += " text-shadow: none; font-size:13px' > " + format_number(sku.onHand, decimales.defaultDisplayDecimals) + "</span>&nbsp";
        li += " <span style='font-size:12px;'>" + sku.sku + "</span>";
        li += " </p><p> <span style='font-size:12px;'>" + sku.skuName + "</span>";
        li += " </p>";
        li += " <p>";
        li += " <span class='ui-li-count'> " + DarFormatoAlMonto(format_number(sku.cost, decimales.defaultDisplayDecimals)) + "</span>";
        if (sku.codeFamilySku !== null && sku.codeFamilySku !== "") {
            li += "<span class='small-roboto'>Cod. Fam. SKU: " + sku.codeFamilySku + "</span>";
        }
        if (sku.discount !== 0) {
            li += "<span class='small-roboto'> Descuento: " + sku.discount + "%</span>";
        }
        if (this.tarea.taskType === TareaTipo.Preventa) {
            li += "</p>";
            li += "<p>";
            li += "<span class=\"small-roboto\"> Reservados:" + format_number(sku.isComited, decimales.defaultDisplayDecimals) + "</span>";
            li += "<span class=\"small-roboto\"> Diferencia: " + format_number(sku.difference, decimales.defaultDisplayDecimals) + "</span>";
        }
        if (sku.lastQtySold > 0) {
            li += "<span class='small-roboto'> Ult. Pedido: " + format_number(sku.lastQtySold, decimales.defaultDisplayDecimals) + "</span>";
        }
        li += "</p>";
        li += "</a>";
        li += "</li>";
        return li;
    };
    ListaSkuControlador.prototype.publicarSku = function (sku) {
        var msg = new SkuMensaje(this);
        msg.sku = sku;
        this.mensajero.publish(msg, getType(SkuMensaje));
    };
    ListaSkuControlador.prototype.usuarioSeleccionoSku = function (idSku) {
        var _this = this;
        for (var i = 0; i < _this.listaSku.length; i++) {
            var sku = _this.listaSku[i];
            if (sku.sku === idSku.replace("_", " ").substr(6)) {
                sku.qty = 1;
                _this.tarea.salesOrderTotal = this.obtenerTotalParaEnviar(this.listaDeSkuOrdenDeVenta, sku.codeFamilySku);
                $.mobile.changePage("skucant_page", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false,
                    data: {
                        "cliente": _this.cliente,
                        "tarea": _this.tarea,
                        "configuracionDecimales": _this.configuracionDecimales,
                        "sku": sku,
                        "estaAgregando": true,
                        "listaDeSkuParaBonificacion": new Array(),
                        "listaSku": new Array(),
                        "listaDeSkuOrdenDeVenta": this.listaDeSkuOrdenDeVenta
                    }
                });
                break;
            }
        }
    };
    ListaSkuControlador.prototype.cargarPorPrimeraVezListaSkuMensajeEntregado = function (subcriber, callBack, errorCallBack) {
        try {
            var sku = new Sku();
            if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
            }
            sku.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
            if (subcriber.tarea.taskType === TareaTipo.Venta) {
                subcriber.skuServicio.obtenerSkuParaVenta(subcriber.cliente, sku, subcriber.configuracionDecimales, function (listaSku) {
                    subcriber.listaSku = listaSku;
                    subcriber.listaSkuOriginal = listaSku;
                    subcriber.listaSkuQueNoSeModifica = JSON.parse(JSON.stringify(listaSku));
                    subcriber.cargarListaSku(listaSku.slice(0, subcriber.pivotLimit), subcriber.configuracionDecimales);
                    subcriber.lastLowLimit = 0;
                    subcriber.currentLimit = subcriber.pivotLimit;
                    callBack();
                }, function (resultado) {
                    errorCallBack(resultado);
                });
            }
            else if (subcriber.tarea.taskType === TareaTipo.Preventa) {
                subcriber.skuServicio.obtenerSkuParaPreVenta(subcriber.cliente, sku, subcriber.configuracionDecimales, localStorage.getItem("SORT_BY"), localStorage.getItem("SORT_OPTION"), function (listaSku) {
                    subcriber.listaSku = listaSku;
                    subcriber.listaSkuOriginal = listaSku;
                    subcriber.listaSkuQueNoSeModifica = JSON.parse(JSON.stringify(listaSku));
                    subcriber.cargarListaSku(listaSku.slice(0, subcriber.pivotLimit), subcriber.configuracionDecimales);
                    subcriber.lastLowLimit = 0;
                    subcriber.currentLimit = subcriber.pivotLimit;
                    callBack();
                }, function (resultado) {
                    errorCallBack(resultado);
                });
            }
        }
        catch (ex) {
            errorCallBack({ "codigo": -1, "resultado": ResultadoOperacionTipo.Error, "mensaje": ex.message });
        }
    };
    ListaSkuControlador.prototype.agregarOQuitarDeListaSkuMensajeEntregado = function (mensaje, subcriber) {
        if (!mensaje.agregarSku && !mensaje.quitarSku) {
            return;
        }
        var sku = new Sku();
        var entroSku = false;
        if (mensaje.agregarSku) {
            for (var i = 0; i < subcriber.listaSkuQueNoSeModifica.length; i++) {
                var skuTemp = subcriber.listaSkuQueNoSeModifica[i];
                if (skuTemp.sku === mensaje.listaSku[0].sku) {
                    sku = skuTemp;
                    entroSku = true;
                    break;
                }
            }
        }
        else {
            for (var i = 0; i < subcriber.listaSkuOriginal.length; i++) {
                var skuTemp = subcriber.listaSkuOriginal[i];
                if (skuTemp.sku === mensaje.listaSku[0].sku) {
                    sku = skuTemp;
                    entroSku = true;
                    break;
                }
            }
        }
        if (!entroSku) {
            return;
        }
        if (mensaje.agregarSku) {
            var skulist = $("#skus_listview_panel");
            var li = subcriber.obtnerLiParaListaSku(sku, subcriber.configuracionDecimales);
            subcriber.listaSkuOriginal.push(sku);
            skulist.append(li);
            skulist.listview("refresh");
        }
        else if (mensaje.quitarSku) {
            var uiTarea = $("#lstSku" + sku.sku.replace(" ", "_"));
            uiTarea.closest("li").remove();
            uiTarea = null;
            var indice = subcriber.listaSkuOriginal.indexOf(sku);
            subcriber.listaSkuOriginal.splice(indice, 1);
        }
        subcriber.cargarPorPrimeraVezListaSkuMensajeEntregado(subcriber, function () {
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    ListaSkuControlador.prototype.obtenerDescuentos = function (callback) {
        var _this = this;
        this.descuentoServicio.obtenerDescuentosPorCliente(this.cliente, function (listaDeDescuento) {
            for (var i = 0; i < _this.listaSku.length; i++) {
                var sku = _this.listaSku[i];
                for (var j = 0; j < listaDeDescuento.length; j++) {
                    var descuento = listaDeDescuento[j];
                    if (sku.sku === descuento.codeSku) {
                        sku.discount = descuento.discount;
                        break;
                    }
                }
            }
            callback();
        }, function (resultado) {
            callback();
            notify("Error al obtener los descuentos: " + resultado.mensaje);
        });
    };
    ListaSkuControlador.prototype.obtenerDescuentoPorMontoGeneral = function (total, callback) {
        var _this = this;
        try {
            this.descuentoServicio.obtenerDescuentoPorMontoGeneral(this.cliente, total, function (descuentoPorMontoGeneral) {
                _this.obtenerHistoricodePromo(function (listaHistoricoDePromos) {
                    var resultadoDePromoHistorico = listaHistoricoDePromos.find(function (promo) {
                        return promo.promoId === descuentoPorMontoGeneral.promoId;
                    });
                    if (resultadoDePromoHistorico) {
                        var promoDeBonificacion = new Promo();
                        promoDeBonificacion.promoId = descuentoPorMontoGeneral.promoId;
                        promoDeBonificacion.promoName = descuentoPorMontoGeneral.promoName;
                        promoDeBonificacion.frequency = descuentoPorMontoGeneral.frequency;
                        _this.promoServicio.validarSiAplicaPromo(promoDeBonificacion, resultadoDePromoHistorico, function (aplicaPromo) {
                            if (aplicaPromo) {
                                _this.descuentoPorMontoGeneral = descuentoPorMontoGeneral;
                            }
                            else {
                                _this.descuentoPorMontoGeneral = new DescuentoPorMontoGeneral();
                            }
                            callback();
                        }, function (resultado) {
                            notify(resultado.mensaje);
                        });
                    }
                    else {
                        _this.descuentoPorMontoGeneral = descuentoPorMontoGeneral;
                        callback();
                    }
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        catch (ex) {
            notify("Error al obtener el descuento por monto general: " + ex.message);
        }
    };
    ListaSkuControlador.prototype.volverAPantallaAnterior = function () {
        var _this = this;
        switch ($.mobile.activePage[0].id) {
            case "skus_list_page":
                this.limpiarListaDeSku(function () {
                    $.mobile.changePage("pos_skus_page", {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false,
                        data: {
                            "cliente": _this.cliente,
                            "tarea": _this.tarea,
                            "configuracionDecimales": _this.configuracionDecimales,
                            "esPrimeraVez": _this.esPrimeraVez
                        }
                    });
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
                break;
        }
    };
    ListaSkuControlador.prototype.validarReglaDeTomarFotoAlInicio = function (callback) {
        try {
            if (this.cliente.fotoDeInicioDeVisita === undefined || this.cliente.fotoDeInicioDeVisita === "") {
                this.tareaServicio.obtenerRegla("TomarFotoAlInicio", function (listaDeReglas) {
                    if (listaDeReglas.length > 0 && listaDeReglas[0].enabled.toUpperCase() === 'SI') {
                        TomarFoto(function (fotografia) {
                            callback(fotografia, true);
                        }, function (resultado) {
                            callback("", true);
                        });
                    }
                    else {
                        callback("", false);
                    }
                }, function (resultado) {
                    notify(resultado.mensaje);
                    my_dialog("", "", "closed");
                });
            }
            else {
                callback("", false);
            }
        }
        catch (ex) {
            notify("Error al validar la regla tomar foto al inicio: " + ex.message);
        }
    };
    ListaSkuControlador.prototype.establecerFotoInicio = function (fotografia) {
        this.cliente.fotoDeInicioDeVisita = fotografia;
    };
    ListaSkuControlador.prototype.finalizarTareaSinGestion = function (errorCallback) {
        var _this = this;
        try {
            navigator.notification.confirm("Desea finalizar la tarea sin gestion?", function (buttonIndex) {
                if (buttonIndex === 2) {
                    my_dialog("", "", "close");
                    var tipoDeRazon = "";
                    switch (_this.tarea.taskType) {
                        case TipoTarea.Preventa.toString():
                            tipoDeRazon = TipoDeRazon.OrdenDeVenta.toString();
                            break;
                    }
                    _this.razonServicio.obtenerRazones(tipoDeRazon, function (razones) {
                        var listadoDeRazones = [];
                        for (var i = 0; i < razones.length; i++) {
                            listadoDeRazones.push({
                                text: razones[i].reasonValue,
                                value: razones[i].reasonValue
                            });
                        }
                        var config = {
                            title: "Razones",
                            items: listadoDeRazones,
                            doneButtonLabel: "Ok",
                            cancelButtonLabel: "Cancelar"
                        };
                        ListPicker(config, function (item) {
                            ObtenerPosicionGPS(function () {
                                _this.tarea.completedSuccessfully = false;
                                _this.tarea.reason = item;
                                _this.tarea.taskStatus = TareaEstado.Completada;
                                _this.tareaServicio.actualizarTareaEstado(_this.tarea, function () {
                                    actualizarListadoDeTareas(_this.tarea.taskId, _this.tarea.taskType, TareaEstado.Completada, _this.cliente.clientId, _this.cliente.clientName, _this.cliente.address, 0, TareaEstado.Aceptada, _this.cliente.rgaCode);
                                    $.mobile.changePage("#pickupplan_page", {
                                        transition: "flow",
                                        reverse: true,
                                        changeHash: false,
                                        showLoadMsg: false
                                    });
                                    EnviarData();
                                }, function (resultado) {
                                    notify("Error al actualizar la tarea: " + resultado.mensaje);
                                });
                            });
                        }, function () {
                            errorCallback();
                        });
                    }, function (resultado) {
                        notify("Error al obtener las razones: " + resultado.mensaje);
                    });
                }
                else {
                    errorCallback();
                }
            }, "Sonda® " + SondaVersion, 'No,Si');
        }
        catch (err) {
            notify("Error al obtener razones: " + err.message);
        }
    };
    ListaSkuControlador.prototype.validarFotoYTareaSinGestion = function () {
        var _this = this;
        this.validarReglaDeTomarFotoAlInicio(function (fotografia, validarFotografia) {
            if (validarFotografia) {
                _this.permiterRegregarPantallaAnterior = false;
                if (fotografia === "") {
                    _this.finalizarTareaSinGestion(function () {
                        _this.validarFotoYTareaSinGestion();
                    });
                    return;
                }
                else {
                    _this.establecerFotoInicio(fotografia);
                }
            }
            else {
                _this.permiterRegregarPantallaAnterior = true;
            }
        });
    };
    ListaSkuControlador.prototype.usuarioDeseaCambiarElOrdenDelListado = function () {
        var _this = this;
        var listaDeOpcionesDeOrdenamiento = [];
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.CodigoDeProducto.toString(),
            value: OpcionDeOrdenDelListadoDeSku.CodigoDeProducto.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.NombreDeProducto.toString(),
            value: OpcionDeOrdenDelListadoDeSku.NombreDeProducto.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.UltimaCompra.toString(),
            value: OpcionDeOrdenDelListadoDeSku.UltimaCompra.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.Precio.toString(),
            value: OpcionDeOrdenDelListadoDeSku.Precio.toString()
        });
        var configuracionDeOpcionesDeOrdenamiento = {
            title: "Ordenar por",
            items: listaDeOpcionesDeOrdenamiento,
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };
        ShowListPicker(configuracionDeOpcionesDeOrdenamiento, function (item) {
            _this.preguntarTipoDeOrden(item.toString());
        });
    };
    ListaSkuControlador.prototype.preguntarTipoDeOrden = function (opcionDeOrdenamiento) {
        var _this = this;
        var listaDeTipoDeOrdenamiento = [];
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Ascendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Ascendente.toString()
        });
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Descendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Descendente.toString()
        });
        var configuracionDeOpcionesDeOrdenamiento = {
            title: "Tipo de Orden",
            items: listaDeTipoDeOrdenamiento,
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };
        ShowListPicker(configuracionDeOpcionesDeOrdenamiento, function (item) {
            _this.recargarListaDeSkuPorOrden(opcionDeOrdenamiento, item.toString());
        });
    };
    ListaSkuControlador.prototype.recargarListaDeSkuPorOrden = function (opcionDeOrdenamiento, tipoDeOrdenamiento) {
        var _this = this;
        try {
            var sku = new Sku();
            if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
            }
            sku.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
            this.skuServicio.obtenerSkuParaPreVenta(this.cliente, sku, this.configuracionDecimales, opcionDeOrdenamiento, tipoDeOrdenamiento, function (listaSku) {
                _this.listaSku = listaSku;
                _this.listaSkuOriginal = listaSku;
                _this.listaSkuQueNoSeModifica = JSON.parse(JSON.stringify(listaSku));
                _this.cargarListaSku(listaSku.slice(0, _this.pivotLimit), _this.configuracionDecimales);
                _this.lastLowLimit = 0;
                _this.currentLimit = _this.pivotLimit;
                localStorage.setItem('SORT_BY', opcionDeOrdenamiento);
                localStorage.setItem('SORT_OPTION', tipoDeOrdenamiento);
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        catch (e) {
            notify("Error al regarcar el listado de productos: " + e.mensaje);
        }
    };
    ListaSkuControlador.prototype.cargarPantalla = function (_this) {
        if (!_this.cliente.fotoDeInicioDeVisita || _this.cliente.fotoDeInicioDeVisita === undefined || _this.cliente.fotoDeInicioDeVisita === "" || _this.cliente.fotoDeInicioDeVisita === null) {
            _this.validarFotoYTareaSinGestion();
        }
        var lblTotal = $("#UiTotalListadoSkus");
        _this.tarea.salesOrderTotal = this.obtenerTotalParaEnviar(this.listaDeSkuOrdenDeVenta, "");
        if (_this.tarea.salesOrderTotal > 0) {
            if (_this.tarea.salesOrderTotal >= _this.tarea.discountPerGeneralAmountLowLimit &&
                _this.tarea.discountPerGeneralAmountHighLimit >= _this.tarea.salesOrderTotal) {
                lblTotal
                    .text(DarFormatoAlMonto(format_number((_this.tarea.salesOrderTotal -
                    (_this.tarea.salesOrderTotal * (_this.cliente.appliedDiscount / 100))), _this.configuracionDecimales.defaultDisplayDecimals)));
            }
            else {
                _this.obtenerDescuentoPorMontoGeneral(_this.tarea.salesOrderTotal, function () {
                    if (_this.descuentoPorMontoGeneral.apply) {
                        if (_this.seAplicaElDescuentoModificado(_this.cliente.discount, _this.cliente.appliedDiscount, _this.descuentoPorMontoGeneral.discount)) {
                            lblTotal
                                .text(DarFormatoAlMonto(format_number((_this.tarea.salesOrderTotal -
                                (_this.tarea.salesOrderTotal * (_this.cliente.appliedDiscount / 100))), _this.configuracionDecimales.defaultDisplayDecimals)));
                        }
                        else {
                            lblTotal
                                .text(DarFormatoAlMonto(format_number((_this.tarea.salesOrderTotal -
                                (_this.tarea
                                    .salesOrderTotal *
                                    (_this.descuentoPorMontoGeneral.discount / 100))), _this.configuracionDecimales.defaultDisplayDecimals)));
                        }
                        lblTotal = null;
                    }
                    else {
                        lblTotal
                            .text(DarFormatoAlMonto(format_number(_this.tarea.salesOrderTotal, _this.configuracionDecimales.defaultDisplayDecimals)));
                    }
                });
            }
        }
        else {
            lblTotal.text(DarFormatoAlMonto(format_number(0, _this.configuracionDecimales.defaultDisplayDecimals)));
            lblTotal = null;
        }
        this.cargarPorPrimeraVezListaSkuMensajeEntregado(this, function () {
            my_dialog("", "", "close");
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    ListaSkuControlador.prototype.publicarEsPrimeraVez = function (_this) {
        try {
            var msg = new ListaSkuMensaje(this);
            msg.listaSku = [];
            _this.mensajero.publish(msg, getType(ListaSkuMensaje));
            _this.esPrimeraVez = false;
        }
        catch (e) {
            _this.esPrimeraVez = true;
            notify("Error al limpiar listado: " + e.message);
        }
    };
    ListaSkuControlador.prototype.obtenerDescuentosPorMontoYFamiliaYTipoPago = function (callback, errCallback) {
        var _this = this;
        try {
            this.descuentoServicio.obtenerListaDeDescuentoPorMontoGeneralYFamilia(this.cliente, function (listaDeDescuentoPorMontoGeneralYFamilia) {
                _this.obtenerHistoricodePromo(function (listaHistoricoDePromos) {
                    _this.validarSiAplicaElDescuentoPorMontoGeneralYFamilia(listaDeDescuentoPorMontoGeneralYFamilia, 0, listaHistoricoDePromos, function (listaDeDescuentoPorMontoGeneralYFamilia) {
                        _this.descuentoServicio.obtenerDescuentoPorFamiliaYTipoPago(_this.cliente, _this.tarea, function (listaDeDescuentoPorFamiliaYTipoPago) {
                            _this.validarSiAplicaElDescuentoPorFamiliaYTipoPago(listaDeDescuentoPorFamiliaYTipoPago, 0, listaHistoricoDePromos, function (listaDeDescuentoPorFamiliaYTipoPago) {
                                _this.listaDeDescuentoPorFamiliaYTipoPago = listaDeDescuentoPorFamiliaYTipoPago;
                                if (listaDeDescuentoPorMontoGeneralYFamilia.length > 0) {
                                    var listaDeSku_1 = [];
                                    _this.listaDeSkuOrdenDeVenta.forEach(function (skuOrden) {
                                        var total = 0;
                                        if (skuOrden.discount !== 0) {
                                            switch (skuOrden.discountType) {
                                                case TiposDeDescuento.Porcentaje.toString():
                                                    total = trunc_number((skuOrden.total - ((skuOrden.appliedDiscount * skuOrden.total) / 100)), _this.configuracionDecimales.defaultCalculationsDecimals);
                                                    break;
                                                case TiposDeDescuento.Monetario.toString():
                                                    total = trunc_number(skuOrden.total - skuOrden.appliedDiscount, _this.configuracionDecimales.defaultCalculationsDecimals);
                                                    break;
                                            }
                                        }
                                        else {
                                            total += trunc_number(skuOrden.total, _this.configuracionDecimales.defaultCalculationsDecimals);
                                        }
                                        var resultadoSku = listaDeSku_1.find(function (sku) {
                                            return (skuOrden.codeFamilySku === sku.codeFamilySku);
                                        });
                                        if (resultadoSku) {
                                            resultadoSku.total += trunc_number(total, _this.configuracionDecimales.defaultCalculationsDecimals);
                                        }
                                        else {
                                            var skuAAgregar = new Sku();
                                            skuAAgregar.codeFamilySku = skuOrden.codeFamilySku;
                                            skuAAgregar.total = trunc_number(total, _this.configuracionDecimales.defaultCalculationsDecimals);
                                            listaDeSku_1.push(skuAAgregar);
                                        }
                                    });
                                    var listaDeDescuentoPorMontoGeneralYFamiliaAEstablecer_1 = [];
                                    listaDeSku_1.forEach(function (sku) {
                                        var resultadoDescuento = listaDeDescuentoPorMontoGeneralYFamilia.find(function (descuento) {
                                            return (sku.codeFamilySku === descuento.codeFamily) && (descuento.lowAmount <= sku.total && sku.total <= descuento.highAmount);
                                        });
                                        if (resultadoDescuento) {
                                            listaDeDescuentoPorMontoGeneralYFamiliaAEstablecer_1.push(resultadoDescuento);
                                        }
                                    });
                                    _this.listaDeDescuentoPorMontoGeneralYFamilia = listaDeDescuentoPorMontoGeneralYFamiliaAEstablecer_1;
                                    callback();
                                }
                                else {
                                    callback();
                                }
                            }, function (resultado) {
                                errCallback(resultado);
                            });
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                    }, function (resultado) {
                        errCallback(resultado);
                    });
                }, function (resultado) {
                    errCallback(resultado);
                });
            }, function (resultado) {
                errCallback(resultado);
            });
        }
        catch (ex) {
            errCallback({ codigo: -1, mensaje: "Error al cargar bonificaciones por monto general: " + ex.message });
        }
    };
    ListaSkuControlador.prototype.obtenerHistoricodePromo = function (callBack, errCallback) {
        try {
            this.promoServicio.obtenerHistoricoDePromosParaCliente(this.cliente, function (listaHistoricoDePromos) {
                callBack(listaHistoricoDePromos);
            }, function (resultado) {
                errCallback(resultado);
            });
        }
        catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: "Error al obtener historico de promociones: " + ex.message
            });
        }
    };
    ListaSkuControlador.prototype.seAplicaElDescuentoModificado = function (descuentoOriginalDeModificacion, descuentoModificado, descuentoNuevo) {
        return (descuentoOriginalDeModificacion !== 0 && descuentoModificado <= descuentoNuevo);
    };
    ListaSkuControlador.prototype.obtenerTotalParaEnviar = function (listaDeSku, codeFamily) {
        var _this = this;
        var total = 0;
        listaDeSku.map(function (skuParaTotal) {
            var totalPaquete = skuParaTotal.total;
            switch (skuParaTotal.discountType) {
                case TiposDeDescuento.Porcentaje.toString():
                    totalPaquete = (parseFloat(skuParaTotal.discount.toString()) !== 0 ? (skuParaTotal.total - ((parseFloat(skuParaTotal.appliedDiscount.toString()) * skuParaTotal.total) / 100)) : skuParaTotal.total);
                    break;
                case TiposDeDescuento.Monetario.toString():
                    totalPaquete = (parseFloat(skuParaTotal.discount.toString()) !== 0 ? (skuParaTotal.total - (parseFloat(skuParaTotal.appliedDiscount.toString()))) : skuParaTotal.total);
                    break;
            }
            if (codeFamily !== skuParaTotal.codeFamilySku) {
                var resultadoDescuentoPorMontoGeneralYFamilia = _this.listaDeDescuentoPorMontoGeneralYFamilia.find(function (descuentoABuscar) {
                    return descuentoABuscar.codeFamily === skuParaTotal.codeFamilySku;
                });
                if (resultadoDescuentoPorMontoGeneralYFamilia) {
                    switch (resultadoDescuentoPorMontoGeneralYFamilia.discountType) {
                        case TiposDeDescuento.Porcentaje.toString():
                            totalPaquete = (parseFloat(resultadoDescuentoPorMontoGeneralYFamilia.discount.toString()) !== 0 ? (totalPaquete - ((parseFloat(resultadoDescuentoPorMontoGeneralYFamilia.discount.toString()) * totalPaquete) / 100)) : totalPaquete);
                            break;
                        case TiposDeDescuento.Monetario.toString():
                            totalPaquete = (parseFloat(resultadoDescuentoPorMontoGeneralYFamilia.discount.toString()) !== 0 ? (totalPaquete - (parseFloat(resultadoDescuentoPorMontoGeneralYFamilia.discount.toString()))) : totalPaquete);
                            break;
                    }
                }
                var resultadoDescuentoPorFamiliaYTipoPago = _this.listaDeDescuentoPorFamiliaYTipoPago.find(function (descuentoABuscar) {
                    return descuentoABuscar.codeFamily === skuParaTotal.codeFamilySku;
                });
                if (resultadoDescuentoPorFamiliaYTipoPago) {
                    switch (resultadoDescuentoPorFamiliaYTipoPago.discountType) {
                        case TiposDeDescuento.Porcentaje.toString():
                            totalPaquete = (parseFloat(resultadoDescuentoPorFamiliaYTipoPago.discount.toString()) !== 0 ? (totalPaquete - ((parseFloat(resultadoDescuentoPorFamiliaYTipoPago.discount.toString()) * totalPaquete) / 100)) : totalPaquete);
                            break;
                        case TiposDeDescuento.Monetario.toString():
                            totalPaquete = (parseFloat(resultadoDescuentoPorFamiliaYTipoPago.discount.toString()) !== 0 ? (totalPaquete - (parseFloat(resultadoDescuentoPorFamiliaYTipoPago.discount.toString()))) : totalPaquete);
                            break;
                    }
                }
            }
            total += totalPaquete;
            totalPaquete = null;
        });
        return total;
    };
    ListaSkuControlador.prototype.obtenerDescuentosPorMontoYFamilia = function (callback, errCallback) {
        var _this = this;
        try {
            this.descuentoServicio.obtenerListaDeDescuentoPorMontoGeneralYFamilia(this.cliente, function (listaDeDescuentoPorMontoGeneralYFamilia) {
                _this.obtenerHistoricodePromo(function (listaHistoricoDePromos) {
                    _this.validarSiAplicaElDescuentoPorMontoGeneralYFamilia(listaDeDescuentoPorMontoGeneralYFamilia, 0, listaHistoricoDePromos, function (listaDeDescuentoPorMontoGeneralYFamilia) {
                        if (listaDeDescuentoPorMontoGeneralYFamilia.length > 0) {
                            var listaDeSku_2 = [];
                            _this.listaDeSkuOrdenDeVenta.forEach(function (skuOrden) {
                                var total = 0;
                                if (skuOrden.discount !== 0) {
                                    switch (skuOrden.discountType) {
                                        case TiposDeDescuento.Porcentaje.toString():
                                            total = trunc_number((skuOrden.total - ((skuOrden.appliedDiscount * skuOrden.total) / 100)), _this.configuracionDecimales.defaultCalculationsDecimals);
                                            break;
                                        case TiposDeDescuento.Monetario.toString():
                                            total = trunc_number(skuOrden.total - skuOrden.appliedDiscount, _this.configuracionDecimales.defaultCalculationsDecimals);
                                            break;
                                    }
                                }
                                else {
                                    total += trunc_number(skuOrden.total, _this.configuracionDecimales.defaultCalculationsDecimals);
                                }
                                var resultadoSku = listaDeSku_2.find(function (sku) {
                                    return (skuOrden.sku === sku.sku);
                                });
                                if (resultadoSku) {
                                    resultadoSku.total += trunc_number(total, _this.configuracionDecimales.defaultCalculationsDecimals);
                                }
                                else {
                                    var skuAAgregar = new Sku();
                                    skuAAgregar.codeFamilySku = skuOrden.codeFamilySku;
                                    skuAAgregar.total = trunc_number(total, _this.configuracionDecimales.defaultCalculationsDecimals);
                                    listaDeSku_2.push(skuAAgregar);
                                }
                            });
                            var listaDeDescuentoPorMontoGeneralYFamiliaAEstablecer_2 = [];
                            listaDeSku_2.forEach(function (sku) {
                                var resultadoDescuento = listaDeDescuentoPorMontoGeneralYFamilia.find(function (descuento) {
                                    return (sku.codeFamilySku === descuento.codeFamily) && (descuento.lowAmount <= sku.total && sku.total <= descuento.highAmount);
                                });
                                if (resultadoDescuento) {
                                    listaDeDescuentoPorMontoGeneralYFamiliaAEstablecer_2.push(resultadoDescuento);
                                }
                            });
                            _this.listaDeDescuentoPorMontoGeneralYFamilia = listaDeDescuentoPorMontoGeneralYFamiliaAEstablecer_2;
                            callback();
                        }
                        else {
                            callback();
                        }
                    }, function (resultado) {
                        errCallback(resultado);
                    });
                }, function (resultado) {
                    errCallback(resultado);
                });
            }, function (resultado) {
                errCallback(resultado);
            });
        }
        catch (ex) {
            errCallback({ codigo: -1, mensaje: "Error al cargar bonificaciones por monto general: " + ex.message });
        }
    };
    ListaSkuControlador.prototype.validarSiAplicaElDescuentoPorMontoGeneralYFamilia = function (listaDeDescuento, indiceDeListaDeDescuento, listaHistoricoDePromos, callBack, errCallback) {
        var _this = this;
        try {
            if (listaHistoricoDePromos.length > 0) {
                if (this.listaDeDescuentoPorMontoGeneralYFamiliaTerminoDeIterar(listaDeDescuento, indiceDeListaDeDescuento)) {
                    var descuentoAValidar_1 = listaDeDescuento[indiceDeListaDeDescuento];
                    var resultadoDePromoHistorico_1 = listaHistoricoDePromos.find(function (promo) {
                        return promo.promoId === descuentoAValidar_1.promoId;
                    });
                    if (resultadoDePromoHistorico_1) {
                        var promoDeDescuento = new Promo();
                        promoDeDescuento.promoId = descuentoAValidar_1.promoId;
                        promoDeDescuento.promoName = descuentoAValidar_1.promoName;
                        promoDeDescuento.frequency = descuentoAValidar_1.frequency;
                        this.promoServicio.validarSiAplicaPromo(promoDeDescuento, resultadoDePromoHistorico_1, function (aplicaDescuento) {
                            if (!aplicaDescuento) {
                                listaDeDescuento = listaDeDescuento.filter(function (descuento) {
                                    return resultadoDePromoHistorico_1.promoId !== descuento.promoId;
                                });
                            }
                            _this.validarSiAplicaElDescuentoPorMontoGeneralYFamilia(listaDeDescuento, indiceDeListaDeDescuento + (aplicaDescuento ? 1 : 0), listaHistoricoDePromos, function (listaDeDescuento) {
                                callBack(listaDeDescuento);
                            }, function (resultado) {
                                errCallback(resultado);
                            });
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                        promoDeDescuento = null;
                    }
                    else {
                        this.validarSiAplicaElDescuentoPorMontoGeneralYFamilia(listaDeDescuento, indiceDeListaDeDescuento + 1, listaHistoricoDePromos, function (listaDeDescuento) {
                            callBack(listaDeDescuento);
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                    }
                }
                else {
                    callBack(listaDeDescuento);
                }
            }
            else {
                callBack(listaDeDescuento);
            }
        }
        catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: "Error al validar la si aplica el descuento por monto general y familia: " + ex.message
            });
        }
    };
    ListaSkuControlador.prototype.listaDeDescuentoPorMontoGeneralYFamiliaTerminoDeIterar = function (listaDeDescuento, indiceDeListaDeDescuento) {
        return (listaDeDescuento.length > 0 && listaDeDescuento.length > indiceDeListaDeDescuento);
    };
    ListaSkuControlador.prototype.validarSiAplicaElDescuentoPorFamiliaYTipoPago = function (listaDeDescuento, indiceDeListaDeDescuento, listaHistoricoDePromos, callBack, errCallback) {
        var _this = this;
        try {
            if (listaHistoricoDePromos.length > 0) {
                if (this.listaDeDescuentoPorFamiliaYTipoPagoTerminoDeIterar(listaDeDescuento, indiceDeListaDeDescuento)) {
                    var descuentoAValidar_2 = listaDeDescuento[indiceDeListaDeDescuento];
                    var resultadoDePromoHistorico_2 = listaHistoricoDePromos.find(function (promo) {
                        return promo.promoId === descuentoAValidar_2.promoId;
                    });
                    if (resultadoDePromoHistorico_2) {
                        var promoDeDescuento = new Promo();
                        promoDeDescuento.promoId = descuentoAValidar_2.promoId;
                        promoDeDescuento.promoName = descuentoAValidar_2.promoName;
                        promoDeDescuento.frequency = descuentoAValidar_2.frequency;
                        this.promoServicio.validarSiAplicaPromo(promoDeDescuento, resultadoDePromoHistorico_2, function (aplicaDescuento) {
                            if (!aplicaDescuento) {
                                listaDeDescuento = listaDeDescuento.filter(function (descuento) {
                                    return resultadoDePromoHistorico_2.promoId !== descuento.promoId;
                                });
                            }
                            _this.validarSiAplicaElDescuentoPorFamiliaYTipoPago(listaDeDescuento, indiceDeListaDeDescuento + (aplicaDescuento ? 1 : 0), listaHistoricoDePromos, function (listaDeDescuento) {
                                callBack(listaDeDescuento);
                            }, function (resultado) {
                                errCallback(resultado);
                            });
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                        promoDeDescuento = null;
                    }
                    else {
                        this.validarSiAplicaElDescuentoPorFamiliaYTipoPago(listaDeDescuento, indiceDeListaDeDescuento + 1, listaHistoricoDePromos, function (listaDeDescuento) {
                            callBack(listaDeDescuento);
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                    }
                }
                else {
                    callBack(listaDeDescuento);
                }
            }
            else {
                callBack(listaDeDescuento);
            }
        }
        catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: "Error al validar la si aplica el descuento por monto general y familia: " + ex.message
            });
        }
    };
    ListaSkuControlador.prototype.listaDeDescuentoPorFamiliaYTipoPagoTerminoDeIterar = function (listaDeDescuento, indiceDeListaDeDescuento) {
        return (listaDeDescuento.length > 0 && listaDeDescuento.length > indiceDeListaDeDescuento);
    };
    return ListaSkuControlador;
}());
//# sourceMappingURL=ListaSkuControlador.js.map