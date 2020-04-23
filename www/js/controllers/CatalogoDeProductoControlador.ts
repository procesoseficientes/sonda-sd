class CatalogoDeProductoControlador {
    productoServicio: SkuServicio = new SkuServicio();
    decimalesServicio: ManejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
    imagenDeProductoServicio: ImagenDeSkuServicio = new ImagenDeSkuServicio();

    configuracionDecimales: ManejoDeDecimales;

    pivotLimit = 25; // cantidad de skus que se desean mostrar
    currentLimit = 0; // limite maximo que se extrae del arreglo de skus
    lastLowLimit = 0; // ultimo limite inferior en el que se posiciono

    listadoDeProductos: Sku[] = [];

    constructor(public mensajero: Messenger) {

    }

    delegarCatalogoDeProductoControlador(): void {
        $("#UiBtnShowProductCatalog").on("click", () => {
            this.irAPantalla("UiProductCatalogPage");
        });

        $("#UiProductCatalogPage").on("pageshow", () => {
            this.cargarPantalla();
        });

        $("#UiBotonAgruparCatalogoDeProductos").on("click", () => {
            this.usuarioDeseaAgruparCatalogoDeProductos();
        });

        $("#UiBotonOrdenarCatalogoDeProductos").on("click", () => {
            this.usuarioDeseaOrdenarCatalogoDeProductos();
        });

        $("#UiBtnIrAPaginaAnteriorDeCatalogoDeProductos").on("click", () => {
            this.usuarioDeseaIrAPaginaAnteriorDeCatalogoDeProductos();
        });

        $("#UiBtnIrAPaginaSiguienteDeCatalogoDeProductos").on("click", () => {
            this.usuarioDeseaIrASiguientePaginaDeCatalogoDeProductos();
        });

        $("#UiProductCatalogPage").on("click", "#UiListaDeCatalogoDeProductos li", (e: JQueryEventObject) => {
            e.preventDefault();
            let id = (e as any).currentTarget.attributes["id"].nodeValue;
            id = id.substring(4);
            if (id && id.length > 0) {
                InteraccionConUsuarioServicio.bloquearPantalla();
                this.usuarioSeleccionoProducto(id);
            }
        });
    }

    irAPantalla(nombrePantalla: string): void {
        $.mobile.changePage(`#${nombrePantalla}`);
    }

    usuarioDeseaRegresarAPantallaAnterior(): void {
        this.limpiarInformacionDeProductos(() => {
            window.history.back();
        });
    }

    usuarioDeseaAgruparCatalogoDeProductos(): void {
        this.productoServicio.obtenerFamiliaSku(
            familiaSku => {
                let listaDeFamiliaSku = [];
                listaDeFamiliaSku.push({
                    text: "Todos",
                    value: "ALL"
                });
                for (let i = 0; i < familiaSku.rows.length; i++) {
                    listaDeFamiliaSku.push({
                        text: familiaSku.rows.item(i).DESCRIPTION_FAMILY_SKU,
                        value: familiaSku.rows.item(i).CODE_FAMILY_SKU
                    });
                }

                let opcionesDeConfiguracion = {
                    title: "Familia de producto",
                    items: listaDeFamiliaSku,
                    doneButtonLabel: "Aceptar",
                    cancelButtonLabel: "Cancelar"
                };
                ShowListPicker(opcionesDeConfiguracion, item => {
                    InteraccionConUsuarioServicio.bloquearPantalla();
                    localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", item);
                    this.cargarCatalogoDeProductos(() => {
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                    });
                });
            },
            (resultado: Operacion) => {
                notify(resultado.mensaje);
            }
        );
    }

    usuarioDeseaOrdenarCatalogoDeProductos(): void {
        let listaDeOpcionesDeOrdenamiento = [];
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.CodigoDeProducto.toString(),
            value: OpcionDeOrdenDelListadoDeSku.CodigoDeProducto.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.NombreDeProducto.toString(),
            value: OpcionDeOrdenDelListadoDeSku.NombreDeProducto.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.Precio.toString(),
            value: OpcionDeOrdenDelListadoDeSku.Precio.toString()
        });

        let configuracionDeOpcionesDeOrdenamiento = {
            title: "Ordenar por",
            items: listaDeOpcionesDeOrdenamiento,
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };

        ShowListPicker(configuracionDeOpcionesDeOrdenamiento, item => {
            localStorage.setItem("ORDENAR_CATALOGO_DE_PRODUCTOS_POR", item);
            this.solicitarTipoDeOrdenamientoDeCatalogoDeProductos();
        });
    }

    usuarioDeseaIrASiguientePaginaDeCatalogoDeProductos(): void {
        if (this.currentLimit <= this.listadoDeProductos.length) {
            this.cargarListaDeProductos(
                this.listadoDeProductos.slice(
                    this.currentLimit,
                    this.currentLimit + this.pivotLimit
                )
            );
            this.lastLowLimit = this.currentLimit;
            this.currentLimit = this.currentLimit + this.pivotLimit;
        }
    }

    usuarioDeseaIrAPaginaAnteriorDeCatalogoDeProductos(): void {
        if (this.lastLowLimit !== 0) {
            this.cargarListaDeProductos(
                this.listadoDeProductos.slice(
                    this.lastLowLimit - this.pivotLimit,
                    this.lastLowLimit
                )
            );
            this.currentLimit = this.lastLowLimit;
            this.lastLowLimit = this.lastLowLimit - this.pivotLimit;
        }
    }

    usuarioSeleccionoProducto(codigoDeProducto: string): void {
        try {
            let producto = (this.listadoDeProductos as any).find((productoTemporal: Sku) => {
                return productoTemporal.sku.replace(" ", "_") === codigoDeProducto;
            });
            if (producto) {
                this.imagenDeProductoServicio.obtenerImagenesDeProducto(producto, (imagenesDeProducto: Array<string>) => {
                    this.imagenDeProductoServicio.construirListadoDeImagenesParaProductoSeleccionado(imagenesDeProducto, true, () => {
                        this.irAPantalla("UiSkuImagesPage");
                    });
                });
            } else {
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        } catch (error) {
            notify(error.message);
        }
    }

    limpiarInformacionDeProductos(callback: () => void): void {
        this.listadoDeProductos.length = 0;

        this.lastLowLimit = 0;
        this.currentLimit = 0;

        localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
        localStorage.removeItem("ORDENAR_CATALOGO_DE_PRODUCTOS_POR");
        localStorage.removeItem("ORDENAR_CATALOGO_DE_PRODUCTOS_DE_FORMA");

        callback();
    }

    limpiarCampoDeFiltroDeProducto(): void {
        let campoDeFiltroDeProducto: JQuery = $("#UiTextoFiltroEnCatalogoDeProductos");
        campoDeFiltroDeProducto.val("");
        campoDeFiltroDeProducto.focus();
        campoDeFiltroDeProducto = null;
    }

    cargarPantalla(): void {
        InteraccionConUsuarioServicio.bloquearPantalla();
        try {
            this.decimalesServicio.obtenerInformacionDeManejoDeDecimales((configuracionDecimales: ManejoDeDecimales) => {
                this.configuracionDecimales = configuracionDecimales;
                this.cargarCatalogoDeProductos(() => {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                });
            });
        } catch (error) {
            notify(`No ha sido posible preparar la información debido a: ${error.message}`);
        }
    }

    cargarCatalogoDeProductos(callback?: () => void): void {
        let producto: Sku = new Sku();
        let cliente: Cliente = new Cliente();
        cliente.priceListId = localStorage.getItem("gDefaultPriceList");

        if (!localStorage.getItem("LISTA_TIPO_FAMILIA_SKU")) {
            localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
        }

        producto.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");

        this.productoServicio.obtenerCatalogoDeProductos(
            cliente,
            producto,
            this.configuracionDecimales,
            (catalogoDeProductos: Array<Sku>) => {
                this.listadoDeProductos = catalogoDeProductos;

                this.lastLowLimit = 0;
                this.currentLimit = this.pivotLimit;

                this.cargarListaDeProductos(
                    catalogoDeProductos.slice(0, this.pivotLimit)
                );

                if (callback) {
                    callback();
                }
            },
            (resultado: Operacion) => {
                notify(resultado.mensaje);
            },
            localStorage.getItem("ORDENAR_CATALOGO_DE_PRODUCTOS_POR"),
            localStorage.getItem("ORDENAR_CATALOGO_DE_PRODUCTOS_DE_FORMA")
        );
    }

    cargarListaDeProductos(listadoDeProductos: Sku[]) {
        try {
            my_dialog("Sonda® " + SondaVersion, "Cargando catálogo...", "open");
            let listaDeCatalogoDeProductos = $("#UiListaDeCatalogoDeProductos");
            listaDeCatalogoDeProductos.listview();
            listaDeCatalogoDeProductos.children().remove("li");
            if (listadoDeProductos.length >= 1) {
                let li = "";
                for (let i = 0; i < listadoDeProductos.length; i++) {
                    li += this.obtenerHtmlParaProducto(listadoDeProductos[i]);
                }

                if (li !== "") {
                    listaDeCatalogoDeProductos.append(li);
                    listaDeCatalogoDeProductos.listview("refresh");
                }
            }
            listaDeCatalogoDeProductos = null;
            my_dialog("", "", "close");
        } catch (err) {
            notify(err.message);
        }
    }

    obtenerHtmlParaProducto(sku: Sku): string {
        let li: Array<string> = [];
        li.push(
            "<li data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'");
        li.push(` id='SKU_${sku.sku.replace(" ", "_")}'>`);
        li.push(" <a href='#'");
        li.push(" <p>");
        li.push(
            " <span style='background-color: #005599; border-radius: 4px; color: #ffffff; padding: 3px; ");
        li.push(` text-shadow: none; font-size:13px' > ${format_number(
            sku.onHand,
            this.configuracionDecimales.defaultDisplayDecimals
        )}</span>&nbsp`);
        li.push(` <span style='font-size:12px;'>${sku.sku}</span>`);
        li.push(` </p><p> <span style='font-size:12px;'>${sku.skuName}</span>`);
        li.push(" </p>");
        li.push(" <p>");
        li.push(` <span class='ui-li-count'> ${DarFormatoAlMonto(
            format_number(sku.cost, this.configuracionDecimales.defaultDisplayDecimals)
        )}</span>`);

        if (sku.codeFamilySku !== null && sku.codeFamilySku !== "") {
            li.push(`<span class='small-roboto'>Familia: ${
                sku.codeFamilySku
                }</span>`);
        }

        li.push("</p>");
        li.push("</a>");
        li.push("</li>");

        return li.join("");
    }

    solicitarTipoDeOrdenamientoDeCatalogoDeProductos() {
        let listaDeTipoDeOrdenamiento = [];
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Ascendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Ascendente.toString()
        });
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Descendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Descendente.toString()
        });

        let configuracionDeOpcionesDeOrdenamiento = {
            title: "Tipo de Orden",
            items: listaDeTipoDeOrdenamiento,
            doneButtonLabel: "Aceptar",
            cancelButtonLabel: "Cancelar"
        };

        ShowListPicker(configuracionDeOpcionesDeOrdenamiento, item => {
            localStorage.setItem("ORDENAR_CATALOGO_DE_PRODUCTOS_DE_FORMA", item);
            this.cargarCatalogoDeProductos();
        });
    }

}