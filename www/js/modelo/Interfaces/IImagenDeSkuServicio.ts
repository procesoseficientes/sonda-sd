interface IImagenDeSkuServicio {
    almacenarImagenesDeProducto(fila: any): void;

    obtenerImagenesDeProducto(producto: Sku, callback: (listadoDeImagenes: Array<string>) => void): void;

    construirListadoDeImagenesParaProductoSeleccionado(imagenesDeProductoSeleccionado: Array<string>, vieneDeCatalogoDeProductos?: boolean, callback?: () => void): void;

    obtenerHtmlDeImagen(imagen: string, indiceDeImagen: number): string;

    obtenerHtmlDeImagenDeCatalogoDeProducto(imagen: string, indiceDeImagen: number): string;

    iniciarCarrousel(contenedorDeImagenes: JQuery): void;

    usuarioDeseaVerImagenDeProductoEnPantallaCompleta(imagenSeleccionada: string): void;

    limpiarContenedorDeImagenesDeProducto(vieneDeCatalogoDeProductos: boolean, callback: () => void): void;
}