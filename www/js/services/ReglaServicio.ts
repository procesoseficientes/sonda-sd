class ReglaServicio implements IReglaServicio {
    guardarReglas(regla, callback: () => void, errorCallBack: (error: any) => void): void {
        try {
            SONDA_DB_Session.transaction(tx => {

                var pSql = `DELETE FROM RULE WHERE EVENT_ID = ${regla.EVENT_ID}`;
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
                pSql += ` ${regla.EVENT_ID}`;
                pSql += ` , '${regla.NAME_EVENT}'`;
                pSql += ` , '${regla.TYPE}'`;
                pSql += ` , '${regla.FILTERS}'`;
                pSql += ` , '${regla.ACTION}'`;
                pSql += ` , '${regla.NAME_ACTION}'`;
                pSql += ` , '${regla.TYPE_ACTION}'`;
                pSql += ` , '${regla.ENABLED}'`;
                pSql += ` , '${regla.CODE}'`;
                pSql += ` , '${regla.EVENT_ORDER}'`;
                pSql += " )";
                tx.executeSql(pSql);

            }, err => { //Si surge algun error al intentar insertar
                errorCallBack(err);
            }, () => { //Finaliza el inicio de transaccion
                callback();
            });
        } catch (e) {
            errorCallBack(e);
        }
    }

    obtenerRegla(tipoRegla: string, callbak: (results: SqlResultSet) => void, errorCallback: (error: string) => void):
        void {
        try {
            SONDA_DB_Session.transaction(
                tx => {
                    var sql = "SELECT *  ";
                    sql += " FROM RULE ";
                    sql += ` WHERE TYPE = '${tipoRegla}'`;
                    tx.executeSql(sql, [],
                        (txResult, results) => {
                            callbak(results);
                        },
                        (txResult, err) => {
                            if (err.code !== 0)
                                errorCallback(err.message);
                        }
                    );
                },
                err => {
                    errorCallback(err.message);
                }
            );
        } catch (e) {
            errorCallback(e.message);
        }
    }

    limpiarTabla(errorCallback: (error: any) => void): void {
        try {
            SONDA_DB_Session.transaction(
                tx => {
                    var sql = "DELETE FROM RULE";
                    tx.executeSql(sql);
                },
                err => {
                    errorCallback(err);
                }
            );
        } catch (e) {
            errorCallback(e);
        }
    }

    obtenerReglasParaInicioDeTarea(callback: (results: SqlResultSet) => void, errorCallback: (error: string) => void):
        void {
        try {
            SONDA_DB_Session.transaction(
                tx => {
                    var sql = "SELECT *  ";
                    sql += " FROM RULE ";
                    sql += " WHERE (TYPE = 'PuedeVenderAConsignacion' ";
                    sql += " OR TYPE = 'TomarFotoAlInicio') ";
                    sql += " AND (ENABLED = 'Si' OR ENABLED = 'SI') ";
                    sql += " ORDER BY EVENT_ORDER";
                    tx.executeSql(sql, [],
                        (txResult, results) => {
                            callback(results);
                        },
                        (txResult, err) => {
                            if (err.code !== 0)
                                errorCallback(err.message);
                        }
                    );
                },
                err => {
                    errorCallback(err.message);
                }
            );
        } catch (e) {
            errorCallback(e.message);
        }
    }

    ejecutarReglasDeInicioDeRuta(reglas: SqlResultSet,
        reglaActual: number,
        callback: () => void,
        errorCallback: (error: string) => void): void {
        try {
            if (reglas == null) {
                callback();
                return;
            }
            if (reglaActual < reglas.rows.length) {

                let reglaAct: any = reglas.rows.item(reglaActual);

                switch (reglaAct.TYPE) {
                    case "PuedeVenderAConsignacion":
                        var cantidadConsignaciones = document.getElementById("UiClientHasConsignment")
                            .getAttribute("CONSIGNMENTS");
                        if (parseInt(cantidadConsignaciones) > 0) {
                            this.obtenerRegla("CobrarConsignacion",
                                regla => {
                                    if (regla.rows.length > 0) {
                                        if ((regla.rows.item(0) as any).ENABLED === "Si" ||
                                            (regla.rows.item(0) as any).ENABLED === "SI") {
                                            PagoConsignacionesControlador.MostrarPantallaPrincipalDePagoDeConsignacion();
                                        } else {
                                            this.ejecutarReglasDeInicioDeRuta(reglas,
                                                (reglaActual + 1),
                                                () => {
                                                    callback();
                                                },
                                                err => {
                                                    errorCallback((err as any).message);
                                                });
                                        }
                                    } else {
                                        this.ejecutarReglasDeInicioDeRuta(reglas,
                                            (reglaActual + 1),
                                            () => {
                                                callback();
                                            },
                                            err => {
                                                errorCallback((err as any).message);
                                            });
                                    }
                                },
                                error => {
                                    notify(error);
                                });
                        } else {
                            this.ejecutarReglasDeInicioDeRuta(reglas,
                                (reglaActual + 1),
                                () => {
                                    callback();
                                },
                                err => {
                                    errorCallback((err as any).message);
                                });
                        }


                        break;
                    case "TomarFotoAlInicio":
                        DispositivoServicio.TomarFoto(fotografia => {
                            gInitialTaskImage = "data:image/jpeg;base64," + fotografia;
                            this.ejecutarReglasDeInicioDeRuta(reglas,
                                (reglaActual + 1),
                                () => {
                                    callback();
                                },
                                err => {
                                    errorCallback((err as any).message);
                                });
                        },
                            err => {
                                errorCallback(err.message);
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
            errorCallback(err.message);

        }
    }
}