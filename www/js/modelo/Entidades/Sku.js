var Sku = (function () {
    function Sku() {
        this.sku = "";
        this.skuName = "";
        this.skuPrice = 0.00;
        this.skuLink = "";
        this.requeriesSerie = 0;
        this.isKit = 0;
        this.onHand = 0;
        this.routeId = "";
        this.isParent = 0;
        this.parentSku = "";
        this.exposure = "";
        this.priority = 0;
        this.qtyRelated = 0;
        this.loadedLastUpdate = new Date();
        this.taxCode = "";
    }
    return Sku;
}());
//# sourceMappingURL=Sku.js.map