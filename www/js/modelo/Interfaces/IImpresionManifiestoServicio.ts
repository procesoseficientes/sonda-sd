interface IImpresionManifiestoServicio {
    obtenerFormatoDeImpresionManifiesto(manifiesto: any,operadorEnBodega:string,callback: (formato: string) => void, callbackError: (resultado: Operacion) => void): void;
    enviarSolicitudDeInformacionDeManifiesto(numeroManifiesto: number, callbackError: (resultado: Operacion) => void): void;
} 