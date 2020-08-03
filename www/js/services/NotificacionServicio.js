function AgregarNotificacion(notificacion, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "INSERT INTO NOTIFICATION(TYPE,ID,EXTRA_INFO,DATE,IS_NEW)";
            sql += " VALUES (";
            sql += " '" + notificacion.TYPE + "'";
            sql += " ," + notificacion.ID;
            sql += " ,'" + notificacion.EXTRA_INFO + "'";
            sql += " , DATETIME() ";
            sql += " ," + notificacion.IS_NEW;
            sql += ");";
            tx.executeSql(sql);
        },
        function (err) {
            errCallback(err);
        },
        function () {
            callback();
        }
    );
}

function ActualizarNotificacion(notificacion, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "UPDATE NOTIFICATION";
            sql += " SET ";
            sql += " EXTRA_INFO = '" + notificacion.EXTRA_INFO + "'";
            sql += " ,DATE = '" + notificacion.DATE +"'";
            sql += " ,IS_NEW = " + notificacion.IS_NEW;
            sql += " WHERE TYPE ='" + notificacion.TYPE + "'";
            sql += " AND ID = " + notificacion.ID;
            sql += ";";
            tx.executeSql(sql);
        },
        function (err) {
            errCallback(err);
        },
        function () {
            callback();
        }
    );
}

function EliminarNotificacion(notificacion, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE FROM NOTIFICATION";
            sql += " WHERE TYPE ='" + notificacion.TYPE + "'";
            sql += " AND ID = " + notificacion.ID;
            sql += ";";
            tx.executeSql(sql);
        },
        function (err) {
            errCallback(err);
        },
        function () {
            callback();
        }
    );
}

function CambiarEsNuevaEnNotificacion(notificacion, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "UPDATE NOTIFICATION";
            sql += " SET ";
            sql += " IS_NEW = " + notificacion.IS_NEW;
            sql += " WHERE TYPE ='" + notificacion.TYPE + "'";
            sql += " AND ID = " + notificacion.ID;
            sql += ";";
            tx.executeSql(sql);
        },
        function (err) {
            errCallback(err);
        },
        function () {
            callback();
        }
    );
}

function ObtenerListadoDeNotifiaciones(callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT";
            sql += " N.TYPE";
            sql += " , N.ID";
            sql += " , N.EXTRA_INFO";
            sql += " , N.DATE";
            sql += " , N.IS_NEW";
            sql += " , TH.STATUS";
            sql += " FROM NOTIFICATION N";
            sql += " INNER JOIN TRANSFER_HEADER TH ON(TH.TRANSFER_ID = N.ID)";
            sql += " ORDER BY N.DATE";
            tx.executeSql(sql, [], function (txResult, notificationsRecordset) {
                var listadoNotificaciones = [];
                for (var i = 0; i < notificationsRecordset.rows.length; i++) {
                    var notificacionRow = notificationsRecordset.rows[i];
                    var notificacion = {
                        TYPE: notificacionRow.TYPE,
                        ID: notificacionRow.ID,
                        EXTRA_INFO: notificacionRow.EXTRA_INFO,
                        DATE: notificacionRow.DATE,
                        IS_NEW: notificacionRow.IS_NEW,
                        STATUS: notificacionRow.STATUS
                    };
                    listadoNotificaciones.push(notificacion);
                }
                    callback(listadoNotificaciones);
                },
                function (txResult, error) {
                    if (error.code !== 0) {
                        errCallback(error.message);
                    }
                });
        },
        function (err) {
            errCallback(err);
        }
    );
}
