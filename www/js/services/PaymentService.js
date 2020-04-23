function GetPaymentHeaderInsert(paymentHeader) {
    var sql = "";
    sql += "	INSERT INTO PAYMENT_HEADER (";
    sql += "PAYMENT_NUM, ";
    sql += "CLIENT_ID, ";
    sql += "CLIENT_NAME,";
    sql += "TOTAL_AMOUNT, ";
    sql += "POSTED_DATETIME, ";
    sql += "POS_TERMINAL, ";
    sql += "GPS, ";
    sql += "DOC_DATE, ";
    sql += "DEPOSIT_TO_DATE, ";
    sql += "IS_POSTED, ";
    sql += "STATUS)";
    sql += " VALUES(";
    sql += "" + paymentHeader.PaymentNum + ",";
    sql += "'" + paymentHeader.ClientId + "',";
    sql += "'" + paymentHeader.ClientName + "',";
    sql += "" + paymentHeader.TotalAmount + ",";
    sql += "'" + paymentHeader.PostedDatetime + "',";
    sql += "'" + paymentHeader.PosTerminal + "',";
    sql += "'" + paymentHeader.Gps + "',";
    sql += "'" + paymentHeader.DocDate + "',";
    sql += "'" + paymentHeader.DepositToDate + "',";
    sql += paymentHeader.IsPosted + ",";
    sql += "'" + paymentHeader.Status + "'";
    sql += ");";
    return sql;
}


function GetPaymentDetailInsert(paymentRow) {
    var sql = " INSERT INTO PAYMENT_DETAIL(ID,PAYMENT_NUM,PAYMENT_TYPE, LINE_NUM,DOC_DATE,DOC_NUM,IMAGE,BANK_ID,ACCOUNT_NUM, INVOICE_NUM, INVOICE_SERIE, AMOUNT_PAID ) ";
    sql += " VALUES (";
    sql += "" + paymentRow.PaymentId + ",";
    sql += "" + paymentRow.PaymentNum + ",";
    sql += "'" + paymentRow.PaymentType + "',";
    sql += "" + paymentRow.LineNum + ",";
    sql += "'" + paymentRow.DocDate + "',";
    sql += "" + paymentRow.DocNum + ",";
    sql += "" + paymentRow.Image + ",";
    sql += "'" + paymentRow.BankId + "',";
    sql += "'" + paymentRow.AccountNum + "',";
    sql += "" + paymentRow.InvoiceNum + ",";
    sql += "'" + paymentRow.SatSerie + "',";
    sql += "" + paymentRow.AmountPaid + "";
    sql += ")";
    return sql;

}

function GetInvoicePaidUpdate(invoice) {
    var sql = "UPDATE INVOICE_HEADER SET ";
    sql += " PAID_TO_DATE=" + invoice.PaidToDate;
    sql += " WHERE ";
    sql += " INVOICE_NUM=" + invoice.InvoiceNum;
    sql += " AND SAT_SERIE='" + invoice.SatSerie + "'";
    return sql;
}

function SavePayments(customer, callback, errCallback) {
    SONDA_DB_Session.transaction(function (tx) {
        for (var i = 0; i < customer.Payments.length; i++) {
            var payment = customer.Payments[i];
            tx.executeSql(GetPaymentHeaderInsert(payment));
            for (var j = 0; j < payment.PaymentRows.length; j++) {
                var paymentRow = payment.PaymentRows[j];
                tx.executeSql(GetPaymentDetailInsert(paymentRow));
            }
        }
        for (var k = 0; k < customer.Invoices.length; k++) {
            var invoice = customer.Invoices[k];
            tx.executeSql(GetInvoicePaidUpdate(invoice));
        }


    }, function (err) {
        if (err.code !== 0)
            errCallback(err);
    }, function () { callback(customer) });

}

function RemovePaymentFromCustomerBalance(paymentId, customer, callback, errCallback) {
    try {
        for (var i = 0; i < customer.Payments.length; i++) {
            var paymentHeader = customer.Payments[i];
            if (paymentHeader.PaymentNum == paymentId) {
                customer.Balance = ToDecimal(ToDecimal(paymentHeader.TotalAmount) + ToDecimal(customer.Balance));
                customer.Payments.splice(i, 1);
                for (var j = 0; j < paymentHeader.PaymentRows.length; j++) {
                    var paymentRow = paymentHeader.PaymentRows[j];
                    for (var k = 0; k < customer.Invoices.length; k++) {
                        var invoice = customer.Invoices[k];
                        if (invoice.InvoiceNum === paymentRow.InvoiceNum) {
                            invoice.PaidToDate = ToDecimal(invoice.PaidToDate - paymentRow.AmountPaid);
                        }
                    }
                }
                break;
            }

        }
        callback(customer);
    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }
}

function ObtenerTipoYCantidadDelPago(paymentId, customer, callback, errCallback) {
    try {
        var pagoEncabezado = customer.Payments[customer.Payments.length - 1];
        var pagosAeliminar = $.grep(pagoEncabezado.PaymentRows, function (e) { return e.PaymentId === paymentId });
        callback({ PaymentType: pagosAeliminar[0].PaymentType, AmountPaid: pagosAeliminar[0].AmountPaid });
    } catch (e) {
        errCallback(e);
    }
}

function EliminarPagoDelBalanceDelCliente(paymentId, customer, callback, errCallback) {
    try {
        var pagoEncabezado = customer.Payments[customer.Payments.length - 1];
        var pagosAeliminar = $.grep(pagoEncabezado.PaymentRows, function (e) { return e.PaymentId === paymentId });
        
        customer.Consignments[0].CONSIGNMENT_DETAILS = $.grep(customer.Consignments[0].CONSIGNMENT_DETAILS, function (e) { return e.PAYMEN_ID !== (paymentId *-1)});

        for (var i = 0; i < pagosAeliminar.length; i++) {
            var pago = pagosAeliminar[i];
            pagoEncabezado.TotalAmount -= pago.AmountPaid;
            customer.Balance += pago.AmountPaid;
            var facturaAfectada = $.grep(customer.Invoices, function (e) { return (e.InvoiceNum === pago.InvoiceNum && e.SatSerie === pago.SatSerie) });
            facturaAfectada[0].PaidToDate = ToDecimal(facturaAfectada[0].PaidToDate - pago.AmountPaid);
        }
        
        pagoEncabezado.PaymentRows = $.grep(pagoEncabezado.PaymentRows, function (e) { return e.PaymentId !== paymentId });
        //cambio
        
        var comboInvoiceHeader = document.getElementById("cmbInvoicesForConsignment");
        $("#cmbInvoicesForConsignment").find('option').remove().end().append('<option value="" disabled selected>Seleccione una factura</option>').val('');
        $('#ulPaymentConsignment').children().remove('li');
        
        $("#lblConsignmentTotal").text(format_number(0, 2));
        
        $("#ulPaymentConsignment").listview('refresh');

        callback();
    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }
}

function AddPaymentToCustomerBalance(payment, customer, callback, errCallback) {
    try {
        if (customer.Balance < payment.TotalAmount)
            throw { message: "No se puede cancelar mas de " + customer.Balance };
        if (payment.TotalAmount === 0)
            throw { message: "El monto a cancelar deber ser mayor a 0" };
        if (customer.Balance === 0)
            throw { message: "No hay saldo por cancelar" };

        GetNexSequence("PaymentDetId", function (paymentDetId) {
            payment.PaymentId = paymentDetId;
            var paymentHeader = customer.Payments[(customer.Payments.length - 1)];
            paymentHeader.TotalAmount = ToDecimal(ToDecimal(paymentHeader.TotalAmount) + ToDecimal(payment.TotalAmount));
            customer.Balance = ToDecimal(customer.Balance - payment.TotalAmount);
            var lineNum = paymentHeader.PaymentRows.length + 1;
            var remainder = payment.TotalAmount;
            for (var i = 0; i < customer.Invoices.length; i++) {
                var invoice = customer.Invoices[i];
                var invoiceBalance = ToDecimal(invoice.TotalAmount - invoice.PaidToDate);
                if (invoiceBalance > 0) {

                    var paymentRow = {
                        PaymentNum: payment.PaymentNum,
                        LineNum: lineNum,
                        InvoiceNum: invoice.InvoiceNum,
                        SatSerie: invoice.SatSerie,
                        PaymentType: payment.PaymentType,
                        DocDate: payment.DocDate,
                        DocNum: payment.DocNum,
                        Image: payment.Image,
                        BankId: payment.BankId,
                        AccountNum: payment.AccountNum,
                        AmountPaid: 0,
                        PaymentId: payment.PaymentId
                    };
                    if (remainder <= invoiceBalance) {
                        paymentRow.AmountPaid = remainder;
                        invoice.PaidToDate = ToDecimal(invoice.PaidToDate + remainder);
                        remainder = 0;
                    } else {
                        remainder -= invoiceBalance;
                        paymentRow.AmountPaid = invoiceBalance;
                        invoice.PaidToDate = ToDecimal(invoice.PaidToDate + invoiceBalance);
                    }
                    paymentHeader.PaymentRows.push(paymentRow);
                }
                if (remainder === 0)
                    break;

            }
            callback(payment, customer);

        }, function (err) { errCallback(err); });

    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }

}
function AddPaymentToCustomerBalanceConsignment(payment, customer, callback, errCallback) {
    try {
        if (customer.Balance < payment.TotalAmount)
            throw { message: "No se puede cancelar mas de " + customer.Balance };
        if (payment.TotalAmount === 0)
            throw { message: "El monto a cancelar deber ser mayor a 0" };
        if (customer.Balance === 0)
            throw { message: "No hay saldo por cancelar" };

        GetNexSequence("PaymentDetId", function (paymentDetId) {
            payment.PaymentId = paymentDetId;
            var paymentHeader = customer.Payments[(customer.Payments.length - 1)];
            
            paymentHeader.TotalAmount = ToDecimal(ToDecimal(paymentHeader.TotalAmount) + ToDecimal(payment.TotalAmount));
            customer.Balance = ToDecimal(ToDecimal(customer.Balance) - ToDecimal(payment.TotalAmount));
            var lineNum = paymentHeader.PaymentRows.length + 1;
            var remainder = payment.TotalAmount;
            //for (var i = 0; i < customer.Invoices.length; i++) {
            var invoice = customer.Invoices[customer.Invoices.length - 1];
            var invoiceBalance = ToDecimal(invoice.TotalAmount - invoice.PaidToDate);
            //    if (invoiceBalance > 0) {

            var paymentRow = {
                PaymentNum: payment.PaymentNum,
                LineNum: lineNum,
                InvoiceNum: invoice.InvoiceNum,
                SatSerie: invoice.SatSerie,
                PaymentType: payment.PaymentType,
                DocDate: payment.DocDate,
                DocNum: payment.DocNum,
                Image: payment.Image,
                BankId: payment.BankId,
                AccountNum: payment.AccountNum,
                AmountPaid: 0,
                PaymentId: payment.PaymentId
            };
            if (remainder <= invoiceBalance) {
                paymentRow.AmountPaid = remainder;
                invoice.PaidToDate = ToDecimal(invoice.PaidToDate + remainder);
                remainder = 0;
            } else {
                remainder -= invoiceBalance;
                paymentRow.AmountPaid = invoiceBalance;
                invoice.PaidToDate = ToDecimal(invoice.PaidToDate + invoiceBalance);
            }
            paymentHeader.PaymentRows.push(paymentRow);
            callback(payment, customer);

        }, function (err) { errCallback(err); });

    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }

}

function GetConsigmentHeaderInsert(Consignments) {
    var sql = "";
    sql += "	INSERT INTO CONSIGNMENT_HEADER (";
    sql += " CONSIGNMENT_ID";
    sql += " ,CUSTOMER_ID";
    sql += " ,DATE_CREATE";
    sql += " ,DATE_UPDATE";
    sql += " ,STATUS";
    sql += " ,POSTED_BY";
    sql += " ,IS_POSTED";
    sql += " ,POS_TERMINAL";
    sql += " ,GPS_URL";
    sql += " ,DOC_DATE";
    sql += " ,CLOSED_ROUTE_DATETIME";
    sql += " ,IS_ACTIVE_ROUTE";
    sql += " ,DUE_DATE";
    sql += ") VALUES(";
    sql += "" + Consignments.CONSIGNMENT_ID;
    sql += " ,'" + Consignments.CUSTOMER_ID + "'";
    sql += " ,'" + Consignments.DATE_CREATE + "'";
    sql += " ,'" + Consignments.DATE_UPDATE + "'";
    sql += " ,'" + Consignments.STATUS + "'";
    sql += " ,'" + Consignments.POSTED_BY + "'";
    sql += " ," + Consignments.IS_POSTED;
    sql += " ,'" + Consignments.POS_TERMINAL + "'";
    sql += " ,'" + Consignments.GPS_URL + "'";
    sql += " ,'" + Consignments.DOC_DATE + "'";
    sql += " ,'" + Consignments.CLOSED_ROUTE_DATETIME + "'";
    sql += " ,'" + Consignments.IS_ACTIVE_ROUTE + "'";
    sql += " ,'" + Consignments.DUE_DATE + "'";
    sql += ");";
    return sql;
}

function GetConsigmentDetailInsert(ConsignmentsDetails) {
    var sql = "";
    sql += " INSERT INTO CONSIGNMENT_DETAIL ( ";
    sql += " CONSIGNMENT_ID";
    sql += " ,SKU";
    sql += " ,LINE_NUM";
    sql += " ,QTY";
    sql += " ,PRICE";
    sql += " ,DISCOUNT";
    sql += " ,TOTAL_LINE";
    sql += " ,POSTED_DATETIME";
    sql += " ,PAYMENT_ID";
    sql += ") VALUES (";
    sql += "" + ConsignmentsDetails.CONSIGNMENT_ID + "";
    sql += " ,'" + ConsignmentsDetails.SKU + "'";
    sql += " ," + ConsignmentsDetails.LINE_NUM + "";
    sql += " ," + ConsignmentsDetails.QTY + "";
    sql += " ," + ConsignmentsDetails.PRICE + "";
    sql += " ," + ConsignmentsDetails.DISCOUNT + "";
    sql += " ," + ConsignmentsDetails.TOTAL_LINE + "";
    sql += " ,'" + ConsignmentsDetails.POSTED_DATETIME + "'";
    sql += " ,'" + ConsignmentsDetails.PAYMEN_ID + "'";
    sql += ")";
    return sql;
}

function GuardarConsignacion(consignment, callback, errCallback) {
    try {
        if (consignment[0].CONSIGNMENT_DETAILS.length > 0) {
            SONDA_DB_Session.transaction(function(tx) {
                tx.executeSql(GetConsigmentHeaderInsert(consignment[0]));

                for (var k = 0; k < consignment[0].CONSIGNMENT_DETAILS.length; k++) {
                    var detalle = consignment[0].CONSIGNMENT_DETAILS[k];
                    tx.executeSql(GetConsigmentDetailInsert(detalle));
                }
            }, function(err) {
                if (err.code !== 0)
                    errCallback({ code: -1, message: err.message });
            }, function() {
                callback();
            });
        } else {
            callback();
        }
    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }
}

function ToDecimal(val) {
    return parseFloat(parseFloat(val).toFixed(2));
}