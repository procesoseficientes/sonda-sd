var PagoServicio = (function () {
    function PagoServicio() {
    }
    PagoServicio.prototype.guardarDocumentoDePago = function (documentoDePago, callback, errorCallback) {
        var _this_1 = this;
        try {
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(_this_1.obtenerFormatoSqlDeInsercionDeEncabezadoDeDocumentoDePago(documentoDePago));
                documentoDePago.overdueInvoicePaymentDetail.forEach(function (detalleDeDocumentoDePago) {
                    trans.executeSql(_this_1.obtenerFormatoSqlDeInsercionDeDetalleDeDocumentoDePago(detalleDeDocumentoDePago));
                });
                documentoDePago.overdueInvoicePaymentDetail.forEach(function (detalleDeDocumentoDePago) {
                    trans.executeSql(_this_1.obtenerFormatoSqlDeActualizacionDeMontoPendienteDePagoEnFacturaOriginal(detalleDeDocumentoDePago));
                });
                documentoDePago.overdueInvoicePaymentTypeDetail.forEach(function (tipoDePago) {
                    trans.executeSql(_this_1.obtenerFormatoSqlDeInsercionDeTipoDePago(tipoDePago));
                });
                trans.executeSql(_this_1.obtenerFormatoDeActualizacionDeBalanceDeCliente(documentoDePago));
                trans.executeSql(_this_1.obtenerFormatoDeActualizacionDeSecuenciaDeDocumentos(documentoDePago));
            }, function (error) {
                errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
            }, callback);
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    PagoServicio.prototype.obtenerFormatoSqlDeInsercionDeEncabezadoDeDocumentoDePago = function (documentoDePago) {
        var sql = [];
        sql.push("INSERT INTO OVERDUE_INVOICE_PAYMENT_HEADER(CODE_CUSTOMER, DOC_SERIE, DOC_NUM");
        sql.push(" ,CREATED_DATE, CODE_ROUTE, LOGIN_ID, PAYMENT_AMOUNT, IS_POSTED, COMMENT, PAYMENT_APPLIED_TO)");
        sql.push(" VALUES(");
        sql.push(" '" + documentoDePago.codeCustomer + "'");
        sql.push(" ,'" + documentoDePago.docSerie + "'");
        sql.push(" ," + documentoDePago.docNum);
        sql.push(" ,'" + documentoDePago.createdDate + "'");
        sql.push(" ,'" + documentoDePago.codeRoute + "'");
        sql.push(" ,'" + documentoDePago.loginId + "'");
        sql.push(" ," + documentoDePago.paymentAmount);
        sql.push(" ," + SiNo.No);
        sql.push(" ,'" + documentoDePago.paidComment + "'");
        sql.push(" ,'" + documentoDePago.paymentType + "'");
        sql.push(" )");
        return sql.join("");
    };
    PagoServicio.prototype.obtenerFormatoSqlDeInsercionDeDetalleDeDocumentoDePago = function (detalleDeDocumentoDePago) {
        var sql = [];
        sql.push("INSERT INTO OVERDUE_INVOICE_PAYMENT_DETAIL(INVOICE_ID, DOC_ENTRY, DOC_SERIE, DOC_NUM, PAYED_AMOUNT)");
        sql.push(" VALUES(");
        sql.push(" " + detalleDeDocumentoDePago.invoiceId);
        sql.push(" ," + detalleDeDocumentoDePago.docEntry);
        sql.push(" ,'" + detalleDeDocumentoDePago.docSerie + "'");
        sql.push(" ," + detalleDeDocumentoDePago.docNum);
        sql.push(" ," + detalleDeDocumentoDePago.payedAmount);
        sql.push(" )");
        return sql.join("");
    };
    PagoServicio.prototype.obtenerDocumentosDePagoNoPosteadosEnElServidor = function (callback) {
        this.obtenerEncabezadoDeDocumentosNoPosteadosEnElServidor(callback);
    };
    PagoServicio.prototype.obtenerEncabezadoDeDocumentosNoPosteadosEnElServidor = function (callback) {
        var _this_1 = this;
        var sql = [];
        var documentosDePagoNoPosteados = [];
        sql.push("SELECT CODE_CUSTOMER, DOC_SERIE, DOC_NUM, CREATED_DATE, CODE_ROUTE, LOGIN_ID, PAYMENT_AMOUNT, COMMENT FROM OVERDUE_INVOICE_PAYMENT_HEADER");
        sql.push(" WHERE IS_POSTED = " + SiNo.No);
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(""), [], function (transResult, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    var documentoTemporal = results.rows.item(i);
                    var documento = new PagoDeFacturaVencidaEncabezado();
                    documento.codeCustomer = documentoTemporal.CODE_CUSTOMER;
                    documento.docSerie = documentoTemporal.DOC_SERIE;
                    documento.docNum = documentoTemporal.DOC_NUM;
                    documento.createdDate = documentoTemporal.CREATED_DATE;
                    documento.codeRoute = documentoTemporal.CODE_ROUTE;
                    documento.loginId = documentoTemporal.LOGIN_ID;
                    documento.paymentAmount = documentoTemporal.PAYMENT_AMOUNT;
                    documento.paidComment = documentoTemporal.COMMENT;
                    documentosDePagoNoPosteados.push(documento);
                }
                _this_1.obtenerDetalleDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteados, 0, function (documentosDePago, transaccionActual) {
                    _this_1
                        .obtenerDetalleDeTiposDePagoDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePago, 0, callback, transaccionActual);
                }, transResult);
            }, function (transResult, error) {
                console.log("Error al obtener los documentos de pago de facturas vencidas no posteados debido a: '" + error.message + "'");
            });
        }, function (error) {
            console.log("Error al obtener los documentos de pago de facturas vencidas no posteados debido a: '" + error.message + "'");
        });
    };
    PagoServicio.prototype.obtenerDetalleDeDocumentosDePagoNoPosteadosEnElServidor = function (documentosDePagoNoPosteadosEnElServidor, posicionActualDeDocumentoProcesado, callback, transaccionActual) {
        var _this_1 = this;
        if (documentosDePagoNoPosteadosEnElServidor.length > posicionActualDeDocumentoProcesado) {
            var sql = [];
            sql.push("SELECT INVOICE_ID, DOC_ENTRY, DOC_SERIE, DOC_NUM, PAYED_AMOUNT FROM OVERDUE_INVOICE_PAYMENT_DETAIL");
            sql.push(" WHERE DOC_SERIE = '" + documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docSerie + "'");
            sql.push(" AND DOC_NUM = " + documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docNum);
            transaccionActual.executeSql(sql.join(""), [], function (transResult, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    var detalleTemporal = results.rows.item(i);
                    var detalle = new PagoDeFacturaVencidaDetalle();
                    detalle.invoiceId = detalleTemporal.INVOICE_ID;
                    detalle.docEntry = detalleTemporal.DOC_ENTRY;
                    detalle.docSerie = detalleTemporal.DOC_SERIE;
                    detalle.docNum = detalleTemporal.DOC_NUM;
                    detalle.payedAmount = detalleTemporal.PAYED_AMOUNT;
                    documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado]
                        .overdueInvoicePaymentDetail.push(detalle);
                }
                _this_1.obtenerDetalleDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteadosEnElServidor, posicionActualDeDocumentoProcesado + 1, callback, transResult);
            }, function (transResult, error) {
                console.log("Error al obtener el detalle de los documentos de pago de facturas vencidas no posteados debido a: '" + error.message + "'");
            });
        }
        else {
            callback(documentosDePagoNoPosteadosEnElServidor, transaccionActual);
        }
    };
    PagoServicio.prototype.marcarDocumentosDePagoComoPosteadosEnElServidor = function (documentosDePagoPosteadosEnElServidor) {
        var _this_1 = this;
        try {
            if (documentosDePagoPosteadosEnElServidor.length > 0) {
                SONDA_DB_Session.transaction(function (trans) {
                    documentosDePagoPosteadosEnElServidor.forEach(function (documentoPosteado) {
                        if (documentoPosteado.RESULT === ResultadoDePosteoEnServidor.Exitoso) {
                            trans.executeSql(_this_1.obtenerFormatoDeActualizacionDePosteoDeEncabezadoDeDocumentoDePago(documentoPosteado));
                            trans.executeSql(_this_1.obtenerFormatoDeActualizacionDePosteoDeDetalleDeDocumentoDePago(documentoPosteado));
                            trans.executeSql(_this_1.obtenerFormatoDeActualizacionDePosteoDeDetalleDeTipoDePagoDeDocumentoDePago(documentoPosteado));
                        }
                    });
                }, function (error) {
                    console
                        .log("Error al marcar el pago de factura vencida como posteado en el servidor debido a: '" + error
                        .message + "'");
                });
            }
        }
        catch (e) {
            console
                .log("Error al actualizar los documentos de pago de facturas vencidas posteados en el servidor debido a: " + e.message);
        }
    };
    PagoServicio.prototype.obtenerFormatoDeActualizacionDePosteoDeEncabezadoDeDocumentoDePago = function (documentoPosteado) {
        var sql = [];
        sql.push("UPDATE OVERDUE_INVOICE_PAYMENT_HEADER");
        sql.push(" SET IS_POSTED = " + SiNo.Si + ", ID = " + documentoPosteado.PAYMENT_ID_BO);
        sql.push(" WHERE DOC_SERIE = '" + documentoPosteado.DOC_SERIE + "' AND DOC_NUM = " + documentoPosteado.DOC_NUM);
        return sql.join("");
    };
    PagoServicio.prototype.obtenerFormatoDeActualizacionDePosteoDeDetalleDeDocumentoDePago = function (documentoPosteado) {
        var sql = [];
        sql.push("UPDATE OVERDUE_INVOICE_PAYMENT_DETAIL SET PAYMENT_HEADER_ID = " + documentoPosteado.PAYMENT_ID_BO + " ");
        sql.push(" WHERE DOC_SERIE = '" + documentoPosteado.DOC_SERIE + "' AND DOC_NUM = " + documentoPosteado.DOC_NUM);
        return sql.join("");
    };
    PagoServicio.prototype.imprimirPago = function (pago, callback, errorCallback) {
        ObtenerFormatoDeImpresionDePago(pago, function (formatoDeImpresion) {
            ConectarImpresora(gPrintAddress, function () {
                Imprimir(formatoDeImpresion, function () {
                    callback();
                }, errorCallback);
            }, errorCallback);
        }, errorCallback);
    };
    PagoServicio.prototype.obtenerFormatoDeActualizacionDeSecuenciaDeDocumentos = function (documentoDePago) {
        var sql = [];
        sql.push("UPDATE DOCUMENT_SEQUENCE SET CURRENT_DOC = " + documentoDePago.docNum);
        sql.push(" WHERE SERIE='" + documentoDePago.docSerie + "' AND DOC_TYPE = '" + SecuenciaDeDocumentoTipo.PagoDeFacturaVencida + "'");
        return sql.join("");
    };
    PagoServicio.prototype.obtenerParametroDePorcentajeDePagoMinimoDeFacturasVencidas = function (grupoParametro, tipoParametro, callback, errorCallback) {
        var _this_1 = this;
        try {
            var sql_1 = [];
            sql_1.push("SELECT IDENTITY, GROUP_ID, PARAMETER_ID, VALUE");
            sql_1.push(" FROM PARAMETERS");
            sql_1.push(" WHERE GROUP_ID='" + grupoParametro + "'");
            sql_1.push(" AND PARAMETER_ID='" + tipoParametro + "'");
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(sql_1.join(""), [], function (transResult, results) {
                    if (_this_1.verificarSiAplicaParametroDePorcentajeMinimoDePagoDeFacturasVencidas(results)) {
                        callback(true, parseFloat(results.rows.item(0).VALUE));
                    }
                    else {
                        callback(false, 0);
                    }
                }, function (transResult, errorTrans) {
                    errorCallback({
                        codigo: errorTrans.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Error al obtener el parametro de porcentaje de pago minimo de facturas vencidas debido a: " + errorTrans.message
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al obtener el parametro de porcentaje de pago minimo de facturas vencidas debido a: " + error.message
                });
            });
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al obtener el parametro de porcentaje de pago minimo de facturas vencidas debido a: " + e
                    .message
            });
        }
    };
    PagoServicio.prototype.verificarSiAplicaParametroDePorcentajeMinimoDePagoDeFacturasVencidas = function (resultadoDeConsulta) {
        return resultadoDeConsulta.rows.length > 0 &&
            resultadoDeConsulta.rows.item(0).VALUE &&
            parseFloat(resultadoDeConsulta.rows.item(0).VALUE.toString()) >= 0;
    };
    PagoServicio.prototype.obtenerFormatoSqlDeActualizacionDeMontoPendienteDePagoEnFacturaOriginal = function (detalleDeDocumentoDePago) {
        var sql = [];
        sql.push("UPDATE OVERDUE_INVOICE_BY_CUSTOMER SET PENDING_TO_PAID = PENDING_TO_PAID - " + detalleDeDocumentoDePago.payedAmount);
        sql.push(" WHERE INVOICE_ID = " + detalleDeDocumentoDePago.invoiceId + " AND DOC_ENTRY = " + detalleDeDocumentoDePago.docEntry);
        return sql.join("");
    };
    PagoServicio.prototype.obtenerSecuenciaDeDocumentoDePago = function (callback, errorCallback) {
        var sql = [];
        sql.push("SELECT SERIE, (CURRENT_DOC + 1) AS CURRENT_DOC, BRANCH_NAME, BRANCH_ADDRESS ");
        sql.push(" FROM DOCUMENT_SEQUENCE WHERE DOC_TYPE = '" + SecuenciaDeDocumentoTipo.PagoDeFacturaVencida + "'");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(""), [], function (transResult, results) {
                if (results.rows.length > 0) {
                    var secuencia = {
                        serie: results.rows.item(0).SERIE,
                        numero: results.rows.item(0).CURRENT_DOC,
                        nombreSucursal: results.rows.item(0).BRANCH_NAME,
                        direccionSucursal: results.rows.item(0).BRANCH_ADDRESS
                    };
                    callback(secuencia);
                }
                else {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Operador no cuenta con secuencia de documentos de tipo " + SecuenciaDeDocumentoTipo
                            .PagoDeFacturaVencida + ", por favor contacte a su administrador."
                    });
                }
            }, function (transResult, error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al obtener la secuencia de documentos de tipo " + SecuenciaDeDocumentoTipo
                        .PagoDeFacturaVencida + " debido a: " + error.message
                });
            });
        }, function (error) {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al obtener la secuencia de documentos de tipo " + SecuenciaDeDocumentoTipo
                    .PagoDeFacturaVencida + " debido a: " + error.message
            });
        });
    };
    PagoServicio.prototype.obtenerFormatoSqlDeInsercionDeTipoDePago = function (tipoDePago) {
        var sql = [];
        sql.push("INSERT INTO OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL(");
        sql.push(" [PAYMENT_TYPE],[FRONT_IMAGE]");
        sql.push(" ,[BACK_IMAGE],[DOCUMENT_NUMBER],[BANK_ACCOUNT],[BANK_NAME]");
        sql.push(" ,[AMOUNT],[DOC_SERIE],[DOC_NUM])");
        sql.push(" VALUES(");
        sql.push(" '" + tipoDePago.paymentType + "'");
        sql.push(" ,'" + tipoDePago.frontImage + "'");
        sql.push(" ,'" + tipoDePago.backImage + "'");
        sql.push(" ,'" + tipoDePago.documentNumber + "'");
        sql.push(" ,'" + tipoDePago.bankAccount + "'");
        sql.push(" ,'" + tipoDePago.bankName + "'");
        sql.push(" ," + tipoDePago.amount);
        sql.push(" ,'" + tipoDePago.docSerie + "'");
        sql.push(" ," + tipoDePago.docNum);
        sql.push(" )");
        return sql.join("");
    };
    PagoServicio.prototype.obtenerDetalleDeTiposDePagoDeDocumentosDePagoNoPosteadosEnElServidor = function (documentosDePagoNoPosteadosEnElServidor, posicionActualDeDocumentoProcesado, callback, transaccionActual) {
        var _this_1 = this;
        if (documentosDePagoNoPosteadosEnElServidor.length > posicionActualDeDocumentoProcesado) {
            var sql = [];
            sql.push("SELECT");
            sql.push(" [PAYMENT_TYPE],[FRONT_IMAGE]");
            sql.push(" ,[BACK_IMAGE],[DOCUMENT_NUMBER],[BANK_ACCOUNT],[BANK_NAME]");
            sql.push(" ,[AMOUNT],[DOC_SERIE],[DOC_NUM]");
            sql.push(" FROM OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL");
            sql.push(" WHERE DOC_SERIE = '" + documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docSerie + "'");
            sql.push(" AND DOC_NUM = " + documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docNum);
            transaccionActual.executeSql(sql.join(""), [], function (transResult, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    var detalleTemporal = results.rows.item(i);
                    var detalle = new TipoDePagoEnFacturaVencida();
                    detalle.paymentType = detalleTemporal.PAYMENT_TYPE;
                    detalle.frontImage = detalleTemporal.FRONT_IMAGE;
                    detalle.backImage = detalleTemporal.BACK_IMAGE;
                    detalle.documentNumber = detalleTemporal.DOCUMENT_NUMBER;
                    detalle.bankAccount = detalleTemporal.BANK_ACCOUNT;
                    detalle.bankName = detalleTemporal.BANK_NAME;
                    detalle.amount = detalleTemporal.AMOUNT;
                    detalle.docSerie = detalleTemporal.DOC_SERIE;
                    detalle.docNum = detalleTemporal.DOC_NUM;
                    documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado]
                        .overdueInvoicePaymentTypeDetail.push(detalle);
                }
                _this_1.obtenerDetalleDeTiposDePagoDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteadosEnElServidor, posicionActualDeDocumentoProcesado + 1, callback, transResult);
            }, function (transResult, error) {
                console.log("Error al obtener el detalle de los tipos de pago, para los documentos de pago de facturas vencidas no posteados debido a: '" + error.message + "'");
            });
        }
        else {
            callback(documentosDePagoNoPosteadosEnElServidor);
        }
    };
    PagoServicio.prototype.obtenerFormatoDeActualizacionDePosteoDeDetalleDeTipoDePagoDeDocumentoDePago = function (documentoPosteado) {
        var sql = [];
        sql.push("UPDATE OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL SET PAYMENT_HEADER_ID = " + documentoPosteado.PAYMENT_ID_BO + " ");
        sql.push(" WHERE DOC_SERIE = '" + documentoPosteado.DOC_SERIE + "' AND DOC_NUM = " + documentoPosteado.DOC_NUM);
        return sql.join("");
    };
    PagoServicio.prototype.obtenerEncabezadoDeDocumentosDePagoParaReporte = function (callback, errorCallbak) {
        var _this_1 = this;
        var documentosDePago = [];
        SONDA_DB_Session.transaction(function (trans) {
            var sql = [];
            sql.push("SELECT OIPH.CODE_CUSTOMER");
            sql.push(" , OIPH.DOC_SERIE");
            sql.push(" , OIPH.DOC_NUM");
            sql.push(" , OIPH.PAYMENT_AMOUNT");
            sql.push(" , OIPH.COMMENT");
            sql.push(" , (SELECT T.RELATED_CLIENT_NAME FROM TASK AS T WHERE T.RELATED_CLIENT_CODE = OIPH.CODE_CUSTOMER AND T.TASK_TYPE IN('SALE','DELIVERY_SD') LIMIT 1) AS NAME_CUSTOMER");
            sql.push(" FROM OVERDUE_INVOICE_PAYMENT_HEADER AS OIPH ORDER BY OIPH.DOC_NUM ASC");
            trans.executeSql(sql.join(""), [], function (transResult, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    var pagoTemp = results.rows.item(i);
                    var pago = new PagoDeFacturaVencidaEncabezado();
                    pago.docNum = pagoTemp.DOC_NUM;
                    pago.docSerie = pagoTemp.DOC_SERIE;
                    pago.codeCustomer = pagoTemp.CODE_CUSTOMER;
                    pago.nameCustomer = pagoTemp.NAME_CUSTOMER;
                    pago.paymentAmount = pagoTemp.PAYMENT_AMOUNT;
                    pago.paidComment = pagoTemp.COMMENT;
                    documentosDePago.push(pago);
                }
                _this_1
                    .obtenerDetalleDeDocumentosDePagoParaReporte(documentosDePago, 0, function (documentosDePagoConDetalle, transaccion) {
                    _this_1.obtenerDetalleDeTiposDePagoDeDocumentosDePagoParaReporte(documentosDePagoConDetalle, 0, callback, errorCallbak, transaccion);
                }, errorCallbak, transResult);
            }, function (transResult, error) {
                errorCallbak({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Ha ocurrido un error al obtener los documentos de pago, por favor, vuelva a intentar."
                });
            });
        }, function (error) {
            errorCallbak({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Ha ocurrido un error al obtener los documentos de pago, por favor, vuelva a intentar."
            });
        });
    };
    PagoServicio.prototype.obtenerDetalleDeDocumentosDePagoParaReporte = function (documentosDePago, posicionActualDeDocumentoProcesado, callback, errorCallback, transaccionActual) {
        var _this_1 = this;
        if (documentosDePago.length > posicionActualDeDocumentoProcesado) {
            var sql = [];
            sql.push("SELECT OIPD.INVOICE_ID");
            sql.push(" , OIPD.DOC_ENTRY");
            sql.push(" , OIPD.DOC_SERIE");
            sql.push(" , OIPD.DOC_NUM");
            sql.push(" , OIPD.PAYED_AMOUNT");
            sql.push(" , (SELECT datetime(OIC.CREATED_DATE)) as CREATED_DATE");
            sql.push(" , (SELECT datetime(OIC.DUE_DATE)) as DUE_DATE");
            sql.push(" , OIC.PENDING_TO_PAID");
            sql.push(" FROM OVERDUE_INVOICE_PAYMENT_DETAIL OIPD");
            sql.push(" INNER JOIN OVERDUE_INVOICE_BY_CUSTOMER OIC ON(OIC.INVOICE_ID = OIPD.INVOICE_ID AND OIC.DOC_ENTRY = OIPD.DOC_ENTRY)");
            sql.push(" WHERE OIPD.DOC_SERIE = '" + documentosDePago[posicionActualDeDocumentoProcesado].docSerie + "'");
            sql.push(" AND OIPD.DOC_NUM = " + documentosDePago[posicionActualDeDocumentoProcesado].docNum);
            transaccionActual.executeSql(sql.join(""), [], function (transResult, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    var detalleTemporal = results.rows.item(i);
                    var detalle = new PagoDeFacturaVencidaDetalle();
                    detalle.invoiceId = detalleTemporal.INVOICE_ID;
                    detalle.docEntry = detalleTemporal.DOC_ENTRY;
                    detalle.docSerie = detalleTemporal.DOC_SERIE;
                    detalle.docNum = detalleTemporal.DOC_NUM;
                    detalle.payedAmount = detalleTemporal.PAYED_AMOUNT;
                    detalle.createdDate = detalleTemporal.CREATED_DATE;
                    detalle.dueDate = detalleTemporal.DUE_DATE;
                    detalle.pendingToPaid = detalleTemporal.PENDING_TO_PAID;
                    documentosDePago[posicionActualDeDocumentoProcesado]
                        .overdueInvoicePaymentDetail.push(detalle);
                }
                _this_1.obtenerDetalleDeDocumentosDePagoParaReporte(documentosDePago, posicionActualDeDocumentoProcesado + 1, callback, errorCallback, transResult);
            }, function (transResult, error) {
                console.log("Error al obtener el detalle de los documentos de pago debido a: '" + error.message + "'");
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Ha ocurrido un error al obtener el detalle de los documentos de pago, por favor, vuelva a intentar."
                });
            });
        }
        else {
            callback(documentosDePago, transaccionActual);
        }
    };
    PagoServicio.prototype.obtenerDetalleDeTiposDePagoDeDocumentosDePagoParaReporte = function (documentosDePago, posicionActualDeDocumentoProcesado, callback, errorCallback, transaccionActual) {
        var _this_1 = this;
        if (documentosDePago.length > posicionActualDeDocumentoProcesado) {
            var sql = [];
            sql.push("SELECT");
            sql.push(" [PAYMENT_TYPE],[FRONT_IMAGE]");
            sql.push(" ,[BACK_IMAGE],[DOCUMENT_NUMBER],[BANK_ACCOUNT],[BANK_NAME]");
            sql.push(" ,[AMOUNT],[DOC_SERIE],[DOC_NUM]");
            sql.push(" FROM OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL");
            sql.push(" WHERE DOC_SERIE = '" + documentosDePago[posicionActualDeDocumentoProcesado].docSerie + "'");
            sql.push(" AND DOC_NUM = " + documentosDePago[posicionActualDeDocumentoProcesado].docNum);
            transaccionActual.executeSql(sql.join(""), [], function (transResult, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    var detalleTemporal = results.rows.item(i);
                    var detalle = new TipoDePagoEnFacturaVencida();
                    detalle.paymentType = detalleTemporal.PAYMENT_TYPE;
                    detalle.frontImage = detalleTemporal.FRONT_IMAGE;
                    detalle.backImage = detalleTemporal.BACK_IMAGE;
                    detalle.documentNumber = detalleTemporal.DOCUMENT_NUMBER;
                    detalle.bankAccount = detalleTemporal.BANK_ACCOUNT;
                    detalle.bankName = detalleTemporal.BANK_NAME;
                    detalle.amount = detalleTemporal.AMOUNT;
                    detalle.docSerie = detalleTemporal.DOC_SERIE;
                    detalle.docNum = detalleTemporal.DOC_NUM;
                    documentosDePago[posicionActualDeDocumentoProcesado]
                        .overdueInvoicePaymentTypeDetail.push(detalle);
                }
                _this_1.obtenerDetalleDeTiposDePagoDeDocumentosDePagoParaReporte(documentosDePago, posicionActualDeDocumentoProcesado + 1, callback, errorCallback, transResult);
            }, function (transResult, error) {
                console.log("Error al obtener el detalle de los documentos de pago debido a: '" + error.message + "'");
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Ha ocurrido un error al obtener el detalle de los documentos de pago, por favor, vuelva a intentar."
                });
            });
        }
        else {
            callback(documentosDePago);
        }
    };
    PagoServicio.prototype.obtenerInformacionDeSecuenciaDeDocumentoDePago = function (callback, errorCallback) {
        var sql = [];
        sql.push("SELECT SERIE, CURRENT_DOC, BRANCH_NAME, BRANCH_ADDRESS ");
        sql.push(" FROM DOCUMENT_SEQUENCE WHERE DOC_TYPE = '" + SecuenciaDeDocumentoTipo.PagoDeFacturaVencida + "'");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(""), [], function (transResult, results) {
                if (results.rows.length > 0) {
                    var secuencia = {
                        serie: results.rows.item(0).SERIE,
                        numero: results.rows.item(0).CURRENT_DOC,
                        nombreSucursal: results.rows.item(0).BRANCH_NAME,
                        direccionSucursal: results.rows.item(0).BRANCH_ADDRESS
                    };
                    callback(secuencia);
                }
                else {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Operador no cuenta con secuencia de documentos de tipo " + SecuenciaDeDocumentoTipo
                            .PagoDeFacturaVencida + ", por favor contacte a su administrador."
                    });
                }
            }, function (transResult, error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al obtener la secuencia de documentos de tipo " + SecuenciaDeDocumentoTipo
                        .PagoDeFacturaVencida + " debido a: " + error.message
                });
            });
        }, function (error) {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al obtener la secuencia de documentos de tipo " + SecuenciaDeDocumentoTipo
                    .PagoDeFacturaVencida + " debido a: " + error.message
            });
        });
    };
    PagoServicio.prototype.obtenerFormatoDeActualizacionDeBalanceDeCliente = function (pago) {
        var formato = [];
        formato.push("UPDATE CUSTOMER_ACCOUNTING_INFORMATION SET OUTSTANDING_BALANCE = OUTSTANDING_BALANCE + " + pago.paymentAmount + " ");
        formato.push("WHERE CODE_CUSTOMER = '" + pago.codeCustomer + "'");
        return formato.join("");
    };
    return PagoServicio;
}());
//# sourceMappingURL=PagoServicio.js.map