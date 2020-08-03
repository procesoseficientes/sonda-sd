interface IFacturaServicio {
  ObtenerDetallesDeFacturaPorNumeroDeTarea(
    invoiceNum: number,
    callBack: (facturaDetalles?: FacturaDetalle[]) => void,
    errorCallBack: (resultado: Operacion) => void
  ): void;

  InsertarFactura(
    invoice: FacturaEncabezado,
    felData: DatosFelParaFactura,
    errorCallBack: (resultado: Operacion) => void,
    callback: () => void
  ): void;
}
