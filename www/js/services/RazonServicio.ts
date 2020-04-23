

class RazonServicio implements IRazonServicio {
    obtenerRazones(tipoDeRazon, callback: (razones: Razon[]) => void, errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = "SELECT" +
                    " REASON_TYPE" +
                    " ,REASON_VALUE" +
                    " ,REASON_PROMPT" +
                    " ,REASON_PRIORITY" +
                    " FROM REASONS R" +
                    " WHERE R.REASON_TYPE = '" + tipoDeRazon + "'" +
                    " ORDER BY R.REASON_PRIORITY ASC";
                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length >= 1) {
                            var razones: Razon[] = [];
                            for (var i = 0; i < results.rows.length; i++) {
                                var stRazon: any = results.rows.item(i);
                                var razon = new Razon();

                                razon.reasonType = stRazon.REASON_TYPE;
                                razon.reasonValue = stRazon.REASON_VALUE;
                                razon.reasonPrompt = stRazon.REASON_PROMPT;
                                razon.reasonPriority = stRazon.REASON_PRIORITY;

                                razones.push(razon);
                            }
                            callback(razones);
                        } else {
                            this.obenerRazonSinRazones((razonesN1: Razon[]) => {
                                callback(razonesN1);
                            }, (resultadoN1: Operacion) => {
                                errorCallback(resultadoN1);
                            });
                        }
                    }
                );
            }, (err: SqlError) => {
                var operacion = new Operacion();
                operacion.resultado = ResultadoOperacionTipo.Error;
                operacion.codigo = err.code;
                operacion.mensaje = err.message;
                errorCallback(operacion);
            }
        );
    }

    obenerRazonSinRazones(callback: (razones: Razon[]) => void, errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = "SELECT" +
                    " REASON_TYPE" +
                    " ,REASON_VALUE" +
                    " ,REASON_PROMPT" +
                    " ,REASON_PRIORITY" +
                    " FROM REASONS R" +
                    " WHERE R.REASON_TYPE = '" + TipoDeRazon.SinRazones + "'" +
                    " ORDER BY R.REASON_PRIORITY ASC";
                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length >= 1) {
                            var razones: Razon[] = [];
                            for (var i = 0; i < results.rows.length; i++) {
                                var stRazon: any = results.rows.item(i);
                                var razon = new Razon();

                                razon.reasonType = stRazon.REASON_TYPE;
                                razon.reasonValue = stRazon.REASON_VALUE;
                                razon.reasonPrompt = stRazon.REASON_PROMPT;
                                razon.reasonPriority = stRazon.REASON_PRIORITY;

                                razones.push(razon);
                            }
                            callback(razones);
                        } else {
                            var operacion = new Operacion();
                            operacion.resultado = ResultadoOperacionTipo.Error;
                            operacion.codigo = 0;
                            operacion.mensaje = "No hay razones configuradas";
                            errorCallback(operacion);
                        }
                    }
                );
            }, (err: SqlError) => {
                var operacion = new Operacion();
                operacion.resultado = ResultadoOperacionTipo.Error;
                operacion.codigo = err.code;
                operacion.mensaje = err.message;
                errorCallback(operacion);
            }
        );
    }
}