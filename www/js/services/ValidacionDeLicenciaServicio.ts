class ValidacionDeLicenciaServicio implements IValidacionDeLicenciaServicio {

    validarLicencia(user: string,pass: string, deviceId: string, callback:(respuesta: any)=>void,errorCallback:(restulado: Operacion)=>void){
        try {

            let request = {
                requestUri:
                    `http://mobilitywebapi.centralus.cloudapp.azure.com:1025/SecurityAPI/odata/ValidateCredentials(loginId='${user
                        }',password='${pass}',codeApp='SondaSalesAndDelivery',deviceId='${deviceId}')`,
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; odata.metadata=minimal",
                    "OData-MaxVersion": "4.0"
                }
            };
            odatajs.oData.request(
                request,
                (data, response) => {
                    callback(data);
                },
                (err) => {
                    try {
                        let error = JSON.parse(err.response.body).error;
                        if (error == undefined) {
                            error = err;
                        }
                        errorCallback({
                                codigo: -1,
                                resultado: ResultadoOperacionTipo.Error,
                                mensaje: this.obtenerMensajeDeError(error.message)
                            } as
                            Operacion);
                    } catch (ex) {
                        errorCallback({
                                codigo: -1,
                                resultado: ResultadoOperacionTipo.Error,
                                mensaje: this.obtenerMensajeDeError(ex.message)
                            } as
                            Operacion);
                    }

                });

        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as
                Operacion);
        }
    }

    obtenerMensajeDeError(error: string): string {
        let errorEncontrado: string = `Error desconocido`;

        switch (error) {
            case "The user name or password is incorrect":
                errorEncontrado = `Clave/Usuario incorrecto`;
                break;
            case "Your licenses has blocked":
                errorEncontrado = `La licencia está bloqueada`;
                break;
            case "Your licenses has expired":
                errorEncontrado = `La licencia ha expirado`;
                break;
            case "Your company has blocked":
                errorEncontrado = `La empresa está bloqueada`;
                break;
            case "You do not have access":
                errorEncontrado = `Usuario no existe`;
                break;
            case "User has blocked":
                errorEncontrado = `Usuario bloqueado`;
                break;

            case "This device is not registered":
                errorEncontrado = `Dispositivo no registrado`;
                break;
        }

        return errorEncontrado;
    }
}