class ConfirmacionDePagoControlador {
  tokenDePago: SubscriptionToken;
  pagoProcesado: PagoDeFacturaVencidaEncabezado = new PagoDeFacturaVencidaEncabezado();
  pagoServicio: PagoDeFacturaVencidaServicio = new PagoDeFacturaVencidaServicio();
  clienteProcesado: Cliente;

  funcionDeRetornoAPocesoPrincipal: Function = null;

  constructor(public mensajero: Messenger) {
    this.tokenDePago = mensajero.subscribe<PagoDeFacturaVencidaMensaje>(
      this.pagoEntregado,
      getType(PagoDeFacturaVencidaMensaje),
      this
    );
  }

  pagoEntregado(message: PagoDeFacturaVencidaMensaje, subscriber: any): void {
    subscriber.pagoProcesado = message.pago;
    subscriber.clienteProcesado = message.cliente;
    subscriber.funcionDeRetornoAPocesoPrincipal =
      message.funcionDeRetornoAPocesoPrincipal;
  }

  delegarConfirmacionDePagoControlador(): void {
    $("#UiPaymentConfirmationPage").on("pageshow", () => {
      this.cargarDatosPrincipales();
    });

    $("#UiBtnPaymentConfirmed").on("click", () => {
      this.definirPantallaDeDestinoEnBaseAParametroDePorcentajeMinimoDePago(
        () => {
          window.history.back();
        }
      );
    });

    $("#UiBtnPrintPaidProcessed").on("click", () => {
      this.pagoProcesado.printsQuantity = 0;
      InteraccionConUsuarioServicio.bloquearPantalla();
      this.imprimirDocumentoDePago(() => {
        InteraccionConUsuarioServicio.desbloquearPantalla();
      });
    });
  }

  definirPantallaDeDestinoEnBaseAParametroDePorcentajeMinimoDePago(
    callback: () => void
  ): void {
    if (this.pagoProcesado.validateMinimumPercentOfPaid) {
      if (
        this.pagoProcesado.percentCoveredWhitThePaid >=
        this.pagoProcesado.minimumPercentOfPaid
      ) {
        this.enviarInformacionDeDetalleDePagos(() => {
          // return to the main process
          this.funcionDeRetornoAPocesoPrincipal();
        });
      } else {
        this.regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta(
          this.pagoProcesado.minimumPercentOfPaid,
          callback
        );
      }
    } else {
      this.enviarInformacionDeDetalleDePagos(() => {
        // return to the main process
        this.funcionDeRetornoAPocesoPrincipal();
        notify("Puede seguir con el proceso de venta.");
      });
    }
  }

  regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta(
    porcentajeMinimo: number,
    callback: () => void
  ): void {
    this.enviarInformacionDeClientePertenecienteAlPagoActual(() => {
      this.enviarInformacionDeDetalleDePagos(callback);
    });

    notify(
      `El pago realizado no cubre el porcentaje: ${
        porcentajeMinimo ? porcentajeMinimo : 100
      }% mínimo necesario para realizar una nueva venta.`
    );
  }

  cargarDatosPrincipales(): void {
    EnviarData();
    let etiquetaDePagoProcesado: JQuery = $("#UiLblNumberOfPaidProcessed");
    etiquetaDePagoProcesado.text(this.pagoProcesado.docNum);
    etiquetaDePagoProcesado = null;
  }

  imprimirDocumentoDePago(callback: () => void): void {
    try {
      if (this.pagoProcesado.printsQuantity === 2) {
        return callback();
      }
      this.pagoServicio.imprimirPago(
        this.pagoProcesado,
        () => {
          this.pagoProcesado.isReprint = true;
          this.pagoProcesado.printsQuantity++;
          this.imprimirDocumentoDePago(callback);
        },
        error => {
          InteraccionConUsuarioServicio.desbloquearPantalla();
          notify(
            `Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.`
          );
        }
      );
    } catch (e) {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      console.log(
        `Error al intentar imprimir el documento de pago debido a: ${e.message}`
      );
      notify(
        `Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.`
      );
    }
  }

  enviarInformacionDeDetalleDePagos(callback: () => void): void {
    let mensaje: DetalleDeTipoDePagoMensaje = new DetalleDeTipoDePagoMensaje(
      this
    );

    mensaje.detalleDePagosRealizados = new Array<TipoDePagoEnFacturaVencida>();
    this.mensajero.publish(mensaje, getType(DetalleDeTipoDePagoMensaje));

    callback();
  }

  enviarInformacionDeClientePertenecienteAlPagoActual(
    callback: () => void
  ): void {
    var clienteMensaje = new ClienteMensaje(this);

    clienteMensaje.cliente = this.clienteProcesado;
    clienteMensaje.vistaCargandosePorPrimeraVez = true;
    clienteMensaje.tipoDePagoAProcesar = this.clienteProcesado.paymentType;

    this.mensajero.publish(clienteMensaje, getType(ClienteMensaje));

    callback();
  }

  enviarSolicitudDeActualizacionDeInformacionDePagoActual(): void {}
}
