var FirmaControlador = (function () {
    function FirmaControlador(mensajero) {
        this.mensajero = mensajero;
        this.firmaCapturada = null;
    }
    FirmaControlador.prototype.delegarFirmaControlador = function () {
        var _this_1 = this;
        $("#UiSignaturePage").on("pageshow", function () {
            InteraccionConUsuarioServicio.bloquearPantalla();
            ToastThis("Preparando espacio de firma...");
            var to = setTimeout(function () {
                _this_1.prepararEspacioParaFirma();
                _this_1.mostrarImagenDeFirmaCapturada();
                clearTimeout(to);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }, 1000);
        });
        $("#UiBtnBackFromSignaturePage").on("click", function () {
            _this_1.usuarioDeseaVolverAPantallaAnterior();
        });
        $("#UiBtnClearSignaturePage").on("click", function () {
            _this_1.usuarioDeseaLimpiarEspacioDeFirma();
        });
        $("#UiBtnUserAcceptSignature").on("click", function () {
            _this_1.usuarioDeseaAceptarFirma();
        });
    };
    FirmaControlador.prototype.prepararEspacioParaFirma = function () {
        if (zkSignature) {
            zkSignature.capture();
        }
    };
    FirmaControlador.prototype.usuarioDeseaVolverAPantallaAnterior = function () {
        InteraccionConUsuarioServicio.confirmarAccion("¿Está seguro de cancelar el proceso actual?", function () {
            zkSignature.clear();
            window.history.back();
        });
    };
    FirmaControlador.prototype.usuarioDeseaLimpiarEspacioDeFirma = function () {
        var _this_1 = this;
        InteraccionConUsuarioServicio.confirmarAccion("¿Está seguro de limpiar el espacio de firma? Los cambios, si los hay, podrían perderse.", function () {
            _this_1.firmaCapturada = null;
            zkSignature.clear();
            _this_1.mostrarImagenDeFirmaCapturada();
        });
    };
    FirmaControlador.prototype.usuarioDeseaAceptarFirma = function () {
        InteraccionConUsuarioServicio.bloquearPantalla();
        try {
            this.firmaCapturada = zkSignature.save() || this.firmaCapturada;
            this.publicarFirma(this.firmaCapturada);
            var to_1 = setTimeout(function () {
                window.history.back();
                clearTimeout(to_1);
                to_1 = null;
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }, 500);
        }
        catch (error) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify(error.message);
        }
    };
    FirmaControlador.prototype.publicarFirma = function (firma) {
        var mensaje = new FirmaMensaje(this);
        mensaje.firma = firma;
        this.mensajero.publish(mensaje, getType(FirmaMensaje));
    };
    FirmaControlador.prototype.mostrarImagenDeFirmaCapturada = function () {
        var imagenFirmaCapturada = $("#UiDeliverySignatureCaptured");
        if (this.firmaCapturada && this.firmaCapturada.length > 0) {
            imagenFirmaCapturada.attr("src", this.firmaCapturada);
            imagenFirmaCapturada.show();
        }
        else {
            imagenFirmaCapturada.attr("src", "");
            imagenFirmaCapturada.hide();
        }
    };
    return FirmaControlador;
}());
//# sourceMappingURL=FirmaControlador.js.map