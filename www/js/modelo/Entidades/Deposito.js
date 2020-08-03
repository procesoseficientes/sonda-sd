var Deposito = (function() {
    function Deposito() {
        this.transId = 0;
        this.transType = "";
        this.transDateTime = "";
        this.bankId = 0;
        this.accountNum = 0;
        this.amount = 0;
        this.gpsUrl = "";
        this.isPosted = 0;
        this.image1 = "";
        this.docSerie = "";
        this.docNum = "";
    }

    return Deposito;
}());