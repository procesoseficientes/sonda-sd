var SincronizacionDeDatosEnBackOfficeServicio = (function () {
    function SincronizacionDeDatosEnBackOfficeServicio() {
    }
    SincronizacionDeDatosEnBackOfficeServicio.prototype.obtenerEncabezadosDeOrdenesDeVenta = function (callback, errorCallback) {
        var _this = this;
        SONDA_DB_Session.readTransaction(function (tx) {
            var encabezadosDeOrdenesDeVenta = [];
            var sql = [];
            sql.push("SELECT DISTINCT SALES_ORDER_ID, ");
            sql.push("TERMS, POSTED_DATETIME, CLIENT_ID, POS_TERMINAL, GPS_URL, TOTAL_AMOUNT, STATUS, POSTED_BY, IMAGE_1, IMAGE_2, IMAGE_3,");
            sql.push(" DEVICE_BATTERY_FACTOR, VOID_DATETIME, VOID_REASON, VOID_NOTES, VOIDED, CLOSED_ROUTE_DATETIME, IS_ACTIVE_ROUTE, GPS_EXPECTED, ");
            sql.push("SALES_ORDER_ID_BO, IS_POSTED, DELIVERY_DATE, TASK_ID, IS_PARENT, REFERENCE_ID,  TIMES_PRINTED,  SINC, DOC_SERIE, DOC_NUM, ");
            sql.push("IS_POSTED_VOID, IS_VOID, SALES_ORDER_TYPE, DISCOUNT, IS_DRAFT, TOTAL_AMOUNT_DISPLAY, IS_UPDATED, TASK_ID_BO, COMMENT, ");
            sql.push("PAYMENT_TIMES_PRINTED, PAID_TO_DATE, TO_BILL, AUTHORIZED, DETAIL_QTY, IS_POSTED_VALIDATED,DISCOUNT_BY_GENERAL_AMOUNT, ");
            sql.push("SERVER_POSTED_DATETIME, DEVICE_NETWORK_TYPE, IS_POSTED_OFFLINE");
            sql.push(" FROM SALES_ORDER_HEADER");
            sql.push(" ORDER BY POSTED_DATETIME");
            tx.executeSql(sql.join(""), [], function (txResult, recordset) {
                for (var i = 0; i < recordset.rows.length; i++) {
                    var encabezadoOrdenDeventa = recordset.rows.item(i);
                    encabezadoOrdenDeventa["SALES_ORDER_DETAILS"] = [];
                    encabezadosDeOrdenesDeVenta.push(encabezadoOrdenDeventa);
                    encabezadoOrdenDeventa = null;
                }
                _this.obtenerDetallesDeOrdenesDeVenta(txResult, encabezadosDeOrdenesDeVenta, 0, callback, errorCallback);
            }, function (txResult, error) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las \u00F3rdenes de venta debido a: " + error.message });
            });
        }, function (err) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las \u00F3rdenes de venta debido a: " + err.message });
        });
    };
    SincronizacionDeDatosEnBackOfficeServicio.prototype.obtenerDetallesDeOrdenesDeVenta = function (transaccion, ordenesDeVenta, indiceDeOrdenDeVentaActual, callback, errorCallback) {
        var _this = this;
        if (indiceDeOrdenDeVentaActual < ordenesDeVenta.length) {
            var sql = [];
            sql.push("SELECT SALES_ORDER_ID,SKU,LINE_SEQ,QTY,PRICE,DISCOUNT,TOTAL_LINE,POSTED_DATETIME,SERIE");
            sql.push(",SERIE_2,REQUERIES_SERIE,COMBO_REFERENCE,PARENT_SEQ,IS_ACTIVE_ROUTE,SKU_NAME");
            sql.push(",IS_POSTED_VOID,IS_VOID,CODE_PACK_UNIT,TOTAL_AMOUNT_DISPLAY,DOC_SERIE,DOC_NUM");
            sql.push(",IS_BONUS,LONG,IS_SALES_BY_MULTIPLE,MULTIPLE_SALE_QTY,OWNER,OWNER_ID,DISCOUNT_TYPE FROM SALES_ORDER_DETAIL");
            sql.push(" WHERE SALES_ORDER_ID = " + ordenesDeVenta[indiceDeOrdenDeVentaActual].SALES_ORDER_ID);
            transaccion.executeSql(sql.join(""), [], function (txResult, recordset) {
                for (var i = 0; i < recordset.rows.length; i++) {
                    ordenesDeVenta[indiceDeOrdenDeVentaActual].SALES_ORDER_DETAILS.push(recordset.rows.item(i));
                }
                _this.obtenerDetallesDeOrdenesDeVenta(txResult, ordenesDeVenta, (indiceDeOrdenDeVentaActual + 1), callback, errorCallback);
            }, function (txResult, error) {
                errorCallback({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al obtener el detalle de las \u00F3rdenes de venta debido a: " + error.message
                });
            });
        }
        else {
            callback(ordenesDeVenta);
        }
    };
    SincronizacionDeDatosEnBackOfficeServicio.prototype.obtenerOrdenesDeVentaParaValidacionEnBackOffice = function (callback, errorCallback) {
        try {
            this.obtenerEncabezadosDeOrdenesDeVenta(callback, errorCallback);
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al intentar obtener las \u00F3rdenes de venta debido a: " + e.message });
        }
    };
    return SincronizacionDeDatosEnBackOfficeServicio;
}());
//# sourceMappingURL=SincronizacionDeDatosEnBackOfficeServicio.js.map