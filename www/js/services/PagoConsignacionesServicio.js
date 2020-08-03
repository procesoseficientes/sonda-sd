var PagoConsignacionesServicio = {

    ObtenerConsignacionesPorCliente: function (clientId, callback, errCallback) {
        var consignaciones = new Array();
        SONDA_DB_Session.transaction(
            function (tx) {
                var psql = "SELECT ";
                psql += "CH.CONSIGNMENT_ID, ";
                psql += "CH.CUSTOMER_ID, ";
                psql += "CH.DATE_CREATE, ";
                psql += "CH.STATUS, ";
                psql += "CH.POSTED_BY, ";
                psql += "CH.IS_POSTED, ";
                psql += "CH.POS_TERMINAL, ";
                psql += "CH.GPS_URL, ";
                psql += "CH.DUE_DATE, ";
                psql += "CH.IS_ACTIVE_ROUTE, ";
                psql += "CH.CONSIGNMENT_BO_NUM, ";
                psql += "IFNULL(CH.TOTAL_AMOUNT,0) TOTAL_AMOUNT, ";
                psql += "DOC_SERIE, ";
                psql += "DOC_NUM, ";
                psql += "IMG, ";
                psql += "IS_CLOSED ";
                psql += "FROM CONSIGNMENT_HEADER AS CH WHERE CH.CUSTOMER_ID = '" + clientId + "' AND CH.STATUS IN('ACTIVE')";

                tx.executeSql(psql, [],
                    function (tx, results) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var consignacion = {
                                CONSIGNMENT_ID: results.rows.item(i).CONSIGNMENT_ID,
                                CUSTOMER_ID: results.rows.item(i).CUSTOMER_ID,
                                DATE_CREATE: results.rows.item(i).DATE_CREATE,
                                STATUS: results.rows.item(i).STATUS,
                                POSTED_BY: results.rows.item(i).POSTED_BY,
                                IS_POSTED: results.rows.item(i).IS_POSTED,
                                POS_TERMINAL: results.rows.item(i).POS_TERMINAL,
                                GPS_URL: results.rows.item(i).GPS_URL,
                                DUE_DATE: results.rows.item(i).DUE_DATE,
                                IS_ACTIVE_ROUTE: results.rows.item(i).IS_ACTIVE_ROUTE,
                                CONSIGNMENT_BO_NUM: results.rows.item(i).CONSIGNMENT_BO_NUM,
                                TOTAL_AMOUNT: results.rows.item(i).TOTAL_AMOUNT,
                                DOC_SERIE: results.rows.item(i).DOC_SERIE,
                                DOC_NUM: results.rows.item(i).DOC_NUM,
                                IMG: results.rows.item(i).IMG,
                                IS_CLOSED: results.rows.item(i).IS_CLOSED,
                                PAYMENT_OPTION: null,
                                CONSIGNMENT_DETAIL: new Array()
                            };
                            consignaciones.push(consignacion);
                        }
                        callback(consignaciones);
                    },
                    function (tx, err) {
                        if (err.code !== 0)
                            errCallback(err);
                    });
            },
            function (err) {
                errCallback(err);
            });
    }
    ,
    MarcarConsignacionComoPagada: function (consignacion, errorCallBack) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var psql = "UPDATE CONSIGNMENT_HEADER SET STATUS = 'CANCELLED', IS_POSTED = 3 WHERE CONSIGNMENT_ID = " + consignacion + "";//"AND CUSTOMER_ID ='" + gClientCode + "' ";
                    tx.executeSql(psql);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errorCallBack(err);
                });
        } catch (e) {
            errorCallBack(e);
        }
    }
    ,
    QuitarSkusEnProcesoDeFacturacion: function (callBack, errorCallBack) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var psql = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999";
                    tx.executeSql(psql);

                    var psql2 = "DELETE FROM CONSIGNMENT_DETAIL WHERE CONSIGNMENT_ID IS NULL";
                    tx.executeSql(psql2);

                    callBack();
                }, function (tx, err) {
                    if (err.code !== 0) {
                        errorCallBack(err);
                    }
                });
        } catch (e) {
            errorCallBack(e);
        }
    }
    ,
    AgregarConsignacionesATablasTemporales: function (consignaciones, callBack, errorCallBack) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                for (var i = 0; i < consignaciones.length; i++) {

                    var psql = " INSERT INTO CONSIGNMENT_HEADER_TEMP(";
                    psql += " CONSIGNMENT_ID, ";
                    psql += "CUSTOMER_ID, ";
                    psql += "DATE_CREATE, ";
                    psql += "DATE_UPDATE, ";
                    psql += "STATUS, ";
                    psql += "POSTED_BY, ";
                    psql += "IS_POSTED, ";
                    psql += "POS_TERMINAL, ";
                    psql += "GPS_URL, ";
                    psql += "DOC_DATE, ";
                    psql += "CLOSED_ROUTE_DATETIME, ";
                    psql += "IS_ACTIVE_ROUTE, ";
                    psql += "DUE_DATE, ";
                    psql += "CONSIGNMENT_BO_NUM, ";
                    psql += "TOTAL_AMOUNT";
                    psql += ") ";
                    psql += " VALUES (";
                    psql += consignaciones[i].CONSIGNMENT_ID;
                    psql += ",'" + consignaciones[i].CUSTOMER_ID + "'";
                    psql += ",'" + consignaciones[i].DATE_CREATE + "'";
                    psql += ",'" + consignaciones[i].DATE_UPDATE + "'";
                    psql += ",'" + consignaciones[i].STATUS + "'";
                    psql += ",'" + consignaciones[i].POSTED_BY + "'";
                    psql += ", " + consignaciones[i].IS_POSTED;
                    psql += ",'" + consignaciones[i].POS_TERMINAL + "'";
                    psql += ",'" + consignaciones[i].GPS_URL + "'";
                    psql += ",'" + consignaciones[i].DOC_DATE + "'";
                    psql += ",'" + consignaciones[i].CLOSED_ROUTE_DATETIME + "'";
                    psql += ", " + consignaciones[i].IS_ACTIVE_ROUTE;
                    psql += ",'" + consignaciones[i].DUE_DATE + "'";
                    psql += ", " + consignaciones[i].CONSIGNMENT_BO_NUM;
                    psql += ", " + consignaciones[i].TOTAL_AMOUNT;
                    psql += ")";

                    tx.executeSql(psql);

                    for (var j = 0; j < consignaciones[i].CONSIGNMENT_DETAIL.length; j++) {
                        var detalleTemp = consignaciones[i].CONSIGNMENT_DETAIL[j];

                        var psql2 = " INSERT INTO CONSIGNMENT_DETAIL_TEMP(";
                        psql2 += " CONSIGNMENT_ID, ";
                        psql2 += "SKU, ";
                        psql2 += "LINE_NUM, ";
                        psql2 += "QTY, ";
                        psql2 += "PRICE, ";
                        psql2 += "DISCOUNT, ";
                        psql2 += "TOTAL_LINE, ";
                        psql2 += "POSTED_DATETIME, ";
                        psql2 += "QTY_PAID, ";
                        psql2 += "QTY_RECONSIGNED, ";
                        psql2 += "QTY_RECOLLECTED, ";
                        psql2 += "HANDLE_SERIAL, ";
                        psql2 += "SERIAL_NUMBER ";
                        psql2 += ") VALUES (";
                        psql2 += detalleTemp.CONSIGNMENT_ID;
                        psql2 += ", '" + detalleTemp.SKU + "' ";
                        psql2 += ", " + detalleTemp.LINE_NUM;
                        psql2 += ", " + detalleTemp.QTY_CONSIGNMENT;
                        psql2 += ", " + detalleTemp.PRICE;
                        psql2 += ", " + detalleTemp.DISCOUNT;
                        psql2 += ", " + detalleTemp.TOTAL_LINE;
                        psql2 += ",'" + detalleTemp.POSTED_DATETIME + "' ";
                        psql2 += ", " + 0;
                        psql2 += ", " + 0;
                        psql2 += ", " + 0;
                        psql2 += "," + detalleTemp.HANDLE_SERIAL;
                        psql2 += ", '" + detalleTemp.SERIAL_NUMBER + "' ";
                        psql2 += ")";

                        tx.executeSql(psql2);
                    }

                    if (i === consignaciones.length - 1) {
                        callBack(consignaciones);
                    }
                }
            }, function (err, tx) {
                if (err.code !== 0) {
                    errorCallBack("Error al procesar las consignaciones del cliente debido a: " + err.message);
                }
            });
        } catch (e) {
            errorCallBack("Error al intentar procesar las consignaciones del cliente debido a: " + e.message);
        }
    }
    ,
    ObtenerDetalleDeConsignacionTemporal: function (consignmentId, callBack, errorCallBack) {
        try {
            var psql = "";
            var detalleConsignacion = new Array();
            SONDA_DB_Session.transaction(
                function (tx) {
                    psql = "SELECT ";
                    psql += "CD.CONSIGNMENT_ID, ";
                    psql += "CD.SKU, ";
                    psql += "S.SKU_NAME, ";
                    psql += "CD.LINE_NUM, ";
                    psql += "SUM(CD.QTY) AS QTY, ";
                    psql += "CD.PRICE, ";
                    psql += "CD.DISCOUNT, ";
                    psql += "CD.TOTAL_LINE, ";
                    psql += "CD.POSTED_DATETIME, CD.HANDLE_SERIAL, CD.SERIAL_NUMBER ";
                    psql += "FROM CONSIGNMENT_DETAIL_TEMP AS CD INNER JOIN SKUS AS S ON(S.SKU = CD.SKU) ";
                    psql += " WHERE CD.CONSIGNMENT_ID =" + parseInt(consignmentId);
                    psql += " GROUP BY CD.SKU";
                    psql += " ORDER BY CD.LINE_NUM ASC";
                    tx.executeSql(
                        psql
                        , []
                        , function (tx, results) {
                            for (var j = 0; j < results.rows.length; j++) {
                                var detalle = {
                                    CONSIGNMENT_ID: results.rows.item(j).CONSIGNMENT_ID,
                                    SKU: results.rows.item(j).SKU,
                                    SKU_NAME: results.rows.item(j).SKU_NAME,
                                    LINE_NUM: results.rows.item(j).LINE_NUM,
                                    QTY_CONSIGNMENT: results.rows.item(j).QTY,
                                    PRICE: results.rows.item(j).PRICE,
                                    DISCOUNT: results.rows.item(j).DISCOUNT,
                                    TOTAL_LINE: results.rows.item(j).TOTAL_LINE,
                                    POSTED_DATETIME: results.rows.item(j).POSTED_DATETIME,
                                    PAYMENT_ID: results.rows.item(j).PAYMENT_ID,
                                    HANDLE_SERIAL: results.rows.item(j).HANDLE_SERIAL,
                                    SERIAL_NUMBER: results.rows.item(j).SERIAL_NUMBER,
                                    PAYMENT_OPTION: null
                                };
                                detalleConsignacion.push(detalle);
                            }
                            callBack(detalleConsignacion);
                        }
                        , function (tx, err) {
                            if (err.code !== 0) {
                                errorCallBack(err);
                            }
                        });
                },
            function (err) {
                errorCallBack(err);
            },
            function () {
                //....
            });
        } catch (e) {
            errorCallBack("Error al intentar obtener el detalle de la consignacion debido a: " + e.message);
        }
    }
    ,
    LimpiarTablasTemporales: function () {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {

                    var psql = "DELETE FROM CONSIGNMENT_HEADER_TEMP";
                    tx.executeSql(psql);

                    var sql2 = "DELETE FROM CONSIGNMENT_DETAIL_TEMP";
                    tx.executeSql(sql2);

                    var sql3 = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT WHERE DOC_SERIE_TARGET IS NULL OR DOC_NUM_TARGET IS NULL";
                    tx.executeSql(sql3);

                    var sql4 = "DELETE FROM SKU_COLLECTED_DETAIL WHERE SKU_COLLECTED_ID IS NULL";
                    tx.executeSql(sql4);

                }, function (err, tx) {
                    if (err.code !== 0) {
                        notify(err.message);
                    }
                });
        } catch (e) {
            notify(e.message);
        }
    }
    ,
    MarcarConsignacionCompleta: function (consignmentId, paymentOption, docSerie, docNum, callBack, errorCallBack) {
        try {
            var sql = "";
            var error1 = "";

            SONDA_DB_Session.transaction(
                function (tx) {
                    var fechaTransaccion = getDateTime();
                    switch (paymentOption) {
                        case ConsignmentPaymentOptions.Pagado:

                            sql = "";
                            sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_PAID = QTY, QTY = 0, LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND QTY > 0";
                            tx.executeSql(sql);

                            sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DOC_SERIE_TARGET, DOC_NUM_TARGET, DATE_TRANSACTION)" +
                                "  SELECT " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", SKU, QTY_PAID,'" + paymentOption + "', NULL, NULL, '" + fechaTransaccion + "'" +
                                "  FROM CONSIGNMENT_DETAIL_TEMP WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND QTY_PAID > 0";
                            tx.executeSql(sql);

                            callBack();
                            break;

                        case ConsignmentPaymentOptions.ReConsignar:
                            var qtyResultado;
                            var fechaVencimiento = PagoConsignacionesControlador.FechaVencimientoReconsignacion;


                            var agregarAHistoricoDeTrazabilidad = function (callBackHist, errorCallBackHist) {
                                sql = "SELECT SKU, QTY_RECONSIGNED, HANDLE_SERIAL, SERIAL_NUMBER FROM CONSIGNMENT_DETAIL_TEMP  WHERE CONSIGNMENT_ID = " + parseInt(consignmentId);

                                SONDA_DB_Session.transaction(function (trans) {
                                    trans.executeSql(sql, [],
                                        function (trans2, results) {
                                            if (results.rows.length > 0) {
                                                for (var i = 0; i < results.rows.length; i++) {
                                                    var sku = results.rows.item(i);
                                                    sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DOC_SERIE_TARGET, DOC_NUM_TARGET, DATE_TRANSACTION, HANDLE_SERIAL, SERIAL_NUMBER)" +
                                                        "  VALUES( " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", '" + sku.SKU + "', " + parseInt(sku.QTY_RECONSIGNED) + ",'" + paymentOption + "', NULL, NULL, '" + fechaTransaccion + "', " + sku.HANDLE_SERIAL + " , '" + sku.SERIAL_NUMBER + "' )";
                                                    trans2.executeSql(sql);
                                                }
                                                callBackHist();
                                            } else {
                                                error1 = "Lo sentimos, no se pudo actualizar la trazabilidad de la consignación.";
                                                errorCallBackHist(error1);
                                            }
                                        }, function (errorTrans, trans2) {
                                            if (errorTrans.code !== 0) {
                                                error1 = "Lo sentimos, no se pudo actualizar la trazabilidad de la consignación debido a: " + errorTrans.message;
                                                errorCallBackHist(error1);
                                            }
                                        });
                                }, function (err) {
                                    if (err.code !== 0) {
                                        error1 = "No se pudo actualizar la trazabilidad de la consignación debido a: " + err.message;
                                        errorCallBackHist(error1);
                                    }
                                });
                            };

                            ObtenerListaDePreciosDeCliente(gClientCode, function (priceList) {
                                sql = "SELECT SKU, HANDLE_SERIAL, SERIAL_NUMBER FROM CONSIGNMENT_DETAIL_TEMP  WHERE CONSIGNMENT_ID = " + parseInt(consignmentId);
                                SONDA_DB_Session.transaction(
                                    function (tx2) {
                                        tx2.executeSql(sql, [], function (tx3, results) {
                                            if (results.rows.length > 0) {
                                                qtyResultado = results.rows.length;
                                                for (var i = 0; i < results.rows.length; i++) {
                                                    var sku = results.rows.item(i);
                                                    ObtenerSkuPorListaDePrecios(priceList, sku, function (skuReturn, indice, skuOriginal) {
                                                        if (parseFloat(skuReturn.SKU_PRICE) > 0) {
                                                            SONDA_DB_Session.transaction(
                                                                function (tx4) {

                                                                    sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_RECONSIGNED = QTY, " +
                                                                        "QTY = 0, LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END, PRICE_SKU_FOR_RECONSIGN = '" + parseFloat(skuReturn.SKU_PRICE) +
                                                                        "', DUE_DATE_CONSIGNMENT = '" + fechaVencimiento + "'  WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + skuReturn.SKU + "' AND QTY > 0 " + (skuOriginal.HANDLE_SERIAL === 1 ? " AND SERIAL_NUMBER = '" + skuOriginal.SERIAL_NUMBER + "' " : "");
                                                                    tx4.executeSql(sql);
                                                                    if (indice === qtyResultado - 1) {
                                                                        agregarAHistoricoDeTrazabilidad(function () {
                                                                            callBack();
                                                                        }, function (error) {
                                                                            errorCallBack(error);
                                                                        });
                                                                    }
                                                                }, function (err) {
                                                                    if (err.code !== 0) {
                                                                        errorCallBack("Error al procesar el SKU debido a: " + err.message);
                                                                    }
                                                                });
                                                        }
                                                    }, function (error) {
                                                        errorCallBack("No se pudo procesar el SKU debido a: " + error);
                                                    }, i);

                                                }
                                            } else {
                                                callBack();
                                            }
                                        }, function (tx3, err) {
                                            if (err.code !== 0) {
                                                errorCallBack("No se pudieron obtener los skus debido a: " + err.message);
                                            }
                                        });
                                    }, function (err) {
                                        if (err.code !== 0) {
                                            errorCallBack("No se pudieron obtener los skus debido a: " + err.message);
                                        }
                                    });

                            }, function (error) {
                                errorCallBack("No se pudo procesar el SKU debido a: " + error);

                            });
                            break;

                        case ConsignmentPaymentOptions.Recoger:
                            var statusKusRecollected = CantidadSkuARecogerProductoEnConsignacionControlador.EstadoSku;
                            var fecha = getDateTime().toString();
                            sql = "";
                            sql = "SELECT SKU, QTY, PRICE, HANDLE_SERIAL, SERIAL_NUMBER FROM CONSIGNMENT_DETAIL_TEMP WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND QTY > 0";
                            tx.executeSql(sql, [], function (tx2, results) {
                                if (results.rows.length > 0) {
                                    for (var i = 0; i < results.rows.length; i++) {
                                        var sku = results.rows.item(i);
                                        sql = "INSERT INTO SKU_COLLECTED_DETAIL(CODE_SKU, QTY_SKU, IS_GOOD_STATE, LAST_UPDATE, LAST_UPDATE_BY, SOURCE_DOC_TYPE, SOURCE_DOC_NUM, TOTAL_AMOUNT, HANDLE_SERIAL, SERIAL_NUMBER) " +
                                               "VALUES('" + sku.SKU + "', " + parseInt(sku.QTY) + ", " + parseInt(statusKusRecollected) + ", '" + fecha + "','" + gLastLogin + "','CONSIGNMENT', " + parseInt(consignmentId) + ", " + (parseInt(sku.QTY) * parseFloat(sku.PRICE)) + ", " + sku.HANDLE_SERIAL + ", '" + sku.SERIAL_NUMBER + "')";
                                        tx2.executeSql(sql);

                                        if (i === results.rows.length - 1) {
                                            sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_RECOLLECTED = QTY, QTY = 0, LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND QTY > 0";
                                            tx2.executeSql(sql);

                                            sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DOC_SERIE_TARGET, DOC_NUM_TARGET, DATE_TRANSACTION, HANDLE_SERIAL, SERIAL_NUMBER)" +
                                                "  SELECT " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", SKU, QTY_RECOLLECTED,'" + paymentOption + "', NULL, NULL, '" + fechaTransaccion + "',HANDLE_SERIAL, SERIAL_NUMBER " +
                                                "  FROM CONSIGNMENT_DETAIL_TEMP WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND QTY_RECOLLECTED > 0";
                                            tx2.executeSql(sql);

                                            callBack();
                                        }
                                    }
                                } else {
                                    error1 = "No hay SKUS para procesar, por favor, verifique y vuelva a intentar.";
                                    errorCallBack(error1);
                                }
                            }, function (tx2, err) {
                                if (err.code !== 0) {
                                    error1 = "No se pudieron procesar los SKU(s) de la consignación actual debido a: " + err.message;
                                    errorCallBack(error1);
                                }
                            });
                            break;
                    }

                }, function (err) {
                    if (err.code !== 0) {
                        errorCallBack("No se pudo actualizar la consignacion debido a: " + err.message);
                    }
                });
        } catch (e) {
            errorCallBack("No se pudo actualizar la consignacion debido a: " + e.message);
        }
    }
    ,
    MarcarLineaDeConsignacion: function (consignmentId, codeSku, qtySku, paymentOption, handleSerial, serialNumber, callBack, errorCallBack, indice) {
        try {
            var sql = "";
            var errorGeneral = "";
            var docSerie = PagoConsignacionesControlador.serieDocumento;
            var docNum = PagoConsignacionesControlador.serieNumero;
            var fechaTransaccion = getDateTime();

            var skuPrice = CantidadSkuEnConsignacionControlador.SkuPriceForReconsign;
            SONDA_DB_Session.transaction(
                function (tx) {

                    switch (paymentOption) {
                        case ConsignmentPaymentOptions.Pagado:
                            sql = "";
                            if (handleSerial === 1) {

                                sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_PAID = (QTY_PAID + " + parseInt(qtySku) + "), QTY = (QTY - " + parseInt(qtySku) + "),  LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND SERIAL_NUMBER = '" + serialNumber + "' ";
                                tx.executeSql(sql);

                                sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DATE_TRANSACTION, HANDLE_SERIAL, SERIAL_NUMBER)" +
                                    "  VALUES( " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", '" + codeSku + "', " + parseInt(qtySku) + ",'" + paymentOption + "', '" + fechaTransaccion + "'," + handleSerial + ", '" + serialNumber + "' )";
                                tx.executeSql(sql);

                                callBack(indice);
                            } else {

                                sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_PAID = (QTY_PAID + " + parseInt(qtySku) + "), QTY = (QTY - " + parseInt(qtySku) + "),  LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' ";
                                tx.executeSql(sql);

                                sql = "SELECT SKU FROM HISTORICAL_TRACEABILITY_CONSIGNMENT WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + paymentOption + "' ";
                                tx.executeSql(sql, [],
                                    function (trans, results) {
                                        if (results.rows.length > 0) {
                                            if (results.rows.item(0).SKU !== null || results.rows.item(0).SKU !== undefined) {
                                                sql = "UPDATE HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                    "SET QTY = (QTY + " + parseInt(qtySku) + "),  DATE_TRANSACTION = '" + fechaTransaccion + "' " +
                                                    "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " " +
                                                    "AND SKU ='" + codeSku + "' " +
                                                    "AND ACTION = '" + paymentOption + "' " +
                                                    "AND DOC_SERIE_SOURCE = '" + docSerie + "' " +
                                                    "AND DOC_NUM_SOURCE = " + parseInt(docNum);
                                                trans.executeSql(sql);
                                                callBack();
                                            }
                                        } else {
                                            sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DATE_TRANSACTION)" +
                                                "  VALUES( " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", '" + codeSku + "', " + parseInt(qtySku) + ",'" + paymentOption + "', '" + fechaTransaccion + "' )";
                                            trans.executeSql(sql);
                                            callBack();
                                        }
                                    }, function (err, trans) {
                                        if (err.code !== 0) {
                                            errorGeneral = "No se pudo actualizar la trazabilidad del SKU debido a: " + err.message;
                                            errorCallBack(errorGeneral);
                                        }
                                    });

                            }

                            break;
                        case ConsignmentPaymentOptions.ReConsignar:
                            sql = "";
                            if (handleSerial === 1) {

                                sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_RECONSIGNED = (QTY_RECONSIGNED + " + parseInt(qtySku) + "), QTY = (QTY - " + parseInt(qtySku) + "), PRICE_SKU_FOR_RECONSIGN = " + skuPrice + ",  LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND SERIAL_NUMBER='" + serialNumber + "' ";
                                tx.executeSql(sql);

                                sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DATE_TRANSACTION, HANDLE_SERIAL, SERIAL_NUMBER)" +
                                    "  VALUES( " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", '" + codeSku + "', " + parseInt(qtySku) + ",'" + paymentOption + "', '" + fechaTransaccion + "'," + handleSerial + ", '" + serialNumber + "' )";
                                tx.executeSql(sql);

                                callBack(indice);

                            } else {
                                sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_RECONSIGNED = (QTY_RECONSIGNED + " + parseInt(qtySku) + "), QTY = (QTY - " + parseInt(qtySku) + "), PRICE_SKU_FOR_RECONSIGN = " + skuPrice + ",  LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' ";
                                tx.executeSql(sql);

                                sql = "SELECT SKU FROM HISTORICAL_TRACEABILITY_CONSIGNMENT WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + paymentOption + "' ";
                                tx.executeSql(sql, [],
                                    function (trans, results) {
                                        if (results.rows.length > 0) {
                                            if (results.rows.item(0).SKU !== null || results.rows.item(0).SKU !== undefined) {
                                                sql = "UPDATE HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                    "SET QTY = (QTY + " + parseInt(qtySku) + "),  DATE_TRANSACTION = '" + fechaTransaccion + "' " +
                                                    "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " " +
                                                    "AND SKU ='" + codeSku + "' " +
                                                    "AND ACTION = '" + paymentOption + "' " +
                                                    "AND DOC_SERIE_SOURCE = '" + docSerie + "' " +
                                                    "AND DOC_NUM_SOURCE = " + parseInt(docNum);
                                                trans.executeSql(sql);
                                                callBack();
                                            }
                                        } else {
                                            sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DATE_TRANSACTION)" +
                                                "  VALUES( " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", '" + codeSku + "', " + parseInt(qtySku) + ",'" + paymentOption + "', '" + fechaTransaccion + "' )";
                                            trans.executeSql(sql);
                                            callBack();
                                        }
                                    }, function (err, trans) {
                                        if (err.code !== 0) {
                                            errorGeneral = "No se pudo actualizar la trazabilidad del SKU debido a: " + err.message;
                                            errorCallBack(errorGeneral);
                                        }
                                    });
                            }

                            break;
                        case ConsignmentPaymentOptions.Recoger:
                            var status = CantidadSkuARecogerProductoEnConsignacionControlador.EstadoSku;
                            var fecha = getDateTime().toString();
                            var priceSku = CantidadSkuARecogerProductoEnConsignacionControlador.SkuPrice;
                            sql = "";
                            if (handleSerial === 1) {

                                sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_RECOLLECTED = (QTY_RECOLLECTED + " + parseInt(qtySku) + "), QTY = (QTY - " + parseInt(qtySku) + "), LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND SERIAL_NUMBER='" + serialNumber + "'";
                                tx.executeSql(sql);

                                sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DATE_TRANSACTION, HANDLE_SERIAL, SERIAL_NUMBER)" +
                                    " VALUES( " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", '" + codeSku + "', " + parseInt(qtySku) + ",'" + paymentOption + "', '" + fechaTransaccion + "'," + handleSerial + ", '" + serialNumber + "' )";
                                tx.executeSql(sql);

                                sql = "INSERT INTO SKU_COLLECTED_DETAIL(CODE_SKU, QTY_SKU, IS_GOOD_STATE, LAST_UPDATE, LAST_UPDATE_BY, SOURCE_DOC_TYPE, SOURCE_DOC_NUM, TOTAL_AMOUNT, SKU_PRICE, HANDLE_SERIAL, SERIAL_NUMBER) " +
                                    "VALUES('" + codeSku + "', " + parseInt(qtySku) + ", " + parseInt(status) + ", '" + fecha + "','" + gLastLogin + "','CONSIGNMENT', " + parseInt(consignmentId) + ", " + (parseInt(qtySku) * parseFloat(priceSku)) + ", " + parseFloat(priceSku) + ", " + handleSerial + ", '" + serialNumber + "')";
                                tx.executeSql(sql);

                                callBack(indice);

                            } else {
                                var actualizarTrazabilidad = function (callBackReturn, errorCallBackReturn) {
                                    SONDA_DB_Session.transaction(function (trans) {
                                        sql = "SELECT SKU FROM HISTORICAL_TRACEABILITY_CONSIGNMENT WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + paymentOption + "' ";
                                        trans.executeSql(sql, [],
                                            function (trans, results) {
                                                if (results.rows.length > 0) {
                                                    if (results.rows.item(0).SKU !== null || results.rows.item(0).SKU !== undefined) {
                                                        sql = "UPDATE HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                            "SET QTY = (QTY + " + parseInt(qtySku) + "),  DATE_TRANSACTION = '" + fechaTransaccion + "' " +
                                                            "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " " +
                                                            "AND SKU ='" + codeSku + "' " +
                                                            "AND ACTION = '" + paymentOption + "' " +
                                                            "AND DOC_SERIE_SOURCE = '" + docSerie + "' " +
                                                            "AND DOC_NUM_SOURCE = " + parseInt(docNum);
                                                        trans.executeSql(sql);
                                                        callBackReturn();
                                                    }
                                                } else {
                                                    sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION, DATE_TRANSACTION)" +
                                                        "  VALUES( " + parseInt(consignmentId) + ", '" + docSerie + "', " + parseInt(docNum) + ", '" + codeSku + "', " + parseInt(qtySku) + ",'" + paymentOption + "', '" + fechaTransaccion + "' )";
                                                    trans.executeSql(sql);
                                                    callBackReturn();
                                                }
                                            }, function (err, trans) {
                                                if (err.code !== 0) {
                                                    errorGeneral = "No se pudo actualizar la trazabilidad del SKU debido a: " + err.message;
                                                    errorCallBackReturn(errorGeneral);
                                                }
                                            });
                                    }, function (error) {
                                        if (error.code !== 0) {
                                            errorGeneral = "No se pudo actualizar la trazabilidad del SKU debido a: " + error.message;
                                            errorCallBackReturn(errorGeneral);
                                        }
                                    });
                                };


                                sql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET QTY_RECOLLECTED = (QTY_RECOLLECTED + " + parseInt(qtySku) + "), QTY = (QTY - " + parseInt(qtySku) + "), LAST_PAYMENT_OPTION = CASE WHEN LAST_PAYMENT_OPTION IS NULL THEN '" + paymentOption + "' ELSE (LAST_PAYMENT_OPTION || ',' || '" + paymentOption + "') END WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' ";
                                tx.executeSql(sql);

                                sql = "SELECT 1 AS EXISTE FROM SKU_COLLECTED_DETAIL WHERE CODE_SKU = '" + codeSku + "' AND IS_GOOD_STATE = " + parseInt(status) + " AND SOURCE_DOC_NUM = " + parseInt(consignmentId);
                                tx.executeSql(sql, [], function (tx2, results) {
                                    if (results.rows.length > 0) {
                                        if (parseInt(results.rows.item(0).EXISTE) === 1) {
                                            sql = "UPDATE SKU_COLLECTED_DETAIL SET QTY_SKU = (QTY_SKU + " + parseInt(qtySku) + "), LAST_UPDATE = '" + fecha + "', LAST_UPDATE_BY = '" + gLastLogin + "',TOTAL_AMOUNT = TOTAL_AMOUNT + " + (parseInt(qtySku) * parseFloat(priceSku)) +
                                                " WHERE SOURCE_DOC_NUM = " + parseInt(consignmentId) + " AND CODE_SKU = '" + codeSku + "' ";
                                            tx2.executeSql(sql);
                                            actualizarTrazabilidad(function () {
                                                callBack();
                                            }, function (error) {
                                                notify(error);
                                            });
                                        } else {
                                            sql = "INSERT INTO SKU_COLLECTED_DETAIL(CODE_SKU, QTY_SKU, IS_GOOD_STATE, LAST_UPDATE, LAST_UPDATE_BY, SOURCE_DOC_TYPE, SOURCE_DOC_NUM, TOTAL_AMOUNT, SKU_PRICE) " +
                                               "VALUES('" + codeSku + "', " + parseInt(qtySku) + ", " + parseInt(status) + ", '" + fecha + "','" + gLastLogin + "','CONSIGNMENT', " + parseInt(consignmentId) + ", " + (parseInt(qtySku) * parseFloat(priceSku)) + "," + parseFloat(priceSku) + ")";
                                            tx2.executeSql(sql);
                                            actualizarTrazabilidad(function () {
                                                callBack();
                                            }, function (error) {
                                                notify(error);
                                            });
                                        }
                                    } else {
                                        sql = "INSERT INTO SKU_COLLECTED_DETAIL(CODE_SKU, QTY_SKU, IS_GOOD_STATE, LAST_UPDATE, LAST_UPDATE_BY, SOURCE_DOC_TYPE, SOURCE_DOC_NUM, TOTAL_AMOUNT, SKU_PRICE) " +
                                               "VALUES('" + codeSku + "', " + parseInt(qtySku) + ", " + parseInt(status) + ", '" + fecha + "','" + gLastLogin + "','CONSIGNMENT', " + parseInt(consignmentId) + ", " + (parseInt(qtySku) * parseFloat(priceSku)) + ", " + parseFloat(priceSku) + ")";
                                        tx2.executeSql(sql);
                                        actualizarTrazabilidad(function () {
                                            callBack();
                                        }, function (error) {
                                            notify(error);
                                        });
                                    }
                                }, function (tx2, err) {
                                    if (err.code !== 0) {
                                        var error = "No se pudo obtener información del SKU seleccionado para actualizar el detalle de SKUS Recogidos, por favor, verifique y vuelva a intentar.";
                                        errorCallBack(error);
                                    }
                                });
                            }
                            break;
                    }
                }, function (tx, err) {
                    if (tx.code !== 0) {
                        errorCallBack("No se pudo actualizar el detalle de la consignacion debido a: " + err.message);
                    }
                });
        } catch (e) {
            errorCallBack("No se pudo actualizar el detalle de la consignacion debido a: " + e.message);
        }
    }
    ,
    RestablecerOpcionDePagoDeConsignacionCompleta: function (consignmentId, docSerie, docNum, callBack, errorCallBack) {
        var error = "";
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var psql = "";
                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                        "QTY = QTY + (QTY_PAID + QTY_RECONSIGNED + QTY_RECOLLECTED), QTY_PAID = 0, QTY_RECONSIGNED = 0, QTY_RECOLLECTED = 0, LAST_PAYMENT_OPTION = NULL,  PRICE_SKU_FOR_RECONSIGN = NULL " +
                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND (QTY_PAID > 0 OR QTY_RECONSIGNED > 0 OR QTY_RECOLLECTED > 0)";
                    tx.executeSql(psql);

                    psql = "DELETE FROM SKU_COLLECTED_DETAIL WHERE SOURCE_DOC_NUM = " + parseInt(consignmentId);
                    tx.executeSql(psql);

                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND DOC_SERIE_SOURCE = '" + docSerie + "' AND DOC_NUM_SOURCE = " + parseInt(docNum);
                    tx.executeSql(psql);

                    callBack();

                    psql = null;
                }, function (err) {
                    if (err.code !== 0) {
                        error = "Error al intentar Restablecer la informacion de pago de la consignacion debido a: " + err.message;
                        errorCallBack(error);
                        error = null;
                    }
                });
        } catch (e) {
            error = "Error al intentar Restablecer la informacion de pago de la consignacion debido a: " + e.message;
            errorCallBack(error);
            error = null;
        }
    }
    ,
    RestablecerOpcionDePagoDeDetalleDeconsignacion: function (consignmentId, codeSku, callBack, errorCallBack) {
        var error = "";
        try {
            var docSerie = PagoConsignacionesControlador.docSerieParaDetalle;
            var docNum = PagoConsignacionesControlador.docNumParaDetalle;
            var handleSerial = PagoConsignacionesControlador.handleSerial;
            var serialNumber = PagoConsignacionesControlador.SerialNumber;

            var generarOpcionesDePago = function (opciones, returnCallBack) {
                var lastPaymentOptions = "";
                for (var i = 0; i < opciones.length; i++) {
                    if (lastPaymentOptions === "") {
                        lastPaymentOptions = opciones[i];
                    } else {
                        lastPaymentOptions += "," + opciones[i];
                    }
                }
                returnCallBack(lastPaymentOptions);
            };

            SONDA_DB_Session.transaction(
                function (tx) {
                    var sql = "";
                    if (handleSerial === 1) {
                        sql = "SELECT LAST_PAYMENT_OPTION FROM CONSIGNMENT_DETAIL_TEMP WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND SERIAL_NUMBER='" + serialNumber + "'";
                    } else {
                        sql = "SELECT LAST_PAYMENT_OPTION FROM CONSIGNMENT_DETAIL_TEMP WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "'";
                    }

                    tx.executeSql(sql, []
                        , function (tx, results) {
                            if (results.rows.length > 0) {
                                var psql = "";

                                if (results.rows.item(0).LAST_PAYMENT_OPTION === null) {
                                    error = "El SKU seleccionado no posee informacion de pago alguna.";
                                    errorCallBack(error);
                                    error = null;
                                } else {
                                    if (results.rows.item(0).LAST_PAYMENT_OPTION.toString().indexOf(",") !== -1) {
                                        var opcionesDePago = results.rows.item(0).LAST_PAYMENT_OPTION.toString().split(",");
                                        opcionesDePago.reverse();

                                        switch (opcionesDePago[0]) {
                                            case ConsignmentPaymentOptions.Pagado:
                                                opcionesDePago.splice(0, 1);
                                                generarOpcionesDePago(opcionesDePago, function (opcionesGeneradas) {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                        "QTY = (QTY + QTY_PAID), QTY_PAID = 0, LAST_PAYMENT_OPTION = '" + opcionesGeneradas +
                                                        "' WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.Pagado + "' ";
                                                    tx.executeSql(psql);

                                                    psql = null;
                                                    callBack();
                                                });
                                                break;
                                            case ConsignmentPaymentOptions.ReConsignar:
                                                opcionesDePago.splice(0, 1);
                                                generarOpcionesDePago(opcionesDePago, function (opcionesGeneradas) {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                        "QTY = (QTY + QTY_RECONSIGNED), QTY_RECONSIGNED = 0, LAST_PAYMENT_OPTION = '" + opcionesGeneradas +
                                                        "' WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.ReConsignar + "' ";
                                                    tx.executeSql(psql);
                                                    psql = null;
                                                    callBack();
                                                });

                                                break;
                                            case ConsignmentPaymentOptions.Recoger:
                                                opcionesDePago.splice(0, 1);
                                                generarOpcionesDePago(opcionesDePago, function (opcionesGeneradas) {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                        "QTY = (QTY + QTY_RECOLLECTED), QTY_RECOLLECTED = 0, LAST_PAYMENT_OPTION = '" + opcionesGeneradas +
                                                        "' WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM SKU_COLLECTED_DETAIL WHERE CODE_SKU = '" + codeSku + "' AND  SOURCE_DOC_NUM = " + parseInt(consignmentId);
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.Recoger + "' ";
                                                    tx.executeSql(psql);

                                                    callBack();
                                                });
                                                break;
                                        }

                                    } else {
                                        switch (results.rows.item(0).LAST_PAYMENT_OPTION) {
                                            case ConsignmentPaymentOptions.Pagado:
                                                if (handleSerial === 1) {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                     "QTY = (QTY + QTY_PAID), QTY_PAID = 0, LAST_PAYMENT_OPTION = NULL " +
                                                     "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND SERIAL_NUMBER='" + serialNumber + "'";

                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                    "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.Pagado + "' AND SERIAL_NUMBER='" + serialNumber + "'";
                                                    tx.executeSql(psql);

                                                    callBack();
                                                    psql = null;

                                                } else {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                     "QTY = (QTY + QTY_PAID), QTY_PAID = 0, LAST_PAYMENT_OPTION = NULL " +
                                                     "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "'";

                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                    "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.Pagado + "' ";
                                                    tx.executeSql(psql);

                                                    callBack();
                                                    psql = null;
                                                }

                                                break;
                                            case ConsignmentPaymentOptions.ReConsignar:

                                                if (handleSerial === 1) {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                      "QTY = (QTY + QTY_RECONSIGNED), QTY_RECONSIGNED = 0, LAST_PAYMENT_OPTION = NULL " +
                                                      "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND SERIAL_NUMBER='" + serialNumber + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.ReConsignar + "' AND SERIAL_NUMBER='" + serialNumber + "'";
                                                    tx.executeSql(psql);

                                                    callBack();
                                                    psql = null;
                                                } else {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                       "QTY = (QTY + QTY_RECONSIGNED), QTY_RECONSIGNED = 0, LAST_PAYMENT_OPTION = NULL " +
                                                       "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.ReConsignar + "' ";
                                                    tx.executeSql(psql);

                                                    callBack();
                                                    psql = null;
                                                }

                                                break;
                                            case ConsignmentPaymentOptions.Recoger:
                                                if (handleSerial) {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                        "QTY = (QTY + QTY_RECOLLECTED), QTY_RECOLLECTED = 0, LAST_PAYMENT_OPTION = NULL " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND SERIAL_NUMBER='" + serialNumber + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM SKU_COLLECTED_DETAIL WHERE CODE_SKU = '" + codeSku + "' AND  SOURCE_DOC_NUM = " + parseInt(consignmentId) + " AND SERIAL_NUMBER='" + serialNumber + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.Recoger + "' AND SERIAL_NUMBER='" + + "'";
                                                    tx.executeSql(psql);

                                                    callBack();
                                                    psql = null;
                                                } else {
                                                    psql = "UPDATE CONSIGNMENT_DETAIL_TEMP SET " +
                                                        "QTY = (QTY + QTY_RECOLLECTED), QTY_RECOLLECTED = 0, LAST_PAYMENT_OPTION = NULL " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "'";
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM SKU_COLLECTED_DETAIL WHERE CODE_SKU = '" + codeSku + "' AND  SOURCE_DOC_NUM = " + parseInt(consignmentId);
                                                    tx.executeSql(psql);

                                                    psql = "DELETE FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
                                                        "WHERE CONSIGNMENT_ID = " + parseInt(consignmentId) + " AND SKU = '" + codeSku + "' AND ACTION = '" + ConsignmentPaymentOptions.Recoger + "' ";
                                                    tx.executeSql(psql);

                                                    callBack();
                                                    psql = null;
                                                }

                                                break;
                                        }
                                    }
                                }
                            }
                        }, function (err) {
                            if (err.code !== 0) {
                                error = "Error al Restablecer la informacion de pago del SKU seleccionado debido a: " + err.message;
                                errorCallBack(error);
                            }
                        });
                }, function (tx, err) {
                    if (err.code !== 0) {
                        error = "Error al intentar Restablecer la informacion de pago de pago del SKU seleccionado debido a: " + err.message;
                        errorCallBack(error);
                        error = null;
                    }
                });
        } catch (e) {
            error = "Error al intentar Restablecer la informacion de pago del SKU seleccionado debido a: " + e.message;
            errorCallBack(error);
            error = null;
        }
    }
    ,
    ObtenerTotalesDeDetalleTemporal: function (callBack, errorCallBack) {
        var error = "";
        try {
            var psql = "";
            SONDA_DB_Session.transaction(
                function (tx) {
                    psql = "SELECT IFNULL(SUM(QTY_PAID * PRICE),0) AS TOTAL_PAID, IFNULL(SUM(QTY_RECONSIGNED * PRICE),0) AS TOTAL_RECONSIGNED, IFNULL(SUM(QTY_RECOLLECTED * PRICE),0) AS TOTAL_RECOLLECTED FROM CONSIGNMENT_DETAIL_TEMP";
                    tx.executeSql(psql, [], function (tx, results) {
                        if (results.rows.length > 0) {
                            var totales = results.rows.item(0);
                            callBack(totales);
                            totales = null;
                        }
                    }, function (tx, err) {
                        if (err.code !== 0) {
                            errorCallBack(err.message);
                        }
                    });
                },
                function (tx, err) {
                    if (err.code !== 0) {
                        error = "No se pudo obtener la informacion de SKUS debido a: " + err.message;
                        errorCallBack(error);
                    }
                },
                function () {
                    //....
                });
        } catch (e) {
            error = "Error al intentar obtener los SKUS debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    ObtenerDetalleDeConsignacionesParaFinalizarProcesoDeCobro: function (callBack, errorCallBack) {
        var error = "";
        try {
            var detalleConsignacion = new Array();
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "SELECT " +
                    "CONSIGNMENT_ID, " +
                    "SKU, " +
                    "QTY, " +
                    "QTY_PAID, " +
                    "QTY_RECONSIGNED, " +
                    "QTY_RECOLLECTED, " +
                    "LAST_PAYMENT_OPTION, " +
                    "PRICE, " +
                    "PRICE_SKU_FOR_RECONSIGN, HANDLE_SERIAL, SERIAL_NUMBER " +
                    "FROM CONSIGNMENT_DETAIL_TEMP";


                tx.executeSql(sql, [], function (tx2, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var sku = {
                            CONSIGNMENT_ID: results.rows.item(i).CONSIGNMENT_ID,
                            SKU: results.rows.item(i).SKU,
                            QTY: results.rows.item(i).QTY,
                            QTY_PAID: results.rows.item(i).QTY_PAID,
                            QTY_RECONSIGNED: results.rows.item(i).QTY_RECONSIGNED,
                            QTY_RECOLLECTED: results.rows.item(i).QTY_RECOLLECTED,
                            LAST_PAYMENT_OPTION: results.rows.item(i).LAST_PAYMENT_OPTION,
                            PRICE: results.rows.item(i).PRICE,
                            PRICE_SKU_FOR_RECONSIGN: results.rows.item(i).PRICE_SKU_FOR_RECONSIGN,
                            HANDLE_SERIAL: results.rows.item(i).HANDLE_SERIAL,
                            SERIAL_NUMBER: results.rows.item(i).SERIAL_NUMBER
                        }
                        detalleConsignacion.push(sku);
                    }
                    callBack(detalleConsignacion);
                }, function (tx2, err) {
                    if (err.code !== 0) {
                        error = "Error al obtener los SKU para Procedimiento de Pago debido a: " + err.message;
                        errorCallBack(error);
                    }
                });
            }, function (err) {
                if (err.code !== 0) {
                    error = "No se pudieron obtener los SKUS para finalizacion de Procedimiento de Pago debido a: " + err.message;
                    errorCallBack(error);
                }
            });
        } catch (e) {
            error = "No se pudieron obtener los SKUS para finalizacion de Procedimiento de Pago debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    CalcularFechaDeVencimientoDeReconsignacion: function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(function (tx) {
                sql = "SELECT VALUE FROM PARAMETERS WHERE GROUP_ID = 'CONSIGNMENT' AND PARAMETER_ID = 'DUE_DATE_CONSIGNMENT' ";
                tx.executeSql(sql, [], function (tx2, results) {
                    if (results.rows.length > 0) {
                        if (results.rows.item(0).VALUE === null || results.rows.item(0).VALUE === "NULL") {
                            errorCallBack("No se encontro el parametro necesario para calcular la fecha de vencimiento de la Consignacion, por favor, contacte a su Administrador de Sonda");
                        } else {
                            if (parseInt(results.rows.item(0).VALUE) === 0 || parseInt(results.rows.item(0).VALUE) < 0) {
                                errorCallBack("El parametro necesario para calcular la fecha de vencimiento de la Consignacion es Cero, por favor, contacte a su Administrador de Sonda");
                            } else {

                                sql = "SELECT DateTime('Now', 'LocalTime', '+" + parseInt(results.rows.item(0).VALUE) + " Day') AS DUE_DATE_CONSIGNMENT";

                                tx2.executeSql(sql, [], function (tx3, results2) {
                                    if (results2.rows.length > 0) {
                                        if (results2.rows.item(0).DUE_DATE_CONSIGNMENT !== null || results2.rows.item(0).DUE_DATE_CONSIGNMENT !== "NULL" || results2.rows.item(0).DUE_DATE_CONSIGNMENT !== undefined) {
                                            callBack(results2.rows.item(0).DUE_DATE_CONSIGNMENT);
                                        } else {
                                            errorCallBack("No se pudo calcular la Fecha de Vencimiento de la Consignación.");
                                        }
                                    } else {
                                        errorCallBack("No se pudo calcular la Fecha de Vencimiento de la Consignación.");
                                    }
                                }, function (tx3, err) {
                                    if (err.code !== 0) {
                                        errorCallBack("No se pudo calcular la Fecha de Vencimiento de la Consignación debido a: " + err.message);
                                    }
                                });
                            }
                        }
                    }
                }, function (tx2, err) {
                    if (err.code !== 0) {
                        errorCallBack("No se pudo obtener el parámetro para calcular la Fecha de Vencimiento de la Consignación debido a: " + err.message);
                    }
                });
            }, function (err) {
                if (err.code !== 0) {
                    errorCallBack("Error al calcular la Fecha de Vencimiento debido a: " + err.message);
                }
            });
        } catch (e) {
            errorCallBack("Error al intentar calcular la Fecha de Vencimiento debido a: " + e.message);
        }
    }
    ,
    AgregarSkuAReconsignacion: function (sku, errorCallBack) {
        var error = "";
        try {
            var sql = "";
            var fecha = getDateTime().toString();
            SONDA_DB_Session.transaction(
                function (tx) {

                    if (sku.HANDLE_SERIAL === 1 || sku.HANDLE_SERIAL === "1") {
                        sql = " INSERT INTO CONSIGNMENT_DETAIL(";
                        sql += "SKU, ";
                        sql += "LINE_NUM,";
                        sql += "QTY, ";
                        sql += "PRICE, ";
                        sql += "DISCOUNT, ";
                        sql += "TOTAL_LINE, ";
                        sql += "POSTED_DATETIME, " +
                            "HANDLE_SERIAL, " +
                            "SERIAL_NUMBER ";
                        sql += ") VALUES (";
                        sql += " '" + sku.SKU + "' ";
                        sql += ", " + PagoConsignacionesServicio.NumeroDeLineaDeDetalleSkuEnReconsignacion;
                        sql += ", " + sku.QTY_RECONSIGNED;
                        sql += ", " + sku.PRICE_SKU_FOR_RECONSIGN;
                        sql += ", " + 0;
                        sql += ", " + (sku.QTY_RECONSIGNED * sku.PRICE_SKU_FOR_RECONSIGN);
                        sql += ", '" + fecha + "', " + sku.HANDLE_SERIAL + ", '" + sku.SERIAL_NUMBER + "' )";
                        tx.executeSql(sql);
                        PagoConsignacionesServicio.NumeroDeLineaDeDetalleSkuEnReconsignacion++;
                    } else {
                        sql = "SELECT 1 AS EXISTE, LINE_NUM FROM CONSIGNMENT_DETAIL WHERE CONSIGNMENT_ID IS NULL AND SKU = '" + sku.SKU + "'";
                        tx.executeSql(sql, [],
                            function (tx2, results) {
                                if (results.rows.length > 0) {
                                    if (parseInt(results.rows.item(0).EXISTE) === 1) {

                                        sql = "UPDATE CONSIGNMENT_DETAIL SET QTY = (QTY + " + sku.QTY_RECONSIGNED + "), TOTAL_LINE = (TOTAL_LINE + " + (sku.QTY_RECONSIGNED * sku.PRICE_SKU_FOR_RECONSIGN) + ") WHERE CONSIGNMENT_ID IS NULL AND SKU='" + sku.SKU + "' ";
                                        tx2.executeSql(sql);

                                    } else if (parseInt(results.rows.item(0).EXISTE) === 0) {
                                        sql = " INSERT INTO CONSIGNMENT_DETAIL(";
                                        sql += "SKU, ";
                                        sql += "LINE_NUM,";
                                        sql += "QTY, ";
                                        sql += "PRICE, ";
                                        sql += "DISCOUNT, ";
                                        sql += "TOTAL_LINE, ";
                                        sql += "POSTED_DATETIME, HANDLE_SERIAL";
                                        sql += ") VALUES (";
                                        sql += " '" + sku.SKU + "' ";
                                        sql += ", " + PagoConsignacionesServicio.NumeroDeLineaDeDetalleSkuEnReconsignacion;
                                        sql += ", " + sku.QTY_RECONSIGNED;
                                        sql += ", " + sku.PRICE_SKU_FOR_RECONSIGN;
                                        sql += ", " + 0;
                                        sql += ", " + (sku.QTY_RECONSIGNED * sku.PRICE_SKU_FOR_RECONSIGN);
                                        sql += ", '" + fecha + "',0 )";
                                        tx2.executeSql(sql);
                                        PagoConsignacionesServicio.NumeroDeLineaDeDetalleSkuEnReconsignacion++;
                                    }
                                } else {
                                    sql = " INSERT INTO CONSIGNMENT_DETAIL(";
                                    sql += "SKU, ";
                                    sql += "LINE_NUM,";
                                    sql += "QTY, ";
                                    sql += "PRICE, ";
                                    sql += "DISCOUNT, ";
                                    sql += "TOTAL_LINE, ";
                                    sql += "POSTED_DATETIME, HANDLE_SERIAL ";
                                    sql += ") VALUES (";
                                    sql += " '" + sku.SKU + "' ";
                                    sql += ", " + PagoConsignacionesServicio.NumeroDeLineaDeDetalleSkuEnReconsignacion;
                                    sql += ", " + sku.QTY_RECONSIGNED;
                                    sql += ", " + sku.PRICE_SKU_FOR_RECONSIGN;
                                    sql += ", " + 0;
                                    sql += ", " + (sku.QTY_RECONSIGNED * sku.PRICE_SKU_FOR_RECONSIGN);
                                    sql += ", '" + fecha + "',0 )";
                                    tx2.executeSql(sql);
                                    PagoConsignacionesServicio.NumeroDeLineaDeDetalleSkuEnReconsignacion++;
                                }
                            }, function (tx2, err) {
                                if (err.code !== 0) {
                                    error = "No se pudo actualizar la información del SKU en Reconsignación debido a: " + err.message;
                                    errorCallBack(error);
                                }
                            });
                    }

                }, function (err) {
                    if (err.code !== 0) {
                        error = "No se pudo agregar el sku a Reconsignación debido a: " + err.message;
                        errorCallBack(error);
                    }
                });
        } catch (e) {
            error = "No se pudo agregar el SKU a Reconsignación debido a:" + e.message;
            errorCallBack(error);
        }
    }
    ,
    NumeroDeLineaDeDetalleSkuEnReconsignacion: 0
    ,
    ObtenerFechaDeVencimientoDeReconsignaciones: function (callBack, errorCallBack) {
        var error = "";
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "SELECT MAX(DUE_DATE_CONSIGNMENT) AS DUE_DATE_CONSIGNMENT FROM CONSIGNMENT_DETAIL_TEMP";
                tx.executeSql(sql, [], function (tx2, results) {
                    if (results.rows.length > 0) {
                        if (results.rows.item(0).DUE_DATE_CONSIGNMENT === "" || results.rows.item(0).DUE_DATE_CONSIGNMENT === null) {
                            error = "No existe Fecha de Vencimiento para la Reconsignación actual, devolviendo fecha actual.";
                            callBack(results.rows.item(0).DUE_DATE_CONSIGNMENT);
                        } else {
                            callBack(results.rows.item(0).DUE_DATE_CONSIGNMENT);
                        }
                    }
                }, function (tx2, err) { });
            }, function (err) { });
        } catch (e) {
            error = "Error al intentar obtener la fecha de vencimiento de la Reconsignación debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    ActualizarDetalleDeReconsignacion: function (consignmentId, callBack, errorCallBack) {
        var error = "";
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "UPDATE CONSIGNMENT_DETAIL SET CONSIGNMENT_ID = " + consignmentId + " WHERE CONSIGNMENT_ID IS NULL";
                tx.executeSql(sql);
                callBack();
            }, function (err) {
                if (err.code !== 0) {
                    error = "No se pudo actualizar el detalle de la Reconsignación debido a: " + err.message;
                    errorCallBack(error);
                }
            });
        } catch (e) {
            error = "Error al intentar actualizar el detalle de la Reconsignación actual debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    ObtenerConsignacionesParaCambioDeEstatus: function (callBack, errorCallBack) {
        var error = "";
        try {
            var consignaciones = new Array();
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "SELECT DISTINCT CONSIGNMENT_ID FROM CONSIGNMENT_DETAIL_TEMP";
                tx.executeSql(sql, [], function (tx2, results) {
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            consignaciones.push(parseInt(results.rows.item(i).CONSIGNMENT_ID));
                        }
                        callBack(consignaciones);
                    }
                }, function (tx2, err) {
                    if (err.code !== 0) {
                        error = "No se pudieron obtener la Consignaciones Anteriores debido a: " + err.message;
                        errorCallBack(error);
                    }
                });
            }, function (err) {
                if (err.code !== 0) {
                    error = "No se pudieron obtener las Consignaciones Anteriores debido a: " + err.message;
                    errorCallBack(error);
                }
            });
        } catch (e) {
            error = "Error al intentar obtener las Consignaciones antiguas para procesar el STATUS de las mismas debido a:" + e.message;
            errorCallBack(error);
        }
    }
    ,
    ValidarSequenciaDeDocumentos: function (tipoDeDocumento, callBack, errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    sql = "SELECT 1 AS VALIDA FROM DOCUMENT_SEQUENCE WHERE ((CURRENT_DOC + 1) >= DOC_FROM AND (CURRENT_DOC + 1) <= DOC_TO) AND DOC_TYPE = '" + tipoDeDocumento + "' ";
                    tx.executeSql(sql, [], function (tx2, results) {
                        if (results.rows.length > 0) {
                            if (parseInt(results.rows.item(0).VALIDA) === 1) {
                                callBack(true);
                            } else {
                                callBack(false);
                            }
                        } else {
                            callBack(false);
                        }
                    }, function (tx2, err) {
                        if (err.code !== 0) {
                            error = "No se pudo validar la Secuencia de Documentos debido a: " + err.message;
                            errorCallBack(error);
                        }
                    });
                }, function (err) {
                    if (err.code !== 0) {
                        error = "No se pudo validar la Secuencia de Documentos debido a: " + err.message;
                        errorCallBack(error);
                    }
                });
        } catch (e) {
            error = "No se pudo validar la existencia de la Secuencia de Documentos debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    ObtenerSiguienteSecuenciaDeDocumento: function (tipoDeDocumento, callBack, errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    sql = "SELECT SERIE, CURRENT_DOC + 1 AS CURRENT_DOC FROM DOCUMENT_SEQUENCE WHERE DOC_TYPE = '" + tipoDeDocumento + "' ";
                    tx.executeSql(sql, [], function (tx2, results) {
                        if (results.rows.length > 0) {
                            if (results.rows.item(0).CURRENT_DOC !== null && results.rows.item(0).SERIE !== null) {
                                callBack(results.rows.item(0).SERIE, parseInt(results.rows.item(0).CURRENT_DOC));
                            } else {
                                error = "No se pudo obtener el Número de Secuencia de Documentos";
                                errorCallBack(error);
                            }
                        } else {
                            error = "No se pudo obtener el Número de Secuencia de Documentos";
                            errorCallBack(error);
                        }
                    }, function (tx2, err) {
                        if (err.code !== 0) {
                            error = "No se pudo obtener el Número de Secuencia de Documentos debido a: " + err.message;
                            errorCallBack(error);
                        }
                    });
                }, function (err) {
                    if (err.code !== 0) {
                        error = "No se pudo obtener el Número de Secuencia de Documentos debido a: " + err.message;
                        errorCallBack(error);
                    }
                });
        } catch (e) {
            error = "No se pudo obtener el Número de Secuencia de Documentos debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    ActualizarSecuenciaDeDocumentos: function (tipoDeDocumento, numeroDeDocumento, callBack, errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    sql = "UPDATE DOCUMENT_SEQUENCE SET CURRENT_DOC = " + numeroDeDocumento + " WHERE DOC_TYPE = '" + tipoDeDocumento + "' ";
                    tx.executeSql(sql);
                    callBack();
                }, function (err) {
                    if (err.code !== 0) {
                        error = "No se pudo actualizar la Secuencia de Documentos debido a: " + err.message;
                        errorCallBack(error);
                    }
                });
        } catch (e) {
            error = "No se pudo actualizar de la Secuencia de Documentos debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    ActualizarSerieYDocumentoDeProcesosDePago: function (paymentOption, docSerie, docNum, callBack, errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(function (tx) {
                sql = "UPDATE HISTORICAL_TRACEABILITY_CONSIGNMENT SET DOC_SERIE_TARGET = '" + docSerie + "', DOC_NUM_TARGET = " + parseInt(docNum) + ", IS_POSTED = 0 " +
                    "WHERE ACTION = '" + paymentOption + "' AND DOC_SERIE_TARGET IS NULL AND DOC_NUM_TARGET IS NULL AND IS_POSTED IS NULL";
                tx.executeSql(sql);
                callBack();
            }, function (err) {
                if (err.code !== 0) {
                    error = "No se pudo actualizar la Serie y Documento de los procesos de pago de consignación debido a: " + err.message;
                    errorCallBack(error);
                }
            });
        } catch (e) {
            error = "Error al intentar actualizar la Serie y Documento de los procesos de pago de consignación debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    ActualizarEstadoDePosteoDeTrazabilidadDeConsignaciones: function (registro, errorCallBack) {
        SONDA_DB_Session.transaction(function (trans) {
            var indice = 0;
            registro.map(function () {
                var sql = "UPDATE HISTORICAL_TRACEABILITY_CONSIGNMENT SET IS_POSTED = 1 WHERE ";
                sql += " CONSIGNMENT_ID = " + parseInt(registro[indice].CONSIGNMENT_ID);
                sql += " AND DOC_SERIE_SOURCE = '" + registro[indice].DOC_SERIE_SOURCE + "' ";
                sql += " AND DOC_NUM_SOURCE = " + parseInt(registro[indice].DOC_NUM_SOURCE);
                sql += " AND SKU = '" + registro[indice].SKU + "' ";
                sql += " AND QTY = " + parseInt(registro[indice].QTY);
                sql += " AND ACTION = '" + registro[indice].ACTION + "' ";
                sql += " AND DOC_SERIE_TARGET = '" + registro[indice].DOC_SERIE_TARGET + "' ";
                sql += " AND DOC_NUM_TARGET = " + parseInt(registro[indice].DOC_NUM_TARGET);
                sql += " AND DATE_TRANSACTION = '" + registro[indice].DATE_TRANSACTION + "' ";
                trans.executeSql(sql);
                indice++;
            });
        }, function (error) {
            if (error.code !== 0) {
                errorCallBack("No se pudo actualizar el registro de trazabilidad debido a: " + error.message);
            }
        });
    }
    ,
    ObtenerSeriesPorSkuEnconsignacion: function (sku, consignacion, callBack, errorCallBack) {
        var series = new Array();
        SONDA_DB_Session.transaction(function (trans) {
            var sql = "SELECT SERIAL_NUMBER FROM CONSIGNMENT_DETAIL_TEMP " +
                "WHERE SKU = '" + sku + "' AND CONSIGNMENT_ID=" + parseInt(consignacion) + " AND LAST_PAYMENT_OPTION IS NULL";
            trans.executeSql(sql, [], function (transReturn, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    series.push(results.rows.item(i));
                }
                callBack(series);
            }, function (error, transReturn) {
                if (error.code !== 0) {
                    errorCallBack(error.message);
                }
            });

        }, function (error) {
            if (error.code !== 0) {
                errorCallBack(error.message);
            }
        });
    }
    ,
    AgregarSkuConSerieAFactura: function (skuObject, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "INSERT INTO INVOICE_DETAIL(" +
                        "INVOICE_NUM, " +
                        "SKU, " +
                        "SKU_NAME, " +
                        "QTY, " +
                        "PRICE, " +
                        "DISCOUNT, " +
                        "TOTAL_LINE, " +
                        "REQUERIES_SERIE, " +
                        "SERIE, " +
                        "SERIE_2, " +
                        "IS_ACTIVE, " +
                        "COMBO_REFERENCE, " +
                        "LINE_SEQ) ";
                    sql += " VALUES(" +
                        "-9999" +
                        ",'" + skuObject.SKU + "'" +
                        ", (SELECT SKU_NAME FROM SKUS WHERE SKU = '" + skuObject.SKU + "' LIMIT 1) " +
                        ", " + 1 +
                        ", " + parseFloat(skuObject.PRICE) +
                        ", 0" +
                        ", " + parseFloat(skuObject.PRICE) +
                        ", 1" +
                        ", '" + skuObject.SERIAL_NUMBER + "'" +
                        ", 0" +
                        "," + 1 +
                        ", '" + skuObject.SKU + "' " +
                        "," + 2 + ")";

                    trans.executeSql(sql);

                    if (skuObject.skuConSerie) {
                        sql = "UPDATE SKUS SET ON_HAND = ON_HAND -" + parseInt(1) + " WHERE SKU='" + skuObject.SKU + "'";
                        trans.executeSql(sql);

                        sql = "UPDATE SKU_SERIES SET STATUS = 1 WHERE SKU = '" + skuObject.SKU + "' AND SERIE ='" + skuObject.SERIAL_NUMBER + "' ";
                        trans.executeSql(sql);
                    }

                }, function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    }

}