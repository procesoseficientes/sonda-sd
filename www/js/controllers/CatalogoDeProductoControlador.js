var CatalogoDeProductoControlador = (function () {
    function CatalogoDeProductoControlador(mensajero) {
        this.mensajero = mensajero;
        this.productoServicio = new SkuServicio();
        this.decimalesServicio = new ManejoDeDecimalesServicio();
        this.imagenDeProductoServicio = new ImagenDeSkuServicio();
        this.pivotLimit = 25;
        this.currentLimit = 0;
        this.lastLowLimit = 0;
        this.listadoDeProductos = [];
    }
    CatalogoDeProductoControlador.prototype.delegarCatalogoDeProductoControlador = function () {
        var _this = this;
        $("#UiBtnShowProductCatalog").on("click", function () {
            _this.irAPantalla("UiProductCatalogPage");
        });
        $("#UiProductCatalogPage").on("pageshow", function () {
            _this.cargarPantalla();
        });
        $("#UiBotonAgruparCatalogoDeProductos").on("click", function () {
            _this.usuarioDeseaAgruparCatalogoDeProductos();
        });
        $("#UiBotonOrdenarCatalogoDeProductos").on("click", function () {
            _this.usuarioDeseaOrdenarCatalogoDeProductos();
        });
        $("#UiBtnIrAPaginaAnteriorDeCatalogoDeProductos").on("click", function () {
            _this.usuarioDeseaIrAPaginaAnteriorDeCatalogoDeProductos();
        });
        $("#UiBtnIrAPaginaSiguienteDeCatalogoDeProductos").on("click", function () {
            _this.usuarioDeseaIrASiguientePaginaDeCatalogoDeProductos();
        });
        $("#UiProductCatalogPage").on("click", "#UiListaDeCatalogoDeProductos li", function (e) {
            e.preventDefault();
            var id = e.currentTarget.attributes["id"].nodeValue;
            id = id.substring(4);
            if (id && id.length > 0) {
                InteraccionConUsuarioServicio.bloquearPantalla();
                _this.usuarioSeleccionoProducto(id);
            }
        });
    };
    CatalogoDeProductoControlador.prototype.irAPantalla = function (nombrePantalla) {
        $.mobile.changePage("#" + nombrePantalla);
    };
    CatalogoDeProductoControlador.prototype.usuarioDeseaRegresarAPantallaAnterior = function () {
        this.limpiarInformacionDeProductos(function () {
            window.history.back();
        });
    };
    CatalogoDeProductoControlador.prototype.usuarioDeseaAgruparCatalogoDeProductos = function () {
        var _this = this;
        this.productoServicio.obtenerFamiliaSku(function (familiaSku) {
            var listaDeFamiliaSku = [];
            listaDeFamiliaSku.push({
                text: "Todos",
                value: "ALL"
            });
            for (var i = 0; i < familiaSku.rows.length; i++) {
                listaDeFamiliaSku.push({
                    text: familiaSku.rows.item(i).DESCRIPTION_FAMILY_SKU,
                    value: familiaSku.rows.item(i).CODE_FAMILY_SKU
                });
            }
            var opcionesDeConfiguracion = {
                title: "Familia de producto",
                items: listaDeFamiliaSku,
                doneButtonLabel: "Aceptar",
                cancelButtonLabel: "Cancelar"
            };
            ShowListPicker(opcionesDeConfiguracion, function (item) {
                InteraccionConUsuarioServicio.bloquearPantalla();
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", item);
                _this.cargarCatalogoDeProductos(function () {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                });
            });
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    CatalogoDeProductoControlador.prototype.usuarioDeseaOrdenarCatalogoDeProductos = function () {
        var _this = this;
        var listaDeOpcionesDeOrdenamiento = [];
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
        var configuracionDeOpcionesDeOrdenamiento = {
            title: "Ordenar por",
            items: listaDeOpcionesDeOrdenamiento,
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };
        ShowListPicker(configuracionDeOpcionesDeOrdenamiento, function (item) {
            localStorage.setItem("ORDENAR_CATALOGO_DE_PRODUCTOS_POR", item);
            _this.solicitarTipoDeOrdenamientoDeCatalogoDeProductos();
        });
    };
    CatalogoDeProductoControlador.prototype.usuarioDeseaIrASiguientePaginaDeCatalogoDeProductos = function () {
        if (this.currentLimit <= this.listadoDeProductos.length) {
            this.cargarListaDeProductos(this.listadoDeProductos.slice(this.currentLimit, this.currentLimit + this.pivotLimit));
            this.lastLowLimit = this.currentLimit;
            this.currentLimit = this.currentLimit + this.pivotLimit;
        }
    };
    CatalogoDeProductoControlador.prototype.usuarioDeseaIrAPaginaAnteriorDeCatalogoDeProductos = function () {
        if (this.lastLowLimit !== 0) {
            this.cargarListaDeProductos(this.listadoDeProductos.slice(this.lastLowLimit - this.pivotLimit, this.lastLowLimit));
            this.currentLimit = this.lastLowLimit;
            this.lastLowLimit = this.lastLowLimit - this.pivotLimit;
        }
    };
    CatalogoDeProductoControlador.prototype.usuarioSeleccionoProducto = function (codigoDeProducto) {
        var _this = this;
        try {
            var producto = this.listadoDeProductos.find(function (productoTemporal) {
                return productoTemporal.sku.replace(" ", "_") === codigoDeProducto;
            });
            if (producto) {
                this.imagenDeProductoServicio.obtenerImagenesDeProducto(producto, function (imagenesDeProducto) {
                    _this.imagenDeProductoServicio.construirListadoDeImagenesParaProductoSeleccionado(imagenesDeProducto, true, function () {
                        _this.irAPantalla("UiSkuImagesPage");
                    });
                });
            }
            else {
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        }
        catch (error) {
            notify(error.message);
        }
    };
    CatalogoDeProductoControlador.prototype.limpiarInformacionDeProductos = function (callback) {
        this.listadoDeProductos.length = 0;
        this.lastLowLimit = 0;
        this.currentLimit = 0;
        localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
        localStorage.removeItem("ORDENAR_CATALOGO_DE_PRODUCTOS_POR");
        localStorage.removeItem("ORDENAR_CATALOGO_DE_PRODUCTOS_DE_FORMA");
        callback();
    };
    CatalogoDeProductoControlador.prototype.limpiarCampoDeFiltroDeProducto = function () {
        var campoDeFiltroDeProducto = $("#UiTextoFiltroEnCatalogoDeProductos");
        campoDeFiltroDeProducto.val("");
        campoDeFiltroDeProducto.focus();
        campoDeFiltroDeProducto = null;
    };
    CatalogoDeProductoControlador.prototype.cargarPantalla = function () {
        var _this = this;
        InteraccionConUsuarioServicio.bloquearPantalla();
        try {
            this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (configuracionDecimales) {
                _this.configuracionDecimales = configuracionDecimales;
                _this.cargarCatalogoDeProductos(function () {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                });
            });
        }
        catch (error) {
            notify("No ha sido posible preparar la informaci\u00F3n debido a: " + error.message);
        }
    };
    CatalogoDeProductoControlador.prototype.cargarCatalogoDeProductos = function (callback) {
        var _this = this;
        var producto = new Sku();
        var cliente = new Cliente();
        cliente.priceListId = localStorage.getItem("gDefaultPriceList");
        if (!localStorage.getItem("LISTA_TIPO_FAMILIA_SKU")) {
            localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
        }
        producto.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
        this.productoServicio.obtenerCatalogoDeProductos(cliente, producto, this.configuracionDecimales, function (catalogoDeProductos) {
            _this.listadoDeProductos = catalogoDeProductos;
            _this.lastLowLimit = 0;
            _this.currentLimit = _this.pivotLimit;
            _this.cargarListaDeProductos(catalogoDeProductos.slice(0, _this.pivotLimit));
            if (callback) {
                callback();
            }
        }, function (resultado) {
            notify(resultado.mensaje);
        }, localStorage.getItem("ORDENAR_CATALOGO_DE_PRODUCTOS_POR"), localStorage.getItem("ORDENAR_CATALOGO_DE_PRODUCTOS_DE_FORMA"));
    };
    CatalogoDeProductoControlador.prototype.cargarListaDeProductos = function (listadoDeProductos) {
        try {
            my_dialog("Sonda® " + SondaVersion, "Cargando catálogo...", "open");
            var listaDeCatalogoDeProductos = $("#UiListaDeCatalogoDeProductos");
            listaDeCatalogoDeProductos.listview();
            listaDeCatalogoDeProductos.children().remove("li");
            if (listadoDeProductos.length >= 1) {
                var li = "";
                for (var i = 0; i < listadoDeProductos.length; i++) {
                    li += this.obtenerHtmlParaProducto(listadoDeProductos[i]);
                }
                if (li !== "") {
                    listaDeCatalogoDeProductos.append(li);
                    listaDeCatalogoDeProductos.listview("refresh");
                }
            }
            listaDeCatalogoDeProductos = null;
            my_dialog("", "", "close");
        }
        catch (err) {
            notify(err.message);
        }
    };
    CatalogoDeProductoControlador.prototype.obtenerHtmlParaProducto = function (sku) {
        var li = [];
        li.push("<li data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'");
        li.push(" id='SKU_" + sku.sku.replace(" ", "_") + "'>");
        li.push(" <a href='#'");
        li.push(" <p>");
        li.push(" <span style='background-color: #005599; border-radius: 4px; color: #ffffff; padding: 3px; ");
        li.push(" text-shadow: none; font-size:13px' > " + format_number(sku.onHand, this.configuracionDecimales.defaultDisplayDecimals) + "</span>&nbsp");
        li.push(" <span style='font-size:12px;'>" + sku.sku + "</span>");
        li.push(" </p><p> <span style='font-size:12px;'>" + sku.skuName + "</span>");
        li.push(" </p>");
        li.push(" <p>");
        li.push(" <span class='ui-li-count'> " + DarFormatoAlMonto(format_number(sku.cost, this.configuracionDecimales.defaultDisplayDecimals)) + "</span>");
        if (sku.codeFamilySku !== null && sku.codeFamilySku !== "") {
            li.push("<span class='small-roboto'>Familia: " + sku.codeFamilySku + "</span>");
        }
        li.push("</p>");
        li.push("</a>");
        li.push("</li>");
        return li.join("");
    };
    CatalogoDeProductoControlador.prototype.solicitarTipoDeOrdenamientoDeCatalogoDeProductos = function () {
        var _this = this;
        var listaDeTipoDeOrdenamiento = [];
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Ascendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Ascendente.toString()
        });
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Descendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Descendente.toString()
        });
        var configuracionDeOpcionesDeOrdenamiento = {
            title: "Tipo de Orden",
            items: listaDeTipoDeOrdenamiento,
            doneButtonLabel: "Aceptar",
            cancelButtonLabel: "Cancelar"
        };
        ShowListPicker(configuracionDeOpcionesDeOrdenamiento, function (item) {
            localStorage.setItem("ORDENAR_CATALOGO_DE_PRODUCTOS_DE_FORMA", item);
            _this.cargarCatalogoDeProductos();
        });
    };
    return CatalogoDeProductoControlador;
}());
//# sourceMappingURL=CatalogoDeProductoControlador.js.map