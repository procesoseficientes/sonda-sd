interface IAsociarTelefonoAFacturaServicio {
    asociarNumeroDeTelefonoAFactura(numeroDeFactura: number, numeroTelefonico: string, callback:(resultado: Operacion) =>void):void;
}