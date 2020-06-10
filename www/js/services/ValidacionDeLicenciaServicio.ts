class ValidacionDeLicenciaServicio implements IValidacionDeLicenciaServicio {    
    validarLicencia(pUserId: String, pPinCode: String, callback: (respuesta: any) => void, callbackError: (resultado: any) => void) {
        const data = {CommunicationAddress: 'http://topstores.mellega.com:8075'}
        callback(data);
    }
}