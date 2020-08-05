var ManifiestoControlador = (function () {
    function ManifiestoControlador(mensajero) {
        this.mensajero = mensajero;
        this.manifiestoServicio = new ManifiestoServicio();
        this.procesandoManifiesto = false;
        this.perdioConexionEnProcesoDeManifiesto = false;
    }
    ManifiestoControlador.prototype.delegarManifiestoControlador = function () {
        var _this = this;
        $("#UiBtnShowScanManifestPage").on("click", function () {
            $.mobile.changePage("#UiPageScanManifest", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        });
        $("#UiPageScanManifest").on("pageshow", function () {
            _este = _this;
            _this.suscribirEventoDePerdidaDeConexionAlServidor(_este);
            _this.limpiarCampos();
        });
        $("#UiBtnBackFromScanManifest").on("click", function () {
            _this.regresarAPantallaAnterior("menu_page");
        });
        $("#UiBtnCleanScanManifest").on("click", function () {
            _this.limpiarCampos();
        });
        $("#UiBtnStartDeliveryRouteFromScanManifest").on("click", function () {
            _this.regresarAPantallaAnterior("menu_page");
        });
        $("#UiBtnScanManifest").on("click", function () {
            _this.ejecutarProcesoDeEscaneoDeCodigoDeManifiesto();
        });
        $("#UiTxtManifestHeaderId").on("keyup", function (e) {
            if (_this.verificarSiPresionoTeclaEnter(e)) {
                e.preventDefault();
                _this.iniciarProcesoDeManifiestoEscaneado();
            }
        });
        $("#UiBtnProcessManifest").on("click", function () {
            _this.iniciarProcesoDeManifiestoEscaneado();
        });
    };
    ManifiestoControlador.prototype.limpiarCampos = function () {
        try {
            var txtIdManifiesto = $("#UiTxtManifestHeaderId");
            var lblIdManifiesto = $("#lblManifest");
            var lblFechaCreacionDeManifiesto = $("#lblManifestDateCreation");
            var lblNumeroEntregas = $("#lblManifestNumDoc");
            var txtComentarioManifiesto = $("#lblManifestComments");
            var lblRutaManifiesto = $("#lblManifestRuta");
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
        }
        catch (e) {
            notify(e.message);
        }
    };
    ManifiestoControlador.prototype.delegarSockets = function (socketIo) {
        var _this = this;
        this.delegarSocketPrincipalDeProcesoDeManifiesto();
        socketIo.on("get_manifest_for_sonda_sd_response", function (data) {
            if (!_este.perdioConexionEnProcesoDeManifiesto)
                switch (data.option) {
                    case "fail":
                        my_dialog("", "", "close");
                        notify(data.message);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "add_header":
                        _this.manifiestoServicio.almacenarEncabezadoDeManifiesto(data.manifestHeader, function () {
                            _this.establecerInformacionDeEncabezadoDeManifiesto(data.manifestHeader);
                        }, function (resultado) {
                            my_dialog("", "", "close");
                            notify(resultado.mensaje);
                        });
                        break;
                    case "get_manifest_header_completed":
                        ToastThis("Encabezado del manifiesto " + data.manifestId + " obtenido exitosamente.");
                        break;
                    case "add_detail":
                        _this.manifiestoServicio.almacenarDetalleDeManifiesto(data.manifestDetail, function () {
                        }, function (resultado) {
                            my_dialog("", "", "close");
                            notify(resultado.mensaje);
                        });
                        break;
                    case "get_manifest_detail_completed":
                        ToastThis("Detalle del manifiesto " + data.manifestId + " obtenido exitosamente.");
                        _this.establecerInformacionDeCantidadDeEntregas(data.manifestId);
                        _this.manifiestoServicio.limpiarTareasDeEntrega();
                        break;
                }
        });
        socketIo.on("get_delivery_tasks_for_sonda_sd_response", function (data) {
            if (!_este.perdioConexionEnProcesoDeManifiesto)
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
        socketIo.on("get_next_picking_demand_header_by_manifest_for_sonda_sd_response", function (data) {
            if (!_este.perdioConexionEnProcesoDeManifiesto)
                switch (data.option) {
                    case "fail":
                        my_dialog("", "", "close");
                        notify(data.message);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "add_header":
                        _this.manifiestoServicio.almacenarDemandaDeDespachoEncabezado(data.nextPickingHeader, function (resultado) {
                            my_dialog("", "", "close");
                            notify(resultado.mensaje);
                        });
                        break;
                    case "complete":
                        ToastThis("Demanda de despacho encabezados completados....");
                        break;
                }
        });
        socketIo.on("get_next_picking_demand_detail_by_Manifest_for_sonda_sd_response", function (data) {
            if (!_este.perdioConexionEnProcesoDeManifiesto)
                switch (data.option) {
                    case "fail":
                        my_dialog("", "", "close");
                        notify(data.message);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "add_detail":
                        _this.manifiestoServicio.almacenarDemandaDeDespachoDetalle(data.nextPickingDetail, function (resultado) {
                            my_dialog("", "", "close");
                            notify(resultado.mensaje);
                        });
                        break;
                    case "complete":
                        ToastThis("Demanda de despacho detalles completados....");
                        _this.almacenarDataDeDemandasPorTarea();
                        break;
                }
        });
        socketIo.on("get_serial_number_by_Manifest_for_sonda_sd_response", function (data) {
            if (!_este.perdioConexionEnProcesoDeManifiesto)
                switch (data.option) {
                    case "fail":
                        my_dialog("", "", "close");
                        notify(data.message);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "add":
                        _this.manifiestoServicio.almacenarDemandaDeDespachoDetallePorNumeroDeSerie(data.serial_number, function (resultado) {
                            my_dialog("", "", "close");
                            notify(resultado.mensaje);
                        });
                        break;
                    case "complete":
                        ToastThis("Demanda de despacho detalles por número de serie completados....");
                        _this.limpiarCampos();
                        break;
                }
        });
        socketIo.on("get_baskets_information_for_manifest_response", function (data) {
            if (!_este.perdioConexionEnProcesoDeManifiesto)
                switch (data.option) {
                    case "fail":
                        my_dialog("", "", "close");
                        notify(data.message);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "add":
                        _this.manifiestoServicio.almacenarInformacionDeCanastasPorManifiesto(data.basket_information, function (resultado) {
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
        socketIo.on("change_manifest_status_from_sonda_sd_response", function (data) {
            if (!_este.perdioConexionEnProcesoDeManifiesto)
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "updateManifest":
                        _this.manifiestoServicio.marcarManifiestoComoPosteadoEnElServidor(data.manifestId, function (resultado) {
                            notify(resultado.mensaje);
                        });
                        _este.procesandoManifiesto = false;
                        var intervalo_1 = 0;
                        var tiempoEspera_1 = setInterval(function () {
                            if (intervalo_1 === 5) {
                                clearInterval(tiempoEspera_1);
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                            }
                            intervalo_1++;
                        }, 1000);
                        break;
                }
        });
    };
    ManifiestoControlador.prototype.regresarAPantallaAnterior = function (pantalla) {
        if (_este.perdioConexionEnProcesoDeManifiesto && _este.procesandoManifiesto) {
            _este.manifiestoServicio.limpiarTareasDeEntrega();
            _este.perdioConexionEnProcesoDeManifiesto = false;
        }
        this.desvincularEventoDePerdidaDeConexionAlServidor(this);
        $.mobile.changePage("#" + pantalla, {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };
    ManifiestoControlador.prototype.escanearManifiestoDeCarga = function (callback, returnCallback) {
        try {
            cordova.plugins.barcodeScanner.scan(function (result) {
                if (!result.cancelled) {
                    callback(result.text);
                }
                else {
                    returnCallback();
                }
            }, function (error) {
                throw new Error("No se ha sido posible leer el c\u00F3digo debido a: " + error);
            });
        }
        catch (e) {
            notify(e.message);
        }
    };
    ManifiestoControlador.prototype.iniciarProcesoDeManifiestoEscaneado = function () {
        try {
            if (this.validarSiIngresoNumeroDeManifiesto()) {
                if (this.verificarSiSeEncuentraEnLinea()) {
                    this.procesarManifiesto();
                }
                else {
                    notify("Debe tener conexión al servidor para realizar esta acción, por favor, verifique y vuelva a intentar.");
                }
            }
            else {
                notify("Por favor, ingrese el número de manifiesto a procesar.");
            }
        }
        catch (e) {
            my_dialog("", "", "close");
            notify("Error al iniciar proceso de manifiesto escaneado: " + e.message);
        }
    };
    ManifiestoControlador.prototype.verificarSiSeEncuentraEnLinea = function () {
        return gIsOnline == EstaEnLinea.Si;
    };
    ManifiestoControlador.prototype.validarSiIngresoNumeroDeManifiesto = function () {
        var txtIdManifiesto = $("#UiTxtManifestHeaderId");
        return txtIdManifiesto.val() != "";
    };
    ManifiestoControlador.prototype.ejecutarProcesoDeEscaneoDeCodigoDeManifiesto = function () {
        this.escanearManifiestoDeCarga(function (codigoManifiesto) {
            var txtIdManifiesto = $("#UiTxtManifestHeaderId");
            codigoManifiesto = codigoManifiesto.indexOf("-") > -1 ? codigoManifiesto.split("-")[1] : codigoManifiesto;
            txtIdManifiesto.val(codigoManifiesto);
            txtIdManifiesto.focus();
            txtIdManifiesto = null;
        }, function () {
            notify("Proceso cancelado...");
        });
    };
    ManifiestoControlador.prototype.procesarManifiesto = function () {
        InteraccionConUsuarioServicio.bloquearPantalla();
        my_dialog("Por favor espere...", "Procesando manifiesto.", "open");
        var txtIdManifiesto = $("#UiTxtManifestHeaderId");
        if (this.manifiestoIngresadoEsIncorrecto(txtIdManifiesto)) {
            txtIdManifiesto.focus();
            notify("Por favor ingrese un número de manifiesto válido");
            InteraccionConUsuarioServicio.desbloquearPantalla();
            return;
        }
        var data = {
            'routeid': gCurrentRoute,
            'loginid': gLastLogin,
            'manifestId': this.obtenerCodigoDeManifiesto(txtIdManifiesto),
            'dbuser': gdbuser,
            'dbuserpass': gdbuserpass,
            "currentGpsUser": gCurrentGPS
        };
        if (_este.perdioConexionEnProcesoDeManifiesto) {
            _este.delegarSocketPrincipalDeProcesoDeManifiesto();
            _este.perdioConexionEnProcesoDeManifiesto = false;
        }
        _este.procesandoManifiesto = true;
        SocketControlador.socketIo.emit("process_manifest_from_sonda_sd", data);
        txtIdManifiesto = null;
    };
    ManifiestoControlador.prototype.establecerInformacionDeEncabezadoDeManifiesto = function (manifestHeader) {
        try {
            var lblIdManifiesto = $("#lblManifest");
            var lblFechaCreacionDeManifiesto = $("#lblManifestDateCreation");
            var txtComentarioManifiesto = $("#lblManifestComments");
            var lblRutaManifiesto = $("#lblManifestRuta");
            lblIdManifiesto.text(manifestHeader.MANIFEST_HEADER_ID);
            lblFechaCreacionDeManifiesto.text(manifestHeader.CREATED_DATE);
            txtComentarioManifiesto.val("Manifiesto " + manifestHeader.MANIFEST_HEADER_ID + " para el operador " + gLastLogin);
            lblRutaManifiesto.text(gCurrentRoute);
            lblIdManifiesto = null;
            lblFechaCreacionDeManifiesto = null;
            txtComentarioManifiesto = null;
            lblRutaManifiesto = null;
        }
        catch (e) {
            notify(e.message);
        }
    };
    ManifiestoControlador.prototype.establecerInformacionDeCantidadDeEntregas = function (codigoManifiesto) {
        this.manifiestoServicio.obtenerCantidadDeEntregasDeManifiesto(codigoManifiesto, function (cantidadDeVisitas) {
            var lblNumeroEntregas = $("#lblManifestNumDoc");
            lblNumeroEntregas.text(cantidadDeVisitas);
            lblNumeroEntregas = null;
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    ManifiestoControlador.prototype.cambiarEstadoManifiesto3plEnElServidor = function (codigoManifiesto, estadoManifiesto) {
        var data = {
            'routeid': gCurrentRoute,
            'loginid': gLastLogin,
            "manifestId": codigoManifiesto,
            "manifestStatus": estadoManifiesto,
            'dbuser': gdbuser,
            'dbuserpass': gdbuserpass
        };
        SocketControlador.socketIo.emit("change_manifest_status_from_sonda_sd", data);
    };
    ManifiestoControlador.prototype.verificarSiPresionoTeclaEnter = function (e) { return e.keyCode == 13; };
    ManifiestoControlador.prototype.manifiestoIngresadoEsIncorrecto = function (txtIdManifiesto) {
        return isNaN(txtIdManifiesto.val().indexOf("-") > -1 ? txtIdManifiesto.val().split("-")[1] : txtIdManifiesto.val());
    };
    ManifiestoControlador.prototype.obtenerCodigoDeManifiesto = function (txtIdManifiesto) {
        return txtIdManifiesto.val().indexOf("-") > -1 ? txtIdManifiesto.val().split("-")[1] : txtIdManifiesto.val();
    };
    ManifiestoControlador.prototype.almacenarDataDeDemandasPorTarea = function () {
        this.manifiestoServicio.almacenarDataDeDemandasPorTarea(function (error) {
            notify(error.mensaje);
        });
    };
    ManifiestoControlador.prototype.usuarioPerdioConexionAlServidor = function () {
        if (!_este.procesandoManifiesto) {
            return;
        }
        _este.perdioConexionEnProcesoDeManifiesto = true;
        _este.manifiestoServicio.limpiarTareasDeEntrega();
        my_dialog("", "", "close");
        notify("Ha perdido la conexión al servidor, por favor, verifique y vuelva a intentar.");
        SocketControlador.socketIo.off("process_manifest_from_sonda_sd_response");
        InteraccionConUsuarioServicio.desbloquearPantalla();
    };
    ManifiestoControlador.prototype.delegarSocketPrincipalDeProcesoDeManifiesto = function () {
        var _this = this;
        SocketControlador.socketIo.on("process_manifest_from_sonda_sd_response", function (data) {
            switch (data.option) {
                case "success":
                    my_dialog("", "", "close");
                    ToastThis("Manifiesto " + data.manifestId + " validado exitosamente, obteniendo datos...");
                    break;
                case "fail":
                    my_dialog("", "", "close");
                    notify(data.message);
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    break;
                case "all_processes_has_been_completed":
                    _this.cambiarEstadoManifiesto3plEnElServidor(data.manifestId, EstadoDeManifiesto.Asignado.toString());
                    break;
            }
        });
    };
    ManifiestoControlador.prototype.suscribirEventoDePerdidaDeConexionAlServidor = function (_this) {
        document.addEventListener("server-connection-lost", _this.usuarioPerdioConexionAlServidor, false);
        _this.perdioConexionEnProcesoDeManifiesto = false;
    };
    ManifiestoControlador.prototype.desvincularEventoDePerdidaDeConexionAlServidor = function (_this) {
        document.removeEventListener("server-connection-lost", _this.usuarioPerdioConexionAlServidor, false);
    };
    return ManifiestoControlador;
}());
//# sourceMappingURL=ManifiestoControlador.js.map