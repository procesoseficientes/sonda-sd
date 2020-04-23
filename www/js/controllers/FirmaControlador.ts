var socketTareaDetalle: SocketIOClient.Socket;

class FirmaControlador {

    tokenFirma: SubscriptionToken;

    tareaServicio = new TareaServcio();

    pad: any;
    firma: String;
    origen: any;
    firmaObligatoria: Boolean;

    constructor(public mensajero: Messenger) {
        this.tokenFirma = mensajero.subscribe<FirmaMensaje>(this.firmaEntregada, getType(FirmaMensaje), this);
    }

    delegadoFirmaControlador() {
        var este = this;

        $("#UiUserSignaturPage").on("pageshow", () => {
            este.validarFirmaObligatoria(() => {
                este.prepararCanvas();
            });
        });
        
        $("#UiCancerlarFirma").bind("touchstart", () => {
            este.usuarioDeseaVerPantallaAnterior();
        });

        $("#UiLimpiarFirmaEnPantallaDeFirma").bind("touchstart", () => {
            este.pad.clear();
        });

        $("#UiGuardarFirma").bind("touchstart", () => {
            este.usuarioDeseaGuardarFoto(() => {
                este.usuarioDeseaVerPantallaAnterior();
            });
        });

        document.addEventListener("backbutton", () => {
            este.usuarioDeseaVerPantallaAnterior();
        }, true);
    }

    prepararCanvas() {
        let pantalla = $("#UiUserSignaturPage");
        let canvas:any = document.querySelector("canvas[id=UiCanvasDeFirma]");
        canvas.height = (pantalla.innerHeight() - 20);
        this.pad = new SignaturePad(canvas, {
            minWidth: 1,
            maxWidth: 2,
            penColor: "rgb(0, 0, 0)"
        });
        canvas = null;
        pantalla = null;
    }

    usuarioDeseaVerPantallaAnterior() {
        switch ($.mobile.activePage[0].id) {
            case "UiUserSignaturPage":
                switch (this.origen) {
                    case "SalesOrderSummaryPage":
                        $.mobile.changePage("#SalesOrderSummaryPage");
                        break;
                }
                break;
        }
    }

    usuarioDeseaGuardarFoto(callback: () => void) {
        this.validarFirma((firma: string) => {
            this.firma = firma;
            this.publicarFirma();
            callback();
        }, (resultado: Operacion) => {
            notify(resultado.mensaje);
        });
    }

    validarFirma(callback: (firma: string) => void, errCallback: (resultado: Operacion) => void) {
        if (this.firmaObligatoria) {
            if (this.pad.isEmpty()) {
                errCallback(<Operacion>{ codigo: -1, mensaje: "La firma es obligatoria" });
            } else {
                callback(this.pad.toDataURL());
            }
        } else {
            callback(this.pad.toDataURL());
        }
    }

    firmaEntregada(mensaje: FirmaMensaje, subcriber: any) {
        subcriber.firma = mensaje.firma;
        subcriber.origen = mensaje.origen;
    }


    publicarFirma() {
        let msg = new FirmaMensaje(this);
        msg.firma = this.firma;
        msg.origen = this.origen;
        this.mensajero.publish(msg, getType(FirmaMensaje));
    }

    validarFirmaObligatoria(callback: () => void) {
        try {
            this.tareaServicio.obtenerRegla("FirmaObligatoriaEnOrdenDeVenta", (listaDeReglas: Regla[]) => {

                this.firmaObligatoria = false;
                if (listaDeReglas.length >= 1) {
                    if (listaDeReglas[0].enabled.toUpperCase() === "SI") {
                        this.firmaObligatoria = true;
                    }
                }
                callback();
            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
                this.firmaObligatoria = false;
            });

        } catch (err) {
            notify("Error al validar si modifica DMG: " + err.message);
            this.firmaObligatoria = false;
        }
    }
}