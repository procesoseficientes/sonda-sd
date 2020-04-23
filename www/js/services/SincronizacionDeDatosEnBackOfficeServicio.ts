class SincronizacionDeDatosEnBackOfficeServicio implements ISincronizacionDeDatosEnBackOfficeServicio{
    obtenerEncabezadosDeOrdenesDeVenta(callback: (ordenesDeVenta:any []) => void, errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.readTransaction((tx: SqlTransaction) => {
            let encabezadosDeOrdenesDeVenta: any[] = [];
            let sql: string[] = [];
            sql.push("SELECT DISTINCT SALES_ORDER_ID, ");
            sql.push("TERMS, POSTED_DATETIME, CLIENT_ID, POS_TERMINAL, GPS_URL, TOTAL_AMOUNT, STATUS, POSTED_BY, IMAGE_1, IMAGE_2, IMAGE_3,");
            sql.push(" DEVICE_BATTERY_FACTOR, VOID_DATETIME, VOID_REASON, VOID_NOTES, VOIDED, CLOSED_ROUTE_DATETIME, IS_ACTIVE_ROUTE, GPS_EXPECTED, ");
            sql.push("SALES_ORDER_ID_BO, IS_POSTED, DELIVERY_DATE, TASK_ID, IS_PARENT, REFERENCE_ID,  TIMES_PRINTED,  SINC, DOC_SERIE, DOC_NUM, ");
            sql.push("IS_POSTED_VOID, IS_VOID, SALES_ORDER_TYPE, DISCOUNT, IS_DRAFT, TOTAL_AMOUNT_DISPLAY, IS_UPDATED, TASK_ID_BO, COMMENT, ");
            sql.push("PAYMENT_TIMES_PRINTED, PAID_TO_DATE, TO_BILL, AUTHORIZED, DETAIL_QTY, IS_POSTED_VALIDATED,DISCOUNT_BY_GENERAL_AMOUNT, ");
            sql.push("SERVER_POSTED_DATETIME, DEVICE_NETWORK_TYPE, IS_POSTED_OFFLINE");
            sql.push(" FROM SALES_ORDER_HEADER");
            sql.push(" ORDER BY POSTED_DATETIME");

            tx.executeSql(sql.join(""), [], (txResult: SqlTransaction, recordset: SqlResultSet) => {
                for (let i = 0; i < recordset.rows.length; i++) {
                    let encabezadoOrdenDeventa = recordset.rows.item(i);
                    encabezadoOrdenDeventa["SALES_ORDER_DETAILS"] = [];
                    encabezadosDeOrdenesDeVenta.push(encabezadoOrdenDeventa);
                    encabezadoOrdenDeventa = null;
                }
                this.obtenerDetallesDeOrdenesDeVenta(txResult,encabezadosDeOrdenesDeVenta,0,callback,errorCallback);
            }, (txResult: SqlTransaction, error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las órdenes de venta debido a: ${error.message}` } as Operacion);
            });

        }, (err: SqlError) => {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las órdenes de venta debido a: ${err.message}` } as Operacion);
        });
    }

    obtenerDetallesDeOrdenesDeVenta(transaccion: SqlTransaction, ordenesDeVenta: any[], indiceDeOrdenDeVentaActual:number, callback: (ordenesDeVenta: any[]) => void, errorCallback: (resultado: Operacion) => void): void {
        if (indiceDeOrdenDeVentaActual < ordenesDeVenta.length) {
            let sql: string[] = [];
            sql.push("SELECT SALES_ORDER_ID,SKU,LINE_SEQ,QTY,PRICE,DISCOUNT,TOTAL_LINE,POSTED_DATETIME,SERIE");
            sql.push(",SERIE_2,REQUERIES_SERIE,COMBO_REFERENCE,PARENT_SEQ,IS_ACTIVE_ROUTE,SKU_NAME");
            sql.push(",IS_POSTED_VOID,IS_VOID,CODE_PACK_UNIT,TOTAL_AMOUNT_DISPLAY,DOC_SERIE,DOC_NUM");
            sql.push(",IS_BONUS,LONG,IS_SALES_BY_MULTIPLE,MULTIPLE_SALE_QTY,OWNER,OWNER_ID,DISCOUNT_TYPE FROM SALES_ORDER_DETAIL");
            sql.push(` WHERE SALES_ORDER_ID = ${ordenesDeVenta[indiceDeOrdenDeVentaActual].SALES_ORDER_ID}`);
            transaccion.executeSql(sql.join(""),
                [],
                (txResult: SqlTransaction, recordset: SqlResultSet) => {
                    for (let i = 0; i < recordset.rows.length; i++) {
                        ordenesDeVenta[indiceDeOrdenDeVentaActual].SALES_ORDER_DETAILS.push(recordset.rows.item(i));
                    }
                    this.obtenerDetallesDeOrdenesDeVenta(txResult,
                        ordenesDeVenta,
                        (indiceDeOrdenDeVentaActual + 1),
                        callback,
                        errorCallback);
                },
                (txResult: SqlTransaction, error: SqlError) => {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `Error al obtener el detalle de las órdenes de venta debido a: ${error.message}`
                    } as Operacion);
                });
        } else {
            callback(ordenesDeVenta);
        }
    }

    obtenerOrdenesDeVentaParaValidacionEnBackOffice(callback: (ordenesDeVenta: any[]) => void,
        errorCallback: (resultado: Operacion) => void): void {
        try {
            this.obtenerEncabezadosDeOrdenesDeVenta(callback,errorCallback);
        } catch (e) {
            errorCallback({codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al intentar obtener las órdenes de venta debido a: ${e.message}`} as Operacion);
        } 

    }
}