var ConfirmacionDeNotaDeEntregaControlador = (function () {
    function ConfirmacionDeNotaDeEntregaControlador(mensajero) {
        this.mensajero = mensajero;
        this.fotoObligatoria = false;
        this.firmaObligatoria = false;
        this.imagenesDeEntrega = [];
        this.reglaServicio = new ReglaServicio();
        this.tokenImagenesDeEntrega = mensajero.subscribe(this.recibirImagenesDeEntrega, getType(FotografiaMensaje), this);
    }
    ConfirmacionDeNotaDeEntregaControlador.prototype.delegarConfirmacionDeNotaDeEntregaControlador = function () {
        var _this_1 = this;
        $("#UiDeliveryNoteConfirmationPage").on("pageshow", function () {
            estaEnFacturaTemporal = false;
            _this_1.obtenerRegla();
        });
        $("#UiBtnAcceptDeliveryNoteConfirmation").on("click", function (e) {
            InteraccionConUsuarioServicio.bloquearPantalla();
            if (_this_1.validarSiLaFotoEsObligatorio() && _this_1.verificarObligatoriedadDeFirma()) {
                _this_1.usuarioConfimarGuardarLaNotaDeEntrega();
            }
        });
        $("#UiBtnDeliveryCamera").on("click", function (e) {
            _this_1.tomarFotografiaEntrega();
        });
        $("#UiBtnDeliverySignature").on("click", function (e) {
            _this_1.capturarFirmaDeEntrega();
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
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.usuarioConfimarGuardarLaNotaDeEntrega = function () {
        var _this_1 = this;
        GrabarNotaDeEntrega(function () {
            actualizarEstadoDeTarea(gTaskId, TareaGeneroGestion.Si, "Genero Gestión", function () {
                _this_1.volverAMenuPrincipal();
            }, TareaEstado.Completada);
        }, function (error) {
            notify(error.mensaje);
        });
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.tomarFotografiaEntrega = function () {
        $.mobile.changePage("#UiDeliveryImagePage");
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.obtenerRegla = function () {
        var _this_1 = this;
        try {
            this.reglaServicio.obtenerRegla("FotografiaObligatoriaEnEntrega", function (regla) {
                if (regla.rows.length > 0 && regla.rows.item(0).ENABLED.toUpperCase() === "SI") {
                    _this_1.fotoObligatoria = true;
                }
                else {
                    _this_1.fotoObligatoria = false;
                }
                _this_1.obtenerReglaDeFirmaObligatoria();
            }, function (error) {
                notify(error);
                _this_1.obtenerReglaDeFirmaObligatoria();
            });
        }
        catch (error) {
            notify(error.message);
            this.obtenerReglaDeFirmaObligatoria();
        }
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.obtenerReglaDeFirmaObligatoria = function () {
        var _this_1 = this;
        try {
            this.reglaServicio.obtenerRegla("FirmaObligatoriaEnEntrega", function (regla) {
                if (regla.rows.length > 0 && regla.rows.item(0).ENABLED.toUpperCase() === "SI") {
                    _this_1.firmaObligatoria = true;
                }
                else {
                    _this_1.firmaObligatoria = false;
                }
                _this_1.cambiarVisualizacionDeBotonDeFirma(_this_1.firmaObligatoria);
            }, function (error) {
                notify(error);
                _this_1.cambiarVisualizacionDeBotonDeFirma(false);
            });
        }
        catch (error) {
            notify(error.message);
            this.cambiarVisualizacionDeBotonDeFirma(false);
        }
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.cambiarVisualizacionDeBotonDeFirma = function (visualizarBoton) {
        var contenedorDeBotonDeFirma = $("#UiBtnDeliverySignatureContainer");
        if (visualizarBoton) {
            contenedorDeBotonDeFirma.show();
        }
        else {
            contenedorDeBotonDeFirma.hide();
        }
        contenedorDeBotonDeFirma = null;
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.validarSiLaFotoEsObligatorio = function () {
        var validacion = false;
        if (this.fotoObligatoria) {
            if (this.imagenesDeEntrega.length > 0) {
                validacion = true;
            }
            else {
                notify("Debe tomar al menos una fotografía para finalizar la entrega.");
                validacion = false;
            }
        }
        else {
            validacion = true;
        }
        return validacion;
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.recibirImagenesDeEntrega = function (mensaje, suscriptor) {
        suscriptor.imagenesDeEntrega = mensaje.fotografias;
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.verificarObligatoriedadDeFirma = function () {
        var validacion = false;
        if (this.firmaObligatoria) {
            if (firmaControlador.firmaCapturada && firmaControlador.firmaCapturada.length > 0) {
                validacion = true;
            }
            else {
                notify("Debe tomar la firma para finalizar la entrega.");
                validacion = false;
            }
        }
        else {
            validacion = true;
        }
        return validacion;
    };
    ConfirmacionDeNotaDeEntregaControlador.prototype.capturarFirmaDeEntrega = function () {
        $.mobile.changePage("#UiSignaturePage");
    };
    return ConfirmacionDeNotaDeEntregaControlador;
}());
//# sourceMappingURL=ConfirmacionDeNotaDeEntregaControlador.js.map