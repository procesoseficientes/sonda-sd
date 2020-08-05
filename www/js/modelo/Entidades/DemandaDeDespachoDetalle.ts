class DemandaDeDespachoDetalle {
    pickingDemandDetailId: number;
    pickingDemandHeaderId: number;
    materialId: string;
    materialDescription: string;
    requeriesSerie: number;
    qty: number;
    lineNum: number;
    erpObjectType: number;
    price: number;
    wasImploded: number;
    qtyImploded: number;
    masterIdMaterial: string;
    materialOwner: string;
    attemptedWithError: number;
    isPostedErp: number;
    postedErp: Date;
    erpReference: string;
    postedStatus: string;
    postedResponse: string;
    innerSaleStatus: string;
    innerSaleResponse: string;
    tone: string;
    caliber: string;
    isBonus: number;
    discount: number;
}