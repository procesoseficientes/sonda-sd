var EstadisticaDeVentaPorDiaControlador = (function () {
    function EstadisticaDeVentaPorDiaControlador() {
        this.estadisticaDeVentaServicio = new EstadisticaDeVentaServicio();
        this.estadisticaDeVentaPorCliente = new Array();
        this.funcionDeRetornoAProcesoPrincipal = null;
    }
    EstadisticaDeVentaPorDiaControlador.prototype.delegarEstadisticaDeVentaPorDiaControlador = function () {
        var _this_1 = this;
        _this = this;
        $("#UiSaleStatisticPage").on("pageshow", function (e) {
            e.preventDefault();
            var diaSemana = $("#lblDiaSemana");
            diaSemana.html(estadisticaDeVentaPorDiaControlador.obtenerDiaActual());
            diaSemana = null;
            var tablaEstadistica = $("#TableEstadistica");
            tablaEstadistica.floatThead({
                scrollContainer: function (tabla) {
                    return tabla.closest(".product-list-table");
                }
            });
            tablaEstadistica = null;
        });
        $("#SelectAllProducts").on("click", function () {
            var botonPrincipal = $("#SelectAllProducts");
            $(".selection")
                .prop("checked", botonPrincipal.prop("checked"))
                .checkboxradio("refresh");
            botonPrincipal = null;
        });
        $(".selection").on("click", function () {
            if ($(".selection").length === $(".selection:checked").length) {
                $("#SelectAllProducts")
                    .prop("checked", true)
                    .checkboxradio("refresh");
            }
            else {
                $("#SelectAllProducts")
                    .prop("checked", false)
                    .checkboxradio("refresh");
            }
        });
        $("#UiBtnContinuarVenta").on("click", function (e) {
            e.preventDefault();
            navigator.notification.confirm("¿Desea continuar al proceso de venta?", function (buttonIndex) {
                if (buttonIndex === 2) {
                    _this_1.funcionDeRetornoAProcesoPrincipal();
                }
            }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
        });
        $("#UiBtnCrearVenta").on("click", function (e) {
            e.preventDefault();
            var productosSeleccionados = [];
            if ($("input[class=selection]:checked").length > 0) {
                navigator.notification.confirm("¿Desea crear una venta sugerida con los productos seleccionados?", function (buttonIndex) {
                    if (buttonIndex === 2) {
                        $("input[class=selection]:checked").each(function (_idx, productoSeleccionado) {
                            var codeSku = productoSeleccionado.attributes["id"]
                                .nodeValue;
                            var producto = _this.estadisticaDeVentaPorCliente.find(function (estadisticaDeVenta) {
                                return estadisticaDeVenta.codeSku === codeSku;
                            });
                            if (producto) {
                                productosSeleccionados.push(producto);
                            }
                        });
                        for (var i = 0; i < productosSeleccionados.length; i++) {
                            var producto = productosSeleccionados[i];
                            InsertInvoiceDetail(producto.codeSku, producto.price, producto.qty <= producto.onHand
                                ? producto.qty
                                : producto.onHand, function () { }, producto.salePackUnit, producto.codePackUnitStock, producto.conversionFactor || 1);
                        }
                        _this_1.funcionDeRetornoAProcesoPrincipal();
                    }
                }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
            }
            else {
                notify("Debe seleccionar al menos un registro");
            }
        });
    };
    EstadisticaDeVentaPorDiaControlador.prototype.regresarPantallaAutorizacion = function () {
        window.history.back();
    };
    EstadisticaDeVentaPorDiaControlador.prototype.construirVisualizacionDeEstadisticaDeCliente = function (estadisticas, callback) {
        var registro = [];
        _this.estadisticaDeVentaPorCliente = estadisticas;
        var tablaEstadistica = $("#TableEstadistica tbody");
        tablaEstadistica.children().remove("tr");
        tablaEstadistica = null;
        estadisticas.forEach(function (estadisticaDeVentaPorCliente, iteracion) {
            var onHand = estadisticaDeVentaPorCliente.onHand;
            var qty = estadisticaDeVentaPorCliente.qty;
            var price = estadisticaDeVentaPorCliente.price;
            if (onHand == 0 || price == 0) {
                registro.push('<tr class="check  table-row-disabled">');
                registro.push('<td class="ui-checkbox ui-state-disabled" >');
                registro.push('<div class="ui-checkbox ui-state-disabled ">');
                registro.push('<label class="ui-btn ui-corner-all ui-btn-inherit ui-btn-icon-left ui-checkbox-off" style="border: none;margin: 0; font-size: 12px; padding-bottom: 0; padding-top: 0; padding-right:0;">');
            }
            else {
                registro.push('<tr class="check">');
                registro.push("<td>");
                registro.push('<div class="ui-checkbox ">');
                registro.push('<label class="ui-btn ui-corner-all ui-btn-inherit ui-btn-icon-left ui-checkbox-off" style="border: none;margin: 0; font-size: 12px; padding-bottom: 0; padding-top: 0; padding-right:0;">');
            }
            if (onHand == 0 || price == 0) {
                registro.push("<input type=\"checkbox\"  name=\"" + estadisticaDeVentaPorCliente.codeSku + "\" id=\"" + estadisticaDeVentaPorCliente.codeSku + "\" value=\"" + estadisticaDeVentaPorCliente.skuName + "\">");
            }
            else {
                registro.push("<input type=\"checkbox\" class=\"selection\"  name=\"" + estadisticaDeVentaPorCliente.codeSku + "\" id=\"" + estadisticaDeVentaPorCliente.codeSku + "\" value=\"" + estadisticaDeVentaPorCliente.skuName + "\">");
            }
            registro.push("<p class=\"valTableEstatistic\">" + estadisticaDeVentaPorCliente.codeSku + "</p>");
            registro.push("<p class=\"valTableEstatistic\">" + estadisticaDeVentaPorCliente.skuName + "</p>");
            registro.push("</label>");
            registro.push("</div>");
            registro.push("</td>");
            registro.push("<td class=\"valTableEstatistic\">" + estadisticaDeVentaPorCliente.qty + "</td>");
            registro.push("<td class=\"valTableEstatistic\">" + estadisticaDeVentaPorCliente.onHand + "</td>");
            registro.push("<td class=\"valTableEstatistic\">" + estadisticaDeVentaPorCliente.salePackUnit + "</td>");
            registro.push("</tr>");
        });
        var cadenaHtml = registro.join("");
        $("#TableEstadistica tbody").append(cadenaHtml);
        $("#TableEstadistica tbody").trigger("create");
        $(".selection").trigger("click");
        $(".selection")
            .prop("checked", false)
            .checkboxradio("refresh");
        $("#SelectAllProducts").prop("checked", false);
        callback();
    };
    EstadisticaDeVentaPorDiaControlador.prototype.obtenerDiaActual = function () {
        var fecha = new Date();
        var dia_semana = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado"
        ];
        return dia_semana[fecha.getDay()];
    };
    return EstadisticaDeVentaPorDiaControlador;
}());
//# sourceMappingURL=EstadisticaDeVentaPorDiaControlador.js.map