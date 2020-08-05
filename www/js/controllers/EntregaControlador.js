var EntregaControlador = (function () {
    function EntregaControlador(mensajero) {
        this.mensajero = mensajero;
        this.entregaServicio = new EntregaServicio();
        this.tarea = new Tarea();
        this.VerificarSiTraeGps = function (tarea) {
            return (tarea.expectedGps && tarea.expectedGps != "0,0");
        };
        this.tokenCliente = mensajero.subscribe(this.tareaMensajeEntregado, getType(TareaMensaje), this);
    }
    EntregaControlador.prototype.tareaMensajeEntregado = function (message, subscriber) {
        subscriber.tarea = message.tarea;
    };
    ;
    EntregaControlador.prototype.delegarEntregaControlador = function () {
        var este = this;
        $("#UiDeliveryPage").on("pageshow", function () {
            este.establecerEtiquetaDeBotonPrincipal();
            este.obtenerTareaPorCodigoYTipo();
        });
        $("#UiBtnCallClient").on("click", function () {
            este.realizarLlamadaTelefonica(este.tarea, function () {
            }, function (error) {
                notify(error.mensaje);
            });
        });
        $("#UiBtnStartDeliveryRouteFromDeliveryPage").on("click", function () {
            este.empezarNavegacionHaciaTareaEntrega();
        });
        $("#UiBtnInvoiceDeliveryPage").on("click", function () {
            este.procederARealizarEntrega();
        });
    };
    EntregaControlador.prototype.empezarNavegacionHaciaTareaEntrega = function () {
        try {
            if (this.VerificarSiTraeGps(this.tarea)) {
                TaskNavigateTo(this.tarea.expectedGps, this.tarea.relatedClientName);
            }
            else {
                notify("No hay punto GPS");
            }
        }
        catch (e) {
            notify(e.message);
        }
    };
    EntregaControlador.prototype.obtenerTareaPorCodigoYTipo = function () {
        var _this = this;
        TareaServicio.obtenerTareaPorCodigoYTipo(this.tarea.taskId, this.tarea.taskType, function (tarea) {
            _this.tarea = tarea;
        }, function (error) {
            notify("Error al obtener tarea de entrega: " + error);
        });
    };
    EntregaControlador.prototype.irAPantalla = function (pantalla) {
        $.mobile.changePage("#" + pantalla, {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };
    EntregaControlador.prototype.realizarLlamadaTelefonica = function (tarea, callback, returnCallback) {
        try {
            this.entregaServicio.realizarLlamadaTelefonica(tarea, function () {
                callback();
            }, function (resultado) {
                throw new Error(resultado.mensaje);
            });
        }
        catch (e) {
            returnCallback({ codigo: -1, mensaje: "Error al realizar llamada telefónica: " + e.message });
        }
    };
    EntregaControlador.prototype.procederARealizarEntrega = function () {
        var _this = this;
        try {
            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea.relatedClientCode, function (documentosAEntregar) {
                if (documentosAEntregar.length == 0) {
                    throw new Error("No se han encontrado documentos para realizar la entrega, por favor verifique y vuelva a intentar");
                }
                _this.publicarListadoDeDocumentosDeEntrega(documentosAEntregar, function () {
                    actualizarEstadoDeTarea(gTaskId, null, null, function () {
                        _this.irAPantalla("UiDeliveryDetailPage");
                    }, TareaEstado.Aceptada);
                });
            }, function (error) {
                notify(error.mensaje);
            });
        }
        catch (e) {
            notify(e.message);
        }
    };
    EntregaControlador.prototype.publicarListadoDeDocumentosDeEntrega = function (documentosAEntregar, callback) {
        try {
            var documentosParaEntregaMensaje = new DocumentosParaEntregaMensaje(this);
            documentosParaEntregaMensaje.documentosDeEntrega = documentosAEntregar;
            this.mensajero.publish(documentosParaEntregaMensaje, getType(DocumentosParaEntregaMensaje));
            callback();
        }
        catch (e) {
            throw new Error(e.message);
        }
    };
    EntregaControlador.prototype.usuarioDeseaRelizarEntrega = function () {
        try {
            $.mobile.changePage("#UiDeliveryDetailPage", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        }
        catch (e) {
            throw new Error(e.message);
        }
    };
    EntregaControlador.prototype.establecerEtiquetaDeBotonPrincipal = function () {
        var boton = $("#UiBtnInvoiceDeliveryPage");
        var usuarioFacturaEnRuta = localStorage.getItem("INVOICE_IN_ROUTE");
        try {
            if (usuarioFacturaEnRuta == SiNo.Si) {
                boton.text("Facturar");
            }
            else {
                boton.text("Entregar");
            }
        }
        catch (e) {
            boton.text("Facturar");
        }
        finally {
            boton = null;
            usuarioFacturaEnRuta = null;
        }
    };
    return EntregaControlador;
}());
//# sourceMappingURL=EntregaControlador.js.map