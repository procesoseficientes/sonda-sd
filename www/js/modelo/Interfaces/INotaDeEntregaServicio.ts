interface INotaDeEntregaServicio {
    obtenerDocumentosParaSincronizacion(callback: (documentosASincronizar: NotaDeEntregaEncabezado[]) => void,
        errorCallback: (error: Operacion) => void): void;

    obtenerEncabezadosDeNotaDeEntregaParaSincronizar(callback: (encabezadosDeDocumentos: NotaDeEntregaEncabezado[]) => void, errorCallback: (error: Operacion) => void): void;

    obtenerDetalleDeNotasDeEntrega(documentos: NotaDeEntregaEncabezado[],
        callback: (documentosCompletos: NotaDeEntregaEncabezado[]) => void,
        errorCallback: (error: Operacion) => void,
        indice: number,
        transaccion: SqlTransaction): void;

    marcarNotasDeEntregaComoPosteadasEnElServidor(notasDeEntregaDevueltasPorElServidor: any): void;

    seProcesaRegistro(indiceDeDocumento, cantidadDeDocumentos): void;



}