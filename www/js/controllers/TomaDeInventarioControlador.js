var TomaDeInventarioControlador = (function () {
    function TomaDeInventarioControlador(mensajero) {
        this.mensajero = mensajero;
        this.skuServicio = new SkuServicio();
        this.tomaInventarioServicio = new TomaDeInventarioServicio();
        this.tareaServicio = new TareaServcio();
        this.configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
        this.clienteServicio = new ClienteServicio();
        this.tomaDeInventario = new TomaInventario();
        this.detalleInventario = [];
        this.detalleAcomparar = [];
        this.tokenDetalleInventario = mensajero.subscribe(this.detalleInventarioMensajeEntregado, getType(DetalleInventarioMensaje), this);
        this.tokenTarea = mensajero.subscribe(this.tareaEntregado, getType(TareaMensaje), this);
        this.tokenCliente = mensajero.subscribe(this.clienteEntregado, getType(ClienteMensaje), this);
    }
    TomaDeInventarioControlador.prototype.detalleInventarioMensajeEntregado = function (message, subscriber) {
        subscriber.detalleAcomparar = message.detalleAComparar;
    };
    ;
    TomaDeInventarioControlador.prototype.tareaEntregado = function (message, subscriber) {
        subscriber.tarea = message.tarea;
    };
    ;
    TomaDeInventarioControlador.prototype.clienteEntregado = function (message, subscriber) {
        subscriber.cliente = message.cliente;
    };
    ;
    TomaDeInventarioControlador.prototype.delegarTomaDeInventarioControlador = function () {
        var _this = this;
        var este = this;
        document.addEventListener("backbutton", function () {
            _this.usuarioDeseaCancelarTomaDeInventario();
        }, true);
        $("#UiPageTakeInventory").on("pageshow", function () {
            _this.cargarDetalleInventario();
        });
        swipe("#UiPageTakeInventory", function (direccion) {
            if (direccion === "right") {
                este.usuarioDeseaVerLIstaSkus();
            }
            else if (direccion === "left") {
                _this.publicarEstablecerOpcionMensaje("NO");
                _this.usuarioDeseaInicarBusquedaSkus();
            }
        });
        $("#uiBtnAceptarTomaDeInventario").bind("touchstart", function () {
            if (_this.detalleInventario.length > 0) {
                _this.usuarioDeseaGuardarTomaDeInventario();
            }
            else {
                notify("Debe de ingresar por lo menos un sku al detalle");
            }
        });
        $("#uiBtnCancelarTomadeInventario").bind("touchstart", function () {
            _this.usuarioDeseaCancelarTomaDeInventario();
        });
        $("#UiPageTakeInventory").on("swipeleft", "#uiListaSkusInventareados li", function (event) {
            if (event.type === "swipeleft") {
                var id = event.currentTarget.attributes["id"].nodeValue;
                var paquete = event.currentTarget.attributes["packUnit"].nodeValue;
                _this.usuarioDeseaEliminarSku(id.substring(3), paquete);
            }
        });
    };
    TomaDeInventarioControlador.prototype.usuarioDeseaEliminarSku = function (idSku, packUnit) {
        var _this = this;
        try {
            navigator.notification.confirm("Confirma remover de la lista al SKU " + idSku + "?", function (buttonIndex) {
                if (buttonIndex === 2) {
                    _this.eliminarSku(idSku, packUnit);
                }
            }, "Sonda® " + SondaVersion, "No,Si");
        }
        catch (err) {
            notify("Error al eliminar sku: " + err.mensaje);
        }
    };
    TomaDeInventarioControlador.prototype.eliminarSku = function (idSku, packUnit) {
        try {
            for (var i = 0; i < this.detalleInventario.length; i++) {
                var sku = this.detalleInventario[i];
                if (sku.codeSku === idSku && sku.codePackUnit === packUnit) {
                    this.detalleInventario.splice(i, 1);
                }
            }
            this.cargarDetalleInventario();
        }
        catch (err) {
            notify("Error al eliminar sku: " + err.mensaje);
        }
    };
    TomaDeInventarioControlador.prototype.usuarioDeseaVerLIstaSkus = function () {
        $.mobile.changePage("#UiSkusListPageForTakeInventory", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };
    TomaDeInventarioControlador.prototype.usuarioDeseaInicarBusquedaSkus = function () {
        $.mobile.changePage("#UiUnitPackPageTakeInventory", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };
    TomaDeInventarioControlador.prototype.usuarioDeseaRegresarAlMenuPrincipal = function () {
        $.mobile.changePage("#menu_page", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };
    TomaDeInventarioControlador.prototype.publicarListaDeSkusParaTomaDeInventario = function (listaSku) {
        var msg = new ListaSkuMensaje(this);
        msg.listaSku = listaSku;
        this.mensajero.publish(msg, getType(ListaSkuMensaje));
    };
    TomaDeInventarioControlador.prototype.publicarSku = function (sku) {
        var msg = new SkuMensaje(this);
        msg.sku = sku;
        this.mensajero.publish(msg, getType(SkuMensaje));
    };
    TomaDeInventarioControlador.prototype.publicarEstablecerOpcionMensaje = function (skuDesdeLista) {
        var msg = new EstablecerOpcionMensaje(this);
        msg.skuDesdeLista = skuDesdeLista;
        this.mensajero.publish(msg, getType(EstablecerOpcionMensaje));
    };
    TomaDeInventarioControlador.prototype.generarListaDeSku = function () {
        var _this = this;
        var codeFamilySku = "";
        if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
            localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
        }
        codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
        this.skuServicio.obtenerSkuParaTomaInventario(codeFamilySku, function (listaSku) {
            if (listaSku.length > 0) {
                _this.publicarListaDeSkusParaTomaDeInventario(listaSku);
                _this.usuarioDeseaVerLIstaSkus();
            }
            else {
                notify("No se encontraron Skus para la toma de inventario.");
            }
        }, function (operacion) {
            notify(operacion.mensaje);
        });
    };
    TomaDeInventarioControlador.prototype.usuarioDeseaGuardarTomaDeInventario = function () {
        var _this = this;
        this.prepararTomaDeInventarioParaInsertar(function (tomaDeInventario) {
            _this.tomaInventarioServicio.insertarTomaDeInventario(tomaDeInventario, function () {
                _this.tarea.taskStatus = TareaEstado.Completada;
                _this.tareaServicio.actualizarTareaEstado(_this.tarea, function () {
                    _this.obtenerConfiguracionDeDecimales(function (configuracionDecimales) {
                        var cliente = new Cliente();
                        cliente.clientId = gClientID;
                        _this.clienteServicio.obtenerCliente(cliente, configuracionDecimales, function (cliente) {
                            actualizarListadoDeTareas(_this.tarea.taskId, _this.tarea.taskType, _this.tarea.taskStatus, cliente.clientId, cliente.clientName, cliente.address, 0, TareaEstado.Aceptada, cliente.rgaCode);
                            _this.detalleInventario.length = 0;
                            _this.detalleAcomparar.length = 0;
                            _this.usuarioDeseaRegresarAlMenuPrincipal();
                            EnviarData();
                            notify("Inventario guardado exitosamente.");
                        }, function (resultado) {
                            my_dialog("", "", "closed");
                            notify(resultado.mensaje);
                        });
                    });
                }, function (operacion) {
                    notify(operacion.mensaje);
                });
            }, function (operacion) {
                notify(operacion.mensaje);
            });
        });
    };
    TomaDeInventarioControlador.prototype.obtenerSecuenciaDeDocumentos = function (controlador, callback) {
        try {
            GetNexSequence("TAKE_INVENTORY", function (sequence) {
                ObtenerSecuenciaSiguiente(TipoDocumento.TomaDeInventario, function (serie, numeroDeDocumento) {
                    callback(sequence, serie, numeroDeDocumento, controlador);
                }, function (err) {
                    notify("Error al obtener sequencia de documento: " + err.message);
                });
            }, function (err) {
                notify("Error al obtener sequencia de documento: " + err.message);
            });
        }
        catch (err) {
            notify("Error al obtener secuencia de documento: " + err.message);
        }
    };
    TomaDeInventarioControlador.prototype.obtenerConfiguracionDeDecimales = function (callback) {
        this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
            callback(decimales);
        }, function (operacion) {
            notify(operacion.mensaje);
        });
    };
    TomaDeInventarioControlador.prototype.prepararTomaDeInventarioParaInsertar = function (callback) {
        var _this = this;
        try {
            this.obtenerSecuenciaDeDocumentos(this, function (sequence, serie, numeroDeDocumento, controlador) {
                _this.obtenerConfiguracionDeDecimales(function (configuracionDecimales) {
                    var clienteId = new Cliente;
                    clienteId.clientId = gClientID;
                    _this.clienteServicio.obtenerCliente(clienteId, configuracionDecimales, function (cliente) {
                        var tomaDeInventario = new TomaInventario();
                        tomaDeInventario.takeInventoryId = parseInt(sequence);
                        tomaDeInventario.takeInventoryIdBo = 0;
                        tomaDeInventario.tomaInventarioDetalle = _this.detalleInventario;
                        for (var i = 0; i < tomaDeInventario.tomaInventarioDetalle.length; i++) {
                            tomaDeInventario.tomaInventarioDetalle[i].takeInventoryId = tomaDeInventario.takeInventoryId;
                        }
                        tomaDeInventario.clientId = cliente.clientId;
                        tomaDeInventario.codeRoute = localStorage.getItem("POS_CURRENT_ROUTE");
                        tomaDeInventario.deviceBatteryFactor = gBatteryLevel;
                        tomaDeInventario.docNum = numeroDeDocumento;
                        tomaDeInventario.docSerie = serie;
                        tomaDeInventario.gpsExpected = cliente.gps;
                        tomaDeInventario.gpsUrl = gCurrentGPS;
                        tomaDeInventario.isActiveRoute = 1;
                        tomaDeInventario.isPosted = 0;
                        tomaDeInventario.isVoid = false;
                        tomaDeInventario.postedDataTime = getDateTime();
                        tomaDeInventario.taskId = controlador.tarea.taskId;
                        tomaDeInventario.postedBy = localStorage.getItem("LAST_LOGIN_ID");
                        callback(tomaDeInventario);
                    }, function (operacion) {
                        notify(operacion.mensaje);
                    });
                });
            });
        }
        catch (err) {
            notify("Error al preparar ordenDeVenta: " + err.message);
        }
    };
    TomaDeInventarioControlador.prototype.usuarioDeseaCancelarTomaDeInventario = function () {
        var _this = this;
        switch ($.mobile.activePage[0].id) {
            case "UiPageTakeInventory":
                navigator.notification.confirm("Confirma que desea cancelar toma de inventario? ", function (buttonIndex) {
                    if (buttonIndex === 2) {
                        _this.detalleInventario.length = 0;
                        _this.usuarioDeseaRegresarAlMenuPrincipal();
                    }
                }, "Sonda® " + SondaVersion, "No,Si");
                break;
        }
    };
    TomaDeInventarioControlador.prototype.cargarDetalleInventario = function () {
        var _this = this;
        try {
            this.limpiarRepetidosLIstaDetalle(function (detalleDeInventario) {
                _this.detalleInventario = detalleDeInventario;
                var uiListaDetalleInventario = $("#uiListaSkusInventareados");
                var uiTotalSkusInventareados = $("#uiTotalSkusInventareados");
                uiTotalSkusInventareados.text(0);
                uiListaDetalleInventario.children().remove("li");
                for (var i = 0; i < _this.detalleInventario.length; i++) {
                    var li = "";
                    var detalle = _this.detalleInventario[i];
                    li += "<li packUnit='" + detalle.codePackUnit + "' data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'";
                    li += " id='TDI" + detalle.codeSku + "'>";
                    li += " <a href='#'";
                    li += " <p>";
                    li += " <span style='font-size:12px;'>SKU:" + detalle.codeSku + "     UM:" + detalle.codePackUnit + "</span>";
                    li += " </p>";
                    li += " <p class='small-roboto'>Inventario: " + detalle.qty + " ";
                    if (detalle.lastQty > 0) {
                        li += "<span>Ult. Inventario: " + detalle.lastQty + "</span>";
                    }
                    li += "</p>";
                    li += "</a>";
                    li += "</li>";
                    uiListaDetalleInventario.append(li);
                    uiListaDetalleInventario.listview("refresh");
                    var loQueLleva = parseFloat(uiTotalSkusInventareados.text());
                    var total = loQueLleva + parseFloat(detalle.qty.toString());
                    uiTotalSkusInventareados.text(total.toString());
                }
                uiListaDetalleInventario = null;
            });
        }
        catch (err) {
            notify(err.message);
        }
    };
    TomaDeInventarioControlador.prototype.limpiarRepetidosLIstaDetalle = function (callback) {
        if (this.detalleInventario.length > 0) {
            var inventarioLength = this.detalleInventario.length;
            for (var i = 0; i < this.detalleAcomparar.length; i++) {
                var repetido = false;
                for (var j = 0; j < inventarioLength; j++) {
                    if (this.detalleInventario[j].codePackUnit === this.detalleAcomparar[i].codePackUnit && this.detalleInventario[j].codeSku === this.detalleAcomparar[i].codeSku) {
                        this.detalleInventario[j] = this.detalleAcomparar[i];
                        repetido = true;
                    }
                }
                if (!repetido)
                    this.detalleInventario.push(this.detalleAcomparar[i]);
            }
            this.detalleAcomparar.length = 0;
            callback(this.detalleInventario);
        }
        else {
            this.detalleInventario = this.detalleAcomparar;
            callback(this.detalleInventario);
        }
    };
    return TomaDeInventarioControlador;
}());
//# sourceMappingURL=TomaDeInventarioControlador.js.map