var Cliente = (function () {
    function Cliente() {
        this.clientId = "";
        this.clientName = "";
        this.clientTaxId = "";
        this.address = "";
        this.isPosted = 0;
        this.phone = "";
        this.clientHhIdOld = "";
        this.contactCustomer = "";
        this.contactPhone = "";
        this.photo1 = "";
        this.photo2 = "";
        this.photo3 = "";
        this.status = "NEW";
        this.isNew = 1;
        this.gps = "0,0";
        this.longitude = "";
        this.latitude = "";
        this.createdFrom = "SONDA_POS";
        this.billingName = "";
        this.billingAddress = "";
        this.syncId = "";
        this.docSerie = "";
        this.docNum = "";
        this.tagsQty = 0;
        this.postedDatetime = new Date();
        this.isPostedValidated = 0;
        this.canBuyOnCredit = false;
        this.currentAccountingInformation = new CuentaCorrienteDeCliente();
        this.invoiceDueDate = new Date();
        this.totalInvoicedIsOnCredit = false;
        this.creditAmount = 0;
        this.cashAmount = 0;
        this.invoiceHasCredit = false;
        this.overdueInvoices = [];
        this.totalAmountPayedOfOverdueInvoices = 0;
        this.totalAmountOfOpenInvoices = 0;
    }
    return Cliente;
}());
//# sourceMappingURL=Cliente.js.map