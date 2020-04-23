var OrdenParaAplicarDescuento = (function () {
    function OrdenParaAplicarDescuento() {
        this.order = 0;
        this.codeDiscount = ListaDeDescuento.DescuentoPorEscala;
        this.description = "";
        this.discount = 0;
        this.discountType = "";
        this.applied = false;
        this.applyDiscount = true;
        this.isUnique = false;
    }
    return OrdenParaAplicarDescuento;
}());
//# sourceMappingURL=OrdenParaAplicarDescuento.js.map