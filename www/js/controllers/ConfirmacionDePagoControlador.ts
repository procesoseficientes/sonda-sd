class ConfirmacionDePagoControlador {
  tokenDePago: SubscriptionToken;
  pagoProcesado: PagoDeFacturaVencidaEncabezado = new PagoDeFacturaVencidaEncabezado();
  pagoServicio: PagoServicio = new PagoServicio();
  clienteProcesado: Cliente;

  constructor(public mensajero: Messenger) {
    this.tokenDePago = mensajero.subscribe<PagoMensaje>(
      this.pagoEntregado,
      getType(PagoMensaje),
      this
    );
  }

  pagoEntregado(message: PagoMensaje, subscriber: any): void {
    subscriber.pagoProcesado = message.pago;
    subscriber.clienteProcesado = message.cliente;
  }

  delegarConfirmacionDePagoControlador(): void {
    $("#UiPaymentConfirmationPage").on("pageshow", () => {
      this.cargarDatosPrincipales();
    });

    $("#UiBtnPaymentConfirmed").on("click", () => {
      this.definirPantallaDeDestinoEnBaseAParametroDePorcentajeMinimoDePago(
        pantallaDeDestino => {
          this.irAPantalla(pantallaDeDestino);
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

  irAPantalla(pantalla: string): void {
    $.mobile.changePage(`#${pantalla}`, {
      transition: "pop",
      reverse: false,
      changeHash: false,
      showLoadMsg: false
    });
  }

  definirPantallaDeDestinoEnBaseAParametroDePorcentajeMinimoDePago(
    callback: (pantallaDestino: string) => void
  ): void {
    let procesarVentaDeCliente = () => {
      let nitDeCliente = $("#txtNIT");
      nitDeCliente.val(gNit);
      nitDeCliente = null;

      ShowSkusToPOS();
    };

    if (this.pagoProcesado.validateMinimumPercentOfPaid) {
      if (
        this.pagoProcesado.percentCoveredWhitThePaid >=
        this.pagoProcesado.minimumPercentOfPaid
      ) {
        this.enviarInformacionDeDetalleDePagos(() => {
          if (
            this.pagoProcesado.paymentType ===
            TipoDePagoDeFactura.FacturaVencida
          ) {
            procesarVentaDeCliente();
          } else {
            ShorSummaryPage();
          }
        });
      } else {
        this.regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta(
          this.pagoProcesado.minimumPercentOfPaid,
          callback
        );
      }
    } else {
      if (
        this.pagoProcesado.paymentType === TipoDePagoDeFactura.FacturaVencida
      ) {
        this.regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta(
          null,
          callback
        );
      } else {
        ShorSummaryPage();
        notify("Puede seguir con el proceso de facturación.");
      }
    }
  }

  regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta(
    porcentajeMinimo: number,
    callback: (nombreDePantalla: string) => void
  ): void {
    if (this.pagoProcesado.paymentType === TipoDePagoDeFactura.FacturaVencida) {
      publicarClienteParaProcesoDeCobroDeFacturasVencidas(() => {
        this.enviarInformacionDeDetalleDePagos(() => {
          callback("UiOverdueInvoicePaymentPage");
        });
      });
    } else {
      this.enviarInformacionDeClientePertenecienteAlPagoActual(() => {
        this.enviarInformacionDeDetalleDePagos(() => {
          callback("UiOverdueInvoicePaymentPage");
        });
      });
    }

    notify(
      `El pago realizado no cubre el porcentaje: ${
        porcentajeMinimo ? porcentajeMinimo : 100
      }% mínimo necesario para realizar una nueva venta.`
    );
  }

  cargarDatosPrincipales(): void {
    EnviarData();
    let etiquetaDePagoProcesado = $("#UiLblNumberOfPaidProcessed");
    etiquetaDePagoProcesado.text(this.pagoProcesado.docNum);
    etiquetaDePagoProcesado = null;
  }

  imprimirDocumentoDePago(callback: () => void): void {
    try {
      if (this.pagoProcesado.printsQuantity === 2) return callback();
      this.pagoServicio.imprimirPago(
        this.pagoProcesado,
        () => {
          this.pagoProcesado.isReprint = true;
          this.pagoProcesado.printsQuantity++;
          this.imprimirDocumentoDePago(callback);
        },
        error => {
          InteraccionConUsuarioServicio.desbloquearPantalla();
          console.log(
            `Error al imprimir el documento de pago debido a: ${error}`
          );
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

  enviarSolicitudDeActualizacionDeInformacionDePagoActual():void{
    
  }
}
