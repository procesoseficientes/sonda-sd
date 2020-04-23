interface IOrdenDeVentaServicio {

    insertarOrdenDeVenta(ordenDeVenta: OrdenDeVenta, callback: () => void, callbackError: (resultado: Operacion) => void): void;

    obtnerFormatoSqlDeInsertarOrdenDeVentaHencabezado(ordenDeVenta: OrdenDeVenta): string;

    obtnerFormatoSqlDeInsertarOrdenDeVentaDetalle(ordenDeVentaDetalle: OrdenDeVentaDetalle, numeroDeLinea: number): string;

    obtenerTotalDeProductosDeOrdenDeVenta(taskid: number, tx, callback: (qty: number, total: number, trans: SqlTransaction) => void, errCallBack: (resultado: Operacion) => void): void;

    obtenerQueryInsertarTareasAuxiliar(taskId: number, html: string): string;

    actualizaInventarioPreventa(ordenDeVentaDetalle: OrdenDeVentaDetalle): string;

    obtenerFormatoImpresoOrdenDeVenta(tarea: Tarea, callback: (formato: string) => void, errCallBack: (resultado: Operacion) => void): void;

    actualizarDocumnetoImpreso(taskId: number, documento: string, documentoDePago: string, callback: () => void, errCallBack: (resultado: Operacion) => void): void;

    obtenerVecesImpresionOrdenDeVenta(tarea: Tarea, callback: (cantidadDeVencesDeOrdenDeCompa: number, cantidadDeVencesDePago: number) => void, errCallBack: (resultado: Operacion) => void): void;

    obtenerFormatoImpresoOrdenDeVentaPago(tarea: Tarea, callback: (formato: string) => void, errCallBack: (resultado: Operacion) => void): void;

    marcarOrdenesDeVentaComoPosteadasYValidadasDesdeBo(ordenesDeVenta: any,callback: () => void,errorCallback: (resultado: Operacion) => void): void;

}