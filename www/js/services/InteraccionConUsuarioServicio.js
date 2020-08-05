var InteraccionConUsuarioServicio = (function () {
    function InteraccionConUsuarioServicio() {
    }
    InteraccionConUsuarioServicio.bloquearPantalla = function () {
        if (this.pantallaEstaBloqueada)
            return;
        var imagenCarga = $("#imgCargandoInicioDeRuta");
        var anchura = ($(window).width() / 2);
        var objetoImagen;
        imagenCarga.height(anchura / 2);
        imagenCarga.width(anchura / 2);
        var margenIzquiero = ($(window).width() / 2);
        var margenSuperior = ($(window).height() / 2);
        if (imagenCarga.attr("id") !== undefined) {
            objetoImagen = imagenCarga;
        }
        $.blockUI({
            message: objetoImagen,
            css: {
                top: (margenSuperior - ((anchura / 2) / 2)) + 'px',
                left: (margenIzquiero - ((anchura / 2) / 2)) + 'px',
                width: (anchura / 2) + 'px',
                height: (anchura / 2) + 'px'
            }
        });
        document.removeEventListener("menubutton", onMenuKeyDown, false);
        document.removeEventListener("backbutton", onBackKeyDown, false);
        document.addEventListener("backbutton", InteraccionConUsuarioServicio.bloqueoFunc, false);
        validator.isEmail('foo@bar.com');
        imagenCarga = null;
        this.pantallaEstaBloqueada = true;
    };
    InteraccionConUsuarioServicio.desbloquearPantalla = function () {
        if (!this.pantallaEstaBloqueada)
            return;
        $.unblockUI();
        document.addEventListener("menubutton", onMenuKeyDown, false);
        document.removeEventListener("backbutton", InteraccionConUsuarioServicio.bloqueoFunc, false);
        document.addEventListener("backbutton", onBackKeyDown, false);
        this.pantallaEstaBloqueada = false;
    };
    InteraccionConUsuarioServicio.bloqueoFunc = function (e) {
        e.preventDefault();
        return false;
    };
    InteraccionConUsuarioServicio.pantallaEstaBloqueada = false;
    return InteraccionConUsuarioServicio;
}());
//# sourceMappingURL=InteraccionConUsuarioServicio.js.map