class ListaDePagoControlador {

    pagoServicio: PagoServicio = new PagoServicio();
    documentosDePago: PagoDeFacturaVencidaEncabezado[] = [];

    configuracionDeDecimales: ManejoDeDecimales;
    decimalesServicio: ManejoDeDecimalesServicio = new ManejoDeDecimalesServicio();

    simboloDeMoneda: string;

    constructor(public mensajero: Messenger) {

    }

    delegarListaDePagoControlador(): void {

        $("#UiBtnShowPaymentsList").on("click",
            (e: JQueryEventObject) => {
                e.preventDefault();
                this.irAPantalla("UiPaymentListPage");
            });

        $("#UiPaymentListPage").on("pageshow",
            (e: JQueryEventObject) => {
                e.preventDefault();
                this.cargarDatosPrincipales();
            });

        $("#UiBtnBackFromPaymentListPage").on("click",
            (e: JQueryEventObject) => {
                e.preventDefault();
                this.irAPantalla("menu_page");
            });

        $("#UiBtnRefreshPaymentsList").on("click",
            (e: JQueryEventObject) => {
                e.preventDefault();
                this.cargarDatosPrincipales();
            });

        $("#UiPaymentListPage").on("click",
            "#UiPaymentsList a",
            (e: JQueryEventObject) => {
                e.preventDefault();
                let id = (e.currentTarget as any).id;
                if (id) {
                    this.mostrarOpcionesDeDocumentoDePagoSeleccionado(parseInt(id));
                }
            });

    }

    irAPantalla(pantalla: string): void {
        $.mobile.changePage(`#${pantalla}`,
            {
                transition: "pop",
                reverse: false,
                changeHash: false,
                showLoadMsg: false
            });
    }

    restablecerFiltroPrincipal(): void {
        let filtroDeListado = $("#UiTxtPaymentFilter");
        filtroDeListado.val("");
        filtroDeListado.focus();
        filtroDeListado = null;
    }

    cargarDatosPrincipales(): void {
        this.simboloDeMoneda = localStorage.getItem("CURRENCY_SYMBOL") || "Q";
        this.documentosDePago.length = 0;
        InteraccionConUsuarioServicio.bloquearPantalla();
        this.restablecerFiltroPrincipal();

        this.decimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {
            this.configuracionDeDecimales = decimales;
            this.pagoServicio
                .obtenerEncabezadoDeDocumentosDePagoParaReporte((documentos: PagoDeFacturaVencidaEncabezado[]) => {
                    this.documentosDePago = documentos;
                    this.construirListadoDeRecibosEmitidos(this.documentosDePago,
                        () => {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                        });
                },
                (resultado: Operacion) => {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify(resultado.mensaje);
                });
        });
    }

    construirListadoDeRecibosEmitidos(documentosDePago: PagoDeFacturaVencidaEncabezado[], callback: () => void): void {
        try {
            let contenedorDeListadoDeDocumentosDePago = $("#UiPaymentsList");
            contenedorDeListadoDeDocumentosDePago.children().remove("li");

            let etiquetaDeMontoTotalEnPagos = $("#UiLblTotalAmountOfPayments");
            let montoTotalEnPagos: number = 0;

            let cadenaHtmlDeDocumentosDePago: string[] = [];

            documentosDePago.forEach((pago: PagoDeFacturaVencidaEncabezado) => {
                montoTotalEnPagos += pago.paymentAmount;
                cadenaHtmlDeDocumentosDePago.push(` <li data-filtertext="${pago.codeCustomer} ${pago
                    .nameCustomer} ${pago.docNum}" data-icon="false">`);
                cadenaHtmlDeDocumentosDePago.push(` <a href="#" id="${pago.docNum}">`);
                cadenaHtmlDeDocumentosDePago.push(` <label>No. ${pago.docNum} </label>`);
                cadenaHtmlDeDocumentosDePago.push(` <label>${pago.codeCustomer} </label>`);
                cadenaHtmlDeDocumentosDePago.push(` <label>${pago.nameCustomer} </label>`);
                cadenaHtmlDeDocumentosDePago.push(` <span class="ui-li-count">${this
                    .simboloDeMoneda}. ${format_number(pago.paymentAmount,
                        this.configuracionDeDecimales.defaultDisplayDecimals)}</span>`);
                cadenaHtmlDeDocumentosDePago.push(` </a>`);
                cadenaHtmlDeDocumentosDePago.push(` </li>`);
            });

            let listadoDePagos: string = cadenaHtmlDeDocumentosDePago.join("");
            if (listadoDePagos !== "") {
                contenedorDeListadoDeDocumentosDePago.append(listadoDePagos);
                contenedorDeListadoDeDocumentosDePago.listview("refresh");
            }

            etiquetaDeMontoTotalEnPagos.text(`${this
                .simboloDeMoneda} ${format_number(montoTotalEnPagos,
                    this.configuracionDeDecimales.defaultDisplayDecimals)}`);

            etiquetaDeMontoTotalEnPagos = null;
        } catch (e) {
            console
                .log(`Ha ocurrido un error al crear el listado de documentos de pago, por favor, vuelva a intentar. ${e
                    .message}`);
            notify(`Ha ocurrido un error al crear el listado de documentos de pago, por favor, vuelva a intentar.`);
        }

        callback();
    }

    mostrarOpcionesDeDocumentoDePagoSeleccionado(numeroDeDocumento: number): void {
        try {
            let configuracionDeOpciones = {
                title: "Seleccione una opción:",
                items: [
                    { text: "Reimprimir", value: OpcionDisponibleParaDocumentoDePagoSeleccionado.Reimprimir },
                    { text: "Ver Detalle", value: OpcionDisponibleParaDocumentoDePagoSeleccionado.VerDetalle }
                ],
                doneButtonLabel: "Aceptar",
                cancelButtonLabel: "Cancelar"
            };

            let pagoSeleccionado: PagoDeFacturaVencidaEncabezado = (this.documentosDePago as any)
                .find((pago: PagoDeFacturaVencidaEncabezado) => {
                    return pago.docNum === numeroDeDocumento;
                });

            if (pagoSeleccionado) {
                window.plugins.listpicker.showPicker(configuracionDeOpciones,
                    (opcionSeleccionada) => {
                        switch (opcionSeleccionada) {
                            case OpcionDisponibleParaDocumentoDePagoSeleccionado.Reimprimir:
                                InteraccionConUsuarioServicio.bloquearPantalla();
                                this.imprimirDocumentoDePagoSeleccionado(pagoSeleccionado);
                                break;

                            case OpcionDisponibleParaDocumentoDePagoSeleccionado.VerDetalle:
                                InteraccionConUsuarioServicio.bloquearPantalla();
                                this.verDetalleDeDocumentoDePagoSeleccionado(pagoSeleccionado,
                                    () => {
                                        InteraccionConUsuarioServicio.desbloquearPantalla();
                                        this.irAPantalla("UiPaymentDetailPage");
                                    });
                                break;
                        }
                    });
            } else {
                throw new Error(`No se encontro el documento de pago seleccionado.`);
            }
        } catch (e) {
            console
                .log(`Lo sentimos, ha ocurrido un error al intentar mostrar las opciones disponibles para el documento seleccionado, por favor, vuelva a intentar. ${e.message}`);
            notify(`Lo sentimos, ha ocurrido un error al intentar mostrar las opciones disponibles para el documento seleccionado, por favor, vuelva a intentar.`);
        }
    }

    imprimirDocumentoDePagoSeleccionado(pago: PagoDeFacturaVencidaEncabezado): void {
        this.pagoServicio
            .obtenerInformacionDeSecuenciaDeDocumentoDePago((secuencia: any) => {
                    pago.branchName = secuencia.nombreSucursal;
                    pago.branchAddress = secuencia.direccionSucursal;
                    pago.reprint = true;

                    this.pagoServicio.imprimirPago(pago,
                        () => {
                            pago.isReprint = true;
                            this.pagoServicio.imprimirPago(pago,
                                () => {
                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                },
                                (error) => {
                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                    console.log(`Error al imprimir el documento de pago debido a: ${error}`);
                                    notify(`Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.`);
                                });
                        },
                        (error) => {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            console.log(`Error al imprimir el documento de pago debido a: ${error}`);
                            notify(`Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.`);
                        });
                },
                (resultado: Operacion) => {
                    console
                        .log(`Lo sentimos ha ocurrido un error al obtener los datos necesarios para la impresión del documento seleccionado, por favor, vuelva a intentar. ${resultado.mensaje}`);
                    notify(`Lo sentimos ha ocurrido un error al obtener los datos necesarios para la impresión del documento seleccionado, por favor, vuelva a intentar.`);
                });
    }

    verDetalleDeDocumentoDePagoSeleccionado(pago: PagoDeFacturaVencidaEncabezado, callback: () => void): void {
        let mensaje = new PagoMensaje(this);

        mensaje.pago = pago;
        mensaje.configuracionDeDecimales = this.configuracionDeDecimales;
        mensaje.simboloDeMoneda = this.simboloDeMoneda;

        this.mensajero.publish(mensaje, getType(PagoMensaje));

        callback();
    }

}