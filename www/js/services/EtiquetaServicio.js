var EtiquetaServicio = (function () {
    function EtiquetaServicio() {
    }
    EtiquetaServicio.prototype.obtenerEtiquetas = function (callback, errCallback) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "SELECT";
                sql += " T.TAG_COLOR";
                sql += " ,T.TAG_VALUE_TEXT";
                sql += " ,T.TAG_PRIORITY";
                sql += " ,T.TAG_COMMENTS";
                sql += " FROM TAG T";
                sql += " ORDER BY T.TAG_PRIORITY";
                tx.executeSql(sql, [], function (tx, results) {
                    if (results.rows.length >= 1) {
                        var etiquetas = [];
                        for (var i = 0; i < results.rows.length; i++) {
                            var etiquetaTemp = results.rows.item(i);
                            var etiqueta = {
                                tagColor: etiquetaTemp.TAG_COLOR,
                                tagValueText: etiquetaTemp.TAG_VALUE_TEXT,
                                tagPriority: etiquetaTemp.TAG_PRIORITY,
                                tagComments: etiquetaTemp.TAG_COMMENTS
                            };
                            etiquetas.push(etiqueta);
                        }
                        callback(etiquetas);
                    }
                    else {
                        errCallback({ codigo: -1, mensaje: "No hay etiquetas disponibles" });
                    }
                });
            }, function (err) {
                errCallback({ codigo: -1, mensaje: "2-Error al obtener las etiquetas: " + err.message });
            });
        }
        catch (e) {
            errCallback({ codigo: -1, mensaje: "1-Error al obtener las etiquetas: " + e.message });
        }
    };
    EtiquetaServicio.prototype.guardarEtiquetasDeCliente = function (cliente, callback, errCallback) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "";
                cliente.tags.map(function (etiqueta, index, array) {
                    var sql = "INSERT INTO TAG_X_CUSTOMER (";
                    sql += " TAG_COLOR";
                    sql += " ,CLIENT_ID)";
                    sql += " VALUES (";
                    sql += "'" + etiqueta.tagColor + "'";
                    sql += " ,'" + cliente.clientId + "'";
                    sql += ");";
                    tx.executeSql(sql);
                });
                callback(cliente);
            }, function (err) {
                errCallback({ codigo: -1, mensaje: "2-Error al obtener las etiquetas: " + err.message });
            });
        }
        catch (e) {
            errCallback({ codigo: -1, mensaje: "1-Error al guardar las etiquetas: " + e.message });
        }
    };
    EtiquetaServicio.prototype.agregarEtiqueta = function (etiqueta) {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "INSERT INTO TAG(TAG_COLOR, \n                TAG_VALUE_TEXT, \n                TAG_PRIORITY, \n                TAG_COMMENTS) \n                VALUES(\n                '" + etiqueta.TAG_COLOR + "'\n                ,'" + etiqueta.TAG_VALUE_TEXT + "'\n                ," + etiqueta.TAG_PRIORITY + "\n                ,'" + etiqueta.TAG_COMMENTS + "'\n                )";
            tx.executeSql(sql);
        }, function (error) {
        });
    };
    return EtiquetaServicio;
}());
//# sourceMappingURL=EtiquetaServicio.js.map