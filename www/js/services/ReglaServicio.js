var ReglaServicio = (function () {
    function ReglaServicio() {
    }
    ReglaServicio.prototype.guardarReglas = function (regla, callback, errorCallBack) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var pSql = "DELETE FROM RULE WHERE EVENT_ID = " + regla.EVENT_ID;
                tx.executeSql(pSql);
                pSql = " INSERT INTO RULE(";
                pSql += " EVENT_ID";
                pSql += " , NAME_EVENT";
                pSql += " , TYPE";
                pSql += " , FILTERS";
                pSql += " , ACTION";
                pSql += " , NAME_ACTION";
                pSql += " , TYPE_ACTION";
                pSql += " , ENABLED";
                pSql += " , CODE";
                pSql += " , EVENT_ORDER";
                pSql += " )VALUES(";
                pSql += " " + regla.EVENT_ID;
                pSql += " , '" + regla.NAME_EVENT + "'";
                pSql += " , '" + regla.TYPE + "'";
                pSql += " , '" + regla.FILTERS + "'";
                pSql += " , '" + regla.ACTION + "'";
                pSql += " , '" + regla.NAME_ACTION + "'";
                pSql += " , '" + regla.TYPE_ACTION + "'";
                pSql += " , '" + regla.ENABLED + "'";
                pSql += " , '" + regla.CODE + "'";
                pSql += " , '" + regla.EVENT_ORDER + "'";
                pSql += " )";
                tx.executeSql(pSql);
            }, function (err) {
                errorCallBack(err);
            }, function () {
                callback();
            });
        }
        catch (e) {
            errorCallBack(e);
        }
    };
    ReglaServicio.prototype.obtenerRegla = function (tipoRegla, callbak, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "SELECT *  ";
                sql += " FROM RULE ";
                sql += " WHERE TYPE = '" + tipoRegla + "'";
                tx.executeSql(sql, [], function (txResult, results) {
                    callbak(results);
                }, function (txResult, err) {
                    if (err.code !== 0)
                        errorCallback(err.message);
                });
            }, function (err) {
                errorCallback(err.message);
            });
        }
        catch (e) {
            errorCallback(e.message);
        }
    };
    ReglaServicio.prototype.limpiarTabla = function (errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "DELETE FROM RULE";
                tx.executeSql(sql);
            }, function (err) {
                errorCallback(err);
            });
        }
        catch (e) {
            errorCallback(e);
        }
    };
    ReglaServicio.prototype.obtenerReglasParaInicioDeTarea = function (callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "SELECT *  ";
                sql += " FROM RULE ";
                sql += " WHERE (TYPE = 'PuedeVenderAConsignacion' ";
                sql += " OR TYPE = 'TomarFotoAlInicio') ";
                sql += " AND (ENABLED = 'Si' OR ENABLED = 'SI') ";
                sql += " ORDER BY EVENT_ORDER";
                tx.executeSql(sql, [], function (txResult, results) {
                    callback(results);
                }, function (txResult, err) {
                    if (err.code !== 0)
                        errorCallback(err.message);
                });
            }, function (err) {
                errorCallback(err.message);
            });
        }
        catch (e) {
            errorCallback(e.message);
        }
    };
    ReglaServicio.prototype.ejecutarReglasDeInicioDeRuta = function (reglas, reglaActual, callback, errorCallback) {
        var _this = this;
        try {
            if (reglas == null) {
                callback();
                return;
            }
            if (reglaActual < reglas.rows.length) {
                var reglaAct = reglas.rows.item(reglaActual);
                switch (reglaAct.TYPE) {
                    case "PuedeVenderAConsignacion":
                        var cantidadConsignaciones = document.getElementById("UiClientHasConsignment")
                            .getAttribute("CONSIGNMENTS");
                        if (parseInt(cantidadConsignaciones) > 0) {
                            this.obtenerRegla("CobrarConsignacion", function (regla) {
                                if (regla.rows.length > 0) {
                                    if (regla.rows.item(0).ENABLED === "Si" ||
                                        regla.rows.item(0).ENABLED === "SI") {
                                        PagoConsignacionesControlador.MostrarPantallaPrincipalDePagoDeConsignacion();
                                    }
                                    else {
                                        _this.ejecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                            callback();
                                        }, function (err) {
                                            errorCallback(err.message);
                                        });
                                    }
                                }
                                else {
                                    _this.ejecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                        callback();
                                    }, function (err) {
                                        errorCallback(err.message);
                                    });
                                }
                            }, function (error) {
                                notify(error);
                            });
                        }
                        else {
                            this.ejecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                callback();
                            }, function (err) {
                                errorCallback(err.message);
                            });
                        }
                        break;
                    case "TomarFotoAlInicio":
                        DispositivoServicio.TomarFoto(function (fotografia) {
                            gInitialTaskImage = "data:image/jpeg;base64," + fotografia;
                            _this.ejecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                callback();
                            }, function (err) {
                                errorCallback(err.message);
                            });
                        }, function (err) {
                            errorCallback(err.message);
                        });
                        break;
                    default:
                        callback();
                        break;
                }
            }
            else {
                callback();
            }
        }
        catch (err) {
            errorCallback(err.message);
        }
    };
    return ReglaServicio;
}());
//# sourceMappingURL=ReglaServicio.js.map