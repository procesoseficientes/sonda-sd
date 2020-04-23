class PagoDeFacturaVencidaMensaje {
  pago: PagoDeFacturaVencidaEncabezado;
  configuracionDeDecimales: ManejoDeDecimales;
  simboloDeMoneda: string;

  cliente: Cliente;

  funcionDeRetornoAPocesoPrincipal: Function;

  constructor(public sender: any) {}
}
