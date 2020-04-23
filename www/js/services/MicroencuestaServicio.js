var MicroencuestaServicio = (function () {
    function PrecioEspecialServicio() {
    }
    PrecioEspecialServicio.prototype.obtenerHistoricoDeMicroencuestas = function (cliente, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var listaParaEjecucion = [];
            listaParaEjecucion.push("SELECT");
            listaParaEjecucion.push(" MAX([HP].[HISTORY_DATETIME]) HISTORY_DATETIME");
            listaParaEjecucion.push(" , [HP].[PROMO_ID]");
            listaParaEjecucion.push(" , [HP].[FREQUENCY]");
            listaParaEjecucion.push(" FROM HISTORY_BY_PROMO HP");
            listaParaEjecucion.push(" WHERE CODE_CUSTOMER = '" + cliente.clientId + "'");
            listaParaEjecucion.push(" GROUP BY [HP].[PROMO_ID], [HP].[FREQUENCY]");
            tx.executeSql(listaParaEjecucion.join(""), [], function (tx, results) {
                var listaHistoricaDePromos = [];
                for (var i = 0; i < results.rows.length; i++) {
                    var registroPorComboSql = results.rows.item(i);
                    var historicoDePromo = new Promo();
                    var fecha = void 0;
                    fecha = new Date(registroPorComboSql.HISTORY_DATETIME);
                    fecha.setHours(0);
                    fecha.setMinutes(0);
                    fecha.setSeconds(0);
                    fecha.setMilliseconds(0);
                    historicoDePromo.historyDateTime = fecha;
                    fecha = null;
                    historicoDePromo.promoId = registroPorComboSql.PROMO_ID;
                    historicoDePromo.frequency = registroPorComboSql.FREQUENCY;
                    listaHistoricaDePromos.push(historicoDePromo);
                    historicoDePromo = null;
                    registroPorComboSql = null;
                }
                callback(listaHistoricaDePromos);
                listaHistoricaDePromos = null;
            });
            listaParaEjecucion = null;
        }, function (err) {
            callbackError({
                codigo: -1,
                mensaje: "Error al obtener el historico de microencuestas: " + err.message
            });
        });
    };
}());