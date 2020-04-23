var ImagenDeSkuServicio = (function () {
    function ImagenDeSkuServicio() {
        this.opcionesDeConfiguracionParaCarrouselDeImagenes = {
            dots: true,
            infinite: true,
            slidesToShow: 1,
            arrows: false,
            swipeToSlide: true
        };
    }
    ImagenDeSkuServicio.prototype.almacenarImagenesDeProducto = function (fila) {
        var query = [];
        query.push("INSERT INTO IMAGE_BY_SKU(");
        query.push("ID,");
        query.push("CODE_SKU,");
        query.push("IMAGE1,");
        query.push("IMAGE2,");
        query.push("IMAGE3,");
        query.push("IMAGE4,");
        query.push("IMAGE5)");
        query.push("VALUES (");
        query.push(fila.ID + ",");
        query.push("'" + fila.CODE_SKU + "',");
        query.push(fila.IMAGE1 ? "'" + fila.IMAGE1 + "'," : "null,");
        query.push(fila.IMAGE2 ? "'" + fila.IMAGE2 + "'," : "null,");
        query.push(fila.IMAGE3 ? "'" + fila.IMAGE3 + "'," : "null,");
        query.push(fila.IMAGE4 ? "'" + fila.IMAGE4 + "'," : "null,");
        query.push(fila.IMAGE5 ? "'" + fila.IMAGE5 + "'" : "null");
        query.push(")");
        gInsertsInitialRoute.push(query.join(""));
    };
    ImagenDeSkuServicio.prototype.obtenerImagenesDeProducto = function (producto, callback) {
        try {
            SONDA_DB_Session.transaction(function (transaction) {
                var query = [];
                query.push("SELECT IMAGE1,");
                query.push("IMAGE2,");
                query.push("IMAGE3,");
                query.push("IMAGE4,");
                query.push("IMAGE5");
                query.push("FROM IMAGE_BY_SKU");
                query.push("WHERE CODE_SKU='" + producto.sku + "'");
                transaction.executeSql(query.join(" "), [], function (_trans, results) {
                    if (results.rows.length == 0) {
                        callback([]);
                    }
                    else {
                        var imagenesDeProducto = results.rows.item(0);
                        var imagenesAMostrar = [];
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
                }, function (_trans, error) {
                    notify("Error al obtener las imagenes del producto. " + error.message);
                    callback([]);
                });
            }, function (error) {
                notify("Error al obtener las imagenes del producto. " + error.message);
                callback([]);
            });
        }
        catch (error) {
            notify("Error al obtener las imagenes del producto. " + error.message);
            callback([]);
        }
    };
    ImagenDeSkuServicio.prototype.construirListadoDeImagenesParaProductoSeleccionado = function (imagenesDeProductoSeleccionado, vieneDeCatalogoDeProductos, callback) {
        var _this = this;
        if (vieneDeCatalogoDeProductos === void 0) { vieneDeCatalogoDeProductos = false; }
        try {
            var contenedorDeImagenes_1 = vieneDeCatalogoDeProductos
                ? $("#UiSkuImageGaleryContainer")
                : $("#UiSkuImageContainer");
            contenedorDeImagenes_1.children().remove();
            contenedorDeImagenes_1.removeClass("slick-initialized slick-slider slick-dotted");
            if (!imagenesDeProductoSeleccionado ||
                imagenesDeProductoSeleccionado.length === 0) {
                contenedorDeImagenes_1.hide();
                if (callback) {
                    callback();
                }
            }
            else {
                contenedorDeImagenes_1.show();
                this.iniciarCarrousel(contenedorDeImagenes_1);
                var to_1 = setTimeout(function () {
                    clearTimeout(to_1);
                    imagenesDeProductoSeleccionado.forEach(function (imagen, indiceDeImagen) {
                        if (vieneDeCatalogoDeProductos) {
                            contenedorDeImagenes_1.slick("slickAdd", _this.obtenerHtmlDeImagenDeCatalogoDeProducto(imagen, indiceDeImagen));
                        }
                        else {
                            contenedorDeImagenes_1.slick("slickAdd", _this.obtenerHtmlDeImagen(imagen, indiceDeImagen));
                        }
                    });
                    if (vieneDeCatalogoDeProductos) {
                        contenedorDeImagenes_1.slick("slickPrev");
                    }
                    if (callback) {
                        callback();
                    }
                }, 500);
            }
        }
        catch (error) {
            notify(error.message);
        }
    };
    ImagenDeSkuServicio.prototype.obtenerHtmlDeImagen = function (imagen, indiceDeImagen) {
        var htmlDeImagen = [];
        htmlDeImagen.push("<div id=\"DIV_SKU_IMG_" + indiceDeImagen + "\">");
        htmlDeImagen.push("<img src=\"" + imagen + "\" alt=\"Imagen " + indiceDeImagen + "\" id=\"SKU_IMG_" + indiceDeImagen + "\" style=\"width:100%; height: 250px\" />");
        htmlDeImagen.push("</div>");
        return htmlDeImagen.join("");
    };
    ImagenDeSkuServicio.prototype.obtenerHtmlDeImagenDeCatalogoDeProducto = function (imagen, indiceDeImagen) {
        var htmlDeImagen = [];
        htmlDeImagen.push("<div id=\"DIV_SKU_IMG_" + indiceDeImagen + "\">");
        htmlDeImagen.push("<img src=\"" + imagen + "\" alt=\"Imagen " + indiceDeImagen + "\" id=\"SKU_IMG_" + indiceDeImagen + "\" style=\"width:100%;\" />");
        htmlDeImagen.push("</div>");
        return htmlDeImagen.join("");
    };
    ImagenDeSkuServicio.prototype.iniciarCarrousel = function (contenedorDeImagenes) {
        contenedorDeImagenes.slick(this.opcionesDeConfiguracionParaCarrouselDeImagenes);
    };
    ImagenDeSkuServicio.prototype.usuarioDeseaVerImagenDeProductoEnPantallaCompleta = function (imagenSeleccionada) {
        try {
            var contenedorDeImagenSeleccionada = $("#ImagenDeProductoSeleccionada");
            contenedorDeImagenSeleccionada.attr("src", imagenSeleccionada);
            $.mobile.changePage("#UiSelectedSkuImagePage");
            contenedorDeImagenSeleccionada = null;
        }
        catch (error) {
            notify("No se ha podido visualizar la imagen en pantalla completa debido a: " + error.message);
        }
    };
    ImagenDeSkuServicio.prototype.limpiarContenedorDeImagenesDeProducto = function (vieneDeCatalogoDeProductos, callback) {
        var contenedorDeImagenes = vieneDeCatalogoDeProductos
            ? $("#UiSkuImageGaleryContainer")
            : $("#UiSkuImageContainer");
        contenedorDeImagenes.removeClass("slick-initialized slick-slider slick-dotted");
        contenedorDeImagenes.hide();
        contenedorDeImagenes = null;
        callback();
    };
    return ImagenDeSkuServicio;
}());
//# sourceMappingURL=ImagenDeSkuServicio.js.map