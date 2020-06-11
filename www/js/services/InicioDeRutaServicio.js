function EstableserTraferencia(data, callback, errCallbak) {
    for (var i = 0; i < data.detalle.length; i++) {
        ExisteSkuTraferencia(data.detalle[i], function (tipo, transferenciaDetalle) {
            if (tipo == "Insertar") {
                InsertarSku(transferenciaDetalle, function (transferenciaId, sku) {
                        var data = {
                            'dbuser': gdbuser,
                            'dbuserpass': gdbuserpass,
                            'trafenreciaid': transferenciaId,
                            'sku': sku

                    };
                    socket.emit('SetTransferSku', data);
                },
                    function (err) {
                        notify(err);
                });
            }
        }, function(err) {
            notify(err);
        });
    }
}

function ExisteSkuTraferencia(transferenciaDetalle, callback, errCallbak) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT *  ";
            sql += " FROM SKUS ";
            sql += " WHERE SKU = " + transferenciaDetalle.SKU_CODE;
            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length > 0) {
                        callback("actualizar", transferenciaDetalle);
                    }
                    else {
                        callback("Insertar", transferenciaDetalle);
                    }
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallbak(err.message);
                }
            );
        },
         function (err) {
             errCallbak(err.message);
         }
    );
}

function InsertarSku(transferId, transferenciaDetalle, callback, errCallbak) {
    SONDA_DB_Session.transaction(
        function(tx) {
            var pSql = "INSERT INTO SKUS(SKU, SKU_NAME, SKU_PRICE, SKU_LINK, REQUERIES_SERIE, IS_KIT, ON_HAND, ROUTE_ID, IS_PARENT, PARENT_SKU, EXPOSURE, PRIORITY, QTY_RELATED, LOADED_LAST_UPDATED)";
            pSql += "VALUES('" + transferenciaDetalle.SKU + "','" + transferenciaDetalle.SKU_NAME + "'," + format_number(transferenciaDetalle.SKU_PRICE, 2) + ",'...',";
            pSql += transferenciaDetalle.REQUERIES_SERIE + "," + transferenciaDetalle.IS_KIT + "," + transferenciaDetalle.QTY + ",'" + transferenciaDetalle.ROUTE_ID + "',";
            pSql += transferenciaDetalle.IS_PARENT + ",'" + transferenciaDetalle.PARENT_SKU + "'," + transferenciaDetalle.EXPOSURE + "," + transferenciaDetalle.PRIORITY + ",";
            pSql += transferenciaDetalle.QTY_RELATED + ",'" + getDateTime() + "')";
            tx.executeSql(pSql);
            callback(transferenciaDetalle.TRANSFER_IDe, transferenciaDetalle.SKU);
        }
        ,
         function (tx, err) {
             errCallbak(err.message);
         }
        );
}

function ActualizarSku(transferenciaDetalle, callback, errCallbak) {
    SONDA_DB_Session.transaction(
       function (tx) {
           var pSql = "UPDATE SKUS SET ON_HAND =  (ON_HAND  + "+ transferenciaDetalle.QTY + ")";
           pSql += " WHERE SKU = " + transferenciaDetalle.SKU;           
           tx.executeSql(pSql);
           
           callback();
       }
       ,
        function (tx, err) {
            errCallbak(err.message);
        }
       );
}