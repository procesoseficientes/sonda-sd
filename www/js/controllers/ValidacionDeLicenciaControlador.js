var ValidacionDeLicenciaControlador = (function () {
    function ValidacionDeLicenciaControlador() {
        this.validacionDeLicenciaServicio = new ValidacionDeLicenciaServicio();
    }
    ValidacionDeLicenciaControlador.prototype.delegarValidacionDeLicenciaControlador = function () {
        var _this = this;
        $("#btnLogme").bind("touchstart", function () {
            _this.validateCredentials();
        });
        $("#txtPin").on("keypress", function (e) {
            if (e.keyCode === 13) {
                _this.validateCredentials();
            }
        });
    };
    ValidacionDeLicenciaControlador.prototype.validateCredentials = function () {
        var txtUserId = $("#txtUserID");
        pUserID = txtUserId.val();
        pPINCode = $("#txtPin").val();
        try {
            if (isNaN(pPINCode)) {
                notify("ERROR, Debe ingresar un valor numerico");
                txtUserId.val("");
                txtUserId.focus();
            }
            else {
                if (pPINCode === "") {
                    notify("ERROR, ingrese usuario/pin.");
                    return -1;
                }
                my_dialog("Espere...", "validando usuario y password", "open");
                InteraccionConUsuarioServicio.bloquearPantalla();
                if (this.usuarioTieneConexionAInternet()) {
                    this.validarLicencia(pUserID, pPINCode, true);
                }
                else {
                    notify("Por favor verifique su conexi\u00F3n a internet.");
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                }
            }
        }
        catch (e) {
            notify("Error al validar credenciales: " + e.message);
        }
        txtUserId = null;
    };
    ValidacionDeLicenciaControlador.prototype.desbloquearPantalla = function () {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        my_dialog("", "", "close");
    };
    ValidacionDeLicenciaControlador.prototype.validarLicencia = function (usuario, contraseña, estaIniciandoSession) {
        var _this = this;
        this.validacionDeLicenciaServicio.validarLicencia(usuario, contraseña, device.uuid, function (data) {
            try {
                _this.establecerConexionConElServidor(usuario, contraseña, data.CommunicationAddress, data.ValidationType, estaIniciandoSession);
            }
            catch (e) {
                _this.desbloquearPantalla();
                notify("Error al validar licencia: " + e.message);
            }
        }, function (error) {
            _this.desbloquearPantalla();
            notify(error.mensaje);
        });
    };
    ValidacionDeLicenciaControlador.prototype.establecerConexionConElServidor = function (usuario, contrass, direccionDeComunicacion, tipoDeValidacionDeLicencia, estaIniciandoSession) {
        var _this = this;
        try {
            localStorage.setItem("UserID", usuario);
            localStorage.setItem("UserCode", contrass);
            SocketControlador.establecerConexionConServidor(direccionDeComunicacion);
            var intent_1 = 0;
            var idInterval_1 = setInterval(function () {
                if (intent_1 === 5) {
                    clearInterval(idInterval_1);
                    if (!SocketControlador.socketIo.connected) {
                        notify("No se ha podido establecer la conexión con el servidor, por favor, verifique y vuelva a intentar.");
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                    }
                }
                intent_1++;
            }, 1000);
            SocketControlador.socketIo.on("connect", function () {
                var lblNetworkDeliveryMenu = $("#lblNetworkDeliveryMenu");
                var lblNetworkSkusPOS_1 = $("#lblNetworkSkusPOS_1");
                var lblNetworkDeliverySumm = $("#lblNetworkDeliverySumm");
                var lblNetworkCust = $("#lblNetworkCust");
                var lblNetworkSkusPOS = $("#lblNetworkSkusPOS");
                var lblNetworkLogin = $("#lblNetworkLogin");
                var lblNetworkDevolucion = $("#lblNetworkDevolucion");
                var lblNetwork = $("#lblNetwork");
                var btnNetworkStatus = $("#btnNetworkStatus");
                var lblNetworkStatusMenuPage = $("#lblNetworkStatusMenuPage");
                var lblSondaVersion = $("#lblSondaVersion");
                if (SocketControlador.vieneDeDesconexion === false) {
                    _this.delegarConexionDeServidor(SocketControlador.socketIo);
                }
                lblNetwork.text(states[gNetworkState]);
                btnNetworkStatus.buttonMarkup({ icon: "cloud" });
                lblNetworkStatusMenuPage.text(states[gNetworkState]);
                lblNetworkDeliveryMenu.text(states[gNetworkState]);
                lblNetworkDeliveryMenu.buttonMarkup({ icon: "cloud" });
                lblNetworkSkusPOS_1.text(states[gNetworkState]);
                lblNetworkSkusPOS_1.buttonMarkup({ icon: "cloud" });
                lblNetworkDeliverySumm.text(states[gNetworkState]);
                lblNetworkDeliverySumm.buttonMarkup({ icon: "cloud" });
                lblNetworkCust.text(states[gNetworkState]);
                lblNetworkCust.buttonMarkup({ icon: "cloud" });
                lblNetworkSkusPOS.text(states[gNetworkState]);
                lblNetworkSkusPOS.buttonMarkup({ icon: "cloud" });
                lblNetworkLogin.text(states[gNetworkState]);
                lblNetworkLogin.buttonMarkup({ icon: "cloud" });
                lblNetworkDevolucion.text(states[gNetworkState]);
                lblNetworkDevolucion.buttonMarkup({ icon: "cloud" });
                gIsOnline = EstaEnLinea.Si;
                lblSondaVersion.text(SondaVersion);
                if (estaIniciandoSession) {
                    gLastLogin = usuario;
                    estaIniciandoSession = false;
                    setTimeout(function () {
                        SocketControlador.socketIo.emit("validatecredentials", {
                            loginid: usuario,
                            pin: contrass,
                            uuid: device.uuid,
                            dbuser: gdbuser,
                            dbuserpass: gdbuserpass,
                            validationtype: tipoDeValidacionDeLicencia,
                            version: SondaVersion
                        });
                    }, 1000);
                }
                else {
                    gLastLogin = localStorage.getItem("UserID");
                    EnviarData();
                    ObtenerBroadcastPerdidos();
                    EnviarResolucion("SendInvoice");
                }
                SocketControlador.socketIo.on("disconnect", function () {
                    SocketControlador.vieneDeDesconexion = true;
                    var lblNetworkDeliveryMenu = $("#lblNetworkDeliveryMenu");
                    var lblNetworkSkusPOS_1 = $("#lblNetworkSkusPOS_1");
                    var lblNetworkDeliverySumm = $("#lblNetworkDeliverySumm");
                    var lblNetworkCust = $("#lblNetworkCust");
                    var lblNetworkSkusPOS = $("#lblNetworkSkusPOS");
                    var lblNetworkLogin = $("#lblNetworkLogin");
                    var lblNetworkDevolucion = $("#lblNetworkDevolucion");
                    var lblNetwork = $("#lblNetwork");
                    var btnNetworkStatus = $("#btnNetworkStatus");
                    var lblNetworkStatusMenuPage = $("#lblNetworkStatusMenuPage");
                    var lblSondaVersion = $("#lblSondaVersion");
                    lblNetwork.text("Off-line");
                    btnNetworkStatus.buttonMarkup({ icon: "forbidden" });
                    lblNetworkDeliverySumm.text("Off-line");
                    lblNetworkDeliverySumm.buttonMarkup({ icon: "forbidden" });
                    lblNetworkStatusMenuPage.text("Off-line");
                    lblNetworkDeliveryMenu.text("Off-line");
                    lblNetworkDeliveryMenu.buttonMarkup({ icon: "forbidden" });
                    lblNetworkCust.text("Off-line");
                    lblNetworkCust.buttonMarkup({ icon: "forbidden" });
                    lblNetworkSkusPOS.text("Off-line");
                    lblNetworkSkusPOS.buttonMarkup({ icon: "forbidden" });
                    lblNetworkSkusPOS_1.text("Off-line");
                    lblNetworkSkusPOS_1.buttonMarkup({ icon: "forbidden" });
                    lblNetworkLogin.text("Off-line");
                    lblNetworkLogin.buttonMarkup({ icon: "forbidden" });
                    lblNetworkDevolucion.text("Off-line");
                    lblNetworkDevolucion.buttonMarkup({ icon: "forbidden" });
                    lanzarEventoDePerdidaDeConexionAlServidor();
                    gIsOnline = EstaEnLinea.No;
                    lblSondaVersion.text(SondaVersion);
                    lblNetworkDeliveryMenu = null;
                    lblNetworkSkusPOS_1 = null;
                    lblNetworkDeliverySumm = null;
                    lblNetworkCust = null;
                    lblNetworkSkusPOS = null;
                    lblNetworkLogin = null;
                    lblNetworkDevolucion = null;
                    lblNetwork = null;
                    btnNetworkStatus = null;
                    lblNetworkStatusMenuPage = null;
                    lblSondaVersion = null;
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    ToastThis("Ha perdido la conexión al servidor.");
                });
                lblNetworkDeliveryMenu = null;
                lblNetworkSkusPOS_1 = null;
                lblNetworkDeliverySumm = null;
                lblNetworkCust = null;
                lblNetworkSkusPOS = null;
                lblNetworkLogin = null;
                lblNetworkDevolucion = null;
                lblNetwork = null;
                btnNetworkStatus = null;
                lblNetworkStatusMenuPage = null;
                lblSondaVersion = null;
            });
            SocketControlador.socketIo.on("error_message", function (data) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("Error: " + data.message);
            });
        }
        catch (e) {
            gIsOnline = EstaEnLinea.No;
            SocketControlador.cerrarConexionConServidor();
        }
    };
    ValidacionDeLicenciaControlador.prototype.delegarConexionDeServidor = function (socket) {
        var socketsGlobalesServicio = new SocketsGlobalesServicio(), manifiestoControlador = new ManifiestoControlador(new Messenger());
        manifiestoControlador.delegarSockets(socket);
        socketsGlobalesServicio.delegarSocketsGlobales(socket);
        delegarABroadcast(socket);
        delegarSocketsTareaFueraDeRutaControlador(socket);
        delegarSocketsDeObjetosJs(socket);
        ParametroServicio.delegarSockets(socket);
        ClasificacionControlador.delegarSockets(socket);
    };
    ValidacionDeLicenciaControlador.prototype.usuarioTieneConexionAInternet = function () {
        return !(!navigator.onLine || navigator.connection.type === "none");
    };
    return ValidacionDeLicenciaControlador;
}());
//# sourceMappingURL=ValidacionDeLicenciaControlador.js.map