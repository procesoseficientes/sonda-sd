class EntregaDetalleControlador {

    tokenTarea: SubscriptionToken;
    tarea: Tarea = new Tarea();
    entregaServicio: EntregaServicio = new EntregaServicio();
    listaDemandaDeDespachos: DemandaDeDespachoEncabezado[] = [];
    listaDemandaDeDespachoConsolidado: DemandaDeDespachoDetalle[] = [];
    listaDeDemandaDeDespachoParaProcesoDeEntrega: DemandaDeDespachoDetalle[] = [];

    constructor(public mensajero: Messenger) {
        this.tokenTarea = mensajero.subscribe<TareaMensaje>(this.tareaMensajeEntregado, getType(TareaMensaje), this);
    }

    delegarEntregaControlador() {
        const este: EntregaDetalleControlador = this;

        $("#UiDeliveryDetailPage").on("pageshow", () => {
            vieneDeListadoDeDocumentosDeEntrega = true;
            este.obtenerTareaPorCodigoYTipo();
        });

        $("#UiDeliveryDetailPage").on("click",
            "#UiListDeleberyDoc a",
            (event) => {
                let id = (<any>event).currentTarget.attributes["id"].nodeValue;
                este.usuarioSeleccionoDocumento(id.toString());
                id = null;
            });

        $("#UiBtnConsolidateDelivery").on("click", () => {
            if (!this.tieneProductosParaEntrega()) {
                notify(`No se ha encontrado información suficiente para generar el detalle de la entrega, por favor, verifique y vuelva a intentar.`);
            } else {
                this.generarDetalleDeEntregaConsolidada();
            }
        });

    }

    tareaMensajeEntregado(message: TareaMensaje, subscriber: any) {
        subscriber.tarea = message.tarea;
    };

    obtenerTareaPorCodigoYTipo() {
        TareaServicio.obtenerTareaPorCodigoYTipo(this.tarea.taskId, this.tarea.taskType, (tarea) => {
            this.tarea = tarea;
            let uiCodeClient = $("#UiCodeClient");
            uiCodeClient.text(tarea.relatedClientCode);
            uiCodeClient = null;
            let uiNameClient = $("#UiNameClient");
            uiNameClient.text(tarea.relatedClientName);
            uiNameClient = null;
            let txtNIT = $("#txtNIT");
            txtNIT.val(this.tarea.nit);
            txtNIT = null;
            let txtNombre = $("#txtNombre");
            txtNombre.val(this.tarea.relatedClientName);
            txtNombre = null;
            let txtVuelto_summ = $("#txtVuelto_summ");
            txtVuelto_summ.text("0");
            txtVuelto_summ = null;

            this.listaDemandaDeDespachos = [];
            this.obtenerDocumentosParaEntrega();

        }, (error) => {
            notify("Error al obtener tarea de entrega: " + error.message);
        });
    }


    obtenerDocumentosParaEntrega() {
        try {
            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode, (listaDemandaDeDespachos: DemandaDeDespachoEncabezado[]) => {
                this.listaDemandaDeDespachos = listaDemandaDeDespachos;

                this.listaDemandaDeDespachoConsolidado = [];
                this.consolidarListaDeDespacho([], (listaDemandaDeDespachoConsolidado: DemandaDeDespachoDetalle[]) => {
                    this.listaDemandaDeDespachoConsolidado = listaDemandaDeDespachoConsolidado;
                    this.generarListadoDeDocumentosDeEntrega((error: Operacion) => {
                        notify("Error al generar el listado de entrega: " + error.mensaje);
                    });

                    this.generarListadoDeDocumentosDeEntregaConsolidado((error: Operacion) => {
                        notify("Error al generar el listado de entrega consolidado: " + error.mensaje);
                    });

                    this.consolidarListaDeDespachoParaProcesoDeEntrega((listaDeDemandaDeDespachoParaProcesoDeEntrega: DemandaDeDespachoDetalle[]) => {
                        this.listaDeDemandaDeDespachoParaProcesoDeEntrega = listaDeDemandaDeDespachoParaProcesoDeEntrega;
                    });

                    this.prepararInformacionDeCanastas();

                }, (error: Operacion) => {
                    notify("Error al generar el listado conslidado de entrega: " + error.mensaje);
                });
            }, (error: Operacion) => {
                notify("Error al obtener los documentos de entrega: " + error.mensaje);
            });
        } catch (e) {
            notify("Error al obtener Documentos Para Entrega" + e.message);
        }
    }

    generarListadoDeDocumentosDeEntrega(errorCallback: (error: Operacion) => void) {
        try {
            let uiListDeliveryDoc = $("#UiListDeleberyDoc");
            uiListDeliveryDoc.children().remove("li");

            this.listaDemandaDeDespachos.map((demandaDeDespacho: DemandaDeDespachoEncabezado) => {

                let documento: string = (!demandaDeDespacho.erpReferenceDocNum && demandaDeDespacho.erpReferenceDocNum !== "null")
                    ? demandaDeDespacho.erpReferenceDocNum
                    : demandaDeDespacho.docNum.toString();

                let estado: string = "";
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

                let li: string[] = [];
                li.push(`<li class='ui-field-contain' data-theme='a' style='text-align: left'>`);
                li.push(`<table>`);
                li.push(`<tr>`);
                li.push(`<td style='width: 90%'>`);
                li.push(`<a data-role='button' id='UiBotonEntrega-${demandaDeDespacho
                    .pickingDemandHeaderId}'>${documento}/${estado}</a>`);
                li.push(`</td>`);
                if (demandaDeDespacho.processStatus !== EstadoEntrega.Cancelada.toString() && demandaDeDespacho.processStatus !== EstadoEntrega.Entregado.toString() && demandaDeDespacho.processStatus !== EstadoEntrega.Parcial.toString()) {
                    li.push(`<td style='width: 5%'>`);
                    li.push(`<a href='#' class='ui-btn ui-btn-corner-all ui-mini ui-nodisc-icon ui-icon-minus ui-btn-icon-notext' id='UiBotonEntregaParcial-${demandaDeDespacho.pickingDemandHeaderId}'></a>`);
                    li.push(`</td>`);
                    li.push(`<td style='width: 5%'>`);
                    li.push(`<a href='#' class='ui-btn ui-btn-corner-all ui-mini ui-nodisc-icon ui-icon-delete ui-btn-icon-notext' id='UiBotonCancelarEntrega-${demandaDeDespacho.pickingDemandHeaderId}'></a>`);
                    li.push(`</td>`);
                }
                li.push(`</tr>`);
                li.push(`</table>`);
                li.push(`</li>`);
                uiListDeliveryDoc.append(li.join(""));
                li = null;
                documento = null;
                estado = null;
            });
            uiListDeliveryDoc.listview("refresh");
            uiListDeliveryDoc = null;
            this.cambiarFocus("UiBtnMostrarTabEntregaDocumentos");
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    consolidarListaDeDespacho(listaDemandaDeDespachos: DemandaDeDespachoEncabezado[], callback: (listaDemandaDeDespachoConsolidado: DemandaDeDespachoDetalle[]) => void, errorCallback: (error: Operacion) => void) {
        try {

            let listaDemandaDeDespachoConsolidado: DemandaDeDespachoDetalle[] = [];

            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode,
                (listaDemandaDeDespacho: DemandaDeDespachoEncabezado[]) => {

                    listaDemandaDeDespacho.map((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                        if (demandaDeDespacho.processStatus !== EstadoEntrega.Cancelada.toString() &&
                            demandaDeDespacho.processStatus !== EstadoEntrega.Entregado.toString()) {
                            demandaDeDespacho.detalleDeDemandaDeDespacho
                                .map((demandaDeDespachoDetalle: DemandaDeDespachoDetalle) => {

                                    // ReSharper disable once TsResolvedFromInaccessibleModule
                                    let resultadoDetalleParaMuestra: DemandaDeDespachoDetalle =
                                        (listaDemandaDeDespachoConsolidado as any).find((detalle: DemandaDeDespachoDetalle) => {
                                            return demandaDeDespachoDetalle.materialId === detalle.materialId;
                                        });

                                    if (resultadoDetalleParaMuestra) {
                                        resultadoDetalleParaMuestra.qty += demandaDeDespachoDetalle.qty;
                                    } else {
                                        listaDemandaDeDespachoConsolidado.push(demandaDeDespachoDetalle);
                                    }
                                    resultadoDetalleParaMuestra = null;


                                });
                        }
                    });

                    callback(listaDemandaDeDespachoConsolidado);
                },
                (error: Operacion) => {
                    notify("Error al obtener los documentos de entrega: " + error.mensaje);
                });

        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    generarListadoDeDocumentosDeEntregaConsolidado(errorCallback: (error: Operacion) => void) {
        try {
            let uiListConsolidateDelebery = $("#UiListConsolidateDelebery");
            uiListConsolidateDelebery.children().remove("li");

            this.listaDemandaDeDespachoConsolidado.map((demandaDeDespachoDetalle: DemandaDeDespachoDetalle) => {
                let li: string[] = [];
                li.push(`<li class="ui-field-contain" data-theme="b" style="text-align: left">`);
                li.push(`<span class='medium'>Código: ${demandaDeDespachoDetalle.materialId}</span><br />`);
                li.push(`<span class='small'>${demandaDeDespachoDetalle.materialDescription}</span><br />`);
                li.push(`<span class='medium'>Cantidad: ${demandaDeDespachoDetalle.qty}</span><br />`);
                li.push(`</li>`);
                uiListConsolidateDelebery.append(li.join(""));
                li = null;
            });
            uiListConsolidateDelebery.listview("refresh");
            uiListConsolidateDelebery = null;
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    irAPantalla(pantalla: string) {

        $.mobile.changePage(`#${pantalla}`,
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
    }

    usuarioSeleccionoDocumento(id: string) {
        try {
            let opcionControl: string = id.split('-')[0];
            let pickingDemandHeaderId: number = parseInt(id.split("-")[1]);

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            esEntregaParcial = false;

            if (this.elPedidoNotEstaCancelado(pickingDemandHeaderId)) {
                // ReSharper disable once AssignToImplicitGlobalInFunctionScope
                esFacturaDeEntrega = true;
                gDiscount = 0;
                switch (opcionControl) {
                    case "UiBotonEntrega":

                        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
                        esEntregaPorDocumento = true;
                        this.entregaCompletaDeEntrega(pickingDemandHeaderId);
                        break;

                    case "UiBotonEntregaParcial":
                        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
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

        } catch (e) {
            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            esFacturaDeEntrega = false;
            notify("Error cuando el usuario selecciono documento: " + e.message);
        }
    }

    documentoNoEstaCompletadoOCancelado(demandaDeDespacho: DemandaDeDespachoEncabezado) {
        return demandaDeDespacho.processStatus != EstadoEntrega.Entregado.toString() && demandaDeDespacho.processStatus != EstadoEntrega.Cancelada.toString();
    }

    cancelarDocumentoEntrega(pickingDemandHeaderId: number) {
        try {
            let demandaDeDespachoAFacturar: DemandaDeDespachoEncabezado = (this.listaDemandaDeDespachos as any).find((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
            });

            if (demandaDeDespachoAFacturar) {

                let documento: string = (demandaDeDespachoAFacturar.erpReferenceDocNum !== "null")
                    ? demandaDeDespachoAFacturar.erpReferenceDocNum
                    : demandaDeDespachoAFacturar.docNum.toString();

                navigator.notification.confirm(
                    `¿Confirma cancelar la entrega: ${documento}?`,
                    (buttonIndex) => {
                        if (buttonIndex === 2) {
                            this.preguntarRazonDeNoEntrega((razonDeNoEntrega) => {
                                demandaDeDespachoAFacturar.reasonCancel = razonDeNoEntrega;
                                this.cancelarLaEntrega(demandaDeDespachoAFacturar, EstadoEntrega.Cancelada.toString(), () => {
                                    vieneDeListadoDeDocumentosDeEntrega = true;
                                    actualizarEstadoDeTarea(this.tarea.taskId, 0, "Sin Gestion", () => {
                                        vieneDeListadoDeDocumentosDeEntrega = false;
                                        this.obtenerDocumentosParaEntrega();
                                    }, TareaEstado.Completada);
                                });
                            });


                        }
                    },
                    `Sonda® ${SondaVersion}`,
                    ["No", "Si"]);
                documento = null;
            }
        } catch (e) {
            notify("Error al cancelar el documento de entrega: " + e.message);
        }
    }

    entregaCompletaDeEntrega(pickingDemandHeaderId: number) {
        try {
            // ReSharper disable once TsResolvedFromInaccessibleModule
            let demandaDeDespachoAFacturar: DemandaDeDespachoEncabezado = (this.listaDemandaDeDespachos as any)
                .find((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                    return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
                });

            if (demandaDeDespachoAFacturar) {

                if (this.documentoNoEstaCompletadoOCancelado(demandaDeDespachoAFacturar)) {
                    // ReSharper disable once AssignToImplicitGlobalInFunctionScope
                    demandaDeDespachoEnProcesoDeEntrega = demandaDeDespachoAFacturar;

                    esEntregaParcial = (demandaDeDespachoEnProcesoDeEntrega.processStatus === EstadoEntrega.Parcial.toString());

                    if (esEntregaParcial) {
                        let detalleTemporal = demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho.filter(this.productoNoEsBonificacion);
                        demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho = detalleTemporal;
                        detalleTemporal.map((demandaDeDespachoDetalle: DemandaDeDespachoDetalle) => {
                            demandaDeDespachoDetalle.discount = 0;
                        });
                    }
                    gDiscount = demandaDeDespachoAFacturar.discount;
                    this.entregaServicio
                        .agregarDetalleCompletoDeDemandaDeDespachoAFacturacion(demandaDeDespachoAFacturar
                            .detalleDeDemandaDeDespacho,
                        () => {
                            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
                            vieneDeListadoDeDocumentosDeEntrega = true;
                            this.irAPantalla("pos_skus_page");
                        },
                        (error) => {
                            notify(error.mensaje);
                        });
                } else {
                    notify(`El documento solicitado ya fue procesado...`);
                }


            } else {
                notify("No se encontro el documento solicitado.");
            }
        } catch (e) {
            notify(`Error en la entrega completa: ${e.message}`);
        }
    }


    elPedidoNotEstaCancelado(pickingDemandHeaderId: number) {
        try {
            let demandaDeDespachoAFacturar: DemandaDeDespachoEncabezado = (this.listaDemandaDeDespachos as any)
                .find((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                    return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
                });

            if (demandaDeDespachoAFacturar) {
                return (demandaDeDespachoAFacturar.processStatus !== EstadoEntrega.Cancelada.toString());
            } else {
                return false;
            }
        } catch (e) {
            notify("Error en la entrega completa: " + e.message);
            return false;
        }
    }

    productoNoEsBonificacion(producto: DemandaDeDespachoDetalle) {
        return producto.isBonus == SiNo.No;
    }

    entregaParcialDeEntrega(pickingDemandHeaderId: number) {
        try {
            // ReSharper disable once TsResolvedFromInaccessibleModule
            let demandaDeDespachoAFacturar: DemandaDeDespachoEncabezado = (this.listaDemandaDeDespachos as any)
                .find((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                    return demandaDeDespacho.pickingDemandHeaderId == pickingDemandHeaderId;
                });

            let documento: string = (demandaDeDespachoAFacturar.erpReferenceDocNum !== "null")
                ? demandaDeDespachoAFacturar.erpReferenceDocNum
                : demandaDeDespachoAFacturar.docNum.toString();

            if (demandaDeDespachoAFacturar) {
                if (this.documentoNoEstaCompletadoOCancelado(demandaDeDespachoAFacturar)) {
                    navigator.notification.confirm(
                        `¿Confirma realizar la entrega parcial.(Esto cancelara la entrega original): ${documento}?`,
                        (buttonIndex) => {
                            if (buttonIndex === 2) {
                                this.preguntarRazonDeNoEntrega((razonDeNoEntrega: string) => {
                                    demandaDeDespachoAFacturar.reasonCancel = razonDeNoEntrega;
                                    this.cancelarLaEntrega(demandaDeDespachoAFacturar, EstadoEntrega.Parcial.toString(), () => {

                                        let detalleTemporal = demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho.filter(this.productoNoEsBonificacion);
                                        detalleTemporal.map((demandaDeDespachoDetalle: DemandaDeDespachoDetalle) => {
                                            demandaDeDespachoDetalle.discount = 0;
                                        });

                                        demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho = detalleTemporal;

                                        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
                                        demandaDeDespachoEnProcesoDeEntrega = demandaDeDespachoAFacturar;

                                        this.entregaServicio.agregarDetalleCompletoDeDemandaDeDespachoAFacturacion(demandaDeDespachoAFacturar
                                            .detalleDeDemandaDeDespacho,
                                            () => {
                                                // ReSharper disable once AssignToImplicitGlobalInFunctionScope
                                                vieneDeListadoDeDocumentosDeEntrega = true;
                                                this.irAPantalla("pos_skus_page");
                                            },
                                            (error) => {
                                                notify(error.mensaje);
                                            });
                                    });
                                });

                            }
                        },
                        `Sonda® ${SondaVersion}`,
                        ["No", "Si"]);
                } else {
                    notify(`El documento solicitado ya fue procesado...`);
                }


            } else {
                notify("No se encontro el documento solicitado.");
            }
        } catch (e) {
            notify(`Error en la entrega completa: ${e.message}`);
        }
    }

    cancelarLaEntrega(demandaDeDespachoAFacturar: DemandaDeDespachoEncabezado, estadoEntrega: string, callback: () => void) {
        try {
            PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.EntregaCancelada, (secuenciaValida: boolean) => {
                if (secuenciaValida) {
                    PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.EntregaCancelada, (docSerie: string, docNum: number) => {
                        this.entregaServicio.insertarEntregaCancelada(demandaDeDespachoAFacturar, docSerie, docNum, () => {
                            PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.EntregaCancelada, docNum, () => {
                                this.entregaServicio.cambiarEstadoDeDocumentoEntrega(demandaDeDespachoAFacturar.pickingDemandHeaderId, estadoEntrega,
                                    () => {
                                        let facturaEnRuta: boolean = (localStorage.getItem("INVOICE_IN_ROUTE") === "1");
                                        if (facturaEnRuta) {

                                            this.entregaServicio
                                                .agregarSkuAInvnetarioCancelado(demandaDeDespachoAFacturar.detalleDeDemandaDeDespacho,
                                                () => {
                                                    callback();
                                                },
                                                (error: Operacion) => {
                                                    notify(error.mensaje);
                                                });

                                        } else {
                                            callback();
                                        }
                                    },
                                    (resultado: Operacion) => {
                                        notify(resultado.mensaje);
                                    });
                            }, (resultado: string) => {
                                notify(resultado);
                            });
                        }, (resultado: Operacion) => {
                            notify(resultado.mensaje);
                        });
                    }, (error: string) => {
                        notify(`Error al obtener la secuena de documentos: ${error}`);
                    });
                } else {
                    notify(`"ErrorUsted no cuenta con secuencia de documentos válida para cancelar entregas, por favor, comuníquese con su administrador.`);
                }
            }, (error: string) => {
                notify(`Error al validar la secuena de documentos: ${error}`);
            });
        } catch (e) {
            notify("Error al cancelar el documento de entrega: " + e.message);
        }
    }

    cambiarFocus(identificadorDeBoton: string) {
        let boton = $(`#${identificadorDeBoton}`);
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
    }


    consolidarListaDeDespachoParaProcesoDeEntrega(callback: (listaDeDespachoConsolidadoParaProcesoDeEntrega: DemandaDeDespachoDetalle[]) => void) {
        try {
            let listaDeDespachoParaProcesoDeEntrega: DemandaDeDespachoDetalle[] = [];


            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode,
                (listaDemandaDeDespachos: DemandaDeDespachoEncabezado[]) => {

                    listaDemandaDeDespachos.map((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                        if (demandaDeDespacho.processStatus !== EstadoEntrega.Cancelada.toString() &&
                            demandaDeDespacho.processStatus !== EstadoEntrega.Entregado.toString()) {
                            demandaDeDespacho.detalleDeDemandaDeDespacho
                                .map((demandaDeDespachoDetalle: DemandaDeDespachoDetalle) => {

                                    // ReSharper disable once TsResolvedFromInaccessibleModule
                                    let resultadoDetalle: DemandaDeDespachoDetalle = (listaDeDespachoParaProcesoDeEntrega as any)
                                        .find((detalle: DemandaDeDespachoDetalle) => {
                                            return demandaDeDespachoDetalle.materialId === detalle.materialId && demandaDeDespachoDetalle.pickingDemandHeaderId === detalle.pickingDemandHeaderId;
                                        });

                                    if (resultadoDetalle) {
                                        if (resultadoDetalle.isBonus) {
                                            if (demandaDeDespachoDetalle.isBonus == 1) {
                                                resultadoDetalle.qty += demandaDeDespachoDetalle.qty;
                                            } else {
                                                listaDeDespachoParaProcesoDeEntrega.push(demandaDeDespachoDetalle);
                                            }
                                        } else {
                                            if (demandaDeDespachoDetalle.isBonus == 1) {
                                                listaDeDespachoParaProcesoDeEntrega.push(demandaDeDespachoDetalle);
                                            } else {
                                                if (resultadoDetalle.discount == demandaDeDespachoDetalle.discount &&
                                                    resultadoDetalle.price == demandaDeDespachoDetalle.price) {
                                                    resultadoDetalle.qty += demandaDeDespachoDetalle.qty;
                                                } else {
                                                    listaDeDespachoParaProcesoDeEntrega.push(demandaDeDespachoDetalle);
                                                }
                                            }
                                        }
                                    } else {
                                        listaDeDespachoParaProcesoDeEntrega.push(demandaDeDespachoDetalle);
                                    }
                                    resultadoDetalle = null;
                                });
                        }
                    });
                    callback(listaDeDespachoParaProcesoDeEntrega);

                },
                (error: Operacion) => {
                    notify("Error al obtener los documentos de entrega: " + error.mensaje);
                });
        } catch (e) {
            notify(e.message);
        }
    }

    limpiarVariables() {
        this.listaDemandaDeDespachos.length = 0;
        this.listaDeDemandaDeDespachoParaProcesoDeEntrega.length = 0;
        this.listaDemandaDeDespachoConsolidado.length = 0;
    }

    tieneProductosParaEntrega() { return this.listaDeDemandaDeDespachoParaProcesoDeEntrega.length > 0; }

    generarDetalleDeEntregaConsolidada() {

        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
        this.publicarListaDeDetallesConsolidadosParaProcesoDeEntrega(this.listaDeDemandaDeDespachoParaProcesoDeEntrega);

        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
        listaDeDemandasDeDespachoEnProcesoDeEntrega = this.listaDemandaDeDespachos;

        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
        esEntregaParcial = false;

        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
        esEntregaConsolidada = true;

        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
        esEntregaPorDocumento = false;

        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
        vieneDeListadoDeDocumentosDeEntrega = true;

        // ReSharper disable once AssignToImplicitGlobalInFunctionScope
        esFacturaDeEntrega = true;

        this.entregaServicio
            .agregarDetalleCompletoDeDemandaDeDespachoAFacturacion(this.listaDeDemandaDeDespachoParaProcesoDeEntrega,
            () => {
                this.irAPantalla("pos_skus_page");
            },
            (resultado) => {
                notify(`No se ha podido agregar el detalle de la demanda de despacho al proceso de entrega debido a: ${resultado.mensaje}`);
            });


    }

    publicarListaDeDetallesConsolidadosParaProcesoDeEntrega(listaDeDemandaDeDespachoParaProcesoDeEntrega) {
        let message = new ListaDeDetalleDeDemandaDeDespachoConsolidadoMensaje(this);

        message.listaDeDetalleDeDemandaDeDespachoConsolidado = listaDeDemandaDeDespachoParaProcesoDeEntrega;

        this.mensajero.publish(message, getType(ListaDeDetalleDeDemandaDeDespachoConsolidadoMensaje));
    }

    preguntarRazonDeNoEntrega(callback: (razonDeNoEntrega: string) => void) {
        try {
            this.entregaServicio.obtenerRazonesDeNoEntrega((razonesDeNoEntrega: Clasificacion[]) => {
                let listaRazones = [];
                razonesDeNoEntrega.map((razon) => {
                    listaRazones.push({ text: razon.nameClassification, value: razon.nameClassification });
                });

                let configOptions = {
                    title: "¿Por qué cancela el documento?: ",
                    items: listaRazones,
                    doneButtonLabel: "OK",
                    cancelButtonLabel: "CANCELAR"
                }

                window.plugins.listpicker.showPicker(configOptions,
                    (item) => {
                        callback(item);
                    },
                    (error) => {
                        if (!this.esErrorPorDefecto(error)) {
                            notify(`No se han podido obtener las razones de no entrega debido a: ${error}`);
                        }
                    });

            }, (error: Operacion) => {
                notify(`No se han podido obtener las razones de no entrega debido a: ${error.mensaje}`);
            });
        } catch (e) {
            notify(`No se han podido obtener las razones de no entrega debido a: ${e.message}`);
        }
    }

    prepararInformacionDeCanastas() {
        try {
            this.verificarParametroParaMostrarCanastas((muestraCanastas) => {
                if (muestraCanastas) {

                    let uiLiTabCanastas = $("#UiLiTabCanastas");
                    uiLiTabCanastas.css('width', '33%');
                    let uiLiTabEntregaConsolidado = $("#UiLiTabEntregaConsolidado");
                    uiLiTabEntregaConsolidado.css('width', '33%');
                    let uiLiTabEntregaDocumentos = $("#UiLiTabEntregaDocumentos");
                    uiLiTabEntregaDocumentos.css('width', '33%');

                    let listaDeDespachoConCanastas: DemandaDeDespachoEncabezado[] = [];

                    this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode,
                        (listaDemandaDeDespachos: DemandaDeDespachoEncabezado[]) => {

                            listaDemandaDeDespachos.map((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                                this.entregaServicio.obtenerInformacionDeCanastas(demandaDeDespacho.docNum, (demandaDeDespachoConCanastas) => {
                                    listaDeDespachoConCanastas.push(demandaDeDespachoConCanastas);
                                    this.crearListaDeDespachosConCanastas(listaDeDespachoConCanastas, (resultado: Operacion) => {
                                        notify("Error al crear lista de despachos con canastas: " + resultado.mensaje);
                                    });
                                }, (resultado: Operacion) => {
                                    notify("Error al obtener informacion de canastas: " + resultado.mensaje);
                                });

                            });
                        },
                        (error: Operacion) => {
                            notify("Error al obtener los documentos de entrega: " + error.mensaje);
                        });
                }
            }, (error) => { notify("Error al verificar parametro para mostrar canastas: " + error); });

        } catch (e) {
            notify("Error al preparar informacion de canastas: " + e.message);
        }
    }

    crearListaDeDespachosConCanastas(listaDeDespachoConCanastas: DemandaDeDespachoEncabezado[], errorCallBack: (resultado: Operacion) => void) {
        try {
            let uiListaCanastas = $("#UiListaCanastas");
            uiListaCanastas.children().remove("li");
            listaDeDespachoConCanastas.map((demandaDeDespacho: DemandaDeDespachoEncabezado) => {
                let documento: string = (!demandaDeDespacho.erpReferenceDocNum && demandaDeDespacho.erpReferenceDocNum !== "null")
                    ? demandaDeDespacho.erpReferenceDocNum
                    : demandaDeDespacho.docNum.toString();

                if (documento) {
                    let li: string[] = [];
                    li.push(`<li class='ui-field-contain' data-theme='a' style='text-align: left'>`);
                    li.push(`<h4> ${documento}</h4>`);
                    demandaDeDespacho.canastas.map((canasta: Canasta) => {
                        li.push(`<p>${canasta.barcode}</p>`);
                    });
                    li.push(`</li>`);
                    uiListaCanastas.append(li.join(""));
                    li = null;
                }
            });
        } catch (e) {
            notify("Error al crear lista de despachos con canastas: " + e.mensaje);
        }
    }

    verificarParametroParaMostrarCanastas(callBack: (respuesta: boolean) => void, errorCallBack: (error) => void): void {
        ParametroServicio.ObtenerParametro("DELIVERY", "SHOW_BASKETS_OF_MANIFEST", (parametro) => {
            if (parametro.Value == 1) {
                callBack(true);
            } else {
                callBack(false);
            }
        }, (error) => {
            callBack(false);
        });

    }

    esErrorPorDefecto(error: any) {
        return error == "Error";
    }
}