class ClienteMensaje {
    cliente: Cliente;
    vistaCargandosePorPrimeraVez: boolean;
    tipoDePagoAProcesar: TipoDePagoDeFactura;
    constructor(public sender: any) { }
}