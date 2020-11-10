var Subscriber = (function () {
    function Subscriber(mensajero) {
        this.mensajero = mensajero;
    }
    Subscriber.prototype.mensajeEntregado = function (mensaje) {
        alert(mensaje.contenido);
    };
    Subscriber.prototype.cancelarSuscripcion = function () {
        this.mensajero.unsubscribe(this.token.guid, getType(Mensaje));
    };
    return Subscriber;
}());
//# sourceMappingURL=Subscriber.js.map