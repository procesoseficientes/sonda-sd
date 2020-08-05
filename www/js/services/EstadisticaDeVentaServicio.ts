class EstadisticaDeVentaServicio implements IEstadisticaDeVentaServicio {

    agregarEstadisticaDeVenta(data: any): void {
        try {
            let sql: string[] = [];

            sql.push("INSERT INTO PRESALE_STATISTICS(GOAL_HEADER_ID, TEAM_NAME, GOAL_NAME ");
            sql.push(", RANKING, GOAL_AMOUNT, ACCUMULATED_AMOUNT ");
            sql.push(", GOAL_PERCENTAGE_COVERED, REMAINING_DAYS, GOAL_AMOUNT_OF_DAY) ");
            sql.push("VALUES( ");
            sql.push(`${data.GOAL_HEADER_ID}`);
            sql.push(`,'${data.TEAM_NAME}' `);
            sql.push(`,'${data.GOAL_NAME}' `);
            sql.push(`,'${data.RANKING}' `);
            sql.push(`,${data.GOAL_AMOUNT} `);
            sql.push(`,${data.ACCUMULATED_AMOUNT} `);
            sql.push(`,${data.GOAL_PERCENTAGE_COVERED} `);
            sql.push(`,${data.REMAINING_DAYS} `);
            sql.push(`,${data.GOAL_AMOUNT_OF_DAY} `);
            sql.push(")");

            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                trans.executeSql(sql.join(""));
            }, (error: SqlError) => {
                console.log(`Error al insertar la estadistica de ventas del usuario debido a: ${error.message}`);
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("Error al insertar la estadística de ventas del usuario.");
            });

        } catch (e) {
            console.log(`Error al insertar la estadistica de ventas del usuario debido a: ${e.message}`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al insertar la estadística de ventas del usuario.");
        }
    }

    obtenerInformacionDeEstadisticaDeVenta(callback: (estadistica: EstadisticaDeVenta) => void): void {
        try {
            this.obtenerEstadisticaDeVenta((estadisticaDeVenta: EstadisticaDeVenta) => {
                this.obtenerInformacionDeVentasDelDia(estadisticaDeVenta,
                    (estadistica: EstadisticaDeVenta) => {
                        callback(estadistica);
                    },
                    (resultado: Operacion) => {
                        console.log(`Error al obtener la estadistica de ventas del usuario debido a: ${resultado.mensaje}`);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify("Error al obtener la estadística de ventas del usuario.");
                    });
            },
                (resultado: Operacion) => {
                    console.log(`Error al obtener la estadistica de ventas del usuario debido a: ${resultado.mensaje}`);
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("Error al obtener la estadística de ventas del usuario.");
                });
        } catch (e) {
            console.log(`Error al obtener la estadistica de ventas del usuario debido a: ${e.message}`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al obtener la estadística de ventas del usuario.");
        }
    }

    obtenerEstadisticaDeVenta(callback: (estadisticaDeVenta: EstadisticaDeVenta) => void, errorCallback: (resultado: Operacion) => void): void {
        let estadistica = new EstadisticaDeVenta();
        let op = new Operacion();
        let sql: string[] = [];

        sql.push(`SELECT GOAL_HEADER_ID, TEAM_NAME, `);
        sql.push(`GOAL_NAME, RANKING, GOAL_AMOUNT, `);
        sql.push(`ACCUMULATED_AMOUNT, GOAL_PERCENTAGE_COVERED, `);
        sql.push(`REMAINING_DAYS, GOAL_AMOUNT_OF_DAY `);
        sql.push(`FROM PRESALE_STATISTICS`);

        SONDA_DB_Session.transaction((trans: SqlTransaction) => {

            trans.executeSql(sql.join(""),
                [],
                (transReturn: SqlTransaction, results: SqlResultSet) => {
                    if (results.rows.length > 0) {
                        let estadisticaTemp = results.rows.item(0) as any;
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
                },
                (transReturn: SqlTransaction, error: SqlError) => {
                    op.codigo = error.code;
                    op.mensaje = error.message;
                    op.resultado = ResultadoOperacionTipo.Error;
                    errorCallback(op);
                });

        }, (error: SqlError) => {
            op.codigo = error.code;
            op.mensaje = error.message;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallback(op);
        });
    }

    obtenerInformacionDeVentasDelDia(estadisticaDeVenta: EstadisticaDeVenta,
        callback: (estadistica: EstadisticaDeVenta) => void,
        errorCallback: (resultado: Operacion) => void): void {

        let sql: string[] = [];
        let op = new Operacion();

        sql
            .push(`SELECT COUNT(INVOICE_NUM) INVOICES_QTY, SUM(TOTAL_AMOUNT) TOTAL_SOLD FROM INVOICE_HEADER WHERE STATUS = 1 AND IS_CREDIT_NOTE = 0`);

        SONDA_DB_Session.transaction((trans: SqlTransaction) => {

            trans.executeSql(sql.join(""),
                [],
                (transReturn: SqlTransaction, results: SqlResultSet) => {
                    if (results.rows.length > 0) {
                        estadisticaDeVenta.soldToday = (results.rows.item(0) as any).TOTAL_SOLD;
                        estadisticaDeVenta.salesOrdersOfDay = (results.rows.item(0) as any).INVOICES_QTY;

                        estadisticaDeVenta
                            .pendingToSaleToday = estadisticaDeVenta.goalAmountOfDay - estadisticaDeVenta.soldToday;
                    }
                    callback(estadisticaDeVenta);
                },
                (transReturn: SqlTransaction, error: SqlError) => {
                    op.codigo = error.code;
                    op.mensaje = error.message;
                    op.resultado = ResultadoOperacionTipo.Error;
                    errorCallback(op);
                });

        }, (error: SqlError) => {
            op.codigo = error.code;
            op.mensaje = error.message;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallback(op);
        });
    }
}