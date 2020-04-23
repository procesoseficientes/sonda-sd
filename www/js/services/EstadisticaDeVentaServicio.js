var EstadisticaDeVentaServicio = (function () {
    function EstadisticaDeVentaServicio() {
    }
    EstadisticaDeVentaServicio.prototype.agregarEstadisticaDeVenta = function (data) {
        try {
            var sql = [];
            sql.push("INSERT INTO PRESALE_STATISTICS(GOAL_HEADER_ID, TEAM_NAME, GOAL_NAME ");
            sql.push(", RANKING, GOAL_AMOUNT, ACCUMULATED_AMOUNT ");
            sql.push(", GOAL_PERCENTAGE_COVERED, REMAINING_DAYS, GOAL_AMOUNT_OF_DAY) ");
            sql.push("VALUES( ");
            sql.push("" + data.GOAL_HEADER_ID);
            sql.push(",'" + data.TEAM_NAME + "' ");
            sql.push(",'" + data.GOAL_NAME + "' ");
            sql.push(",'" + data.RANKING + "' ");
            sql.push("," + data.GOAL_AMOUNT + " ");
            sql.push("," + data.ACCUMULATED_AMOUNT + " ");
            sql.push("," + data.GOAL_PERCENTAGE_COVERED + " ");
            sql.push("," + data.REMAINING_DAYS + " ");
            sql.push("," + data.GOAL_AMOUNT_OF_DAY + " ");
            sql.push(")");
            gInsertsInitialRoute.push(sql.join(""));
        }
        catch (e) {
            console.log("Error al insertar la estadistica de ventas del usuario debido a: " + e.message);
            DesBloquearPantalla();
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
                    throw new Error(resultado.mensaje);
                });
            }, function (resultado) {
                throw new Error(resultado.mensaje);
            });
        }
        catch (e) {
            console.log("Error al obtener la estadistica de ventas del usuario debido a: " + e.message);
            DesBloquearPantalla();
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
                    estadistica.accumulatedAmount =
                        estadisticaTemp.ACCUMULATED_AMOUNT;
                    estadistica.goalPercentageCovered =
                        estadisticaTemp.GOAL_PERCENTAGE_COVERED;
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
        sql.push("SELECT COUNT(SALES_ORDER_ID) ORDERS_QTY, SUM(TOTAL_AMOUNT_DISPLAY) TOTAL_SOLD");
        sql.push("FROM SALES_ORDER_HEADER WHERE IS_VOID = 0 AND IS_DRAFT <> 1");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(" "), [], function (transReturn, results) {
                if (results.rows.length > 0) {
                    estadisticaDeVenta.soldToday = results.rows.item(0).TOTAL_SOLD;
                    estadisticaDeVenta.salesOrdersOfDay = results.rows.item(0).ORDERS_QTY;
                    estadisticaDeVenta.pendingToSaleToday =
                        estadisticaDeVenta.goalAmountOfDay -
                            estadisticaDeVenta.soldToday;
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