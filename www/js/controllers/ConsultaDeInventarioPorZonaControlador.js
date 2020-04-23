var socketConsultaInventario;
var ConsultaDeInventarioPorZonaControlador = (function () {
    function ConsultaDeInventarioPorZonaControlador() {
        this.consultaDeInventarioPorZonaServicio = new ConsultaDeInventarioPorZonaServicio();
        this.vieneDeListadoDeSkus = false;
    }
    ConsultaDeInventarioPorZonaControlador.prototype.delegarConsultaDeInventarioControlador = function () {
        var _this = this;
        var este = this;
        document.addEventListener("backbutton", function () {
            este.salirDeConsultaDeInventarioPorZona();
        }, true);
        $("#UiBtnConsultarInventarioPorZona").on("click", function () {
            _this.vieneDeListadoDeSkus = false;
            _this.mostrarPantallaDeConsultaDeInventarioPorZona();
        });
        $("#UiPageQueryInventoryByZone").on("pageshow", function () {
            my_dialog("", "", "close");
            var labelFecha = $("#uiLblUltimaConsulta");
            labelFecha.text(localStorage.getItem("ULTIMA_CONSULTA_DE_INVENTARIO"));
            labelFecha = null;
            var txtFiltro = $("#uiTxtFiltroInventarioSkuPorZona");
            txtFiltro.val("");
            txtFiltro.focus();
            txtFiltro = null;
        });
        $("#uiTxtFiltroInventarioSkuPorZona").on("keypress", function (e) {
            if (e.keyCode === 13) {
                _this.usuarioDeseaConsultarInventarioDeSkusPorZona();
                return false;
            }
        });
        $("#uiBtnConsultarInventarioDeSkuPorZona").on("click", function () {
            _this.usuarioDeseaConsultarInventarioDeSkusPorZona();
        });
        $("#uiBtnLimpiarFiltroDeConsultaDeInventarioPorZona").on("click", function () {
            var txtFiltro = $("#uiTxtFiltroInventarioSkuPorZona");
            txtFiltro.val("");
            txtFiltro.focus();
            txtFiltro = null;
        });
        $("#uiBtnSalirDeConsultaDeInventarioPorZona").on("click", function () {
            _this.salirDeConsultaDeInventarioPorZona();
        });
        $("#UiBtnConsultarInventarioPorZonaDesdeListadoDeSkus").on("click", function () {
            _this.vieneDeListadoDeSkus = true;
            _this.mostrarPantallaDeConsultaDeInventarioPorZona();
        });
    };
    ConsultaDeInventarioPorZonaControlador.prototype.delegarSockets = function (socketIo) {
        var _this = this;
        try {
            socketIo.on("GetInventoryForSkuByZoneResponse", function (data) {
                switch (data.option) {
                    case "inventory_for_sku_by_zone_found":
                        my_dialog("", "", "close");
                        _this.actualizarFechaYHoraDeUltimaConsulta();
                        _this.mostrarListadoDeSkusDeInventarioPorZona(data.recordSet);
                        break;
                    case "inventory_for_sku_by_zone_not_found":
                        my_dialog("", "", "close");
                        var skus = [];
                        _this.actualizarFechaYHoraDeUltimaConsulta();
                        _this.mostrarListadoDeSkusDeInventarioPorZona(skus);
                        skus = null;
                        break;
                    case "inventory_for_sku_by_zone_error":
                        my_dialog("", "", "close");
                        _this.actualizarFechaYHoraDeUltimaConsulta();
                        notify(data.Message);
                        break;
                }
            });
            socketConsultaInventario = socketIo;
        }
        catch (e) {
            notify("Error al delegar Sockets debido a: " + e.message);
        }
    };
    ConsultaDeInventarioPorZonaControlador.prototype.actualizarFechaYHoraDeUltimaConsulta = function () {
        try {
            localStorage.setItem("ULTIMA_CONSULTA_DE_INVENTARIO", getDateTime());
            var labelFecha = $("#uiLblUltimaConsulta");
            labelFecha.text(localStorage.getItem("ULTIMA_CONSULTA_DE_INVENTARIO"));
            labelFecha = null;
        }
        catch (e) {
            notify(e.message);
        }
    };
    ConsultaDeInventarioPorZonaControlador.prototype.salirDeConsultaDeInventarioPorZona = function () {
        try {
            switch ($.mobile.activePage[0].id) {
                case "UiPageQueryInventoryByZone":
                    var pantalla = this.vieneDeListadoDeSkus ? "skus_list_page" : "menu_page";
                    $.mobile.changePage("#" + pantalla, {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                    break;
            }
        }
        catch (e) {
            notify(e.message);
        }
    };
    ConsultaDeInventarioPorZonaControlador.prototype.mostrarPantallaDeConsultaDeInventarioPorZona = function () {
        try {
            my_dialog("Por favor, espere", "", "open");
            this.limpiarListaDeSkusConsultados(function () {
                $.mobile.changePage("#UiPageQueryInventoryByZone", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            });
        }
        catch (e) {
            notify(e.message);
        }
    };
    ConsultaDeInventarioPorZonaControlador.prototype.limpiarListaDeSkusConsultados = function (callBack) {
        try {
            var uiListaSkus = $("#uiListaSkusDeInventarioPorZona");
            uiListaSkus.children().remove("li");
            uiListaSkus = null;
            callBack();
        }
        catch (e) {
            notify(e.message);
        }
    };
    ConsultaDeInventarioPorZonaControlador.prototype.usuarioDeseaConsultarInventarioDeSkusPorZona = function () {
        try {
            my_dialog("Espere", "Consultando información, por favor, espere...", "open");
            if (gIsOnline === EstaEnLinea.Si) {
                var skuAConsultar = $("#uiTxtFiltroInventarioSkuPorZona");
                if (skuAConsultar.val() === "") {
                    my_dialog("", "", "close");
                    notify("El campo de filtro no debe estar vacío, por favor, verifique y vuelva a intentar.");
                    skuAConsultar.focus();
                }
                else {
                    this.consultaDeInventarioPorZonaServicio.consultarInventarioDeSkuPorZona(socketConsultaInventario, skuAConsultar.val(), function (resultado) {
                        my_dialog("", "", "close");
                        notify(resultado.mensaje);
                    });
                }
            }
            else {
                my_dialog("", "", "close");
                notify("Debe tener conexión al servidor para poder consultar los datos, por favor verifique y vuelva a intentar...");
            }
        }
        catch (e) {
            my_dialog("", "", "close");
            notify(e.message);
        }
    };
    ConsultaDeInventarioPorZonaControlador.prototype.mostrarListadoDeSkusDeInventarioPorZona = function (skus) {
        try {
            var li = void 0;
            var objetoListaSkus = $("#uiListaSkusDeInventarioPorZona");
            objetoListaSkus.children().remove("li");
            if (skus.length === 0) {
                li = "<li>";
                li += "<p>";
                li += "No se encontraron coincidencias para el Sku proporcionado...";
                li += "<p>";
                li += "</li>";
                objetoListaSkus.append(li);
                objetoListaSkus.listview("refresh");
            }
            else {
                li = "<li>";
                li += "<span style='width: 95%; text-align: center;'>" + skus[0].DESCRIPTION_SKU + "</span>";
                li += "<table style='width: 100%;' data-role='table' data-mode='reflow' class='ui-responsive table-stroke'>";
                li += "<tr>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<span>" + "<b>" + "BODEGA" + "</b></span>";
                li += "</td>";
                li += "<td style='width: 50%;text-align: right;'>";
                li += "<span>" + "<b>" + "DISPONIBLE" + "</b></span>";
                li += "</td>";
                li += "</tr>";
                for (var _i = 0, skus_1 = skus; _i < skus_1.length; _i++) {
                    var sku = skus_1[_i];
                    li += "<tr>";
                    li += "<td style='width: 50%; text-align: left;'>";
                    li += "<span>" + sku.WAREHOUSE + "</span>";
                    li += "</td>";
                    li += "<td style='width: 50%; text-align: right;'>";
                    li += "<span>" + sku.ON_HAND + "</span>";
                    li += "</td>";
                    li += "</tr>";
                }
                li += "</table>";
                li += "</li>";
                objetoListaSkus.append(li);
                objetoListaSkus.listview("refresh");
            }
        }
        catch (e) {
            notify(e.message);
        }
    };
    return ConsultaDeInventarioPorZonaControlador;
}());
//# sourceMappingURL=ConsultaDeInventarioPorZonaControlador.js.map