var ImagenDeEntregaControlador = (function () {
    function ImagenDeEntregaControlador(mensajero) {
        this.mensajero = mensajero;
        this.imagenesCapturadas = [];
    }
    ImagenDeEntregaControlador.prototype.delegarImagenDeEntregaControlador = function () {
        var _this_1 = this;
        $("#UiDeliveryImagePage").on("pageshow", function () {
            try {
                _this_1.construirYVisualizarListadoDeImagenesCapturadas();
            }
            catch (error) {
                notify(error.message);
            }
        });
        $("#UiBtnTakeDeliveryImage").on("click", function (e) {
            e.preventDefault();
            _this_1.capturarImagen();
        });
        $("#UiBtnBackFromDeliveryImagePage").on("click", function (e) {
            e.preventDefault();
            _this_1.usuarioDeseaRegresarAPantallaAnterior();
        });
        $("#UiBtnUserAcceptDeliveryImages").on("click", function (e) {
            e.preventDefault();
            _this_1.usuarioDeseaAceptarListadoDeImagenesCapturadas();
        });
        $("#UiDeliveryImagePage").on("click", "#UiDeliveryImageContainer div", function (e) {
            var identificadorDeImagen = e.currentTarget.attributes["id"].nodeValue;
            if (identificadorDeImagen) {
                _this_1.usuarioSeleccionoImagen(identificadorDeImagen);
            }
        });
        $("#carrousel-prueba").on("click", function (e) {
            e.preventDefault();
            $.mobile.changePage("#UiDeliveryImagePage");
        });
    };
    ImagenDeEntregaControlador.prototype.iniciarCarrousel = function () {
        $("#UiDeliveryImageContainer").slick({
            dots: true,
            infinite: false,
            speed: 300,
            slidesToShow: 4,
            slidesToScroll: 4,
            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 3,
                        infinite: true,
                        dots: true
                    }
                },
                {
                    breakpoint: 600,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        });
    };
    ImagenDeEntregaControlador.prototype.usuarioDeseaRegresarAPantallaAnterior = function () {
        var _this_1 = this;
        InteraccionConUsuarioServicio.confirmarAccion("¿Está seguro de abandonar la pantalla?", function () {
            _this_1.imagenesCapturadas.length = 0;
            window.history.back();
        });
    };
    ImagenDeEntregaControlador.prototype.usuarioDeseaAceptarListadoDeImagenesCapturadas = function () {
        this.publicarListadoDeImagenesCapturadas(function () {
            window.history.back();
        });
    };
    ImagenDeEntregaControlador.prototype.capturarImagen = function () {
        var _this_1 = this;
        DispositivoServicio.TomarFoto(function (foto) {
            _this_1.imagenesCapturadas.push("data:image/jpeg;base64," + foto);
            try {
                InteraccionConUsuarioServicio.bloquearPantalla();
                _this_1.construirYVisualizarListadoDeImagenesCapturadas();
            }
            catch (error) {
                notify("Error al visualizar el listado de imagenes debido a: " + error.message);
            }
        }, function (mensajeError) {
            if (mensajeError !== "Camera cancelled.") {
                notify("Error al capturar la fotograf\u00EDa debido a: " + mensajeError);
            }
        });
    };
    ImagenDeEntregaControlador.prototype.verificarEstadoDeHabilitacionDeBotonDeCapturaDeImagen = function () {
        var botonDeCapturaDeImagen = $("#UiBtnTakeDeliveryImage");
        if (this.imagenesCapturadas.length < 4) {
            botonDeCapturaDeImagen.removeClass("ui-disabled");
        }
        else {
            botonDeCapturaDeImagen.addClass("ui-disabled");
        }
        botonDeCapturaDeImagen = null;
    };
    ImagenDeEntregaControlador.prototype.usuarioSeleccionoImagen = function (identificadorDeImagen) {
        var _this_1 = this;
        var opciones = {
            title: "Seleccionar",
            items: [
                { text: "Eliminar", value: "Eliminar" },
                { text: "Reemplazar", value: "Reemplazar" }
            ],
            doneButtonLabel: "Aceptar",
            cancelButtonLabel: "Cancelar"
        };
        window.plugins.listpicker.showPicker(opciones, function (item) {
            switch (item) {
                case "Eliminar":
                    _this_1.eliminarImagen(identificadorDeImagen);
                    break;
                case "Reemplazar":
                    _this_1.usuarioDeseaReemplazarImagen(identificadorDeImagen);
                    break;
                default:
                    break;
            }
        }, function (error) {
            if (error !== "Error") {
                notify("No se ha podido mostrar las opciones de la imagen seleccionada debido a: " + error);
            }
        });
    };
    ImagenDeEntregaControlador.prototype.eliminarImagen = function (indiceDeImagen) {
        try {
            if (!indiceDeImagen) {
                throw new Error("Debe indicar la imágen que desea eliminar.");
            }
            var indiceDeImagenAProcesar = parseInt(indiceDeImagen);
            this.imagenesCapturadas.splice(indiceDeImagenAProcesar, 1);
            indiceDeImagenAProcesar = null;
            this.construirYVisualizarListadoDeImagenesCapturadas();
        }
        catch (error) {
            notify("Error al eliminar la imagen debido a: " + error.message);
        }
    };
    ImagenDeEntregaControlador.prototype.usuarioDeseaReemplazarImagen = function (identificadorDeImagen) {
        var _this_1 = this;
        try {
            if (!identificadorDeImagen) {
                throw new Error("Debe indicar la imágen que desea eliminar.");
            }
            DispositivoServicio.TomarFoto(function (foto) {
                try {
                    _this_1.imagenesCapturadas[parseInt(identificadorDeImagen)] = "data:image/jpeg;base64," + foto;
                    InteraccionConUsuarioServicio.bloquearPantalla();
                    _this_1.construirYVisualizarListadoDeImagenesCapturadas();
                }
                catch (error) {
                    notify("Error al visualizar el listado de imagenes debido a: " + error.message);
                }
            }, function (mensajeError) {
                if (mensajeError !== "Camera cancelled.") {
                    notify("Error al capturar la fotograf\u00EDa debido a: " + mensajeError);
                }
            });
        }
        catch (error) {
            notify("Error al eliminar la imagen debido a: " + error.message);
        }
    };
    ImagenDeEntregaControlador.prototype.construirYVisualizarListadoDeImagenesCapturadas = function () {
        var _this_1 = this;
        var contenedorDeImagenes = $("#UiDeliveryImageContainer");
        contenedorDeImagenes.children().remove();
        contenedorDeImagenes.removeClass("slick-initialized slick-slider slick-dotted");
        var objetoDeImagenesConstruidas = [];
        this.imagenesCapturadas.forEach(function (imagen, indiceDeImagen) {
            objetoDeImagenesConstruidas.push(_this_1.obtenerHtmlDeImagen(imagen, indiceDeImagen));
        });
        if (objetoDeImagenesConstruidas.length > 0) {
            contenedorDeImagenes.html(objetoDeImagenesConstruidas.join(""));
        }
        this.verificarEstadoDeHabilitacionDeBotonDeCapturaDeImagen();
        this.iniciarCarrousel();
        var to = setTimeout(function () {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            clearTimeout(to);
        }, 150);
    };
    ImagenDeEntregaControlador.prototype.obtenerHtmlDeImagen = function (imagen, indiceDeImagen) {
        var htmlDeImagen = [];
        htmlDeImagen.push("<div id=\"" + indiceDeImagen + "\">");
        htmlDeImagen.push("<img src=\"" + imagen + "\" alt=\"Imagen " + indiceDeImagen + "\" style=\"width: 100%\" />");
        htmlDeImagen.push("</div>");
        return htmlDeImagen.join("");
    };
    ImagenDeEntregaControlador.prototype.publicarListadoDeImagenesCapturadas = function (callbak) {
        var mensaje = new FotografiaMensaje(this);
        mensaje.fotografias = this.imagenesCapturadas;
        this.mensajero.publish(mensaje, getType(FotografiaMensaje));
        callbak();
    };
    return ImagenDeEntregaControlador;
}());
//# sourceMappingURL=ImagenDeEntregaControlador.js.map