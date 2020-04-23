var PagoDeFacturaVencidaEncabezado = (function () {
    function PagoDeFacturaVencidaEncabezado() {
        this.id = 0;
        this.codeCustomer = "";
        this.nameCustomer = "";
        this.docSerie = "";
        this.docNum = 0;
        this.branchName = "";
        this.branchAddress = "";
        this.createdDate = new Date();
        this.codeRoute = "";
        this.loginId = "";
        this.paymentAmount = 0;
        this.isPosted = 0;
        this.overdueInvoicePaymentDetail = [];
        this.allInvoicesHasBenPayed = false;
        this.isReprint = false;
        this.reprint = false;
        this.printsQuantity = 0;
        this.validateMinimumPercentOfPaid = false;
        this.minimumPercentOfPaid = 0;
        this.percentCoveredWhitThePaid = 0;
        this.paidComment = "";
        this.overdueInvoicePaymentTypeDetail = [];
    }
    return PagoDeFacturaVencidaEncabezado;
}());
//# sourceMappingURL=PagoDeFacturaVencidaEncabezado.js.map