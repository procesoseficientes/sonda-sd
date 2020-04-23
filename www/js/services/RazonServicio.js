var RazonServicio = (function () {
    function RazonServicio() {
    }
    RazonServicio.prototype.obtenerRazones = function (tipoDeRazon, callback, errorCallback) {
        var _this = this;
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT" +
                " REASON_TYPE" +
                " ,REASON_VALUE" +
                " ,REASON_PROMPT" +
                " ,REASON_PRIORITY" +
                " FROM REASONS R" +
                " WHERE R.REASON_TYPE = '" + tipoDeRazon + "'" +
                " ORDER BY R.REASON_PRIORITY ASC";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.length >= 1) {
                    var razones = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        var stRazon = results.rows.item(i);
                        var razon = new Razon();
                        razon.reasonType = stRazon.REASON_TYPE;
                        razon.reasonValue = stRazon.REASON_VALUE;
                        razon.reasonPrompt = stRazon.REASON_PROMPT;
                        razon.reasonPriority = stRazon.REASON_PRIORITY;
                        razones.push(razon);
                    }
                    callback(razones);
                }
                else {
                    _this.obenerRazonSinRazones(function (razonesN1) {
                        callback(razonesN1);
                    }, function (resultadoN1) {
                        errorCallback(resultadoN1);
                    });
                }
            });
        }, function (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            errorCallback(operacion);
        });
    };
    RazonServicio.prototype.obenerRazonSinRazones = function (callback, errorCallback) {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT" +
                " REASON_TYPE" +
                " ,REASON_VALUE" +
                " ,REASON_PROMPT" +
                " ,REASON_PRIORITY" +
                " FROM REASONS R" +
                " WHERE R.REASON_TYPE = '" + TipoDeRazon.SinRazones + "'" +
                " ORDER BY R.REASON_PRIORITY ASC";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.length >= 1) {
                    var razones = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        var stRazon = results.rows.item(i);
                        var razon = new Razon();
                        razon.reasonType = stRazon.REASON_TYPE;
                        razon.reasonValue = stRazon.REASON_VALUE;
                        razon.reasonPrompt = stRazon.REASON_PROMPT;
                        razon.reasonPriority = stRazon.REASON_PRIORITY;
                        razones.push(razon);
                    }
                    callback(razones);
                }
                else {
                    var operacion = new Operacion();
                    operacion.resultado = ResultadoOperacionTipo.Error;
                    operacion.codigo = 0;
                    operacion.mensaje = "No hay razones configuradas";
                    errorCallback(operacion);
                }
            });
        }, function (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            errorCallback(operacion);
        });
    };
    return RazonServicio;
}());
//# sourceMappingURL=RazonServicio.js.map