interface ISincronizacionDeDatosEnBackOfficeServicio {
    obtenerOrdenesDeVentaParaValidacionEnBackOffice(callback: (ordenesDeVenta: any[]) => void, errorCallback: (resultado: Operacion) => void): void;

    obtenerEncabezadosDeOrdenesDeVenta(callback: (ordenesDeVenta: any[]) => void, errorCallback: (resultado: Operacion) => void): void;

    obtenerDetallesDeOrdenesDeVenta(transaccion: SqlTransaction, ordenesDeVenta: any[], indiceDeOrdenDeVentaActual: number, callback: (ordenesDeVenta: any[]) => void, errorCallback: (resultado: Operacion) => void): void;

}