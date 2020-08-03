class DatosFelParaFactura {
  ElectronicSignature: string = "";
  DocumentSeries: string = "";
  DocumentNumber: number = 0;
  DocumentUrl: string = "";
  Shipment: number = 0;
  ValidationResult: boolean = false;
  ShipmentDatetime: Date = new Date();
  ShipmentResponse: string = "";
  IsContingencyDocument: boolean = false;
  ContingencyDocSerie: string = "";
  ContingencyDocNum: number = 0;
  FelDocumentType: string = "";
  FelStablishmentCode: number = 0;
}
