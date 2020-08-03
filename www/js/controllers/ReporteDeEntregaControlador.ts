class ReporteDeEntregaControlador {

    reporteDeEntregaServicio: ReporteDeEntregasServicio = new ReporteDeEntregasServicio();
    entregaServicio: EntregaServicio = new EntregaServicio();

    listadoDeEntregasParaReporte: any = {
        entregasProcesadas: new Array<DemandaDeDespachoEncabezado>(),
        entregasPendientes: new Array<DemandaDeDespachoEncabezado>(),
        entregasCanceladas: new Array<DemandaDeDespachoEncabezado>()
    };

    configuracionDeDecimales: ManejoDeDecimales;

    manejoDeDecimalesServicio: ManejoDeDecimalesServicio = new ManejoDeDecimalesServicio();

    simboloDeMoneda: string;

    usuarioFacturaEnRuta: boolean;

    constructor(public mensajero: Messenger) {

    }

    delegarReporteDeEntregaControlador() {

        $("#UiDeliveryReportPage").on("pageshow",
            () => {
                this.manejoDeDecimalesServicio
                    .obtenerInformacionDeManejoDeDecimales((configuracionDeDecimales: ManejoDeDecimales) => {
                        this.configuracionDeDecimales = configuracionDeDecimales;
                        this.simboloDeMoneda = localStorage.getItem("CURRENCY_SYMBOL")
                            ? localStorage.getItem("CURRENCY_SYMBOL")
                            : "Q";
                        this.usuarioFacturaEnRuta = localStorage.getItem("INVOICE_IN_ROUTE")
                            ? localStorage.getItem("INVOICE_IN_ROUTE") == "1"
                            : false;
                        this.obtenerListasDeEntregas();
                    });

            });

        $("#UiBtnBackFromDeliveryReport").on("click",
            () => {
                this.irAPantalla("menu_page");
            });

        $("#UiDeliveryReportPage").on("click", "#UiContEntregasProcesadas a",
            (e) => {
                let identificadorDeNotaDeEntrega = (e as any).currentTarget.attributes["id"].nodeValue;
                this.usuarioDeseaAnularEntrega(identificadorDeNotaDeEntrega);
            });
    }

    irAPantalla(pantalla: string) {
        $.mobile.changePage(`#${pantalla}`,
        {
            transition: "none",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }

    obtenerListasDeEntregas() {
        try {
            this.limpiarObjetosDeListadoDeEntregas(() => {
                this.reporteDeEntregaServicio
                    .obtenerEntregasProcesadas((entregasProcesadas: DemandaDeDespachoEncabezado[]) => {
                            this.listadoDeEntregasParaReporte.entregasProcesadas = entregasProcesadas;
                            this.reporteDeEntregaServicio
                                .obtenerEntregasPendientes((entregasPendientes: DemandaDeDespachoEncabezado[]) => {
                                        this.listadoDeEntregasParaReporte.entregasPendientes = entregasPendientes;
                                        this.reporteDeEntregaServicio
                                            .obtenerEntregasCanceladas((entregasCanceladas: DemandaDeDespachoEncabezado[
                                                    ]) => {
                                                    this.listadoDeEntregasParaReporte
                                                        .entregasCanceladas = entregasCanceladas;

                                                    this.generarListadoDeEntregas();

                                                },
                                                (resultado: Operacion) => {
                                                    notify(resultado.mensaje);
                                                });
                                    },
                                    (resultado: Operacion) => {
                                        notify(resultado.mensaje);
                                    });
                        },
                        (resultado: Operacion) => {
                            notify(resultado.mensaje);
                        });
            });
        } catch (e) {
            notify(`Error al procesar el reporte de entregas debido a: ${e.message}`);
        }
    }

    limpiarObjetosDeListadoDeEntregas(callback: () => void) {
        try {

            let lblCantidadEntregasProcesadas = $("#UiLblCantidadEntregasProcesadas");
            let detalleEntregasProcesadas = $("#UiDetalleEntregasProcesadas");

            let lblCantidadEntregasPendientes = $("#UiLblCantidadEntregasPendientes");
            let detalleEntregasPendientes = $("#UiDetalleEntregasPendientes");

            let lblCantidadEntregasNoProcesadas = $("#UiLblCantidadEntregasNoProcesadas");
            let detalleEntregasNoProcesadas = $("#UiDetalleEntregasNoProcesadas");

            lblCantidadEntregasProcesadas.text("0");
            detalleEntregasProcesadas.children().remove("li");

            lblCantidadEntregasPendientes.text("0");
            detalleEntregasPendientes.children().remove("li");

            lblCantidadEntregasNoProcesadas.text("0");
            detalleEntregasNoProcesadas.children().remove("li");

            lblCantidadEntregasProcesadas = null;
            detalleEntregasProcesadas = null;

            lblCantidadEntregasPendientes = null;
            detalleEntregasPendientes = null;

            lblCantidadEntregasNoProcesadas = null;
            detalleEntregasNoProcesadas = null;

            callback();

        } catch (e) {
            notify(`Error al limpiar los listados de entregas debido a: ${e.message}`);
        }
    }

    generarListadoDeEntregas() {
        try {

            let lblCantidadEntregasProcesadas = $("#UiLblCantidadEntregasProcesadas");
            let lblCantidadEntregasPendientes = $("#UiLblCantidadEntregasPendientes");
            let lblCantidadEntregasNoProcesadas = $("#UiLblCantidadEntregasNoProcesadas");

            lblCantidadEntregasProcesadas.text(this.listadoDeEntregasParaReporte.entregasProcesadas.length);
            lblCantidadEntregasPendientes.text(this.listadoDeEntregasParaReporte.entregasPendientes.length);
            lblCantidadEntregasNoProcesadas.text(this.listadoDeEntregasParaReporte.entregasCanceladas.length);

            this.generarListadoDeEntregasProcesadas(this.listadoDeEntregasParaReporte.entregasProcesadas,
                () => {
                    this.generarListadoDeEntregasPendientes(this.listadoDeEntregasParaReporte.entregasPendientes,
                        () => {
                            this.generarListadoDeEntregasCanceladas(this.listadoDeEntregasParaReporte
                                .entregasCanceladas,
                                () => {

                                });
                        });
                });

            lblCantidadEntregasProcesadas = null;
            lblCantidadEntregasPendientes = null;
            lblCantidadEntregasNoProcesadas = null;

        } catch (e) {
            notify(`Error al generar el listado de entregas debido a: ${e.message}`);
        }
    }

    generarListadoDeEntregasProcesadas(entregasProcesadas: DemandaDeDespachoEncabezado[],
        callback: () => void) {
        let li: string[] = [];
        let detalleEntregasProcesadas = $("#UiDetalleEntregasProcesadas");
        try {

            entregasProcesadas.map((entrega: DemandaDeDespachoEncabezado) => {
                li.push(`<li style="border-bottom: 2px solid black;">`);
                li.push(`<table style="width: 100%" id="UiContEntregasProcesadas">`);
                li.push(`<tr>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Entrega:</b> ${entrega.docNum}</td>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Documento:</b> ${entrega
                    .pickingDemandHeaderId}</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td colspan="2">`);
                li.push(`<b>Cliente: </b> ${entrega.clientCode}`);
                li.push(`</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td colspan="2">`);
                li.push(`<b>Nombre: </b> ${entrega.clientName}`);
                li.push(`</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Factura:</b> ${this
                    .obtenerTextoAMostrarEnColumnaDeFactura(entrega)}</td>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Monto:</b>${this.simboloDeMoneda} ${format_number(trunc_number(entrega.totalAmount,this.configuracionDeDecimales.defaultCalculationsDecimals),
                        this.configuracionDeDecimales.defaultDisplayDecimals)}</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td colspan="2"><b>Prod. Entregados: </b> ${format_number(entrega.qtyToDelivery,this.configuracionDeDecimales.defaultDisplayDecimalsForSkuQty)} `);
                if (entrega.isCanceled == SiNo.Si) {
                    li.push(`<span style="color: red">ANULADA <br/> ${entrega.reasonCancel} </span>`);
                }
                li.push(`</td>`);
                li.push(`</tr>`);
                if (!this.usuarioFacturaEnRuta) {
                    li.push(`<tr>`);
                    li.push(`<td colspan="2">`);
                    li.push(`<a href="#" id="${entrega.docNum}" class="ui-btn ui-btn-b ui-corner-all" style="text-align: center">`);
                    li.push(`Anular`);
                    li.push(`</a>`);
                    li.push(`</td>`);
                    li.push(`</tr>`);
                }
                li.push(`</table>`);
                li.push(`</li>`);
            });

            if (this.listaNoEstaVacia(li.join(""))) {
                detalleEntregasProcesadas.append(li.join(""));
                detalleEntregasProcesadas.trigger("refresh");
            }

            callback();

        } catch (e) {
            notify(`No se ha podido generar el listado de entregas procesadas debido a: ${e.message}`);
        } finally {
            li = null;
            detalleEntregasProcesadas = null;
        }
    }

    obtenerTextoAMostrarEnColumnaDeFactura(entrega: DemandaDeDespachoEncabezado) {
        return entrega.invoiceId ? entrega.invoiceId.toString() : "N/A";
    }

    generarListadoDeEntregasPendientes(entregasPendientes, callback: () => void) {
        let li: string[] = [];
        let detalleEntregasPendientes = $("#UiDetalleEntregasPendientes");
        try {

            entregasPendientes.map((entregaPendiente: DemandaDeDespachoEncabezado) => {
                li.push(`<li style="border-bottom: 2px solid black;">`);
                li.push(`<table style="width: 100%">`);
                li.push(`<tr>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Documento:</b> ${entregaPendiente.docNum}</td>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Cliente:</b> ${entregaPendiente.clientCode}</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td colspan="2"><b>Nombre: </b> ${entregaPendiente.clientName}</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Factura:</b> N/A</td>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Monto:</b>${this
                    .simboloDeMoneda} ${
                    format_number(trunc_number(entregaPendiente.totalAmount,
                            this.configuracionDeDecimales.defaultCalculationsDecimals),
                        this.configuracionDeDecimales.defaultDisplayDecimals)}</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td colspan="2"><b>Prod. A Entregar: </b> ${format_number(entregaPendiente.qtyPending, this.configuracionDeDecimales.defaultDisplayDecimalsForSkuQty)} `);
                if (entregaPendiente.isCanceled == SiNo.Si) {
                    li.push(`<span style="color: red">ANULADA <br/> ${entregaPendiente.reasonCancel} </span>`);
                }
                li.push(`</td>`);
                li.push(`</tr>`);
                li.push(`</table>`);
                li.push(`</li>`);
            });

            if (this.listaNoEstaVacia(li.join(""))) {
                detalleEntregasPendientes.append(li.join(""));
                detalleEntregasPendientes.trigger("refresh");
            }

            callback();

        } catch (e) {
            notify(`Error al generar el listado de entregas pendientes debido a: ${e.message}`);
        } finally {
            li = null;
            detalleEntregasPendientes = null;
        }
    }

    generarListadoDeEntregasCanceladas(entregasCanceladas: DemandaDeDespachoEncabezado[], callback: () => void) {
        let li: string[] = [];
        let detalleEntregasNoProcesadas = $("#UiDetalleEntregasNoProcesadas");
        try {
            entregasCanceladas.map((entregaCancelada: DemandaDeDespachoEncabezado) => {
                li.push(`<li style="border-bottom: 2px solid black;">`);
                li.push(`<table style="width: 100%">`);
                li.push(`<tr>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Documento:</b> ${entregaCancelada.docNum}</td>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Cliente:</b> ${entregaCancelada.clientCode}</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td colspan="2"><b>Nombre: </b> ${entregaCancelada.clientName} </td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Factura:</b> N/A</td>`);
                li.push(`<td style="width: 50%; text-align: left"><b>Monto:</b>${this
                    .simboloDeMoneda} ${
                    format_number(trunc_number(entregaCancelada.totalAmount,
                            this.configuracionDeDecimales.defaultCalculationsDecimals),
                        this.configuracionDeDecimales.defaultDisplayDecimals)}</td>`);
                li.push(`</tr>`);
                li.push(`<tr>`);
                li.push(`<td colspan="2"><b>Razón: </b> ${entregaCancelada.reasonCancel}</td>`);
                li.push(`</tr>`);
                li.push(`</table>`);
                li.push(`</li>`);
            });

            if (this.listaNoEstaVacia(li.join(""))) {
                detalleEntregasNoProcesadas.append(li.join(""));
                detalleEntregasNoProcesadas.trigger("refresh");
            }

            callback();

        } catch (e) {
            notify(`Error al generar el listado de entregas canceladas debido a: ${e.message}`);
        } finally {
            li = null;
            detalleEntregasNoProcesadas = null;
        }
    }

    listaNoEstaVacia(lista: string) {
        return lista !== "";
    }

    usuarioDeseaAnularEntrega(identificadorDeNotaDeEntrega: any) {
        try {
            let notaDeEntregaAProcesar = this.listadoDeEntregasParaReporte.entregasProcesadas
                .find((notaDeEntrega: DemandaDeDespachoEncabezado) => {
                    return notaDeEntrega.docNum === parseInt(identificadorDeNotaDeEntrega);
                });

            if (notaDeEntregaAProcesar) {
                if (notaDeEntregaAProcesar.isCanceled == SiNo.Si) {
                    notify(`La entrega ya se encuentra anulada.`);
                    return;
                } else {
                    this.preguntarSiEstaSeguroDeAnularLaEntrega(() => {
                        this.preguntarRazonDeAnulacionDeNotaDeEntrega((razonDeAnulacion: string) => {
                                notaDeEntregaAProcesar.isCanceled = SiNo.Si;
                                notaDeEntregaAProcesar.reasonCancel = razonDeAnulacion;
                                this.anularEntrega(notaDeEntregaAProcesar);
                            },
                            (resultado: Operacion) => {
                                notify(resultado.mensaje);
                                return;
                            });
                    });
                }
            } else {
                notify(`No se ha podido encontrar el documento ${identificadorDeNotaDeEntrega}`);
                return;
            }
        } catch (e) {
            notify(`Error al intentar anular la entrega debido a: ${e.message}`);
            return;
        }
    }

    preguntarRazonDeAnulacionDeNotaDeEntrega(callback: (razonDeAnulacion: string) => void,
        errorCallback: (resultado: Operacion) => void) {
        this.reporteDeEntregaServicio.obtenerRazonesDeAnulacionDeEntrega((razonesDeAnulacion: Clasificacion[]) => {
                let listaRazones = [];
                razonesDeAnulacion.map((razon) => {
                    listaRazones.push({ text: razon.reasonId, value: razon.reasonDescription });
                });

                let configOptions = {
                    title: "¿Por qué anula la entrega?: ",
                    items: listaRazones,
                    doneButtonLabel: "ACEPTAR",
                    cancelButtonLabel: "CANCELAR"
                }

                window.plugins.listpicker.showPicker(configOptions,
                (item) => {
                    callback(item);
                },
                (error) => {
                    if (!this.esErrorPorDefecto(error))
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: `No se han podido obtener las razones de no entrega debido a: ${error}`
                        } as Operacion);
                    return;
                });

            },
            errorCallback);
    }

    esErrorPorDefecto(error: any) {
        return error == "Error";
    }

    preguntarSiEstaSeguroDeAnularLaEntrega(callback: () => void) {
        navigator.notification.confirm(`¿Confirma anular la entrega?`,
            (buttonIndex) => {
                if (buttonIndex === BotonSeleccionado.Si) {
                    callback();
                }
            },
            `Sonda® ${SondaVersion}`,
            ["No", "Si"]);
    }


    anularEntrega(entregaAAnular: DemandaDeDespachoEncabezado) {
        try {
            this.entregaServicio
                .obtenerDatosDeDemandaDeDespachoAsociadaAEntregaAnulada(this.usuarioFacturaEnRuta,
                    entregaAAnular,
                    (demandaDeDespachoAProcesar: DemandaDeDespachoEncabezado) => {
                        this.ejecutarProcesoDeAnulacionDeEntrega(demandaDeDespachoAProcesar);
                    },
                    (resultado: Operacion) => {
                        notify(resultado.mensaje);
                        return;
                    });
        } catch (e) {
            notify(`Error al intentar procesar la anulación de la entrega debido a: ${e.message}`);
            return;
        } 
    }

    ejecutarProcesoDeAnulacionDeEntrega(demandaDeDespachoAProcesar: DemandaDeDespachoEncabezado) {
        this.entregaServicio
            .ejecutarProcesoDeAnulacionDeEntrega(this.usuarioFacturaEnRuta,
                demandaDeDespachoAProcesar,
                () => {
                    EnviarData();
                    this.actualizarListasDeEntregas();
                },
                (resultado: Operacion) => {
                    notify(resultado.mensaje);
                    return;
                });
    }

    actualizarListasDeEntregas() {
        this.limpiarObjetosDeListadoDeEntregas(() => {
            this.generarListadoDeEntregas();
            EnviarData();
        });
    }
}