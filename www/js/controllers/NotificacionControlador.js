var NotificacionControlador = (function () {
    function NotificacionControlador() {
        this.transferenciaDetalleControlador = new TransferenciaDetalleControlador();
    }

    NotificacionControlador.prototype.delegarNotificacionControlador = function () {
        var _this = this;

        $("#UiBtnNotifications").on("click",
            function () {
                my_dialog("Espere", "Procesando Notificaciones...", "open");
                _this.MostrarListadoDeNotificaciones();

            });

        $("#UiNotificationPage").on("pageshow",
            function () {
                window.gIsOnNotificationPage = true;
                ObtenerListadoDeNotifiaciones(function (listaNotificaciones) {
                    _this.CrearListadoDeNotificaciones(listaNotificaciones, EstaEnPantallaDeNotificaciones.Si);
                }, function (error) {
                    my_dialog("Espere", "Procesando Notificaciones...", "close");
                    notify("Error al obtener notificaciones: " + error);
                });
            });

        $("#UiNotificationPage").on("click",
            "#UiListaDeNotificaciones a",
            function (e) {
                var id = e.currentTarget.attributes["id"].nodeValue;
                var status = e.currentTarget.attributes["STATUS"].nodeValue;

                var listPicker = function (configuracion) {
                    window.plugins.listpicker.showPicker(configuracion,
                        function (item) {
                            switch (item) {
                                case NotificacionDeTransferencia.AceptarTransferencia:
                                    InteraccionConUsuarioServicio.bloquearPantalla();
                                    var idTransferencia = parseInt(id);
                                    _this.transferenciaDetalleControlador
                                        .AceptarTransferencia(idTransferencia,
                                            function (error) {
                                                InteraccionConUsuarioServicio.bloquearPantalla();
                                                notify(error);
                                            },
                                            LugarDeEnvioDeTransferenciaAceptada.ListadoDeNotificacions);
                                    break;
                                case NotificacionDeTransferencia.VerDetalle:
                                    console.log("ver detalle");
                                    _this.ProcesarTransferencia(id);
                                    break;
                            }
                        });
                }

                var config = {};
                if (status === EstadoDeTransferencia.Completado) {
                    config = {
                        title: "Seleccione una acción",
                        items: [
                            { text: "Aceptar Transferencia", value: NotificacionDeTransferencia.AceptarTransferencia }
                            , { text: "Ver Detalle", value: NotificacionDeTransferencia.VerDetalle }
                        ]
                    }
                    listPicker(config);
                } else {
                    config = {
                        title: "Seleccione una acción",
                        items: [
                            { text: "Ver Detalle", value: NotificacionDeTransferencia.VerDetalle }
                        ]
                    }
                    listPicker(config);
                }

            });
    };

    NotificacionControlador.prototype.delegarSockets = function (socketIo) {
        var _this = this;
        socketIo.on("SendAcceptedTransfer_Request" + LugarDeEnvioDeTransferenciaAceptada.ListadoDeNotificacions,
            function (data) {
                switch (data.option) {
                    case "success":
                        InsertarListaDePrecioFueraDeRuta(data.skus, data.conversiones, function () {

                            _this.transferenciaDetalleControlador.ProcesarSkusDeTransferencia(parseInt(data.data.transferId),
                                function () {
                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                    notify("Transferencia aceptada exitosamente...");
                                    var notificacion = {
                                        IS_NEW: EsNuevaNotificacion.No
                                        , TYPE: TipoDeNotificacion.TransferenciaDeInventario
                                        , ID: parseInt(data.data.transferId)
                                    }
                                    CambiarEsNuevaEnNotificacion(notificacion, function () {
                                        if (gIsOnNotificationPage) {
                                            ObtenerListadoDeNotifiaciones(function (listaNotificaciones) {
                                                _this.CrearListadoDeNotificaciones(listaNotificaciones);
                                            }, function (error) {
                                                my_dialog("Espere", "Procesando Notificaciones...", "close");
                                                notify("Error al obtener notificaciones: " + error);
                                            });
                                        }
                                    }, function (error) {
                                        notify("Error al actualizar notificaciones: " + error);
                                    });
                                },
                                function (error) {
                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                    notify(error);
                                });
                        });

                        break;

                    case "fail":
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify(data.message);
                        break;
                }
            });
    }

    NotificacionControlador.prototype.ProcesarTransferencia = function (id) {
        var _this = this;
        if (parseInt(id) !== NaN && parseInt(id) !== undefined) {
            ObtenerTransferencia(parseInt(id),
                ObteniendoTransferenciaDesde.Notificacion,
                function (transferencia) {
                    if (transferencia.TRANSFER_DETAIL.length > 0) {
                        ObtenerSeriesDeSkuEnTransferencia(parseInt(id), transferencia.TRANSFER_DETAIL, 0, function() {
                            _this.transferenciaDetalleControlador.MostrarDetalleDeTransferencia(transferencia);
                        },function(error) {
                            console.log("Error al obtener el detalle de la transferencia seleccionada, por favor, vuelva a intentar. " + error);
                            notify("Error al obtener el detalle de la transferencia seleccionada, por favor, vuelva a intentar.");
                        });
                    } else {
                        notify("No se encontro el detalle de la transferencia seleccionada...");
                    }
                },
                function (error) {
                    notify(error);
                });
        } else {
            ToastThis("No se encontro la transferencia seleccionada...");
            console.log("Id Transferencia: " + id);
        }
    }

    NotificacionControlador.prototype.MostrarListadoDeNotificaciones = function () {
        $.mobile.changePage("#UiNotificationPage", {
            transition: "flow",
            reverse: true,
            changeHash: false,
            showLoadMsg: false
        });
    }

    NotificacionControlador.prototype.VolverAMenuPrincipal = function () {
        $.mobile.changePage("#menu_page", {
            transition: "flow",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }

    NotificacionControlador.prototype.CrearListadoDeNotificaciones = function (listaNotificaciones) {
        try {
            var ulListaNotificaciones = $("#UiListaDeNotificaciones");
            ulListaNotificaciones.children().remove("li");

            var li;
            var objetofecha;

            if (listaNotificaciones.length === 0) {
                li = "<li>";
                li += "<p> No hay notificaciones para mostrar...";
                li += "</p>";
                li += "</li>";
                ulListaNotificaciones.append(li);
                ulListaNotificaciones.listview("refresh");
                my_dialog("Espere", "Procesando Notificaciones...", "close");
            } else {
                for (var i = 0; i < listaNotificaciones.length; i++) {
                    var notificacion = listaNotificaciones[i];
                    var esObjetoNulo = (notificacion.DATE === null ||
                        notificacion.DATE === "null" ||
                        notificacion.DATE === undefined)
                        ? 1
                        : 0;

                    if (!esObjetoNulo) {
                        objetofecha = notificacion.DATE.toString().replace("T", " ").replace("Z", " ");
                    } else {
                        objetofecha = "...";
                    }

                    li = "<li>";
                    if (parseInt(notificacion.IS_NEW) === 1) {
                        li += "<a href=" +
                            "#" +
                            " id='" +
                            notificacion.ID +
                            "'  STATUS=" +
                            notificacion.STATUS +
                            " style='background-color:#AFEEEE'>";
                    } else {
                        li += "<a href=" +
                            "#" +
                            " id='" +
                            notificacion.ID +
                            "'  STATUS=" +
                            notificacion.STATUS +
                            ">";
                    }
                    li += '<label for=""><b>No. Documento:</b> <span>' + notificacion.ID + '</span></label>';
                    li += '<label for=""><b>Origen: </b><span>' + notificacion.EXTRA_INFO + '</span></label>';
                    li += '<label for=""><b>Fecha: </b><span>' + objetofecha + '</span></label>';
                    li += "</a>";
                    li += "</li>";
                    ulListaNotificaciones.append(li);
                    ulListaNotificaciones.listview("refresh");
                }
                my_dialog("Espere", "Procesando Notificaciones...", "close");
            }
        } catch (e) {
            my_dialog("Espere", "Procesando Notificaciones...", "close");
            notify("Error al crear la lista de notificaciones..." + e.message);
        }
    }

    return NotificacionControlador;
}());