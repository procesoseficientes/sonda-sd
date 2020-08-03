var ListaDePagoControlador = (function () {
    function ListaDePagoControlador(mensajero) {
        this.mensajero = mensajero;
        this.pagoServicio = new PagoServicio();
        this.documentosDePago = [];
        this.decimalesServicio = new ManejoDeDecimalesServicio();
    }
    ListaDePagoControlador.prototype.delegarListaDePagoControlador = function () {
        var _this_1 = this;
        $("#UiBtnShowPaymentsList").on("click", function (e) {
            e.preventDefault();
            _this_1.irAPantalla("UiPaymentListPage");
        });
        $("#UiPaymentListPage").on("pageshow", function (e) {
            e.preventDefault();
            _this_1.cargarDatosPrincipales();
        });
        $("#UiBtnBackFromPaymentListPage").on("click", function (e) {
            e.preventDefault();
            _this_1.irAPantalla("menu_page");
        });
        $("#UiBtnRefreshPaymentsList").on("click", function (e) {
            e.preventDefault();
            _this_1.cargarDatosPrincipales();
        });
        $("#UiPaymentListPage").on("click", "#UiPaymentsList a", function (e) {
            e.preventDefault();
            var id = e.currentTarget.id;
            if (id) {
                _this_1.mostrarOpcionesDeDocumentoDePagoSeleccionado(parseInt(id));
            }
        });
    };
    ListaDePagoControlador.prototype.irAPantalla = function (pantalla) {
        $.mobile.changePage("#" + pantalla, {
            transition: "pop",
            reverse: false,
            changeHash: false,
            showLoadMsg: false
        });
    };
    ListaDePagoControlador.prototype.restablecerFiltroPrincipal = function () {
        var filtroDeListado = $("#UiTxtPaymentFilter");
        filtroDeListado.val("");
        filtroDeListado.focus();
        filtroDeListado = null;
    };
    ListaDePagoControlador.prototype.cargarDatosPrincipales = function () {
        var _this_1 = this;
        this.simboloDeMoneda = localStorage.getItem("CURRENCY_SYMBOL") || "Q";
        this.documentosDePago.length = 0;
        InteraccionConUsuarioServicio.bloquearPantalla();
        this.restablecerFiltroPrincipal();
        this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
            _this_1.configuracionDeDecimales = decimales;
            _this_1.pagoServicio
                .obtenerEncabezadoDeDocumentosDePagoParaReporte(function (documentos) {
                _this_1.documentosDePago = documentos;
                _this_1.construirListadoDeRecibosEmitidos(_this_1.documentosDePago, function () {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                });
            }, function (resultado) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify(resultado.mensaje);
            });
        });
    };
    ListaDePagoControlador.prototype.construirListadoDeRecibosEmitidos = function (documentosDePago, callback) {
        var _this_1 = this;
        try {
            var contenedorDeListadoDeDocumentosDePago = $("#UiPaymentsList");
            contenedorDeListadoDeDocumentosDePago.children().remove("li");
            var etiquetaDeMontoTotalEnPagos = $("#UiLblTotalAmountOfPayments");
            var montoTotalEnPagos_1 = 0;
            var cadenaHtmlDeDocumentosDePago_1 = [];
            documentosDePago.forEach(function (pago) {
                montoTotalEnPagos_1 += pago.paymentAmount;
                cadenaHtmlDeDocumentosDePago_1.push(" <li data-filtertext=\"" + pago.codeCustomer + " " + pago
                    .nameCustomer + " " + pago.docNum + "\" data-icon=\"false\">");
                cadenaHtmlDeDocumentosDePago_1.push(" <a href=\"#\" id=\"" + pago.docNum + "\">");
                cadenaHtmlDeDocumentosDePago_1.push(" <label>No. " + pago.docNum + " </label>");
                cadenaHtmlDeDocumentosDePago_1.push(" <label>" + pago.codeCustomer + " </label>");
                cadenaHtmlDeDocumentosDePago_1.push(" <label>" + pago.nameCustomer + " </label>");
                cadenaHtmlDeDocumentosDePago_1.push(" <span class=\"ui-li-count\">" + _this_1
                    .simboloDeMoneda + ". " + format_number(pago.paymentAmount, _this_1.configuracionDeDecimales.defaultDisplayDecimals) + "</span>");
                cadenaHtmlDeDocumentosDePago_1.push(" </a>");
                cadenaHtmlDeDocumentosDePago_1.push(" </li>");
            });
            var listadoDePagos = cadenaHtmlDeDocumentosDePago_1.join("");
            if (listadoDePagos !== "") {
                contenedorDeListadoDeDocumentosDePago.append(listadoDePagos);
                contenedorDeListadoDeDocumentosDePago.listview("refresh");
            }
            etiquetaDeMontoTotalEnPagos.text(this
                .simboloDeMoneda + " " + format_number(montoTotalEnPagos_1, this.configuracionDeDecimales.defaultDisplayDecimals));
            etiquetaDeMontoTotalEnPagos = null;
        }
        catch (e) {
            console
                .log("Ha ocurrido un error al crear el listado de documentos de pago, por favor, vuelva a intentar. " + e
                .message);
            notify("Ha ocurrido un error al crear el listado de documentos de pago, por favor, vuelva a intentar.");
        }
        callback();
    };
    ListaDePagoControlador.prototype.mostrarOpcionesDeDocumentoDePagoSeleccionado = function (numeroDeDocumento) {
        var _this_1 = this;
        try {
            var configuracionDeOpciones = {
                title: "Seleccione una opción:",
                items: [
                    { text: "Reimprimir", value: OpcionDisponibleParaDocumentoDePagoSeleccionado.Reimprimir },
                    { text: "Ver Detalle", value: OpcionDisponibleParaDocumentoDePagoSeleccionado.VerDetalle }
                ],
                doneButtonLabel: "Aceptar",
                cancelButtonLabel: "Cancelar"
            };
            var pagoSeleccionado_1 = this.documentosDePago
                .find(function (pago) {
                return pago.docNum === numeroDeDocumento;
            });
            if (pagoSeleccionado_1) {
                window.plugins.listpicker.showPicker(configuracionDeOpciones, function (opcionSeleccionada) {
                    switch (opcionSeleccionada) {
                        case OpcionDisponibleParaDocumentoDePagoSeleccionado.Reimprimir:
                            InteraccionConUsuarioServicio.bloquearPantalla();
                            _this_1.imprimirDocumentoDePagoSeleccionado(pagoSeleccionado_1);
                            break;
                        case OpcionDisponibleParaDocumentoDePagoSeleccionado.VerDetalle:
                            InteraccionConUsuarioServicio.bloquearPantalla();
                            _this_1.verDetalleDeDocumentoDePagoSeleccionado(pagoSeleccionado_1, function () {
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                                _this_1.irAPantalla("UiPaymentDetailPage");
                            });
                            break;
                    }
                });
            }
            else {
                throw new Error("No se encontro el documento de pago seleccionado.");
            }
        }
        catch (e) {
            console
                .log("Lo sentimos, ha ocurrido un error al intentar mostrar las opciones disponibles para el documento seleccionado, por favor, vuelva a intentar. " + e.message);
            notify("Lo sentimos, ha ocurrido un error al intentar mostrar las opciones disponibles para el documento seleccionado, por favor, vuelva a intentar.");
        }
    };
    ListaDePagoControlador.prototype.imprimirDocumentoDePagoSeleccionado = function (pago) {
        var _this_1 = this;
        this.pagoServicio
            .obtenerInformacionDeSecuenciaDeDocumentoDePago(function (secuencia) {
            pago.branchName = secuencia.nombreSucursal;
            pago.branchAddress = secuencia.direccionSucursal;
            pago.reprint = true;
            _this_1.pagoServicio.imprimirPago(pago, function () {
                pago.isReprint = true;
                _this_1.pagoServicio.imprimirPago(pago, function () {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                }, function (error) {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    console.log("Error al imprimir el documento de pago debido a: " + error);
                    notify("Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.");
                });
            }, function (error) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                console.log("Error al imprimir el documento de pago debido a: " + error);
                notify("Ha ocurrido un error al imprimir el documento de pago, por favor vuelva a intentar.");
            });
        }, function (resultado) {
            console
                .log("Lo sentimos ha ocurrido un error al obtener los datos necesarios para la impresi\u00F3n del documento seleccionado, por favor, vuelva a intentar. " + resultado.mensaje);
            notify("Lo sentimos ha ocurrido un error al obtener los datos necesarios para la impresi\u00F3n del documento seleccionado, por favor, vuelva a intentar.");
        });
    };
    ListaDePagoControlador.prototype.verDetalleDeDocumentoDePagoSeleccionado = function (pago, callback) {
        var mensaje = new PagoMensaje(this);
        mensaje.pago = pago;
        mensaje.configuracionDeDecimales = this.configuracionDeDecimales;
        mensaje.simboloDeMoneda = this.simboloDeMoneda;
        this.mensajero.publish(mensaje, getType(PagoMensaje));
        callback();
    };
    return ListaDePagoControlador;
}());
//# sourceMappingURL=ListaDePagoControlador.js.map