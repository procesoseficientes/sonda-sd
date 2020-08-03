
var ReglasServicio = {


    GuardarReglas: function (regla, callBack, errorCallBack) {
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

            }, function (err) { //Si surge algun error al intentar insertar
                errorCallBack(err);
            }, function () { //Finaliza el inicio de transaccion
                callBack();
            });
        } catch (e) {
            errorCallBack(e);
        }
    }
    ,
    ObtenerRegla: function (tipoRegla, callBack, errorCallBack) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var sql = "SELECT *  ";
                    sql += " FROM RULE ";
                    sql += " WHERE TYPE = '" + tipoRegla + "'";
                    tx.executeSql(sql, [],
                        function (tx, results) {
                            callBack(results);
                        },
                        function (tx, err) {
                            if (err.code !== 0)
                                errorCallBack(err.message);
                        }
                    );
                },
                function (err) {
                    errorCallBack(err.message);
                }
            );
        } catch (e) {
            errorCallBack(e.message);
        }
    }
    ,
    LimpiarTabla: function (errorCallBack) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var sql = "DELETE FROM RULE";
                    tx.executeSql(sql);
                },
                function (err) {
                    errorCallBack(err.message);
                }
            );
        } catch (e) {
            errorCallBack(e);
        }
    }
    ,
    ObtenerReglasParaInicioDeTarea: function (callBack, errorCallBack) {
        try {
            SONDA_DB_Session.transaction(
                function (tx) {
                    var sql = "SELECT *  ";
                    sql += " FROM RULE ";
                    sql += " WHERE (TYPE = 'PuedeVenderAConsignacion' ";
                    sql += " OR TYPE = 'TomarFotoAlInicio') ";
                    sql += " AND (ENABLED = 'Si' OR ENABLED = 'SI') ";
                    sql += " ORDER BY EVENT_ORDER";
                    tx.executeSql(sql, [],
                        function (tx, results) {
                            callBack(results);
                        },
                        function (tx, err) {
                            if (err.code !== 0)
                                errorCallBack(err.message);
                        }
                    );
                },
                function (err) {
                    errorCallBack(err.message);
                }
            );
        } catch (e) {
            errorCallBack(e.message);
        }
    }
    ,
    EjecutarReglasDeInicioDeRuta: function (reglas, reglaActual, callback, errCallbak) {
        try {
            if (reglas == null) {
                callback();
                return;
            }
            if (reglaActual < reglas.rows.length) {

                var regla = reglas.rows.item(reglaActual);

                switch (regla.TYPE) {
                    case "PuedeVenderAConsignacion":
                        var cantidadConsignaciones = document.getElementById("UiClientHasConsignment").getAttribute("CONSIGNMENTS");
                        if (parseInt(cantidadConsignaciones) > 0) {
                            ReglasServicio.ObtenerRegla("CobrarConsignacion", function (regla) {
                                if (regla.rows.length > 0) {
                                    if (regla.rows.item(0).ENABLED === "Si" || regla.rows.item(0).ENABLED === "SI") {
                                        PagoConsignacionesControlador.MostrarPantallaPrincipalDePagoDeConsignacion();
                                    } else {
                                        ReglasServicio.EjecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                            callback();
                                        }, function (err) {
                                            errCallbak(err.message);
                                        });
                                    }
                                } else {
                                    ReglasServicio.EjecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                        callback();
                                    }, function (err) {
                                        errCallbak(err.message);
                                    });
                                }
                            }, function (error) {
                                notify(error);
                            });
                        }
                        else {
                            ReglasServicio.EjecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                callback();
                            }, function (err) {
                                errCallbak(err.message);
                            });
                        }


                        break;
                    case "TomarFotoAlInicio":

                        DispositivoServicio.TomarFoto(function (fotografia) {
                            gInitialTaskImage = "data:image/jpeg;base64," + fotografia;
                            ReglasServicio.EjecutarReglasDeInicioDeRuta(reglas, (reglaActual + 1), function () {
                                callback();
                            }, function (err) {
                                errCallbak(err.message);
                            });
                        }, function (err) {
                            errCallbak(err.message);
                        });

                        break;
                    default:
                        callback();
                        break;
                }
            } else {
                callback();
            }
        } catch (err) {
            errCallbak(err.message);

        }
    }

};