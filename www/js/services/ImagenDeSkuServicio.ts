class ImagenDeSkuServicio implements IImagenDeSkuServicio {
  private opcionesDeConfiguracionParaCarrouselDeImagenes: any = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    arrows: false,
    swipeToSlide: true
  };

  almacenarImagenesDeProducto(fila: any): void {
    let query: string[] = [];
    query.push("INSERT INTO IMAGE_BY_SKU(");
    query.push("ID,");
    query.push("CODE_SKU,");
    query.push("IMAGE1,");
    query.push("IMAGE2,");
    query.push("IMAGE3,");
    query.push("IMAGE4,");
    query.push("IMAGE5)");
    query.push("VALUES (");
    query.push(`${fila.ID},`);
    query.push(`'${fila.CODE_SKU}',`);
    query.push(fila.IMAGE1 ? `'${fila.IMAGE1}',` : "null,");
    query.push(fila.IMAGE2 ? `'${fila.IMAGE2}',` : "null,");
    query.push(fila.IMAGE3 ? `'${fila.IMAGE3}',` : "null,");
    query.push(fila.IMAGE4 ? `'${fila.IMAGE4}',` : "null,");
    query.push(fila.IMAGE5 ? `'${fila.IMAGE5}'` : "null");
    query.push(")");

    gInsertsInitialRoute.push(query.join(""));
  }

  obtenerImagenesDeProducto(
    producto: Sku,
    callback: (listadoDeImagenes: Array<string>) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (transaction: SqlTransaction) => {
          let query: string[] = [];
          query.push("SELECT IMAGE1,");
          query.push("IMAGE2,");
          query.push("IMAGE3,");
          query.push("IMAGE4,");
          query.push("IMAGE5");
          query.push("FROM IMAGE_BY_SKU");
          query.push(`WHERE CODE_SKU='${producto.sku}'`);

          transaction.executeSql(
            query.join(" "),
            [],
            (_trans: SqlTransaction, results: SqlResultSet) => {
              if (results.rows.length == 0) {
                callback([]);
              } else {
                let imagenesDeProducto: any = results.rows.item(0);
                let imagenesAMostrar: Array<string> = [];
                if (imagenesDeProducto.IMAGE1) {
                  imagenesAMostrar.push(imagenesDeProducto.IMAGE1);
                }
                if (imagenesDeProducto.IMAGE2) {
                  imagenesAMostrar.push(imagenesDeProducto.IMAGE2);
                }
                if (imagenesDeProducto.IMAGE3) {
                  imagenesAMostrar.push(imagenesDeProducto.IMAGE3);
                }
                if (imagenesDeProducto.IMAGE4) {
                  imagenesAMostrar.push(imagenesDeProducto.IMAGE4);
                }
                if (imagenesDeProducto.IMAGE5) {
                  imagenesAMostrar.push(imagenesDeProducto.IMAGE5);
                }
                callback(imagenesAMostrar);
              }
            },
            (_trans: SqlTransaction, error: SqlError) => {
              notify(
                `Error al obtener las imagenes del producto. ${error.message}`
              );
              callback([]);
            }
          );
        },
        (error: SqlError) => {
          notify(
            `Error al obtener las imagenes del producto. ${error.message}`
          );
          callback([]);
        }
      );
    } catch (error) {
      notify(`Error al obtener las imagenes del producto. ${error.message}`);
      callback([]);
    }
  }

  construirListadoDeImagenesParaProductoSeleccionado(
    imagenesDeProductoSeleccionado: Array<string>,
    vieneDeCatalogoDeProductos: boolean = false,
    callback?: () => void
  ): void {
    try {
      let contenedorDeImagenes: JQuery = vieneDeCatalogoDeProductos
        ? $("#UiSkuImageGaleryContainer")
        : $("#UiSkuImageContainer");
      contenedorDeImagenes.children().remove();

      // INFO: Asegura que se reinicie el carrousel
      contenedorDeImagenes.removeClass(
        "slick-initialized slick-slider slick-dotted"
      );

      if (
        !imagenesDeProductoSeleccionado ||
        imagenesDeProductoSeleccionado.length === 0
      ) {
        contenedorDeImagenes.hide();

        if (callback) {
          callback();
        }
      } else {
        contenedorDeImagenes.show();

        this.iniciarCarrousel(contenedorDeImagenes);

        let to = setTimeout(() => {
          clearTimeout(to);
          imagenesDeProductoSeleccionado.forEach(
            (imagen: string, indiceDeImagen: number) => {
              if (vieneDeCatalogoDeProductos) {
                contenedorDeImagenes.slick(
                  "slickAdd",
                  this.obtenerHtmlDeImagenDeCatalogoDeProducto(
                    imagen,
                    indiceDeImagen
                  )
                );
              } else {
                contenedorDeImagenes.slick(
                  "slickAdd",
                  this.obtenerHtmlDeImagen(imagen, indiceDeImagen)
                );
              }
            }
          );

          if (vieneDeCatalogoDeProductos) {
            contenedorDeImagenes.slick("slickPrev");
          }

          if (callback) {
            callback();
          }
        }, 500);
      }
    } catch (error) {
      notify(error.message);
    }
  }

  obtenerHtmlDeImagen(imagen: string, indiceDeImagen: number): string {
    let htmlDeImagen: Array<string> = [];
    htmlDeImagen.push(`<div id="DIV_SKU_IMG_${indiceDeImagen}">`);
    htmlDeImagen.push(
      `<img src="${imagen}" alt="Imagen ${indiceDeImagen}" id="SKU_IMG_${indiceDeImagen}" style="width:100%; height: 250px" />`
    );
    htmlDeImagen.push("</div>");

    return htmlDeImagen.join("");
  }

  obtenerHtmlDeImagenDeCatalogoDeProducto(
    imagen: string,
    indiceDeImagen: number
  ): string {
    let htmlDeImagen: Array<string> = [];
    htmlDeImagen.push(`<div id="DIV_SKU_IMG_${indiceDeImagen}">`);
    htmlDeImagen.push(
      `<img src="${imagen}" alt="Imagen ${indiceDeImagen}" id="SKU_IMG_${indiceDeImagen}" style="width:100%;" />`
    );
    htmlDeImagen.push("</div>");

    return htmlDeImagen.join("");
  }

  iniciarCarrousel(contenedorDeImagenes: JQuery): void {
    contenedorDeImagenes.slick(
      this.opcionesDeConfiguracionParaCarrouselDeImagenes
    );
  }

  usuarioDeseaVerImagenDeProductoEnPantallaCompleta(
    imagenSeleccionada: string
  ): void {
    try {
      let contenedorDeImagenSeleccionada: JQuery = $(
        "#ImagenDeProductoSeleccionada"
      );

      // establece la nueva imagen
      contenedorDeImagenSeleccionada.attr("src", imagenSeleccionada);
      $.mobile.changePage("#UiSelectedSkuImagePage");
      contenedorDeImagenSeleccionada = null;
    } catch (error) {
      notify(
        `No se ha podido visualizar la imagen en pantalla completa debido a: ${error.message}`
      );
    }
  }

  limpiarContenedorDeImagenesDeProducto(
    vieneDeCatalogoDeProductos: boolean,
    callback: () => void
  ): void {
    let contenedorDeImagenes: JQuery = vieneDeCatalogoDeProductos
      ? $("#UiSkuImageGaleryContainer")
      : $("#UiSkuImageContainer");
    // INFO: Asegura que se reinicie el carrousel
    contenedorDeImagenes.removeClass(
      "slick-initialized slick-slider slick-dotted"
    );
    contenedorDeImagenes.hide();
    contenedorDeImagenes = null;
    callback();
  }
}
