var PagoDeFacturaVencidaDetalle = (function () {
    function PagoDeFacturaVencidaDetalle() {
        this.paymentHeaderId = 0;
        this.invoiceId = 0;
        this.docEntry = 0;
        this.createdDate = new Date();
        this.dueDate = new Date();
        this.docSerie = "";
        this.docNum = 0;
        this.payedAmount = 0;
        this.pendingToPaid = 0;
    }
    return PagoDeFacturaVencidaDetalle;
}());
//# sourceMappingURL=PagoDeFacturaVencidaDetalle.js.map