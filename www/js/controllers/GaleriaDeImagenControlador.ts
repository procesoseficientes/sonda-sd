class GaleriaDeImagenControlador {

    imagenDeProductoServicio: ImagenDeSkuServicio = new ImagenDeSkuServicio();

    delegarGaleriaDeImagenControlador(): void {
        $("#UiSkuImagesPage").on("pageshow", () => {
            InteraccionConUsuarioServicio.desbloquearPantalla();
        });
    }

    usuarioDeseaRegresarAPantallaAnterior(): void {
        this.imagenDeProductoServicio.limpiarContenedorDeImagenesDeProducto(true, () => {
            window.history.back();
        });
    }
}