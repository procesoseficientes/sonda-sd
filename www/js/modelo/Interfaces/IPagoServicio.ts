interface IPagoServicio {
    formarPagoUnico(cliente: Cliente, ordenDeVenta: OrdenDeVenta, tipoDePago: TipoDePago, callback: (pago: PagoEncabezado) => void, errCallBack: (resultado: Operacion) => void): void;

    formarPagoUnicoDesdeLista(cliente: Cliente, listaSku: Sku[], tipoDePago: TipoDePago, numeroDeDocumento: string, imagen1: string, imagen2: string, callback: (pago: PagoEncabezado) => void, errCallBack: (resultado: Operacion) => void): void;

    obtenerFormatoDeImpresionDePago(cliente: Cliente, ordenDeVenta: OrdenDeVenta, pago: PagoEncabezado, callback: (formato: string) => void, callbackError: (resultado: Operacion) => void): void;

    guardarPago(pago: PagoEncabezado, esPagoFalso: boolean, callback: (pago) => void, callbackError: (resultado: Operacion) => void): void;

    obtnerFormatoSqlDeInsertarParaPagoEncabezado(pago: PagoEncabezado): string;

    obtnerFormatoSqlDeInsertarParaPagoDetalle(pago: PagoDetalle): string;
}