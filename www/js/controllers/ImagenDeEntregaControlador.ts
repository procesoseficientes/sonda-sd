class ImagenDeEntregaControlador {

    imagenesCapturadas: Array<string> = [];

    constructor(public mensajero: Messenger) { }

    delegarImagenDeEntregaControlador(): void {
        $("#UiDeliveryImagePage").on("pageshow", () => {
            try {
                this.construirYVisualizarListadoDeImagenesCapturadas();
            } catch (error) {
                notify(error.message);
            }
        });

        $("#UiBtnTakeDeliveryImage").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            this.capturarImagen();
        });

        $("#UiBtnBackFromDeliveryImagePage").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            this.usuarioDeseaRegresarAPantallaAnterior();
        });

        $("#UiBtnUserAcceptDeliveryImages").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            this.usuarioDeseaAceptarListadoDeImagenesCapturadas();
        });

        $("#UiDeliveryImagePage").on("click", "#UiDeliveryImageContainer div", (e: JQueryEventObject) => {
            let identificadorDeImagen: string = (e as any).currentTarget.attributes["id"].nodeValue;
            if (identificadorDeImagen) {
                this.usuarioSeleccionoImagen(identificadorDeImagen);
            }
        });

        // TODO: Eliminar al terminar el desarrollo
        $("#carrousel-prueba").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            $.mobile.changePage("#UiDeliveryImagePage");
        });
    }

    iniciarCarrousel(): void {
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
    }

    usuarioDeseaRegresarAPantallaAnterior(): void {
        InteraccionConUsuarioServicio.confirmarAccion("¿Está seguro de abandonar la pantalla?", () => {
            this.imagenesCapturadas.length = 0;
            window.history.back();
        });
    }

    usuarioDeseaAceptarListadoDeImagenesCapturadas(): void {
        this.publicarListadoDeImagenesCapturadas(() => {
            window.history.back();
        });
    }

    capturarImagen(): void {
        DispositivoServicio.TomarFoto((foto: string) => {
            this.imagenesCapturadas.push(`data:image/jpeg;base64,${foto}`);
            try {
                InteraccionConUsuarioServicio.bloquearPantalla();
                this.construirYVisualizarListadoDeImagenesCapturadas();
            } catch (error) {
                notify(`Error al visualizar el listado de imagenes debido a: ${error.message}`);
            }
        }, (mensajeError: string) => {
            if (mensajeError !== "Camera cancelled.") {
                notify(`Error al capturar la fotografía debido a: ${mensajeError}`);
            }
        });
    }

    verificarEstadoDeHabilitacionDeBotonDeCapturaDeImagen(): void {
        let botonDeCapturaDeImagen: JQuery = $("#UiBtnTakeDeliveryImage");
        if (this.imagenesCapturadas.length < 4) {
            botonDeCapturaDeImagen.removeClass("ui-disabled");
        } else {
            botonDeCapturaDeImagen.addClass("ui-disabled");
        }
        botonDeCapturaDeImagen = null;
    }

    usuarioSeleccionoImagen(identificadorDeImagen: string): void {
        let opciones = {
            title: "Seleccionar",
            items: [
                { text: "Eliminar", value: "Eliminar" },
                { text: "Reemplazar", value: "Reemplazar" }
            ],
            doneButtonLabel: "Aceptar",
            cancelButtonLabel: "Cancelar"
        }

        window.plugins.listpicker.showPicker(opciones,
            (item: string) => {
                switch (item) {
                    case "Eliminar":
                        this.eliminarImagen(identificadorDeImagen);
                        break;
                    case "Reemplazar":
                        this.usuarioDeseaReemplazarImagen(identificadorDeImagen);
                        break
                    default:
                        break;
                }
            },
            (error: string) => {
                if (error !== "Error") {
                    notify(`No se ha podido mostrar las opciones de la imagen seleccionada debido a: ${error}`);
                }
            });
    }

    eliminarImagen(indiceDeImagen: string): void {
        try {
            if (!indiceDeImagen) {
                throw new Error("Debe indicar la imágen que desea eliminar.");
            }

            let indiceDeImagenAProcesar: number = parseInt(indiceDeImagen);
            this.imagenesCapturadas.splice(indiceDeImagenAProcesar, 1);
            indiceDeImagenAProcesar = null;

            this.construirYVisualizarListadoDeImagenesCapturadas();
        } catch (error) {
            notify(`Error al eliminar la imagen debido a: ${error.message}`);
        }
    }

    usuarioDeseaReemplazarImagen(identificadorDeImagen: string): void {
        try {
            if (!identificadorDeImagen) {
                throw new Error("Debe indicar la imágen que desea eliminar.");
            }

            DispositivoServicio.TomarFoto((foto: string) => {
                try {
                    this.imagenesCapturadas[parseInt(identificadorDeImagen)] = `data:image/jpeg;base64,${foto}`;
                    InteraccionConUsuarioServicio.bloquearPantalla();
                    this.construirYVisualizarListadoDeImagenesCapturadas();
                } catch (error) {
                    notify(`Error al visualizar el listado de imagenes debido a: ${error.message}`);
                }
            }, (mensajeError: string) => {
                if (mensajeError !== "Camera cancelled.") {
                    notify(`Error al capturar la fotografía debido a: ${mensajeError}`);
                }
            });

        } catch (error) {
            notify(`Error al eliminar la imagen debido a: ${error.message}`);
        }
    }

    construirYVisualizarListadoDeImagenesCapturadas(): void {
        let contenedorDeImagenes: JQuery = $("#UiDeliveryImageContainer");
        contenedorDeImagenes.children().remove();

        // INFO: Asegura que se reinicie el carrousel
        contenedorDeImagenes.removeClass("slick-initialized slick-slider slick-dotted");

        let objetoDeImagenesConstruidas: Array<string> = [];
        this.imagenesCapturadas.forEach((imagen: string, indiceDeImagen: number) => {
            objetoDeImagenesConstruidas.push(this.obtenerHtmlDeImagen(imagen, indiceDeImagen));
        });

        if (objetoDeImagenesConstruidas.length > 0) {
            contenedorDeImagenes.html(objetoDeImagenesConstruidas.join(""))
        }

        this.verificarEstadoDeHabilitacionDeBotonDeCapturaDeImagen();
        this.iniciarCarrousel();

        let to = setTimeout(() => {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            clearTimeout(to);
        }, 150);
    }

    obtenerHtmlDeImagen(imagen: string, indiceDeImagen: number): string {
        let htmlDeImagen: Array<string> = [];
        htmlDeImagen.push(`<div id="${indiceDeImagen}">`);
        htmlDeImagen.push(`<img src="${imagen}" alt="Imagen ${indiceDeImagen}" style="width: 100%" />`);
        htmlDeImagen.push("</div>");

        return htmlDeImagen.join("");
    }

    publicarListadoDeImagenesCapturadas(callbak: () => void): void {
        let mensaje: FotografiaMensaje = new FotografiaMensaje(this);
        mensaje.fotografias = this.imagenesCapturadas;
        this.mensajero.publish(mensaje, getType(FotografiaMensaje));

        callbak();
    }
}