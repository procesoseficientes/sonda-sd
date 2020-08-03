interface IFacturacionElectronicaServicio {
  agregarFraseEscenario(data: any): void;

  obtenerFrasesYEscenariosPorTipoDeDocumentoFel(
    felDocumentType: string,
    callBack: (frasesEscenarios: FraseEscenario[]) => void,
    errorCallBack: (error: Operacion) => void
  ): void;

  obtenerDocumentoDeContingenciaPorNumeroDeFactura(
    invoiceNum: number,
    callBack: (factura: FacturaEncabezado) => void,
    errorCallBack: (resultado: Operacion) => void
  ): void;

  actualizarDocumentoDeContingencia(
    invoiceNum: number,
    felData: DatosFelParaFactura,
    errorCallBack: (resultado: Operacion) => void
  ): void;
}
