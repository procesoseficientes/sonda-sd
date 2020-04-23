var socketTareaDetalle;
var FirmaControlador = (function () {
    function FirmaControlador(mensajero) {
        this.mensajero = mensajero;
        this.tareaServicio = new TareaServcio();
        this.tokenFirma = mensajero.subscribe(this.firmaEntregada, getType(FirmaMensaje), this);
    }
    FirmaControlador.prototype.delegadoFirmaControlador = function () {
        var este = this;
        $("#UiUserSignaturPage").on("pageshow", function () {
            este.validarFirmaObligatoria(function () {
                este.prepararCanvas();
            });
        });
        $("#UiCancerlarFirma").bind("touchstart", function () {
            este.usuarioDeseaVerPantallaAnterior();
        });
        $("#UiLimpiarFirmaEnPantallaDeFirma").bind("touchstart", function () {
            este.pad.clear();
        });
        $("#UiGuardarFirma").bind("touchstart", function () {
            este.usuarioDeseaGuardarFoto(function () {
                este.usuarioDeseaVerPantallaAnterior();
            });
        });
        document.addEventListener("backbutton", function () {
            este.usuarioDeseaVerPantallaAnterior();
        }, true);
    };
    FirmaControlador.prototype.prepararCanvas = function () {
        var pantalla = $("#UiUserSignaturPage");
        var canvas = document.querySelector("canvas[id=UiCanvasDeFirma]");
        canvas.height = (pantalla.innerHeight() - 20);
        this.pad = new SignaturePad(canvas, {
            minWidth: 1,
            maxWidth: 2,
            penColor: "rgb(0, 0, 0)"
        });
        canvas = null;
        pantalla = null;
    };
    FirmaControlador.prototype.usuarioDeseaVerPantallaAnterior = function () {
        switch ($.mobile.activePage[0].id) {
            case "UiUserSignaturPage":
                switch (this.origen) {
                    case "SalesOrderSummaryPage":
                        $.mobile.changePage("#SalesOrderSummaryPage");
                        break;
                }
                break;
        }
    };
    FirmaControlador.prototype.usuarioDeseaGuardarFoto = function (callback) {
        var _this = this;
        this.validarFirma(function (firma) {
            _this.firma = firma;
            _this.publicarFirma();
            callback();
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    FirmaControlador.prototype.validarFirma = function (callback, errCallback) {
        if (this.firmaObligatoria) {
            if (this.pad.isEmpty()) {
                errCallback({ codigo: -1, mensaje: "La firma es obligatoria" });
            }
            else {
                callback(this.pad.toDataURL());
            }
        }
        else {
            callback(this.pad.toDataURL());
        }
    };
    FirmaControlador.prototype.firmaEntregada = function (mensaje, subcriber) {
        subcriber.firma = mensaje.firma;
        subcriber.origen = mensaje.origen;
    };
    FirmaControlador.prototype.publicarFirma = function () {
        var msg = new FirmaMensaje(this);
        msg.firma = this.firma;
        msg.origen = this.origen;
        this.mensajero.publish(msg, getType(FirmaMensaje));
    };
    FirmaControlador.prototype.validarFirmaObligatoria = function (callback) {
        var _this = this;
        try {
            this.tareaServicio.obtenerRegla("FirmaObligatoriaEnOrdenDeVenta", function (listaDeReglas) {
                _this.firmaObligatoria = false;
                if (listaDeReglas.length >= 1) {
                    if (listaDeReglas[0].enabled.toUpperCase() === "SI") {
                        _this.firmaObligatoria = true;
                    }
                }
                callback();
            }, function (resultado) {
                notify(resultado.mensaje);
                _this.firmaObligatoria = false;
            });
        }
        catch (err) {
            notify("Error al validar si modifica DMG: " + err.message);
            this.firmaObligatoria = false;
        }
    };
    return FirmaControlador;
}());
//# sourceMappingURL=FirmaControlador.js.map