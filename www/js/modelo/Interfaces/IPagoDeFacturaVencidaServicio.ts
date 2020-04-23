interface IPagoDeFacturaVencidaServicio {

    guardarDocumentoDePago(documentoDePago: PagoDeFacturaVencidaEncabezado, callback: () => void, errorCallback: (error: Operacion) => void): void;

    obtenerFormatoSqlDeInsercionDeEncabezadoDeDocumentoDePago(documentoDePago: PagoDeFacturaVencidaEncabezado): string;

    obtenerFormatoSqlDeInsercionDeDetalleDeDocumentoDePago(detalleDeDocumentoDePago: PagoDeFacturaVencidaDetalle): string;

    obtenerDocumentosDePagoNoPosteadosEnElServidor(callback: (documentosDePagoNoPosteadosEnElServidor: Array<PagoDeFacturaVencidaEncabezado>) => void): void;

    obtenerEncabezadoDeDocumentosNoPosteadosEnElServidor(callback: (documentosDePagoNoPosteadosEnElServidor: Array<PagoDeFacturaVencidaEncabezado>) => void): void;

    obtenerDetalleDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteadosEnElServidor: Array<PagoDeFacturaVencidaEncabezado>, posicionActualDeDocumentoProcesado: number, callback: (documentosDePagoNoPosteadosEnElServidor: Array<PagoDeFacturaVencidaEncabezado>, transaccionSql: SqlTransaction) => void, transaccionActual: SqlTransaction);

    marcarDocumentosDePagoComoPosteadosEnElServidor(documentosDePagoPosteadosEnElServidor: any): void;

    obtenerFormatoDeActualizacionDePosteoDeEncabezadoDeDocumentoDePago(documentoPosteado: any): string;

    obtenerFormatoDeActualizacionDePosteoDeDetalleDeDocumentoDePago(documentoPosteado: any): string;

    imprimirPago(pago: PagoDeFacturaVencidaEncabezado, callback: () => void, errorCallback: (error: any) => void): void;

    obtenerFormatoDeActualizacionDeSecuenciaDeDocumentos(documentoDePago: PagoDeFacturaVencidaEncabezado): string;

    obtenerParametroDePorcentajeDePagoMinimoDeFacturasVencidas(callback: (aplicaParametroDePorcentajeMinimoDePago: boolean, valorDePorcentajeMinimoDePago: number) => void, errorCallback: (resultado: Operacion) => void): void;

    obtenerFormatoSqlDeActualizacionDeMontoPendienteDePagoEnFacturaOriginal(detalleDeDocumentoDePago: PagoDeFacturaVencidaDetalle): string;

    obtenerSecuenciaDeDocumentoDePago(callback: (secuenciaDeDocumento: any) => void, errorCallback: (resultado: Operacion) => void): void;

    obtenerFormatoDeActualizacionDeBalanceDeCliente(pago: PagoDeFacturaVencidaEncabezado): string;
}
