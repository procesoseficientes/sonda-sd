var ConfirmacionDePagoControlador = (function () {
    function ConfirmacionDePagoControlador(mensajero) {
        this.mensajero = mensajero;
        this.pagoProcesado = new PagoDeFacturaVencidaEncabezado();
        this.pagoServicio = new PagoServicio();
        this.tokenDePago = mensajero.subscribe(this.pagoEntregado, getType(PagoMensaje), this);
    }
    ConfirmacionDePagoControlador.prototype.pagoEntregado = function (message, subscriber) {
        subscriber.pagoProcesado = message.pago;
        subscriber.clienteProcesado = message.cliente;
    };
    ConfirmacionDePagoControlador.prototype.delegarConfirmacionDePagoControlador = function () {
        var _this = this;
        $("#UiPaymentConfirmationPage").on("pageshow", function () {
            _this.cargarDatosPrincipales();
        });
        $("#UiBtnPaymentConfirmed").on("click", function () {
            _this.definirPantallaDeDestinoEnBaseAParametroDePorcentajeMinimoDePago(function (pantallaDeDestino) {
                _this.irAPantalla(pantallaDeDestino);
            });
        });
        $("#UiBtnPrintPaidProcessed").on("click", function () {
            _this.pagoProcesado.printsQuantity = 0;
            InteraccionConUsuarioServicio.bloquearPantalla();
            _this.imprimirDocumentoDePago(function () {
                InteraccionConUsuarioServicio.desbloquearPantalla();
            });
        });
    };
    ConfirmacionDePagoControlador.prototype.irAPantalla = function (pantalla) {
        $.mobile.changePage("#" + pantalla, {
            transition: "pop",
            reverse: false,
            changeHash: false,
            showLoadMsg: false
        });
    };
    ConfirmacionDePagoControlador.prototype.definirPantallaDeDestinoEnBaseAParametroDePorcentajeMinimoDePago = function (callback) {
        var _this = this;
        var procesarVentaDeCliente = function () {
            var nitDeCliente = $("#txtNIT");
            nitDeCliente.val(gNit);
            nitDeCliente = null;
            ShowSkusToPOS();
        };
        if (this.pagoProcesado.validateMinimumPercentOfPaid) {
            if (this.pagoProcesado.percentCoveredWhitThePaid >=
                this.pagoProcesado.minimumPercentOfPaid) {
                this.enviarInformacionDeDetalleDePagos(function () {
                    if (_this.pagoProcesado.paymentType ===
                        TipoDePagoDeFactura.FacturaVencida) {
                        procesarVentaDeCliente();
                    }
                    else {
                        ShorSummaryPage();
                    }
                });
            }
            else {
                this.regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta(this.pagoProcesado.minimumPercentOfPaid, callback);
            }
        }
        else {
            if (this.pagoProcesado.paymentType === TipoDePagoDeFactura.FacturaVencida) {
                this.regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta(null, callback);
            }
            else {
                ShorSummaryPage();
                notify("Puede seguir con el proceso de facturación.");
            }
        }
    };
    ConfirmacionDePagoControlador.prototype.regresarAPantallaDeFacturasVendidasDebidoANoAlcanzarElPagoMinimoParaNuevaVenta = function (porcentajeMinimo, callback) {
        var _this = this;
        if (this.pagoProcesado.paymentType === TipoDePagoDeFactura.FacturaVencida) {
            publicarClienteParaProcesoDeCobroDeFacturasVencidas(function () {
                _this.enviarInformacionDeDetalleDePagos(function () {
                    callback("UiOverdueInvoicePaymentPage");
                });
            });
        }
        else {
            this.enviarInformacionDeClientePertenecienteAlPagoActual(function () {
                _this.enviarInformacionDeDetalleDePagos(function () {
                    callback("UiOverdueInvoicePaymentPage");
                });
            });
        }
        notify("El pago realizado no cubre el porcentaje: " + (porcentajeMinimo ? porcentajeMinimo : 100) + "% m\u00EDnimo necesario para realizar una nueva venta.");
    };
    ConfirmacionDePagoControlador.prototype.cargarDatosPrincipales = function () {
        EnviarData();
        var etiquetaDePagoProcesado = $("#UiLblNumberOfPaidProcessed");
        etiquetaDePagoProcesado.text(this.pagoProcesado.docNum);
        etiquetaDePagoProcesado = null;
    };
    ConfirmacionDePagoControlador.prototype.imprimirDocumentoDePago = function (callback) {
        var _this = this;
        try {
            if (this.pagoProcesado.printsQuantity === 2)
                return callback();
            this.pagoServicio.imprimirPago(this.pagoProcesado, function () {
                _this.pagoProcesado.isReprint = true;
                _this.pagoProcesado.printsQuantity++;
                _this.imprimirDocumentoDePago(callback);
            }, function (error) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                console.log("Error al imprimir el documento de pago debido a: " + error);
                notify("Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.");
            });
        }
        catch (e) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            console.log("Error al intentar imprimir el documento de pago debido a: " + e.message);
            notify("Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.");
        }
    };
    ConfirmacionDePagoControlador.prototype.enviarInformacionDeDetalleDePagos = function (callback) {
        var mensaje = new DetalleDeTipoDePagoMensaje(this);
        mensaje.detalleDePagosRealizados = new Array();
        this.mensajero.publish(mensaje, getType(DetalleDeTipoDePagoMensaje));
        callback();
    };
    ConfirmacionDePagoControlador.prototype.enviarInformacionDeClientePertenecienteAlPagoActual = function (callback) {
        var clienteMensaje = new ClienteMensaje(this);
        clienteMensaje.cliente = this.clienteProcesado;
        clienteMensaje.vistaCargandosePorPrimeraVez = true;
        clienteMensaje.tipoDePagoAProcesar = this.clienteProcesado.paymentType;
        this.mensajero.publish(clienteMensaje, getType(ClienteMensaje));
        callback();
    };
    ConfirmacionDePagoControlador.prototype.enviarSolicitudDeActualizacionDeInformacionDePagoActual = function () {
    };
    return ConfirmacionDePagoControlador;
}());
//# sourceMappingURL=ConfirmacionDePagoControlador.js.map