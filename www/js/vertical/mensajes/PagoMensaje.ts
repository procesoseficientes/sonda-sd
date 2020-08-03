class PagoMensaje {
    pago: PagoDeFacturaVencidaEncabezado;
    configuracionDeDecimales: ManejoDeDecimales;
    simboloDeMoneda: string;

    cliente: Cliente;

    constructor(public sender: any) { }
}