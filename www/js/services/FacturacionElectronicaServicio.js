var FacturacionElectronicaServicio = (function () {
    function FacturacionElectronicaServicio() {
    }
    FacturacionElectronicaServicio.prototype.agregarFraseEscenario = function (data) {
        try {
            ToastThis("F:" + data.PHRASE_CODE + ", E:" + data.SCENARIO_CODE + "; " + data.DESCRIPTION);
            var sql_1 = [];
            sql_1.push("INSERT INTO PHRASE_AND_SCENARIO(");
            sql_1.push("[ID], [FEL_DOCUMENT_TYPE], [PHRASE_CODE],");
            sql_1.push("[SCENARIO_CODE], [DESCRIPTION], [TEXT_TO_SHOW]");
            sql_1.push(") VALUES (");
            sql_1.push(data.ID + ",");
            sql_1.push("'" + data.FEL_DOCUMENT_TYPE + "',");
            sql_1.push(data.PHRASE_CODE + ",");
            sql_1.push(data.SCENARIO_CODE + ",");
            sql_1.push("'" + data.DESCRIPTION + "',");
            sql_1.push("'" + data.TEXT_TO_SHOW + "'");
            sql_1.push(")");
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(sql_1.join(" "));
            }, function (error) {
                console.log(error.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("Error insertando frases y escenarios");
            });
        }
        catch (error) {
            console.log(error.message);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al ejecutar inserción frases y escenarios");
        }
    };
    FacturacionElectronicaServicio.prototype.obtenerFrasesYEscenariosPorTipoDeDocumentoFel = function (felDocumentType, callBack, errorCallBack) {
        var sql = [];
        sql.push("SELECT [ID], [PHRASE_CODE],");
        sql.push("[SCENARIO_CODE], [DESCRIPTION], [TEXT_TO_SHOW]");
        sql.push("FROM PHRASE_AND_SCENARIO");
        sql.push("WHERE [FEL_DOCUMENT_TYPE] = '" + felDocumentType + "'");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(" "), [], function (_txResult, results) {
                var frasesEscenarios = [];
                if (results.rows.length > 0) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var fraseEscenario = new FraseEscenario();
                        var FETemp = results.rows.item(i);
                        fraseEscenario.FelDocumentType = FETemp.FEL_DOCUMENT_TYPE;
                        fraseEscenario.PhraseCode = FETemp.PHRASE_CODE;
                        fraseEscenario.ScenarioCode = FETemp.SCENARIO_CODE;
                        fraseEscenario.Description = FETemp.DESCRIPTION;
                        fraseEscenario.TextToShow = FETemp.TEXT_TO_SHOW;
                        frasesEscenarios.push(fraseEscenario);
                    }
                    callBack(frasesEscenarios);
                }
                else {
                    callBack([]);
                }
            }, function (_tx, error) {
                errorCallBack({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        });
    };
    FacturacionElectronicaServicio.prototype.obtenerDocumentoDeContingenciaPorNumeroDeFactura = function (invoiceNum, callBack, errorCallBack) {
        var sql = [];
        sql.push("SELECT");
        sql.push("[INVOICE_NUM], [TERMS], [POSTED_DATETIME], [CLIENT_ID],");
        sql.push("[CLIENT_NAME], [POS_TERMINAL], [GPS], [TOTAL_AMOUNT],");
        sql.push("[ERP_INVOICE_ID], [IS_POSTED], [STATUS], [IS_CREDIT_NOTE],");
        sql.push("[VOID_REASON], [VOID_NOTES], [VOID_INVOICE_ID],");
        sql.push("[PRINT_REQUEST], [PRINTED_COUNT], [AUTH_ID], [SAT_SERIE],");
        sql.push("[CHANGE], [IMG1], [IMG2], [IMG3], [CONSIGNMENT_ID],");
        sql.push("[IS_PAID_CONSIGNMENT], [INITIAL_TASK_IMAGE], [IN_ROUTE_PLAN],");
        sql.push("[ID_BO], [IS_POSTED_VALIDATED], [DETAIL_QTY],");
        sql.push("[HANDLE_TAX], [TAX_PERCENT], [TELEPHONE_NUMBER],");
        sql.push("[IS_FROM_DELIVERY_NOTE], [DISCOUNT], [COMMENT], [DUE_DATE],");
        sql.push("[CREDIT_AMOUNT], [CASH_AMOUNT], [PAID_TO_DATE], [TASK_ID],");
        sql.push("[GOAL_HEADER_ID], [SHIPMENT], [CONTINGENCY_DOC_SERIE],");
        sql.push("[CONTINGENCY_DOC_NUM]");
        sql.push("FROM");
        sql.push("[INVOICE_HEADER]");
        sql.push("WHERE");
        sql.push("[INVOICE_NUM]");
        sql.push("=");
        sql.push("" + invoiceNum);
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(" "), [], function (tx, results) {
                var factura = new FacturaEncabezado();
                if (results.rows.length > 0) {
                    var facturaTemp = results.rows.item(0);
                    factura.invoiceNum = facturaTemp.INVOICE_NUM;
                    factura.terms = facturaTemp.TERMS;
                    factura.postedDateTime = facturaTemp.POSTED_DATETIME;
                    factura.clientId = facturaTemp.CLIENT_ID;
                    factura.clientName = facturaTemp.CLIENT_NAME;
                    factura.posTerminal = facturaTemp.POS_TERMINAL;
                    factura.gps = facturaTemp.GPS;
                    factura.totalAmount = facturaTemp.TOTAL_AMOUNT;
                    factura.erpInvoiceId = facturaTemp.ERP_INVOICE_ID;
                    factura.isPosted = facturaTemp.IS_POSTED;
                    factura.status = facturaTemp.STATUS;
                    factura.isCreditNote = facturaTemp.IS_CREDIT_NOTE;
                    factura.voidReason = facturaTemp.VOID_REASON;
                    factura.voidNotes = facturaTemp.VOID_NOTES;
                    factura.voidInvoiceId = facturaTemp.VOID_INVOICE_ID;
                    factura.printRequests = facturaTemp.PRINT_REQUEST;
                    factura.printedCount = facturaTemp.PRINTED_COUNT;
                    factura.authId = facturaTemp.AUTH_ID;
                    factura.satSerie = facturaTemp.SAT_SERIE;
                    factura.change = facturaTemp.CHANGE;
                    factura.img1 = facturaTemp.IMG1;
                    factura.img2 = facturaTemp.IMG2;
                    factura.img3 = facturaTemp.IMG3;
                    factura.consignmentId = facturaTemp.CONSIGNMENT_ID;
                    factura.isPaidConsignment = facturaTemp.IS_PAID_CONSIGNMENT;
                    factura.initialTaskImage = facturaTemp.INITIAL_TASK_IMAGE;
                    factura.inPlanRoute = facturaTemp.IN_ROUTE_PLAN;
                    factura.idBo = facturaTemp.ID_BO;
                    factura.isPostedValidated = facturaTemp.IS_POSTED_VALIDATED;
                    factura.detailQty = facturaTemp.DETAIL_QTY;
                    factura.handleTax = facturaTemp.HANDLE_TAX;
                    factura.taxPercent = facturaTemp.TAX_PERCENT;
                    factura.telephoneNumber = facturaTemp.TELEPHONE_NUMBER;
                    factura.isFromDeliveryNote = facturaTemp.IS_FROM_DELIVERY_NOTE;
                    factura.discount = facturaTemp.DISCOUNT;
                    factura.comment = facturaTemp.COMMENT;
                    factura.dueDate = facturaTemp.DUE_DATE;
                    factura.creditAmount = facturaTemp.CREDIT_AMOUNT;
                    factura.cashAmount = facturaTemp.CASH_AMOUNT;
                    factura.paidToDate = facturaTemp.PAID_TO_DATE;
                    factura.taskId = facturaTemp.TASK_ID;
                    factura.goalHeaderId = facturaTemp.GOAL_HEADER_ID;
                    factura.felData = new DatosFelParaFactura();
                    factura.felData.Shipment = facturaTemp.SHIPMENT;
                    factura.felData.ContingencyDocSerie =
                        facturaTemp.CONTINGENCY_DOC_SERIE;
                    factura.felData.ContingencyDocNum = facturaTemp.CONTINGENCY_DOC_NUM;
                    callBack(factura);
                }
                else {
                    errorCallBack({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "No se encontró el documento de contingencia requerido"
                    });
                }
            }, function (tx, error) {
                errorCallBack({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        });
    };
    FacturacionElectronicaServicio.prototype.actualizarDocumentoDeContingencia = function (invoiceNum, felData, errorCallBack, callBack) {
        var sql = [];
        sql.push("UPDATE [INVOICE_HEADER] SET");
        sql.push("[ELECTRONIC_SIGNATURE] = '" + felData.ElectronicSignature + "',");
        sql.push("[DOCUMENT_NUMBER] = " + felData.DocumentNumber + ",");
        sql.push("[DOCUMENT_SERIES] = '" + felData.DocumentSeries + "',");
        sql.push("[DOCUMENT_URL] = '" + felData.DocumentUrl + "',");
        sql.push("[SHIPMENT] = " + felData.Shipment + ",");
        sql.push("[VALIDATION_RESULT] = " + (felData.ValidationResult ? 1 : 0) + ",");
        sql.push("[SHIPMENT_DATETIME] = '" + felData.ShipmentDatetime + "',");
        sql.push("[SHIPMENT_RESPONSE] = '" + felData.ShipmentResponse + "'");
        sql.push("WHERE");
        sql.push("[INVOICE_NUM]");
        sql.push("=");
        sql.push("" + invoiceNum);
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(" "));
            if (callBack) {
                callBack();
            }
        }, function (error) {
            errorCallBack({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        });
    };
    return FacturacionElectronicaServicio;
}());
//# sourceMappingURL=FacturacionElectronicaServicio.js.map