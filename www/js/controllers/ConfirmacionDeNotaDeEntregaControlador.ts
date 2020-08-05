class ConfirmacionDeNotaDeEntregaControlador {

    fotoObligatoria: boolean = false;

    delegarConfirmacionDeNotaDeEntregaControlador() {

        $("#UiDeliveryNoteConfirmationPage").on("pageshow",
            () => {
                estaEnFacturaTemporal = false;
                gImageURI_1 = "";
                this.obtenerRegla();
            });

        $("#UiBtnAcceptDeliveryNoteConfirmation").on("click",
            () => {
                if (this.validarSiLaFotoEsObligatorio()) {
                    this.usuarioConfimarGuardarLaNotaDeEntrega();
                }
            });

        $("#UiBtnDeliveryCamera").on("click", (e) => {
            e.preventDefault();
            this.tomarFotografiaEntrega();
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

            $.mobile.changePage("#menu_page", {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            EnviarData();
        });
    }

    usuarioConfimarGuardarLaNotaDeEntrega() {
        GrabarNotaDeEntrega(() => {
            gImageURI_1 = "";
            actualizarEstadoDeTarea(gTaskId, TareaGeneroGestion.Si, "Genero Gestión", () => {
                this.volverAMenuPrincipal();
            }, TareaEstado.Completada);

        }, (error) => {
            notify(error.mensaje);
        });
    }

    tomarFotografiaEntrega() {
        DispositivoServicio.TomarFoto((foto) => {
            gImageURI_1 = foto;
        }, (mensajeError) => {
            if (mensajeError !== "Camera cancelled.")
                notify(`Error al tomar fotografía de entrega: ${mensajeError}`);
        });
    }

    obtenerRegla() {
        try {
            let reglaServicio = new ReglaServicio();

            reglaServicio.obtenerRegla("FotografiaObligatoriaEnEntrega", (regla: any) => {
                if (regla.rows.length > 0 && regla.rows.item(0).ENABLED.toUpperCase() === "SI") {
                    this.fotoObligatoria = true;
                } else {
                    this.fotoObligatoria = false;
                }
            }, (error) => {
                notify(error);
            });
        } catch (error) {
            notify(error.message);
        }
    }

    validarSiLaFotoEsObligatorio(): boolean {
        let validacion: boolean = false;
        try {
            if (this.fotoObligatoria) {
                if (gImageURI_1 !== "") {
                    validacion = true;
                }
                else {
                    notify("Debe tomar una fotografía para finalizar la entrega.");
                    validacion = false;
                }
            } else {
                validacion = true;
            }
        } catch (error) {
            notify(error.message);
            validacion = false;
        }
        return validacion;
    }
}