function CrearTarea(clienteNuevo, tipoTarea, callback) {

    GetNexSequence("TASK", function (codigoTarea) {
        SONDA_DB_Session.transaction(
            function (tx) {
                var xdate = getDateTime();
                var sql = "INSERT INTO PRESALES_ROUTE(TASK_ID, SCHEDULE_FOR, ASSIGNED_BY, DOC_PARENT, EXPECTED_GPS, ";
                sql += "TASK_COMMENTS, TASK_SEQ, TASK_ADDRESS, RELATED_CLIENT_PHONE_1, EMAIL_TO_CONFIRM, RELATED_CLIENT_CODE, RELATED_CLIENT_NAME, TASK_PRIORITY, TASK_STATUS, SYNCED, IS_OFFLINE, TASK_TYPE, IN_PLAN_ROUTE, CREATE_BY) ";
                sql += "VALUES(" + parseInt(codigoTarea) + ",'" + xdate + "','" + xdate + "',0";
                sql += ", '" + gCurrentGPS + "','Tarea generada para nuevo cliente " + clienteNuevo.Nombre + "',1,'" + clienteNuevo.Direccion + "'";
                sql += ", '" + clienteNuevo.Telefono + "','','" + clienteNuevo.CodigoHH + "','" + clienteNuevo.Nombre + "',1,'" + TareaEstado.Asignada + "', 1, 1, '" + tipoTarea + "',0,'BY_USER')";
                tx.executeSql(sql);

                sql = ObtenerInsertTarea(clienteNuevo, codigoTarea, tipoTarea);
                tx.executeSql(sql);

                callback(clienteNuevo, codigoTarea);
            }, function (err) {
                notify(err.message);
            });
    }, function (err) {
        notify(err.message);
    });

    if (gIsOnline === 1) {
        socket.emit('getmyrouteplan', { 'loginid': gLastLogin, 'dbuser': gdbuser, 'dbuserpass': gdbuserpass });   
    }
}

function ObtenerInsertTarea(clienteNuevo, codigoTarea, tipoTarea) {
    var fechaActual = getDateTime();
    var sql = "";
    sql = "INSERT INTO TASK ("
                    + "TASK_ID"
                    + " ,TASK_TYPE"
                    + " ,TASK_DATE"
                    + " ,SCHEDULE_FOR"
                    + " ,CREATED_STAMP"
                    + " ,ASSIGEND_TO"
                    + " ,ASSIGNED_BY"
                    + " ,ACCEPTED_STAMP"
                    + " ,COMPLETED_STAMP"
                    + " ,EXPECTED_GPS"
                    + " ,POSTED_GPS"
                    + " ,TASK_COMMENTS"
                    + " ,TASK_SEQ"
                    + " ,TASK_ADDRESS"
                    + " ,RELATED_CLIENT_CODE"
                    + " ,RELATED_CLIENT_NAME"
                    + " ,TASK_STATUS"
                    + " ,IS_POSTED"
                    + " ,TASK_BO_ID"
                    + " ,IN_PLAN_ROUTE"
                    + " ,CREATE_BY, DEVICE_NETWORK_TYPE, IS_POSTED_OFFLINE"
                    + ")"
                    + " VALUES("
                    + parseInt(codigoTarea)
                    + ",'" + tipoTarea + "'"
                    + ",'" + fechaActual + "'"
                    + ",'" + fechaActual + "'"
                    + ",'" + fechaActual + "'"
                    + ",'" + gLastLogin + "'"
                    + ",'" + gLastLogin + "'"
                    + ",null"
                    + ",null"
                    + ",'" + gCurrentGPS + "'"
                    + ",null"
                    + ",'Tarea generada para nuevo cliente " + clienteNuevo.Nombre + "'"
                    + ",0"
                    + ",'" + clienteNuevo.Direccion + "'"
                    + ",'" + clienteNuevo.CodigoHH + "'"
                    + ",'" + clienteNuevo.Nombre + "'"
                    + ",'ASSIGNED'"
                    + ",0"
                    + ",null"
                    + ",0"
                    + ",'BY_USER'"
                    + ", '" + tipoDeRedALaQueEstaConectadoElDispositivo + "'"
                    + ", " + (gIsOnline === SiNo.Si ? 0 : 1)
                    + ")";

    return sql;
}

function ActualizarTareaEstado(taskId, status, callback, errCallback) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sqlPresalesRoute = "UPDATE PRESALES_ROUTE SET TASK_STATUS = '" + status + "'";
             var sqlTask = "UPDATE TASK SET IS_POSTED=0, TASK_STATUS ='" + status + "'";
             switch (status) {
                 case TareaEstado.Aceptada:
                     sqlPresalesRoute += ", ACCEPTED_STAMP = '" + getDateTime() + "'";
                     sqlTask += ", ACCEPTED_STAMP = '" + getDateTime() + "'";
                     break;
                 case TareaEstado.Completada:
                     sqlPresalesRoute += ", COMPLETED_STAMP = '" + getDateTime() + "'";
                     sqlTask += ", COMPLETED_STAMP = '" + getDateTime() + "'"; 
                     break;

                 default:
             }
             sqlPresalesRoute += " WHERE TASK_ID = " + taskId;
             tx.executeSql(sqlPresalesRoute);
             sqlTask += ", POSTED_GPS ='" + gCurrentGPS + "' WHERE TASK_ID = " + taskId;
             tx.executeSql(sqlTask);
             callback();
         },
        function (err) {
            errCallback(err);
        }
    );
}

function SeguirTareaPreventa() {
    ActualizarTareaEstado(gtaskid, TareaEstado.Aceptada, function () {
        if (gPreguntaTipoOrdenDeVenta === 1) {
            UsuarioDeseaVerOpcionesDeTipoDeOrdenesDeVenta(function() {
                EjecutarTareaDePreVenta(gClientID);
            }, function(err) {
                notify(err.message);
            });
        } else {
            EjecutarTareaDePreVenta(gClientID);
        }

    }, function (err) {
        notify(err.message);
    });
}