class TipoDePagoEnFacturaVencidaControlador {

    tokenDetalleDeTiposDePagoRealizados: SubscriptionToken;

    detalleDeTiposDePagosRealizados: TipoDePagoEnFacturaVencida[] = [];
    decimalesServicio: ManejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
    configuracionDeDecimales: ManejoDeDecimales;
    simboloDeMoneda: string;
    imagenFrontalDelDocumentoDePago: string = "";
    imagenPosteriorDelDocumentoDePago: string = "";

    constructor(public mensajero: Messenger) {
        this.tokenDetalleDeTiposDePagoRealizados = mensajero.subscribe<DetalleDeTipoDePagoMensaje>(this.detalleDePagosDelDocumentoActualEntregados, getType(DetalleDeTipoDePagoMensaje), this);
    }

    delegarTipoDePagoEnFacturaVencidaControlador() {
        const este = this;

        $("#UiOverdueInvoicePaymentDetailPage").on("pageshow", (e: JQueryEventObject) => {
            e.preventDefault();
            
            this.cargarDatosIniciales();
        });

        $("#UiBtnGoBackFromOverdueInvoicePaymentDetailPage").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            this.enviarInformacionDeDetalleDePagos(() => {
                this.irAPantalla("UiOverdueInvoicePaymentPage");
            });
        });

        $("#UiBtnApplyPayment").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            this.obtenerAutorizacionDeUsuarioParaProcesarPago(() => {
                this.validarPagoIngresado();
            });
        });

        $("#UiBtnTakeFrontImage").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            DispositivoServicio.TomarFoto((imagen) => {
                this.imagenFrontalDelDocumentoDePago = imagen;
            }, (mensajeDeError) => {
                if (mensajeDeError !== "Camera cancelled.")
                    notify(mensajeDeError);
            });
        });

        $("#UiBtnTakeBackImage").on("click", (e: JQueryEventObject) => {
            e.preventDefault();
            DispositivoServicio.TomarFoto((imagen) => {
                this.imagenPosteriorDelDocumentoDePago = imagen;
            }, (mensajeDeError) => {
                if (mensajeDeError !== "Camera cancelled.")
                    notify(mensajeDeError);
            });
        });

        $("#UiCmbPaymentType").on("change", (e: JQueryEventObject) => {
            e.preventDefault();
            this.expandirContenedorDeInformacionDeTipoDePagoSeleccionado(e);
        });

        $("#UiOverdueInvoicePaymentDetailPage").on("click", "#UiBanckCheksDetail a", (e: JQueryEventObject) => {
            let id = (e.currentTarget as any).id;
            if (id) {
                this.obtenerAutorizacionDeUsuarioParaEliminarPago(() => {
                    this.eliminarPagoSeleccionado(id);
                });
            }
        });

        $("#UiOverdueInvoicePaymentDetailPage").on("click", "#UiDepositsDetail a", (e: JQueryEventObject) => {
            let id = (e.currentTarget as any).id;
            if (id) {
                this.obtenerAutorizacionDeUsuarioParaEliminarPago(() => {
                    this.eliminarPagoSeleccionado(id);
                });
            }

        });

        $("#UiOverdueInvoicePaymentDetailPage").on("click", "#UiCashDetail a", (e: JQueryEventObject) => {
            let id = (e.currentTarget as any).id;
            if (id) {
                this.obtenerAutorizacionDeUsuarioParaEliminarPago(() => {
                    this.eliminarPagoSeleccionado(id);
                });
            }
        });

    }

    expandirContenedorDeInformacionDeTipoDePagoSeleccionado(e: JQueryEventObject): void {
        let tipoDePagoSeleccionado = (e.currentTarget as any).selectedOptions[0].value;
        let contenedorDeInformacionEnEfectivo = $("#InfoCashContainer");
        let contenedorDeInformacionDeDepositos = $("#InfoDepositsContainer");
        let contenedorDeInformacionDeCheques = $("#InfoBankChecksContainer");

        this.colapsarTodosLosContenedoresDeInformacionDePagos(contenedorDeInformacionEnEfectivo, contenedorDeInformacionDeCheques, contenedorDeInformacionDeDepositos);

        switch (tipoDePagoSeleccionado) {
            case TipoDePagoFacturaVencida.Cheque:
                contenedorDeInformacionDeCheques.collapsible("expand");
                this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(true);
                break;

            case TipoDePagoFacturaVencida.Efectivo:
                contenedorDeInformacionEnEfectivo.collapsible("expand");
                this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(false);
                break;

            case TipoDePagoFacturaVencida.Deposito:
                contenedorDeInformacionDeDepositos.collapsible("expand");
                this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(true);
                break;

            default:
                contenedorDeInformacionEnEfectivo.collapsible("expand");
                this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(false);
        }

        contenedorDeInformacionDeDepositos = null;
        contenedorDeInformacionDeCheques = null;
        contenedorDeInformacionEnEfectivo = null;
        tipoDePagoSeleccionado = null;
    }

    colapsarTodosLosContenedoresDeInformacionDePagos(contenedorDeInformacionEnEfectivo: JQuery,
        contenedorDeInformacionDeCheques: JQuery,
        contenedorDeInformacionDeDepositos: JQuery): void {
        contenedorDeInformacionEnEfectivo.collapsible("collapse");
        contenedorDeInformacionDeDepositos.collapsible("collapse");
        contenedorDeInformacionDeCheques.collapsible("collapse");
    }

    cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(visualizar: boolean): void {
        let contenedorDeCamposParaChequesODepositos = $("#BankCheckOrDepositContainer");
        let contenedorDeCamposParaEfectivo = $("#CashContainer");
        let campoDeMontoIngresadoEnEfectivo = $("#TxtCashAmount");
        let campoDeNumeroDeDocumentoDeChequeODeposito = $("#TxtBankCheckOrDepositNumber");

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
    }

    cargarDatosIniciales(): void {
        let tipoDePago = $("#UiCmbPaymentType");
        tipoDePago.val(TipoDePagoFacturaVencida.Efectivo);
        tipoDePago.selectmenu("refresh", true);
        tipoDePago.trigger("change");
        tipoDePago = null;

        this.limpiarCamposDePagoDeChequeODeposito();
        this.limpiarCampoDePagoEnEfectivo();

        this.simboloDeMoneda = localStorage.getItem("CURRENCY_SYMBOL") || "Q";
        
        this.decimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {
            this.configuracionDeDecimales = decimales;
            this.cambiarVisualizacionDeContenedorDeCamposParaChequesODepositos(false);
            this.calcularMontosDeLosDiferentesTiposDePagos();

            this.generarListadoDeTiposDePagos();
        });

    }

    calcularMontosDeLosDiferentesTiposDePagos(): void {
        let montoEnEfectivo: number = 0;
        let montoEnDepositos: number = 0;
        let montoEnCheques: number = 0;

        let montoPagadoEnEfectivo = $("#UiLblCashPayedAmount");

        let montoPagadoEnDepositos = $("#UiLblDepositsPayedAmount");
        let montoPagadoEnCheques = $("#UiLblBankChecksPayedAmount");

        let montoTotalPagado = $("#UiLblTotalPayedAmount");

        this.detalleDeTiposDePagosRealizados.forEach((tipoDePagoEnFacturaVencida: TipoDePagoEnFacturaVencida) => {
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
            }
        });

        montoPagadoEnEfectivo.text(`${this.simboloDeMoneda}. ${format_number(montoEnEfectivo,
            this.configuracionDeDecimales.defaultDisplayDecimals)}`);

        montoPagadoEnDepositos.text(`${this.simboloDeMoneda}. ${format_number(montoEnDepositos,
            this.configuracionDeDecimales.defaultDisplayDecimals)}`);

        montoPagadoEnCheques
            .text(`${this.simboloDeMoneda}. ${format_number(montoEnCheques, this.configuracionDeDecimales.defaultDisplayDecimals)}`);

        montoTotalPagado.text(`${this.simboloDeMoneda}. ${format_number((montoEnEfectivo + montoEnDepositos + montoEnCheques),
            this.configuracionDeDecimales.defaultDisplayDecimals)}`);

        montoEnEfectivo = null;
        montoEnCheques = null;
        montoEnDepositos = null;

        montoPagadoEnDepositos = null;
        montoPagadoEnCheques = null;
        montoPagadoEnEfectivo = null;

        montoTotalPagado = null;

    }

    irAPantalla(pantalla: string): void {
        $.mobile.changePage(`#${pantalla}`,
            {
                transition: "pop",
                reverse: false,
                changeHash: false,
                showLoadMsg: false
            });
    }

    validarPagoIngresado(): void {
        let tipoDePagoSeleccionado = $("#UiCmbPaymentType");

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
        }

    }

    validarPagoEnEfectivo(): void {
        let montoEnEfectivo = $("#TxtCashAmount");
        if (this.usuarioIngresoValorIncorrecto(montoEnEfectivo)) {
            notify(`El monto ingresado es incorrecto, por favor, verifique y vuelva a intentar.`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            montoEnEfectivo.focus();
        } else {
            this.agregarPagoEnEfectivo(montoEnEfectivo);
        }
        montoEnEfectivo = null;
    }

    validarPagoConDepositoOCheque(): void {
        let numeroDeDocumento = $("#TxtBankCheckOrDepositNumber");
        let montoDelDocumento = $("#TxtBankCheckOrDepositAmount");
        let cuentaBancaria = $("#CmbBankAccount");

        if (this.usuarioNoIngresoNumeroDeDocumento(numeroDeDocumento)) {
            notify(`Debe proporcionar el número del comprobante de pago, por favor, verifique y vuelva a intentar`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            numeroDeDocumento.focus();
            return;
        }

        if (this.imagenFrontalDelDocumentoDePago === "") {
            notify(`Debe proporcionar, por lo menos, una imágen frontal del comprobante de pago, por favor, verifique y vuelva a intentar`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            numeroDeDocumento.focus();
            return;
        }

        if (cuentaBancaria.val() === "NULL") {
            notify(`Debe seleccionar un banco, por favor, verifique y vuelva a intentar`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            cuentaBancaria.focus();
            return;
        }

        if (this.usuarioIngresoValorIncorrecto(montoDelDocumento)) {
            notify(`El monto ingresado es incorrecto, por favor, verifique y vuelva a intentar.`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            montoDelDocumento.focus();
            return;
        } else {
            this.agregarPagoEnChequeODeposito(numeroDeDocumento, montoDelDocumento);
        }
    }

    usuarioIngresoValorIncorrecto(campoDePago: JQuery): boolean {
        return (campoDePago.val() === "" ||
            campoDePago.val() === "." ||
            campoDePago.val() === "," ||
            campoDePago.val() === "-" ||
            isNaN(campoDePago.val()));
    }

    usuarioNoIngresoNumeroDeDocumento(numeroDeDocumento: JQuery): boolean {
        return numeroDeDocumento.val() === "";
    }

    agregarPagoEnChequeODeposito(numeroDeDocumento: JQuery, montoDelDocumento: JQuery): void {
        let tipoDePagoSeleccionado = $("#UiCmbPaymentType");
        let bancoSeleccionado = $("#CmbBankAccount");
        let pagoEnChequeODeposito = (this.detalleDeTiposDePagosRealizados as any).find((tipoDePago: TipoDePagoEnFacturaVencida) => {
            return tipoDePago.documentNumber === numeroDeDocumento.val();
        });

        if (pagoEnChequeODeposito) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify(`Ya existe el número de documento en el detalle de pagos, por favor, verifique y vuelva a intentar.`);
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
        let pagoEnEfectivo = (this.detalleDeTiposDePagosRealizados as any).find((tipoDePago: TipoDePagoEnFacturaVencida) => {
            return tipoDePago.paymentType === TipoDePagoFacturaVencida.Efectivo;
        });

        if (pagoEnEfectivo) {
            for (let i = 0; i < this.detalleDeTiposDePagosRealizados.length; i++) {
                let tipoDePago = this.detalleDeTiposDePagosRealizados[i];
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
            }, `Sonda® SD ${SondaVersion}`, ["No", "Si"]);
    }

    obtenerAutorizacionDeUsuarioParaEliminarPago(callback: () => void): void {
        navigator.notification.confirm(
            "¿Está seguro de eliminar el pago seleccionado?",
            buttonIndex => {
                if (buttonIndex === BotonSeleccionado.Si) {
                    InteraccionConUsuarioServicio.bloquearPantalla();
                    callback();
                }
            }, `Sonda® SD ${SondaVersion}`, ["No", "Si"]);
    }

    limpiarCamposDePagoDeChequeODeposito(): void {
        let numeroDeDocumento = $("#TxtBankCheckOrDepositNumber");
        let montoDelDocumento = $("#TxtBankCheckOrDepositAmount");
        numeroDeDocumento.val("");
        montoDelDocumento.val("");
        this.imagenFrontalDelDocumentoDePago = "";
        this.imagenPosteriorDelDocumentoDePago = "";
        numeroDeDocumento = null;
        montoDelDocumento = null;
    }

    generarListadoDeCuentasBancarias(): void {
        let contenedorDeCuentasBancarias = $("#CmbBankAccount");
        contenedorDeCuentasBancarias.children().remove("option");
        contenedorDeCuentasBancarias.selectmenu("refresh", true);

        obtenerCuentasDeBancos((cuentasDeBanco) => {
            cuentasDeBanco.forEach((cuentaBancaria: any, posicion: number) => {

                if (posicion === 0) {
                    contenedorDeCuentasBancarias.append(`<option value="NULL" selected="selected">Seleccionar...</option>`);
                }

                contenedorDeCuentasBancarias.append(
                    $("<option>",
                        {
                            value: `${cuentaBancaria.banco}`,
                            text: `${cuentaBancaria.banco}`
                        })
                );


            });
            contenedorDeCuentasBancarias.selectmenu("refresh", true);
        }, (resultado) => {
            notify(resultado.message);
        });
    }

    generarListadoDeTiposDePagos(): void {
        this.generarListadoDeCuentasBancarias();
        this.limpiarListadosDeTiposDePagos();

        let pagoEnEfectivo = this.detalleDeTiposDePagosRealizados.filter((tipoDePago: TipoDePagoEnFacturaVencida) => {
            return tipoDePago.paymentType === TipoDePagoFacturaVencida.Efectivo;
        });

        let pagoEnDepositos = this.detalleDeTiposDePagosRealizados.filter((tipoDePago: TipoDePagoEnFacturaVencida) => {
            return tipoDePago.paymentType === TipoDePagoFacturaVencida.Deposito;
        });

        let pagoEnCheques = this.detalleDeTiposDePagosRealizados.filter((tipoDePago: TipoDePagoEnFacturaVencida) => {
            return tipoDePago.paymentType === TipoDePagoFacturaVencida.Cheque;
        });

        if (pagoEnEfectivo && pagoEnEfectivo.length > 0) {
            this.generarListadoDePagoEnEfectivo(pagoEnEfectivo);
        }

        if (pagoEnDepositos && pagoEnDepositos.length > 0) {
            this.generarListadoDePagoEnDepositos(pagoEnDepositos);
        }

        if (pagoEnCheques && pagoEnCheques.length > 0) {
            this.generarListadoDePagoEnCheques(pagoEnCheques);
        }
    }

    generarListadoDePagoEnEfectivo(pagoEnEfectivo: TipoDePagoEnFacturaVencida[]): void {
        let contenedorEfectivo = $("#UiCashDetail");
        let pagosEfectivo: string[] = [];

        pagoEnEfectivo.forEach((pago: TipoDePagoEnFacturaVencida) => {
            pagosEfectivo.push(` <li>`);
            pagosEfectivo.push(` <a href="#">`);
            pagosEfectivo.push(` <h1>${this.simboloDeMoneda}. ${format_number(pago.amount, this.configuracionDeDecimales.defaultDisplayDecimals)}</h1>`);
            pagosEfectivo.push(" </a>");
            pagosEfectivo.push(` <a href="#" id="${pago.paymentType}|0"></a>`);
            pagosEfectivo.push(" </li>");
        });

        let cadenaHtmlDeObjetoAInsertar = pagosEfectivo.join("");
        if (cadenaHtmlDeObjetoAInsertar !== "") {
            contenedorEfectivo.append(cadenaHtmlDeObjetoAInsertar);
            contenedorEfectivo.listview("refresh");
        }
        contenedorEfectivo = null;
        pagosEfectivo.length = 0;
        pagosEfectivo = null;
        cadenaHtmlDeObjetoAInsertar = null;
    }

    generarListadoDePagoEnDepositos(pagoEnDepositos: TipoDePagoEnFacturaVencida[]): void {
        let contenedorDepositos = $("#UiDepositsDetail");
        let pagosEnDeposito: string[] = [];

        pagoEnDepositos.forEach((pago: TipoDePagoEnFacturaVencida) => {
            pagosEnDeposito.push(this.obtenerCadenaHtmlDePagoEnChequeODeposito(pago));
        });

        let cadenaHtmlDeObjetoAInsertar = pagosEnDeposito.join("");
        if (cadenaHtmlDeObjetoAInsertar !== "") {
            contenedorDepositos.append(cadenaHtmlDeObjetoAInsertar);
            contenedorDepositos.listview("refresh");
        }
        contenedorDepositos = null;
        pagosEnDeposito.length = 0;
        pagosEnDeposito = null;
        cadenaHtmlDeObjetoAInsertar = null;

    }

    generarListadoDePagoEnCheques(pagoEnCheques: TipoDePagoEnFacturaVencida[]): void {
        let contenedorCheques = $("#UiBanckCheksDetail");
        let pagosEnCheque: string[] = [];

        pagoEnCheques.forEach((pago: TipoDePagoEnFacturaVencida) => {
            pagosEnCheque.push(this.obtenerCadenaHtmlDePagoEnChequeODeposito(pago));
        });

        let cadenaHtmlDeObjetoAInsertar = pagosEnCheque.join("");
        if (cadenaHtmlDeObjetoAInsertar !== "") {
            contenedorCheques.append(cadenaHtmlDeObjetoAInsertar);
            contenedorCheques.listview("refresh");
        }
        contenedorCheques = null;
        pagosEnCheque.length = 0;
        pagosEnCheque = null;
        cadenaHtmlDeObjetoAInsertar = null;
    }

    obtenerCadenaHtmlDePagoEnChequeODeposito(pago: TipoDePagoEnFacturaVencida): string {
        let html: string[] = [];
        html.push(` <li>`);
        html.push(` <a href="#">`);
        html.push(` <label>${pago.documentNumber} </label>`);
        html.push(`<span class="small-roboto ui-li-count">${this
            .simboloDeMoneda}. ${format_number(pago
                .amount,
                this.configuracionDeDecimales.defaultDisplayDecimals)}</span>`);
        html.push(` <label>${pago.bankName}</label>`);
        html.push(" </a>");
        html.push(` <a href="#" id="${pago.paymentType}|${pago.documentNumber}"></a>`);
        html.push(" </li>");
        return html.join("");
    }

    limpiarListadosDeTiposDePagos(): void {
        let contenedorEfectivo = $("#UiCashDetail");
        let contenedorDepositos = $("#UiDepositsDetail");
        let contenedorCheques = $("#UiBanckCheksDetail");

        contenedorEfectivo.children().remove("li");
        contenedorDepositos.children().remove("li");
        contenedorCheques.children().remove("li");

        contenedorEfectivo = null;
        contenedorCheques = null;
        contenedorDepositos = null;
    }

    eliminarPagoSeleccionado(id: string): void {
        let tipoDePago = id.toString().split("|")[0];
        let numeroDeDocumento = id.toString().split("|")[1];

        if (tipoDePago === TipoDePagoFacturaVencida.Efectivo.toString()) {
            for (let i = 0; i < this.detalleDeTiposDePagosRealizados.length; i++) {
                let pago = this.detalleDeTiposDePagosRealizados[i];
                if (pago.paymentType === TipoDePagoFacturaVencida.Efectivo) {
                    this.detalleDeTiposDePagosRealizados.splice(i, 1);
                    break;
                }
            }
        } else {
            for (let i = 0; i < this.detalleDeTiposDePagosRealizados.length; i++) {
                let pago = this.detalleDeTiposDePagosRealizados[i];
                if (pago.paymentType.toString() === tipoDePago && pago.documentNumber === numeroDeDocumento) {
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
        let mensaje: DetalleDeTipoDePagoMensaje = new DetalleDeTipoDePagoMensaje(this);
        mensaje.detalleDePagosRealizados = this.detalleDeTiposDePagosRealizados;
        this.mensajero.publish(mensaje, getType(DetalleDeTipoDePagoMensaje));

        callback();
    }

    detalleDePagosDelDocumentoActualEntregados(message: DetalleDeTipoDePagoMensaje, subscriber: any) {
        subscriber.detalleDeTiposDePagosRealizados = message.detalleDePagosRealizados;
    }

    limpiarCampoDePagoEnEfectivo(): void {
        let montoEnEfectivo = $("#TxtCashAmount");
        montoEnEfectivo.val("");
        montoEnEfectivo = null;
    }
}