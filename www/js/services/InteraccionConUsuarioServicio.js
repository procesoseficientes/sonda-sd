var InteraccionConUsuarioServicio = (function () {
    function InteraccionConUsuarioServicio() {
    }
    InteraccionConUsuarioServicio.bloquearPantalla = function () {
        BloquearPantalla();
    };
    InteraccionConUsuarioServicio.desbloquearPantalla = function () {
        DesBloquearPantalla();
    };
    InteraccionConUsuarioServicio.pantallaEstaBloqueada = false;
    return InteraccionConUsuarioServicio;
}());
//# sourceMappingURL=InteraccionConUsuarioServicio.js.map