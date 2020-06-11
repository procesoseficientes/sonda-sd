class PromoServicio implements IPromoServicio {

    obtenerHistoricoDePromosParaCliente(cliente: Cliente, callback: (listaHistoricoDePromos: Promo[]) => void, callbackError: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                let listaParaEjecucion: string[] = [];
                listaParaEjecucion.push("SELECT");
                listaParaEjecucion.push(" MAX([HP].[HISTORY_DATETIME]) HISTORY_DATETIME");
                listaParaEjecucion.push(" , [HP].[PROMO_ID]");
                listaParaEjecucion.push(" , [HP].[FREQUENCY]");
                listaParaEjecucion.push(" FROM HISTORY_BY_PROMO HP");
                listaParaEjecucion.push(` WHERE CODE_CUSTOMER = '${cliente.clientId}'`);
                listaParaEjecucion.push(" GROUP BY [HP].[PROMO_ID], [HP].[FREQUENCY]");
                tx.executeSql(listaParaEjecucion.join(''), [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        let listaHistoricaDePromos: Promo[] = [];
                        for (let i = 0; i < results.rows.length; i++) {
                            let registroPorComboSql: any = results.rows.item(i);
                            let historicoDePromo = new Promo();

                            let fecha: Date;
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
                    }
                );
                listaParaEjecucion = null;
            }, (err: SqlError) => {
                callbackError({ codigo: -1, mensaje: `Error al obtener el historico de promos: ${err.message}` } as Operacion);
            }
        );
    }

    insertarHistoricoDePromo(promo: Promo, callback: () => void, callbackError: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                let listaParaEjecucion: string[] = [];
                listaParaEjecucion.push("INSERT INTO HISTORY_BY_PROMO([DOC_SERIE], [DOC_NUM], [CODE_ROUTE], [CODE_CUSTOMER], [HISTORY_DATETIME], [PROMO_ID], [PROMO_NAME], [FREQUENCY], [IS_POSTED], [DEVICE_NETWORK_TYPE], [IS_POSTED_OFFLINE])");
                listaParaEjecucion.push(` VALUES('${promo.docSerie}'`);
                listaParaEjecucion.push(` , ${promo.docNum}`);
                listaParaEjecucion.push(` , '${promo.codeRoute}'`);
                listaParaEjecucion.push(` , '${promo.codeCustomer}'`);
                listaParaEjecucion.push(` , '${promo.historyDateTime}'`);
                listaParaEjecucion.push(` , ${promo.promoId}`);
                listaParaEjecucion.push(` , '${promo.promoName}'`);
                listaParaEjecucion.push(` , '${promo.frequency}'`);
                listaParaEjecucion.push(` , 1`);
                listaParaEjecucion.push(` , '${tipoDeRedALaQueEstaConectadoElDispositivo}'`);
                listaParaEjecucion.push(` , ${(gIsOnline === SiNo.Si ? 0 : 1)}`);
                listaParaEjecucion.push(` )`);
                tx.executeSql(listaParaEjecucion.join(''));
                listaParaEjecucion = null;
                callback();
            }, (err: SqlError) => {
                callbackError({ codigo: -1, mensaje: `Error al insertar historico de promo: ${err.message}` } as Operacion);
            }
        );
    }

    obtenerFechaParaCompararLaPromo(diasARestar: number, callback: (fecha: Date) => void, callbackError: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                let listaParaEjecucion: string[] = [];
                listaParaEjecucion.push(`SELECT DateTime('Now', 'LocalTime', '-${diasARestar} Day') AS DATE_PROMO`);
                tx.executeSql(listaParaEjecucion.join(''), [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length > 0) {
                            let registroPorComboSql: any = results.rows.item(0);
                            let fecha: Date;
                            fecha = new Date(registroPorComboSql.DATE_PROMO);
                            fecha.setHours(0);
                            fecha.setMinutes(0);
                            fecha.setSeconds(0);
                            fecha.setMilliseconds(0);
                            callback(fecha);
                            fecha = null;
                            registroPorComboSql = null;
                        } else {
                            callbackError({
                                codigo: -1,
                                mensaje: `No se pudo obtener la fecha para la comparación.`
                            } as Operacion);
                        }
                    }
                );
                listaParaEjecucion = null;
            },
            (err: SqlError) => {
                callbackError({ codigo: -1, mensaje: `Error al obtener fecha para compara la p de promo: ${err.message}` } as
                    Operacion);
            }
        );
    }
    validarSiAplicaPromo(promo: Promo, promoHistorico: Promo, callback: (aplicarPromo: boolean) => void, callbackError: (resultado: Operacion) => void) {
        try {
            promoHistorico.historyDateTime.setHours(0);
            promoHistorico.historyDateTime.setMinutes(0);
            promoHistorico.historyDateTime.setSeconds(0);
            promoHistorico.historyDateTime.setMilliseconds(0);

            let cantidadDeDias: number = 0;
            switch (promo.frequency) {
                case TipoPeriodicidadDePromo.Siempre.toString():
                    callback(true);
                    break;
                case TipoPeriodicidadDePromo.Unica.toString():
                    callback(false);
                    break;
                case TipoPeriodicidadDePromo.PorDia.toString():
                    let fechaActual = new Date();
                    fechaActual.setHours(0);
                    fechaActual.setMinutes(0);
                    fechaActual.setSeconds(0);
                    fechaActual.setMilliseconds(0);

                    if (promoHistorico.historyDateTime < fechaActual) {
                        callback(true);
                    } else {
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
                this.obtenerFechaParaCompararLaPromo(cantidadDeDias, (fecha: Date) => {
                    if (promoHistorico.historyDateTime <= fecha) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                }, (resultado: Operacion) => {
                    callbackError(resultado);
                });
            }
        } catch (ex) {
            callbackError({ codigo: -1, mensaje: `Error al validar si aplica promo: ${ex.message}` } as Operacion);
        }
    }
}