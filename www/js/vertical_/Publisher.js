var Publisher = (function () {
    function Publisher(mensajero) {
        this.mensajero = mensajero;
    }
    Publisher.prototype.publicarMensaje = function () {
        var msg = new Mensaje(this);
        msg.contenido = "Hola mundo";
        this.mensajero.publish(msg, getType(Mensaje));
    };
    return Publisher;
}());
//# sourceMappingURL=Publisher.js.map