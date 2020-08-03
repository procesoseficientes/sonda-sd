var AsociarTelefonoAFacturaServicio = (function () {
    function AsociarTelefonoAFacturaServicio() {
    }
    AsociarTelefonoAFacturaServicio.prototype.asociarNumeroDeTelefonoAFactura = function (numeroDeFactura, numeroTelefonico, callback) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "UPDATE INVOICE_HEADER SET TELEPHONE_NUMBER = '" + numeroTelefonico + "' WHERE INVOICE_NUM = " + numeroDeFactura;
                tx.executeSql(sql);
            }, function (err) {
                callback({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: err.message
                });
            }, function () {
                callback({
                    codigo: 0,
                    resultado: ResultadoOperacionTipo.Exitoso,
                    mensaje: "SUCCESS"
                });
            });
        }
        catch (e) {
            callback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: e.message
            });
        }
    };
    return AsociarTelefonoAFacturaServicio;
}());
//# sourceMappingURL=AsociarTelefonoAFacturaServicio.js.map