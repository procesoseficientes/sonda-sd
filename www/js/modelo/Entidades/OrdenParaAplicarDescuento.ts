class OrdenParaAplicarDescuento {
    order: number = 0;
    codeSku: string;
    codePackUnit: string;
    codeDiscount: ListaDeDescuento = ListaDeDescuento.DescuentoPorEscala;
    description: string = "";
    discount: number = 0
    discountType: string = "";
    applied: boolean = false;
    applyDiscount: boolean = true;
    codeFamily: string;
    isUnique: boolean = false;
}