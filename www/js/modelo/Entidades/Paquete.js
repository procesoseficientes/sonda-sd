var Paquete = (function () {
    function Paquete() {
        this.packUnit = 0;
        this.dimensions = new Array();
        this.totalPorDimension = 0;
        this.appliedDiscount = 0;
        this.isSaleByMultiple = false;
        this.multiple = 0;
        this.discountType = "";
        this.promoDescuento = new Promo();
        this.promoVentaPorMultiplo = new Promo();
    }
    return Paquete;
}());
//# sourceMappingURL=Paquete.js.map