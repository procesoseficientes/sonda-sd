var ClasificacionesServicio = {

    InsertarRazon: function (razon) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var pSql = " ";
                    pSql = " INSERT INTO REASONS(";
                    pSql += "  REASON_TYPE";
                    pSql += ", REASON_PRIORITY";
                    pSql += ", REASON_VALUE";
                    pSql += ", REASON_PROMPT) VALUES (";
                    pSql += " '" + razon.GROUP_CLASSIFICATION + "'";
                    pSql += ",'" + razon.PRIORITY_CLASSIFICATION + "'";
                    pSql += ",'" + razon.NAME_CLASSIFICATION + "'";
                    pSql += ",'" + razon.VALUE_TEXT_CLASSIFICATION + "')";

                    tx.executeSql(pSql);
                },
                function (err) {
                    if (err.code !== 0) {
                        notify("No se pudo insertar la Clasificacion debido a: " + err.message);
                    }
                });
        } catch (e) {
            notify("Error al intentar insertar la Clasificacion debido a: " + e.message);
        }
    }
    ,
    ObtenerRasones: function(tipoDeClasificacion, callBack, errorCallBack) {
        try {
            var razones = new Array();
            SONDA_DB_Session.transaction(
                function (trans) {
                    var pSql = "";
                    pSql = " SELECT";
                    pSql += "  REASON_TYPE";
                    pSql += ", REASON_PRIORITY";
                    pSql += ", REASON_VALUE";
                    pSql += ", REASON_PROMPT FROM REASONS ";
                    pSql += " WHERE REASON_TYPE = '" + tipoDeClasificacion + "' ";

                    trans.executeSql(pSql, [],
                        function (trans2, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var registro = {
                                    REASON_TYPE: results.rows.item(i).REASON_TYPE
                                    , REASON_PRIORITY: results.rows.item(i).REASON_PRIORITY
                                    , REASON_VALUE: results.rows.item(i).REASON_VALUE
                                    , REASON_PROMPT: results.rows.item(i).REASON_PROMPT
                                }
                                razones.push(registro);
                            }
                            callBack(razones);
                        }, function (error, trans2) {
                            if (error.code !== 0) {
                                errorCallBack("No se pudieron obtener los registros debido a: " + error.message);
                            }
                        });
                },function(error) {
                if (error.code !== 0) {
                    errorCallBack("No se pudieron obtener los registros debido a: " + error.message);
                }
            });
        } catch (e) {
            errorCallBack("Error al intentar obtener los registros debido a: " + e.message);
        } 
    }
    ,
    LimpiarTablaDeRazones: function(callBack, errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(
                function(trans) {
                    sql = "DELETE FROM REASONS";
                    trans.executeSql(sql);
                }, function(err) {
                    if (err.code !== 0) {
                        error = "No se pudo limpiar la tabla de razones debido a:" + err.message;
                        errorCallBack(error);
                    }
                });
        } catch (e) {
            error = "Error al intentar limpiar la tabla de razones debido a: " + e.message;
            errorCallBack(error);
        } 
    }
    ,
    LimpiarTablaDeClasificaciones: function (callBack, errorCallBack) {
        var error = "";
        var sql = "";
        try {
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "DELETE FROM CLASSIFICATION";
                    trans.executeSql(sql);
                }, function (err) {
                    if (err.code !== 0) {
                        error = "No se pudo limpiar la tabla de Clasificaciones debido a:" + err.message;
                        errorCallBack(error);
                    }
                });
        } catch (e) {
            error = "Error al intentar limpiar la tabla de Clasificaciones debido a: " + e.message;
            errorCallBack(error);
        }
    }
    ,
    AgregarRazonPorDefecto: function(errorCallBack) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var pSql = " ";
                    pSql = " INSERT INTO REASONS(";
                    pSql += "  REASON_TYPE";
                    pSql += ", REASON_PRIORITY";
                    pSql += ", REASON_VALUE";
                    pSql += ", REASON_PROMPT) VALUES (";
                    pSql += " 'NO_INVOICE_REASON_POS' ";
                    pSql += ", 1";
                    pSql += ", 'SIN_RAZONES'";
                    pSql += ", 'Sin Razon')";
                    tx.executeSql(pSql);
                },
                function (err) {
                    if (err.code !== 0) {
                        errorCallBack("Error al intentar agregar la Razón por Defecto en Clasificaciones debido a: " + err.message);
                    }
                });
        } catch (e) {
            errorCallBack("Error al intentar agregar la Razón por Defecto en Clasificaciones debido a: " + e.message);
        } 
    }
    ,
    AgregarRazonPorDefectoConsignacion: function (errorCallBack) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var pSql = " ";
                    pSql = " INSERT INTO REASONS(";
                    pSql += "  REASON_TYPE";
                    pSql += ", REASON_PRIORITY";
                    pSql += ", REASON_VALUE";
                    pSql += ", REASON_PROMPT) VALUES (";
                    pSql += " 'ANNULMENT_CONSIGNMENT_REASON_POS' ";
                    pSql += ", 1";
                    pSql += ", 'SIN_RAZONES'";
                    pSql += ", 'Sin Razon')";
                    tx.executeSql(pSql);
                },
                function (err) {
                    if (err.code !== 0) {
                        errorCallBack("Error al intentar agregar la Razón por Defecto en Clasificaciones debido a: " + err.message);
                    }
                });
        } catch (e) {
            errorCallBack("Error al intentar agregar la Razón por Defecto en Clasificaciones debido a: " + e.message);
        }
    }
    ,
    AgregarClasificacion: function (clasificacion) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var pSql = " ";
                    pSql = " INSERT INTO CLASSIFICATION(";
                    pSql += "  GROUP_CLASSIFICATION";
                    pSql += ", NAME_CLASSIFICATION";
                    pSql += ", PRIORITY_CLASSIFICATION";
                    pSql += ", VALUE_TEXT_CLASSIFICATION) VALUES (";
                    pSql += " '" + clasificacion.GROUP_CLASSIFICATION + "'";
                    pSql += ",'" + clasificacion.NAME_CLASSIFICATION + "'";
                    pSql += ",'" + clasificacion.PRIORITY_CLASSIFICATION + "'";
                    pSql += ",'" + clasificacion.VALUE_TEXT_CLASSIFICATION + "')";

                    tx.executeSql(pSql);
                },
                function (err) {
                    if (err.code !== 0) {
                        notify("No se pudo insertar la Clasificacion debido a: " + err.message);
                    }
                });
        } catch (e) {
            notify("Error al intentar insertar la Clasificacion debido a: " + e.message);
        }
    }
    ,
    ObtenerClasificaciones: function (grupoDeClasificacion, callback, errorCallBack) {
        try {
            var clasificaciones = new Array();
            SONDA_DB_Session.transaction(
                function (trans) {
                    var pSql = "";
                    pSql = " SELECT";
                    pSql += "  GROUP_CLASSIFICATION";
                    pSql += ", NAME_CLASSIFICATION";
                    pSql += ", PRIORITY_CLASSIFICATION";
                    pSql += ", VALUE_TEXT_CLASSIFICATION";
                    pSql += " FROM CLASSIFICATION";
                    pSql += " WHERE GROUP_CLASSIFICATION = '" + grupoDeClasificacion + "' ";
                    pSql += " ORDER BY PRIORITY_CLASSIFICATION";

                    trans.executeSql(pSql, [],
                        function (trans2, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var clasificacion = {
                                    GROUP_CLASSIFICATION: results.rows.item(i).GROUP_CLASSIFICATION
                                    , NAME_CLASSIFICATION: results.rows.item(i).NAME_CLASSIFICATION
                                    , PRIORITY_CLASSIFICATION: results.rows.item(i).PRIORITY_CLASSIFICATION
                                    , VALUE_TEXT_CLASSIFICATION: results.rows.item(i).VALUE_TEXT_CLASSIFICATION
                                }
                                clasificaciones.push(clasificacion);
                            }
                            callback(clasificaciones);
                        }, function (error, trans2) {
                            if (error.code !== 0) {
                                errorCallBack("No se pudieron obtener las clasificaciones debido a: " + error.message);
                            }
                        });
                }, function (error) {
                    if (error.code !== 0) {
                        errorCallBack("No se pudieron obtener las clasificaciones debido a: " + error.message);
                    }
                });
        } catch (e) {
            errorCallBack("Error al intentar obtener las clasificaciones debido a: " + e.message);
        }
    }
}