/// <reference path="mensaje.ts" />
class Publisher {

    constructor(public mensajero: Messenger) {

    }

    publicarMensaje() {
        var msg = new Mensaje(this);
        msg.contenido = "Hola mundo";
        this.mensajero.publish(msg, getType(Mensaje));
    }

}
