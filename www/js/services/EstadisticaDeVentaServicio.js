var EstadisticaDeVentaServicio = (function () {
    function EstadisticaDeVentaServicio() {
    }
    EstadisticaDeVentaServicio.prototype.agregarEstadisticaDeVenta = function (data) {
        try {
            var sql_1 = [];
            sql_1.push("INSERT INTO PRESALE_STATISTICS(GOAL_HEADER_ID, TEAM_NAME, GOAL_NAME ");
            sql_1.push(", RANKING, GOAL_AMOUNT, ACCUMULATED_AMOUNT ");
            sql_1.push(", GOAL_PERCENTAGE_COVERED, REMAINING_DAYS, GOAL_AMOUNT_OF_DAY) ");
            sql_1.push("VALUES( ");
            sql_1.push("" + data.GOAL_HEADER_ID);
            sql_1.push(",'" + data.TEAM_NAME + "' ");
            sql_1.push(",'" + data.GOAL_NAME + "' ");
            sql_1.push(",'" + data.RANKING + "' ");
            sql_1.push("," + data.GOAL_AMOUNT + " ");
            sql_1.push("," + data.ACCUMULATED_AMOUNT + " ");
            sql_1.push("," + data.GOAL_PERCENTAGE_COVERED + " ");
            sql_1.push("," + data.REMAINING_DAYS + " ");
            sql_1.push("," + data.GOAL_AMOUNT_OF_DAY + " ");
            sql_1.push(")");
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(sql_1.join(""));
            }, function (error) {
                console.log("Error al insertar la estadistica de ventas del usuario debido a: " + error.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("Error al insertar la estadística de ventas del usuario.");
            });
        }
        catch (e) {
            console.log("Error al insertar la estadistica de ventas del usuario debido a: " + e.message);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al insertar la estadística de ventas del usuario.");
        }
    };
    EstadisticaDeVentaServicio.prototype.obtenerInformacionDeEstadisticaDeVenta = function (callback) {
        var _this = this;
        try {
            this.obtenerEstadisticaDeVenta(function (estadisticaDeVenta) {
                _this.obtenerInformacionDeVentasDelDia(estadisticaDeVenta, function (estadistica) {
                    callback(estadistica);
                }, function (resultado) {
                    console.log("Error al obtener la estadistica de ventas del usuario debido a: " + resultado.mensaje);
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("Error al obtener la estadística de ventas del usuario.");
                });
            }, function (resultado) {
                console.log("Error al obtener la estadistica de ventas del usuario debido a: " + resultado.mensaje);
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("Error al obtener la estadística de ventas del usuario.");
            });
        }
        catch (e) {
            console.log("Error al obtener la estadistica de ventas del usuario debido a: " + e.message);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al obtener la estadística de ventas del usuario.");
        }
    };
    EstadisticaDeVentaServicio.prototype.obtenerEstadisticaDeVenta = function (callback, errorCallback) {
        var estadistica = new EstadisticaDeVenta();
        var op = new Operacion();
        var sql = [];
        sql.push("SELECT GOAL_HEADER_ID, TEAM_NAME, ");
        sql.push("GOAL_NAME, RANKING, GOAL_AMOUNT, ");
        sql.push("ACCUMULATED_AMOUNT, GOAL_PERCENTAGE_COVERED, ");
        sql.push("REMAINING_DAYS, GOAL_AMOUNT_OF_DAY ");
        sql.push("FROM PRESALE_STATISTICS");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(""), [], function (transReturn, results) {
                if (results.rows.length > 0) {
                    var estadisticaTemp = results.rows.item(0);
                    estadistica.goalHeaderId = estadisticaTemp.GOAL_HEADER_ID;
                    estadistica.teamName = estadisticaTemp.TEAM_NAME;
                    estadistica.goalName = estadisticaTemp.GOAL_NAME;
                    estadistica.ranking = estadisticaTemp.RANKING;
                    estadistica.goalAmount = estadisticaTemp.GOAL_AMOUNT;
                    estadistica.accumulatedAmount = estadisticaTemp.ACCUMULATED_AMOUNT;
                    estadistica.goalPercentageCovered = estadisticaTemp.GOAL_PERCENTAGE_COVERED;
                    estadistica.remainingDays = estadisticaTemp.REMAINING_DAYS;
                    estadistica.goalAmountOfDay = estadisticaTemp.GOAL_AMOUNT_OF_DAY;
                    estadistica.soldToday = 0;
                    estadistica.salesOrdersOfDay = 0;
                    estadistica.pendingToSaleToday = 0;
                }
                callback(estadistica);
            }, function (transReturn, error) {
                op.codigo = error.code;
                op.mensaje = error.message;
                op.resultado = ResultadoOperacionTipo.Error;
                errorCallback(op);
            });
        }, function (error) {
            op.codigo = error.code;
            op.mensaje = error.message;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallback(op);
        });
    };
    EstadisticaDeVentaServicio.prototype.obtenerInformacionDeVentasDelDia = function (estadisticaDeVenta, callback, errorCallback) {
        var sql = [];
        var op = new Operacion();
        sql
            .push("SELECT COUNT(INVOICE_NUM) INVOICES_QTY, SUM(TOTAL_AMOUNT) TOTAL_SOLD FROM INVOICE_HEADER WHERE STATUS = 1 AND IS_CREDIT_NOTE = 0");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(""), [], function (transReturn, results) {
                if (results.rows.length > 0) {
                    estadisticaDeVenta.soldToday = results.rows.item(0).TOTAL_SOLD;
                    estadisticaDeVenta.salesOrdersOfDay = results.rows.item(0).INVOICES_QTY;
                    estadisticaDeVenta
                        .pendingToSaleToday = estadisticaDeVenta.goalAmountOfDay - estadisticaDeVenta.soldToday;
                }
                callback(estadisticaDeVenta);
            }, function (transReturn, error) {
                op.codigo = error.code;
                op.mensaje = error.message;
                op.resultado = ResultadoOperacionTipo.Error;
                errorCallback(op);
            });
        }, function (error) {
            op.codigo = error.code;
            op.mensaje = error.message;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallback(op);
        });
    };
    return EstadisticaDeVentaServicio;
}());
//# sourceMappingURL=EstadisticaDeVentaServicio.js.map