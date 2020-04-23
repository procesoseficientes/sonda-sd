function DelegarABroadcast(socketIo) {
    
    socketIo.on('new_broadcast', function (data) {
        if (data.AssignedTo === "ALL" || data.AssignedTo === gCurrentRoute) {
            switch (data.Type) {
                case "tag":
                    switch (data.data.BroadcastOperacion) {
                        case BroadcastOperacion.Nuevo:
                            InsertarNuevaEtiqueta(data.data, function (dataN1) {
                                BroadcastRecivido(dataN1.Id, 1);
                                cordova.plugins.notification.badge.configure({ title: 'Se ha agregado una etiqueta ' });
                                cordova.plugins.notification.badge.set(1);
                            }, function (err) {
                                toast("Error al sincronizar nueva etiqueta");
                            });
                            break;
                        case BroadcastOperacion.Actualizacion:
                            ActualizarNuevaEtiqueta(data.data, function (dataN1) {
                                BroadcastRecivido(dataN1.Id, 1);
                                cordova.plugins.notification.badge.configure({ title: 'Se actualizado una etiqueta ' });
                                cordova.plugins.notification.badge.set(1);
                            }, function (err) {
                                toast("Error al actualizar etiqueta");
                            });
                            break;
                        case BroadcastOperacion.Borrar:
                            EliminarEtiqueta(data.data, function (dataN1) {
                                BroadcastRecivido(dataN1.Id, 1);
                                cordova.plugins.notification.badge.configure({ title: 'Se eliminado una etiqueta ' });
                                cordova.plugins.notification.badge.set(1);
                            }, function (err) {
                                toast("Error al eliminar etiqueta");
                            });
                            break;
                    }
                    break;
            }
        }
    });
}