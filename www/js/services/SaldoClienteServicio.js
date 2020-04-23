function DelegarSaldoClienteServicio() {
    //socket.on('GetCurrentAccountByCustomer_Request', function (data) {
    //    switch (data.option) {
    //        case OpcionRespuesta.Exito:
    //            my_dialog("", "", "close");
    //            console.log("Validando Saldo desde: " + data.source);

    //            switch (data.source) {
    //                case OpcionValidarSaldoCliente.PonerCantidad:
    //                    AddSKU(data.data.sku, "", data.data.sku, gTaskType, parseInt(data.data.cantidad));
    //                    /*$.mobile.changePage("#pos_skus_page", {
    //                        transition: "none",
    //                        reverse: true,
    //                        changeHash: true,
    //                        showLoadMsg: false
    //                    });*/
    //                    window.history.back();
    //                    break;

    //                case OpcionValidarSaldoCliente.AgregarSku:
    //                    AddSKU(data.data.sku, "", data.data.sku, gTaskType, parseInt(data.data.cantidad));
    //                    break;

    //                case OpcionValidarSaldoCliente.FinalizarDocumento:
    //                    var porcentajeDescuento = $("#UiPorcentajeDeDescuento");
    //                    var descuento = ToDecimal(porcentajeDescuento.val() === "" ? 0 : porcentajeDescuento.val());
    //                    if (gTaskType === TareaTipo.Venta) {
    //                        _salesControllerCustomer.AppliedDiscount = ToDecimal(descuento);
    //                        UserWantsSaveInvoice();
    //                    } else {
    //                        if ($("#FechaEntrega").val() === "" || !ValidarFechaDeEntrega(ObtenerFecha(), $("#FechaEntrega").val())) {
    //                            notify('ERROR, Tiene que indicar una fecha correcta.');
    //                            return 0;
    //                        } else {
    //                            _preSalesControllerCustomer.AppliedDiscount = ToDecimal(descuento);
    //                            UserWantsSavePreSale();
    //                        }
    //                    }
    //                    break;

    //                case OpcionValidarSaldoCliente.EjecutarTarea:
    //                    SeguirTareaPreventa();
    //                    break;
    //            }
    //            break;

    //        case OpcionRespuesta.Error:
    //            my_dialog("", "", "close");
    //            notify("Error al validar saldo del cliente: " + data.message);
    //            console.log("Error al validar saldo del cliente: " + data.message);
    //            break;
    //        case OpcionRespuesta.Recibido:
    //            console.log("Validando saldo del cliente");
    //            break;
    //    }
    //});

     
}

function ValidarSiTieneFacturasVenciadas(idCliente, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT I.DOC_DUE_DATE";
            sql += " FROM INVOICE_HEADER I";
            sql += " WHERE I.CLIENT_ID = '" + idCliente + "'";
            sql += " AND I.IS_POSTED = 3";
            sql += " AND I.DOC_DUE_DATE <= DATE()";

            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length > 0) {
                        callback(idCliente, 1);
                    } else {
                        callback(idCliente, 0);
                    }
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallback(err);
                }
            );
        },
        function (err) {
            errCallback(err);
        });
}

function ValidarSiTieneDiasDeCreditoVencidos(idCliente, diasCredito, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT I.POSTED_DATETIME";
            sql += " FROM INVOICE_HEADER I";
            sql += " WHERE I.CLIENT_ID = '" + idCliente + "'";
            sql += " AND I.IS_POSTED = 3";
            sql += " AND date(I.POSTED_DATETIME, '+" + diasCredito + " day') <= DATE()";

            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length > 0) {
                        callback(idCliente, 1);
                    } else {
                        callback(idCliente, 0);
                    }
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallback(err);
                }
            );
        },
        function (err) {
            errCallback(err);
        });
}

function ObtenerLimiteDeCredito(idCliente, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT C.CREDIT_LIMIT, C.EXTRADAYS";
            sql += " FROM CLIENTS C";
            sql += " WHERE C.CLIENT_ID = '" + idCliente + "'";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(idCliente, results.rows.item(0).CREDIT_LIMIT, results.rows.item(0).EXTRADAYS);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallback(err);
                }
            );
        },
        function (err) {
            errCallback(err);
        });
}

function ObtenerSaldoActual(idCliente, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT IFNULL(SUM(I.TOTAL_AMOUNT),0) TOTAL_AMOUNT";
            sql += " FROM INVOICE_HEADER I";
            sql += " WHERE I.CLIENT_ID = '" + idCliente + "'";
            sql += " AND IS_POSTED = 3";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(idCliente, results.rows.item(0).TOTAL_AMOUNT);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallback(err);
                }
            );
        },
        function (err) {
            errCallback(err);
        });
}

function ValidarSaldoCliente(idCliente, montoActual, sku, cantidad, opcion, tipoOrden, callback, errCallback) {
    var data = "";

    if (gIsOnline === 0) {
        my_dialog("Validando crédito y saldo", "Espere...", "open");
        ValidarSiTieneFacturasVenciadas(idCliente, function (idClienteN1, facturasVenciadas) {
            if (facturasVenciadas === 0) {
                if (tipoOrden === OrdenDeVentaTipo.Contado) {
                    my_dialog("", "", "close");
                    callback(sku, cantidad);
                } else {
                    ObtenerLimiteDeCredito(idClienteN1, function (idClienteN2, limiteDeCredito, diasCredito) {
                        if (limiteDeCredito !== 0) {
                            if (diasCredito !== 0 && diasCredito !== null) {
                                ValidarSiTieneDiasDeCreditoVencidos(idClienteN2, diasCredito, function (idClienteN3, diasCreditoVencidos) {
                                    if (diasCreditoVencidos === 0) {
                                        ObtenerSaldoActual(idClienteN3, function (idClienteN4, saldoActual) {
                                            if ((saldoActual + montoActual) <= limiteDeCredito) {
                                                my_dialog("", "", "close");
                                                callback(sku, cantidad);
                                            } else {
                                                my_dialog("", "", "close");
                                                errCallback({
                                                    code: -1,
                                                    message: "El crédito es insuficiente"
                                                });
                                            }
                                        }, function (err) {
                                            my_dialog("", "", "close");
                                            errCallback(err);
                                        });
                                    } else {
                                        my_dialog("", "", "close");
                                        errCallback({
                                            code: -1,
                                            message: "Tiene una factura emitida que ya vencieron los días de crédito"
                                        });
                                    }
                                }, function (err) {
                                    my_dialog("", "", "close");
                                    errCallback(err);
                                });
                            } else {
                                my_dialog("", "", "close");
                                errCallback({
                                    code: -1,
                                    message: "El cliente no tiene configurado la cantidad de días de crédito"
                                });
                            }
                        } else {
                            my_dialog("", "", "close");
                            errCallback({
                                code: -1,
                                message: "El cliente no tiene configurado el límite de crédito"
                            });
                        }
                    }, function (err) {
                        my_dialog("", "", "close");
                        errCallback(err);
                    });
                }
            } else {
                my_dialog("", "", "close");
                errCallback({
                    code: -1,
                    message: "Tiene facturas vencidas"
                });
            }
        }, function (err) {
            my_dialog("", "", "close");
            errCallback(err);
        });

    } else {
        try {
            data =
            {
                'Total': montoActual,
                'CodeCustomer': idCliente,
                'sku': sku,
                'cantidad': cantidad,
                'source': opcion,
                'salesOrderType': tipoOrden,
                'dbuser': gdbuser,
                'dbuserpass': gdbuserpass,
                'routeid': gCurrentRoute
            };
            socket.emit("GetCurrentAccountByCustomer", data);
        } catch (e) {
            errCallback(e);
        }
    }
}

function ObtenerFacturasCliente(idCliente) {
    var data =
        {
            'codeCustomer': idCliente,
            'dbuser': gdbuser,
            'dbuserpass': gdbuserpass,
            'routeid': gCurrentRoute
        };
    socket.emit("GetInvoiceByCustomer", data);
}

function ObtenerSaldoActualSinSku(sku, cantidad, precioUnitario, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            /*var sql = "SELECT IFNULL(SUM(D.TOTAL_LINE),0) TOTAL_AMOUNT";
            sql += " FROM INVOICE_DETAIL D";
            sql += " WHERE D.INVOICE_NUM = -9999";
            sql += " AND D.SKU != '" + sku + "'";*/
            var sql = "SELECT IFNULL(SUM(D.TOTAL_LINE),0) TOTAL_AMOUNT";
            sql += " FROM SALES_ORDER_DETAIL D";
            sql += " WHERE D.SALES_ORDER_ID = -9999";
            sql += " AND D.SKU != '" + sku + "'";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(sku, cantidad, precioUnitario, results.rows.item(0).TOTAL_AMOUNT);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallback(err);
                }
            );
        },
        function (err) {
            errCallback(err);
        });
}

/*
function ObtenerReglaTipoDeOrdenDeVenta(callbackSi,callbackNo,errCallback) {
    SONDA_DB_Session.transaction(
       function (tx) {
           var sql = "SELECT ENABLED";
           sql += " FROM RULE R";
           sql += " WHERE R.EVENT_ID = 13";
           sql += " AND  R.TYPE= 'tipoOrdenDeVenta'";

           tx.executeSql(sql, [],
               function (tx, results) {
                   if (results.rows.item(0).ENABLED == 'Si') {
                       callbackSi();
                   } else {
                       callbackNo();
                   }

               }, function (tx, err) {
                   if (err.code !== 0)
                       errCallback(err);
               }
           );
       },
       function (err) {
           errCallback(err);
       });
}
*/