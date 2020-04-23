class BonoPorCombo {
    bonusListId: number;
    comboId: number;
    bonusType: string;
    bonusSubType: string;
    isBonusByLowPurchase: number;
    isBonusByCombo: number;
    lowQty: number;
    nameCombo: string;
    descriptionCombo: string;
    isConfig: boolean;
    isEmpty: boolean;
    owner: string;
    ownerId: string;
    promoId: number = 0;
    promoName: string = "";
    promoType: string = "";
    frequency: string = "";

    skusPorCombo: SkuPorCombo[];
    skusDeBonoPorCombo: SkuDeBonoPorCombo[];
    skusDeBonoPorComboAsociados: SkuDeBonoPorCombo[];
}