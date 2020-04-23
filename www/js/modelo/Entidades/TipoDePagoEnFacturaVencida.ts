class TipoDePagoEnFacturaVencida {
    paymentTypeId: number = 0;
    paymentHeaderId: number = 0;
    paymentType: TipoDePagoFacturaVencida = TipoDePagoFacturaVencida.Efectivo;
    frontImage: string = "";
    backImage: string = "";
    documentNumber: string = "";
    bankAccount: string = "";
    bankName: string = "";
    amount: number = 0;
    docSerie: string = "";
    docNum: number = 0;
}