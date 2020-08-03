interface IManifiestoServicio {
    almacenarEncabezadoDeManifiesto(encabezadoDeManifiesto: any, callback: () => void, errorCallback: (resultado: Operacion) => void): void;
    almacenarDetalleDeManifiesto(detalleDeManifiesto: any, callback: () => void, errorCallback: (resultado: Operacion) => void): void;
    obtenerManifiesto(manifiestoId: number, callback: (manifiesto: ManifiestoEncabezado) => void, errorCallback: (resultado: Operacion) => void): void;
    obtenerEncabezadoDeManifiesto(manifiesto: number, callback: (manifiestoEncabezado: ManifiestoEncabezado) => void, errorCallback: (resultado: Operacion) => void): void;
    obtenerDetalleDeManifiesto(manifiesto: ManifiestoEncabezado, callback: (manifiestoCompleto: ManifiestoEncabezado) => void, errorCallback: (resultado: Operacion) => void): void;
    obtenerCantidadDeEntregasDeManifiesto(codigoManifiesto: number, callback: (cantidadDeVisitas: number) => void, errorCallback: (resultado: Operacion) => void): void;
    limpiarTareasDeEntrega():void;
}