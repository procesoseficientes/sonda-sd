class MonedaServicio implements IMonedaServicio {
   agregarMoneda(moneda: Moneda): void {
       localStorage.setItem("DISPLAY_SYMBOL_CURRENCY", moneda.symbolCurrency);
    }
}