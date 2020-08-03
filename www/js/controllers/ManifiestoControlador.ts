class ManifiestoControlador {

    manifiestoServicio: ManifiestoServicio = new ManifiestoServicio();

    procesandoManifiesto: boolean = false;
    perdioConexionEnProcesoDeManifiesto: boolean = false;

    constructor(public mensajero: Messenger) {

    }

    delegarManifiestoControlador() {

        $("#UiBtnShowScanManifestPage").on("click",
            () => {
                $.mobile.changePage("#UiPageScanManifest", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            });

        $("#UiPageScanManifest").on("pageshow",
            () => {
                this.suscribirEventoDePerdidaDeConexionAlServidor(manifiestoControlador);
                this.limpiarCampos();
            });

        $("#UiBtnBackFromScanManifest").on("click",
            () => {
                this.regresarAPantallaAnterior("menu_page");
            });

        $("#UiBtnCleanScanManifest").on("click",
            () => {
                this.limpiarCampos();
            });

        $("#UiBtnStartDeliveryRouteFromScanManifest").on("click",
            () => {
                this.regresarAPantallaAnterior("menu_page");
            });

        $("#UiBtnScanManifest").on("click", () => {
            this.ejecutarProcesoDeEscaneoDeCodigoDeManifiesto();
        });

        $("#UiTxtManifestHeaderId").on("keyup",
            (e) => {
                if (this.verificarSiPresionoTeclaEnter(e)) {
                    e.preventDefault();
                    this.iniciarProcesoDeManifiestoEscaneado();
                }
            });

        $("#UiBtnProcessManifest").on("click", () => {
            this.iniciarProcesoDeManifiestoEscaneado();
        });
    }

    limpiarCampos() {
        try {
            let txtIdManifiesto = $("#UiTxtManifestHeaderId");
            let lblIdManifiesto = $("#lblManifest");
            let lblFechaCreacionDeManifiesto = $("#lblManifestDateCreation");
            let lblNumeroEntregas = $("#lblManifestNumDoc");
            let txtComentarioManifiesto = $("#lblManifestComments");
            let lblRutaManifiesto = $("#lblManifestRuta");

            txtIdManifiesto.val("");
            lblIdManifiesto.text("");
            lblFechaCreacionDeManifiesto.text("../../....");
            lblNumeroEntregas.text("0");
            txtComentarioManifiesto.val("...");
            lblRutaManifiesto.text("...");

            txtIdManifiesto.focus();
            txtIdManifiesto = null;
            lblIdManifiesto = null;
            lblFechaCreacionDeManifiesto = null;
            lblNumeroEntregas = null;
            txtComentarioManifiesto = null;
            lblRutaManifiesto = null;
            my_dialog("", "", "close");
        } catch (e) {
            notify(e.message);
        }
    }

    delegarSockets(socketIo: SocketIOClient.Socket) {

        //TODO: Sockets para validacion de manifiesto
        this.delegarSocketPrincipalDeProcesoDeManifiesto();

        //TODO: Sockets para obtencion de manifiesto
        socketIo.on("get_manifest_for_sonda_sd_response",
            (data) => {
                if (!manifiestoControlador.perdioConexionEnProcesoDeManifiesto)
                    switch (data.option) {
                        case "fail":
                            my_dialog("", "", "close");
                            notify(data.message);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;

                        case "add_header":

                            this.manifiestoServicio.almacenarEncabezadoDeManifiesto(data.manifestHeader,
                                () => {
                                    this.establecerInformacionDeEncabezadoDeManifiesto(data.manifestHeader);
                                },
                                (resultado) => {
                                    my_dialog("", "", "close");
                                    notify(resultado.mensaje);
                                });
                            break;

                        case "get_manifest_header_completed":
                            ToastThis(`Encabezado del manifiesto ${data.manifestId} obtenido exitosamente.`);
                            break;

                        case "add_detail":
                            this.manifiestoServicio.almacenarDetalleDeManifiesto(data.manifestDetail,
                                () => {
                                },
                                (resultado) => {
                                    my_dialog("", "", "close");
                                    notify(resultado.mensaje);
                                });
                            break;

                        case "get_manifest_detail_completed":
                            ToastThis(`Detalle del manifiesto ${data.manifestId} obtenido exitosamente.`);
                            this.establecerInformacionDeCantidadDeEntregas(data.manifestId);
                            this.manifiestoServicio.limpiarTareasDeEntrega();
                            break;
                    }
            });

        //TODO: Sockets para obtencion de tareas de entrega
        socketIo.on("get_delivery_tasks_for_sonda_sd_response",
            (data) => {
                if (!manifiestoControlador.perdioConexionEnProcesoDeManifiesto)
                    switch (data.option) {
                        case "fail":
                            my_dialog("", "", "close");
                            notify(data.message);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                        case "add_deliver_task":
                            AddToTask(data);
                            break;

                        case "get_delivery_tasks_completed":
                            ToastThis("Tareas de entrega obtenidas completamente...");
                            break;
                    }
            });

        //TODO: Sockets para obtener las demandas de despacho encabezado.
        socketIo.on("get_next_picking_demand_header_by_manifest_for_sonda_sd_response",
            (data) => {
                if (!manifiestoControlador.perdioConexionEnProcesoDeManifiesto)
                    switch (data.option) {
                        case "fail":
                            my_dialog("", "", "close");
                            notify(data.message);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                        case "add_header":
                            this.manifiestoServicio.almacenarDemandaDeDespachoEncabezado(data.nextPickingHeader,
                                (resultado) => {
                                    my_dialog("", "", "close");
                                    notify(resultado.mensaje);
                                });
                            break;
                        case "complete":
                            ToastThis("Demanda de despacho encabezados completados....");
                            break;
                    }
            });
        //TODO: Sockets para obtener las demandas de despacho detalle.
        socketIo.on("get_next_picking_demand_detail_by_Manifest_for_sonda_sd_response",
            (data) => {
                if (!manifiestoControlador.perdioConexionEnProcesoDeManifiesto)
                    switch (data.option) {
                        case "fail":
                            my_dialog("", "", "close");
                            notify(data.message);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                        case "add_detail":
                            this.manifiestoServicio.almacenarDemandaDeDespachoDetalle(data.nextPickingDetail,
                                (resultado) => {
                                    my_dialog("", "", "close");
                                    notify(resultado.mensaje);
                                });
                            break;
                        case "complete":
                            ToastThis("Demanda de despacho detalles completados....");
                            this.almacenarDataDeDemandasPorTarea();
                            break;
                    }
            });

        //TODO: Sockets para obtener las demandas de despacho detalle por numero de serie.
        socketIo.on("get_serial_number_by_Manifest_for_sonda_sd_response",
            (data) => {
                if (!manifiestoControlador.perdioConexionEnProcesoDeManifiesto)
                    switch (data.option) {
                        case "fail":
                            my_dialog("", "", "close");
                            notify(data.message);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                        case "add":
                            this.manifiestoServicio.almacenarDemandaDeDespachoDetallePorNumeroDeSerie(data.serial_number,
                                (resultado) => {
                                    my_dialog("", "", "close");
                                    notify(resultado.mensaje);
                                });
                            break;
                        case "complete":
                            ToastThis("Demanda de despacho detalles por número de serie completados....");
                            this.limpiarCampos();
                            break;
                    }
            });

        //TODO: Sockets para obtencion de canastas de entrega
        socketIo.on("get_baskets_information_for_manifest_response",
            (data) => {
                if (!manifiestoControlador.perdioConexionEnProcesoDeManifiesto)
                    switch (data.option) {
                        case "fail":
                            my_dialog("", "", "close");
                            notify(data.message);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                        case "add":
                            this.manifiestoServicio.almacenarInformacionDeCanastasPorManifiesto(data.basket_information,
                                (resultado) => {
                                    my_dialog("", "", "close");
                                    notify(resultado.mensaje);
                                });
                            break;
                        case "complete":
                            my_dialog("", "", "close");
                            ToastThis("Información de canastas completada....");
                            break;
                    }
            });

        //TODO: Sockets para actualizacion de estado del manifiesto
        socketIo.on("change_manifest_status_from_sonda_sd_response",
            (data) => {
                if (!manifiestoControlador.perdioConexionEnProcesoDeManifiesto)
                    switch (data.option) {
                        case "fail":
                            notify(data.message);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                        case "updateManifest":
                            this.manifiestoServicio.marcarManifiestoComoPosteadoEnElServidor(data.manifestId,
                                (resultado) => {
                                    notify(resultado.mensaje);
                                });
                            manifiestoControlador.procesandoManifiesto = false;
                            let intervalo: number = 0;
                            let tiempoEspera = setInterval(() => {
                                    if (intervalo === 5) {
                                        clearInterval(tiempoEspera);
                                        InteraccionConUsuarioServicio.desbloquearPantalla();
                                    }
                                    intervalo++;
                                },
                                1000);
                            break;
                    }
            });

    }

    regresarAPantallaAnterior(pantalla: string) {

        if (manifiestoControlador.perdioConexionEnProcesoDeManifiesto && manifiestoControlador.procesandoManifiesto) {
            manifiestoControlador.manifiestoServicio.limpiarTareasDeEntrega();
            manifiestoControlador.perdioConexionEnProcesoDeManifiesto = false;
        }

        this.desvincularEventoDePerdidaDeConexionAlServidor(this);

        $.mobile.changePage(`#${pantalla}`,
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
    }

    escanearManifiestoDeCarga(callback: (codigoManifiesto: string) => void, returnCallback: () => void) {
        try {
            cordova.plugins.barcodeScanner.scan((result) => {
                if (!result.cancelled) {
                    callback(result.text);
                } else {
                    returnCallback();
                }
            },
                (error) => {
                    throw new Error(`No se ha sido posible leer el código debido a: ${error}`);
                });
        } catch (e) {
            notify(e.message);
        }
    }

    iniciarProcesoDeManifiestoEscaneado() {
        try {
            if (this.validarSiIngresoNumeroDeManifiesto()) {
                if (this.verificarSiSeEncuentraEnLinea()) {
                    this.procesarManifiesto();
                } else {
                    notify("Debe tener conexión al servidor para realizar esta acción, por favor, verifique y vuelva a intentar.");
                }
            } else {
                notify("Por favor, ingrese el número de manifiesto a procesar.");
            }
        } catch (e) {
            my_dialog("", "", "close");
            notify(`Error al iniciar proceso de manifiesto escaneado: ${e.message}`);
        }
    }

    verificarSiSeEncuentraEnLinea() {
        // ReSharper disable once CoercedEqualsUsing
        return gIsOnline == EstaEnLinea.Si;
    }

    validarSiIngresoNumeroDeManifiesto() {
        let txtIdManifiesto = $("#UiTxtManifestHeaderId");
        // ReSharper disable once CoercedEqualsUsing
        return txtIdManifiesto.val() != "";
    }

    ejecutarProcesoDeEscaneoDeCodigoDeManifiesto() {
        this.escanearManifiestoDeCarga((codigoManifiesto) => {
            let txtIdManifiesto = $("#UiTxtManifestHeaderId");
            codigoManifiesto = codigoManifiesto.indexOf("-") > -1 ? codigoManifiesto.split("-")[1] : codigoManifiesto;
            txtIdManifiesto.val(codigoManifiesto);
            txtIdManifiesto.focus();
            txtIdManifiesto = null;
        }, () => {
            notify("Proceso cancelado...");
        });
    }

    procesarManifiesto() {
        InteraccionConUsuarioServicio.bloquearPantalla();
        my_dialog("Por favor espere...", "Procesando manifiesto.", "open");
        let txtIdManifiesto = $("#UiTxtManifestHeaderId");        
        if (this.manifiestoIngresadoEsIncorrecto(txtIdManifiesto)) {
            txtIdManifiesto.focus();
            notify("Por favor ingrese un número de manifiesto válido");
            InteraccionConUsuarioServicio.desbloquearPantalla();
            return;
        }

        let data = {
            'routeid': gCurrentRoute,
            'loginid': gLastLogin,
            'manifestId': this.obtenerCodigoDeManifiesto(txtIdManifiesto),
            'dbuser': gdbuser,
            'dbuserpass': gdbuserpass,
            "currentGpsUser": gCurrentGPS
        }

        if (manifiestoControlador.perdioConexionEnProcesoDeManifiesto) {
            manifiestoControlador.delegarSocketPrincipalDeProcesoDeManifiesto();
            manifiestoControlador.perdioConexionEnProcesoDeManifiesto = false;
        }

        manifiestoControlador.procesandoManifiesto = true;
        SocketControlador.socketIo.emit("process_manifest_from_sonda_sd", data);
        txtIdManifiesto = null;
    }

    establecerInformacionDeEncabezadoDeManifiesto(manifestHeader) {
        try {
            let lblIdManifiesto = $("#lblManifest");
            let lblFechaCreacionDeManifiesto = $("#lblManifestDateCreation");
            let txtComentarioManifiesto = $("#lblManifestComments");
            let lblRutaManifiesto = $("#lblManifestRuta");

            lblIdManifiesto.text(manifestHeader.MANIFEST_HEADER_ID);
            lblFechaCreacionDeManifiesto.text(manifestHeader.CREATED_DATE);
            txtComentarioManifiesto.val(`Manifiesto ${manifestHeader.MANIFEST_HEADER_ID} para el operador ${gLastLogin}`);
            lblRutaManifiesto.text(gCurrentRoute);

            lblIdManifiesto = null;
            lblFechaCreacionDeManifiesto = null;
            txtComentarioManifiesto = null;
            lblRutaManifiesto = null;
        } catch (e) {
            notify(e.message);
        }
    }

    establecerInformacionDeCantidadDeEntregas(codigoManifiesto) {
        this.manifiestoServicio.obtenerCantidadDeEntregasDeManifiesto(codigoManifiesto, (cantidadDeVisitas) => {
            let lblNumeroEntregas = $("#lblManifestNumDoc");
            lblNumeroEntregas.text(cantidadDeVisitas);
            lblNumeroEntregas = null;
        }, (resultado) => {
            notify(resultado.mensaje);
        });
    }

    cambiarEstadoManifiesto3plEnElServidor(codigoManifiesto: number, estadoManifiesto: string) {
        let data = {
            'routeid': gCurrentRoute,
            'loginid': gLastLogin,
            "manifestId": codigoManifiesto,
            "manifestStatus": estadoManifiesto,
            'dbuser': gdbuser,
            'dbuserpass': gdbuserpass
        }
        SocketControlador.socketIo.emit("change_manifest_status_from_sonda_sd", data);
    }

    verificarSiPresionoTeclaEnter(e: JQueryEventObject) { return e.keyCode == 13 }

    manifiestoIngresadoEsIncorrecto(txtIdManifiesto: JQuery) {
        return isNaN(txtIdManifiesto.val().indexOf("-") > -1 ? txtIdManifiesto.val().split("-")[1] : txtIdManifiesto.val());
    }

    obtenerCodigoDeManifiesto(txtIdManifiesto: JQuery) {
        return txtIdManifiesto.val().indexOf("-") > -1 ? txtIdManifiesto.val().split("-")[1] : txtIdManifiesto.val();
    }

    almacenarDataDeDemandasPorTarea() {
        this.manifiestoServicio.almacenarDataDeDemandasPorTarea((error) => {
            notify(error.mensaje);
        });
    }

    usuarioPerdioConexionAlServidor() {
        if (!manifiestoControlador.procesandoManifiesto) {
            return;
        }
        manifiestoControlador.perdioConexionEnProcesoDeManifiesto = true;
        manifiestoControlador.manifiestoServicio.limpiarTareasDeEntrega();
        my_dialog("", "", "close");
        notify("Ha perdido la conexión al servidor, por favor, verifique y vuelva a intentar.");
        SocketControlador.socketIo.off("process_manifest_from_sonda_sd_response");
        InteraccionConUsuarioServicio.desbloquearPantalla();
    }

    delegarSocketPrincipalDeProcesoDeManifiesto() {
        SocketControlador.socketIo.on("process_manifest_from_sonda_sd_response", (data) => {
            switch (data.option) {
                case "success":
                    my_dialog("", "", "close");
                    ToastThis(`Manifiesto ${data.manifestId} validado exitosamente, obteniendo datos...`);
                    break;

                case "fail":
                    my_dialog("", "", "close");
                    notify(data.message);
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    break;

                case "all_processes_has_been_completed":
                    this.cambiarEstadoManifiesto3plEnElServidor(data.manifestId, EstadoDeManifiesto.Asignado.toString());
                    break;
            }
        });
    }

    suscribirEventoDePerdidaDeConexionAlServidor(_this: ManifiestoControlador) {
        document.addEventListener("server-connection-lost", _this.usuarioPerdioConexionAlServidor, false);
        _this.perdioConexionEnProcesoDeManifiesto = false;
    }

    desvincularEventoDePerdidaDeConexionAlServidor(_this: ManifiestoControlador) {
        document.removeEventListener("server-connection-lost", _this.usuarioPerdioConexionAlServidor, false);
    }
}