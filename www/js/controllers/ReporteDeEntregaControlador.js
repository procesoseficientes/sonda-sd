var ReporteDeEntregaControlador = (function () {
    function ReporteDeEntregaControlador(mensajero) {
        this.mensajero = mensajero;
        this.reporteDeEntregaServicio = new ReporteDeEntregasServicio();
        this.entregaServicio = new EntregaServicio();
        this.listadoDeEntregasParaReporte = {
            entregasProcesadas: new Array(),
            entregasPendientes: new Array(),
            entregasCanceladas: new Array()
        };
        this.manejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
    }
    ReporteDeEntregaControlador.prototype.delegarReporteDeEntregaControlador = function () {
        var _this = this;
        $("#UiDeliveryReportPage").on("pageshow", function () {
            _this.manejoDeDecimalesServicio
                .obtenerInformacionDeManejoDeDecimales(function (configuracionDeDecimales) {
                _this.configuracionDeDecimales = configuracionDeDecimales;
                _this.simboloDeMoneda = localStorage.getItem("CURRENCY_SYMBOL")
                    ? localStorage.getItem("CURRENCY_SYMBOL")
                    : "Q";
                _this.usuarioFacturaEnRuta = localStorage.getItem("INVOICE_IN_ROUTE")
                    ? localStorage.getItem("INVOICE_IN_ROUTE") == "1"
                    : false;
                _this.obtenerListasDeEntregas();
            });
        });
        $("#UiBtnBackFromDeliveryReport").on("click", function () {
            _this.irAPantalla("menu_page");
        });
        $("#UiDeliveryReportPage").on("click", "#UiContEntregasProcesadas a", function (e) {
            var identificadorDeNotaDeEntrega = e.currentTarget.attributes["id"].nodeValue;
            _this.usuarioDeseaAnularEntrega(identificadorDeNotaDeEntrega);
        });
    };
    ReporteDeEntregaControlador.prototype.irAPantalla = function (pantalla) {
        $.mobile.changePage("#" + pantalla, {
            transition: "none",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };
    ReporteDeEntregaControlador.prototype.obtenerListasDeEntregas = function () {
        var _this = this;
        try {
            this.limpiarObjetosDeListadoDeEntregas(function () {
                _this.reporteDeEntregaServicio
                    .obtenerEntregasProcesadas(function (entregasProcesadas) {
                    _this.listadoDeEntregasParaReporte.entregasProcesadas = entregasProcesadas;
                    _this.reporteDeEntregaServicio
                        .obtenerEntregasPendientes(function (entregasPendientes) {
                        _this.listadoDeEntregasParaReporte.entregasPendientes = entregasPendientes;
                        _this.reporteDeEntregaServicio
                            .obtenerEntregasCanceladas(function (entregasCanceladas) {
                            _this.listadoDeEntregasParaReporte
                                .entregasCanceladas = entregasCanceladas;
                            _this.generarListadoDeEntregas();
                        }, function (resultado) {
                            notify(resultado.mensaje);
                        });
                    }, function (resultado) {
                        notify(resultado.mensaje);
                    });
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            });
        }
        catch (e) {
            notify("Error al procesar el reporte de entregas debido a: " + e.message);
        }
    };
    ReporteDeEntregaControlador.prototype.limpiarObjetosDeListadoDeEntregas = function (callback) {
        try {
            var lblCantidadEntregasProcesadas = $("#UiLblCantidadEntregasProcesadas");
            var detalleEntregasProcesadas = $("#UiDetalleEntregasProcesadas");
            var lblCantidadEntregasPendientes = $("#UiLblCantidadEntregasPendientes");
            var detalleEntregasPendientes = $("#UiDetalleEntregasPendientes");
            var lblCantidadEntregasNoProcesadas = $("#UiLblCantidadEntregasNoProcesadas");
            var detalleEntregasNoProcesadas = $("#UiDetalleEntregasNoProcesadas");
            lblCantidadEntregasProcesadas.text("0");
            detalleEntregasProcesadas.children().remove("li");
            lblCantidadEntregasPendientes.text("0");
            detalleEntregasPendientes.children().remove("li");
            lblCantidadEntregasNoProcesadas.text("0");
            detalleEntregasNoProcesadas.children().remove("li");
            lblCantidadEntregasProcesadas = null;
            detalleEntregasProcesadas = null;
            lblCantidadEntregasPendientes = null;
            detalleEntregasPendientes = null;
            lblCantidadEntregasNoProcesadas = null;
            detalleEntregasNoProcesadas = null;
            callback();
        }
        catch (e) {
            notify("Error al limpiar los listados de entregas debido a: " + e.message);
        }
    };
    ReporteDeEntregaControlador.prototype.generarListadoDeEntregas = function () {
        var _this = this;
        try {
            var lblCantidadEntregasProcesadas = $("#UiLblCantidadEntregasProcesadas");
            var lblCantidadEntregasPendientes = $("#UiLblCantidadEntregasPendientes");
            var lblCantidadEntregasNoProcesadas = $("#UiLblCantidadEntregasNoProcesadas");
            lblCantidadEntregasProcesadas.text(this.listadoDeEntregasParaReporte.entregasProcesadas.length);
            lblCantidadEntregasPendientes.text(this.listadoDeEntregasParaReporte.entregasPendientes.length);
            lblCantidadEntregasNoProcesadas.text(this.listadoDeEntregasParaReporte.entregasCanceladas.length);
            this.generarListadoDeEntregasProcesadas(this.listadoDeEntregasParaReporte.entregasProcesadas, function () {
                _this.generarListadoDeEntregasPendientes(_this.listadoDeEntregasParaReporte.entregasPendientes, function () {
                    _this.generarListadoDeEntregasCanceladas(_this.listadoDeEntregasParaReporte
                        .entregasCanceladas, function () {
                    });
                });
            });
            lblCantidadEntregasProcesadas = null;
            lblCantidadEntregasPendientes = null;
            lblCantidadEntregasNoProcesadas = null;
        }
        catch (e) {
            notify("Error al generar el listado de entregas debido a: " + e.message);
        }
    };
    ReporteDeEntregaControlador.prototype.generarListadoDeEntregasProcesadas = function (entregasProcesadas, callback) {
        var _this = this;
        var li = [];
        var detalleEntregasProcesadas = $("#UiDetalleEntregasProcesadas");
        try {
            entregasProcesadas.map(function (entrega) {
                li.push("<li style=\"border-bottom: 2px solid black;\">");
                li.push("<table style=\"width: 100%\" id=\"UiContEntregasProcesadas\">");
                li.push("<tr>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Entrega:</b> " + entrega.docNum + "</td>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Documento:</b> " + entrega
                    .pickingDemandHeaderId + "</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td colspan=\"2\">");
                li.push("<b>Cliente: </b> " + entrega.clientCode);
                li.push("</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td colspan=\"2\">");
                li.push("<b>Nombre: </b> " + entrega.clientName);
                li.push("</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Factura:</b> " + _this
                    .obtenerTextoAMostrarEnColumnaDeFactura(entrega) + "</td>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Monto:</b>" + _this.simboloDeMoneda + " " + format_number(trunc_number(entrega.totalAmount, _this.configuracionDeDecimales.defaultCalculationsDecimals), _this.configuracionDeDecimales.defaultDisplayDecimals) + "</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td colspan=\"2\"><b>Prod. Entregados: </b> " + format_number(entrega.qtyToDelivery, _this.configuracionDeDecimales.defaultDisplayDecimalsForSkuQty) + " ");
                if (entrega.isCanceled == SiNo.Si) {
                    li.push("<span style=\"color: red\">ANULADA <br/> " + entrega.reasonCancel + " </span>");
                }
                li.push("</td>");
                li.push("</tr>");
                if (!_this.usuarioFacturaEnRuta) {
                    li.push("<tr>");
                    li.push("<td colspan=\"2\">");
                    li.push("<a href=\"#\" id=\"" + entrega.docNum + "\" class=\"ui-btn ui-btn-b ui-corner-all\" style=\"text-align: center\">");
                    li.push("Anular");
                    li.push("</a>");
                    li.push("</td>");
                    li.push("</tr>");
                }
                li.push("</table>");
                li.push("</li>");
            });
            if (this.listaNoEstaVacia(li.join(""))) {
                detalleEntregasProcesadas.append(li.join(""));
                detalleEntregasProcesadas.trigger("refresh");
            }
            callback();
        }
        catch (e) {
            notify("No se ha podido generar el listado de entregas procesadas debido a: " + e.message);
        }
        finally {
            li = null;
            detalleEntregasProcesadas = null;
        }
    };
    ReporteDeEntregaControlador.prototype.obtenerTextoAMostrarEnColumnaDeFactura = function (entrega) {
        return entrega.invoiceId ? entrega.invoiceId.toString() : "N/A";
    };
    ReporteDeEntregaControlador.prototype.generarListadoDeEntregasPendientes = function (entregasPendientes, callback) {
        var _this = this;
        var li = [];
        var detalleEntregasPendientes = $("#UiDetalleEntregasPendientes");
        try {
            entregasPendientes.map(function (entregaPendiente) {
                li.push("<li style=\"border-bottom: 2px solid black;\">");
                li.push("<table style=\"width: 100%\">");
                li.push("<tr>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Documento:</b> " + entregaPendiente.docNum + "</td>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Cliente:</b> " + entregaPendiente.clientCode + "</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td colspan=\"2\"><b>Nombre: </b> " + entregaPendiente.clientName + "</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Factura:</b> N/A</td>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Monto:</b>" + _this
                    .simboloDeMoneda + " " + format_number(trunc_number(entregaPendiente.totalAmount, _this.configuracionDeDecimales.defaultCalculationsDecimals), _this.configuracionDeDecimales.defaultDisplayDecimals) + "</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td colspan=\"2\"><b>Prod. A Entregar: </b> " + format_number(entregaPendiente.qtyPending, _this.configuracionDeDecimales.defaultDisplayDecimalsForSkuQty) + " ");
                if (entregaPendiente.isCanceled == SiNo.Si) {
                    li.push("<span style=\"color: red\">ANULADA <br/> " + entregaPendiente.reasonCancel + " </span>");
                }
                li.push("</td>");
                li.push("</tr>");
                li.push("</table>");
                li.push("</li>");
            });
            if (this.listaNoEstaVacia(li.join(""))) {
                detalleEntregasPendientes.append(li.join(""));
                detalleEntregasPendientes.trigger("refresh");
            }
            callback();
        }
        catch (e) {
            notify("Error al generar el listado de entregas pendientes debido a: " + e.message);
        }
        finally {
            li = null;
            detalleEntregasPendientes = null;
        }
    };
    ReporteDeEntregaControlador.prototype.generarListadoDeEntregasCanceladas = function (entregasCanceladas, callback) {
        var _this = this;
        var li = [];
        var detalleEntregasNoProcesadas = $("#UiDetalleEntregasNoProcesadas");
        try {
            entregasCanceladas.map(function (entregaCancelada) {
                li.push("<li style=\"border-bottom: 2px solid black;\">");
                li.push("<table style=\"width: 100%\">");
                li.push("<tr>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Documento:</b> " + entregaCancelada.docNum + "</td>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Cliente:</b> " + entregaCancelada.clientCode + "</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td colspan=\"2\"><b>Nombre: </b> " + entregaCancelada.clientName + " </td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Factura:</b> N/A</td>");
                li.push("<td style=\"width: 50%; text-align: left\"><b>Monto:</b>" + _this
                    .simboloDeMoneda + " " + format_number(trunc_number(entregaCancelada.totalAmount, _this.configuracionDeDecimales.defaultCalculationsDecimals), _this.configuracionDeDecimales.defaultDisplayDecimals) + "</td>");
                li.push("</tr>");
                li.push("<tr>");
                li.push("<td colspan=\"2\"><b>Raz\u00F3n: </b> " + entregaCancelada.reasonCancel + "</td>");
                li.push("</tr>");
                li.push("</table>");
                li.push("</li>");
            });
            if (this.listaNoEstaVacia(li.join(""))) {
                detalleEntregasNoProcesadas.append(li.join(""));
                detalleEntregasNoProcesadas.trigger("refresh");
            }
            callback();
        }
        catch (e) {
            notify("Error al generar el listado de entregas canceladas debido a: " + e.message);
        }
        finally {
            li = null;
            detalleEntregasNoProcesadas = null;
        }
    };
    ReporteDeEntregaControlador.prototype.listaNoEstaVacia = function (lista) {
        return lista !== "";
    };
    ReporteDeEntregaControlador.prototype.usuarioDeseaAnularEntrega = function (identificadorDeNotaDeEntrega) {
        var _this = this;
        try {
            var notaDeEntregaAProcesar_1 = this.listadoDeEntregasParaReporte.entregasProcesadas
                .find(function (notaDeEntrega) {
                return notaDeEntrega.docNum === parseInt(identificadorDeNotaDeEntrega);
            });
            if (notaDeEntregaAProcesar_1) {
                if (notaDeEntregaAProcesar_1.isCanceled == SiNo.Si) {
                    notify("La entrega ya se encuentra anulada.");
                    return;
                }
                else {
                    this.preguntarSiEstaSeguroDeAnularLaEntrega(function () {
                        _this.preguntarRazonDeAnulacionDeNotaDeEntrega(function (razonDeAnulacion) {
                            notaDeEntregaAProcesar_1.isCanceled = SiNo.Si;
                            notaDeEntregaAProcesar_1.reasonCancel = razonDeAnulacion;
                            _this.anularEntrega(notaDeEntregaAProcesar_1);
                        }, function (resultado) {
                            notify(resultado.mensaje);
                            return;
                        });
                    });
                }
            }
            else {
                notify("No se ha podido encontrar el documento " + identificadorDeNotaDeEntrega);
                return;
            }
        }
        catch (e) {
            notify("Error al intentar anular la entrega debido a: " + e.message);
            return;
        }
    };
    ReporteDeEntregaControlador.prototype.preguntarRazonDeAnulacionDeNotaDeEntrega = function (callback, errorCallback) {
        var _this = this;
        this.reporteDeEntregaServicio.obtenerRazonesDeAnulacionDeEntrega(function (razonesDeAnulacion) {
            var listaRazones = [];
            razonesDeAnulacion.map(function (razon) {
                listaRazones.push({ text: razon.reasonId, value: razon.reasonDescription });
            });
            var configOptions = {
                title: "¿Por qué anula la entrega?: ",
                items: listaRazones,
                doneButtonLabel: "ACEPTAR",
                cancelButtonLabel: "CANCELAR"
            };
            window.plugins.listpicker.showPicker(configOptions, function (item) {
                callback(item);
            }, function (error) {
                if (!_this.esErrorPorDefecto(error))
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "No se han podido obtener las razones de no entrega debido a: " + error
                    });
                return;
            });
        }, errorCallback);
    };
    ReporteDeEntregaControlador.prototype.esErrorPorDefecto = function (error) {
        return error == "Error";
    };
    ReporteDeEntregaControlador.prototype.preguntarSiEstaSeguroDeAnularLaEntrega = function (callback) {
        navigator.notification.confirm("\u00BFConfirma anular la entrega?", function (buttonIndex) {
            if (buttonIndex === BotonSeleccionado.Si) {
                callback();
            }
        }, "Sonda\u00AE " + SondaVersion, ["No", "Si"]);
    };
    ReporteDeEntregaControlador.prototype.anularEntrega = function (entregaAAnular) {
        var _this = this;
        try {
            this.entregaServicio
                .obtenerDatosDeDemandaDeDespachoAsociadaAEntregaAnulada(this.usuarioFacturaEnRuta, entregaAAnular, function (demandaDeDespachoAProcesar) {
                _this.ejecutarProcesoDeAnulacionDeEntrega(demandaDeDespachoAProcesar);
            }, function (resultado) {
                notify(resultado.mensaje);
                return;
            });
        }
        catch (e) {
            notify("Error al intentar procesar la anulaci\u00F3n de la entrega debido a: " + e.message);
            return;
        }
    };
    ReporteDeEntregaControlador.prototype.ejecutarProcesoDeAnulacionDeEntrega = function (demandaDeDespachoAProcesar) {
        var _this = this;
        this.entregaServicio
            .ejecutarProcesoDeAnulacionDeEntrega(this.usuarioFacturaEnRuta, demandaDeDespachoAProcesar, function () {
            EnviarData();
            _this.actualizarListasDeEntregas();
        }, function (resultado) {
            notify(resultado.mensaje);
            return;
        });
    };
    ReporteDeEntregaControlador.prototype.actualizarListasDeEntregas = function () {
        var _this = this;
        this.limpiarObjetosDeListadoDeEntregas(function () {
            _this.generarListadoDeEntregas();
            EnviarData();
        });
    };
    return ReporteDeEntregaControlador;
}());
//# sourceMappingURL=ReporteDeEntregaControlador.js.map