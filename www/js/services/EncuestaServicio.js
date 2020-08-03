var EncuestaServicio = {
    GuardarEncuestasDeCompraDeCompetencia: function(encuestas, callback, errCallback) {
        try {
            for (var i = 0; i < encuestas.length; i++) {
                var encuesta = encuestas[i];
                EncuestaServicio.GuardarEncuestaDeCompraDeCompetencia(encuesta, i, function (indice) {

                    if (indice === (encuestas.length - 1)) {
                        callback();
                    }
                }, function(err) {
                    errCallback(err);
                });
            }
        } catch (e) {
            errCallback(e);
        }
    }
    ,
    GuardarEncuestaDeCompraDeCompetencia: function(encuesta, indice, callback, errCallback) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var pSql = " ";
                    pSql = " INSERT INTO BUSINESS_RIVAL_POLL(";
                    pSql += " INVOICE_RESOLUTION";
                    pSql += ", INVOICE_SERIE";
                    pSql += ", INVOICE_NUM";
                    pSql += ", CODE_CUSTOMER";
                    pSql += ", BUSSINESS_RIVAL_NAME";
                    pSql += ", BUSSINESS_RIVAL_TOTAL_AMOUNT";
                    pSql += ", CUSTOMER_TOTAL_AMOUNT";
                    pSql += ", COMMENT";
                    pSql += ", CODE_ROUTE";
                    pSql += ", POSTED_DATETIME";
                    pSql += ", IS_POSTED";
                    pSql += ") VALUES (";
                    pSql += " '" + encuesta.invoiceResolution + "'";
                    pSql += " ,'" + encuesta.invoiceSerie + "'";
                    pSql += " ," + encuesta.invoiceNum;
                    pSql += " ,'" + encuesta.codeCustomer + "'";
                    pSql += " ,'" + encuesta.bussinessRivalName + "'";
                    pSql += " ," + encuesta.bussinessRivalTotalAmount;
                    pSql += " ," + encuesta.customerTotalAmount;
                    pSql += " ,'" + encuesta.comment + "'";
                    pSql += " ,'" + encuesta.codeRoute + "'";
                    pSql += " ,'" + encuesta.postedDatetime + "'";
                    pSql += " ," + encuesta.isPosted;
                    pSql += ")";

                    tx.executeSql(pSql);
                    callback(indice);
                },
                function (err) {
                    if (err.code !== 0) {
                        errCallback({"message": "No se pudo insertar la encuenta debido a: " + err.message});
                    }
                });
            
        } catch (e) {
            errCallback(e);
        }
    }
    ,
    ObtenerEncuestasDeCompraDeCompetenciaNoEnviadas: function(callback, errorCallBack) {
        try {
            var encuestas = new Array();
            SONDA_DB_Session.transaction(
                function (trans) {
                    var pSql = "";
                    pSql = " SELECT";
                    pSql += " INVOICE_RESOLUTION";
                    pSql += " ,INVOICE_SERIE";
                    pSql += " ,INVOICE_NUM";
                    pSql += " ,CODE_CUSTOMER";
                    pSql += " ,BUSSINESS_RIVAL_NAME";
                    pSql += " ,BUSSINESS_RIVAL_TOTAL_AMOUNT";
                    pSql += " ,CUSTOMER_TOTAL_AMOUNT";
                    pSql += " ,COMMENT";
                    pSql += " ,CODE_ROUTE";
                    pSql += " ,POSTED_DATETIME";
                    pSql += " ,IS_POSTED";
                    pSql += " FROM BUSINESS_RIVAL_POLL";
                    pSql += " WHERE IS_POSTED IN (0,1)";

                    trans.executeSql(pSql, [],
                        function (trans2, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var encuesta = {
                                    invoiceResolution: results.rows.item(i).INVOICE_RESOLUTION
                                    ,invoiceSerie: results.rows.item(i).INVOICE_SERIE
                                    ,invoiceNum: results.rows.item(i).INVOICE_NUM
                                    ,codeCustomer: results.rows.item(i).CODE_CUSTOMER
                                    ,bussinessRivalName: results.rows.item(i).BUSSINESS_RIVAL_NAME
                                    ,bussinessRivalTotalAmount: results.rows.item(i).BUSSINESS_RIVAL_TOTAL_AMOUNT
                                    ,customerTotalAmount: results.rows.item(i).CUSTOMER_TOTAL_AMOUNT
                                    ,comment: results.rows.item(i).COMMENT
                                    ,codeRoute: results.rows.item(i).CODE_ROUTE
                                    ,postedDatetime: results.rows.item(i).POSTED_DATETIME
                                    ,isPosted: results.rows.item(i).IS_POSTED
                                }
                                encuestas.push(encuesta);
                            }
                            callback(encuestas);
                        }, function (error, trans2) {
                            if (error.code !== 0) {
                                errorCallBack("Error al intentar obtener las encuestas de compra de competencia para sincronizar debido a: " + error.message);
                            }
                        });
                }, function (error) {
                    if (error.code !== 0) {
                        errorCallBack("Error al intentar obtener las encuestas de compra de competencia para sincronizar debido a: " + error.message);
                    }
                });
        } catch (e) {
            errorCallBack("Error al intentar obtener las encuestas de compra de competencia para sincronizar debido a: " + e.message);
        }
    }
    ,
    MarcarEncuestaDeCompraDeCompetenciaComoEnviada: function(encuesta, estado, callback, errCallback) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var pSql = " ";
                    pSql = " UPDATE BUSINESS_RIVAL_POLL";
                    pSql += " SET IS_POSTED = " + estado;
                    pSql += " WHERE INVOICE_RESOLUTION = '" + encuesta.invoiceResolution + "'";
                    pSql += " AND INVOICE_SERIE = '" + encuesta.invoiceSerie + "'";
                    pSql += " AND INVOICE_NUM = " + encuesta.invoiceNum;
                    pSql += " AND CODE_CUSTOMER = '" + encuesta.codeCustomer + "'";
                    pSql += " AND BUSSINESS_RIVAL_NAME = '" + encuesta.bussinessRivalName + "'";
                    pSql += " AND POSTED_DATETIME = '" + encuesta.postedDatetime + "'";

                    tx.executeSql(pSql);
                    callback();
                },
                function (err) {
                    if (err.code !== 0) {
                        errCallback({ "message": "No se pudo colocar como enviada la encuesta: " + err.message });
                    }
                });

        } catch (e) {
            errCallback(e);
        }
    }
}
