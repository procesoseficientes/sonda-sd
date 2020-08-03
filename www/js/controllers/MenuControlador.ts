class MenuControlador {
  invoiceInRoute: boolean = false;
  deliveryInRoute: boolean = false;
  controlDeSecuenciaServicio: ControlDeSecuenciaServicio = new ControlDeSecuenciaServicio();
  reglaServicio = new ReglaServicio();

  mostrarUOcultarOpcionesDeFacturacion(callBack) {
    try {
      this.invoiceInRoute = localStorage.getItem("INVOICE_IN_ROUTE") == "1";
      this.deliveryInRoute = localStorage.getItem("DELIVERY_IN_ROUTE") == "1";
      this.mostrarUOcultarOpcionesDeFacturacionYEntrega(
        this.invoiceInRoute,
        this.deliveryInRoute,
        error => {
          notify("Error al mostrar opciones de facturación: " + error.mensaje);
        }
      );
      callBack();
    } catch (e) {
      this.deliveryInRoute = SiNo.No;
      this.invoiceInRoute = SiNo.No;
      this.mostrarUOcultarOpcionesDeFacturacionYEntrega(
        this.invoiceInRoute,
        this.deliveryInRoute,
        (error: Operacion) => {
          notify("Error al mostrar opciones de facturación: " + error.mensaje);
        }
      );
      callBack();
    }
  }

  mostrarUOcultarOpcionesDeFacturacionYEntrega(
    invoiceInRoute: boolean,
    deliveryInRoute: boolean,
    errorCallback: (error: Operacion) => void
  ) {
    try {
      if (deliveryInRoute && invoiceInRoute) {
        $("#btnRefreshRemoteSkus").css("display", "block");
        $("#btnPOS").css("display", "block");
        $("#btnInvoiceList").css("display", "block");
        $("#UiBtnViewConsignmentList").css("display", "block");
        $("#UiBtnViewDevolutiontList").css("display", "block");
        $("#UiBtnViewTaskOutsideOfRoutePlan").css("display", "block");
        $("#UiBtnShowScoutingPage").css("display", "block");
        $("#UiLiResumenDeCajaFacturas").css("display", "block");
        $("#UiDivAutorizacionFacturacion").css("display", "block");
        $("#UiBtnShowScanManifestPage").css("display", "block");
        $("#UiBtnShowDeliveryReportPage").css("display", "block");
        $("#UiBtnDeliveryReport").css("display", "block");
      } else if (deliveryInRoute && !invoiceInRoute) {
        $("#UiBtnShowScanManifestPage").css("display", "block");
        $("#UiBtnShowDeliveryReportPage").css("display", "block");
        $("#UiBtnDeliveryReport").css("display", "block");
      } else if (!deliveryInRoute && invoiceInRoute) {
        $("#btnRefreshRemoteSkus").css("display", "block");
        $("#btnPOS").css("display", "block");
        $("#btnInvoiceList").css("display", "block");
        $("#UiBtnViewConsignmentList").css("display", "block");
        $("#UiBtnViewDevolutiontList").css("display", "block");
        $("#UiBtnViewTaskOutsideOfRoutePlan").css("display", "block");
        $("#UiBtnShowScoutingPage").css("display", "block");
        $("#UiLiResumenDeCajaFacturas").css("display", "block");
        $("#UiDivAutorizacionFacturacion").css("display", "block");
      }

      $("#UiBtnShowPaymentsList").css("display", "block");
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
    }
  }

  cargarInformacionFel(
    userType,
    callBack: (
      display: string,
      implementaFel: boolean,
      secuenciaDocumento?: any
    ) => void,
    errorCallBack: (error: Operacion) => void
  ) {
    try {
      this.reglaServicio.obtenerRegla(
        "RutaUsaFacturacionEnLinea",
        (results: SqlResultSet) => {
          if (this.seDebeCargarInformacionDeFEL(results, userType)) {
            this.controlDeSecuenciaServicio.obtenerSecuenciaDeDocumento(
              SecuenciaDeDocumentoTipo.DocumentoDeContingencia,
              secuenciaDocumento => {
                localStorage.setItem("IMPLEMENTS_FEL", true.toString());
                return callBack("block", true, secuenciaDocumento);
              },
              error => {
                return errorCallBack({
                  codigo: -1,
                  resultado: ResultadoOperacionTipo.Error,
                  mensaje: error
                } as Operacion);
              }
            );
          } else {
            localStorage.setItem("IMPLEMENTS_FEL", false.toString());
            return callBack("none", false);
          }
        },
        (e: string) => {
          return errorCallBack({
            codigo: -1,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: e
          } as Operacion);
        }
      );
    } catch (e) {
      return errorCallBack({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
    }
  }

  seDebeCargarInformacionDeFEL(data, userRole) {
    let seDebe = data.rows.length > 0;
    seDebe = seDebe && data.rows.item(0).ENABLED.toUpperCase() === "SI";
    seDebe = seDebe && userRole === "VEN";
    return seDebe;
  }

  mostrarTextoDeLabelsParaSecuenciaDeFEL(documentSequence = null) {
    if (documentSequence == null) {
      $("#UiDivAutorizacionFacturacionEnLinea").css("display", "none");
    } else {
      $("#lblFel_Serie").text(documentSequence.SERIE);
      $("#lblFel_DocTo").text(documentSequence.DOC_TO);
      $("#lblFel_DocFrom").text(documentSequence.DOC_FROM);
      $("#lblFel_CurrentDoc").text(documentSequence.CURRENT_DOC);
    }
  }

  seValidoCorrectamente(display, secuenciaDocumento: any) {
    this.mostrarTextoDeLabelsParaSecuenciaDeFEL(secuenciaDocumento);
    $("#UiDivAutorizacionFacturacionEnLinea").css("display", display);
  }
}
