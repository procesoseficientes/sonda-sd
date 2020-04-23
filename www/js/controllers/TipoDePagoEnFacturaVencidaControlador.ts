class TipoDePagoEnFacturaVencidaControlador {
  tokenDetalleDeTiposDePagoRealizados: SubscriptionToken;

  detalleDeTiposDePagosRealizados: TipoDePagoEnFacturaVencida[] = [];
  decimalesServicio: ManejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
  configuracionDeDecimales: ManejoDeDecimales;
  imagenFrontalDelDocumentoDePago: string = "";
  imagenPosteriorDelDocumentoDePago: string = "";

  constructor(public mensajero: Messenger) {
    this.tokenDetalleDeTiposDePagoRealizados = mensajero.subscribe<
      DetalleDeTipoDePagoMensaje
    >(
      this.detalleDePagosDelDocumentoActualEntregados,
      getType(DetalleDeTipoDePagoMensaje),
      this
    );
  }

  delegarTipoDePagoEnFacturaVencidaControlador(): void {
    $("#UiOverdueInvoicePaymentDetailPage").on(
      "pageshow",
      (e: JQueryEventObject) => {
        e.preventDefault();
        this.cargarDatosIniciales();
      }
    );

    $("#UiBtnGoBackFromOverdueInvoicePaymentDetailPage").on(
      "click",
      (e: JQueryEventObject) => {
        e.preventDefault();
        this.enviarInformacionDeDetalleDePagos(() => {
          window.history.back();
        });
      }
    );

    $("#UiBtnApplyPayment").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      this.obtenerAutorizacionDeUsuarioParaProcesarPago(() => {
        this.validarPagoIngresado();
      });
    });

    $("#UiBtnTakeFrontImage").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      TomarFoto(
        imagen => {
          this.imagenFrontalDelDocumentoDePago = imagen;
        },
        mensajeDeError => {
          if (mensajeDeError !== "Camera cancelled.") {
            notify(mensajeDeError);
          }
        }
      );
    });

    $("#UiBtnTakeBackImage").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      TomarFoto(
        imagen => {
          this.imagenPosteriorDelDocumentoDePago = imagen;
        },
        mensajeDeError => {
          if (mensajeDeError !== "Camera cancelled.") {
            notify(mensajeDeError);
          }
        }
      );
    });

    $("#UiBtnTakeFrontImageForCreditOrDebitCardVoucher").on(
      "click",
      (e: JQueryEventObject) => {
        e.preventDefault();
        TomarFoto(
          imagen => {
            this.imagenFrontalDelDocumentoDePago = imagen;
          },
          mensajeDeError => {
            if (mensajeDeError !== "Camera cancelled.") {
              notify(mensajeDeError);
            }
          }
        );
      }
    );

    $("#UiCmbPaymentType").on("change", (e: JQueryEventObject) => {
      e.preventDefault();
      this.expandirContenedorDeInformacionDeTipoDePagoSeleccionado(e);
    });

    $("#UiOverdueInvoicePaymentDetailPage").on(
      "click",
      "#UiBanckCheksDetail a",
      (e: JQueryEventObject) => {
        let id = (e.currentTarget as any).id;
        if (id) {
          this.obtenerAutorizacionDeUsuarioParaEliminarPago(() => {
            this.eliminarPagoSeleccionado(id);
          });
        }
      }
    );

    $("#UiOverdueInvoicePaymentDetailPage").on(
      "click",
      "#UiDepositsDetail a",
      (e: JQueryEventObject) => {
        let id = (e.currentTarget as any).id;
        if (id) {
          this.obtenerAutorizacionDeUsuarioParaEliminarPago(() => {
            this.eliminarPagoSeleccionado(id);
          });
        }
      }
    );

    $("#UiOverdueInvoicePaymentDetailPage").on(
      "click",
      "#UiCashDetail a",
      (e: JQueryEventObject) => {
        let id = (e.currentTarget as any).id;
        if (id) {
          this.obtenerAutorizacionDeUsuarioParaEliminarPago(() => {
            this.eliminarPagoSeleccionado(id);
          });
        }
      }
    );

    $("#UiOverdueInvoicePaymentDetailPage").on(
      "click",
      "#UiCreditOrDebitCardDetail a",
      (e: JQueryEventObject) => {
        let id = (e.currentTarget as any).id;
        if (id) {
          this.obtenerAutorizacionDeUsuarioParaEliminarPago(() => {
            this.eliminarPagoSeleccionado(id);
          });
        }
      }
    );
  }

  expandirContenedorDeInformacionDeTipoDePagoSeleccionado(
    e: JQueryEventObject
  ): void {
    let tipoDePagoSeleccionado: any = (e.currentTarget as any)
      .selectedOptions[0].value;

    let contenedorDeInformacionEnEfectivo: JQuery = $("#InfoCashContainer");
    let contenedorDeInformacionDeDepositos: JQuery = $(
      "#InfoDepositsContainer"
    );
    let contenedorDeInformacionDeCheques: JQuery = $(
      "#InfoBankChecksContainer"
    );

    let contenedorDeInformacionDeTarjetas: JQuery = $(
      "#InfoCreditOrDebitCardContainer"
    );

    this.colapsarTodosLosContenedoresDeInformacionDePagos(
      contenedorDeInformacionEnEfectivo,
      contenedorDeInformacionDeCheques,
      contenedorDeInformacionDeDepositos,
      contenedorDeInformacionDeTarjetas
    );

    switch (tipoDePagoSeleccionado) {
      case TipoDePagoFacturaVencida.Cheque:
        contenedorDeInformacionDeCheques.collapsible("expand");
        this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(
          true
        );
        break;

      case TipoDePagoFacturaVencida.Efectivo:
        contenedorDeInformacionEnEfectivo.collapsible("expand");
        this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(
          false
        );
        break;

      case TipoDePagoFacturaVencida.Deposito:
        contenedorDeInformacionDeDepositos.collapsible("expand");
        this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(
          true
        );
        break;

      case TipoDePagoFacturaVencida.Tarjeta:
        this.cambiarVisualizacionDeCamposDePagoEnTarjeta(true);
        contenedorDeInformacionDeTarjetas.collapsible("expand");
        break;

      default:
        contenedorDeInformacionEnEfectivo.collapsible("expand");
        this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(
          false
        );
    }

    contenedorDeInformacionDeDepositos = null;
    contenedorDeInformacionDeCheques = null;
    contenedorDeInformacionEnEfectivo = null;
    tipoDePagoSeleccionado = null;
  }

  colapsarTodosLosContenedoresDeInformacionDePagos(
    contenedorDeInformacionEnEfectivo: JQuery,
    contenedorDeInformacionDeCheques: JQuery,
    contenedorDeInformacionDeDepositos: JQuery,
    contenedorDeInformacionDeTarjetas: JQuery
  ): void {
    contenedorDeInformacionEnEfectivo.collapsible("collapse");
    contenedorDeInformacionDeDepositos.collapsible("collapse");
    contenedorDeInformacionDeCheques.collapsible("collapse");
    contenedorDeInformacionDeTarjetas.collapsible("collapse");
  }

  cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(
    visualizar: boolean
  ): void {
    let contenedorDeCamposParaChequesODepositos: JQuery = $(
      "#BankCheckOrDepositContainer"
    );
    let contenedorDeCamposParaEfectivo: JQuery = $("#CashContainer");
    let contenedorDeCamposParaTarjeta: JQuery = $(
      "#CreditOrDebitCardContainer"
    );

    let campoDeMontoIngresadoEnEfectivo: JQuery = $("#TxtCashAmount");
    let campoDeNumeroDeDocumentoDeChequeODeposito: JQuery = $(
      "#TxtBankCheckOrDepositNumber"
    );

    contenedorDeCamposParaTarjeta.css("display", "none");

    if (visualizar) {
      contenedorDeCamposParaChequesODepositos.css("display", "block");
      contenedorDeCamposParaEfectivo.css("display", "none");
      campoDeNumeroDeDocumentoDeChequeODeposito.focus();
    } else {
      contenedorDeCamposParaChequesODepositos.css("display", "none");
      contenedorDeCamposParaEfectivo.css("display", "block");
      campoDeMontoIngresadoEnEfectivo.focus();
    }

    contenedorDeCamposParaChequesODepositos = null;
    contenedorDeCamposParaEfectivo = null;
    campoDeMontoIngresadoEnEfectivo = null;
    campoDeNumeroDeDocumentoDeChequeODeposito = null;
    contenedorDeCamposParaTarjeta = null;
  }

  cargarDatosIniciales(): void {
    let tipoDePago: JQuery = $("#UiCmbPaymentType");
    tipoDePago.val(TipoDePagoFacturaVencida.Efectivo);
    tipoDePago.selectmenu("refresh", true);
    tipoDePago.trigger("change");
    tipoDePago = null;

    this.limpiarCamposDePagoDeChequeODeposito();
    this.limpiarCampoDePagoEnEfectivo();
    this.limpiarCamposDePagoEnTarjeta();

    this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(
      (decimales: ManejoDeDecimales) => {
        this.configuracionDeDecimales = decimales;
        this.cambiarVisualizacionDeCamposDePagoEnTarjeta(false);
        this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(
          false
        );
        this.calcularMontosDeLosDiferentesTiposDePagos();

        this.generarListadoDeTiposDePagos();
      },
      (resultado: Operacion) => {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify(resultado.mensaje);
      }
    );
  }

  calcularMontosDeLosDiferentesTiposDePagos(): void {
    let montoEnEfectivo: number = 0;
    let montoEnDepositos: number = 0;
    let montoEnCheques: number = 0;
    let montoEnTarjetas: number = 0;

    let montoPagadoEnEfectivo: JQuery = $("#UiLblCashPayedAmount");

    let montoPagadoEnDepositos: JQuery = $("#UiLblDepositsPayedAmount");
    let montoPagadoEnCheques: JQuery = $("#UiLblBankChecksPayedAmount");
    let montoPagadoEnTarjetas: JQuery = $("#UiLblCreditOrDebitCardPayedAmount");

    let montoTotalPagado: JQuery = $("#UiLblTotalPayedAmount");

    this.detalleDeTiposDePagosRealizados.forEach(
      (tipoDePagoEnFacturaVencida: TipoDePagoEnFacturaVencida) => {
        switch (tipoDePagoEnFacturaVencida.paymentType) {
          case TipoDePagoFacturaVencida.Efectivo:
            montoEnEfectivo = tipoDePagoEnFacturaVencida.amount || 0;
            break;
          case TipoDePagoFacturaVencida.Deposito:
            montoEnDepositos += tipoDePagoEnFacturaVencida.amount;
            break;
          case TipoDePagoFacturaVencida.Cheque:
            montoEnCheques += tipoDePagoEnFacturaVencida.amount;
            break;
          case TipoDePagoFacturaVencida.Tarjeta:
            montoEnTarjetas += tipoDePagoEnFacturaVencida.amount;
            break;
        }
      }
    );

    montoPagadoEnEfectivo.text(
      `${this.configuracionDeDecimales.currencySymbol}. ${format_number(
        montoEnEfectivo,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}`
    );

    montoPagadoEnDepositos.text(
      `${this.configuracionDeDecimales.currencySymbol}. ${format_number(
        montoEnDepositos,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}`
    );

    montoPagadoEnCheques.text(
      `${this.configuracionDeDecimales.currencySymbol}. ${format_number(
        montoEnCheques,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}`
    );

    montoPagadoEnTarjetas.text(
      `${this.configuracionDeDecimales.currencySymbol}. ${format_number(
        montoEnTarjetas,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}`
    );

    montoTotalPagado.text(
      `${this.configuracionDeDecimales.currencySymbol}. ${format_number(
        montoEnEfectivo + montoEnDepositos + montoEnCheques + montoEnTarjetas,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}`
    );

    montoEnEfectivo = null;
    montoEnCheques = null;
    montoEnDepositos = null;
    montoEnTarjetas = null;

    montoPagadoEnDepositos = null;
    montoPagadoEnCheques = null;
    montoPagadoEnEfectivo = null;
    montoPagadoEnTarjetas = null;

    montoTotalPagado = null;
  }

  irAPantalla(pantalla: string): void {
    $.mobile.changePage(`#${pantalla}`, {
      transition: "pop",
      reverse: false,
      showLoadMsg: false
    });
  }

  validarPagoIngresado(): void {
    let tipoDePagoSeleccionado: JQuery = $("#UiCmbPaymentType");

    switch (tipoDePagoSeleccionado.val()) {
      case TipoDePagoFacturaVencida.Efectivo:
        this.validarPagoEnEfectivo();
        break;
      case TipoDePagoFacturaVencida.Deposito:
        this.validarPagoConDepositoOCheque();
        break;
      case TipoDePagoFacturaVencida.Cheque:
        this.validarPagoConDepositoOCheque();
        break;
      case TipoDePagoFacturaVencida.Tarjeta:
        this.validarPagoConTarjeta();
        break;
    }
  }

  validarPagoEnEfectivo(): void {
    let montoEnEfectivo: JQuery = $("#TxtCashAmount");
    if (this.usuarioIngresoValorIncorrecto(montoEnEfectivo)) {
      notify(
        `El monto ingresado es incorrecto, por favor, verifique y vuelva a intentar.`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      montoEnEfectivo.focus();
    } else {
      this.agregarPagoEnEfectivo(montoEnEfectivo);
    }
    montoEnEfectivo = null;
  }

  validarPagoConDepositoOCheque(): void {
    let numeroDeDocumento: JQuery = $("#TxtBankCheckOrDepositNumber");
    let montoDelDocumento: JQuery = $("#TxtBankCheckOrDepositAmount");
    let cuentaBancaria: JQuery = $("#CmbBankAccount");

    if (this.usuarioNoIngresoNumeroDeDocumento(numeroDeDocumento)) {
      notify(
        `Debe proporcionar el número del comprobante de pago, por favor, verifique y vuelva a intentar`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      numeroDeDocumento.focus();
      return;
    }

    if (this.imagenFrontalDelDocumentoDePago === "") {
      notify(
        `Debe proporcionar, por lo menos, una imágen frontal del comprobante de pago, por favor, verifique y vuelva a intentar`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      numeroDeDocumento.focus();
      return;
    }

    if (cuentaBancaria.val() === "NULL") {
      notify(
        `Debe seleccionar un banco, por favor, verifique y vuelva a intentar`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      cuentaBancaria.focus();
      return;
    }

    if (this.usuarioIngresoValorIncorrecto(montoDelDocumento)) {
      notify(
        `El monto ingresado es incorrecto, por favor, verifique y vuelva a intentar.`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      montoDelDocumento.focus();
      return;
    } else {
      this.agregarPagoEnChequeODeposito(numeroDeDocumento, montoDelDocumento);
    }
  }

  usuarioIngresoValorIncorrecto(campoDePago: JQuery): boolean {
    return (
      campoDePago.val() === "" ||
      campoDePago.val() === "." ||
      campoDePago.val() === "," ||
      campoDePago.val() === "-" ||
      isNaN(campoDePago.val())
    );
  }

  usuarioNoIngresoNumeroDeDocumento(numeroDeDocumento: JQuery): boolean {
    return numeroDeDocumento.val() === "";
  }

  agregarPagoEnChequeODeposito(
    numeroDeDocumento: JQuery,
    montoDelDocumento: JQuery
  ): void {
    let tipoDePagoSeleccionado: JQuery = $("#UiCmbPaymentType");
    let bancoSeleccionado: JQuery = $("#CmbBankAccount");
    let pagoEnChequeODeposito: JQuery = (this
      .detalleDeTiposDePagosRealizados as any).find(
      (tipoDePago: TipoDePagoEnFacturaVencida) => {
        return tipoDePago.documentNumber === numeroDeDocumento.val();
      }
    );

    if (pagoEnChequeODeposito) {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify(
        `Ya existe el número de documento en el detalle de pagos, por favor, verifique y vuelva a intentar.`
      );
      numeroDeDocumento.focus();
      return;
    } else {
      let pago: TipoDePagoEnFacturaVencida = new TipoDePagoEnFacturaVencida();

      pago.paymentType = tipoDePagoSeleccionado.val();
      pago.amount = parseFloat(montoDelDocumento.val());
      pago.documentNumber = numeroDeDocumento.val();
      pago.bankName = bancoSeleccionado.val();
      pago.frontImage = this.imagenFrontalDelDocumentoDePago;
      pago.backImage = this.imagenPosteriorDelDocumentoDePago;
      this.detalleDeTiposDePagosRealizados.push(pago);
    }
    this.calcularMontosDeLosDiferentesTiposDePagos();
    InteraccionConUsuarioServicio.desbloquearPantalla();
    this.limpiarCamposDePagoDeChequeODeposito();
    numeroDeDocumento.focus();
    this.generarListadoDeTiposDePagos();
  }

  agregarPagoEnEfectivo(montoEnEfectivo: JQuery): void {
    let pagoEnEfectivo: TipoDePagoEnFacturaVencida = (this
      .detalleDeTiposDePagosRealizados as any).find(
      (tipoDePago: TipoDePagoEnFacturaVencida) => {
        return tipoDePago.paymentType === TipoDePagoFacturaVencida.Efectivo;
      }
    );

    if (pagoEnEfectivo) {
      for (
        let i: number = 0;
        i < this.detalleDeTiposDePagosRealizados.length;
        i++
      ) {
        let tipoDePago: any = this.detalleDeTiposDePagosRealizados[i];
        if (tipoDePago.paymentType === TipoDePagoFacturaVencida.Efectivo) {
          tipoDePago.amount = parseFloat(montoEnEfectivo.val());
          break;
        }
      }
    } else {
      let pago: TipoDePagoEnFacturaVencida = new TipoDePagoEnFacturaVencida();

      pago.paymentType = TipoDePagoFacturaVencida.Efectivo;
      pago.amount = parseFloat(montoEnEfectivo.val());

      this.detalleDeTiposDePagosRealizados.push(pago);
    }
    this.calcularMontosDeLosDiferentesTiposDePagos();
    InteraccionConUsuarioServicio.desbloquearPantalla();
    montoEnEfectivo.val("");
    montoEnEfectivo.focus();
    this.generarListadoDeTiposDePagos();
  }

  obtenerAutorizacionDeUsuarioParaProcesarPago(callback: () => void): void {
    navigator.notification.confirm(
      "¿Está seguro de aplicar el pago actual?",
      buttonIndex => {
        if (buttonIndex === BotonSeleccionado.Si) {
          InteraccionConUsuarioServicio.bloquearPantalla();
          callback();
        }
      },
      `Sonda® ${SondaVersion}`,
      ["No", "Si"]
    );
  }

  obtenerAutorizacionDeUsuarioParaEliminarPago(callback: () => void): void {
    navigator.notification.confirm(
      "¿Está seguro de eliminar el pago seleccionado?",
      buttonIndex => {
        if (buttonIndex === BotonSeleccionado.Si) {
          InteraccionConUsuarioServicio.bloquearPantalla();
          callback();
        }
      },
      `Sonda® ${SondaVersion}`,
      ["No", "Si"]
    );
  }

  limpiarCamposDePagoDeChequeODeposito(): void {
    let numeroDeDocumento: JQuery = $("#TxtBankCheckOrDepositNumber");
    let montoDelDocumento: JQuery = $("#TxtBankCheckOrDepositAmount");
    numeroDeDocumento.val("");
    montoDelDocumento.val("");
    this.imagenFrontalDelDocumentoDePago = "";
    this.imagenPosteriorDelDocumentoDePago = "";
    numeroDeDocumento = null;
    montoDelDocumento = null;
  }

  generarListadoDeCuentasBancarias(): void {
    let contenedorDeCuentasBancarias: JQuery = $("#CmbBankAccount");
    let contenedorDeCuentasBancariasParaTarjeta: JQuery = $(
      "#CmbBankAccountCreditOrDebitCard"
    );

    contenedorDeCuentasBancarias.children().remove("option");
    contenedorDeCuentasBancarias.selectmenu("refresh", true);

    contenedorDeCuentasBancariasParaTarjeta.children().remove("option");
    contenedorDeCuentasBancariasParaTarjeta.selectmenu("refresh", true);

    obtenerCuentasDeBancos(
      cuentasDeBanco => {
        cuentasDeBanco.forEach((cuentaBancaria: any, posicion: number) => {
          if (posicion === 0) {
            contenedorDeCuentasBancarias.append(
              `<option value="NULL" selected="selected">Seleccionar...</option>`
            );

            contenedorDeCuentasBancariasParaTarjeta.append(
              `<option value="NULL" selected="selected">Seleccionar...</option>`
            );
          }

          contenedorDeCuentasBancarias.append(
            $("<option>", {
              value: `${cuentaBancaria.banco}`,
              text: `${cuentaBancaria.banco}`
            })
          );

          contenedorDeCuentasBancariasParaTarjeta.append(
            $("<option>", {
              value: `${cuentaBancaria.banco}`,
              text: `${cuentaBancaria.banco}`
            })
          );
        });
        contenedorDeCuentasBancarias.selectmenu("refresh", true);
        contenedorDeCuentasBancariasParaTarjeta.selectmenu("refresh", true);
      },
      resultado => {
        notify(resultado.message);
      }
    );
  }

  generarListadoDeTiposDePagos(): void {
    this.generarListadoDeCuentasBancarias();
    this.limpiarListadosDeTiposDePagos();

    let pagoEnEfectivo: TipoDePagoEnFacturaVencida[] = this.detalleDeTiposDePagosRealizados.filter(
      (tipoDePago: TipoDePagoEnFacturaVencida) => {
        return tipoDePago.paymentType === TipoDePagoFacturaVencida.Efectivo;
      }
    );

    let pagoEnDepositos: TipoDePagoEnFacturaVencida[] = this.detalleDeTiposDePagosRealizados.filter(
      (tipoDePago: TipoDePagoEnFacturaVencida) => {
        return tipoDePago.paymentType === TipoDePagoFacturaVencida.Deposito;
      }
    );

    let pagoEnCheques: TipoDePagoEnFacturaVencida[] = this.detalleDeTiposDePagosRealizados.filter(
      (tipoDePago: TipoDePagoEnFacturaVencida) => {
        return tipoDePago.paymentType === TipoDePagoFacturaVencida.Cheque;
      }
    );

    let pagosEnTarjeta: TipoDePagoEnFacturaVencida[] = this.detalleDeTiposDePagosRealizados.filter(
      (tipoDePago: TipoDePagoEnFacturaVencida) => {
        return tipoDePago.paymentType === TipoDePagoFacturaVencida.Tarjeta;
      }
    );

    if (pagoEnEfectivo && pagoEnEfectivo.length > 0) {
      this.generarListadoDePagoEnEfectivo(pagoEnEfectivo);
    }

    if (pagoEnDepositos && pagoEnDepositos.length > 0) {
      this.generarListadoDePagoEnDepositos(pagoEnDepositos);
    }

    if (pagoEnCheques && pagoEnCheques.length > 0) {
      this.generarListadoDePagoEnCheques(pagoEnCheques);
    }

    if (pagosEnTarjeta && pagosEnTarjeta.length > 0) {
      this.generarListadoDePagosEnTarjeta(pagosEnTarjeta);
    }
  }

  generarListadoDePagoEnEfectivo(
    pagoEnEfectivo: TipoDePagoEnFacturaVencida[]
  ): void {
    let contenedorEfectivo: JQuery = $("#UiCashDetail");
    let pagosEfectivo: string[] = [];

    pagoEnEfectivo.forEach((pago: TipoDePagoEnFacturaVencida) => {
      pagosEfectivo.push(` <li>`);
      pagosEfectivo.push(` <a href="#">`);
      pagosEfectivo.push(
        ` <h1>${this.configuracionDeDecimales.currencySymbol}. ${format_number(
          pago.amount,
          this.configuracionDeDecimales.defaultDisplayDecimals
        )}</h1>`
      );
      pagosEfectivo.push(" </a>");
      pagosEfectivo.push(` <a href="#" id="${pago.paymentType}|0"></a>`);
      pagosEfectivo.push(" </li>");
    });

    let cadenaHtmlDeObjetoAInsertar: string = pagosEfectivo.join("");
    if (cadenaHtmlDeObjetoAInsertar !== "") {
      contenedorEfectivo.append(cadenaHtmlDeObjetoAInsertar);
      contenedorEfectivo.listview("refresh");
    }
    contenedorEfectivo = null;
    pagosEfectivo.length = 0;
    pagosEfectivo = null;
    cadenaHtmlDeObjetoAInsertar = null;
  }

  generarListadoDePagoEnDepositos(
    pagoEnDepositos: TipoDePagoEnFacturaVencida[]
  ): void {
    let contenedorDepositos: JQuery = $("#UiDepositsDetail");
    let pagosEnDeposito: string[] = [];

    pagoEnDepositos.forEach((pago: TipoDePagoEnFacturaVencida) => {
      pagosEnDeposito.push(this.obtenerCadenaHtmlDePagoEnChequeODeposito(pago));
    });

    let cadenaHtmlDeObjetoAInsertar: string = pagosEnDeposito.join("");
    if (cadenaHtmlDeObjetoAInsertar !== "") {
      contenedorDepositos.append(cadenaHtmlDeObjetoAInsertar);
      contenedorDepositos.listview("refresh");
    }
    contenedorDepositos = null;
    pagosEnDeposito.length = 0;
    pagosEnDeposito = null;
    cadenaHtmlDeObjetoAInsertar = null;
  }

  generarListadoDePagoEnCheques(
    pagoEnCheques: TipoDePagoEnFacturaVencida[]
  ): void {
    let contenedorCheques: JQuery = $("#UiBanckCheksDetail");
    let pagosEnCheque: string[] = [];

    pagoEnCheques.forEach((pago: TipoDePagoEnFacturaVencida) => {
      pagosEnCheque.push(this.obtenerCadenaHtmlDePagoEnChequeODeposito(pago));
    });

    let cadenaHtmlDeObjetoAInsertar: string = pagosEnCheque.join("");
    if (cadenaHtmlDeObjetoAInsertar !== "") {
      contenedorCheques.append(cadenaHtmlDeObjetoAInsertar);
      contenedorCheques.listview("refresh");
    }
    contenedorCheques = null;
    pagosEnCheque.length = 0;
    pagosEnCheque = null;
    cadenaHtmlDeObjetoAInsertar = null;
  }

  obtenerCadenaHtmlDePagoEnChequeODeposito(
    pago: TipoDePagoEnFacturaVencida
  ): string {
    let html: string[] = [];
    html.push(` <li>`);
    html.push(` <a href="#">`);
    html.push(` <label>${pago.documentNumber} </label>`);
    html.push(
      `<span class="small-roboto ui-li-count">${
        this.configuracionDeDecimales.currencySymbol
      }. ${format_number(
        pago.amount,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}</span>`
    );
    html.push(` <label>${pago.bankName}</label>`);
    html.push(" </a>");
    html.push(
      ` <a href="#" id="${pago.paymentType}|${pago.documentNumber}"></a>`
    );
    html.push(" </li>");
    return html.join("");
  }

  limpiarListadosDeTiposDePagos(): void {
    let contenedorEfectivo: JQuery = $("#UiCashDetail");
    let contenedorDepositos: JQuery = $("#UiDepositsDetail");
    let contenedorCheques: JQuery = $("#UiBanckCheksDetail");
    let contenedorDePagosEnTarjeta: JQuery = $("#UiCreditOrDebitCardDetail");

    contenedorEfectivo.children().remove("li");
    contenedorDepositos.children().remove("li");
    contenedorCheques.children().remove("li");
    contenedorDePagosEnTarjeta.children().remove("li");

    contenedorEfectivo = null;
    contenedorCheques = null;
    contenedorDepositos = null;
    contenedorDePagosEnTarjeta = null;
  }

  eliminarPagoSeleccionado(id: string): void {
    let tipoDePago: string = id.toString().split("|")[0];
    let numeroDeDocumento: string = id.toString().split("|")[1];

    if (tipoDePago === TipoDePagoFacturaVencida.Efectivo.toString()) {
      for (
        let i: number = 0;
        i < this.detalleDeTiposDePagosRealizados.length;
        i++
      ) {
        let pago: TipoDePagoEnFacturaVencida = this
          .detalleDeTiposDePagosRealizados[i];
        if (pago.paymentType === TipoDePagoFacturaVencida.Efectivo) {
          this.detalleDeTiposDePagosRealizados.splice(i, 1);
          break;
        }
      }
    } else {
      for (
        let i: number = 0;
        i < this.detalleDeTiposDePagosRealizados.length;
        i++
      ) {
        let pago: TipoDePagoEnFacturaVencida = this
          .detalleDeTiposDePagosRealizados[i];
        if (
          pago.paymentType.toString() === tipoDePago &&
          pago.documentNumber === numeroDeDocumento
        ) {
          this.detalleDeTiposDePagosRealizados.splice(i, 1);
          break;
        }
      }
    }

    this.calcularMontosDeLosDiferentesTiposDePagos();
    this.generarListadoDeTiposDePagos();
    InteraccionConUsuarioServicio.desbloquearPantalla();
  }

  enviarInformacionDeDetalleDePagos(callback: () => void): void {
    let mensaje: DetalleDeTipoDePagoMensaje = new DetalleDeTipoDePagoMensaje(
      this
    );
    mensaje.detalleDePagosRealizados = this.detalleDeTiposDePagosRealizados;
    this.mensajero.publish(mensaje, getType(DetalleDeTipoDePagoMensaje));

    callback();
  }

  detalleDePagosDelDocumentoActualEntregados(
    message: DetalleDeTipoDePagoMensaje,
    subscriber: any
  ): void {
    subscriber.detalleDeTiposDePagosRealizados =
      message.detalleDePagosRealizados;
  }

  limpiarCampoDePagoEnEfectivo(): void {
    let montoEnEfectivo: JQuery = $("#TxtCashAmount");
    montoEnEfectivo.val("");
    montoEnEfectivo = null;
  }

  limpiarCamposDePagoEnTarjeta(): void {
    let numeroDeDocumento: JQuery = $(
      "#TxtCreditOrDebitCardAuthorizationNumber"
    );
    let montoDelDocumento: JQuery = $("#TxtCreditOrDebitCardAmount");
    numeroDeDocumento.val("");
    montoDelDocumento.val("");
    this.imagenFrontalDelDocumentoDePago = "";
    numeroDeDocumento = null;
    montoDelDocumento = null;
  }

  generarListadoDePagosEnTarjeta(
    pagosEnTarjeta: TipoDePagoEnFacturaVencida[]
  ): void {
    let contenedorDeDetalleDePagosEnTarjeta: JQuery = $(
      "#UiCreditOrDebitCardDetail"
    );
    let objetoDePagosEnTarjeta: string[] = [];

    pagosEnTarjeta.forEach((pago: TipoDePagoEnFacturaVencida) => {
      objetoDePagosEnTarjeta.push(this.obtenerCadenaHtmlDePagoEnTarjeta(pago));
    });

    let cadenaHtmlDeObjetoAInsertar: string = objetoDePagosEnTarjeta.join("");
    if (cadenaHtmlDeObjetoAInsertar !== "") {
      contenedorDeDetalleDePagosEnTarjeta.append(cadenaHtmlDeObjetoAInsertar);
      contenedorDeDetalleDePagosEnTarjeta.listview("refresh");
    }
    contenedorDeDetalleDePagosEnTarjeta = null;
    objetoDePagosEnTarjeta.length = 0;
    objetoDePagosEnTarjeta = null;
    cadenaHtmlDeObjetoAInsertar = null;
  }

  obtenerCadenaHtmlDePagoEnTarjeta(pago: TipoDePagoEnFacturaVencida): string {
    let html: string[] = [];
    html.push(` <li>`);
    html.push(` <a href="#">`);
    html.push(` <label>${pago.documentNumber} </label>`);
    html.push(
      `<span class="small-roboto ui-li-count">${
        this.configuracionDeDecimales.currencySymbol
      }. ${format_number(
        pago.amount,
        this.configuracionDeDecimales.defaultDisplayDecimals
      )}</span>`
    );
    html.push(` <label>${pago.bankName}</label>`);
    html.push(" </a>");
    html.push(
      ` <a href="#" id="${pago.paymentType}|${pago.documentNumber}"></a>`
    );
    html.push(" </li>");
    return html.join("");
  }

  cambiarVisualizacionDeCamposDePagoEnTarjeta(visualizarCampos: boolean): void {
    let contenedorDeCamposParaChequesODepositos: JQuery = $(
      "#BankCheckOrDepositContainer"
    );
    let contenedorDeCamposParaEfectivo: JQuery = $("#CashContainer");
    let contenedorDeCamposParaTarjeta: JQuery = $(
      "#CreditOrDebitCardContainer"
    );

    let campoDeIngresoDeNumeroDeAutorizacion: JQuery = $(
      "#TxtCreditOrDebitCardAuthorizationNumber"
    );

    contenedorDeCamposParaChequesODepositos.css("display", "none");
    contenedorDeCamposParaEfectivo.css("display", "none");

    if (visualizarCampos) {
      contenedorDeCamposParaTarjeta.css("display", "block");
      campoDeIngresoDeNumeroDeAutorizacion.focus();
    } else {
      contenedorDeCamposParaTarjeta.css("display", "none");
    }

    contenedorDeCamposParaChequesODepositos = null;
    contenedorDeCamposParaEfectivo = null;
    contenedorDeCamposParaTarjeta = null;
    campoDeIngresoDeNumeroDeAutorizacion = null;
  }

  validarPagoConTarjeta() {
    let numeroDeDocumento: JQuery = $(
      "#TxtCreditOrDebitCardAuthorizationNumber"
    );
    let montoDelDocumento: JQuery = $("#TxtCreditOrDebitCardAmount");

    let cuentaBancaria: JQuery = $("#CmbBankAccountCreditOrDebitCard");

    if (cuentaBancaria.val() === "NULL") {
      notify(
        `Debe seleccionar un banco, por favor, verifique y vuelva a intentar`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      cuentaBancaria.focus();
      return;
    }

    if (this.usuarioNoIngresoNumeroDeDocumento(numeroDeDocumento)) {
      notify(
        `Debe proporcionar el número de autorización, por favor, verifique y vuelva a intentar`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      numeroDeDocumento.focus();
      return;
    }

    if (this.imagenFrontalDelDocumentoDePago === "") {
      notify(
        `Debe proporcionar la imágen del comprobante de pago, por favor, verifique y vuelva a intentar`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      numeroDeDocumento.focus();
      return;
    }

    if (this.usuarioIngresoValorIncorrecto(montoDelDocumento)) {
      notify(
        `El monto ingresado es incorrecto, por favor, verifique y vuelva a intentar.`
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
      montoDelDocumento.focus();
      return;
    }

    this.agregarPagoEnTarjeta(numeroDeDocumento, montoDelDocumento);
  }

  agregarPagoEnTarjeta(
    numeroDeDocumento: JQuery,
    montoDelDocumento: JQuery
  ): void {
    let tipoDePagoSeleccionado: JQuery = $("#UiCmbPaymentType");
    let pagoEnTarjeta: JQuery = (this
      .detalleDeTiposDePagosRealizados as any).find(
      (tipoDePago: TipoDePagoEnFacturaVencida) => {
        return tipoDePago.documentNumber === numeroDeDocumento.val();
      }
    );
    let bancoSeleccionado: JQuery = $("#CmbBankAccountCreditOrDebitCard");

    if (pagoEnTarjeta) {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify(
        `Ya existe el número de documento en el detalle de pagos, por favor, verifique y vuelva a intentar.`
      );
      numeroDeDocumento.focus();
      return;
    } else {
      let pago: TipoDePagoEnFacturaVencida = new TipoDePagoEnFacturaVencida();

      pago.paymentType = tipoDePagoSeleccionado.val();
      pago.amount = parseFloat(montoDelDocumento.val());
      pago.documentNumber = numeroDeDocumento.val();
      pago.bankName = bancoSeleccionado.val();
      pago.frontImage = this.imagenFrontalDelDocumentoDePago;
      this.detalleDeTiposDePagosRealizados.push(pago);
    }

    this.calcularMontosDeLosDiferentesTiposDePagos();
    InteraccionConUsuarioServicio.desbloquearPantalla();
    this.limpiarCamposDePagoEnTarjeta();
    numeroDeDocumento.focus();
    this.generarListadoDeTiposDePagos();
  }
}
