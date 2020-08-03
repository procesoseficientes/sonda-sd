var EstadisticaDeVentaControlador = (function () {
    function EstadisticaDeVentaControlador() {
        this.estadisticaDeVentaServicio = new EstadisticaDeVentaServicio();
        this.decimalesServicio = new ManejoDeDecimalesServicio();
        this.decimales = new ManejoDeDecimales();
    }
    EstadisticaDeVentaControlador.prototype.mostrarUOcultarContenedorDeModuloDeMEtas = function (mostrarModuloDeMetas) {
        var contenedorDeMetas = $("#UiGoalsContainer");
        if (mostrarModuloDeMetas) {
            contenedorDeMetas.css("display", "block");
            this.obtenerInformacionDeEstadisticaDeVentaActual();
        }
        else {
            contenedorDeMetas.css("display", "none");
        }
        contenedorDeMetas = null;
    };
    EstadisticaDeVentaControlador.prototype.obtenerInformacionDeEstadisticaDeVentaActual = function () {
        var _this_1 = this;
        this.estadisticaDeVentaServicio.obtenerInformacionDeEstadisticaDeVenta(function (estadistica) {
            _this_1.construirVisualizacionDeInformacionDeEstadisticaDeVenta(estadistica);
        });
    };
    EstadisticaDeVentaControlador.prototype.construirVisualizacionDeInformacionDeEstadisticaDeVenta = function (estadisticaDeVenta) {
        var _this_1 = this;
        try {
            this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (configuracionDeDecimales) {
                _this_1.decimales = configuracionDeDecimales;
                var teamName = $("#teamName");
                var goalName = $("#goalName");
                var ranking = $("#ranking");
                var goalAmount = $("#goalAmount");
                var accumulatedAmount = $("#accumulatedAmount");
                var remainingDays = $("#remainingDays");
                var goalAmountOfDay = $("#goalAmountOfDay");
                var soldToday = $("#soldToday");
                var salesOrdersOfDay = $("#salesOrdersOfDay");
                var pendingToSaleToday = $("#pendingToSaleToday");
                var currencySymbol = localStorage.getItem("DISPLAY_SYMBOL_CURRENCY") || "Q";
                if (estadisticaDeVenta.goalHeaderId) {
                    localStorage.setItem("GOAL_HEADER_ID", estadisticaDeVenta.goalHeaderId.toString());
                }
                teamName.text(estadisticaDeVenta.teamName);
                goalName.text(estadisticaDeVenta.goalName);
                ranking.text(estadisticaDeVenta.ranking);
                goalAmount.text(currencySymbol + " " + format_number(estadisticaDeVenta.goalAmount, _this_1.decimales.defaultDisplayDecimals));
                accumulatedAmount.text(currencySymbol + " " + format_number(estadisticaDeVenta.accumulatedAmount +
                    estadisticaDeVenta.soldToday, _this_1.decimales.defaultDisplayDecimals) + " (" + _this_1.obtenerPorcentajeDeMetaCubiertoPorVentas(estadisticaDeVenta) + "%) ");
                remainingDays.text("" + estadisticaDeVenta.remainingDays);
                goalAmountOfDay.text(currencySymbol + " " + format_number(estadisticaDeVenta.goalAmountOfDay, _this_1.decimales.defaultDisplayDecimals));
                soldToday.text(currencySymbol + " " + format_number(estadisticaDeVenta.soldToday, _this_1.decimales.defaultDisplayDecimals));
                salesOrdersOfDay.text("(" + estadisticaDeVenta.salesOrdersOfDay + ")");
                pendingToSaleToday.text(currencySymbol + " " + format_number(estadisticaDeVenta.pendingToSaleToday, _this_1.decimales.defaultDisplayDecimals));
                currencySymbol = null;
                teamName = null;
                goalName = null;
                ranking = null;
                goalAmount = null;
                accumulatedAmount = null;
                remainingDays = null;
                goalAmountOfDay = null;
                soldToday = null;
                salesOrdersOfDay = null;
                pendingToSaleToday = null;
            });
        }
        catch (e) {
            console.log("Ha ocurrido un error al intentar mostrar la estad\u00EDstica de venta debido a: " + e.message);
            notify("Ha ocurrido un error al intentar mostrar la estad\u00EDstica de venta.");
        }
    };
    EstadisticaDeVentaControlador.prototype.obtenerPorcentajeDeMetaCubiertoPorVentas = function (estadisticaDeVenta) {
        var montoTotalAcumulado = 0;
        var porcentajeDeMetaCubierto = 0;
        montoTotalAcumulado =
            estadisticaDeVenta.accumulatedAmount + estadisticaDeVenta.soldToday;
        if (montoTotalAcumulado > 0 && estadisticaDeVenta.goalAmount > 0) {
            porcentajeDeMetaCubierto =
                (montoTotalAcumulado * 100) / estadisticaDeVenta.goalAmount;
        }
        return porcentajeDeMetaCubierto;
    };
    return EstadisticaDeVentaControlador;
}());
//# sourceMappingURL=EstadisticaDeVentaControlador.js.map