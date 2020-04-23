interface IImpresionServicio {
    validarEstadosYImprimir(esImpresoZebra: boolean, macAddress: string, documento: string, tambienImprimir, callback:(resultado: Operacion)=>void): void;
}