class ResumenDeTareaControlador {
  manejoDeDecimalesServicio: ManejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
  resumenDeTareaServicio: ResumenDeTareaServicio = new ResumenDeTareaServicio();
  controlDeSecuenciaServicio: ControlDeSecuenciaServicio = new ControlDeSecuenciaServicio();

  configuracionDeDecimales: ManejoDeDecimales;
  tareaProcesada: any;
  facturaProcesada: FacturaEncabezado;

  constructor(public mensajero: Messenger) {}

  /**
   * delegarResumenDeTareaControlador
   */
  delegarResumenDeTareaControlador() {
    $("#UiTaskResumePage").on("pageshow", (e: JQueryEventObject) => {
      e.preventDefault();
      InteraccionConUsuarioServicio.bloquearPantalla();
      this.cargarPantalla();
    });

    $("#UiBtnGoBackFromTaskResume").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      window.history.back();
    });

    $("#UiBtnCreateNewTask").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      this.crearNuevaTarea();
    });
  }

  /**
   * cargarDatosDeTareaSeleccionada
   */
  private cargarDatosDeTareaSeleccionada() {
    try {
      var factureExist = this.facturaProcesada ? true : false;
      let uiLblTaskId: JQuery = $("#UiLblTaskId");
      let uiLblInvoiceId: JQuery = $("#UiLblInvoiceId");
      let uiLblCustomerCode: JQuery = $("#UiLblCustomerCode");
      let uiLblCustomerName: JQuery = $("#UiLblCustomerName");
      let uiLblCustomerAddress: JQuery = $("#UiLblCustomerAddress");
      let uiLblInvoiceIdHeader: JQuery = $("#UiLblInvoiceIdHeader");
      let uiLblTotalAmountDocument: JQuery = $("#UiLblTotalAmountDocument");
      let uiTxtAreaInvoiceComment: JQuery = $("#UiTxtAreaInvoiceComment");
      let uiImgPostingStatusIndicator: JQuery = $(
        "#UiImgPostingStatusIndicator"
      );

      uiLblTaskId.text(this.tareaProcesada.taskId || "N/A");
      uiLblInvoiceId.text(
        factureExist
          ? this.facturaProcesada.invoiceNum
          : this.tareaProcesada.reason
      );
      uiLblInvoiceIdHeader.text(
        factureExist ? "No. Factura" : "Razón de no venta"
      );
      uiLblTotalAmountDocument.text(
        `${this.configuracionDeDecimales.currencySymbol}. ${format_number(
          factureExist ? this.facturaProcesada.totalAmount : 0,
          this.configuracionDeDecimales.defaultDisplayDecimals
        )}`
      );
      uiTxtAreaInvoiceComment.text(
        factureExist ? this.facturaProcesada.comment : "..."
      );
      uiLblCustomerCode.text(this.tareaProcesada.relatedClientCode || "...");
      uiLblCustomerName.text(this.tareaProcesada.relatedClientName || "...");
      uiLblCustomerAddress.text(this.tareaProcesada.taskAddress || "...");

      const confirmed = "img/confirmed.jpg",
        unconfirmed = "img/unconfirmed.png";
      let srcOfImage = (factureExist
      ? !this.facturaProcesada.idBo ||
        this.facturaProcesada.isPostedValidated !== 2
      : !this.tareaProcesada.taskBoId)
        ? unconfirmed
        : confirmed;
      uiImgPostingStatusIndicator.attr("src", srcOfImage);

      uiLblCustomerCode = null;
      uiLblCustomerName = null;
      uiLblCustomerAddress = null;
      uiLblTotalAmountDocument = null;
      uiTxtAreaInvoiceComment = null;
      uiImgPostingStatusIndicator = null;
      uiLblTaskId = null;
      uiLblInvoiceId = null;

      InteraccionConUsuarioServicio.desbloquearPantalla();
    } catch (error) {
      notify(error.message);
    }
  }

  /**
   * obtenerTarea
   */
  private obtenerTarea() {
    TareaServicio.obtenerTareaPorCodigoYTipo(
      gTaskId,
      "SALE",
      (tarea: any) => {
        this.tareaProcesada = tarea;
        this.cargarFacturaDeTarea();
      },
      (resultado: string) => {
        notify(resultado);
      }
    );
  }

  /**
   * cargarFacturaDeTarea
   */
  private cargarFacturaDeTarea() {
    this.resumenDeTareaServicio.obtenerFacturaPorIdentificadorDeTarea(
      gTaskId,
      (factura: FacturaEncabezado) => {
        this.facturaProcesada = factura;
        this.cargarDatosDeTareaSeleccionada();
      },
      (resultado: Operacion) => {
        // notify(resultado.mensaje);
        this.facturaProcesada = null;
        this.cargarDatosDeTareaSeleccionada();
      }
    );
  }

  /**
   * limpiarDatosDePantalla
   */
  public limpiarDatosDePantalla(callback: () => void) {
    let uiLblTaskId: JQuery = $("#UiLblTaskId");
    let uiLblInvoiceId: JQuery = $("#UiLblInvoiceId");
    let uiLblCustomerCode: JQuery = $("#UiLblCustomerCode");
    let uiLblCustomerName: JQuery = $("#UiLblCustomerName");
    let uiLblCustomerAddress: JQuery = $("#UiLblCustomerAddress");
    let uiLblTotalAmountDocument: JQuery = $("#UiLblTotalAmountDocument");

    uiLblTaskId.text("");
    uiLblInvoiceId.text("");
    uiLblCustomerCode.text("");
    uiLblCustomerName.text("");
    uiLblCustomerAddress.text("");
    uiLblTotalAmountDocument.text(
      `${this.configuracionDeDecimales.currencySymbol}. ${format_number(
        0,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}`
    );

    uiLblCustomerCode = null;
    uiLblCustomerName = null;
    uiLblCustomerAddress = null;
    uiLblTotalAmountDocument = null;
    uiLblTaskId = null;
    uiLblInvoiceId = null;

    callback();
  }

  /**
   * cargarPantalla
   */
  public cargarPantalla() {
    this.manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(
      (configuracionDecimales: ManejoDeDecimales) => {
        this.configuracionDeDecimales = configuracionDecimales;
        this.limpiarDatosDePantalla(() => {
          this.obtenerTarea();
        });
      }
    );
  }

  /**
   * CrearNuevaTarea:
   * Para crear nueva tarea del lado del móvil
   */
  public crearNuevaTarea() {
    try {
      this.manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(
        (configuracionDecimales: ManejoDeDecimales) => {
          this.configuracionDeDecimales = configuracionDecimales;
          this.obtenerTarea();
        }
      );
      let to = setTimeout(() => {
        clearTimeout(to);
        if (this.tareaProcesada === null || this.tareaProcesada === undefined) {
          return notify("Lo sentimos, no se pudo encontrar la tarea base.");
        }

        InteraccionConUsuarioServicio.bloquearPantalla();
        let nuevaTarea = (Object as any).assign(
          new Tarea(),
          this.tareaProcesada
        );
        nuevaTarea.taskStatus = "ASSIGNED";
        nuevaTarea.taskType = "SALE";
        nuevaTarea.taskComments = `Nueva tarea generada para el cliente ${this.tareaProcesada.relatedClientName}`;
        nuevaTarea.isPosted = -1;
        nuevaTarea.acceptedStamp = null;
        nuevaTarea.postedGps = null;
        nuevaTarea.createdStamp = getDateTime();
        nuevaTarea.taskDate = getDateTime();
        nuevaTarea.scheduleFor = getDateTime();
        nuevaTarea.inPlanRoute = this.tareaProcesada.inPlanRoute || 0;
        nuevaTarea.department = this.tareaProcesada.department;
        nuevaTarea.municipality = this.tareaProcesada.municipality;
        this.controlDeSecuenciaServicio.obtenerSiguienteNumeroDeSecuenciaDeControl(
          TiposDeSecuenciaAControlar.NuevaTarea,
          (controlDeSecuencia: ControlDeSecuencia) => {
            nuevaTarea.taskId = controlDeSecuencia.NEXT_VALUE;
            nuevaTarea.taskBoId = controlDeSecuencia.NEXT_VALUE;
            this.resumenDeTareaServicio.crearNuevaTarea(
              nuevaTarea,
              () => {
                this.controlDeSecuenciaServicio.actualizarSecuenciaDeControl(
                  controlDeSecuencia,
                  () => {
                    InvoiceThisTask(
                      nuevaTarea.taskId,
                      nuevaTarea.relatedClientCode,
                      nuevaTarea.relatedClientName,
                      nuevaTarea.nit,
                      nuevaTarea.taskType,
                      nuevaTarea.taskStatus
                    );
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                  },
                  (resultado: Operacion) => {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify(resultado.mensaje);
                  }
                );
              },
              (resultado: Operacion) => {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify(resultado.mensaje);
              }
            );
          },
          (resultado: Operacion) => {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify(resultado.mensaje);
          }
        );
      }, 300);
    } catch (err) {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify(`No se ha podido crear la tarea debido a: ${err.message}`);
    }
  }
}
