var ListaSkuTomaDeInventarioControlador = (function () {
    function ListaSkuTomaDeInventarioControlador(mensajero) {
        this.mensajero = mensajero;
        this.skuServicio = new SkuServicio();
        this.decimalesServicio = new ManejoDeDecimalesServicio();
        this.tokenCliente = mensajero.subscribe(this.clienteEntregado, getType(ClienteMensaje), this);
    }
    ListaSkuTomaDeInventarioControlador.prototype.delegadoListaSkuTomaDeInventarioControlador = function () {
        var _this = this;
        document.addEventListener("backbutton", function () {
            _this.usuarioDeseaRegresarATomaDeInventario();
        }, true);
        $("#UiSkusListPageForTakeInventory").on("pageshow", function () {
            var uiSkuListViewForTakeInventory = $("#UiSkuListViewForTakeInventory");
            _this.obtenerListaSku(function (operacion) {
                if (operacion.resultado === ResultadoOperacionTipo.Error) {
                    notify(operacion.mensaje);
                }
                uiSkuListViewForTakeInventory.focus();
            });
        });
        $("#UiSkusListPageForTakeInventory").on("click", "#UiSkuListViewForTakeInventory li", function (event) {
            var id = event.currentTarget.attributes["id"].nodeValue;
            _this.usuarioSeleccionoSku(id);
        });
        $("#UiBotonFiltrarListaSkuInventario").bind("touchstart", function () {
            _this.usuarioDeseaAgruparListaSku();
        });
    };
    ListaSkuTomaDeInventarioControlador.prototype.clienteEntregado = function (mensaje, subcriber) {
        subcriber.cliente = mensaje.cliente;
    };
    ListaSkuTomaDeInventarioControlador.prototype.usuarioDeseaRegresarATomaDeInventario = function () {
        switch ($.mobile.activePage[0].id) {
            case "UiSkusListPageForTakeInventory":
                $.mobile.changePage("#UiPageTakeInventory", {
                    transition: "pop",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
                break;
        }
    };
    ListaSkuTomaDeInventarioControlador.prototype.usuarioDeseaAgruparListaSku = function () {
        var _this = this;
        this.skuServicio.obtenerFamiliaSku(function (familiaSku) {
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
            var configoptions = {
                title: "Listado de productos",
                items: listaDeFamiliaSku,
                doneButtonLabel: "Ok",
                cancelButtonLabel: "Cancelar"
            };
            ShowListPicker(configoptions, function (item) {
                var prevCodeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", item);
                _this.obtenerListaSku(function (operacion) {
                    if (operacion.resultado === ResultadoOperacionTipo.Error) {
                        notify(operacion.mensaje);
                        localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", prevCodeFamilySku);
                    }
                });
            });
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    ListaSkuTomaDeInventarioControlador.prototype.obtenerListaSku = function (callback) {
        var _this = this;
        try {
            var sku = new Sku();
            if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
            }
            sku.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
            this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
                _this.skuServicio.obtenerSkuParaTomaInventario(sku.codeFamilySku.toString(), function (listaSku) {
                    _this.cargarListaSku(listaSku);
                }, callback);
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        catch (err) {
            notify(err.mensaje);
        }
    };
    ListaSkuTomaDeInventarioControlador.prototype.cargarListaSku = function (listaSku) {
        try {
            this.listaSku = listaSku;
            var skulist = $("#UiSkuListViewForTakeInventory");
            skulist.children().remove("li");
            for (var i = 0; i < listaSku.length; i++) {
                var li = "";
                var sku = listaSku[i];
                li += "<li data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'";
                li += " id='idlstSku" + sku.sku.replace(" ", "_") + "'>";
                li += " <a href='#'";
                li += " <p>";
                li += " <span style='font-size:12px;'>" + sku.sku + " " + sku.skuName + "</span>";
                li += " </p>";
                li += " <p>";
                if (sku.codeFamilySku !== null && sku.codeFamilySku !== "") {
                    li += "<span class='small-roboto'>Cod. Fam. SKU: " + sku.codeFamilySku + "</span>";
                }
                li += "</p>";
                li += "</a>";
                li += "</li>";
                skulist.append(li);
                skulist.listview("refresh");
            }
            skulist = null;
        }
        catch (err) {
            notify(err.message);
        }
    };
    ListaSkuTomaDeInventarioControlador.prototype.publicarSku = function (sku) {
        var msg = new SkuMensaje(this);
        msg.sku = sku;
        this.mensajero.publish(msg, getType(SkuMensaje));
    };
    ListaSkuTomaDeInventarioControlador.prototype.publicarEstablecerOpcionMensaje = function (skuDesdeLista) {
        var msg = new EstablecerOpcionMensaje(this);
        msg.skuDesdeLista = skuDesdeLista;
        this.mensajero.publish(msg, getType(EstablecerOpcionMensaje));
    };
    ListaSkuTomaDeInventarioControlador.prototype.usuarioSeleccionoSku = function (idSku) {
        for (var i = 0; i < this.listaSku.length; i++) {
            var sku = this.listaSku[i];
            if (sku.sku === idSku.replace("_", " ").substr(8)) {
                sku.qty = 1;
                this.publicarSku(sku);
                this.publicarEstablecerOpcionMensaje("SI");
                $.mobile.changePage("#UiUnitPackPageTakeInventory", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
                break;
            }
        }
    };
    return ListaSkuTomaDeInventarioControlador;
}());
//# sourceMappingURL=ListaSkuTomaDeInventarioControlador.js.map