var GaleriaDeImagenControlador = (function () {
    function GaleriaDeImagenControlador() {
        this.imagenDeProductoServicio = new ImagenDeSkuServicio();
    }
    GaleriaDeImagenControlador.prototype.delegarGaleriaDeImagenControlador = function () {
        $("#UiSkuImagesPage").on("pageshow", function () {
            InteraccionConUsuarioServicio.desbloquearPantalla();
        });
    };
    GaleriaDeImagenControlador.prototype.usuarioDeseaRegresarAPantallaAnterior = function () {
        this.imagenDeProductoServicio.limpiarContenedorDeImagenesDeProducto(true, function () {
            window.history.back();
        });
    };
    return GaleriaDeImagenControlador;
}());
//# sourceMappingURL=GaleriaDeImagenControlador.js.map