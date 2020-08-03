var ControlDeSecuenciaServicio = (function () {
    function ControlDeSecuenciaServicio() {
        this.secuencias = [
            {
                tipo: TiposDeSecuenciaAControlar.NuevaTarea,
                constructorDeSecuencia: "INSERT INTO SEQUENCE_CONTROL([SEQUENCE_TYPE], [LAST_USED], [CREATED_DATE]) \n      VALUES ('" + TiposDeSecuenciaAControlar.NuevaTarea + "', 0, (SELECT date('now')))"
            }
        ];
    }
    ControlDeSecuenciaServicio.prototype.inicializarControlDeSequencias = function () {
        var _this_1 = this;
        SONDA_DB_Session.transaction(function (transaction) {
            _this_1.inicializarSecuencias(_this_1.secuencias, 0, transaction);
        }, function (error) {
            console.log({
                "Error en inicializacion de control de secuencias": error
            });
        });
    };
    ControlDeSecuenciaServicio.prototype.inicializarSecuencias = function (secuencias, secuenciaActual, transaccionActual) {
        var _this_1 = this;
        if (secuenciaActual < secuencias.length) {
            var secuencia_1 = secuencias[secuenciaActual];
            transaccionActual.executeSql("SELECT 1 FROM SEQUENCE_CONTROL WHERE [SEQUENCE_TYPE] = '" + secuencia_1.tipo + "' LIMIT 1", [], function (transaccion, resultados) {
                if (!resultados.rows.length) {
                    transaccion.executeSql(secuencia_1.constructorDeSecuencia);
                    _this_1.inicializarSecuencias(secuencias, secuenciaActual + 1, transaccion);
                }
            }, function (transaccion, error) {
                console.log("Error al intentar crear la secuencia de tipo " + secuencia_1.tipo + " debido a: " + error.message);
                _this_1.inicializarSecuencias(secuencias, secuenciaActual + 1, transaccion);
            });
        }
        else {
            console.log("Secuencias inicializadas correctamente");
        }
    };
    ControlDeSecuenciaServicio.prototype.obtenerSiguienteNumeroDeSecuenciaDeControl = function (tipoDeSecuencia, callback, errorCallback) {
        SONDA_DB_Session.transaction(function (transaction) {
            transaction.executeSql("SELECT [SEQUENCE_TYPE], \n            [LAST_USED], \n            ([LAST_USED] + 1) [NEXT_VALUE], \n            [CREATED_DATE], \n            [LAST_UPDATE] \n            FROM [SEQUENCE_CONTROL] \n            WHERE [SEQUENCE_TYPE] = '" + tipoDeSecuencia + "' LIMIT 1", [], function (_transactionRet, resultados) {
                if (resultados.rows.length > 0) {
                    var secuenciaControlada = resultados.rows.item(0);
                    var secuencia = new ControlDeSecuencia();
                    secuencia.SEQUENCE_TYPE = secuenciaControlada.SEQUENCE_TYPE;
                    secuencia.LAST_USED = secuenciaControlada.LAST_USED;
                    secuencia.NEXT_VALUE = secuenciaControlada.NEXT_VALUE;
                    secuencia.CREATED_DATE = secuenciaControlada.CREATED_DATE;
                    secuencia.LAST_UPDATE = secuenciaControlada.LAST_UPDATE;
                    callback(secuencia);
                }
                else {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Lo sentimos no fue posible encontrar un registro de control para la secuencia solicitada '" + tipoDeSecuencia + "'"
                    });
                }
            }, function (_transactionRet, error) {
                errorCallback({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }, function (error) {
            console.log({
                "Error al obtener la secuencia solicitada": error.message
            });
        });
    };
    ControlDeSecuenciaServicio.prototype.actualizarSecuenciaDeControl = function (secuencia, callback, errorCallback) {
        SONDA_DB_Session.transaction(function (transaction) {
            transaction.executeSql("UPDATE [SEQUENCE_CONTROL]\n            SET \n              [LAST_USED] = " + secuencia.NEXT_VALUE + ",  \n              [LAST_UPDATE] = (SELECT date('now'))\n              WHERE [SEQUENCE_TYPE] = '" + secuencia.SEQUENCE_TYPE + "'");
            if (callback) {
                callback();
            }
        }, function (error) {
            console.log({
                "Error al obtener la secuencia solicitada": error.message
            });
            if (errorCallback) {
                errorCallback({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al obtener la secuencia solicitada " + error.message
                });
            }
        });
    };
    ControlDeSecuenciaServicio.prototype.obtenerSecuenciaDeDocumento = function (tipoSecuencia, callback, errorCallback) {
        var sql = [];
        sql.push("SELECT [DOC_TYPE], [SERIE], [CURRENT_DOC], [DOC_TO],");
        sql.push("[DOC_FROM], [BRANCH_NAME], [BRANCH_ADDRESS]");
        sql.push("FROM [DOCUMENT_SEQUENCE]");
        sql.push("WHERE [DOC_TYPE] = '" + tipoSecuencia + "'");
        SONDA_DB_Session.transaction(function (tx) {
            tx.executeSql(sql.join(" "), [], function (tx2, results) {
                if (results.rows.length > 0) {
                    var secuenciaDocumento = results.rows.item(0);
                    callback(secuenciaDocumento);
                }
                else {
                    callback(null);
                }
            }, function (tx2, error) {
                errorCallback(error.message);
            });
        });
    };
    ControlDeSecuenciaServicio.prototype.actualizarSecuenciaDeDocumento = function (tipoSecuencia, ultimaSecuenciaUtilizada, errorCallback) {
        try {
            var sql_1 = [];
            sql_1.push("UPDATE [DOCUMENT_SEQUENCE]");
            sql_1.push("SET [CURRENT_DOC] = " + ultimaSecuenciaUtilizada);
            sql_1.push("WHERE [DOC_TYPE] = '" + tipoSecuencia + "'");
            SONDA_DB_Session.transaction(function (tx) {
                tx.executeSql(sql_1.join(" "));
            });
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al actualizar la secuencia " + error.message
            });
        }
    };
    return ControlDeSecuenciaServicio;
}());
//# sourceMappingURL=ControlDeSecuenciaServicio.js.map