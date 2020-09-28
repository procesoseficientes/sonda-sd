var ConfirmacionControlador = (function () {
    function ConfirmacionControlador() {
        this.menuControlador = new MenuControlador();
        this.invoiceHeader = new FacturaEncabezado();
        this.invoiceDetail = new FacturaDetalle();
        this.felData = new DatosFelParaFactura();
        this.socketIo = null;
        this.resumenTareaServicio = new ResumenDeTareaServicio();
        this.facturaServicio = new FacturaServicio();
        this.facturacionElectronicaServicio = new FacturacionElectronicaServicio();
        this.controlDeSecuenciaServicio = new ControlDeSecuenciaServicio();
    }
    ConfirmacionControlador.prototype.validarSiImplementaraFEL = function (callback) {
        var _this_1 = this;
        this.menuControlador.cargarInformacionFel(localStorage.getItem("user_type"), function (display, implementaFel) {
            _this_1.ejecutarMetodosPrincipales(display, implementaFel, callback);
        }, function (error) {
            notify("Error al validar si usar\u00E1 FEL: " + error.mensaje);
        });
    };
    ConfirmacionControlador.prototype.delegarSockets = function (socketIo) {
        var _this_1 = this;
        this.socketIo = socketIo;
        this.socketIo.on("get_e-signature_fail", function (data) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            _this_1.reintentarSolicitudDeFirmaElectronica();
            notify("Error al intentar obtener firma en el API: " + data.response);
        });
        this.socketIo.on("get_e-signature_error", function (data) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            _this_1.reintentarSolicitudDeFirmaElectronica();
            notify("Error enviando solicitud de firma: " + data.response);
        });
        this.socketIo.on("get_e-signature_success", function (data) {
            _this_1.validarSiSeObtuvoFirmaElectronica(data.response);
        });
        this.socketIo.on("get_e-signature_for_contingency_doc_success", function (data) {
            _this_1.validarSiSeObtuvoFirmaElectronica(data.response, 1);
        });
        this.socketIo.on("contingency_document_exist", function (data) {
            _this_1.felData.ElectronicSignature =
                data.response.invoice.electronicSignature;
            _this_1.felData.DocumentSeries = data.response.invoice.documentSeries;
            _this_1.felData.DocumentNumber = data.response.invoice.documentNumber;
            _this_1.felData.DocumentUrl = data.response.invoice.documentUrl;
            _this_1.felData.Shipment = data.response.invoice.shipment;
            _this_1.felData.ValidationResult = data.response.invoice.validationResult;
            _this_1.felData.ShipmentDatetime = data.response.invoice.shipmentDatetime;
            _this_1.felData.ShipmentResponse = data.response.invoice.shipmentResponse;
            _this_1.felData.ContingencyDocSerie =
                data.response.invoice.contingencyDocSerie;
            _this_1.felData.ContingencyDocNum = data.response.invoice.contingencyDocNum;
            _this_1.facturacionElectronicaServicio.actualizarDocumentoDeContingencia(data.response.invoice.invoiceId, _this_1.felData, function (resultado) {
                notify("No se pudo actualizar factura debido a " + resultado.mensaje);
            }, function () {
                _this_1.felData = new DatosFelParaFactura();
                listallinvoices();
            });
            InteraccionConUsuarioServicio.desbloquearPantalla();
        });
        this.socketIo.on("get_e-signature_for_contingency_doc_error", function (data) {
            notify("" + data.response);
        });
        this.socketIo.on("get_e-signature_fail_cd", function (data) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al obtener firma: " + data.response);
            listallinvoices();
        });
        this.socketIo.on("get_e-signature_error_cd", function (data) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("" + data.response);
            listallinvoices();
        });
    };
    ConfirmacionControlador.prototype.validarSiSeObtuvoFirmaElectronica = function (response, isContingencyDoc) {
        var _this_1 = this;
        if (isContingencyDoc === void 0) { isContingencyDoc = 0; }
        var url = "https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=";
        var errorMsg = response.errorDescription || "Error en la petici\u00F3n de firma electr\u00F3nica";
        var resultMsg = "Resultado de firma: ";
        var resultIsSuccess = response.resultado || false;
        var message;
        var result;
        response.resultado
            ? ((result = response.descripcion), (message = resultMsg))
            : response.isSuccess
                ? ((result = response.descripcion_errores[0].mensaje_error),
                    (message = resultMsg))
                : ((result = ""), (message = errorMsg));
        console.log("" + message + result);
        if (resultIsSuccess) {
            this.felData.ElectronicSignature = response.uuid;
            this.felData.DocumentSeries = response.serie;
            this.felData.DocumentUrl = "" + url + response.uuid;
            this.felData.Shipment = response.resultado ? 1 : 0;
            this.felData.ValidationResult = response.resultado;
            this.felData.ShipmentDatetime = this.shipmentDateTime || "";
            this.felData.ShipmentResponse = response.descripcion;
            this.felData.DocumentNumber = response.numero;
            this.felData.FelDocumentType = localStorage.getItem("FEL_DOCUMENT_TYPE");
            this.felData.FelStablishmentCode = parseInt(localStorage.getItem("FEL_STABLISHMENT_CODE"));
            if (isContingencyDoc === 1) {
                this.facturacionElectronicaServicio.actualizarDocumentoDeContingencia(gInvoiceNUM, this.felData, function (resultado) {
                    notify("" + resultado.mensaje);
                }, function () {
                    _this_1.felData = new DatosFelParaFactura();
                    listallinvoices();
                });
            }
            else {
                this.facturaServicio.InsertarFactura(this.invoiceHeader, this.felData, function (resultado) {
                    notify("" + resultado.mensaje);
                }, function () {
                    _this_1.felData = new DatosFelParaFactura();
                });
            }
            this.shipmentDateTime = "";
            this.invoiceHeader = null;
            InteraccionConUsuarioServicio.desbloquearPantalla();
            this.isContingencyDocument = 0;
        }
        else {
            this.felData.ElectronicSignature = "";
            this.felData.DocumentSeries = "";
            this.felData.DocumentUrl = "";
            this.felData.Shipment = 2;
            this.felData.ValidationResult = false;
            this.felData.ShipmentDatetime = this.shipmentDateTime || "";
            this.felData.ShipmentResponse = response.descripcion;
            this.felData.DocumentNumber = 0;
            this.felData.FelDocumentType = localStorage.getItem("FEL_DOCUMENT_TYPE");
            this.felData.FelStablishmentCode = parseInt(localStorage.getItem("FEL_STABLISHMENT_CODE"));
            if (isContingencyDoc === 1) {
                this.facturacionElectronicaServicio.actualizarDocumentoDeContingencia(gInvoiceNUM, this.felData, function (resultado) {
                    notify("" + resultado.mensaje);
                }, function () {
                    _this_1.felData = new DatosFelParaFactura();
                    listallinvoices();
                });
            }
        }
        if (message && message !== "") {
            notify("" + message + result);
        }
        this.habilitarDeshabilitarBotones(!resultIsSuccess);
    };
    ConfirmacionControlador.prototype.reintentarSolicitudDeFirmaElectronica = function (response, isContingencyDoc) {
        var _this_1 = this;
        if (isContingencyDoc === void 0) { isContingencyDoc = 0; }
        navigator.notification.confirm("\u00BFDesea reintentar?", function (btnIndex) {
            if (btnIndex == 2) {
                _this_1.usuarioDeseaSolicitarFirmaElectronica(isContingencyDoc);
            }
            else if (isContingencyDoc == 0) {
                if (response) {
                    _this_1.iniciarProcesoDocumentoContingencia("", response);
                }
                else {
                    _this_1.iniciarProcesoDocumentoContingencia();
                }
            }
        }, "Sonda\u00AE SD " + SondaVersion, ["NO", "SI"]);
    };
    ConfirmacionControlador.prototype.iniciarProcesoDocumentoContingencia = function (extraMessage, response) {
        var _this_1 = this;
        if (extraMessage === void 0) { extraMessage = ""; }
        navigator.notification.confirm(extraMessage + "\u00BFDesea generar documento de contingencia?", function (buttonIndex) {
            if (buttonIndex == 2) {
                InteraccionConUsuarioServicio.bloquearPantalla();
                _this_1.controlDeSecuenciaServicio.obtenerSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.DocumentoDeContingencia, function (secuencia) {
                    if (secuencia.CURRENT_DOC < secuencia.DOC_TO) {
                        _this_1.invoiceHeader = Object.assign(new FacturaEncabezado(), gInvoiceHeader);
                        _this_1.felData.ContingencyDocSerie = secuencia.SERIE;
                        _this_1.facturaServicio.ObtenerDetallesDeFacturaPorNumeroDeTarea(_this_1.invoiceHeader.invoiceNum, function (facturaDetalles) {
                            TareaServicio.obtenerTareaPorCodigoYTipo(gTaskId, "SALE", function (tarea) {
                                _this_1.invoiceHeader.clientAddress = tarea.taskAddress;
                                _this_1.invoiceHeader.invoiceDetail = facturaDetalles;
                                _this_1.invoiceHeader.department = tarea.department;
                                _this_1.invoiceHeader.municipality = tarea.municipality;
                                _this_1.invoiceHeader.nit = tarea.nit;
                                _this_1.invoiceHeader.felData.FelDocumentType = localStorage.getItem("FEL_DOCUMENT_TYPE");
                                _this_1.invoiceHeader.felData.FelStablishmentCode = parseInt(localStorage.getItem("FEL_STABLISHMENT_CODE"));
                                console.log(_this_1.invoiceHeader);
                                _this_1.felData.ContingencyDocNum =
                                    secuencia.CURRENT_DOC < secuencia.DOC_FROM
                                        ? secuencia.DOC_FROM
                                        : secuencia.CURRENT_DOC + 1;
                                _this_1.felData.DocumentUrl = null;
                                _this_1.felData.Shipment = response ? 1 : 0;
                                _this_1.felData.ValidationResult = response
                                    ? response.resultado
                                        ? true
                                        : false
                                    : false;
                                _this_1.felData.ShipmentDatetime =
                                    _this_1.shipmentDateTime || "";
                                _this_1.felData.ShipmentResponse = response
                                    ? response.descripcion
                                    : "";
                                _this_1.felData.FelDocumentType = localStorage.getItem("FEL_DOCUMENT_TYPE");
                                _this_1.felData.ElectronicSignature = null;
                                _this_1.felData.DocumentSeries = null;
                                _this_1.felData.IsContingencyDocument = true;
                                _this_1.felData.FelStablishmentCode = parseInt(localStorage.getItem("FEL_STABLISHMENT_CODE"));
                                _this_1.felData.DocumentNumber = 0;
                                _this_1.facturaServicio.InsertarFactura(_this_1.invoiceHeader, _this_1.felData, function (resultado) {
                                    notify("Error insertando documento de contingencia: " + resultado.mensaje);
                                }, function () {
                                    _this_1.felData = new DatosFelParaFactura();
                                });
                                _this_1.controlDeSecuenciaServicio.actualizarSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.DocumentoDeContingencia, _this_1.felData.ContingencyDocNum, function (resultado) {
                                    notify(resultado.mensaje);
                                });
                                _this_1.shipmentDateTime = null;
                                _this_1.invoiceHeader = null;
                                _this_1.habilitarDeshabilitarBotones(false);
                            }, function (resultado) {
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                                notify(resultado);
                            });
                        }, function (error) {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            notify("" + error.mensaje);
                        });
                    }
                    else {
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify("Ya no cuenta con secuencia para documentos de contingencia disponibles. Consulte con su administrador.");
                    }
                }, function (errorMsg) {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify(errorMsg);
                });
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        }, "Sonda\u00AE SD " + SondaVersion, ["NO", "SI"]);
    };
    ConfirmacionControlador.prototype.usuarioDeseaSolicitarFirmaElectronica = function (IsContingencyDocument) {
        if (IsContingencyDocument === void 0) { IsContingencyDocument = 0; }
        if (gIsOnline === 0) {
            notify("No hay conexión con el servidor");
        }
        else {
            InteraccionConUsuarioServicio.bloquearPantalla();
            var self_1 = this;
            var procesarFactura_1 = function procesarFactura(factura) {
                self_1.facturaServicio.ObtenerDetallesDeFacturaPorNumeroDeTarea(gInvoiceNUM, function (facturaDetalles) {
                    TareaServicio.obtenerTareaPorCodigoYTipo(gTaskId, "SALE", function (tarea) {
                        self_1.facturacionElectronicaServicio.obtenerFrasesYEscenariosPorTipoDeDocumentoFel(localStorage.getItem("FEL_DOCUMENT_TYPE"), function (frasesEscenarios) {
                            factura.clientAddress = tarea.taskAddress;
                            factura.invoiceDetail = facturaDetalles;
                            factura.department = tarea.department;
                            factura.municipality = tarea.municipality;
                            factura.nit = tarea.nit;
                            factura.felData.FelDocumentType = localStorage.getItem("FEL_DOCUMENT_TYPE");
                            factura.felData.FelStablishmentCode = parseInt(localStorage.getItem("FEL_STABLISHMENT_CODE"));
                            self_1.shipmentDateTime = getDateTime();
                            var data = {
                                dbuser: gdbuser,
                                dbuserpass: gdbuserpass,
                                deviceId: device.uuid,
                                invoiceH: self_1.invoiceHeader,
                                phrasesScenarios: frasesEscenarios,
                                routeId: gCurrentRoute,
                                shipmentDatetime: self_1.shipmentDateTime
                            };
                            if (IsContingencyDocument === 0) {
                                SocketControlador.socketIo.emit("get_electronic_signature", data);
                            }
                            else {
                                SocketControlador.socketIo.emit("get_e-signature_for_contingency_doc", data);
                            }
                        }, function (error) {
                            notify(error.mensaje);
                        });
                    }, function (resultado) {
                        notify(resultado);
                    });
                }, function (error) {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("" + error.mensaje);
                });
            };
            if (IsContingencyDocument === 0) {
                this.invoiceHeader = Object.assign(new FacturaEncabezado(), gInvoiceHeader);
                procesarFactura_1(this.invoiceHeader);
            }
            else {
                this.facturacionElectronicaServicio.obtenerDocumentoDeContingenciaPorNumeroDeFactura(gInvoiceNUM, function (factura) {
                    self_1.invoiceHeader = Object.assign(new FacturaEncabezado(), factura);
                    procesarFactura_1(self_1.invoiceHeader);
                }, function (resultado) {
                    notify("No se pudo obtener documento de contingencia: " + resultado);
                });
            }
        }
    };
    ConfirmacionControlador.prototype.ejecutarMetodosPrincipales = function (display, habilitar, callback) {
        this.habilitarDeshabilitarBotones(habilitar);
        this.mostrarUOcultarBotonSolicitarFirma(display);
        if (callback) {
            var to_1 = setTimeout(function () {
                clearTimeout(to_1);
                callback();
            }, 500);
        }
    };
    ConfirmacionControlador.prototype.asignarEventoABotonSolicitarFirma = function () {
        var _this_1 = this;
        $("#btnRequestElectronicSignature").on("click", function () {
            _this_1.iniciarProcesoSolicitudDeFirmaElectronica();
        });
    };
    ConfirmacionControlador.prototype.iniciarProcesoSolicitudDeFirmaElectronica = function () {
        var _this_1 = this;
        navigator.notification.confirm("\u00BFDesea solicitar firma electr\u00F3nica?", function (buttonIndex) {
            if (buttonIndex === 2) {
                if (gIsOnline === 1) {
                    _this_1.usuarioDeseaSolicitarFirmaElectronica();
                }
                else {
                    _this_1.iniciarProcesoDocumentoContingencia("No hay conecci\u00F3n con el servidor\n");
                }
            }
            else {
                _this_1.iniciarProcesoDocumentoContingencia();
            }
        }, "Sonda\u00AE SD " + SondaVersion, ["NO", "SI"]);
    };
    ConfirmacionControlador.prototype.habilitarDeshabilitarBotones = function (isActive) {
        var prop = "pointer-events";
        var propVal = isActive ? "" : "none", propVal1 = isActive ? "none" : "";
        var opacity1 = isActive ? (1).toString() : (0.5).toString(), opacity2 = isActive ? (0.5).toString() : (1).toString();
        $("#btnRequestElectronicSignature").css(prop, propVal);
        $("#btnConfirmedInvoice").css(prop, propVal1);
        $("#btnPrintIT").css(prop, propVal1);
        $("#btnInquest").css(prop, propVal1);
        $("#btnRequestElectronicSignature").css({ opacity: opacity1 });
        $("#UiContenedorControlesFacturacionConfirmada").css({ opacity: opacity2 });
    };
    ConfirmacionControlador.prototype.mostrarUOcultarBotonSolicitarFirma = function (display) {
        $("#requestElectronicSignature").css("display", display);
    };
    return ConfirmacionControlador;
}());
//# sourceMappingURL=ConfirmacionControlador.js.map