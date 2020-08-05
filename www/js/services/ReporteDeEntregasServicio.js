var ReporteDeEntregasServicio = (function () {
    function ReporteDeEntregasServicio() {
    }
    ReporteDeEntregasServicio.prototype.obtenerEntregasProcesadas = function (callBack, errorCallBack) {
        try {
            var entregasProcesadas_1 = [];
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
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
                trans.executeSql(sql.join(""), [], function (transResult, results) {
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var entregaProcesadaTemp = results.rows.item(i);
                            var entregaProcesada = new DemandaDeDespachoEncabezado();
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
                            entregasProcesadas_1.push(entregaProcesada);
                        }
                        callBack(entregasProcesadas_1);
                    }
                    else {
                        callBack(entregasProcesadas_1);
                    }
                }, function (transResult, error) {
                    errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
                });
            }, function (error) {
                errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
            });
        }
        catch (error) {
            errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
        }
    };
    ReporteDeEntregasServicio.prototype.obtenerEntregasPendientes = function (callBack, errorCallBack) {
        var _this = this;
        try {
            var entregasPendientes_1 = [];
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
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
                trans.executeSql(sql.join(""), [], function (transResult, results) {
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var entregaPendienteTemp = results.rows.item(i);
                            var entregaPendiente = new DemandaDeDespachoEncabezado();
                            entregaPendiente.pickingDemandHeaderId = entregaPendienteTemp
                                .PICKING_DEMAND_HEADER_ID;
                            entregaPendiente.clientCode = entregaPendienteTemp.CLIENT_CODE;
                            entregaPendiente.totalAmount = entregaPendienteTemp.TOTAL_AMOUNT;
                            entregaPendiente.clientName = entregaPendienteTemp.CLIENT_NAME;
                            entregaPendiente.processStatus = entregaPendienteTemp.PROCESS_STATUS;
                            entregaPendiente.erpReferenceDocNum = entregaPendienteTemp.ERP_REFERENCE_DOC_NUM;
                            entregaPendiente.docNum = entregaPendienteTemp.DOC_NUM;
                            entregaPendiente.qtyPending = entregaPendienteTemp.QTY_PENDING;
                            entregasPendientes_1.push(entregaPendiente);
                        }
                        _this.obtenerNotasDeEntregaAsociadasADemandaDeDespacho(entregasPendientes_1, transResult, function (entregasPendientesDevueltas, notasDeEntrega) {
                            entregasPendientesDevueltas.map(function (entregaPendiente) {
                                var notaEntregaAnuladaAsociadaADemandaDeDespachoPendiente = notasDeEntrega
                                    .find(function (notaEntrega) {
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
                        }, errorCallBack);
                    }
                    else {
                        callBack(entregasPendientes_1);
                    }
                }, function (transResult, error) {
                    errorCallBack({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: error.message
                    });
                });
            }, function (error) {
                errorCallBack({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }
        catch (error) {
            errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
        }
    };
    ReporteDeEntregasServicio.prototype.obtenerNotasDeEntregaAsociadasADemandaDeDespacho = function (entregasPendientes, trans, callback, errorCallback) {
        var sql = [];
        var notasDeEntregaAsociadasADemandaDeDespacho = [];
        sql.push("SELECT DISTINCT DNH.DELIVERY_NOTE_ID, DND.PICKING_DEMAND_HEADER_ID, DNH.IS_CANCELED, DNH.REASON_CANCEL ");
        sql.push("FROM SONDA_DELIVERY_NOTE_DETAIL AS DND ");
        sql.push("INNER JOIN SONDA_DELIVERY_NOTE_HEADER AS DNH ");
        sql.push("ON (DNH.DELIVERY_NOTE_ID = DND.DELIVERY_NOTE_ID) ");
        sql.push("GROUP BY DND.PICKING_DEMAND_HEADER_ID ");
        sql.push("ORDER BY DNH.DELIVERY_NOTE_ID DESC");
        trans.executeSql(sql.join(""), [], function (transReturn, results) {
            if (results.rows.length > 0) {
                for (var i = 0; i < results.rows.length; i++) {
                    var notaEntregaTemp = results.rows.item(i);
                    var notaEntrega = new NotaDeEntregaEncabezado();
                    notaEntrega.deliveryNoteId = notaEntregaTemp.DELIVERY_NOTE_ID;
                    notaEntrega.relatedPickingDemandHeaderId = notaEntregaTemp.PICKING_DEMAND_HEADER_ID;
                    notaEntrega.isCanceled = notaEntregaTemp.IS_CANCELED;
                    notaEntrega.reasonCancel = notaEntregaTemp.REASON_CANCEL;
                    notasDeEntregaAsociadasADemandaDeDespacho.push(notaEntrega);
                }
                callback(entregasPendientes, notasDeEntregaAsociadasADemandaDeDespacho);
            }
            else {
                callback(entregasPendientes, notasDeEntregaAsociadasADemandaDeDespacho);
            }
        }, function (transReturn, error) {
            errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
        });
    };
    ReporteDeEntregasServicio.prototype.obtenerEntregasCanceladas = function (callBack, errorCallBack) {
        try {
            var entregasCanceladas_1 = [];
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
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
                trans.executeSql(sql.join(""), [], function (transResult, results) {
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var entregaCanceladaTemp = results.rows.item(i);
                            var entregaCancelada = new DemandaDeDespachoEncabezado();
                            entregaCancelada.pickingDemandHeaderId = entregaCanceladaTemp.PICKING_DEMAND_HEADER_ID;
                            entregaCancelada.clientCode = entregaCanceladaTemp.CLIENT_CODE;
                            entregaCancelada.totalAmount = entregaCanceladaTemp.TOTAL_AMOUNT;
                            entregaCancelada.clientName = entregaCanceladaTemp.CLIENT_NAME;
                            entregaCancelada.processStatus = entregaCanceladaTemp.PROCESS_STATUS;
                            entregaCancelada.erpReferenceDocNum = entregaCanceladaTemp.ERP_REFERENCE_DOC_NUM;
                            entregaCancelada.docNum = entregaCanceladaTemp.DOC_NUM;
                            entregaCancelada.qtyCanceled = entregaCanceladaTemp.QTY_CANCELED;
                            entregaCancelada.reasonCancel = entregaCanceladaTemp.REASON_CANCEL;
                            entregasCanceladas_1.push(entregaCancelada);
                        }
                        callBack(entregasCanceladas_1);
                    }
                    else {
                        callBack(entregasCanceladas_1);
                    }
                }, function (transResult, error) {
                    errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
                });
            }, function (error) {
                errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
            });
        }
        catch (error) {
            errorCallBack({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
        }
    };
    ReporteDeEntregasServicio.prototype.obtenerRazonesDeAnulacionDeEntrega = function (callback, errorCallback) {
        try {
            var clasificacionesADevolver_1 = [];
            SONDA_DB_Session.readTransaction(function (trans) {
                var sql = [];
                sql.push("SELECT REASON_ID, REASON_DESCRIPTION FROM VOID_REASONS ");
                trans.executeSql(sql.join(""), [], function (transReturn, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var clasificacion = new Clasificacion();
                        var clasificacionTemp = results.rows.item(i);
                        clasificacion.reasonId = clasificacionTemp.REASON_ID;
                        clasificacion.reasonDescription = clasificacionTemp.REASON_DESCRIPTION;
                        clasificacionesADevolver_1.push(clasificacion);
                    }
                    clasificacionesADevolver_1
                        .push({ reasonId: "Sin Razón", reasonDescription: "Sin Razón" });
                    callback(clasificacionesADevolver_1);
                }, function (transReturn, error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las razones de no anulaci\u00F3n de entrega debido a: " + error.message });
                });
            }, function (error) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las razones de anulaci\u00F3n de entrega debido a: " + error.message });
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las razones de anulaci\u00F3n de entrega debido a: " + e.message });
        }
    };
    return ReporteDeEntregasServicio;
}());
//# sourceMappingURL=ReporteDeEntregasServicio.js.map