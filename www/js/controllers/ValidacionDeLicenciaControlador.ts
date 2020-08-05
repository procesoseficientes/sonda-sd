class ValidacionDeLicenciaControlador {
  validacionDeLicenciaServicio = new ValidacionDeLicenciaServicio();

  delegarValidacionDeLicenciaControlador() {
    $("#btnLogme").bind("touchstart", () => {
      this.validateCredentials();
    });
    $("#txtPin").on("keypress", e => {
      if (e.keyCode === 13) {
        this.validateCredentials();
      }
    });
  }

  validateCredentials() {
    let txtUserId = $("#txtUserID");
    pUserID = txtUserId.val();
    pPINCode = $("#txtPin").val();

    try {
      if (isNaN(pPINCode)) {
        notify("ERROR, Debe ingresar un valor numerico");
        txtUserId.val("");
        txtUserId.focus();
      } else {
        if (pPINCode === "") {
          notify("ERROR, ingrese usuario/pin.");
          return -1;
        }
        my_dialog("Espere...", "validando usuario y password", "open");
        InteraccionConUsuarioServicio.bloquearPantalla();
        if (this.usuarioTieneConexionAInternet()) {
          this.validarLicencia(pUserID, pPINCode, true);
        } else {
          notify(`Por favor verifique su conexión a internet.`);
          InteraccionConUsuarioServicio.desbloquearPantalla();
        }
      }
    } catch (e) {
      notify(`Error al validar credenciales: ${e.message}`);
    }
    txtUserId = null;
  }

  desbloquearPantalla() {
    InteraccionConUsuarioServicio.desbloquearPantalla();
    my_dialog("", "", "close");
  }

  validarLicencia(
    usuario: string,
    contraseña: string,
    estaIniciandoSession: boolean
  ) {
    this.validacionDeLicenciaServicio.validarLicencia(
      usuario,
      contraseña,
      device.uuid,
      data => {
        try {
          this.establecerConexionConElServidor(
            usuario,
            contraseña,
            //'http://192.168.1.97:8596', 
            data.CommunicationAddress,
            data.ValidationType,
            estaIniciandoSession
          );
        } catch (e) {
          this.desbloquearPantalla();
          notify(`Error al validar licencia: ${e.message}`);
        }
      },
      error => {
        this.desbloquearPantalla();
        notify(error.mensaje);
      }
    );
  }

  establecerConexionConElServidor(
    usuario: string,
    contrass: string,
    direccionDeComunicacion: string,
    tipoDeValidacionDeLicencia: string,
    estaIniciandoSession: boolean
  ) {
    try {
      localStorage.setItem("UserID", usuario);
      localStorage.setItem("UserCode", contrass);
      SocketControlador.establecerConexionConServidor(direccionDeComunicacion);
      let intent: number = 0;
      let idInterval = setInterval(() => {
        if (intent === 5) {
          clearInterval(idInterval);
          if (!SocketControlador.socketIo.connected) {
            notify(
              "No se ha podido establecer la conexión con el servidor, por favor, verifique y vuelva a intentar."
            );
            InteraccionConUsuarioServicio.desbloquearPantalla();
          }
        }
        intent++;
      }, 1000);

      SocketControlador.socketIo.on("connect", () => {
        let lblNetworkDeliveryMenu = $("#lblNetworkDeliveryMenu");
        let lblNetworkSkusPOS_1 = $("#lblNetworkSkusPOS_1");
        let lblNetworkDeliverySumm = $("#lblNetworkDeliverySumm");
        let lblNetworkCust = $("#lblNetworkCust");
        let lblNetworkSkusPOS = $("#lblNetworkSkusPOS");
        let lblNetworkLogin = $("#lblNetworkLogin");
        let lblNetworkDevolucion = $("#lblNetworkDevolucion");

        let lblNetwork = $("#lblNetwork");
        let btnNetworkStatus = $("#btnNetworkStatus");
        let lblNetworkStatusMenuPage = $("#lblNetworkStatusMenuPage");
        let lblSondaVersion = $("#lblSondaVersion");

        if (SocketControlador.vieneDeDesconexion === false) {
          this.delegarConexionDeServidor(SocketControlador.socketIo);
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
        //---
        lblNetworkDevolucion.text(states[gNetworkState]);
        lblNetworkDevolucion.buttonMarkup({ icon: "cloud" });

        gIsOnline = EstaEnLinea.Si;

        lblSondaVersion.text(SondaVersion);

        if (estaIniciandoSession) {
          gLastLogin = usuario;
          estaIniciandoSession = false;

          setTimeout(() => {
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
        } else {
          gLastLogin = localStorage.getItem("UserID");
          EnviarData();
          ObtenerBroadcastPerdidos();
          EnviarResolucion("SendInvoice");
        }

        SocketControlador.socketIo.on("disconnect", () => {
          SocketControlador.vieneDeDesconexion = true;
          let lblNetworkDeliveryMenu = $("#lblNetworkDeliveryMenu");
          let lblNetworkSkusPOS_1 = $("#lblNetworkSkusPOS_1");
          let lblNetworkDeliverySumm = $("#lblNetworkDeliverySumm");
          let lblNetworkCust = $("#lblNetworkCust");
          let lblNetworkSkusPOS = $("#lblNetworkSkusPOS");
          let lblNetworkLogin = $("#lblNetworkLogin");
          let lblNetworkDevolucion = $("#lblNetworkDevolucion");

          let lblNetwork = $("#lblNetwork");
          let btnNetworkStatus = $("#btnNetworkStatus");
          let lblNetworkStatusMenuPage = $("#lblNetworkStatusMenuPage");
          let lblSondaVersion = $("#lblSondaVersion");

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

      SocketControlador.socketIo.on("error_message", data => {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify(`Error: ${data.message}`);
      });
    } catch (e) {
      gIsOnline = EstaEnLinea.No;
      SocketControlador.cerrarConexionConServidor();
    }
  }

  delegarConexionDeServidor(socket: SocketIOClient.Socket) {
    let socketsGlobalesServicio = new SocketsGlobalesServicio(),
      manifiestoControlador = new ManifiestoControlador(new Messenger());

    manifiestoControlador.delegarSockets(socket);
    socketsGlobalesServicio.delegarSocketsGlobales(socket);
    delegarABroadcast(socket);
    delegarSocketsTareaFueraDeRutaControlador(socket);
    delegarSocketsDeObjetosJs(socket);
    ParametroServicio.delegarSockets(socket);
    ClasificacionControlador.delegarSockets(socket);
  }

  usuarioTieneConexionAInternet() {
    return !(!navigator.onLine || navigator.connection.type === "none");
  }
}
