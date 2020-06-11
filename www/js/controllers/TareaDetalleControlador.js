var timerElapsed = false;
var emitCompleted = false;
var interval = 0;
var socketTareaDetalle;
var tareaDetalleControlador;
var TareaDetalleControlador = (function () {
    function TareaDetalleControlador(mensajero) {
        this.mensajero = mensajero;
        this.clienteServicio = new ClienteServicio();
        this.tareaServicio = new TareaServcio();
        this.ordenDeVentaServicio = new OrdenDeVentaServicio();
        this.draftServicio = new DraftServicio();
        this.configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
        this.skuServicio = new SkuServicio();
        this.listaDePreciosServicio = new ListaDePreciosServicio();
        this.comboServicio = new ComboServicio();
        this.promoServicio = new PromoServicio();
        this.tarea = new Tarea();
        this.cliente = new Cliente();
        this.contadorDeIteraciones = 0;
        this.tokenProcesarTipoTarea = mensajero.subscribe(this.tipoDeTareaEntregado, getType(ProcesarTipoDeTareaMensaje), this);
    }
    TareaDetalleControlador.prototype.delegadoTareaDetalleControlador = function () {
        var _this = this;
        tareaDetalleControlador = this;
        $("#btnAcceptThisTask").bind("touchstart", function () {
            _this.obtenerDatosDeTarea(function () {
                _this.usuarioDeseaAceptarLaTarea();
            });
        });
        $("#taskdetail_page").on("pageshow", function () {
            _this.obtenerConfiguracionDeDecimales(function () {
                _this.limpiarCamposDetalleTarea();
                _this.obtenerDatosDeTarea(function () {
                    _this.draftServicio.obtenerDraftsOrdenDeVenta(function (ordenes) {
                        _this.draftServicio.obtenerDetalleDeOrdenDeVentaDraft(ordenes, function (ordenes) {
                            _this.actualizarTareaIdABorradorOrdeDeVenta(ordenes);
                        }, function (resultadoN1) {
                            console.log(resultadoN1.mensaje);
                        });
                    }, function (resultado) {
                        console.log(resultado.mensaje);
                    });
                });
            }, function (operacion) {
                notify(operacion.mensaje);
            });
        });
        $("#taskdetail_page").swipe({
            swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
                if (fingerCount === 1 && direction === "right") {
                    var myPanel = $.mobile.activePage.children('[id="UiPanelDerrechoAceptarTarea"]');
                    myPanel.panel("toggle");
                }
            }
        });
        $("#UIBotonModificarClienteDesdeAceptarTarea").bind("touchstart", function () {
            _this.usuarioDeseaModifcarCliente();
        });
    };
    TareaDetalleControlador.prototype.delegarSockets = function (socketIo) {
        var _this = this;
        socketTareaDetalle = socketIo;
        socketIo.on("GetCurrentAccountByCustomer_Request", function (data) {
            switch (data.option) {
                case OpcionRespuesta.Exito:
                    my_dialog("", "", "close");
                    console.log("Validando Saldo desde: " + data.source);
                    switch (data.source) {
                        case OpcionValidarSaldoCliente.EjecutarTarea:
                            _this.obtenerDatosDeTarea(function () {
                                _this.seguirOrdenDeVenta(_this.cliente);
                            });
                            break;
                    }
                    break;
            }
        });
        socketIo.on("GetPriceListBySkuUsingCustomerId", function (data) {
            switch (data.option) {
                case "add_price_list_by_sku_using_customerid":
                    if (!timerElapsed) {
                        _this.tarea = JSON.parse(JSON.stringify(data.tarea));
                        _this.listaDePreciosServicio.agregarPaqueteDeListaDePreciosPorSku(data.recordset, data.cliente, function (clienteRespuesta) {
                            emitCompleted = true;
                            var client = JSON.parse(JSON.stringify(clienteRespuesta));
                            _this.procesarClienteParaOrdenDeVenta(client);
                        }, function (resultado) {
                            emitCompleted = true;
                            notify(resultado.mensaje);
                        });
                    }
                    break;
                case "get_price_list_by_sku_using_customerId_fail":
                    notify(data.message);
                    emitCompleted = true;
                    break;
                case "no_found_price_list_by_sku_using_customerid":
                    emitCompleted = true;
                    _this.establecerListaDePreciosAClienteYProcesarlo(data.cliente);
                    break;
            }
        });
    };
    TareaDetalleControlador.prototype.actualizarTareaIdABorradorOrdeDeVenta = function (ordenesDeVentaDraft) {
        var _this = this;
        try {
            for (var i = 0; i < ordenesDeVentaDraft.length; i++) {
                if (ordenesDeVentaDraft[i].taskId === 0) {
                    this.draftServicio.obtenerTaskIdParaBorradorDeOrdenDeVenta(ordenesDeVentaDraft[i], i, function (ordenDeVenta, indice) {
                        ordenesDeVentaDraft[indice] = ordenDeVenta;
                        if (ordenesDeVentaDraft[indice].taskId !== 0) {
                            _this.draftServicio.actualizarTareaIdParaBorradorDeOrdenDeVenta(ordenesDeVentaDraft[indice], function () {
                            }, function (resultado) {
                                notify(resultado.mensaje);
                            });
                        }
                    }, function (resultado) {
                        notify(resultado.mensaje);
                    });
                }
            }
        }
        catch (err) {
            notify("Erro al actualizar la tarea id para el borrador: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.desplegarDatosCliente = function (cliente) {
        var uiLblLimiteDeCredito = $("#UiLblLimiteDeCredito");
        var uiLblSaldoVencido = $("#UiLblSaldoVencido");
        var uiLblSaldoDisponibleTarea = $("#UiLblSaldoDisponibleTarea");
        var uiLblDiasDeCredito = $("#UiLblDiasDeCredito");
        var uiLblUltimaCompra = $("#UiLblUltimaCompra");
        var uiTxtTareaDesc = $("#UiTxtTareaDesc");
        var uiLblSaldoTareaFooter = $("#UiLblSaldoTareaFooter");
        var uiLblTotalSaldoTareaFooter = $("#UiLblTotalSaldoTareaFooter");
        var disponible = cliente.cuentaCorriente.limiteDeCredito - cliente.previousBalance;
        uiLblLimiteDeCredito.text(format_number(cliente.cuentaCorriente.limiteDeCredito, this.configuracionDecimales.defaultDisplayDecimals));
        uiLblSaldoVencido.text(format_number(cliente.previousBalance, this.configuracionDecimales.defaultDisplayDecimals));
        uiLblSaldoDisponibleTarea.text(format_number(disponible, this.configuracionDecimales.defaultDisplayDecimals));
        uiLblDiasDeCredito.text(cliente.cuentaCorriente.diasCredito);
        uiLblUltimaCompra.text(format_number(cliente.lastPurchase, this.configuracionDecimales.defaultDisplayDecimals));
        uiTxtTareaDesc.val("Tarea Generada para Cliente: " + cliente.clientName);
        uiLblSaldoTareaFooter.text(format_number(cliente.previousBalance, this.configuracionDecimales.defaultDisplayDecimals));
        uiLblTotalSaldoTareaFooter.text(format_number(disponible, this.configuracionDecimales.defaultDisplayDecimals));
    };
    TareaDetalleControlador.prototype.obtenerDatosDeTarea = function (callback) {
        var _this = this;
        try {
            this.tarea.taskId = gtaskid;
            this.tarea.taskType = gTaskType;
            this.tarea.taskStatus = TareaEstado.Aceptada;
            this.tarea.taskIsFrom = gTaskIsFrom;
            this.tarea.salesOrderTotal = 0;
            if (gtaskid !== 0) {
                this.tareaServicio.obtenerTarea(this.tarea, function (tarea) {
                    var uiClienteName = $("#lblClientName_pickup");
                    uiClienteName.text(tarea.relatedClientName);
                    uiClienteName = null;
                    var uiAdrres = $("#lblAddress_pickup");
                    uiAdrres.text(tarea.taskAddress);
                    uiAdrres = null;
                    gtaskStatus = tarea.taskStatus;
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }
            this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
                var cliente = new Cliente();
                cliente.clientId = gClientID;
                _this.configuracionDecimales = decimales;
                _this.clienteServicio.obtenerCliente(cliente, decimales, function (clienteFiltrado) {
                    _this.cliente = clienteFiltrado;
                    _this.comboServicio.obtenerCombosPorCliente(clienteFiltrado, function (clienteConCombos) {
                        _this.obtenerHistoricodePromo(function (listaDeHistoricoDePromos) {
                            _this.validarSiAplicaLasBonificacionesPorCombo(clienteFiltrado.bonoPorCombos, 0, listaDeHistoricoDePromos, function (listaDeBonificaciones) {
                                _this.cliente.bonoPorCombos = listaDeBonificaciones;
                                _this.cliente.cuentaCorriente = new CuentaCorriente();
                                _this.clienteServicio.obtenerCuentaCorriente(clienteConCombos, _this.configuracionDecimales, function (clienteConCuentaCorriente) {
                                    _this.cliente = clienteConCuentaCorriente;
                                    _this.desplegarDatosCliente(clienteConCuentaCorriente);
                                    callback();
                                }, function (resultado) {
                                    notify(resultado.mensaje);
                                });
                            }, function (operacion) {
                                notify(operacion.mensaje);
                            });
                        }, function (operacion) {
                            notify(operacion.mensaje);
                        });
                    }, function (operacion) {
                        notify(operacion.mensaje);
                    });
                }, function (operacion) {
                    notify(operacion.mensaje);
                });
            }, function (operacion) {
                notify(operacion.mensaje);
            });
        }
        catch (err) {
            notify("Error al cargar la tarea: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.limpiarCamposDetalleTarea = function () {
        try {
            var uiClienteName = $("#lblClientName_pickup");
            var uiClientAddress = $("#lblAddress_pickup");
            uiClienteName.text("");
            uiClientAddress.text("");
            uiClienteName = null;
            uiClientAddress = null;
        }
        catch (e) {
            notify("No se han podido limpiar los campos de detalle de la tarea actual debido a: " + e.message);
        }
    };
    TareaDetalleControlador.prototype.usuarioDeseaCargarTarea = function () {
        var _this = this;
        try {
            this.obtenerDatosDeTarea(function () {
                _this.prosesarTipoTarea();
            });
        }
        catch (err) {
            notify("Error al cargar la tarea: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.usuarioDeseaAceptarLaTarea = function () {
        try {
            if (gIsOnline === EstaEnLinea.Si) {
                this.tareaServicio.enviarTareaAceptada(this.tarea, function (resultado) {
                    notify(resultado.mensaje);
                });
            }
            this.prosesarTipoTarea();
        }
        catch (err) {
            notify(err.mensaje);
        }
    };
    TareaDetalleControlador.prototype.prosesarTipoTarea = function () {
        var _this = this;
        try {
            this.limpiarVariablesGlobales();
            switch (this.tarea.taskType) {
                case TareaTipo.Entrega:
                    this.tareaServicio.actualizarTareaEstado(this.tarea, function () {
                        _this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
                            var cliente = new Cliente();
                            cliente.clientId = gClientID;
                            _this.clienteServicio.obtenerCliente(cliente, decimales, function (clienteFiltrado) {
                                actualizarListadoDeTareas(_this.tarea.taskId, _this.tarea.taskType, _this.tarea.taskStatus, clienteFiltrado.clientId, clienteFiltrado.clientName, clienteFiltrado.address, 0, gtaskStatus, clienteFiltrado.rgaCode);
                                gotomyDelivery();
                            }, function (operacion) {
                                notify(operacion.mensaje);
                            });
                        }, function (operacion) {
                            notify(operacion.mensaje);
                        });
                    }, function (operacion) {
                        notify("Error al actualizar tarea: " + operacion.mensaje);
                    });
                    break;
                case TareaTipo.Preventa:
                    this.ejecutarTareaDePreventa();
                    break;
                case TareaTipo.Borrador:
                    this.ejecutarTareaDePreventa();
                    break;
                case TareaTipo.Venta:
                    EjecutarTareaDeVenta(gClientID);
                    break;
                case TareaTipo.Obsoleto:
                    EjecutarTareaDeVenta(gClientID);
                    break;
                case TareaTipo.TomaDeInventario:
                    this.publicarTareaDeTomaDeInventario(this.tarea);
                    this.tareaServicio.actualizarTareaEstado(this.tarea, function () {
                        var cliente = new Cliente();
                        cliente.clientId = gClientID;
                        _this.clienteServicio.obtenerCliente(cliente, _this.configuracionDecimales, function (cliente) {
                            actualizarListadoDeTareas(_this.tarea.taskId, _this.tarea.taskType, _this.tarea.taskStatus, cliente.clientId, cliente.clientName, cliente.address, 0, gtaskStatus, cliente.rgaCode);
                        }, function (resultado) {
                            my_dialog("", "", "closed");
                            notify(resultado.mensaje);
                        });
                    }, function (operacion) {
                        notify("Error al actualizar: " + operacion.mensaje);
                    });
                    my_dialog("", "", "closed");
                    this.mostrarPantallaDeTomaDeInventario();
                    break;
            }
        }
        catch (err) {
            notify(err.mensaje);
        }
    };
    TareaDetalleControlador.prototype.validarSiSeAplicaLaRegla = function (listDeRaglasAValidar) {
        if (listDeRaglasAValidar.length === 0) {
            return false;
        }
        else {
            switch (listDeRaglasAValidar[0].enabled.toUpperCase()) {
                case "SI":
                    return true;
                case "SÍ":
                    return true;
            }
        }
    };
    TareaDetalleControlador.prototype.ejecutarTareaDePreventa = function () {
        var _this = this;
        var este = this;
        var cliente = new Cliente();
        cliente.clientId = gClientID;
        this.clienteServicio.obtenerCliente(cliente, this.configuracionDecimales, function (clienteFiltrado) {
            _this.comboServicio.obtenerCombosPorCliente(clienteFiltrado, function (clienteConCombos) {
                este.cliente = clienteConCombos;
                _this.obtenerHistoricodePromo(function (listaHistoricoDePromos) {
                    _this.validarSiAplicaLasBonificacionesPorCombo(este.cliente.bonoPorCombos, 0, listaHistoricoDePromos, function (listaDeBonificaciones) {
                        este.cliente.bonoPorCombos = listaDeBonificaciones;
                        _this.tareaServicio.obtenerRegla("ValidarListaDePreciosConServidor", function (listaDeReglasValidarListaDePreciosConServidor) {
                            if (_this.validarSiSeAplicaLaRegla(listaDeReglasValidarListaDePreciosConServidor)) {
                                if (este.cliente.priceListId === null || este.cliente.priceListId === "") {
                                    if (!este.cliente.isNew) {
                                    }
                                    _this.establecerListaDePreciosAClienteYProcesarlo(este.cliente);
                                }
                                else {
                                    _this.skuServicio.verificarCantidadDeSkusDisponiblesParaCliente(este.cliente, function (cantidadSkus, clienteVerificado) {
                                        _this.cliente = clienteVerificado;
                                        if (cantidadSkus > 0) {
                                            este.procesarClienteParaOrdenDeVenta(clienteVerificado);
                                        }
                                        else {
                                            if (gIsOnline === 1) {
                                                tareaDetalleControlador = _this;
                                                var data = {
                                                    'loginid': gLastLogin,
                                                    'dbuser': gdbuser,
                                                    'dbuserpass': gdbuserpass,
                                                    'cliente': clienteVerificado,
                                                    'routeid': gCurrentRoute,
                                                    'tarea': _this.tarea
                                                };
                                                console.log("Obteniendo lista de precios por sku de cliente fuera de ruta");
                                                socketTareaDetalle.emit("GetPriceListBySkuUsingCustomerId", data);
                                                BloquearPantalla();
                                                interval = setInterval(function () {
                                                    ToastThis("Consultando Precios");
                                                    este.contadorDeIteraciones++;
                                                    if (este.contadorDeIteraciones >= 5) {
                                                        DesBloquearPantalla();
                                                        timerElapsed = true;
                                                        if (!emitCompleted) {
                                                            if (clienteVerificado.priceListId !==
                                                                localStorage.getItem("gDefaultPriceList")) {
                                                            }
                                                            este.establecerListaDePreciosAClienteYProcesarlo(clienteVerificado);
                                                        }
                                                        clearInterval(interval);
                                                    }
                                                }, 1000);
                                            }
                                            else {
                                                if (clienteVerificado.priceListId !==
                                                    localStorage.getItem("gDefaultPriceList")) {
                                                    notify("No se encontró conexión al Servidor, la lista de precios a utilizar será la Lista por Defecto.");
                                                }
                                                este
                                                    .establecerListaDePreciosAClienteYProcesarlo(clienteVerificado);
                                            }
                                        }
                                    }, function (resultado) {
                                        notify(resultado.mensaje);
                                        my_dialog("", "", "closed");
                                    });
                                }
                            }
                            else {
                                _this.skuServicio.verificarCantidadDeSkusDisponiblesParaCliente(clienteConCombos, function (cantidadSkus, clienteVerificado) {
                                    if (cantidadSkus > 0) {
                                        este.procesarClienteParaOrdenDeVenta(clienteVerificado);
                                    }
                                    else {
                                        if (clienteVerificado.priceListId !==
                                            localStorage.getItem("gDefaultPriceList")) {
                                        }
                                        este.establecerListaDePreciosAClienteYProcesarlo(clienteVerificado);
                                    }
                                }, function (resultado) {
                                    notify(resultado.mensaje);
                                    my_dialog("", "", "closed");
                                });
                            }
                        }, function (resultado) {
                            notify(resultado.mensaje);
                            my_dialog("", "", "closed");
                        });
                    }, function (resultado) {
                        notify(resultado.mensaje);
                    });
                }, function (operacion) {
                    notify(operacion.mensaje);
                });
            }, function (operacion) {
                notify(operacion.mensaje);
            });
        }, function (resultado) {
            my_dialog("", "", "closed");
            notify(resultado.mensaje);
        });
    };
    TareaDetalleControlador.prototype.publicarListaDeSkuOrdenDeVenta = function () {
        var listaDeSkuOrdenDeVenta = [];
        var msg = new ListaSkuMensaje(this);
        msg.listaSku = listaDeSkuOrdenDeVenta;
    };
    TareaDetalleControlador.prototype.publicarCombo = function () {
        var listaDeSkuParaBonificacionDeCombo = [];
        var msg = new ListaDeSkuParaBonificacionDeComboMensaje(this);
        msg.listaDeSkuParaBonificacionDeCombo = listaDeSkuParaBonificacionDeCombo;
        this.mensajero.publish(msg, getType(ListaDeSkuParaBonificacionDeComboMensaje));
    };
    TareaDetalleControlador.prototype.tipoDeTareaEntregado = function (mensaje, subscriber) {
        subscriber.usuarioDeseaCargarTarea();
    };
    TareaDetalleControlador.prototype.usuarioDeseaVerOpcionesDeTipoDeOrdenesDeVenta = function (callback) {
        try {
            var config = {
                title: "Tipo de Orden de Venta",
                items: [
                    { text: "Contado", value: OrdenDeVentaTipo.Contado },
                    { text: "Credito", value: OrdenDeVentaTipo.Credito }
                ],
                doneButtonLabel: "Ok",
                cancelButtonLabel: "Cancelar"
            };
            plugins.listpicker.showPicker(config, function (item) {
                switch (item) {
                    case OrdenDeVentaTipo.Contado:
                        gSalesOrderType = OrdenDeVentaTipo.Contado;
                        ToastThis("Orden de Venta de Tipo: Contado");
                        callback();
                        break;
                    case OrdenDeVentaTipo.Credito:
                        gSalesOrderType = OrdenDeVentaTipo.Credito;
                        ToastThis("Orden de Venta de Tipo: Credito");
                        callback();
                        break;
                }
            });
        }
        catch (err) {
            notify("Error al cargar los Tipos de Orden de Venta: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.seguirOrdenDeVenta = function (cliente) {
        var _this = this;
        try {
            this.verificarSiDebeModificarCliente(function (debeValidarCliente) {
                if (debeValidarCliente && _this.tarea.taskType === TareaTipo.Preventa && gTaskIsFrom === TareaEstado.Asignada) {
                    cliente.origen = "TareaDetalleControlador";
                    cliente.estaEnModificacionObligatoria = true;
                    _this.cliente = cliente;
                    if (_this.pregutarTipoOrdenDeVenta === 1) {
                        _this.usuarioDeseaVerOpcionesDeTipoDeOrdenesDeVenta(function () {
                            _this.mostrarPantallaDeModificacionDeCliente();
                            my_dialog("", "", "closed");
                        });
                    }
                    else {
                        _this.mostrarPantallaDeModificacionDeCliente();
                        my_dialog("", "", "closed");
                    }
                }
                else {
                    _this.cliente.estaEnModificacionObligatoria = false;
                    _this.tareaServicio.actualizarTareaEstado(_this.tarea, function () {
                        actualizarListadoDeTareas(_this.tarea.taskId, _this.tarea.taskType, _this.tarea.taskStatus, cliente.clientId, cliente.clientName, cliente.address, 0, gtaskStatus, _this.cliente.rgaCode);
                        if (_this.pregutarTipoOrdenDeVenta === 1) {
                            _this.usuarioDeseaVerOpcionesDeTipoDeOrdenesDeVenta(function () {
                                if (_this.tarea.hasDraft) {
                                    _this.motrarPantallaOrdenDeVenta();
                                }
                                else {
                                    _this.mostrarPantallaDeListadoDeSkus();
                                }
                            });
                        }
                        else {
                            if (_this.tarea.hasDraft) {
                                _this.motrarPantallaOrdenDeVenta();
                            }
                            else {
                                _this.mostrarPantallaDeListadoDeSkus();
                            }
                        }
                    }, function (resultado) {
                        notify(resultado.mensaje);
                    });
                }
            }, function (error) {
                notify(error.mensaje);
            });
        }
        catch (err) {
            notify("Error al seguir orden de venta: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.motrarPantallaOrdenDeVenta = function () {
        try {
            $.mobile.changePage("pos_skus_page", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false,
                data: {
                    "cliente": this.cliente,
                    "tarea": this.tarea,
                    "configuracionDecimales": this.configuracionDecimales,
                    "esPrimeraVez": true
                }
            });
            my_dialog("", "", "closed");
        }
        catch (err) {
            notify("Error al seguir orden de venta: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.mostrarPantallaDeListadoDeSkus = function () {
        try {
            $.mobile.changePage("skus_list_page", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false,
                data: {
                    "cliente": this.cliente,
                    "tarea": this.tarea,
                    "configuracionDecimales": this.configuracionDecimales,
                    "listaSku": new Array(),
                    "esPrimeraVez": true
                }
            });
            my_dialog("", "", "closed");
        }
        catch (err) {
            notify("Error al mostrar el listado de SKU's debido a: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.irDirectoAOrdenDeVenta = function (cliente, lstSku) {
        var _this = this;
        if (this.tarea.taskType === TareaTipo.Preventa) {
            this.obtenerOrdenDeVenta(cliente, function (cliente, ordenDeVenta, publicarOrdenDeVenta) {
                cliente.fotoDeInicioDeVisita = ordenDeVenta.image3;
                if (_this.tarea.taskId !== 0) {
                    _this.publicarListaDeSkuOrdenDeVenta();
                }
                if (publicarOrdenDeVenta) {
                    _this.tarea.hasDraft = true;
                    _this.publicarOrdenDeVentaDraf(ordenDeVenta);
                }
                else {
                    _this.tarea.hasDraft = false;
                }
                _this.seguirOrdenDeVenta(cliente);
            });
        }
        else {
            if (this.tarea.taskId !== 0) {
                this.publicarListaDeSkuOrdenDeVenta();
            }
            this.seguirOrdenDeVenta(cliente);
        }
    };
    TareaDetalleControlador.prototype.irAOrdenDeVentaValidandoCuentaCorriente = function (cliente, lstSku) {
        var _this = this;
        this.clienteServicio.validarDatosGeneralesCuentaCorriente(cliente, function (cliente) {
            _this.tareaServicio.obtenerRegla("ValidarConServidorAntiguedadDeSaldos", function (listaDeReglasValidarConServidorAntiguedadDeSaldos) {
                if (gIsOnline === EstaEnLinea.No || (listaDeReglasValidarConServidorAntiguedadDeSaldos.length === 0 || listaDeReglasValidarConServidorAntiguedadDeSaldos[0].enabled.toUpperCase() === 'NO')) {
                    _this.clienteServicio.validarCuentaCorriente(cliente, lstSku, gSalesOrderType, _this.configuracionDecimales, function (cliente) {
                        if (_this.tarea.taskType === TareaTipo.Preventa) {
                            _this.obtenerOrdenDeVenta(cliente, function (cliente, ordenDeVenta, publicarOrdenDeVenta) {
                                if (_this.tarea.taskId !== 0) {
                                    _this.publicarListaDeSkuOrdenDeVenta();
                                }
                                if (publicarOrdenDeVenta) {
                                    _this.tarea.hasDraft = true;
                                    _this.publicarOrdenDeVentaDraf(ordenDeVenta);
                                }
                                else {
                                    _this.tarea.hasDraft = false;
                                }
                                _this.seguirOrdenDeVenta(cliente);
                            });
                        }
                        else {
                            if (_this.tarea.taskId !== 0) {
                                _this.publicarListaDeSkuOrdenDeVenta();
                            }
                            _this.seguirOrdenDeVenta(cliente);
                        }
                    }, function (resultado) {
                        notify(resultado.mensaje);
                    });
                }
                else {
                    _this.clienteServicio.enviarSolicitudParaObtenerCuentaCorriente(socketTareaDetalle, cliente, OpcionValidarSaldoCliente.EjecutarTarea, gSalesOrderType, function (cliente) {
                        _this.cliente = cliente;
                        if (_this.tarea.taskType === TareaTipo.Preventa) {
                            _this.obtenerOrdenDeVenta(cliente, function (cliente, ordenDeVenta, publicarOrdenDeVenta) {
                                if (_this.tarea.taskId !== 0) {
                                    _this.publicarListaDeSkuOrdenDeVenta();
                                }
                                if (publicarOrdenDeVenta) {
                                    _this.publicarOrdenDeVentaDraf(ordenDeVenta);
                                }
                            });
                        }
                        else {
                            if (_this.tarea.taskId !== 0) {
                                _this.publicarListaDeSkuOrdenDeVenta();
                            }
                        }
                    }, function (resultado) {
                        notify(resultado.mensaje);
                        my_dialog("", "", "closed");
                    });
                }
            }, function (resultado) {
                notify(resultado.mensaje);
                my_dialog("", "", "closed");
            });
        }, function (resultado) {
            notify(resultado.mensaje);
            my_dialog("", "", "closed");
        });
    };
    TareaDetalleControlador.prototype.publicarOrdenDeVentaDraf = function (ordenDeVenta) {
        var msg = new OrdenDeVentaDraftMensaje(this);
        msg.ordenDeVenta = ordenDeVenta;
        this.mensajero.publish(msg, getType(OrdenDeVentaDraftMensaje));
    };
    TareaDetalleControlador.prototype.obtenerOrdenDeVenta = function (cliente, callback) {
        try {
            this.ordenDeVentaServicio.obtenerOrdenDeVentaPorTarea(this.tarea, this.configuracionDecimales, function (ordenDeVenta) {
                if (ordenDeVenta.ordenDeVentaDetalle.length >= 1) {
                    if (ordenDeVenta.isDraft === 1) {
                        cliente.deliveryDate = ordenDeVenta.deliveryDate;
                        cliente.totalAmout = ordenDeVenta.totalAmount;
                        callback(cliente, ordenDeVenta, true);
                    }
                    else {
                        callback(cliente, ordenDeVenta, false);
                    }
                }
                else {
                    callback(cliente, ordenDeVenta, false);
                }
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        catch (err) {
            notify("Error al obtener orden de venta: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.obtenerConfiguracionDeDecimales = function (callback, errCallback) {
        var _this = this;
        this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
            _this.configuracionDecimales = decimales;
            callback();
        }, function (operacion) {
            errCallback(operacion);
        });
    };
    TareaDetalleControlador.prototype.publicarTareaDeTomaDeInventario = function (tarea) {
        var msg = new TareaMensaje(this);
        msg.tarea = tarea;
        this.mensajero.publish(msg, getType(TareaMensaje));
    };
    TareaDetalleControlador.prototype.mostrarPantallaDeTomaDeInventario = function () {
        try {
            $.mobile.changePage("#UiPageTakeInventory", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        }
        catch (err) {
            notify("Error al seguir toma de inventario: " + err.message);
        }
    };
    TareaDetalleControlador.prototype.usuarioDeseaModifcarCliente = function () {
        this.cliente.origen = "TareaDetalleControlador";
        this.mostrarPantallaDeModificacionDeCliente();
    };
    TareaDetalleControlador.prototype.procesarClienteParaOrdenDeVenta = function (cliente) {
        var _this = this;
        this.cliente = cliente;
        var sku = new Sku();
        sku.sku = "";
        sku.onHand = 0;
        var lstSku = [];
        this.clienteServicio.obtenerCuentaCorriente(cliente, tareaDetalleControlador.configuracionDecimales, function (cliente) {
            _this.tareaServicio.obtenerRegla("tipoOrdenDeVenta", function (listaDeReglasTipoOrdenDeVenta) {
                _this.tareaServicio.obtenerRegla("AplicarReglasComerciales", function (listaDeReglasAplicarReglasComerciales) {
                    if (listaDeReglasAplicarReglasComerciales.length > 0 && listaDeReglasAplicarReglasComerciales[0].enabled === 'Si') {
                        my_dialog("Validando crédito y saldo", "Espere...", "open");
                        _this.tareaServicio.obtenerRegla("NoValidarAntiguedadDeSaldos", function (listaDeReglasValidarAntiguedadDeSaldos) {
                            if (listaDeReglasValidarAntiguedadDeSaldos.length > 0 && listaDeReglasValidarAntiguedadDeSaldos[0].enabled === 'Si' || listaDeReglasValidarAntiguedadDeSaldos[0].enabled === 'SI') {
                                gSalesOrderType = OrdenDeVentaTipo.Contado;
                                _this.pregutarTipoOrdenDeVenta = 0;
                                _this.irDirectoAOrdenDeVenta(cliente, lstSku);
                            }
                            else {
                                _this.tareaServicio.obtenerRegla("LimiteDeCreditoCero", function (listaDeReglasLimiteDeCredito) {
                                    if (listaDeReglasLimiteDeCredito.length >= 1 && listaDeReglasTipoOrdenDeVenta.length >= 1) {
                                        if (cliente.cuentaCorriente.limiteDeCredito === 0) {
                                            notify("Creando Orden de Venta de Tipo Contado");
                                            gSalesOrderType = OrdenDeVentaTipo.Contado;
                                            _this.pregutarTipoOrdenDeVenta = 0;
                                            _this.irDirectoAOrdenDeVenta(cliente, lstSku);
                                        }
                                        else {
                                            gSalesOrderType = OrdenDeVentaTipo.Credito;
                                            _this.pregutarTipoOrdenDeVenta = 1;
                                            _this.irAOrdenDeVentaValidandoCuentaCorriente(cliente, lstSku);
                                        }
                                    }
                                    else if (listaDeReglasLimiteDeCredito.length >= 1 && listaDeReglasTipoOrdenDeVenta.length === 0) {
                                        if (cliente.cuentaCorriente.limiteDeCredito === 0) {
                                            notify("Creando Orden de Venta de Tipo Contado");
                                            gSalesOrderType = OrdenDeVentaTipo.Contado;
                                            _this.pregutarTipoOrdenDeVenta = 0;
                                            _this.irDirectoAOrdenDeVenta(cliente, lstSku);
                                        }
                                        else {
                                            gSalesOrderType = OrdenDeVentaTipo.Credito;
                                            _this.pregutarTipoOrdenDeVenta = 0;
                                            _this.irAOrdenDeVentaValidandoCuentaCorriente(cliente, lstSku);
                                        }
                                    }
                                    else if (listaDeReglasLimiteDeCredito.length === 0 && listaDeReglasTipoOrdenDeVenta.length >= 1) {
                                        gSalesOrderType = OrdenDeVentaTipo.Credito;
                                        _this.pregutarTipoOrdenDeVenta = 1;
                                        _this.irAOrdenDeVentaValidandoCuentaCorriente(cliente, lstSku);
                                    }
                                    else {
                                        gSalesOrderType = OrdenDeVentaTipo.Credito;
                                        _this.pregutarTipoOrdenDeVenta = 0;
                                        _this.irAOrdenDeVentaValidandoCuentaCorriente(cliente, lstSku);
                                    }
                                }, function (resultado) {
                                    notify(resultado.mensaje);
                                    my_dialog("", "", "closed");
                                });
                            }
                        }, function (resultado) {
                            notify(resultado.mensaje);
                            my_dialog("", "", "closed");
                        });
                    }
                    else {
                        gSalesOrderType = OrdenDeVentaTipo.Credito;
                        if (listaDeReglasTipoOrdenDeVenta.length > 0 && listaDeReglasTipoOrdenDeVenta[0].enabled === 'Si') {
                            _this.pregutarTipoOrdenDeVenta = 1;
                        }
                        else {
                            _this.pregutarTipoOrdenDeVenta = 0;
                        }
                        _this.irDirectoAOrdenDeVenta(cliente, lstSku);
                    }
                }, function (resultado) {
                    notify(resultado.mensaje);
                    my_dialog("", "", "closed");
                });
            }, function (resultado) {
                notify(resultado.mensaje);
                my_dialog("", "", "closed");
            });
        }, function (resultado) {
            notify(resultado.mensaje);
            my_dialog("", "", "closed");
        });
    };
    TareaDetalleControlador.prototype.establecerListaDePreciosAClienteYProcesarlo = function (cliente) {
        var este = this;
        este.cliente.priceListId = localStorage.getItem("gDefaultPriceList");
        este.procesarClienteParaOrdenDeVenta(este.cliente);
        my_dialog("", "", "closed");
    };
    TareaDetalleControlador.prototype.limpiarVariablesGlobales = function () {
        timerElapsed = false;
        emitCompleted = false;
        interval = 0;
    };
    TareaDetalleControlador.prototype.verificarSiDebeModificarCliente = function (callBack, errorCallBack) {
        var op;
        try {
            ObtenerReglas("ModificarDatosDeCliente", function (reglas) {
                if (reglas.rows.length > 0) {
                    var regla = reglas.rows.item(0);
                    if (regla.ENABLED === "SI" || regla.ENABLED === "Si") {
                        callBack(true);
                        regla = null;
                    }
                    else {
                        callBack(false);
                        regla = null;
                    }
                }
                else {
                    callBack(false);
                }
            }, function (error) {
                op = new Operacion();
                op.codigo = -1;
                op.mensaje = error;
                op.resultado = ResultadoOperacionTipo.Error;
                errorCallBack(op);
                op = null;
            });
        }
        catch (e) {
            op = new Operacion();
            op.codigo = -1;
            op.mensaje = e.message;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallBack(op);
            op = null;
        }
    };
    TareaDetalleControlador.prototype.mostrarPantallaDeModificacionDeCliente = function () {
        $.mobile.changePage("UiPageCustomerInfo", {
            transition: "flow",
            reverse: true,
            changeHash: false,
            showLoadMsg: false,
            data: {
                "cliente": this.cliente,
                "tarea": this.tarea,
                "configuracionDecimales": this.configuracionDecimales,
                "esPrimeraVez": true
            }
        });
    };
    TareaDetalleControlador.prototype.validarSiAplicaLasBonificacionesPorCombo = function (listaDeBonificaciones, indiceDeListaDeBonificacion, listaHistoricoDePromos, callBack, errCallback) {
        var _this = this;
        try {
            if (listaHistoricoDePromos.length > 0) {
                if (listaDeBonificaciones.length > 0 && listaDeBonificaciones.length > indiceDeListaDeBonificacion) {
                    var bonificacionAValidar_1 = listaDeBonificaciones[indiceDeListaDeBonificacion];
                    var resultadoDePromoHistorico_1 = listaHistoricoDePromos.find(function (promo) {
                        return promo.promoId === bonificacionAValidar_1.promoId;
                    });
                    if (resultadoDePromoHistorico_1) {
                        var promoDeBonificacion = new Promo();
                        promoDeBonificacion.promoId = bonificacionAValidar_1.promoId;
                        promoDeBonificacion.promoName = bonificacionAValidar_1.promoName;
                        promoDeBonificacion.frequency = bonificacionAValidar_1.frequency;
                        this.promoServicio.validarSiAplicaPromo(promoDeBonificacion, resultadoDePromoHistorico_1, function (aplicaPromo) {
                            if (!aplicaPromo) {
                                listaDeBonificaciones = listaDeBonificaciones.filter(function (bonificacion) {
                                    return resultadoDePromoHistorico_1.promoId !== bonificacion.promoId;
                                });
                            }
                            _this.validarSiAplicaLasBonificacionesPorCombo(listaDeBonificaciones, indiceDeListaDeBonificacion + (aplicaPromo ? 1 : 0), listaHistoricoDePromos, function (listaDeBonificaciones) {
                                callBack(listaDeBonificaciones);
                            }, function (resultado) {
                                errCallback(resultado);
                            });
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                        promoDeBonificacion = null;
                    }
                    else {
                        this.validarSiAplicaLasBonificacionesPorCombo(listaDeBonificaciones, indiceDeListaDeBonificacion + 1, listaHistoricoDePromos, function (listaDeDescuento) {
                            callBack(listaDeDescuento);
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                    }
                }
                else {
                    callBack(listaDeBonificaciones);
                }
            }
            else {
                callBack(listaDeBonificaciones);
            }
        }
        catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: "Error al validar la si aplica la bonificacion por combo: " + ex.message
            });
        }
    };
    TareaDetalleControlador.prototype.obtenerHistoricodePromo = function (callBack, errCallback) {
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
    return TareaDetalleControlador;
}());
//# sourceMappingURL=TareaDetalleControlador.js.map