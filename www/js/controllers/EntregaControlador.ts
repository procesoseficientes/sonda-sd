class EntregaControlador {
    tokenCliente: SubscriptionToken;

    entregaServicio: EntregaServicio = new EntregaServicio();

    tarea: Tarea = new Tarea();

    constructor(public mensajero: Messenger) {
        this.tokenCliente = mensajero.subscribe<TareaMensaje>(this.tareaMensajeEntregado, getType(TareaMensaje), this);
    }

    tareaMensajeEntregado(message: TareaMensaje, subscriber: any) {
        subscriber.tarea = message.tarea;
    };

    delegarEntregaControlador() {
        const este: EntregaControlador = this;

        $("#UiDeliveryPage").on("pageshow", () => {
            este.establecerEtiquetaDeBotonPrincipal();
            este.obtenerTareaPorCodigoYTipo();
        });

        $("#UiBtnCallClient").on("click", () => {
            este.realizarLlamadaTelefonica(este.tarea, () => {
            }, (error) => {
                notify(error.mensaje);
            });
        });

        $("#UiBtnStartDeliveryRouteFromDeliveryPage").on("click", () => {
            este.empezarNavegacionHaciaTareaEntrega();
        });

        $("#UiBtnInvoiceDeliveryPage").on("click",
            () => {
                InteraccionConUsuarioServicio.bloquearPantalla();
                este.procederARealizarEntrega();
            });
    }

    empezarNavegacionHaciaTareaEntrega() {
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
    }

    obtenerTareaPorCodigoYTipo() {
        this.limpiarDatosDeCliente(() => {
            TareaServicio.obtenerTareaPorCodigoYTipo(this.tarea.taskId, this.tarea.taskType, (tarea) => {
                this.tarea = tarea;
                this.establecerDatosDeCliente();
            }, (error) => {
                notify("Error al obtener tarea de entrega: " + error);
            });
        });
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

    realizarLlamadaTelefonica(tarea: Tarea, callback: () => void, returnCallback: (resultado: Operacion) => void) {
        try {
            this.entregaServicio.realizarLlamadaTelefonica(tarea, () => {
                callback();
            }, (resultado) => {
                throw new Error(resultado.mensaje);
            });
        }
        catch (e) {
            returnCallback({ codigo: -1, mensaje: "Error al realizar llamada telefónica: " + e.message } as Operacion);
        }
    }

    procederARealizarEntrega() {
        try {

            this.entregaServicio.obtenerDocumentosParaEntrega(this.tarea, (documentosAEntregar) => {

                if (documentosAEntregar.length == 0) {
                    throw new Error("No se han encontrado documentos para realizar la entrega, por favor verifique y vuelva a intentar");
                }

                this.publicarListadoDeDocumentosDeEntrega(documentosAEntregar, () => {
                    actualizarEstadoDeTarea(gTaskId, null, null, () => {
                        this.irAPantalla("UiDeliveryDetailPage");
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                    }, TareaEstado.Aceptada);
                });

            }, (error: Operacion) => {
                notify(error.mensaje);
            });
        } catch (e) {
            notify(e.message);
        }
    }

    publicarListadoDeDocumentosDeEntrega(documentosAEntregar: DemandaDeDespachoEncabezado[], callback: () => void) {
        try {

            let documentosParaEntregaMensaje = new DocumentosParaEntregaMensaje(this);
            documentosParaEntregaMensaje.documentosDeEntrega = documentosAEntregar;
            this.mensajero.publish(documentosParaEntregaMensaje, getType(DocumentosParaEntregaMensaje));

            callback();

        } catch (e) {
            throw new Error(e.message);
        }

    }

    usuarioDeseaRelizarEntrega() {
        try {
            $.mobile.changePage("#UiDeliveryDetailPage", {
                transition: "none",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        } catch (e) {
            throw new Error(e.message);
        }
    }

    establecerEtiquetaDeBotonPrincipal() {
        let boton = $("#UiBtnInvoiceDeliveryPage");
        let usuarioFacturaEnRuta = localStorage.getItem("INVOICE_IN_ROUTE");
        try {
            if (usuarioFacturaEnRuta == SiNo.Si) {
                boton.text("Facturar");
            } else {
                boton.text("Entregar");
            }
        } catch (e) {
            boton.text("Facturar");
        } finally {
            boton = null;
            usuarioFacturaEnRuta = null;
        }
    }

    VerificarSiTraeGps = function (tarea) {
        return (tarea.expectedGps && tarea.expectedGps != "0,0");
    }

    limpiarDatosDeCliente(callback: () => void) {
        let codigoCliente: JQuery = $("#UiLabelClientCodeInDelivery");
        let nombreCliente: JQuery = $("#UiLabelClientNameInDelivery");

        codigoCliente.text("");
        nombreCliente.text("");

        codigoCliente = null;
        nombreCliente = null;

        callback();
    }

    establecerDatosDeCliente() {
        let codigoCliente: JQuery = $("#UiLabelClientCodeInDelivery");
        let nombreCliente: JQuery = $("#UiLabelClientNameInDelivery");

        codigoCliente.text(this.tarea.relatedClientCode);
        nombreCliente.text(this.tarea.relatedClientName);

        codigoCliente = null;
        nombreCliente = null;
    }
}