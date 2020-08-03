var ClienteServicio = (function () {
    function ClienteServicio() {
    }
    ClienteServicio.prototype.cambiarEstadoAClientesParaReenviar = function (clientes, callback, errorCallback) {
        try {
            var sql_1 = "";
            SONDA_DB_Session.transaction(function (tx) {
                clientes.map(function (cliente) {
                    sql_1 =
                        "UPDATE CLIENT\n                            SET IS_POSTED = " + (cliente.EXISTS === EstadoEnvioDoc.NoEnviado ? EstadoEnvioDoc.NoEnviado : EstadoEnvioDoc.EnviadoConAcuseDeRecibido) + ",\n                            IS_POSTED_VALIDATED = " + (cliente.EXISTS === EstadoEnvioDoc.NoEnviado ? EstadoEnvioDoc.NoEnviado : EstadoEnvioDoc.EnviadoConAcuseDeRecibido) + "\n                            WHERE\n                             CLIENT_ID = '" + cliente.CODE_CUSTOMER + "'\n                             AND DOC_SERIE = '" + cliente.DOC_SERIE + "'\n                             AND DOC_NUM = " + cliente.DOC_NUM;
                    tx.executeSql(sql_1);
                });
            }, function (err) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message });
                return;
            }, function () {
                callback();
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
            return;
        }
    };
    ClienteServicio.prototype.obtenerClientesParaValidacionEnBo = function (obtenerTodosLosClientes, callback, errorCallback) {
        try {
            var sql_2 = "";
            var clientsToVerify_1 = new Array();
            SONDA_DB_Session.transaction(function (tx) {
                sql_2 =
                    "SELECT CLIENT_ID, DOC_SERIE, DOC_NUM, POSTED_DATETIME, TAGS_QTY, SYNC_ID \n                         FROM CLIENT\n                         WHERE IS_POSTED = " + EstadoEnvioDoc.EnviadoConAcuseDeRecibido + "\n                         " + (!obtenerTodosLosClientes ? " AND IFNULL(IS_POSTED_VALIDATED, 0) = 0" : "") + " ";
                tx.executeSql(sql_2, [], function (txReturn, results) {
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var clientTemp = results.rows.item(i);
                            var clientResult = {
                                clientId: clientTemp.CLIENT_ID,
                                docSerie: clientTemp.DOC_SERIE,
                                docNum: clientTemp.DOC_NUM,
                                postedDatetime: clientTemp.POSTED_DATETIME,
                                tagsQty: clientTemp.TAGS_QTY,
                                syncId: clientTemp.SYNC_ID
                            };
                            clientsToVerify_1.push(clientResult);
                        }
                        callback(clientsToVerify_1);
                    }
                    else {
                        callback(clientsToVerify_1);
                    }
                }, function (txReturn, error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
                    return;
                });
            }, function (err) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message });
                return;
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
            return;
        }
    };
    ClienteServicio.prototype.guardarScouting = function (scouting, callbak, errCallback) {
        var _this_1 = this;
        SONDA_DB_Session.transaction(function (tx) {
            var formatoDeInsercionDeClienteNuevo = _this_1.obtenerFormatoDeInsercionDeClienteNuevo(scouting);
            tx.executeSql(formatoDeInsercionDeClienteNuevo);
            scouting.tags.map(function (etiqueta) {
                var formatoDeInsercionDeEtiquetaDeCliente = _this_1
                    .obtenerFormatoDeInsercionDeEtiquetaDeClienteNuevo(scouting, etiqueta);
                tx.executeSql(formatoDeInsercionDeEtiquetaDeCliente);
            });
        }, function (err) {
            errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message });
        }, function () {
            PagoConsignacionesServicio
                .ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.Scouting, scouting.docNum, function () {
                callbak(scouting);
            }, function (error) {
                errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error });
            });
        });
    };
    ClienteServicio.prototype.obtenerClientesConEtiquetasNoSincronizados = function (callback, errCallback) {
        var _this_1 = this;
        var sql = "";
        var clientsReturn = new Array();
        SONDA_DB_Session.transaction(function (tx) {
            sql = "SELECT CLIENT_ID, \n                CLIENT_NAME,\n                CLIENT_TAX_ID,\n                ADDRESS,\n                PHONE,\n                CLIENT_HH_ID_OLD,\n                CONTACT_CUSTOMER,\n                CONTACT_CUSTOMER_PHONE,\n                PHOTO,\n                PHOTO_2,\n                PHOTO_3,\n                STATUS,\n                GPS,\n                CREATED_FROM,\n                INVOICE_NAME,\n                INVOICE_ADDRESS,\n                DOC_SERIE,\n                DOC_NUM,\n                POSTED_DATETIME,\n                TAGS_QTY,\n                SYNC_ID\n                FROM CLIENT \n                WHERE IS_POSTED = 0";
            tx.executeSql(sql, [], function (txResult, results) {
                if (results.rows.length > 0) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var clientTemp = results.rows.item(i);
                        var clientResult = {
                            clientId: clientTemp.CLIENT_ID,
                            clientName: clientTemp.CLIENT_NAME,
                            clientTaxId: clientTemp.CLIENT_TAX_ID,
                            address: clientTemp.ADDRESS,
                            phone: clientTemp.PHONE,
                            clientHhIdOld: clientTemp.CLIENT_HH_ID_OLD,
                            contactCustomer: clientTemp.CONTACT_CUSTOMER,
                            contactPhone: clientTemp.CONTACT_CUSTOMER_PHONE,
                            photo1: clientTemp.PHOTO,
                            photo2: clientTemp.PHOTO_2,
                            photo3: clientTemp.PHOTO_3,
                            status: clientTemp.STATUS,
                            isNew: 1,
                            gps: clientTemp.GPS,
                            latitude: clientTemp.GPS.split(",")[0],
                            longitude: clientTemp.GPS.split(",")[1],
                            tags: new Array(),
                            createdFrom: clientTemp.CREATED_FROM,
                            billingName: clientTemp.INVOICE_NAME,
                            billingAddress: clientTemp.INVOICE_ADDRESS,
                            docSerie: clientTemp.DOC_SERIE,
                            docNum: clientTemp.DOC_NUM,
                            postedDatetime: clientTemp.POSTED_DATETIME,
                            tagsQty: clientTemp.TAGS_QTY,
                            syncId: clientTemp.SYNC_ID
                        };
                        _this_1.obtenerEtiquetasPorCliente(txResult, clientResult, i, function (clientComplete, index) {
                            clientsReturn.push(clientComplete);
                            if (index === results.rows.length - 1) {
                                callback(clientsReturn);
                            }
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                    }
                }
                else {
                    callback(clientsReturn);
                }
            }, function (txResult, err) {
                errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message });
            });
        }, function (err) {
            errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message });
        });
    };
    ClienteServicio.prototype.obtenerEtiquetasPorCliente = function (txResult, cliente, indice, callback, errCallback) {
        var sql = "SELECT T.TAG_COLOR, \n                    T.TAG_VALUE_TEXT,\n                    T.TAG_PRIORITY,\n                    T.TAG_COMMENTS,\n                    TC.DOC_SERIE_CLIENT, \n                    TC.DOC_NUM_CLIENT\n                    FROM TAG AS T\n                    INNER JOIN TAG_X_CUSTOMER AS TC\n                    ON(TC.TAG_COLOR = T.TAG_COLOR)\n                    WHERE TC.DOC_SERIE_CLIENT = '" + cliente.docSerie + "' AND TC.DOC_NUM_CLIENT = " + cliente.docNum;
        txResult.executeSql(sql, [], function (txTagsResult, resultsTags) {
            for (var j = 0; j < resultsTags.rows.length; j++) {
                var tagTemp = resultsTags.rows.item(j);
                var tagResult = {
                    tagColor: tagTemp.TAG_COLOR,
                    tagValueText: tagTemp.TAG_VALUE_TEXT,
                    tagPriority: tagTemp.TAG_PRIORITY,
                    tagComments: tagTemp.TAG_COMMENTS,
                    docSerieClient: tagTemp.DOC_SERIE_CLIENT,
                    docNumClient: tagTemp.DOC_NUM_CLIENT
                };
                cliente.tags.push(tagResult);
            }
            callback(cliente, indice);
        }, function (txTagsResult, errorTags) {
            errCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: errorTags.message
            });
        });
    };
    ClienteServicio.prototype.marcarClienteComoSincronizado = function (clientes, callback, errCallback) {
        var sql = "";
        SONDA_DB_Session.transaction(function (tx) {
            clientes.map(function (cliente) {
                if (cliente.IS_SUCCESSFUL) {
                    sql = "UPDATE CLIENT \n                        SET IS_POSTED = 2,\n                        CLIENT_ID = '" + cliente.CLIENT_ID_BO + "'  \n                        WHERE CLIENT_HH_ID_OLD = '" + cliente.CLIENT_ID_HH + "'\n                        AND DOC_SERIE = '" + cliente.DOC_SERIE + "'\n                        AND DOC_NUM = " + cliente.DOC_NUM;
                    tx.executeSql(sql);
                    sql = "UPDATE TAG_X_CUSTOMER \n                        SET CLIENT_ID = '" + cliente.CLIENT_ID_BO + "' \n                        WHERE CLIENT_ID = '" + cliente.CLIENT_ID_HH + "'\n                        AND DOC_SERIE_CLIENT = '" + cliente.DOC_SERIE + "'\n                        AND DOC_NUM_CLIENT = " + cliente.DOC_NUM;
                    tx.executeSql(sql);
                }
                else {
                    ToastThis("Cliente " + cliente.CLIENT_ID_HH + " " + cliente.MESSAGE);
                }
            });
            sql = null;
        }, function (err) {
            errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message });
        }, function () {
            callback();
        });
    };
    ClienteServicio.prototype.obtenerFormatoDeInsercionDeClienteNuevo = function (cliente) {
        var formatoDeInsercionDeCliente = "";
        formatoDeInsercionDeCliente = "INSERT INTO CLIENT(";
        formatoDeInsercionDeCliente += "CLIENT_ID, ";
        formatoDeInsercionDeCliente += "CLIENT_NAME,";
        formatoDeInsercionDeCliente += "CLIENT_TAX_ID,";
        formatoDeInsercionDeCliente += "ADDRESS,";
        formatoDeInsercionDeCliente += "CLIENT_HH_ID_OLD,";
        formatoDeInsercionDeCliente += "CONTACT_CUSTOMER,";
        formatoDeInsercionDeCliente += "CONTACT_CUSTOMER_PHONE,";
        formatoDeInsercionDeCliente += "PHOTO,";
        formatoDeInsercionDeCliente += "PHOTO_2,";
        formatoDeInsercionDeCliente += "PHOTO_3,";
        formatoDeInsercionDeCliente += "STATUS,";
        formatoDeInsercionDeCliente += "NEW,";
        formatoDeInsercionDeCliente += "GPS,";
        formatoDeInsercionDeCliente += "CREATED_FROM,";
        formatoDeInsercionDeCliente += "INVOICE_NAME,";
        formatoDeInsercionDeCliente += "INVOICE_ADDRESS,";
        formatoDeInsercionDeCliente += "IS_POSTED,";
        formatoDeInsercionDeCliente += "DOC_SERIE,";
        formatoDeInsercionDeCliente += "DOC_NUM,";
        formatoDeInsercionDeCliente += "POSTED_DATETIME,";
        formatoDeInsercionDeCliente += "TAGS_QTY,";
        formatoDeInsercionDeCliente += "IS_POSTED_VALIDATED,";
        formatoDeInsercionDeCliente += "SYNC_ID)";
        formatoDeInsercionDeCliente += "VALUES(";
        formatoDeInsercionDeCliente += "'" + cliente.clientId + "' ";
        formatoDeInsercionDeCliente += ", '" + cliente.clientName + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.clientTaxId + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.address + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.clientHhIdOld + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.contactCustomer + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.contactPhone + "'";
        if (cliente.photo1 === null || cliente.photo1 === undefined || cliente.photo1 === "") {
            formatoDeInsercionDeCliente += "," + null;
        }
        else {
            formatoDeInsercionDeCliente += ", '" + cliente.photo1 + "'";
        }
        if (cliente.photo2 === null || cliente.photo2 === undefined || cliente.photo2 === "") {
            formatoDeInsercionDeCliente += "," + null;
        }
        else {
            formatoDeInsercionDeCliente += ", '" + cliente.photo2 + "'";
        }
        if (cliente.photo3 === null || cliente.photo3 === undefined || cliente.photo3 === "") {
            formatoDeInsercionDeCliente += "," + null;
        }
        else {
            formatoDeInsercionDeCliente += ", '" + cliente.photo3 + "'";
        }
        formatoDeInsercionDeCliente += ", '" + cliente.status + "'";
        formatoDeInsercionDeCliente += ", " + cliente.isNew;
        formatoDeInsercionDeCliente += ", '" + cliente.gps + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.createdFrom + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.billingName + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.billingAddress + "'";
        formatoDeInsercionDeCliente += ", 0";
        formatoDeInsercionDeCliente += ", '" + cliente.docSerie + "'";
        formatoDeInsercionDeCliente += ", " + cliente.docNum;
        formatoDeInsercionDeCliente += ", '" + getDateTime() + "'";
        formatoDeInsercionDeCliente += ", " + cliente.tags.length;
        formatoDeInsercionDeCliente += ", 0";
        formatoDeInsercionDeCliente += ", '" + (gCurrentRoute + "|" + gLastLogin + "|" + getDateTime() + "|" + cliente.clientId) + "'";
        formatoDeInsercionDeCliente += ")";
        return formatoDeInsercionDeCliente;
    };
    ClienteServicio.prototype.obtenerFormatoDeInsercionDeEtiquetaDeClienteNuevo = function (cliente, etiqueta) {
        var formatoDeInsercionDeEtiqueta = "";
        formatoDeInsercionDeEtiqueta = "INSERT INTO TAG_X_CUSTOMER(";
        formatoDeInsercionDeEtiqueta += "TAG_COLOR,";
        formatoDeInsercionDeEtiqueta += "CLIENT_ID,";
        formatoDeInsercionDeEtiqueta += "DOC_SERIE_CLIENT,";
        formatoDeInsercionDeEtiqueta += "DOC_NUM_CLIENT";
        formatoDeInsercionDeEtiqueta += ") VALUES(";
        formatoDeInsercionDeEtiqueta += "'" + etiqueta.tagColor + "'";
        formatoDeInsercionDeEtiqueta += ",'" + cliente.clientId + "'";
        formatoDeInsercionDeEtiqueta += ",'" + cliente.docSerie + "'";
        formatoDeInsercionDeEtiqueta += "," + cliente.docNum;
        formatoDeInsercionDeEtiqueta += ")";
        return formatoDeInsercionDeEtiqueta;
    };
    ClienteServicio.prototype.obtenerUltimoComentarioDeFactura = function (callback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = "SELECT IFNULL(COMMENT,'N/A') AS COMMENT FROM INVOICE_HEADER WHERE COMMENT IS NOT NULL ORDER BY INVOICE_NUM DESC LIMIT 1";
                trans.executeSql(sql, [], function (transReturn, results) {
                    if (results.rows.length > 0) {
                        var comment = results.rows.item(0).COMMENT;
                        callback(comment);
                        comment = null;
                    }
                    else {
                        callback("N/A");
                    }
                }, function (transReturn, error) {
                    callback("N/A");
                });
            }, function (error) {
                callback("N/A");
            });
        }
        catch (e) {
            callback("N/A");
        }
    };
    return ClienteServicio;
}());
//# sourceMappingURL=ClienteServicio.js.map