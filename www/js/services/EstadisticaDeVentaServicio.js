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
        var _this_1 = this;
        try {
            this.obtenerEstadisticaDeVenta(function (estadisticaDeVenta) {
                _this_1.obtenerInformacionDeVentasDelDia(estadisticaDeVenta, function (estadistica) {
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
        sql.push("SELECT COUNT(INVOICE_NUM) INVOICES_QTY, SUM(TOTAL_AMOUNT) TOTAL_SOLD FROM INVOICE_HEADER WHERE STATUS = 1 AND IS_CREDIT_NOTE = 0");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(""), [], function (transReturn, results) {
                if (results.rows.length > 0) {
                    estadisticaDeVenta.soldToday = results.rows.item(0).TOTAL_SOLD;
                    estadisticaDeVenta.salesOrdersOfDay = results.rows.item(0).INVOICES_QTY;
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
    EstadisticaDeVentaServicio.prototype.agregarEstadisticaDeVentaPorCliente = function (data) {
        try {
            var sql_2 = [];
            sql_2.push("INSERT INTO STATISTIC_SALES_BY_CUSTOMER(ID,CLIENT_ID,CODE_SKU,SKU_NAME ");
            sql_2.push(", QTY,SALE_PACK_UNIT) ");
            sql_2.push("VALUES( ");
            sql_2.push("" + data.ID);
            sql_2.push(",'" + data.CLIENT_ID + "' ");
            sql_2.push(",'" + data.CODE_SKU + "' ");
            sql_2.push(",'" + data.SKU_NAME + "' ");
            sql_2.push("," + data.QTY + " ");
            sql_2.push(",'" + data.SALE_PACK_UNIT + "' ");
            sql_2.push(")");
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(sql_2.join(""));
            }, function (error) {
                console.log("Error al insertar la estadistica de ventas del cliente debido a: " + error.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("Error al insertar la estadística de ventas del cliente.");
            });
        }
        catch (e) {
            console.log("Error al insertar la estadistica de ventas del cliente debido a: " + e.message);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al insertar la estadística de ventas del cliente.");
        }
    };
    EstadisticaDeVentaServicio.prototype.obtenerEstadisticaDeVentaPorCliente = function (clientId, callback, errorCallback) {
        var sql = [];
        var op = new Operacion();
        var listadoDeEstadisticas = [];
        ObtenerListaDePreciosDeCliente(clientId, function (priceListId) {
            sql.push("SELECT");
            sql.push("SSBC.ID, SSBC.CLIENT_ID, SSBC.CODE_SKU, SSBC.SKU_NAME, SSBC.QTY, A.ON_HAND, SSBC.SALE_PACK_UNIT, IFNULL(PLS.PRICE, 0) AS PRICE , A.CODE_PACK_UNIT_STOCK, PC.CONVERSION_FACTOR");
            sql.push("FROM STATISTIC_SALES_BY_CUSTOMER SSBC");
            sql.push("LEFT JOIN SKUS A ON (SSBC.CODE_SKU = A.SKU AND SSBC.CLIENT_ID='" + clientId + "')");
            sql.push("LEFT JOIN PRICE_LIST_BY_SKU_PACK_SCALE PLS ON( PLS.CODE_SKU = A.SKU AND PLS.CODE_PACK_UNIT = SSBC.SALE_PACK_UNIT)");
            sql.push("LEFT JOIN PACK_CONVERSION PC ON (PC.CODE_SKU = SSBC.CODE_SKU)");
            sql.push("WHERE PLS.CODE_PRICE_LIST ='" + priceListId + "'");
            sql.push("AND PLS.LOW_LIMIT = 1");
            sql.push("ORDER BY A.SKU_NAME");
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(sql.join(" "), [], function (_transReturn, results) {
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var estadisticas = new EstadisticaDeVentaPorCliente();
                            var estadisticaTemp = results.rows.item(i);
                            estadisticas.id = estadisticaTemp.ID;
                            estadisticas.clientId = estadisticaTemp.CLIENT_ID;
                            estadisticas.codeSku = estadisticaTemp.CODE_SKU;
                            estadisticas.skuName = estadisticaTemp.SKU_NAME;
                            estadisticas.qty = estadisticaTemp.QTY;
                            estadisticas.onHand = estadisticaTemp.ON_HAND;
                            estadisticas.salePackUnit = estadisticaTemp.SALE_PACK_UNIT;
                            estadisticas.price = estadisticaTemp.PRICE;
                            estadisticas.conversionFactor =
                                estadisticaTemp.CONVERSION_FACTOR;
                            estadisticas.codePackUnitStock =
                                estadisticaTemp.CODE_PACK_UNIT_STOCK;
                            listadoDeEstadisticas.push(estadisticas);
                        }
                        callback(listadoDeEstadisticas);
                    }
                    else {
                        callback(listadoDeEstadisticas);
                    }
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
        }, function (error) {
            op.codigo = -1;
            op.mensaje = error;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallback(op);
        });
    };
    EstadisticaDeVentaServicio.prototype.agregarEstadisticaDeVentaPorClienteFueraDeRuta = function (data, callback) {
        try {
            if (data && data.length) {
                SONDA_DB_Session.transaction(function (trans) {
                    for (var i = 0; i < data.length; i++) {
                        var sql = [];
                        var element = data[i];
                        sql.push("INSERT INTO STATISTIC_SALES_BY_CUSTOMER(ID,CLIENT_ID,CODE_SKU,SKU_NAME ");
                        sql.push(", QTY,SALE_PACK_UNIT) ");
                        sql.push("VALUES( ");
                        sql.push("" + element.ID);
                        sql.push(",'" + element.CLIENT_ID + "' ");
                        sql.push(",'" + element.CODE_SKU + "' ");
                        sql.push(",'" + element.SKU_NAME + "' ");
                        sql.push("," + element.QTY + " ");
                        sql.push(",'" + element.SALE_PACK_UNIT + "' ");
                        sql.push(")");
                        trans.executeSql(sql.join(""));
                        sql = null;
                    }
                    callback();
                }, function (error) {
                    console.log("Error al insertar la estadistica de ventas del cliente debido a: " + error.message);
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("Error al insertar la estadística de ventas del cliente.");
                });
            }
            else {
                callback();
            }
        }
        catch (e) {
            console.log("Error al insertar la estadistica de ventas del cliente debido a: " + e.message);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al insertar la estadística de ventas del cliente.");
        }
    };
    return EstadisticaDeVentaServicio;
}());
//# sourceMappingURL=EstadisticaDeVentaServicio.js.map