var CuentaCorrienteServicio = (function () {
    function CuentaCorrienteServicio() {
    }
    CuentaCorrienteServicio.prototype.agregarFacturaVencidaDeCliente = function (data) {
        SONDA_DB_Session.transaction(function (trans) {
            var facturaVencida = new FacturaVencidaDeCliente();
            facturaVencida.id = data.ID;
            facturaVencida.invoiceId = data.INVOICE_ID;
            facturaVencida.docEntry = data.DOC_ENTRY;
            facturaVencida.codeCustomer = data.CODE_CUSTOMER;
            facturaVencida.createdDate = data.CREATED_DATE;
            facturaVencida.dueDate = data.DUE_DATE;
            facturaVencida.totalAmount = data.TOTAL_AMOUNT;
            facturaVencida.pendingToPaid = data.PENDING_TO_PAID;
            facturaVencida.isExpired = data.IS_EXPIRED;
            var sql = [];
            sql.push("INSERT INTO OVERDUE_INVOICE_BY_CUSTOMER(");
            sql.push("ID,INVOICE_ID,DOC_ENTRY,CODE_CUSTOMER,CREATED_DATE,DUE_DATE,TOTAL_AMOUNT,PENDING_TO_PAID,IS_EXPIRED)");
            sql.push("VALUES(");
            sql.push("" + facturaVencida.id);
            sql.push("," + facturaVencida.invoiceId);
            sql.push("," + facturaVencida.docEntry);
            sql.push(",'" + facturaVencida.codeCustomer + "'");
            sql.push(",'" + facturaVencida.createdDate + "'");
            sql.push(",'" + facturaVencida.dueDate + "'");
            sql.push("," + facturaVencida.totalAmount);
            sql.push("," + facturaVencida.pendingToPaid);
            sql.push("," + facturaVencida.isExpired);
            sql.push(")");
            trans.executeSql(sql.join(""));
            sql = null;
        }, function (error) {
            notify("No se ha podido agregar la factura vencida debido a: " + error.message);
        });
    };
    CuentaCorrienteServicio.prototype.agregarCuentaCorrienteDeCliente = function (data) {
        SONDA_DB_Session.transaction(function (trans) {
            var cuentaCorriente = new CuentaCorrienteDeCliente();
            cuentaCorriente.id = data.ID;
            cuentaCorriente.codeCustomer = data.CODE_CUSTOMER;
            cuentaCorriente.groupNum = data.GROUP_NUM;
            cuentaCorriente.creditLimit = data.CREDIT_LIMIT;
            cuentaCorriente.outstandingBalance = data.OUTSTANDING_BALANCE;
            cuentaCorriente.extraDays = data.EXTRA_DAYS;
            var sql = [];
            sql.push("INSERT INTO CUSTOMER_ACCOUNTING_INFORMATION(");
            sql.push("ID,CODE_CUSTOMER,GROUP_NUM,CREDIT_LIMIT,OUTSTANDING_BALANCE,EXTRA_DAYS)");
            sql.push("VALUES(");
            sql.push("" + cuentaCorriente.id);
            sql.push(",'" + cuentaCorriente.codeCustomer + "'");
            sql.push("," + cuentaCorriente.groupNum);
            sql.push("," + cuentaCorriente.creditLimit);
            sql.push("," + cuentaCorriente.outstandingBalance);
            sql.push("," + cuentaCorriente.extraDays);
            sql.push(")");
            trans.executeSql(sql.join(""));
            sql = null;
        }, function (error) {
            notify("No se ha podido agregar la cuenta corriente debido a: " + error.message);
        });
    };
    CuentaCorrienteServicio.prototype.obtenerFacturasVencidasDeCliente = function (cliente, callback, errorCallback) {
        try {
            SONDA_DB_Session.readTransaction(function (trans) {
                var sql = [];
                sql.push("SELECT ID,INVOICE_ID,DOC_ENTRY,CODE_CUSTOMER,(SELECT datetime(CREATED_DATE)) as CREATED_DATE,(SELECT datetime(DUE_DATE)) as DUE_DATE,TOTAL_AMOUNT,PENDING_TO_PAID ");
                sql.push("FROM OVERDUE_INVOICE_BY_CUSTOMER ");
                if (cliente.paymentType === TipoDePagoDeFactura.FacturaVencida) {
                    sql.push("WHERE CODE_CUSTOMER = '" + cliente.clientId + "' AND PENDING_TO_PAID > 0 AND IS_EXPIRED = 1 ORDER BY DUE_DATE ASC");
                }
                else {
                    sql.push("WHERE CODE_CUSTOMER = '" + cliente.clientId + "' AND PENDING_TO_PAID > 0 ORDER BY DUE_DATE ASC");
                }
                trans.executeSql(sql.join(""), [], function (transReturn, results) {
                    var facturasDeCliente = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        var factura = results.rows.item(i);
                        var facturaVencida = new FacturaVencidaDeCliente();
                        facturaVencida.id = factura.ID;
                        facturaVencida.invoiceId = factura.INVOICE_ID;
                        facturaVencida.docEntry = factura.DOC_ENTRY;
                        facturaVencida.codeCustomer = factura.CODE_CUSTOMER;
                        facturaVencida.createdDate = factura.CREATED_DATE;
                        facturaVencida.dueDate = factura.DUE_DATE;
                        facturaVencida.totalAmount = factura.TOTAL_AMOUNT;
                        facturaVencida.pendingToPaid = factura.PENDING_TO_PAID;
                        facturasDeCliente.push(facturaVencida);
                    }
                    callback(facturasDeCliente);
                }, function (transReturn, errorTrans) {
                    errorCallback({
                        codigo: errorTrans.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: errorTrans.message
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    CuentaCorrienteServicio.prototype.obtenerCuentaCorrienteDeCliente = function (cliente, callback, errorCallback) {
        try {
            SONDA_DB_Session.readTransaction(function (trans) {
                var sql = [];
                sql.push("SELECT ID,CODE_CUSTOMER,GROUP_NUM,CREDIT_LIMIT,OUTSTANDING_BALANCE,EXTRA_DAYS ");
                sql.push("FROM CUSTOMER_ACCOUNTING_INFORMATION ");
                sql.push("WHERE CODE_CUSTOMER = '" + cliente.clientId + "'");
                trans.executeSql(sql.join(""), [], function (transReturn, results) {
                    var cuentaCorriente = new CuentaCorrienteDeCliente();
                    if (results.rows.length > 0) {
                        var cuenta = results.rows.item(0);
                        cuentaCorriente.id = cuenta.ID;
                        cuentaCorriente.codeCustomer = cuenta.CODE_CUSTOMER;
                        cuentaCorriente.groupNum = cuenta.GROUP_NUM;
                        cuentaCorriente.creditLimit = cuenta.CREDIT_LIMIT;
                        cuentaCorriente.outstandingBalance = cuenta.OUTSTANDING_BALANCE;
                        cuentaCorriente.extraDays = cuenta.EXTRA_DAYS;
                    }
                    callback(cuentaCorriente);
                }, function (transReturn, errorTrans) {
                    errorCallback({
                        codigo: errorTrans.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: errorTrans.message
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    CuentaCorrienteServicio.prototype.obtenerSumatoriaTotalDeFacturasEnRutaDeCliente = function (cliente, callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql.push("SELECT IFNULL(SUM(TOTAL_AMOUNT),0) AS TOTAL_FACTURADO");
                sql.push(" FROM INVOICE_HEADER WHERE VOID_INVOICE_ID IS NULL");
                sql.push(" AND CLIENT_ID = '" + cliente.clientId + "'");
                sql.push(" AND IFNULL(CREDIT_AMOUNT,0) > 0");
                trans.executeSql(sql.join(""), [], function (transReturn, results) {
                    cliente.currentAccountingInformation.currentAmountOnCredit = results.rows.item(0).TOTAL_FACTURADO;
                    cliente.currentAccountingInformation.outstandingBalance -=
                        cliente.currentAccountingInformation.currentAmountOnCredit;
                    callback(cliente);
                }, function (transReturn, error) {
                    errorCallback({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: error.message
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: e.message
            });
        }
    };
    CuentaCorrienteServicio.prototype.procesarInformacionDeCuentaCorrienteDeCliente = function (codigoDeCliente, callbak, errorCallback) {
        var _this_1 = this;
        try {
            var cliente_1 = new Cliente();
            cliente_1.clientId = codigoDeCliente;
            this.obtenerCuentaCorrienteDeCliente(cliente_1, function (cuentaCorrienteDeCliente) {
                cliente_1.currentAccountingInformation = cuentaCorrienteDeCliente;
                _this_1.obtenerSumatoriaTotalDeFacturasEnRutaDeCliente(cliente_1, function (clienteConMontoDeFacturasDelDiaActual) {
                    clienteConMontoDeFacturasDelDiaActual.canBuyOnCredit = _this_1.verificarSiElClienteTieneLimiteDeCreditoYDiasDeCreditoConfigurados(clienteConMontoDeFacturasDelDiaActual);
                    if (clienteConMontoDeFacturasDelDiaActual.canBuyOnCredit) {
                        _this_1.obtenerFechaDeVencimientoDeFacturaEnBaseADiasDeCreditoDelCliente(clienteConMontoDeFacturasDelDiaActual, function (clienteCompleto) {
                            callbak(clienteCompleto);
                        }, function (error) {
                            errorCallback({
                                codigo: error.codigo,
                                resultado: error.resultado,
                                mensaje: error.mensaje
                            });
                        });
                    }
                    else {
                        callbak(clienteConMontoDeFacturasDelDiaActual);
                    }
                }, function (error) {
                    errorCallback({
                        codigo: error.codigo,
                        resultado: error.resultado,
                        mensaje: "Error al intentar obtener las facturas del d�a para el cliente."
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: error.codigo,
                    resultado: error.resultado,
                    mensaje: "Error al intentar obtener la cuenta corriente del cliente."
                });
            });
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al intentar procesar la informaci�n de cuenta corriente del cliente."
            });
        }
    };
    CuentaCorrienteServicio.prototype.verificarSiElClienteTieneLimiteDeCreditoYDiasDeCreditoConfigurados = function (cliente) {
        return (cliente.currentAccountingInformation.extraDays > 0 &&
            cliente.currentAccountingInformation.creditLimit > 0);
    };
    CuentaCorrienteServicio.prototype.verificarSiElLimiteDeCreditoDelClienteNoHaSidoSobrepasadoPorElMontoFacturadoEnElDia = function (cliente) {
        return cliente.currentAccountingInformation.outstandingBalance > 0;
    };
    CuentaCorrienteServicio.prototype.obtenerFechaDeVencimientoDeFacturaEnBaseADiasDeCreditoDelCliente = function (cliente, callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = "SELECT DateTime('Now', 'LocalTime', '+" + cliente.currentAccountingInformation.extraDays + " Day') AS INVOICE_DUE_DATE";
                trans.executeSql(sql, [], function (transResult, results) {
                    cliente.invoiceDueDate = results.rows.item(0).INVOICE_DUE_DATE;
                    callback(cliente);
                }, function (transResult, error) {
                    errorCallback({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Error al intentar calcular la fecha de vencimiento de la factura."
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al intentar obtener la fecha de vencimiento de la factura."
                });
            });
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al intentar obtener la fecha de vencimiento de la factura."
            });
        }
    };
    CuentaCorrienteServicio.prototype.obtenerSumatoriaDePagosRealizadosPorClienteDuranteElDia = function (cliente, callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql.push("SELECT IFNULL(SUM(IFNULL(PAYMENT_AMOUNT,0)), 0) AS TOTAL_AMOUNT_PAYED");
                sql.push("  FROM OVERDUE_INVOICE_PAYMENT_HEADER");
                sql.push(" WHERE CODE_CUSTOMER = '" + cliente.clientId + "' AND PAYMENT_APPLIED_TO = '" + cliente.paymentType + "'");
                trans.executeSql(sql.join(""), [], function (transResult, results) {
                    cliente.totalAmountPayedOfOverdueInvoices = parseFloat(results.rows.item(0).TOTAL_AMOUNT_PAYED);
                    callback(cliente);
                }, function (transResult, error) {
                    errorCallback({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: error.message
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: e.message
            });
        }
    };
    CuentaCorrienteServicio.prototype.obtenerSumatoriaTotalDeFacturasAbiertas = function (cliente, callback, errorCallback) {
        try {
            var sumaDeFacturasAbiertas = 0;
            cliente.overdueInvoices.forEach(function (factura, idx, invoices) {
                sumaDeFacturasAbiertas += factura.pendingToPaid;
            });
            callback(sumaDeFacturasAbiertas);
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    return CuentaCorrienteServicio;
}());
//# sourceMappingURL=CuentaCorrienteServicio.js.map