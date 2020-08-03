var MonedaServicio = (function () {
    function MonedaServicio() {
    }
    MonedaServicio.prototype.agregarMoneda = function (moneda) {
        localStorage.setItem("DISPLAY_SYMBOL_CURRENCY", moneda.symbolCurrency);
    };
    return MonedaServicio;
}());
//# sourceMappingURL=MonedaServicio.js.map