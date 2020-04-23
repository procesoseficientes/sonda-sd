class PagoDeFacturaVencidaDetalle {
  paymentHeaderId: number = 0;
  invoiceId: string = "";
  docEntry: string = "";
  createdDate: Date = new Date();
  dueDate: Date = new Date();
  docSerie: string = "";
  docNum: number = 0;
  amountToDate: number = 0;
  payedAmount: number = 0;
  pendingToPaid: number = 0;
  pendingAmount: number = 0;
}
