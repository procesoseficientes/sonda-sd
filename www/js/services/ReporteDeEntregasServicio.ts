class ReporteDeEntregasServicio implements IReporteDeEntregasServicio {

    obtenerEntregasProcesadas(callBack: (entregasProcesadas: DemandaDeDespachoEncabezado[]) => void, errorCallBack: (error: Operacion) => void): void {
        try {
            let entregasProcesadas: DemandaDeDespachoEncabezado[] = [];
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql = [];
                sql.push(" SELECT ");
                sql.push(" PDH.DOC_NUM AS PICKING_DEMAND_HEADER_ID ");
                sql.push(" ,PDH.CLIENT_CODE ");
                sql.push(" ,DNH.TOTAL_AMOUNT ");
                sql.push(" ,PDH.CLIENT_NAME ");
                sql.push(" ,PDH.PROCESS_STATUS ");
                sql.push(" ,PDH.ERP_REFERENCE_DOC_NUM ");
                sql.push(" ,DNH.DOC_NUM ");
                sql.push(" ,SUM(DND.QTY) AS QTY_TO_DELIVERY");
                sql.push(" ,DNH.INVOICE_ID");
                sql.push(" ,DNH.IS_CANCELED");
                sql.push(" ,DNH.REASON_CANCEL");
                sql.push(" FROM NEXT_PICKING_DEMAND_HEADER PDH ");
                sql.push(" INNER JOIN SONDA_DELIVERY_NOTE_DETAIL DND ");
                sql.push(" ON (DND.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID) ");
                sql.push(" INNER JOIN SONDA_DELIVERY_NOTE_HEADER DNH ");
                sql.push(" ON (DND.DELIVERY_NOTE_ID = DNH.DELIVERY_NOTE_ID) ");
                sql.push(" WHERE PDH.PROCESS_STATUS IN ('DELIVERED') AND DNH.IS_CANCELED IS NULL");
                sql.push(" GROUP BY PDH.CLIENT_CODE ,PDH.CLIENT_NAME, PDH.PROCESS_STATUS ");
                sql.push(" ,PDH.MANIFEST_HEADER_ID, DNH.DOC_NUM ORDER BY DNH.DOC_NUM ASC");

                trans.executeSql(sql.join(""),
                    [],
                    (transResult: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length > 0) {
                            for (let i = 0; i < results.rows.length; i++) {
                                let entregaProcesadaTemp = <any>results.rows.item(i);
                                let entregaProcesada: DemandaDeDespachoEncabezado = new DemandaDeDespachoEncabezado();
                                entregaProcesada.pickingDemandHeaderId = entregaProcesadaTemp.PICKING_DEMAND_HEADER_ID;
                                entregaProcesada.clientCode = entregaProcesadaTemp.CLIENT_CODE;
                                entregaProcesada.totalAmount = entregaProcesadaTemp.TOTAL_AMOUNT;
                                entregaProcesada.clientName = entregaProcesadaTemp.CLIENT_NAME;
                                entregaProcesada.processStatus = entregaProcesadaTemp.PROCESS_STATUS;
                                entregaProcesada.erpReferenceDocNum = entregaProcesadaTemp.ERP_REFERENCE_DOC_NUM;
                                entregaProcesada.docNum = entregaProcesadaTemp.DOC_NUM;
                                entregaProcesada.qtyToDelivery = entregaProcesadaTemp.QTY_TO_DELIVERY;
                                entregaProcesada.invoiceId = entregaProcesadaTemp.INVOICE_ID;
                                entregaProcesada.isCanceled = entregaProcesadaTemp.IS_CANCELED;
                                entregaProcesada.reasonCancel = entregaProcesadaTemp.REASON_CANCEL;

                                entregasProcesadas.push(entregaProcesada);
                            }
                            callBack(entregasProcesadas);
                        } else {
                            callBack(entregasProcesadas);
                        }
                    },
                    (transResult: SqlTransaction, error: SqlError) => {
                        errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                    });
            },
                (error) => {
                    errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                });
        } catch (error) {
            errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
        }
    }

    obtenerEntregasPendientes(callBack: (entregasPendientes: DemandaDeDespachoEncabezado[]) => void, errorCallBack: (error: Operacion) => void): void {
        try {
            let entregasPendientes = [];
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                    let sql = [];
                    sql.push(" SELECT ");
                    sql.push(" PDH.PICKING_DEMAND_HEADER_ID ");
                    sql.push(" ,PDH.CLIENT_CODE ");
                    sql.push(" ,SUM(PDD.QTY * PDD.PRICE) AS TOTAL_AMOUNT ");
                    sql.push(" ,PDH.CLIENT_NAME ");
                    sql.push(" ,PDH.PROCESS_STATUS ");
                    sql.push(" ,PDH.ERP_REFERENCE_DOC_NUM ");
                    sql.push(" ,PDH.DOC_NUM ");
                    sql.push(" ,SUM(PDD.QTY) AS QTY_PENDING");
                    sql.push(" FROM NEXT_PICKING_DEMAND_HEADER PDH ");
                    sql.push(" INNER JOIN NEXT_PICKING_DEMAND_DETAIL PDD ");
                    sql.push(" ON (PDD.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID) ");
                    sql.push(" WHERE PDH.PROCESS_STATUS IN ('PENDING') ");
                    sql.push(" GROUP BY PDH.PICKING_DEMAND_HEADER_ID ");
                    sql.push(" ,PDH.CLIENT_CODE ,PDH.CLIENT_NAME, PDH.PROCESS_STATUS ");
                    sql.push(" ,PDH.MANIFEST_HEADER_ID ,PDH.ERP_REFERENCE_DOC_NUM ,PDH.DOC_NUM ");

                    trans.executeSql(sql.join(""),
                        [],
                        (transResult: SqlTransaction, results: SqlResultSet) => {
                            if (results.rows.length > 0) {
                                for (let i = 0; i < results.rows.length; i++) {
                                    let entregaPendienteTemp = <any>results.rows.item(i);
                                    let entregaPendiente: DemandaDeDespachoEncabezado = new
                                        DemandaDeDespachoEncabezado();
                                    entregaPendiente.pickingDemandHeaderId = entregaPendienteTemp
                                        .PICKING_DEMAND_HEADER_ID;
                                    entregaPendiente.clientCode = entregaPendienteTemp.CLIENT_CODE;
                                    entregaPendiente.totalAmount = entregaPendienteTemp.TOTAL_AMOUNT;
                                    entregaPendiente.clientName = entregaPendienteTemp.CLIENT_NAME;
                                    entregaPendiente.processStatus = entregaPendienteTemp.PROCESS_STATUS;
                                    entregaPendiente.erpReferenceDocNum = entregaPendienteTemp.ERP_REFERENCE_DOC_NUM;
                                    entregaPendiente.docNum = entregaPendienteTemp.DOC_NUM;
                                    entregaPendiente.qtyPending = entregaPendienteTemp.QTY_PENDING;

                                    entregasPendientes.push(entregaPendiente);
                                }

                                this.obtenerNotasDeEntregaAsociadasADemandaDeDespacho(entregasPendientes,
                                    transResult,
                                    (entregasPendientesDevueltas, notasDeEntrega) => {
                                        entregasPendientesDevueltas.map((entregaPendiente: DemandaDeDespachoEncabezado) => {

                                                let notaEntregaAnuladaAsociadaADemandaDeDespachoPendiente:
                                                    NotaDeEntregaEncabezado = (notasDeEntrega as any)
                                                        .find((notaEntrega: NotaDeEntregaEncabezado) => {
                                                            return notaEntrega.relatedPickingDemandHeaderId ===
                                                                entregaPendiente.pickingDemandHeaderId;
                                                        });

                                                if (notaEntregaAnuladaAsociadaADemandaDeDespachoPendiente) {
                                                    entregaPendiente
                                                        .isCanceled =
                                                        notaEntregaAnuladaAsociadaADemandaDeDespachoPendiente
                                                        .isCanceled;
                                                    entregaPendiente
                                                        .reasonCancel =
                                                        notaEntregaAnuladaAsociadaADemandaDeDespachoPendiente
                                                        .reasonCancel;
                                                }

                                            });
                                        callBack(entregasPendientesDevueltas);
                                    },
                                    errorCallBack);

                            } else {
                                callBack(entregasPendientes);
                            }
                        },
                        (transResult: SqlTransaction, error: SqlError) => {
                            errorCallBack({
                                codigo: error.code,
                                resultado: ResultadoOperacionTipo.Error,
                                mensaje: error.message
                            } as Operacion);
                        });
                },
                (error) => {
                    errorCallBack({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: error.message
                    } as Operacion);
                });
        } catch (error) {
            errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
        }
    }

    obtenerNotasDeEntregaAsociadasADemandaDeDespacho(entregasPendientes: DemandaDeDespachoEncabezado[], trans: SqlTransaction, callback: (entregasPendientes: DemandaDeDespachoEncabezado[], notasDeEntregaAsociadas: NotaDeEntregaEncabezado[]) =>void, errorCallback: (resultado:Operacion)=>void) {
        let sql: string[] = [];
        let notasDeEntregaAsociadasADemandaDeDespacho: NotaDeEntregaEncabezado[] = [];
        sql.push(`SELECT DISTINCT DNH.DELIVERY_NOTE_ID, DND.PICKING_DEMAND_HEADER_ID, DNH.IS_CANCELED, DNH.REASON_CANCEL `);
        sql.push(`FROM SONDA_DELIVERY_NOTE_DETAIL AS DND `);
        sql.push(`INNER JOIN SONDA_DELIVERY_NOTE_HEADER AS DNH `);
        sql.push(`ON (DNH.DELIVERY_NOTE_ID = DND.DELIVERY_NOTE_ID) `);
        sql.push(`GROUP BY DND.PICKING_DEMAND_HEADER_ID `);
        sql.push(`ORDER BY DNH.DELIVERY_NOTE_ID DESC`);

        trans.executeSql(sql.join(""),
            [],
            (transReturn: SqlTransaction, results: SqlResultSet) => {
                if (results.rows.length > 0) {
                    for (let i = 0; i < results.rows.length; i++) {
                        let notaEntregaTemp: any = results.rows.item(i);
                        let notaEntrega: NotaDeEntregaEncabezado = new NotaDeEntregaEncabezado();

                        notaEntrega.deliveryNoteId = notaEntregaTemp.DELIVERY_NOTE_ID;
                        notaEntrega.relatedPickingDemandHeaderId = notaEntregaTemp.PICKING_DEMAND_HEADER_ID;
                        notaEntrega.isCanceled = notaEntregaTemp.IS_CANCELED;
                        notaEntrega.reasonCancel = notaEntregaTemp.REASON_CANCEL;
                        notasDeEntregaAsociadasADemandaDeDespacho.push(notaEntrega);
                    }
                    callback(entregasPendientes,notasDeEntregaAsociadasADemandaDeDespacho);
                } else {
                    callback(entregasPendientes, notasDeEntregaAsociadasADemandaDeDespacho);
                }
            },
            (transReturn: SqlTransaction, error: SqlError) => {
                errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
            });

    }

    obtenerEntregasCanceladas(callBack: (entregasProcesadas: DemandaDeDespachoEncabezado[]) => void, errorCallBack: (error: Operacion) => void): void {
        try {
            let entregasCanceladas: DemandaDeDespachoEncabezado[] = [];
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql = [];
                sql.push(" SELECT ");
                sql.push(" PDH.PICKING_DEMAND_HEADER_ID ");
                sql.push(" ,PDH.CLIENT_CODE ");
                sql.push(" ,SUM(PDD.QTY * PDD.PRICE) AS TOTAL_AMOUNT ");
                sql.push(" ,PDH.CLIENT_NAME ");
                sql.push(" ,PDH.PROCESS_STATUS ");
                sql.push(" ,PDH.ERP_REFERENCE_DOC_NUM ");
                sql.push(" ,PDH.DOC_NUM ");
                sql.push(" ,SUM(PDD.QTY) AS QTY_CANCELED");
                sql.push(" ,DC.REASON_CANCEL");
                sql.push(" FROM NEXT_PICKING_DEMAND_HEADER PDH ");
                sql.push(" INNER JOIN DELIVERY_CANCELED DC ");
                sql.push(" ON (DC.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID) ");
                sql.push(" INNER JOIN NEXT_PICKING_DEMAND_DETAIL PDD ");
                sql.push(" ON (PDD.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID) ");
                sql.push(" WHERE PDH.PROCESS_STATUS IN ('CANCELED') ");
                sql.push(" GROUP BY PDH.PICKING_DEMAND_HEADER_ID ");
                sql.push(" ,PDH.CLIENT_CODE ,PDH.CLIENT_NAME, PDH.PROCESS_STATUS ");
                sql.push(" ,PDH.MANIFEST_HEADER_ID ,PDH.ERP_REFERENCE_DOC_NUM ,PDH.DOC_NUM ");

                trans.executeSql(sql.join(""),
                    [],
                    (transResult: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length > 0) {
                            for (let i = 0; i < results.rows.length; i++) {
                                let entregaCanceladaTemp = <any>results.rows.item(i);
                                let entregaCancelada: DemandaDeDespachoEncabezado = new DemandaDeDespachoEncabezado();
                                entregaCancelada.pickingDemandHeaderId = entregaCanceladaTemp.PICKING_DEMAND_HEADER_ID;
                                entregaCancelada.clientCode = entregaCanceladaTemp.CLIENT_CODE;
                                entregaCancelada.totalAmount = entregaCanceladaTemp.TOTAL_AMOUNT;
                                entregaCancelada.clientName = entregaCanceladaTemp.CLIENT_NAME;
                                entregaCancelada.processStatus = entregaCanceladaTemp.PROCESS_STATUS;
                                entregaCancelada.erpReferenceDocNum = entregaCanceladaTemp.ERP_REFERENCE_DOC_NUM;
                                entregaCancelada.docNum = entregaCanceladaTemp.DOC_NUM;
                                entregaCancelada.qtyCanceled = entregaCanceladaTemp.QTY_CANCELED;
                                entregaCancelada.reasonCancel = entregaCanceladaTemp.REASON_CANCEL;

                                entregasCanceladas.push(entregaCancelada);
                            }
                            callBack(entregasCanceladas);
                        } else {
                            callBack(entregasCanceladas);
                        }
                    },
                    (transResult: SqlTransaction, error: SqlError) => {
                        errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                    });
            },
                (error) => {
                    errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                });
        } catch (error) {
            errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
        }
    }

    obtenerRazonesDeAnulacionDeEntrega(callback: (clasificacionesADevolver: Clasificacion[]) => void, errorCallback: (resultado: Operacion) => void) {
        try {
            let clasificacionesADevolver: Clasificacion[] = [];
            SONDA_DB_Session.readTransaction((trans: SqlTransaction) => {
                let sql: string[] = [];
                
                sql.push(`SELECT REASON_ID, REASON_DESCRIPTION FROM VOID_REASONS `);
                
                trans.executeSql(sql.join(""),
                    [],
                    (transReturn: SqlTransaction, results: SqlResultSet) => {

                        for (let i = 0; i < results.rows.length; i++) {
                            let clasificacion = new Clasificacion();
                            let clasificacionTemp = <any>results.rows.item(i);

                            clasificacion.reasonId = clasificacionTemp.REASON_ID;
                            clasificacion.reasonDescription = clasificacionTemp.REASON_DESCRIPTION;
                            clasificacionesADevolver.push(clasificacion);
                        }
                        clasificacionesADevolver
                            .push({ reasonId: "Sin Razón", reasonDescription: "Sin Razón" } as Clasificacion);
                        callback(clasificacionesADevolver);
                    },
                    (transReturn: SqlTransaction, error: SqlError) => {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las razones de no anulación de entrega debido a: ${error.message}` } as Operacion);
                    });

            }, (error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las razones de anulación de entrega debido a: ${error.message}` } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las razones de anulación de entrega debido a: ${e.message}` } as Operacion);
        }
    }
}