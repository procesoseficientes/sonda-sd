var DatosFelParaFactura = (function () {
    function DatosFelParaFactura() {
        this.ElectronicSignature = "";
        this.DocumentSeries = "";
        this.DocumentNumber = 0;
        this.DocumentUrl = "";
        this.Shipment = 0;
        this.ValidationResult = false;
        this.ShipmentDatetime = new Date();
        this.ShipmentResponse = "";
        this.IsContingencyDocument = false;
        this.ContingencyDocSerie = "";
        this.ContingencyDocNum = 0;
        this.FelDocumentType = "";
        this.FelStablishmentCode = 0;
    }
    return DatosFelParaFactura;
}());
//# sourceMappingURL=DatosFelParaFactura.js.map