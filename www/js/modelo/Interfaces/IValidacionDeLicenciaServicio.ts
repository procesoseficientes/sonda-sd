interface IValidacionDeLicenciaServicio {
    validarLicencia(user: string, pass: string, deviceId: string, callback: (respuesta: any) => void, errorCallback: (restulado: Operacion) => void): void;
}