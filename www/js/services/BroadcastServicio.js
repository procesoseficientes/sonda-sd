var estaObteniendoBroadcastsPerdidos = false;

function delegarABroadcast(socketIo) {    

    var notificacionControlador = new NotificacionControlador();
    socketIo.on('new_broadcast', function (data) {
        if (data.AssignedTo === "ALL" || data.AssignedTo === gCurrentRoute) {
            switch (data.Type) {
                case "transfer":
                    var notificacion = {
                        TYPE: data.Type,
                        ID: data.data.TRANSFER_ID,
                        EXTRA_INFO: data.data.CODE_WAREHOUSE_SOURCE,
                        DATE: data.data.LAST_UPDATE,
                        IS_NEW: EsNuevaNotificacion.Si
                    };

                    switch (data.BroadcastOperacion) {
                        case BroadcastOperacion.Nuevo:
                            ValidarExistenciaDeTransferenciaEnElMovil(data.data,
                                function (agregarNotificacion, transferencia) {
                                    if (agregarNotificacion) {
                                        console.dir(transferencia);
                                        AgregarTransferencia(transferencia, function () {
                                            AgregarNotificacion(notificacion, function () {
                                                BroadcastRecivido(data.Id, SiNo.Si);
                                                ActualizarCantidadDeNotificaciones();
                                                ToastThis("Se ha recibido una transferencia desde el BO.");
                                                navigator.vibrate([500, 250, 500, 250, 500]);
                                                navigator.notification.beep(1);
                                                if (gIsOnNotificationPage) {
                                                    ObtenerListadoDeNotifiaciones(function (listaNotificaciones) {
                                                        notificacionControlador.CrearListadoDeNotificaciones(listaNotificaciones);
                                                    }, function (error) {
                                                        notify("Error al obtener notificaciones: " + error);
                                                    });
                                                }
                                            }, function (err) {
                                                notify("Error al recibir notificacion: " + err.message);
                                            });
                                        }, function (err) {
                                            notify("Error al recibir transferencia: " + err.message);
                                        });
                                    }
                                },
                                function (error) {
                                    notify(error);
                                });


                            break;
                        case BroadcastOperacion.Actualizacion:
                            ActualizarTransferencia(data.data, function () {
                                ActualizarNotificacion(notificacion, function () {
                                    BroadcastRecivido(data.Id, SiNo.Si);
                                    ActualizarCantidadDeNotificaciones();
                                    ToastThis("Se ha actualizado una transferencia desde el BO.");
                                    navigator.vibrate([500, 250, 500, 250, 500]);
                                    navigator.notification.beep(1);
                                    if (gIsOnNotificationPage) {
                                        ObtenerListadoDeNotifiaciones(function (listaNotificaciones) {
                                            notificacionControlador.CrearListadoDeNotificaciones(listaNotificaciones);
                                        }, function (error) {
                                            notify("Error al obtener notificaciones: " + error);
                                        });
                                    }
                                }, function (err) {
                                    notify("Error al actualizar notificacion: " + err.message);
                                });
                            }, function (err) {
                                notify("Error al actualizar transferencia: " + err.message);
                            });
                            break;
                        case BroadcastOperacion.Borrar:
                            EliminarTransferencia(data.data, function () {
                                EliminarNotificacion(notificacion, function () {
                                    BroadcastRecivido(data.Id, SiNo.Si);
                                    ActualizarCantidadDeNotificaciones();
                                    ToastThis("Se ha eliminado una transferencia desde el BO.");
                                    navigator.vibrate([500, 250, 500, 250, 500]);
                                    navigator.notification.beep(1);
                                    if (gIsOnNotificationPage) {
                                        ObtenerListadoDeNotifiaciones(function (listaNotificaciones) {
                                            notificacionControlador.CrearListadoDeNotificaciones(listaNotificaciones);
                                        }, function (error) {
                                            notify("Error al obtener notificaciones: " + error);
                                        });
                                    }
                                }, function (err) {
                                    notify("Error al eliminar notificacion: " + err.message);
                                });
                            }, function (err) {
                                notify("Error al eliminar transferencia: " + err.message);
                            });
                            break;
                    }
                    break;
            }
        }
    });
}

function BroadcastRecivido(id, borrar) {
    var data =
    {
        'Id': id
        , 'Status': "RECEIVED"
        , 'dbuser': gdbuser
        , 'dbuserpass': gdbuserpass
        , 'battery': gBatteryLevel
        , 'routeid': gCurrentRoute
    };
    if (borrar === 1) {
        SocketControlador.socketIo.emit('DeleteBroadcast', data);
    } else {
        SocketControlador.socketIo.emit('UpdateBroadcast', data);
    }
}

function ObtenerBroadcastPerdidos() {
    if (estaObteniendoBroadcastsPerdidos) {
        return false;
    } else {
        estaObteniendoBroadcastsPerdidos = true;
        var data =
        {
            'dbuser': gdbuser,
            'dbuserpass': gdbuserpass,
            'battery': gBatteryLevel,
            'routeid': gCurrentRoute
        };
        SocketControlador.socketIo.emit('GetBroadcastLost', data);
        return setTimeout(function () {
            estaObteniendoBroadcastsPerdidos = false;
        }, 5000);
    }
}