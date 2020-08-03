var CobroDeFacturaVencidaControlador = (function () {
    function CobroDeFacturaVencidaControlador(mensajero) {
        this.mensajero = mensajero;
        this.cuentaCorrienteServicio = new CuentaCorrienteServicio();
        this.pagoServicio = new PagoServicio();
        this.cliente = new Cliente();
        this.sumatoriaTotalPendienteDePagoDeFacturasVencidas = 0;
        this.facturasCubiertasPorElPagoActual = [];
        this.aplicaPorcentajeMinimoDePagoDeFacturasVencidas = false;
        this.valorDeParametroDePorcentajeMinimoDePagoDeFacturasVencidas = 0;
        this.porcentajeDePagoDeFacturasVencidasCubiertoPorElPagoActual = 0;
        this.detalleDeTiposDePagoRealizadosEnElDocumentoAcutal = [];
        this.vistaCargandosePorPrimeraVez = true;
        this.montoCubiertoPorUltimoPagoProcesado = 0;
        this.tokenCliente = mensajero.subscribe(this.clienteEntregado, getType(ClienteMensaje), this);
        this.tokenDetalleDeTiposDePagoRealizados = mensajero.subscribe(this.detalleDeTiposDePagosEntregados, getType(DetalleDeTipoDePagoMensaje), this);
        this.tokenActualizacionDeInformacionDePagoDeFacturasVencidas = mensajero.subscribe(this.actualizacionDeInformacionDePagoDeFacturasVencidasEntregado, getType(ActualizacionDeInformacionDePagoDeFacturasVencidasMensaje), this);
    }
    CobroDeFacturaVencidaControlador.prototype.actualizacionDeInformacionDePagoDeFacturasVencidasEntregado = function (message, subscriber) {
        subscriber.montoCubiertoPorUltimoPagoProcesado =
            message.montoCubiertoPorUltimoPagoProcesado;
    };
    CobroDeFacturaVencidaControlador.prototype.clienteEntregado = function (message, subscriber) {
        subscriber.cliente = message.cliente;
        subscriber.vistaCargandosePorPrimeraVez =
            message.vistaCargandosePorPrimeraVez;
        subscriber.cargarVistaParaPagoDeFacturas = message.tipoDePagoAProcesar;
        subscriber.tipoDePagoParaFacturasProcesadas = message.tipoDePagoAProcesar;
        var pageTitle = $("#UiLblOverdueInvoicePaymentPageTitle");
        pageTitle.text("Pago de Facturas " + (message.tipoDePagoAProcesar === TipoDePagoDeFactura.FacturaVencida
            ? "Vencidas"
            : "Abiertas"));
        pageTitle = null;
    };
    CobroDeFacturaVencidaControlador.prototype.delegarCobroDeFacturaVencidaControlador = function () {
        var _this_1 = this;
        var este = this;
        $("#UiOverdueInvoicePaymentPage").on("pageshow", function () {
            try {
                _this_1.sumatoriaTotalPendienteDePagoDeFacturasVencidas = 0;
                _this_1.valorDeParametroDePorcentajeMinimoDePagoDeFacturasVencidas = 0;
                _this_1.porcentajeDePagoDeFacturasVencidasCubiertoPorElPagoActual = 0;
                _this_1.cliente.paymentType = _this_1.tipoDePagoParaFacturasProcesadas;
                tipoDePagoProcesadoEnCobroDeFacturasVencidas = _this_1
                    .tipoDePagoParaFacturasProcesadas;
                _this_1.cuentaCorrienteServicio.obtenerFacturasVencidasDeCliente(_this_1.cliente, function (facturasVencidas) {
                    _this_1.cliente.overdueInvoices = facturasVencidas;
                    _this_1.cuentaCorrienteServicio.obtenerSumatoriaDePagosRealizadosPorClienteDuranteElDia(_this_1.cliente, function (clienteConInformacionCompleta) {
                        _this_1.cliente = clienteConInformacionCompleta;
                        if (_this_1.cliente.paymentType ===
                            TipoDePagoDeFactura.FacturaAbierta) {
                            _this_1.cliente.totalAmountPayedOfOverdueInvoices = _this_1.montoCubiertoPorUltimoPagoProcesado;
                        }
                        _this_1.crearListadoDeFacturasVencidasDeCliente(function () {
                            _this_1.actualizarPorcentajeCubiertoPorPagoActual();
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            if (_this_1.vistaCargandosePorPrimeraVez)
                                _this_1.verificarSiYaSeAlcanzoElPorcentajeMinimoDePagoDeFacturasVencidas();
                        });
                    }, function (resultado) {
                        console.log("Error al obtener las facturas vencidas del cliente debido a: " + resultado.mensaje);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify("Lo sentimos, ha habido un error al obtener la sumatoria de pagos realizados por el cliente " + _this_1.cliente.clientId);
                    });
                }, function (resultado) {
                    console.log("Error al obtener las facturas vencidas del cliente debido a: " + resultado.mensaje);
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("Lo sentimos, ha habido un error al obtener las facturas vencidas de cliente " + _this_1.cliente.clientId);
                });
            }
            catch (e) {
                notify("Error al cargar los datos iniciales del proceso, por favor, vuelva a intentar.");
            }
        });
        $("#UiLblPercentageOfOverdueInvoicesPayment").on("click", function () {
            _this_1.obtenerAutorizacionDeUsuarioParaProcesarPago(function () {
                _this_1.procesarCobroDeFacturas();
            });
        });
        $("#UiBtnShowPaymentTypeDetailPage").on("click", function (e) {
            e.preventDefault();
            _this_1.enviarInformacionDeDetalleDePagos(function () {
                _this_1.irAPantalla("UiOverdueInvoicePaymentDetailPage");
            });
        });
        $("#UiBtnGoBackFromOverdueInvoicePaymentPage").on("click", function (e) {
            e.preventDefault();
            _this_1.irAPantallaDeCliente();
        });
    };
    CobroDeFacturaVencidaControlador.prototype.irAPantalla = function (pantalla) {
        $.mobile.changePage("#" + pantalla, {
            transition: "pop",
            reverse: false,
            changeHash: false,
            showLoadMsg: false
        });
    };
    CobroDeFacturaVencidaControlador.prototype.crearListadoDeFacturasVencidasDeCliente = function (callback) {
        var _this_1 = this;
        var contenedorDeFacturasVencidasDeCliente = $("#UlDetailOverdueInvoices");
        var etiquetaDeSumaTotalDeFacturasVencidas = $("#UiLblOverdueInvoicesAmount");
        var campoComentarioDePago = $("#UiTxtPaidComment");
        var campoDeMontoDePago = $("#UiLblPayedAmount");
        var etiquetaDePorcentajeDePagoMinimo = $("#UiLblMinimumPaidPercentaje");
        campoDeMontoDePago.text("" + window.accounting.formatMoney(this.obtenerMontoIngresadoEnCampoDePago()));
        campoComentarioDePago.val("");
        this.actualizarPorcentajeCubiertoPorPagoActual();
        contenedorDeFacturasVencidasDeCliente.children().remove("li");
        var htmlDeFacturasVencidas = [];
        this.cliente.overdueInvoices.forEach(function (facturaVencida) {
            _this_1.sumatoriaTotalPendienteDePagoDeFacturasVencidas +=
                facturaVencida.pendingToPaid;
            htmlDeFacturasVencidas.push(_this_1.obtenerFormatoHtmlDeObjetoFactura(facturaVencida));
        });
        etiquetaDeSumaTotalDeFacturasVencidas.text(window.accounting.formatMoney(this.sumatoriaTotalPendienteDePagoDeFacturasVencidas));
        if (htmlDeFacturasVencidas.length > 0) {
            contenedorDeFacturasVencidasDeCliente.append(htmlDeFacturasVencidas.join(""));
            contenedorDeFacturasVencidasDeCliente.listview("refresh");
        }
        contenedorDeFacturasVencidasDeCliente = null;
        etiquetaDeSumaTotalDeFacturasVencidas = null;
        campoDeMontoDePago = null;
        campoComentarioDePago = null;
        this.verificarSiAplicaPorcentajeMinimoDePago(function (aplicaPorcentajeMinimoDePago, valorDePorcentajeMinimoDePago) {
            _this_1.aplicaPorcentajeMinimoDePagoDeFacturasVencidas = aplicaPorcentajeMinimoDePago;
            _this_1.valorDeParametroDePorcentajeMinimoDePagoDeFacturasVencidas =
                valorDePorcentajeMinimoDePago > 100
                    ? 100
                    : valorDePorcentajeMinimoDePago;
            etiquetaDePorcentajeDePagoMinimo.text(_this_1.valorDeParametroDePorcentajeMinimoDePagoDeFacturasVencidas.toString());
            callback();
        });
    };
    CobroDeFacturaVencidaControlador.prototype.verificarSiAplicaPorcentajeMinimoDePago = function (callback) {
        var _this_1 = this;
        try {
            this.pagoServicio.obtenerParametroDePorcentajeDePagoMinimoDeFacturasVencidas(GrupoParametro.Factura.toString(), TipoDeParametro.PorcentajeMinimoDePagoDeFacturasVencidas.toString(), function (aplicaParametro, valorDeParametro) {
                var porcentajeMinimoAAplicar = _this_1.cliente.paymentType === TipoDePagoDeFactura.FacturaVencida
                    ? valorDeParametro
                    : _this_1.obtenerPorcentajeMinimoDePagoEnBaseAFacturasAbiertas(_this_1.cliente);
                callback(aplicaParametro, porcentajeMinimoAAplicar);
            }, function (resultado) {
                console.log(resultado.mensaje);
                notify("Lo sentimos, ha ocurrido un error al validar si se aplica el porcentaje m\u00EDnimo de pago de facturas vencidas, por favor vuelva a intentar.");
                callback(false, 0);
            });
        }
        catch (e) {
            console.log("Ha ocurrido un error al intentar obtener el par\u00E1metro de porcentaje m\u00EDnimo de pago de facturas vencidas debido a: " + e.message);
            notify("Lo sentimos, ha ocurrido un error al validar si se aplica el porcentaje m\u00EDnimo de pago de facturas vencidas, por favor vuelva a intentar.");
            callback(false, 0);
        }
    };
    CobroDeFacturaVencidaControlador.prototype.obtenerPorcentajeMinimoDePagoEnBaseAFacturasAbiertas = function (cliente) {
        var porcentaje = 0;
        if (cliente.totalAmountOfOpenInvoices <= 0) {
            return porcentaje;
        }
        porcentaje =
            (cliente.totalAmountOfOpenInvoices +
                (cliente.cashAmount + cliente.creditAmount) -
                cliente.currentAccountingInformation.creditLimit) /
                (cliente.totalAmountOfOpenInvoices -
                    cliente.currentAccountingInformation.currentAmountOnCredit);
        return Math.ceil(porcentaje * 100);
    };
    CobroDeFacturaVencidaControlador.prototype.obtenerFormatoHtmlDeObjetoFactura = function (facturaVencida) {
        var html = [];
        html.push("<li class=\"ui-field-contain\" data-count-theme=\"b\">");
        html.push("<table>");
        html.push("<tr>");
        html.push("<td>");
        html.push("<p><b>Factura: </b>" + facturaVencida.invoiceId + "</p>");
        html.push("<p><b>Creada: </b>" + facturaVencida.createdDate.toString().split(" ")[0] + " </p>");
        html.push("<p><b>Vencimiento: </b>" + facturaVencida.dueDate.toString().split(" ")[0] + " </p>");
        html.push("<p><b>Facturado: </b>" + window.accounting.formatMoney(facturaVencida.totalAmount) + " </p>");
        html.push("</td>");
        html.push("<td>");
        html.push("<span class=\"ui-li-count\">" + window.accounting.formatMoney(facturaVencida.pendingToPaid) + " </span>");
        html.push("</td>");
        html.push("</tr>");
        html.push("</table>");
        html.push("</li>");
        return html.join("");
    };
    CobroDeFacturaVencidaControlador.prototype.actualizarPorcentajeCubiertoPorPagoActual = function () {
        var etiquetaDePorcentajeDePagoCubierto = $("#UiLblPercentageOfOverdueInvoicesPayment");
        var valorDePorcentaje = window.accounting.unformat(window.accounting.formatNumber(this.obtenerPorcentajeDePagoCubiertoEnElPagoActual()));
        etiquetaDePorcentajeDePagoCubierto.text(valorDePorcentaje + "%");
        this.porcentajeDePagoDeFacturasVencidasCubiertoPorElPagoActual = valorDePorcentaje;
        if (this.aplicaPorcentajeMinimoDePagoDeFacturasVencidas) {
            if (valorDePorcentaje >=
                this.valorDeParametroDePorcentajeMinimoDePagoDeFacturasVencidas) {
                etiquetaDePorcentajeDePagoCubierto.css("color", "#4cff00");
            }
            else {
                etiquetaDePorcentajeDePagoCubierto.css("color", "#d64161");
            }
        }
        else {
            etiquetaDePorcentajeDePagoCubierto.css("color", "#4cff00");
        }
        etiquetaDePorcentajeDePagoCubierto = null;
    };
    CobroDeFacturaVencidaControlador.prototype.obtenerPorcentajeDePagoCubiertoEnElPagoActual = function () {
        var montoDePago = this.obtenerMontoIngresadoEnCampoDePago();
        if (this.sumatoriaTotalPendienteDePagoDeFacturasVencidas <= 0)
            return 0;
        var porcentajeDePagoCubierto = 0;
        porcentajeDePagoCubierto =
            ((this.cliente.totalAmountPayedOfOverdueInvoices + montoDePago) /
                (this.cliente.totalAmountPayedOfOverdueInvoices +
                    this.sumatoriaTotalPendienteDePagoDeFacturasVencidas)) *
                100;
        return porcentajeDePagoCubierto > 100 ? 100 : porcentajeDePagoCubierto;
    };
    CobroDeFacturaVencidaControlador.prototype.obtenerMontoIngresadoEnCampoDePago = function () {
        var montoDePago = 0;
        this.detalleDeTiposDePagoRealizadosEnElDocumentoAcutal.forEach(function (pago) {
            montoDePago += pago.amount;
        });
        return montoDePago;
    };
    CobroDeFacturaVencidaControlador.prototype.obtenerAutorizacionDeUsuarioParaProcesarPago = function (callback) {
        navigator.notification.confirm("¿Está seguro de procesar el pago actual?", function (buttonIndex) {
            if (buttonIndex === BotonSeleccionado.Si) {
                InteraccionConUsuarioServicio.bloquearPantalla();
                callback();
            }
        }, "Sonda\u00AE SD " + SondaVersion, ["No", "Si"]);
    };
    CobroDeFacturaVencidaControlador.prototype.procesarCobroDeFacturas = function () {
        var _this_1 = this;
        try {
            var montoDePago_1 = this.obtenerMontoIngresadoEnCampoDePago();
            if (montoDePago_1 === 0) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("Por favor, ingrese un monto v\u00E1lido.");
            }
            else {
                if (montoDePago_1 > this.sumatoriaTotalPendienteDePagoDeFacturasVencidas)
                    montoDePago_1 = this.sumatoriaTotalPendienteDePagoDeFacturasVencidas;
                this.obtenerFacturasParaDetalleDePago(montoDePago_1, function () {
                    _this_1.prepararPago(montoDePago_1, function (documentoDePago) {
                        _this_1.montoCubiertoPorUltimoPagoProcesado =
                            documentoDePago.paymentAmount;
                        _this_1.pagoServicio.guardarDocumentoDePago(documentoDePago, function () {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            _this_1.publicarCobroProcesado(documentoDePago, function () {
                                _this_1.irAPantalla("UiPaymentConfirmationPage");
                            });
                        }, function (resultado) {
                            console.log("Error al guardar el documento de pago despues de procesarlo debido a: " + resultado.mensaje);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            notify("Lo sentimos, ha ocurrido un error al guardar el documento de pago, por favor, vuelva a intentar.");
                        });
                    });
                });
            }
        }
        catch (e) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            console.log("Error al procesar las facturas para el pago actual debido a: " + e.message);
            notify("Lo sentimos ha ocurrido un error al procesar las facturas para el pago actual, por favor, vuelva a intentar.");
        }
    };
    CobroDeFacturaVencidaControlador.prototype.obtenerFacturasParaDetalleDePago = function (montoDePago, callbak) {
        var _this_1 = this;
        var montoDePagoDisponible = montoDePago;
        this.facturasCubiertasPorElPagoActual.length = 0;
        var facturasOrdenadas = this.cliente.overdueInvoices.sort(function (a, b) {
            return a.dueDate.toString().localeCompare(b.dueDate.toString());
        });
        facturasOrdenadas.forEach(function (facturaVencida) {
            if (facturaVencida.pendingToPaid <= montoDePagoDisponible) {
                facturaVencida.payedAmount = facturaVencida.pendingToPaid;
                facturaVencida.pendingToPaid = 0;
                _this_1.facturasCubiertasPorElPagoActual.push(facturaVencida);
                montoDePagoDisponible -= facturaVencida.payedAmount;
            }
            else if (montoDePagoDisponible > 0) {
                facturaVencida.payedAmount = montoDePagoDisponible;
                facturaVencida.pendingToPaid =
                    facturaVencida.pendingToPaid - facturaVencida.payedAmount;
                _this_1.facturasCubiertasPorElPagoActual.push(facturaVencida);
                montoDePagoDisponible -= facturaVencida.payedAmount;
            }
        });
        callbak();
    };
    CobroDeFacturaVencidaControlador.prototype.prepararPago = function (montoDePago, callback) {
        var _this_1 = this;
        var documentoDePago = new PagoDeFacturaVencidaEncabezado();
        documentoDePago.paymentAmount = montoDePago;
        PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.PagoDeFacturaVencida, function (secuenciaValida) {
            if (secuenciaValida) {
                _this_1.pagoServicio.obtenerSecuenciaDeDocumentoDePago(function (secuenciaDeDocumentos) {
                    documentoDePago.docNum = secuenciaDeDocumentos.numero;
                    documentoDePago.docSerie = secuenciaDeDocumentos.serie;
                    documentoDePago.branchName = secuenciaDeDocumentos.nombreSucursal;
                    documentoDePago.branchAddress =
                        secuenciaDeDocumentos.direccionSucursal;
                    documentoDePago.codeCustomer = _this_1.cliente.clientId;
                    documentoDePago.codeRoute = gCurrentRoute;
                    documentoDePago.isPosted = SiNo.No;
                    documentoDePago.loginId = gLastLogin;
                    documentoDePago.createdDate = getDateTime();
                    documentoDePago.validateMinimumPercentOfPaid = _this_1.aplicaPorcentajeMinimoDePagoDeFacturasVencidas;
                    documentoDePago.minimumPercentOfPaid = _this_1.valorDeParametroDePorcentajeMinimoDePagoDeFacturasVencidas;
                    documentoDePago.percentCoveredWhitThePaid = _this_1.porcentajeDePagoDeFacturasVencidasCubiertoPorElPagoActual;
                    documentoDePago.paidComment = _this_1.obtenerComentarioDePago();
                    documentoDePago.paymentType = _this_1.tipoDePagoParaFacturasProcesadas;
                    _this_1.facturasCubiertasPorElPagoActual.forEach(function (facturaVencida) {
                        var pagoDefacturaDetalle = new PagoDeFacturaVencidaDetalle();
                        pagoDefacturaDetalle.docNum = documentoDePago.docNum;
                        pagoDefacturaDetalle.docSerie = documentoDePago.docSerie;
                        pagoDefacturaDetalle.invoiceId = facturaVencida.invoiceId;
                        pagoDefacturaDetalle.docEntry = facturaVencida.docEntry;
                        pagoDefacturaDetalle.payedAmount = facturaVencida.payedAmount;
                        documentoDePago.overdueInvoicePaymentDetail.push(pagoDefacturaDetalle);
                    });
                    _this_1.detalleDeTiposDePagoRealizadosEnElDocumentoAcutal.forEach(function (tipoDePago) {
                        tipoDePago.docSerie = documentoDePago.docSerie;
                        tipoDePago.docNum = documentoDePago.docNum;
                        documentoDePago.overdueInvoicePaymentTypeDetail.push(tipoDePago);
                    });
                    callback(documentoDePago);
                }, function (resultado) {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    console.log(resultado.mensaje);
                    if (resultado.codigo === -1) {
                        notify(resultado.mensaje);
                    }
                    else {
                        notify("Ha ocurrido un error al obtener la secuencia de documentos de pago, por favor, vuelva a intentar.");
                    }
                });
            }
            else {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("No cuenta con una secuencia de documentos v\u00E1lida para procesar el cobro, por favor, comun\u00EDquese con su administrador.");
            }
        }, function (error) {
            console.log("Error al validar la secuencia de documentos de pago de facturas vencidas: " + error);
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Ha ocurrido un error al validar la secuencia de documentos.");
        });
    };
    CobroDeFacturaVencidaControlador.prototype.publicarCobroProcesado = function (pagoProcesado, callback) {
        var pagoMensaje = new PagoMensaje(this);
        pagoMensaje.pago = pagoProcesado;
        pagoMensaje.cliente = this.cliente;
        this.mensajero.publish(pagoMensaje, getType(PagoMensaje));
        callback();
    };
    CobroDeFacturaVencidaControlador.prototype.obtenerComentarioDePago = function () {
        var campoComentario = $("#UiTxtPaidComment");
        return campoComentario.val() ? campoComentario.val() : "";
    };
    CobroDeFacturaVencidaControlador.prototype.verificarSiYaSeAlcanzoElPorcentajeMinimoDePagoDeFacturasVencidas = function () {
        if (this.aplicaPorcentajeMinimoDePagoDeFacturasVencidas) {
            if (this.porcentajeDePagoDeFacturasVencidasCubiertoPorElPagoActual >=
                this.valorDeParametroDePorcentajeMinimoDePagoDeFacturasVencidas) {
                if (this.cliente.paymentType === TipoDePagoDeFactura.FacturaVencida) {
                    ShowSkusToPOS();
                    notify("Porcentaje de pago m\u00EDnimo alcanzado, puede seguir facturando.");
                }
                else {
                    ShorSummaryPage();
                    notify("Porcentaje de pago m\u00EDnimo alcanzado, puede continuar.");
                }
            }
        }
    };
    CobroDeFacturaVencidaControlador.prototype.detalleDeTiposDePagosEntregados = function (message, subscriber) {
        subscriber.vistaCargandosePorPrimeraVez = false;
        subscriber.detalleDeTiposDePagoRealizadosEnElDocumentoAcutal =
            message.detalleDePagosRealizados;
    };
    CobroDeFacturaVencidaControlador.prototype.enviarInformacionDeDetalleDePagos = function (callback) {
        var mensaje = new DetalleDeTipoDePagoMensaje(this);
        mensaje.detalleDePagosRealizados = this.detalleDeTiposDePagoRealizadosEnElDocumentoAcutal;
        this.mensajero.publish(mensaje, getType(DetalleDeTipoDePagoMensaje));
        callback();
    };
    CobroDeFacturaVencidaControlador.prototype.irAPantallaDeCliente = function () {
        var _this_1 = this;
        this.detalleDeTiposDePagoRealizadosEnElDocumentoAcutal.length = 0;
        this.vistaCargandosePorPrimeraVez = true;
        this.montoCubiertoPorUltimoPagoProcesado = 0;
        this.enviarInformacionDeDetalleDePagos(function () {
            if (tipoDePagoProcesadoEnCobroDeFacturasVencidas ===
                TipoDePagoDeFactura.FacturaVencida) {
                _this_1.irAPantalla("pos_client_page");
            }
            else {
                ShorSummaryPage();
            }
        });
    };
    return CobroDeFacturaVencidaControlador;
}());
//# sourceMappingURL=CobroDeFacturaVencidaControlador.js.map