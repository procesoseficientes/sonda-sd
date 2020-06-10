var ValidacionDeLicenciaServicio = (function () {
    function ValidacionDeLicenciaServicio() {
    }
    ValidacionDeLicenciaServicio.prototype.validarLicencia = function (pUserId, pPinCode, callback, callbackError) {
        var data = { CommunicationAddress: 'http://topstores.mellega.com:8075' };
        callback(data);
    };
    return ValidacionDeLicenciaServicio;
}());
//# sourceMappingURL=ValidacionDeLicenciaServicio.js.map