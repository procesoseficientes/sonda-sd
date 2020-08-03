class FirmaControlador {

    firmaCapturada: string = null;
    constructor(public mensajero: Messenger) { }

    delegarFirmaControlador(): void {

        $("#UiSignaturePage").on("pageshow", () => {
            InteraccionConUsuarioServicio.bloquearPantalla();
            ToastThis("Preparando espacio de firma...");

            let to = setTimeout(() => {
                this.prepararEspacioParaFirma();
                this.mostrarImagenDeFirmaCapturada();
                clearTimeout(to);

                InteraccionConUsuarioServicio.desbloquearPantalla();
            }, 1000);
        });

        $("#UiBtnBackFromSignaturePage").on("click", () => {
            this.usuarioDeseaVolverAPantallaAnterior();
        });

        $("#UiBtnClearSignaturePage").on("click", () => {
            this.usuarioDeseaLimpiarEspacioDeFirma();
        });

        $("#UiBtnUserAcceptSignature").on("click", () => {
            this.usuarioDeseaAceptarFirma();
        });
    }

    prepararEspacioParaFirma(): void {
        if (zkSignature) {
            zkSignature.capture();
        }
    }

    usuarioDeseaVolverAPantallaAnterior(): void {
        InteraccionConUsuarioServicio.confirmarAccion("¿Está seguro de cancelar el proceso actual?", () => {
            zkSignature.clear();
            window.history.back();
        });
    }

    usuarioDeseaLimpiarEspacioDeFirma(): void {
        InteraccionConUsuarioServicio.confirmarAccion("¿Está seguro de limpiar el espacio de firma? Los cambios, si los hay, podrían perderse.", () => {
            this.firmaCapturada = null;
            zkSignature.clear();
            this.mostrarImagenDeFirmaCapturada();
        });
    }

    usuarioDeseaAceptarFirma(): void {
        InteraccionConUsuarioServicio.bloquearPantalla();
        try {
            this.firmaCapturada = zkSignature.save() || this.firmaCapturada;
            this.publicarFirma(this.firmaCapturada);
            let to = setTimeout(() => {
                window.history.back();
                clearTimeout(to);
                to = null;
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }, 500);
        } catch (error) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify(error.message);
        }
    }

    publicarFirma(firma: string): void {
        let mensaje = new FirmaMensaje(this);
        mensaje.firma = firma;
        this.mensajero.publish(mensaje, getType(FirmaMensaje));
    }

    private mostrarImagenDeFirmaCapturada(): void {
        let imagenFirmaCapturada: JQuery = $("#UiDeliverySignatureCaptured");
        if (this.firmaCapturada && this.firmaCapturada.length > 0) {
            imagenFirmaCapturada.attr("src", this.firmaCapturada);
            imagenFirmaCapturada.show();
        } else {
            imagenFirmaCapturada.attr("src", "");
            imagenFirmaCapturada.hide();
        }
    }

}