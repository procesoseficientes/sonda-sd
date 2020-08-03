class PagoDeFacturaVencidaDetalle {
    paymentHeaderId: number = 0;
    invoiceId: number = 0;
    docEntry: number = 0;
    createdDate: Date = new Date();
    dueDate: Date = new Date();
    docSerie: string = "";
    docNum: number = 0;
    payedAmount: number = 0;
    pendingToPaid: number = 0;
}