class Bono {
    bonusListId: number = 0;
    codeSku: string = "";
    codePackUnit: string = "";
    lowLimitTemp: number = 0;
    highLimitTemp: number = 0;
    codeSkuBonus: string = "";
    bonusQtyTemp: number = 0;
    codePackUnitBonues: string = "";
    descriptionSkuBonues: string = "";
    multiplo: number = 0;
    bonusQtyMultiplo: number;
    owner: string;
    ownerId: string;
    tipoDeBonificacion: TipoDeBonificacion;
    escalas: Array<EscalaDeBono> = Array<EscalaDeBono>();
    bonusQty: number = 0;
    promoIdMultiple: number = 0;
    promoNameMultiple: string = "";
    promoTypeMultiple: string = "";
    frequencyMultiple: string = "";
    promoIdScale: number = 0;
    promoNameScale: string = "";
    promoTypeScale: string = "";
    frequencyScale: string = "";
    applyPromoByMultiple: boolean = false;
}