class Paquete {
    packUnit: number = 0;
    codePackUnit: string;
    descriptionPackUnit: string;
    priority: number;
    qty: number;
    price: number;
    lastQtySold: number;
    codePackUnitTo: string;
    descriptionPackUnitTo: string;
    dimensions: Array<DimensionSku> = new Array<DimensionSku>();
    totalPorDimension: number = 0;
    appliedDiscount: number = 0;
    codeSku: string;
    isSaleByMultiple: boolean = false;
    multiple: number = 0;
    discountType: string = "";
    promoDescuento: Promo = new Promo();
    promoVentaPorMultiplo: Promo = new Promo();
}