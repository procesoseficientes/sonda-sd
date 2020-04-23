class TareaServcio implements ITareaServicio {

    actualizarTareaEstado(tarea: Tarea, callback: () => void, callbackError: (reultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sqlPresalesRoute = "UPDATE PRESALES_ROUTE SET TASK_STATUS = '" + tarea.taskStatus + "'";
                var sqlTask = "UPDATE TASK SET IS_POSTED=0, TASK_STATUS ='" + tarea.taskStatus + "'";
                switch (tarea.taskStatus) {
                    case TareaEstado.Aceptada:
                        sqlPresalesRoute += ", ACCEPTED_STAMP = '" + getDateTime()+"'"; 
                        sqlTask += ", ACCEPTED_STAMP ='" + getDateTime() + "'"; 
                        break;
                    case TareaEstado.Completada:
                        sqlPresalesRoute += ", COMPLETED_STAMP = '" + getDateTime() + "'"; 
                        sqlTask += ", COMPLETED_STAMP = '" + getDateTime() + "'"; 
                        sqlTask += ", COMPLETED_SUCCESSFULLY = " + ((tarea.completedSuccessfully) ? 1 : 0);
                        sqlTask += ", REASON = '" + tarea.reason + "'";
                        break;
                }
                sqlPresalesRoute += " WHERE TASK_ID = " + tarea.taskId;
                tx.executeSql(sqlPresalesRoute);
                sqlTask += ", POSTED_GPS ='" + gCurrentGPS + "' WHERE TASK_ID = " + tarea.taskId;
                tx.executeSql(sqlTask);
                callback();
            }
            , (err: SqlError) => {
                var operacion = new Operacion();
                operacion.resultado = ResultadoOperacionTipo.Error;
                operacion.codigo = err.code;
                operacion.mensaje = "Error al actualizar la tarea" + err.message;
                callbackError(operacion);
            }
        );
    }

    enviarTareaAceptada(tarea: Tarea, callbackError: (reultado: Operacion) => void) {
        try {
            var data = { 'taskid': tarea.taskId, 'dbuser': gdbuser, 'dbuserpass': gdbuserpass, 'gps': "" };
            socket.emit("task_accepted", data);
        } catch (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        }
    }

    obtenerRegla(pTipo: string, callback: (listaDeReglas: Regla[]) => void, callbackError: (reultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction(
                (tx) => {
                    var sql = "SELECT *  ";
                    sql += " FROM RULE ";
                    sql += " WHERE TYPE = '" + pTipo + "'";
                    tx.executeSql(sql, [],
                        (tx: SqlTransaction, results: SqlResultSet) => {
                            var listaDeReglas: Regla[] = [];
                            if (results.rows.length >= 1) {
                                for (let i = 0; i < results.rows.length; i++) {
                                    const reglaSql: any = results.rows.item(i);
                                    const regla = new Regla();

                                    regla.eventId = reglaSql.EVENT_ID;
                                    regla.nameEvent = reglaSql.NAME_EVENT;
                                    regla.type = reglaSql.TYPE;
                                    regla.filters = reglaSql.FILTERS;
                                    regla.action = reglaSql.ACTION;
                                    regla.nameAction = reglaSql.NAME_ACTION;
                                    regla.typeAction = reglaSql.TYPE_ACTION;
                                    regla.enabled = reglaSql.ENABLED;
                                    regla.code = reglaSql.CODE;
                                    regla.enventOrder = reglaSql.EVENT_ORDER;
                                    listaDeReglas.push(regla);
                                }
                            }
                            callback(listaDeReglas);
                        }
                    );
                },
                (err: SqlError) => {
                    var operacion = new Operacion();
                    operacion.resultado = ResultadoOperacionTipo.Error;
                    operacion.codigo = err.code;
                    operacion.mensaje = err.message;
                    callbackError(operacion);
                }
            );
        } catch (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        }
    }

    obtenerTarea(tarea: Tarea, callback: (tarea: Tarea) => void, errCallBack: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = " SELECT * ";
                sql += " FROM TASK ";
                sql += " WHERE TASK_ID = " + tarea.taskId;

                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length >= 1) {
                            var detalleTemp: any = results.rows.item(0);
                            var tareaTemp = new Tarea();
                            tareaTemp.taskId = detalleTemp.TASK_ID;
                            tareaTemp.taskType = detalleTemp.TASK_TYPE;
                            tareaTemp.taskStatus = detalleTemp.TASK_STATUS;
                            tareaTemp.relatedClientCode = detalleTemp.RELATED_CLIENT_CODE;
                            tareaTemp.relatedClientName = detalleTemp.RELATED_CLIENT_NAME;
                            tareaTemp.taskAddress = detalleTemp.TASK_ADDRESS;
                            tareaTemp.taskComments = detalleTemp.TASK_COMMENTS;
                            tareaTemp.completedSuccessfully = (detalleTemp.COMPLETED_SUCCESSFULLY !== 0);
                            tareaTemp.reason = detalleTemp.REASON;
                            tareaTemp.taskBoId = detalleTemp.TASK_BO_ID;
                            callback(tareaTemp);
                        } else {
                            errCallBack(<Operacion>{ codigo: -1, mensaje: "No se encontro la tarea." });
                        }
                    });
            },
            (err: SqlError) => {
                errCallBack(<Operacion>{ codigo: -1, mensaje: "Error al obtener la tarea: " + err.message });
            }
        );
    }

    obtenerTareasDeCliente(cliente: Cliente, callback: (listaDeTareas: Tarea[]) => void, errCallBack: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = " SELECT * ";
                sql += " FROM TASK ";
                sql += " WHERE RELATED_CLIENT_CODE = '" + cliente.clientId + "'";

                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        var listaDeTareas: Tarea[] = [];
                        for (let i = 0; i < results.rows.length; i++) {
                            var detalleTemp: any = results.rows.item(i);
                            var tareaTemp = new Tarea();
                            tareaTemp.taskId = detalleTemp.TASK_ID;
                            tareaTemp.taskType = detalleTemp.TASK_TYPE;
                            tareaTemp.taskStatus = detalleTemp.TASK_STATUS;
                            tareaTemp.relatedClientCode = detalleTemp.RELATED_CLIENT_CODE;
                            tareaTemp.relatedClientName = detalleTemp.RELATED_CLIENT_NAME;
                            tareaTemp.taskAddress = detalleTemp.TASK_ADDRESS;
                            tareaTemp.taskComments = detalleTemp.TASK_COMMENTS;
                            tareaTemp.completedSuccessfully = (detalleTemp.COMPLETED_SUCCESSFULLY !== 0);
                            tareaTemp.reason = detalleTemp.REASON;
                            tareaTemp.taskBoId = detalleTemp.TASK_BO_ID;
                            listaDeTareas.push(tareaTemp);
                        }
                        callback(listaDeTareas);
                    });
            },
            (err: SqlError) => {
                errCallBack(<Operacion>{ codigo: -1, mensaje: "Error al obtener la tarea: " + err.message });
            }
        );
    }


    actualizarClienteTarea(tareaId, idCliente, nombreCliente, direccionCliente, callback: (tareaId) => void, callbackError: (reultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {

                var sqlTask = "UPDATE TASK SET ";
                sqlTask += " TASK_ADDRESS ='" + direccionCliente + "'";
                sqlTask += ", RELATED_CLIENT_CODE = '" + idCliente + "'";
                sqlTask += ", RELATED_CLIENT_NAME = '" + nombreCliente+"'";
                sqlTask += " WHERE TASK_ID = " + tareaId;
                tx.executeSql(sqlTask);

                var sqlPresales = "UPDATE PRESALES_ROUTE SET ";
                sqlPresales += " TASK_ADDRESS ='" + direccionCliente + "'";
                sqlPresales += ", RELATED_CLIENT_CODE = '" + idCliente + "'";
                sqlPresales += ", RELATED_CLIENT_NAME = '" + nombreCliente + "'";
                sqlPresales += " WHERE TASK_ID = " + tareaId;
                tx.executeSql(sqlPresales);

                callback(tareaId);
            }
            , (err: SqlError) => {
                var operacion = new Operacion();
                operacion.resultado = ResultadoOperacionTipo.Error;
                operacion.codigo = err.code;
                operacion.mensaje = "Error al actualizar la tarea" + err.message;
                callbackError(operacion);
            }
        );
    }

    obtenerTareaBo(tarea: Tarea, callback: (tarea: Tarea) => void, callbackError: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction(
                (tx) => {
                    var sql = "SELECT";
                    sql += " T.TASK_BO_ID";
                    sql += " FROM TASK T";
                    sql += " WHERE T.TASK_ID = " + tarea.taskId;
                    tx.executeSql(sql, [],
                        (tx: SqlTransaction, results: SqlResultSet) => {
                            if (results.rows.length > 0) {
                                var tareaTemp: any = results.rows.item(0);
                                tarea.taskBoId = tareaTemp.TASK_BO_ID;
                            } else {
                                callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener el codigo de tarea: Sin resultados" });
                            }
                            callback(tarea);
                        }
                    );
                }, (err: SqlError) => {
                    callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener el codigo de tarea: " + err.message });
                }
            );

        } catch (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        }
    }

    verificarTareaPosteada(idTarea: number, callBack: (isPosted:number) =>void, errorCallBack: (resultado:Operacion) =>void): void {
        let op: Operacion;
        try {

            SONDA_DB_Session.transaction((trans) => {

                let sql = `SELECT IS_POSTED FROM TASK WHERE TASK_ID = ${idTarea}`;

                trans.executeSql(sql, [], (transReturn, recordSet) => {

                    if (recordSet.rows.length > 0) {
                        let registro: any = recordSet.rows.item(0);
                        callBack(parseInt(registro.IS_POSTED));
                    } else {
                        callBack(0);
                    }

                }, (transReturn, errorReturn) => {
                    if (errorReturn.code !== 0) {
                        op = new Operacion();
                        op.codigo = errorReturn.code;
                        op.mensaje = errorReturn.message;
                        op.resultado = ResultadoOperacionTipo.Error;
                        errorCallBack(op);
                        op = null;
                    }
                });

            }, (error) => {
                if (error.code !== 0) {
                    op = new Operacion();
                    op.codigo = error.code;
                    op.mensaje = error.message;
                    op.resultado = ResultadoOperacionTipo.Error;
                    errorCallBack(op);
                    op = null;
                }
            });

        } catch (e) {
            op = new Operacion();
            op.codigo = -1;
            op.mensaje = e.message;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallBack(op);
            op = null;
        } 
    }

}
