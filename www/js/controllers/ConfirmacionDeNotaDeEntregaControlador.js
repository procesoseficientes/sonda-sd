var ConfirmacionDeNotaDeEntregaControlador = (function () {
    function ConfirmacionDeNotaDeEntregaControlador() {
        this.fotoObligatoria = false;
    }
    ConfirmacionDeNotaDeEntregaControlador.prototype.delegarConfirmacionDeNotaDeEntregaControlador = function () {
        var _this = this;
        $("#UiDeliveryNoteConfirmationPage").on("pageshow", function () {
            estaEnFacturaTemporal = false;
            gImageURI_1 = "";
            _this.obtenerRegla();
        });
        $("#UiBtnAcceptDeliveryNoteConfirmation").on("click", function () {
            if (_this.validarSiLaFotoEsObligatorio()) {
                _this.usuarioConfimarGuardarLaNotaDeEntrega();
            }
        });
        $("#UiBtnDeliveryCamera").on("click", function (e) {
            e.preventDefault();
            _this.tomarFotografiaEntrega();
        });
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.volverAMenuPrincipal = function () {
        onResume(function () {
            PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
            PagoConsignacionesControlador.EstaEnDetalle = false;
            gcountPrints = 0;
            mainInvoiceHasBeenPrinted = false;
            invoiceCopyHasBeenPrinted = false;
            vieneDeListadoDeDocumentosDeEntrega = false;
            esFacturaDeEntrega = false;
            demandaDeDespachoEnProcesoDeEntrega = new DemandaDeDespachoEncabezado();
            listaDeDetalleDeDemandaDeDespachoParaProcesoDeEntrega.length = 0;
            listaDeDemandasDeDespachoEnProcesoDeEntrega.length = 0;
            esEntregaConsolidada = false;
            esEntregaPorDocumento = false;
            $.mobile.changePage("#menu_page", {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            EnviarData();
        });
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.usuarioConfimarGuardarLaNotaDeEntrega = function () {
        var _this = this;
        GrabarNotaDeEntrega(function () {
            gImageURI_1 = "";
            actualizarEstadoDeTarea(gTaskId, TareaGeneroGestion.Si, "Genero Gestión", function () {
                _this.volverAMenuPrincipal();
            }, TareaEstado.Completada);
        }, function (error) {
            notify(error.mensaje);
        });
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.tomarFotografiaEntrega = function () {
        DispositivoServicio.TomarFoto(function (foto) {
            gImageURI_1 = foto;
        }, function (mensajeError) {
            if (mensajeError !== "Camera cancelled.")
                notify("Error al tomar fotograf\u00EDa de entrega: " + mensajeError);
        });
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.obtenerRegla = function () {
        var _this = this;
        try {
            var reglaServicio = new ReglaServicio();
            reglaServicio.obtenerRegla("FotografiaObligatoriaEnEntrega", function (regla) {
                if (regla.rows.length > 0 && regla.rows.item(0).ENABLED.toUpperCase() === "SI") {
                    _this.fotoObligatoria = true;
                }
                else {
                    _this.fotoObligatoria = false;
                }
            }, function (error) {
                notify(error);
            });
        }
        catch (error) {
            notify(error.message);
        }
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.validarSiLaFotoEsObligatorio = function () {
        var validacion = false;
        try {
            if (this.fotoObligatoria) {
                if (gImageURI_1 !== "") {
                    validacion = true;
                }
                else {
                    notify("Debe tomar una fotografía para finalizar la entrega.");
                    validacion = false;
                }
            }
            else {
                validacion = true;
            }
        }
        catch (error) {
            notify(error.message);
            validacion = false;
        }
        return validacion;
    };
    return ConfirmacionDeNotaDeEntregaControlador;
}());
//# sourceMappingURL=ConfirmacionDeNotaDeEntregaControlador.js.map