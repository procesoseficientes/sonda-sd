var RecogerProductoEnConsignacionServicio = {

    InsertarEncabezadoDeRecollecionDeInventarioEnConsignacion: function(encabezadoRecollecion, callBack, errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(function(tx) {
                sql = "INSERT INTO SKU_COLLECTED_HEADER(";
                sql += "SKU_COLLECTED_ID";
                sql += ", CUSTOMER_ID";
                sql += ", DOC_SERIE";
                sql += ", DOC_NUM";
                sql += ", CODE_ROUTE";
                sql += ", GPS_URL";
                sql += ", LAST_UPDATE";
                sql += ", LAST_UPDATE_BY";
                sql += ", TOTAL_AMOUNT";
                sql += ", IS_POSTED";
                sql += ", IMG_1";
                sql += ", IMG_2";
                sql += ", IMG_3";
                sql += ") VALUES(";
                sql += encabezadoRecollecion.SKU_COLLECTED_ID;
                sql += ", '" + encabezadoRecollecion.CUSTOMER_ID + "' ";
                sql += ", '" + encabezadoRecollecion.DOC_SERIE + "' ";
                sql += ", " + encabezadoRecollecion.DOC_NUM;
                sql += ", '" + encabezadoRecollecion.CODE_ROUTE + "' ";
                sql += ", '" + encabezadoRecollecion.GPS_URL + "' ";
                sql += ", '" + encabezadoRecollecion.LAST_UPDATE + "' ";
                sql += ", '" + encabezadoRecollecion.LAST_UPDATE_BY + "' ";
                sql += ", " + encabezadoRecollecion.TOTAL_AMOUNT;
                sql += ", " + encabezadoRecollecion.IS_POSTED;
                sql += ", '" + encabezadoRecollecion.IMG_1 + "' ";
                sql += ", '" + encabezadoRecollecion.IMG_2 + "' ";
                sql += ", '" + encabezadoRecollecion.IMG_3 + "' ";
                sql += ")";
                console.log(sql);
                tx.executeSql(sql);
                callBack(encabezadoRecollecion);
            }, function(err) {
                if (err.code !== 0) {
                    error = "No se pudo guardar el Encabezado del Documento de Devolución de Inventario debido a: " + err.message;
                    console.log(error);
                    errorCallBack(error);
                }
            });
        } catch (e) {
            error = "Error al intentar guardar el Encabezado del Documento de Devolución de Inventario debido a: " + e.message;
            console.log(error);
            errorCallBack(error);
        } 
    }
    ,
    ActualizarDetalleDeRecollecion: function(recollecionEncabezado,callBack,errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(function(tx) {
                sql = "UPDATE SKU_COLLECTED_DETAIL SET SKU_COLLECTED_ID = " + recollecionEncabezado.SKU_COLLECTED_ID + " WHERE SKU_COLLECTED_ID IS NULL";
                console.log(sql);
                tx.executeSql(sql);
                callBack();
            }, function(err) {
                if (err.code !== 0) {
                    error = "No se pudo actualizar el Detalle del Documento de Devolución de Inventario debido a: " + err.message;
                    console.log(error);
                    errorCallBack(error);
                }
            });
        } catch (e) {
            error = "Error al intentar actualizar el Detalle del Documento de Devolución de Inventario debido a: " + e.message;
            console.log(error);
            errorCallBack(error);
        } 
    }
    ,
    ActualizarEstadoDePosteoDeDocumentoDeDevolucionDeInventario: function(documento,idDocumento,callBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(function (tx) {
                sql = "UPDATE SKU_COLLECTED_HEADER " +
                    "SET SKU_COLLECTED_ID = " + parseInt(idDocumento) +
                    ", SKU_COLLECTED_BO_ID = " + parseInt(idDocumento) +
                    ", IS_POSTED = 1 " +
                    "WHERE SKU_COLLECTED_ID = " + parseInt(documento.SKU_COLLECTED_ID) +
                    " AND DOC_SERIE = '" + documento.DOC_SERIE + "' AND DOC_NUM = " + parseInt(documento.DOC_NUM);
                console.log(sql);
                tx.executeSql(sql);

                sql = "UPDATE SKU_COLLECTED_DETAIL SET SKU_COLLECTED_ID =" + parseInt(idDocumento) + " WHERE SKU_COLLECTED_ID = " + parseInt(documento.SKU_COLLECTED_ID);
                console.log(sql);
                tx.executeSql(sql);

                callBack(documento);
            }, function (err) {
                if (err.code !== 0) {
                    error = "No se pudo actualizar el Detalle del Documento de Devolución de Inventario debido a: " + err.message;
                    console.log(error);
                }
            });
        } catch (e) {
            error = "Error al intentar actualizar el posteo del Documento de Devolución de Inventario debido a: " + e.message;
            console.log(error);
        } 
    }
    ,
    ObtenerDocumentoDeDevolucionDeInventario: function(numeroDeDocumento, callBack, errorCallBack) {
        try {
            SONDA_DB_Session.transaction(function(tx) {
                var sql = "SELECT SKU_COLLECTED_ID" +
                    ", CUSTOMER_ID" +
                    ", DOC_SERIE" +
                    ", DOC_NUM" +
                    ", CODE_ROUTE" +
                    ", GPS_URL" +
                    ", POSTED_DATETIME" +
                    ", POSTED_BY" +
                    ", LAST_UPDATE" +
                    ", LAST_UPDATE_BY" +
                    ", TOTAL_AMOUNT" +
                    ", IS_POSTED" +
                    ", IMG_1" +
                    ", IMG_2" +
                    ", IMG_3" +
                    ", SKU_COLLECTED_BO_ID" +
                    "  FROM SKU_COLLECTED_HEADER WHERE DOC_NUM = " + parseInt(numeroDeDocumento);
                console.log(sql);
                tx.executeSql(sql, [], function(tx2, results) {
                    var documentoDevolucion = {
                        SKU_COLLECTED_ID: results.rows.item(0).SKU_COLLECTED_ID,
                        CUSTOMER_ID: results.rows.item(0).CUSTOMER_ID,
                        DOC_SERIE: results.rows.item(0).DOC_SERIE,
                        DOC_NUM: results.rows.item(0).DOC_NUM,
                        CODE_ROUTE: results.rows.item(0).CODE_ROUTE,
                        GPS_URL: results.rows.item(0).GPS_URL,
                        POSTED_DATETIME: results.rows.item(0).POSTED_DATETIME,
                        POSTED_BY: results.rows.item(0).POSTED_BY,
                        LAST_UPDATE: results.rows.item(0).LAST_UPDATE,
                        LAST_UPDATE_BY: results.rows.item(0).LAST_UPDATE_BY,
                        TOTAL_AMOUNT: results.rows.item(0).TOTAL_AMOUNT,
                        IS_POSTED: results.rows.item(0).IS_POSTED,
                        IMG_1: results.rows.item(0).IMG_1,
                        IMG_2: results.rows.item(0).IMG_2,
                        IMG_3: results.rows.item(0).IMG_3,
                        SKU_COLLECTED_BO_ID: results.rows.item(0).SKU_COLLECTED_BO_ID,
                        DEVOLUTION_DETAIL: new Array()
                    }
                    callBack(documentoDevolucion);
                }, function(tx2, err) {
                    if (err.code !== 0) {
                        errorCallBack("Error al obtener el Documento de Devolución de Inventario Recogido de Consignación debido a: " + err.message);
                    }
                });
            }, function(err) {
                if (err.code !== 0) {
                    errorCallBack("No se pudieron obtener el Documento de Devolución de Inventario Recogido de Consignación debido a: " + err.message);
                }
            });
        } catch (e) {
            errorCallBack("Error al intentar obtener el Documento de Devolución de Inventario Recogido De Consignación debido a: " + e.message);
        }
    }
    ,
    ObtenerDetalleDeDocumentoDeDevolucion: function (documentoEncabezado, indice,callBack, errorCallBack) {

        SONDA_DB_Session.transaction(
            function(tx) {
                var sql = "SELECT " +
                    "DD.SKU_COLLECTED_ID" +
                    ", DD.CODE_SKU" +
                    ", S.SKU_NAME" +
                    ", DD.QTY_SKU" +
                    ", DD.IS_GOOD_STATE" +
                    ", DD.LAST_UPDATE" +
                    ", DD.LAST_UPDATE_BY" +
                    ", DD.SOURCE_DOC_TYPE" +
                    ", DD.SOURCE_DOC_NUM" +
                    ", DD.TOTAL_AMOUNT, DD.HANDLE_SERIAL, DD.SERIAL_NUMBER " +
                    " FROM SKU_COLLECTED_DETAIL AS DD INNER JOIN SKUS AS S ON(S.SKU = DD.CODE_SKU) " +
                    " WHERE SKU_COLLECTED_ID =" + parseInt(documentoEncabezado.SKU_COLLECTED_ID);
                tx.executeSql(sql, [], function(tx2, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var skuDetalle = {
                            SKU_COLLECTED_ID: results.rows.item(i).SKU_COLLECTED_ID,
                            CODE_SKU: results.rows.item(i).CODE_SKU,
                            SKU_NAME: results.rows.item(i).SKU_NAME,
                            QTY_SKU: results.rows.item(i).QTY_SKU,
                            IS_GOOD_STATE: results.rows.item(i).IS_GOOD_STATE,
                            LAST_UPDATE: results.rows.item(i).LAST_UPDATE,
                            LAST_UPDATE_BY: results.rows.item(i).LAST_UPDATE_BY,
                            SOURCE_DOC_TYPE: results.rows.item(i).SOURCE_DOC_TYPE,
                            SOURCE_DOC_NUM: results.rows.item(i).SOURCE_DOC_NUM,
                            TOTAL_AMOUNT: results.rows.item(i).TOTAL_AMOUNT,
                            HANDLE_SERIAL: results.rows.item(i).HANDLE_SERIAL,
                            SERIAL_NUMBER: results.rows.item(i).SERIAL_NUMBER
                        }
                        documentoEncabezado.DEVOLUTION_DETAIL.push(skuDetalle);
                    }
                    callBack(documentoEncabezado,indice);
                }, function(tx2, err) {
                    if (err.code !== 0) {
                        errorCallBack("No se pudo obtener el Detalle de Devolución de Inventario Recogido en Consignación debido a: " + err.message);
                    }
                });
            }, function(err) {
                if (err.code !== 0) {
                    errorCallBack("No se pudo obtener el Detalle de Devolución de Inventario Recogido en Consignación debido a: " + err.message);
                }
            });
    }
    ,
    ImprimirComprobanteDeDevolucionDesdeConsignacion: function () {
        my_dialog("Imprimiendo", "Por favor, espere...", "open");
        RecogerProductoEnConsignacionServicio.ObtenerDocumentoDeDevolucionDeInventario(
            CantidadSkuARecogerProductoEnConsignacionControlador.UltimoDocumentoDeRecoleccion
            , function (documentoEncabezado) {
                RecogerProductoEnConsignacionServicio.ObtenerDetalleDeDocumentoDeDevolucion(documentoEncabezado,0, function (documentoCompleto,indice) {
                        if (documentoCompleto.DEVOLUTION_DETAIL.length === 0) {
                            notify("Lamentablemente no ha podido imprimir el documento porque no tiene detalle, por favor, verifique y vuelva a intentar.");
                        } else {
                            ObtenerFormatoDeImpresionRecollecionConsignacion(documentoCompleto, function (formatoDeImpresion) {
                                console.log("Formato de Impresion de Documento de Devolucion de Inventario: " + formatoDeImpresion);
                                    ImprimirDocumento(formatoDeImpresion, function() {
                                        my_dialog("Imprimiendo", "Por favor, espere...", "close");
                                    }, function() {
                                        my_dialog("Imprimiendo", "Por favor, espere...", "close");
                                    });
                                }
                            , function (error) {
                                my_dialog("Imprimiendo", "Por favor, espere...", "close");
                                notify(error);
                            });
                        }   
                }, function (error) {
                    my_dialog("Imprimiendo", "Por favor, espere...", "close");
                        notify(error);
                    });
            }, function (error) {
                my_dialog("Imprimiendo", "Por favor, espere...", "close");
                notify(error);
            });
    }
    ,
    ObtenerListadoDeDocumentosDeDevolucion: function (callBack, errorCallBack) {
        var documentosDeDevolucion = new Array();
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT SKU_COLLECTED_ID" +
                ", CUSTOMER_ID" +
                ", DOC_SERIE" +
                ", DOC_NUM" +
                ", CODE_ROUTE" +
                ", GPS_URL" +
                ", POSTED_DATETIME" +
                ", POSTED_BY" +
                ", LAST_UPDATE" +
                ", LAST_UPDATE_BY" +
                ", TOTAL_AMOUNT" +
                ", IS_POSTED" +
                ", IMG_1" +
                ", IMG_2" +
                ", IMG_3" +
                ", SKU_COLLECTED_BO_ID" +
                "  FROM SKU_COLLECTED_HEADER";

            tx.executeSql(sql, []
                , function (tx2, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var documentoDevolucion = {
                            SKU_COLLECTED_ID: results.rows.item(i).SKU_COLLECTED_ID,
                            CUSTOMER_ID: results.rows.item(i).CUSTOMER_ID,
                            DOC_SERIE: results.rows.item(i).DOC_SERIE,
                            DOC_NUM: results.rows.item(i).DOC_NUM,
                            CODE_ROUTE: results.rows.item(i).CODE_ROUTE,
                            GPS_URL: results.rows.item(i).GPS_URL,
                            POSTED_DATETIME: results.rows.item(i).POSTED_DATETIME,
                            POSTED_BY: results.rows.item(i).POSTED_BY,
                            LAST_UPDATE: results.rows.item(i).LAST_UPDATE,
                            LAST_UPDATE_BY: results.rows.item(i).LAST_UPDATE_BY,
                            TOTAL_AMOUNT: results.rows.item(i).TOTAL_AMOUNT,
                            IS_POSTED: results.rows.item(i).IS_POSTED,
                            IMG_1: results.rows.item(i).IMG_1,
                            IMG_2: results.rows.item(i).IMG_2,
                            IMG_3: results.rows.item(i).IMG_3,
                            SKU_COLLECTED_BO_ID: results.rows.item(i).SKU_COLLECTED_BO_ID,
                            DEVOLUTION_DETAIL: new Array()
                        }
                        documentosDeDevolucion.push(documentoDevolucion);
                    }
                    callBack(documentosDeDevolucion);
                }, function (tx2, err) {
                    if (err.code !== 0) {
                        errorCallBack("Error al obtener los Documentos de Devolución de Inventario Recogido de Consignación debido a: " + err.message);
                    }
                });
        }, function (err) {
            if (err.code !== 0) {
                errorCallBack("No se pudieron obtener los Documentos de Devolución de Inventario Recogido de Consignación debido a: " + err.message);
            }
        });
    }
}