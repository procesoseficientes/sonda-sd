
function ReglaPosteriorCrearCliente(reglas, reglaActual, clienteNuevo, callback, errCallbak) {
    try {
        if (reglas == null) {
            callback();
            return;
        }
        if (reglaActual < reglas.rows.length) {

            var regla = reglas.rows.item(reglaActual);

            switch (regla.TYPE_ACTION) {
                case "ScoutingFinalizada":
                    CrearTarea(clienteNuevo, TareaTipo.Scouting, function (clienteNuevoN2, codigoTarea) {
                        actualizarListadoDeTareas(codigoTarea, TareaTipo.Scouting, TareaEstado.Completada, clienteNuevoN2.CodigoHH, clienteNuevo.Nombre, clienteNuevo.Direccion, 0, "", clienteNuevo.rgaCode);
                        ActualizarTareaEstado(codigoTarea, TareaEstado.Completada, function () {
                            ReglaPosteriorCrearCliente(reglas, (reglaActual + 1), clienteNuevo, function () {
                                callback();
                            }, function (err) {
                                errCallbak(err.message);
                            });
                        }, function (err) {
                            errCallbak(err.message);
                        });

                    }, function (err) {
                        errCallbak(err.message);
                    });
                    break;
                case "VentaDirecta":
                    CrearTarea(clienteNuevo, TareaTipo.Venta, function (clienteNuevoN2, codigoTarea) {
                        actualizarListadoDeTareas(codigoTarea, TareaTipo.Venta, TareaEstado.Asignada, clienteNuevoN2.CodigoHH, clienteNuevo.Nombre, clienteNuevo.Direccion, 0, "", clienteNuevo.rgaCode);
                        ReglaPosteriorCrearCliente(reglas, (reglaActual + 1), clienteNuevo, function () {
                            callback();
                        }, function (err) {
                            errCallbak(err.message);
                        });
                    }, function (err) {
                        errCallbak(err.message);
                    });
                    break;
                case "Preventa":
                    CrearTarea(clienteNuevo, TareaTipo.Preventa, function (clienteNuevoN2, codigoTarea) {
                        actualizarListadoDeTareas(codigoTarea, TareaTipo.Preventa, TareaEstado.Asignada, clienteNuevoN2.CodigoHH, clienteNuevo.Nombre, clienteNuevo.Direccion, 0, "", clienteNuevo.rgaCode);
                        ReglaPosteriorCrearCliente(reglas, (reglaActual + 1), clienteNuevo, function () {
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

function ObtenerReglas(pTipo, callback, errCallbak) {
    try {
        SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT *  ";
            sql += " FROM RULE ";
            sql += " WHERE TYPE = '" + pTipo + "'";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
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
    } catch (err) {
        errCallbak(err.message);
    }
}