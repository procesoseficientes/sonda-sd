var PromoServicio = (function () {
    function PromoServicio() {
    }
    PromoServicio.prototype.obtenerHistoricoDePromosParaCliente = function (cliente, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var listaParaEjecucion = [];
            listaParaEjecucion.push("SELECT");
            listaParaEjecucion.push(" MAX([HP].[HISTORY_DATETIME]) HISTORY_DATETIME");
            listaParaEjecucion.push(" , [HP].[PROMO_ID]");
            listaParaEjecucion.push(" , [HP].[FREQUENCY]");
            listaParaEjecucion.push(" FROM HISTORY_BY_PROMO HP");
            listaParaEjecucion.push(" WHERE CODE_CUSTOMER = '" + cliente.clientId + "'");
            listaParaEjecucion.push(" GROUP BY [HP].[PROMO_ID], [HP].[FREQUENCY]");
            tx.executeSql(listaParaEjecucion.join(''), [], function (tx, results) {
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
            callbackError({ codigo: -1, mensaje: "Error al obtener el historico de promos: " + err.message });
        });
    };
    PromoServicio.prototype.insertarHistoricoDePromo = function (promo, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var listaParaEjecucion = [];
            listaParaEjecucion.push("INSERT INTO HISTORY_BY_PROMO([DOC_SERIE], [DOC_NUM], [CODE_ROUTE], [CODE_CUSTOMER], [HISTORY_DATETIME], [PROMO_ID], [PROMO_NAME], [FREQUENCY], [IS_POSTED], [DEVICE_NETWORK_TYPE], [IS_POSTED_OFFLINE], [SALES_ORDER_DOCUMENT_NUMBER], [SALES_ORDER_DOCUMENT_SERIES])");
            listaParaEjecucion.push(" VALUES('" + promo.docSerie + "'");
            listaParaEjecucion.push(" , " + promo.docNum);
            listaParaEjecucion.push(" , '" + promo.codeRoute + "'");
            listaParaEjecucion.push(" , '" + promo.codeCustomer + "'");
            listaParaEjecucion.push(" , '" + promo.historyDateTime + "'");
            listaParaEjecucion.push(" , " + promo.promoId);
            listaParaEjecucion.push(" , '" + promo.promoName + "'");
            listaParaEjecucion.push(" , '" + promo.frequency + "'");
            listaParaEjecucion.push(" , 1");
            listaParaEjecucion.push(" , '" + tipoDeRedALaQueEstaConectadoElDispositivo + "'");
            listaParaEjecucion.push(" , " + (gIsOnline === SiNo.Si ? 0 : 1));
            listaParaEjecucion.push(" , " + promo.salesOrderDocumentNumber);
            listaParaEjecucion.push(" , '" + promo.salesOrderDocumentSeries + "'");
            listaParaEjecucion.push(" )");
            tx.executeSql(listaParaEjecucion.join(''));
            listaParaEjecucion = null;
            callback();
        }, function (err) {
            callbackError({ codigo: -1, mensaje: "Error al insertar historico de promo: " + err.message });
        });
    };
    PromoServicio.prototype.obtenerFechaParaCompararLaPromo = function (diasARestar, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var listaParaEjecucion = [];
            listaParaEjecucion.push("SELECT DateTime('Now', 'LocalTime', '-" + diasARestar + " Day') AS DATE_PROMO");
            tx.executeSql(listaParaEjecucion.join(''), [], function (tx, results) {
                if (results.rows.length > 0) {
                    var registroPorComboSql = results.rows.item(0);
                    var fecha = void 0;
                    fecha = new Date(registroPorComboSql.DATE_PROMO);
                    fecha.setHours(0);
                    fecha.setMinutes(0);
                    fecha.setSeconds(0);
                    fecha.setMilliseconds(0);
                    callback(fecha);
                    fecha = null;
                    registroPorComboSql = null;
                }
                else {
                    callbackError({
                        codigo: -1,
                        mensaje: "No se pudo obtener la fecha para la comparaci\u00F3n."
                    });
                }
            });
            listaParaEjecucion = null;
        }, function (err) {
            callbackError({ codigo: -1, mensaje: "Error al obtener fecha para compara la p de promo: " + err.message });
        });
    };
    PromoServicio.prototype.validarSiAplicaPromo = function (promo, promoHistorico, callback, callbackError) {
        try {
            promoHistorico.historyDateTime.setHours(0);
            promoHistorico.historyDateTime.setMinutes(0);
            promoHistorico.historyDateTime.setSeconds(0);
            promoHistorico.historyDateTime.setMilliseconds(0);
            var cantidadDeDias = 0;
            switch (promo.frequency) {
                case TipoPeriodicidadDePromo.Siempre.toString():
                    callback(true);
                    break;
                case TipoPeriodicidadDePromo.Unica.toString():
                    callback(false);
                    break;
                case TipoPeriodicidadDePromo.PorDia.toString():
                    var fechaActual = new Date();
                    fechaActual.setHours(0);
                    fechaActual.setMinutes(0);
                    fechaActual.setSeconds(0);
                    fechaActual.setMilliseconds(0);
                    if (promoHistorico.historyDateTime < fechaActual) {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                    fechaActual = null;
                    break;
                case TipoPeriodicidadDePromo.PorSemana.toString():
                    cantidadDeDias = 7;
                    break;
                case TipoPeriodicidadDePromo.PorMes.toString():
                    cantidadDeDias = 30;
                    break;
            }
            if (cantidadDeDias > 0) {
                this.obtenerFechaParaCompararLaPromo(cantidadDeDias, function (fecha) {
                    if (promoHistorico.historyDateTime <= fecha) {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                }, function (resultado) {
                    callbackError(resultado);
                });
            }
        }
        catch (ex) {
            callbackError({ codigo: -1, mensaje: "Error al validar si aplica promo: " + ex.message });
        }
    };
    return PromoServicio;
}());
//# sourceMappingURL=PromoServicio.js.map