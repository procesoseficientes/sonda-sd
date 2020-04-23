interface IInteraccionConUsuarioServicio {
    
}


interface IInteraccionConUsuarioServicioStatic<C extends new (...args) => IInteraccionConUsuarioServicio>{
    bloquearPantalla(): void;
     desbloquearPantalla(): void;
}