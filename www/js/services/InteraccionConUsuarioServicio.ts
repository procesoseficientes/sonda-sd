class InteraccionConUsuarioServicio implements IInteraccionConUsuarioServicio {

    static pantallaEstaBloqueada = false;

    static bloquearPantalla() {
        if (this.pantallaEstaBloqueada) return;

        let imagenCarga = $("#imgCargandoInicioDeRuta");
        let anchura = ($(window).width() / 2);
        let objetoImagen;


        imagenCarga.height(anchura / 2);
        imagenCarga.width(anchura / 2);

        let margenIzquiero = ($(window).width() / 2);
        let margenSuperior = ($(window).height() / 2);
        
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
    }

    static desbloquearPantalla() {
        if (!this.pantallaEstaBloqueada) return;

        $.unblockUI();
        document.addEventListener("menubutton", onMenuKeyDown, false);
        document.removeEventListener("backbutton", InteraccionConUsuarioServicio.bloqueoFunc, false);
        document.addEventListener("backbutton", onBackKeyDown, false);
        this.pantallaEstaBloqueada = false;
    }

    static bloqueoFunc(e) {
        e.preventDefault();
        return false;
    }
}