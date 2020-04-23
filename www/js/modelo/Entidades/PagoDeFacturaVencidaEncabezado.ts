class PagoDeFacturaVencidaEncabezado {
    id: number = 0;
    codeCustomer: string = "";
    nameCustomer: string = "";
    docSerie: string = "";
    docNum: number = 0;
    branchName: string = "";
    branchAddress: string = "";
    createdDate: Date = new Date();
    postedDate: Date;
    codeRoute: string = "";
    loginId: string = "";
    paymentAmount: number = 0;
    isPosted: number = 0;
    overdueInvoicePaymentDetail: Array<PagoDeFacturaVencidaDetalle> = [];
    allInvoicesHasBenPayed: boolean = false;
    isReprint: boolean = false;
    reprint: boolean = false;
    printsQuantity: number = 0;
    validateMinimumPercentOfPaid: boolean = false;
    minimumPercentOfPaid: number = 0;
    percentCoveredWhitThePaid: number = 0;
    paidComment: string = "";
    overdueInvoicePaymentTypeDetail: Array<TipoDePagoEnFacturaVencida> = [];
    paymentType: TipoDePagoDeFactura;
}