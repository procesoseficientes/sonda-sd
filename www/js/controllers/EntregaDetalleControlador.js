var EntregaDetalleControlador = (function () {
    function EntregaDetalleControlador(mensajero) {
        this.mensajero = mensajero;
        this.tarea = new Tarea();
        this.entregaServicio = new EntregaServicio();
        this.listaDemandaDeDespachos = [];
        this.listaDemandaDeDespachoConsolidado = [];
        this.listaDeDemandaDeDespachoParaProcesoDeEntrega = [];
        this.tokenTarea = mensajero.subscribe(this.tareaMensajeEntregado, getType(TareaMensaje), this);
    }
    EntregaDetalleControlador.prototype.delegarEntregaControlador = function () {
        var _this = this;
        var este = this;
        $("#UiDeliveryDetailPage").on("pageshow", function () {
            vieneDeListadoDeDocumentosDeEntrega = true;
            este.obtenerTareaPorCodigoYTipo();
        });
        $("#UiDeliveryDetailPage").on("click", "#UiListDeleberyDoc a", function (event) {
            var id = event.currentTarget.attributes["id"].nodeValue;
            este.usuarioSeleccionoDocumento(id.toString());
            id = null;
        });
        $("#UiBtnConsolidateDelivery").on("click", function () {
            if (!_this.tieneProductosParaEntrega()) {
                notify("No se ha encontrado informaci\u00F3n suficiente para generar el detalle de la entrega, por favor, verifique y vuelva a intentar.");
            }
            else {
                _this.generarDetalleDeEntregaConsolidada();
            }
        });
    };
    EntregaDetalleControlador.prototype.tareaMensajeEntregado = function (message, subscriber) {
        subscriber.tarea = message.tarea;
    };
    ;
    EntregaDetalleControlador.prototype.obtenerTareaPorCodigoYTipo = function () {
        var _this = this;
        TareaServicio.obtenerTareaPorCodigoYTipo(this.tarea.taskId, this.tarea.taskType, function (tarea) {
            _this.tarea = tarea;
            var uiCodeClient = $("#UiCodeClient");
            uiCodeClient.text(tarea.relatedClientCode);
            uiCodeClient = null;
            var uiNameClient = $("#UiNameClient");
            uiNameClient.text(tarea.relatedClientName);
            uiNameClient = null;
            var txtNIT = $("#txtNIT");
            txtNIT.val(_this.tarea.nit);
            txtNIT = null;
            var txtNombre = $("#txtNombre");
            txtNombre.val(_this.tarea.relatedClientName);
            txtNombre = null;
            var txtVuelto_summ = $("#txtVuelto_summ");
            txtVuelto_summ.text("0");
            txtVuelto_summ = null;
            _this.listaDemandaDeDespachos = [];
            _this.obtenerDocumentosParaEntrega();
        }, function (error) {
            notify("Error al obtener tarea de entrega: " + error.message);
        });
    };
    EntregaDetalleControlador.prototype.obtenerDocumentosParaEntrega = function () {
        var _this = this;
        try {
            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode, function (listaDemandaDeDespachos) {
                _this.listaDemandaDeDespachos = listaDemandaDeDespachos;
                _this.listaDemandaDeDespachoConsolidado = [];
                _this.consolidarListaDeDespacho([], function (listaDemandaDeDespachoConsolidado) {
                    _this.listaDemandaDeDespachoConsolidado = listaDemandaDeDespachoConsolidado;
                    _this.generarListadoDeDocumentosDeEntrega(function (error) {
                        notify("Error al generar el listado de entrega: " + error.mensaje);
                    });
                    _this.generarListadoDeDocumentosDeEntregaConsolidado(function (error) {
                        notify("Error al generar el listado de entrega consolidado: " + error.mensaje);
                    });
                    _this.consolidarListaDeDespachoParaProcesoDeEntrega(function (listaDeDemandaDeDespachoParaProcesoDeEntrega) {
                        _this.listaDeDemandaDeDespachoParaProcesoDeEntrega = listaDeDemandaDeDespachoParaProcesoDeEntrega;
                    });
                    _this.prepararInformacionDeCanastas();
                }, function (error) {
                    notify("Error al generar el listado conslidado de entrega: " + error.mensaje);
                });
            }, function (error) {
                notify("Error al obtener los documentos de entrega: " + error.mensaje);
            });
        }
        catch (e) {
            notify("Error al obtener Documentos Para Entrega" + e.message);
        }
    };
    EntregaDetalleControlador.prototype.generarListadoDeDocumentosDeEntrega = function (errorCallback) {
        try {
            var uiListDeliveryDoc_1 = $("#UiListDeleberyDoc");
            uiListDeliveryDoc_1.children().remove("li");
            this.listaDemandaDeDespachos.map(function (demandaDeDespacho) {
                var documento = (!demandaDeDespacho.erpReferenceDocNum && demandaDeDespacho.erpReferenceDocNum !== "null")
                    ? demandaDeDespacho.erpReferenceDocNum
                    : demandaDeDespacho.docNum.toString();
                var estado = "";
                switch (demandaDeDespacho.processStatus) {
                    case EstadoEntrega.Cancelada.toString():
                        estado = "Cancelado";
                        break;
                    case EstadoEntrega.Entregado.toString():
                        estado = "Entregado";
                        break;
                    case EstadoEntrega.Parcial.toString():
                        estado = "Parcial";
                        break;
                    case EstadoEntrega.Pendiente.toString():
                        estado = "Pendiente";
                        break;
                }
                var li = [];
                li.push("<li class='ui-field-contain' data-theme='a' style='text-align: left'>");
                li.push("<table>");
                li.push("<tr>");
                li.push("<td style='width: 90%'>");
                li.push("<a data-role='button' id='UiBotonEntrega-" + demandaDeDespacho
                    .pickingDemandHeaderId + "'>" + documento + "/" + estado + "</a>");
                li.push("</td>");
                if (demandaDeDespacho.processStatus !== EstadoEntrega.Cancelada.toString() && demandaDeDespacho.processStatus !== EstadoEntrega.Entregado.toString() && demandaDeDespacho.processStatus !== EstadoEntrega.Parcial.toString()) {
                    li.push("<td style='width: 5%'>");
                    li.push("<a href='#' class='ui-btn ui-btn-corner-all ui-mini ui-nodisc-icon ui-icon-minus ui-btn-icon-notext' id='UiBotonEntregaParcial-" + demandaDeDespacho.pickingDemandHeaderId + "'></a>");
                    li.push("</td>");
                    li.push("<td style='width: 5%'>");
                    li.push("<a href='#' class='ui-btn ui-btn-corner-all ui-mini ui-nodisc-icon ui-icon-delete ui-btn-icon-notext' id='UiBotonCancelarEntrega-" + demandaDeDespacho.pickingDemandHeaderId + "'></a>");
                    li.push("</td>");
                }
                li.push("</tr>");
                li.push("</table>");
                li.push("</li>");
                uiListDeliveryDoc_1.append(li.join(""));
                li = null;
                documento = null;
                estado = null;
            });
            uiListDeliveryDoc_1.listview("refresh");
            uiListDeliveryDoc_1 = null;
            this.cambiarFocus("UiBtnMostrarTabEntregaDocumentos");
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaDetalleControlador.prototype.consolidarListaDeDespacho = function (listaDemandaDeDespachos, callback, errorCallback) {
        try {
            var listaDemandaDeDespachoConsolidado_1 = [];
            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode, function (listaDemandaDeDespacho) {
                listaDemandaDeDespacho.map(function (demandaDeDespacho) {
                    if (demandaDeDespacho.processStatus !== EstadoEntrega.Cancelada.toString() &&
                        demandaDeDespacho.processStatus !== EstadoEntrega.Entregado.toString()) {
                        demandaDeDespacho.detalleDeDemandaDeDespacho
                            .map(function (demandaDeDespachoDetalle) {
                            var resultadoDetalleParaMuestra = listaDemandaDeDespachoConsolidado_1.find(function (detalle) {
                                return demandaDeDespachoDetalle.materialId === detalle.materialId;
                            });
                            if (resultadoDetalleParaMuestra) {
                                resultadoDetalleParaMuestra.qty += demandaDeDespachoDetalle.qty;
                            }
                            else {
                                listaDemandaDeDespachoConsolidado_1.push(demandaDeDespachoDetalle);
                            }
                            resultadoDetalleParaMuestra = null;
                        });
                    }
                });
                callback(listaDemandaDeDespachoConsolidado_1);
            }, function (error) {
                notify("Error al obtener los documentos de entrega: " + error.mensaje);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaDetalleControlador.prototype.generarListadoDeDocumentosDeEntregaConsolidado = function (errorCallback) {
        try {
            var uiListConsolidateDelebery_1 = $("#UiListConsolidateDelebery");
            uiListConsolidateDelebery_1.children().remove("li");
            this.listaDemandaDeDespachoConsolidado.map(function (demandaDeDespachoDetalle) {
                var li = [];
                li.push("<li class=\"ui-field-contain\" data-theme=\"b\" style=\"text-align: left\">");
                li.push("<span class='medium'>C\u00F3digo: " + demandaDeDespachoDetalle.materialId + "</span><br />");
                li.push("<span class='small'>" + demandaDeDespachoDetalle.materialDescription + "</span><br />");
                li.push("<span class='medium'>Cantidad: " + demandaDeDespachoDetalle.qty + "</span><br />");
                li.push("</li>");
                uiListConsolidateDelebery_1.append(li.join(""));
                li = null;
            });
            uiListConsolidateDelebery_1.listview("refresh");
            uiListConsolidateDelebery_1 = null;
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaDetalleControlador.prototype.irAPantalla = function (pantalla) {
        $.mobile.changePage("#" + pantalla, {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };
    EntregaDetalleControlador.prototype.usuarioSeleccionoDocumento = function (id) {
        try {
            var opcionControl = id.split('-')[0];
            var pickingDemandHeaderId = parseInt(id.split("-")[1]);
            esEntregaParcial = false;
            if (this.elPedidoNotEstaCancelado(pickingDemandHeaderId)) {
                esFacturaDeEntrega = true;
                gDiscount = 0;
                switch (opcionControl) {
                    case "UiBotonEntrega":
                        esEntregaPorDocumento = true;
                        this.entregaCompletaDeEntrega(pickingDemandHeaderId);
                        break;
                    case "UiBotonEntregaParcial":
                        esEntregaParcial = true;
                        this.entregaParcialDeEntrega(pickingDemandHeaderId);
                        break;
                    case "UiBotonCancelarEntrega":
                        this.cancelarDocumentoEntrega(pickingDemandHeaderId);
                        break;
                }
                opcionControl = null;
                pickingDemandHeaderId = null;
            }
        }
        catch (e) {
            esFacturaDeEntrega = false;
            notify("Error cuando el usuario selecciono documento: " + e.message);
        }
    };
    EntregaDetalleControlador.prototype.documentoNoEstaCompletadoOCancelado = function (demandaDeDespacho) {
        return demandaDeDespacho.processStatus != EstadoEntrega.Entregado.toString() && demandaDeDespacho.processStatus != EstadoEntrega.Cancelada.toString();
    };
    EntregaDetalleControlador.prototype.cancelarDocumentoEntrega = function (pickingDemandHeaderId) {
        var _this = this;
        try {
            var demandaDeDespachoAFacturar_1 = this.listaDemandaDeDespachos.find(function (demandaDeDespacho) {
                return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
            });
            if (demandaDeDespachoAFacturar_1) {
                var documento = (demandaDeDespachoAFacturar_1.erpReferenceDocNum !== "null")
                    ? demandaDeDespachoAFacturar_1.erpReferenceDocNum
                    : demandaDeDespachoAFacturar_1.docNum.toString();
                navigator.notification.confirm("\u00BFConfirma cancelar la entrega: " + documento + "?", function (buttonIndex) {
                    if (buttonIndex === 2) {
                        _this.preguntarRazonDeNoEntrega(function (razonDeNoEntrega) {
                            demandaDeDespachoAFacturar_1.reasonCancel = razonDeNoEntrega;
                            _this.cancelarLaEntrega(demandaDeDespachoAFacturar_1, EstadoEntrega.Cancelada.toString(), function () {
                                vieneDeListadoDeDocumentosDeEntrega = true;
                                actualizarEstadoDeTarea(_this.tarea.taskId, 0, "Sin Gestion", function () {
                                    vieneDeListadoDeDocumentosDeEntrega = false;
                                    _this.obtenerDocumentosParaEntrega();
                                }, TareaEstado.Completada);
                            });
                        });
                    }
                }, "Sonda\u00AE " + SondaVersion, ["No", "Si"]);
                documento = null;
            }
        }
        catch (e) {
            notify("Error al cancelar el documento de entrega: " + e.message);
        }
    };
    EntregaDetalleControlador.prototype.entregaCompletaDeEntrega = function (pickingDemandHeaderId) {
        var _this = this;
        try {
            var demandaDeDespachoAFacturar = this.listaDemandaDeDespachos
                .find(function (demandaDeDespacho) {
                return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
            });
            if (demandaDeDespachoAFacturar) {
                if (this.documentoNoEstaCompletadoOCancelado(demandaDeDespachoAFacturar)) {
                    demandaDeDespachoEnProcesoDeEntrega = demandaDeDespachoAFacturar;
                    esEntregaParcial = (demandaDeDespachoEnProcesoDeEntrega.processStatus === EstadoEntrega.Parcial.toString());
                    if (esEntregaParcial) {
                        var detalleTemporal = demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho.filter(this.productoNoEsBonificacion);
                        demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho = detalleTemporal;
                        detalleTemporal.map(function (demandaDeDespachoDetalle) {
                            demandaDeDespachoDetalle.discount = 0;
                        });
                    }
                    gDiscount = demandaDeDespachoAFacturar.discount;
                    this.entregaServicio
                        .agregarDetalleCompletoDeDemandaDeDespachoAFacturacion(demandaDeDespachoAFacturar
                        .detalleDeDemandaDeDespacho, function () {
                        vieneDeListadoDeDocumentosDeEntrega = true;
                        _this.irAPantalla("pos_skus_page");
                    }, function (error) {
                        notify(error.mensaje);
                    });
                }
                else {
                    notify("El documento solicitado ya fue procesado...");
                }
            }
            else {
                notify("No se encontro el documento solicitado.");
            }
        }
        catch (e) {
            notify("Error en la entrega completa: " + e.message);
        }
    };
    EntregaDetalleControlador.prototype.elPedidoNotEstaCancelado = function (pickingDemandHeaderId) {
        try {
            var demandaDeDespachoAFacturar = this.listaDemandaDeDespachos
                .find(function (demandaDeDespacho) {
                return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
            });
            if (demandaDeDespachoAFacturar) {
                return (demandaDeDespachoAFacturar.processStatus !== EstadoEntrega.Cancelada.toString());
            }
            else {
                return false;
            }
        }
        catch (e) {
            notify("Error en la entrega completa: " + e.message);
            return false;
        }
    };
    EntregaDetalleControlador.prototype.productoNoEsBonificacion = function (producto) {
        return producto.isBonus == SiNo.No;
    };
    EntregaDetalleControlador.prototype.entregaParcialDeEntrega = function (pickingDemandHeaderId) {
        var _this = this;
        try {
            var demandaDeDespachoAFacturar_2 = this.listaDemandaDeDespachos
                .find(function (demandaDeDespacho) {
                return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
            });
            var documento = (demandaDeDespachoAFacturar_2.erpReferenceDocNum !== "null")
                ? demandaDeDespachoAFacturar_2.erpReferenceDocNum
                : demandaDeDespachoAFacturar_2.docNum.toString();
            if (demandaDeDespachoAFacturar_2) {
                if (this.documentoNoEstaCompletadoOCancelado(demandaDeDespachoAFacturar_2)) {
                    navigator.notification.confirm("\u00BFConfirma realizar la entrega parcial.(Esto cancelara la entrega original): " + documento + "?", function (buttonIndex) {
                        if (buttonIndex === 2) {
                            _this.preguntarRazonDeNoEntrega(function (razonDeNoEntrega) {
                                demandaDeDespachoAFacturar_2.reasonCancel = razonDeNoEntrega;
                                _this.cancelarLaEntrega(demandaDeDespachoAFacturar_2, EstadoEntrega.Parcial.toString(), function () {
                                    var detalleTemporal = demandaDeDespachoAFacturar_2.detalleDeDemandaDeDespacho.filter(_this.productoNoEsBonificacion);
                                    detalleTemporal.map(function (demandaDeDespachoDetalle) {
                                        demandaDeDespachoDetalle.discount = 0;
                                    });
                                    demandaDeDespachoAFacturar_2.detalleDeDemandaDeDespacho = detalleTemporal;
                                    demandaDeDespachoEnProcesoDeEntrega = demandaDeDespachoAFacturar_2;
                                    _this.entregaServicio.agregarDetalleCompletoDeDemandaDeDespachoAFacturacion(demandaDeDespachoAFacturar_2
                                        .detalleDeDemandaDeDespacho, function () {
                                        vieneDeListadoDeDocumentosDeEntrega = true;
                                        _this.irAPantalla("pos_skus_page");
                                    }, function (error) {
                                        notify(error.mensaje);
                                    });
                                });
                            });
                        }
                    }, "Sonda\u00AE " + SondaVersion, ["No", "Si"]);
                }
                else {
                    notify("El documento solicitado ya fue procesado...");
                }
            }
            else {
                notify("No se encontro el documento solicitado.");
            }
        }
        catch (e) {
            notify("Error en la entrega completa: " + e.message);
        }
    };
    EntregaDetalleControlador.prototype.cancelarLaEntrega = function (demandaDeDespachoAFacturar, estadoEntrega, callback) {
        var _this = this;
        try {
            PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.EntregaCancelada, function (secuenciaValida) {
                if (secuenciaValida) {
                    PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.EntregaCancelada, function (docSerie, docNum) {
                        _this.entregaServicio.insertarEntregaCancelada(demandaDeDespachoAFacturar, docSerie, docNum, function () {
                            PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.EntregaCancelada, docNum, function () {
                                _this.entregaServicio.cambiarEstadoDeDocumentoEntrega(demandaDeDespachoAFacturar.pickingDemandHeaderId, estadoEntrega, function () {
                                    var facturaEnRuta = (localStorage.getItem("INVOICE_IN_ROUTE") === "1");
                                    if (facturaEnRuta) {
                                        _this.entregaServicio
                                            .agregarSkuAInvnetarioCancelado(demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho, function () {
                                            callback();
                                        }, function (error) {
                                            notify(error.mensaje);
                                        });
                                    }
                                    else {
                                        callback();
                                    }
                                }, function (resultado) {
                                    notify(resultado.mensaje);
                                });
                            }, function (resultado) {
                                notify(resultado);
                            });
                        }, function (resultado) {
                            notify(resultado.mensaje);
                        });
                    }, function (error) {
                        notify("Error al obtener la secuena de documentos: " + error);
                    });
                }
                else {
                    notify("\"ErrorUsted no cuenta con secuencia de documentos v\u00E1lida para cancelar entregas, por favor, comun\u00EDquese con su administrador.");
                }
            }, function (error) {
                notify("Error al validar la secuena de documentos: " + error);
            });
        }
        catch (e) {
            notify("Error al cancelar el documento de entrega: " + e.message);
        }
    };
    EntregaDetalleControlador.prototype.cambiarFocus = function (identificadorDeBoton) {
        var boton = $("#" + identificadorDeBoton);
        switch (identificadorDeBoton) {
            case "UiBtnMostrarTabEntregaDocumentos":
                boton.click();
                boton = null;
                break;
            case "UiBtnMostrarTabEntregaConsolidado":
                boton.click();
                boton = null;
                break;
        }
    };
    EntregaDetalleControlador.prototype.consolidarListaDeDespachoParaProcesoDeEntrega = function (callback) {
        try {
            var listaDeDespachoParaProcesoDeEntrega_1 = [];
            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode, function (listaDemandaDeDespachos) {
                listaDemandaDeDespachos.map(function (demandaDeDespacho) {
                    if (demandaDeDespacho.processStatus !== EstadoEntrega.Cancelada.toString() &&
                        demandaDeDespacho.processStatus !== EstadoEntrega.Entregado.toString()) {
                        demandaDeDespacho.detalleDeDemandaDeDespacho
                            .map(function (demandaDeDespachoDetalle) {
                            var resultadoDetalle = listaDeDespachoParaProcesoDeEntrega_1
                                .find(function (detalle) {
                                return demandaDeDespachoDetalle.materialId === detalle.materialId && demandaDeDespachoDetalle.pickingDemandHeaderId === detalle.pickingDemandHeaderId;
                            });
                            if (resultadoDetalle) {
                                if (resultadoDetalle.isBonus) {
                                    if (demandaDeDespachoDetalle.isBonus == 1) {
                                        resultadoDetalle.qty += demandaDeDespachoDetalle.qty;
                                    }
                                    else {
                                        listaDeDespachoParaProcesoDeEntrega_1.push(demandaDeDespachoDetalle);
                                    }
                                }
                                else {
                                    if (demandaDeDespachoDetalle.isBonus == 1) {
                                        listaDeDespachoParaProcesoDeEntrega_1.push(demandaDeDespachoDetalle);
                                    }
                                    else {
                                        if (resultadoDetalle.discount == demandaDeDespachoDetalle.discount &&
                                            resultadoDetalle.price == demandaDeDespachoDetalle.price) {
                                            resultadoDetalle.qty += demandaDeDespachoDetalle.qty;
                                        }
                                        else {
                                            listaDeDespachoParaProcesoDeEntrega_1.push(demandaDeDespachoDetalle);
                                        }
                                    }
                                }
                            }
                            else {
                                listaDeDespachoParaProcesoDeEntrega_1.push(demandaDeDespachoDetalle);
                            }
                            resultadoDetalle = null;
                        });
                    }
                });
                callback(listaDeDespachoParaProcesoDeEntrega_1);
            }, function (error) {
                notify("Error al obtener los documentos de entrega: " + error.mensaje);
            });
        }
        catch (e) {
            notify(e.message);
        }
    };
    EntregaDetalleControlador.prototype.limpiarVariables = function () {
        this.listaDemandaDeDespachos.length = 0;
        this.listaDeDemandaDeDespachoParaProcesoDeEntrega.length = 0;
        this.listaDemandaDeDespachoConsolidado.length = 0;
    };
    EntregaDetalleControlador.prototype.tieneProductosParaEntrega = function () { return this.listaDeDemandaDeDespachoParaProcesoDeEntrega.length > 0; };
    EntregaDetalleControlador.prototype.generarDetalleDeEntregaConsolidada = function () {
        var _this = this;
        this.publicarListaDeDetallesConsolidadosParaProcesoDeEntrega(this.listaDeDemandaDeDespachoParaProcesoDeEntrega);
        listaDeDemandasDeDespachoEnProcesoDeEntrega = this.listaDemandaDeDespachos;
        esEntregaParcial = false;
        esEntregaConsolidada = true;
        esEntregaPorDocumento = false;
        vieneDeListadoDeDocumentosDeEntrega = true;
        esFacturaDeEntrega = true;
        this.entregaServicio
            .agregarDetalleCompletoDeDemandaDeDespachoAFacturacion(this.listaDeDemandaDeDespachoParaProcesoDeEntrega, function () {
            _this.irAPantalla("pos_skus_page");
        }, function (resultado) {
            notify("No se ha podido agregar el detalle de la demanda de despacho al proceso de entrega debido a: " + resultado.mensaje);
        });
    };
    EntregaDetalleControlador.prototype.publicarListaDeDetallesConsolidadosParaProcesoDeEntrega = function (listaDeDemandaDeDespachoParaProcesoDeEntrega) {
        var message = new ListaDeDetalleDeDemandaDeDespachoConsolidadoMensaje(this);
        message.listaDeDetalleDeDemandaDeDespachoConsolidado = listaDeDemandaDeDespachoParaProcesoDeEntrega;
        this.mensajero.publish(message, getType(ListaDeDetalleDeDemandaDeDespachoConsolidadoMensaje));
    };
    EntregaDetalleControlador.prototype.preguntarRazonDeNoEntrega = function (callback) {
        var _this = this;
        try {
            this.entregaServicio.obtenerRazonesDeNoEntrega(function (razonesDeNoEntrega) {
                var listaRazones = [];
                razonesDeNoEntrega.map(function (razon) {
                    listaRazones.push({ text: razon.nameClassification, value: razon.nameClassification });
                });
                var configOptions = {
                    title: "¿Por qué cancela el documento?: ",
                    items: listaRazones,
                    doneButtonLabel: "OK",
                    cancelButtonLabel: "CANCELAR"
                };
                window.plugins.listpicker.showPicker(configOptions, function (item) {
                    callback(item);
                }, function (error) {
                    if (!_this.esErrorPorDefecto(error)) {
                        notify("No se han podido obtener las razones de no entrega debido a: " + error);
                    }
                });
            }, function (error) {
                notify("No se han podido obtener las razones de no entrega debido a: " + error.mensaje);
            });
        }
        catch (e) {
            notify("No se han podido obtener las razones de no entrega debido a: " + e.message);
        }
    };
    EntregaDetalleControlador.prototype.prepararInformacionDeCanastas = function () {
        var _this = this;
        try {
            this.verificarParametroParaMostrarCanastas(function (muestraCanastas) {
                if (muestraCanastas) {
                    var uiLiTabCanastas = $("#UiLiTabCanastas");
                    uiLiTabCanastas.css('width', '33%');
                    var uiLiTabEntregaConsolidado = $("#UiLiTabEntregaConsolidado");
                    uiLiTabEntregaConsolidado.css('width', '33%');
                    var uiLiTabEntregaDocumentos = $("#UiLiTabEntregaDocumentos");
                    uiLiTabEntregaDocumentos.css('width', '33%');
                    var listaDeDespachoConCanastas_1 = [];
                    _this.entregaServicio.obtenerDocumentosParaEntrega(_this.tarea.relatedClientCode, function (listaDemandaDeDespachos) {
                        listaDemandaDeDespachos.map(function (demandaDeDespacho) {
                            _this.entregaServicio.obtenerInformacionDeCanastas(demandaDeDespacho.docNum, function (demandaDeDespachoConCanastas) {
                                listaDeDespachoConCanastas_1.push(demandaDeDespachoConCanastas);
                                _this.crearListaDeDespachosConCanastas(listaDeDespachoConCanastas_1, function (resultado) {
                                    notify("Error al crear lista de despachos con canastas: " + resultado.mensaje);
                                });
                            }, function (resultado) {
                                notify("Error al obtener informacion de canastas: " + resultado.mensaje);
                            });
                        });
                    }, function (error) {
                        notify("Error al obtener los documentos de entrega: " + error.mensaje);
                    });
                }
            }, function (error) { notify("Error al verificar parametro para mostrar canastas: " + error); });
        }
        catch (e) {
            notify("Error al preparar informacion de canastas: " + e.message);
        }
    };
    EntregaDetalleControlador.prototype.crearListaDeDespachosConCanastas = function (listaDeDespachoConCanastas, errorCallBack) {
        try {
            var uiListaCanastas_1 = $("#UiListaCanastas");
            uiListaCanastas_1.children().remove("li");
            listaDeDespachoConCanastas.map(function (demandaDeDespacho) {
                var documento = (!demandaDeDespacho.erpReferenceDocNum && demandaDeDespacho.erpReferenceDocNum !== "null")
                    ? demandaDeDespacho.erpReferenceDocNum
                    : demandaDeDespacho.docNum.toString();
                if (documento) {
                    var li_1 = [];
                    li_1.push("<li class='ui-field-contain' data-theme='a' style='text-align: left'>");
                    li_1.push("<h4> " + documento + "</h4>");
                    demandaDeDespacho.canastas.map(function (canasta) {
                        li_1.push("<p>" + canasta.barcode + "</p>");
                    });
                    li_1.push("</li>");
                    uiListaCanastas_1.append(li_1.join(""));
                    li_1 = null;
                }
            });
        }
        catch (e) {
            notify("Error al crear lista de despachos con canastas: " + e.mensaje);
        }
    };
    EntregaDetalleControlador.prototype.verificarParametroParaMostrarCanastas = function (callBack, errorCallBack) {
        ParametroServicio.ObtenerParametro("DELIVERY", "SHOW_BASKETS_OF_MANIFEST", function (parametro) {
            if (parametro.Value == 1) {
                callBack(true);
            }
            else {
                callBack(false);
            }
        }, function (error) {
            callBack(false);
        });
    };
    EntregaDetalleControlador.prototype.esErrorPorDefecto = function (error) {
        return error == "Error";
    };
    return EntregaDetalleControlador;
}());
//# sourceMappingURL=EntregaDetalleControlador.js.map