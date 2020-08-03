var ValidacionDeLicenciaServicio = (function () {
    function ValidacionDeLicenciaServicio() {
    }
    ValidacionDeLicenciaServicio.prototype.validarLicencia = function (user, pass, deviceId, callback, errorCallback) {
        var _this_1 = this;
        try {
            var request = {
                requestUri: "http://mobilitywebapi.centralus.cloudapp.azure.com:1025/SecurityAPI/odata/ValidateCredentials(loginId='" + user + "',password='" + pass + "',codeApp='SondaSalesAndDelivery',deviceId='" + deviceId + "')",
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json; odata.metadata=minimal",
                    "OData-MaxVersion": "4.0"
                }
            };
            odatajs.oData.request(request, function (data, response) {
                callback(data);
            }, function (err) {
                try {
                    var error = JSON.parse(err.response.body).error;
                    if (error == undefined) {
                        error = err;
                    }
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: _this_1.obtenerMensajeDeError(error.message)
                    });
                }
                catch (ex) {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: _this_1.obtenerMensajeDeError(ex.message)
                    });
                }
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    ValidacionDeLicenciaServicio.prototype.obtenerMensajeDeError = function (error) {
        var errorEncontrado = "Error desconocido";
        switch (error) {
            case "The user name or password is incorrect":
                errorEncontrado = "Clave/Usuario incorrecto";
                break;
            case "Your licenses has blocked":
                errorEncontrado = "La licencia est\u00E1 bloqueada";
                break;
            case "Your licenses has expired":
                errorEncontrado = "La licencia ha expirado";
                break;
            case "Your company has blocked":
                errorEncontrado = "La empresa est\u00E1 bloqueada";
                break;
            case "You do not have access":
                errorEncontrado = "Usuario no existe";
                break;
            case "User has blocked":
                errorEncontrado = "Usuario bloqueado";
                break;
            case "This device is not registered":
                errorEncontrado = "Dispositivo no registrado";
                break;
        }
        return errorEncontrado;
    };
    return ValidacionDeLicenciaServicio;
}());
//# sourceMappingURL=ValidacionDeLicenciaServicio.js.map