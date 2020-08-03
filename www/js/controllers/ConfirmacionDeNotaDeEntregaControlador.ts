class ConfirmacionDeNotaDeEntregaControlador {
    tokenImagenesDeEntrega: SubscriptionToken;

    fotoObligatoria: boolean = false;
    firmaObligatoria: boolean = false;
    imagenesDeEntrega: Array<string> = [];
    reglaServicio = new ReglaServicio();

    constructor(public mensajero: Messenger) {
        this.tokenImagenesDeEntrega = mensajero.subscribe<FotografiaMensaje>(this.recibirImagenesDeEntrega, getType(FotografiaMensaje), this);
    }

    delegarConfirmacionDeNotaDeEntregaControlador() {

        $("#UiDeliveryNoteConfirmationPage").on("pageshow",
            () => {
                estaEnFacturaTemporal = false;
                this.obtenerRegla();
            });

        $("#UiBtnAcceptDeliveryNoteConfirmation").on("click",
            (e: JQueryEventObject) => {
                InteraccionConUsuarioServicio.bloquearPantalla();
                if (this.validarSiLaFotoEsObligatorio() && this.verificarObligatoriedadDeFirma()) {
                    this.usuarioConfimarGuardarLaNotaDeEntrega();
                }
            });

        $("#UiBtnDeliveryCamera").on("click", (e) => {
            this.tomarFotografiaEntrega();
        });

        $("#UiBtnDeliverySignature").on("click", (e) => {
            this.capturarFirmaDeEntrega();
        });
    }

    volverAMenuPrincipal() {

        onResume(() => {
            PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
            PagoConsignacionesControlador.EstaEnDetalle = false;
            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            gcountPrints = 0;
            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            mainInvoiceHasBeenPrinted = false;
            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            invoiceCopyHasBeenPrinted = false;

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            vieneDeListadoDeDocumentosDeEntrega = false;

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            esFacturaDeEntrega = false;

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            demandaDeDespachoEnProcesoDeEntrega = new DemandaDeDespachoEncabezado();

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            listaDeDetalleDeDemandaDeDespachoParaProcesoDeEntrega.length = 0;

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            listaDeDemandasDeDespachoEnProcesoDeEntrega.length = 0;

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            esEntregaConsolidada = false;

            // ReSharper disable once AssignToImplicitGlobalInFunctionScope
            esEntregaPorDocumento = false;

            imagenDeEntregaControlador.imagenesCapturadas.length = 0;
            firmaControlador.firmaCapturada = null;

            $.mobile.changePage("#menu_page", {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            EnviarData();
            InteraccionConUsuarioServicio.desbloquearPantalla();
        });
    }

    usuarioConfimarGuardarLaNotaDeEntrega() {
        GrabarNotaDeEntrega(() => {
            actualizarEstadoDeTarea(gTaskId, TareaGeneroGestion.Si, "Genero Gestión", () => {
                this.volverAMenuPrincipal();
            }, TareaEstado.Completada);

        }, (error: any) => {
            notify(error.mensaje);
        });
    }

    tomarFotografiaEntrega() {
        $.mobile.changePage("#UiDeliveryImagePage");
    }

    obtenerRegla() {
        try {
            this.reglaServicio.obtenerRegla("FotografiaObligatoriaEnEntrega", (regla: any) => {
                if (regla.rows.length > 0 && regla.rows.item(0).ENABLED.toUpperCase() === "SI") {
                    this.fotoObligatoria = true;
                } else {
                    this.fotoObligatoria = false;
                }
                this.obtenerReglaDeFirmaObligatoria();
            }, (error) => {
                notify(error);
                this.obtenerReglaDeFirmaObligatoria();
            });
        } catch (error) {
            notify(error.message);
            this.obtenerReglaDeFirmaObligatoria();
        }
    }

    obtenerReglaDeFirmaObligatoria() {
        try {
            this.reglaServicio.obtenerRegla("FirmaObligatoriaEnEntrega", (regla: any) => {
                if (regla.rows.length > 0 && regla.rows.item(0).ENABLED.toUpperCase() === "SI") {
                    this.firmaObligatoria = true;
                } else {
                    this.firmaObligatoria = false;
                }
                this.cambiarVisualizacionDeBotonDeFirma(this.firmaObligatoria);
            }, (error) => {
                notify(error);
                this.cambiarVisualizacionDeBotonDeFirma(false);
            });
        } catch (error) {
            notify(error.message);
            this.cambiarVisualizacionDeBotonDeFirma(false);
        }
    }

    cambiarVisualizacionDeBotonDeFirma(visualizarBoton: boolean): void {
        let contenedorDeBotonDeFirma: JQuery = $("#UiBtnDeliverySignatureContainer");
        if (visualizarBoton) {
            contenedorDeBotonDeFirma.show();
        } else {
            contenedorDeBotonDeFirma.hide();
        }
        contenedorDeBotonDeFirma = null;
    }

    validarSiLaFotoEsObligatorio(): boolean {
        let validacion: boolean = false;
        if (this.fotoObligatoria) {
            if (this.imagenesDeEntrega.length > 0) {
                validacion = true;
            }
            else {
                notify("Debe tomar al menos una fotografía para finalizar la entrega.");
                validacion = false;
            }
        } else {
            validacion = true;
        }
        return validacion;
    }

    recibirImagenesDeEntrega(mensaje: FotografiaMensaje, suscriptor: ConfirmacionDeNotaDeEntregaControlador): void {
        suscriptor.imagenesDeEntrega = mensaje.fotografias;
    }

    verificarObligatoriedadDeFirma(): boolean {
        let validacion: boolean = false;
        if (this.firmaObligatoria) {
            if (firmaControlador.firmaCapturada && firmaControlador.firmaCapturada.length > 0) {
                validacion = true;
            }
            else {
                notify("Debe tomar la firma para finalizar la entrega.");
                validacion = false;
            }
        } else {
            validacion = true;
        }
        return validacion;
    }

    capturarFirmaDeEntrega() {
        $.mobile.changePage("#UiSignaturePage");
    }
}