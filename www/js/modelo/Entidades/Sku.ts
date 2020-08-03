class Sku {
    sku: string = "";
    skuName: string = "";
    skuPrice: number = 0.00;
    skuLink: string = "";
    requeriesSerie: number = 0;
    isKit: number = 0;
    onHand: number = 0;
    routeId: string = "";
    isParent: number = 0;
    parentSku: string = "";
    exposure: string = "";
    priority: number = 0;
    qtyRelated: number = 0;
    qty: number;
    isBonus: number;
    discount: number;
    price: number;
    totalLine: number;
    loadedLastUpdate: Date = new Date();
    taxCode: string = "";
}