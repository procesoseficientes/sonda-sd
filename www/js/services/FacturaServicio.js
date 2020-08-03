var FacturaServicio = (function () {
    function FacturaServicio() {
    }
    FacturaServicio.prototype.ObtenerDetallesDeFacturaPorNumeroDeTarea = function (invoiceNum, callBack, errorCallBack) {
        var sql = [];
        sql.push("SELECT");
        sql.push("INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT,");
        sql.push("TOTAL_LINE, SERIE, SERIE_2, REQUERIES_SERIE,");
        sql.push("LINE_SEQ, IS_ACTIVE, COMBO_REFERENCE,");
        sql.push("PARENT_SEQ, EXPOSURE, PHONE, TAX_CODE, ON_HAND,");
        sql.push("IS_BONUS, PACK_UNIT, CODE_PACK_UNIT_STOCK,");
        sql.push("CONVERSION_FACTOR");
        sql.push("FROM INVOICE_DETAIL");
        sql.push("WHERE INVOICE_NUM = " + invoiceNum);
        SONDA_DB_Session.transaction(function (transaction) {
            transaction.executeSql(sql.join(" "), [], function (_transaccionRetorno, resultados) {
                var resultsSize = resultados.rows.length;
                if (resultsSize > 0) {
                    var facturaDetallesTemporal = resultados.rows;
                    var facturaDetalles = new Array();
                    for (var i = 0; i < resultsSize; i++) {
                        var detalle = {
                            InvoiceNum: facturaDetallesTemporal[i].INVOICE_NUM,
                            Sku: facturaDetallesTemporal[i].SKU,
                            SkuName: facturaDetallesTemporal[i].SKU_NAME,
                            Qty: facturaDetallesTemporal[i].QTY,
                            Price: facturaDetallesTemporal[i].PRICE,
                            Discount: facturaDetallesTemporal[i].DISCOUNT,
                            TotalLine: facturaDetallesTemporal[i].TOTAL_LINE,
                            Serie: facturaDetallesTemporal[i].SERIE,
                            Serie2: facturaDetallesTemporal[i].SERIE_2,
                            RequeriesSerie: facturaDetallesTemporal[i].REQUERIES_SERIE,
                            LineSeq: facturaDetallesTemporal[i].LINE_SEQ,
                            IsActive: facturaDetallesTemporal[i].IS_ACTIVE,
                            ComboReference: facturaDetallesTemporal[i].COMBO_REFERENCE,
                            ParentSeq: facturaDetallesTemporal[i].PARENT_SEQ,
                            Exposure: facturaDetallesTemporal[i].EXPOSURE,
                            Phone: facturaDetallesTemporal[i].PHONE
                        };
                        facturaDetalles.push(detalle);
                    }
                    callBack(facturaDetalles);
                }
                else {
                    errorCallBack({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "No hay detalles para la factura"
                    });
                }
            });
        }, function (error) {
            errorCallBack({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        });
    };
    FacturaServicio.prototype.InsertarFactura = function (invoice, felData, errorCallBack, callback) {
        var sql = [];
        sql.push("INSERT INTO INVOICE_HEADER (");
        sql.push("[INVOICE_NUM], [TERMS], [POSTED_DATETIME], [CLIENT_ID],");
        sql.push("[CLIENT_NAME], [POS_TERMINAL], [GPS], [TOTAL_AMOUNT],");
        sql.push("[ERP_INVOICE_ID], [IS_POSTED], [STATUS], [IS_CREDIT_NOTE],");
        sql.push("[VOID_REASON], [VOID_NOTES], [VOID_INVOICE_ID],");
        sql.push("[PRINT_REQUEST], [PRINTED_COUNT], [AUTH_ID], [SAT_SERIE],");
        sql.push("[CHANGE], [IMG1], [IMG2], [IMG3], [CONSIGNMENT_ID],");
        sql.push("[IS_PAID_CONSIGNMENT], [INITIAL_TASK_IMAGE], [ID_BO],");
        sql.push("[IN_ROUTE_PLAN], [IS_POSTED_VALIDATED], [DETAIL_QTY],");
        sql.push("[HANDLE_TAX], [TAX_PERCENT], [TELEPHONE_NUMBER],");
        sql.push("[IS_FROM_DELIVERY_NOTE], [DISCOUNT], [COMMENT], [DUE_DATE],");
        sql.push("[CREDIT_AMOUNT], [CASH_AMOUNT], [PAID_TO_DATE], [TASK_ID],");
        sql.push("[GOAL_HEADER_ID], [ELECTRONIC_SIGNATURE], [DOCUMENT_SERIES],");
        sql.push("[DOCUMENT_NUMBER], [DOCUMENT_URL], [SHIPMENT],");
        sql.push("[VALIDATION_RESULT], [SHIPMENT_DATETIME], [SHIPMENT_RESPONSE],");
        sql.push("[IS_CONTINGENCY_DOCUMENT], [CONTINGENCY_DOC_SERIE],");
        sql.push("[CONTINGENCY_DOC_NUM], [FEL_DOCUMENT_TYPE],");
        sql.push("[FEL_STABLISHMENT_CODE]");
        sql.push(") VALUES (");
        sql.push(invoice.invoiceNum + ", '" + invoice.terms + "', '" + invoice.postedDateTime + "', '" + invoice.clientId + "',");
        sql.push("'" + invoice.clientName + "', '" + invoice.posTerminal + "', '" + invoice.gps + "', " + invoice.totalAmount + ",");
        sql.push("'" + invoice.erpInvoiceId + "', " + invoice.isPosted + ", " + invoice.status + ", " + invoice.isCreditNote + ",");
        sql.push("'" + invoice.voidReason + "', '" + invoice.voidNotes + "', " + (invoice.voidInvoiceId === 0 ? null : invoice.voidInvoiceId) + ",");
        sql.push(invoice.printRequests + ", " + invoice.printedCount + ", '" + invoice.authId + "', '" + invoice.satSerie + "',");
        sql.push(invoice.change + ", '" + invoice.img1 + "', '" + invoice.img2 + "', '" + invoice.img3 + "', NULL,");
        sql.push(invoice.isPaidConsignment + ", '" + invoice.initialTaskImage + "', " + invoice.idBo + ",");
        sql.push(invoice.inPlanRoute + ", " + invoice.isPostedValidated + ", " + invoice.detailQty + ",");
        sql.push(invoice.handleTax + ", " + invoice.taxPercent + ", '" + invoice.telephoneNumber + "',");
        sql.push("'" + invoice.isFromDeliveryNote + "', " + invoice.discount + ", '" + invoice.comment + "',");
        sql.push("'" + invoice.dueDate + "', " + invoice.creditAmount + ", " + invoice.cashAmount + ", " + invoice.paidToDate + ",");
        sql.push(invoice.taskId + ", " + (!invoice.goalHeaderId || invoice.goalHeaderId === 0
            ? "NULL"
            : invoice.goalHeaderId) + ", " + (felData.ElectronicSignature
            ? "'" + felData.ElectronicSignature + "'"
            : "NULL") + ",");
        sql.push((felData.DocumentSeries ? "'" + felData.DocumentSeries + "'" : "NULL") + ", " + felData.DocumentNumber + ", " + (felData.DocumentUrl ? "'" + felData.DocumentUrl + "'" : "NULL") + ",");
        sql.push(felData.Shipment + ", " + (felData.ValidationResult ? 1 : 0) + ", " + (!felData.ShipmentDatetime ? "NULL" : "'" + felData.ShipmentDatetime + "'") + ",");
        sql.push("'" + felData.ShipmentResponse + "', " + (felData.IsContingencyDocument ? 1 : 0) + ",");
        sql.push((felData.ContingencyDocSerie
            ? "'" + felData.ContingencyDocSerie + "'"
            : "NULL") + ", " + felData.ContingencyDocNum + ",");
        sql.push("'" + felData.FelDocumentType + "', " + felData.FelStablishmentCode);
        sql.push(")");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(" "));
            gInvoiceHeader = null;
            callback();
        }, function (error) {
            errorCallBack({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        });
    };
    return FacturaServicio;
}());
//# sourceMappingURL=FacturaServicio.js.map