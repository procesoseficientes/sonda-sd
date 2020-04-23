/// <reference path="messenger.ts" />
/// <reference path="mensaje.ts" />
class Subscriber {
    token:SubscriptionToken;

    constructor(public mensajero: Messenger) {
   //  this.token=   mensajero.subscribe<Mensaje>(this.mensajeEntregado, getType(Mensaje));
    }

    mensajeEntregado(mensaje: Mensaje) {
        alert(mensaje.contenido);
    }

    cancelarSuscripcion() {
        this.mensajero.unsubscribe(this.token.guid,getType(Mensaje));
    }

}