var MenuControlador = (function () {
    function MenuControlador() {
        this.invoiceInRoute = false;
        this.deliveryInRoute = false;
        this.controlDeSecuenciaServicio = new ControlDeSecuenciaServicio();
        this.reglaServicio = new ReglaServicio();
    }
    MenuControlador.prototype.mostrarUOcultarOpcionesDeFacturacion = function (callBack) {
        try {
            this.invoiceInRoute = localStorage.getItem("INVOICE_IN_ROUTE") == "1";
            this.deliveryInRoute = localStorage.getItem("DELIVERY_IN_ROUTE") == "1";
            this.mostrarUOcultarOpcionesDeFacturacionYEntrega(this.invoiceInRoute, this.deliveryInRoute, function (error) {
                notify("Error al mostrar opciones de facturación: " + error.mensaje);
            });
            callBack();
        }
        catch (e) {
            this.deliveryInRoute = SiNo.No;
            this.invoiceInRoute = SiNo.No;
            this.mostrarUOcultarOpcionesDeFacturacionYEntrega(this.invoiceInRoute, this.deliveryInRoute, function (error) {
                notify("Error al mostrar opciones de facturación: " + error.mensaje);
            });
            callBack();
        }
    };
    MenuControlador.prototype.mostrarUOcultarOpcionesDeFacturacionYEntrega = function (invoiceInRoute, deliveryInRoute, errorCallback) {
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
            }
            else if (deliveryInRoute && !invoiceInRoute) {
                $("#UiBtnShowScanManifestPage").css("display", "block");
                $("#UiBtnShowDeliveryReportPage").css("display", "block");
                $("#UiBtnDeliveryReport").css("display", "block");
            }
            else if (!deliveryInRoute && invoiceInRoute) {
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
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: e.message
            });
        }
    };
    MenuControlador.prototype.cargarInformacionFel = function (userType, callBack, errorCallBack) {
        var _this_1 = this;
        try {
            this.reglaServicio.obtenerRegla("RutaUsaFacturacionEnLinea", function (results) {
                if (_this_1.seDebeCargarInformacionDeFEL(results, userType)) {
                    _this_1.controlDeSecuenciaServicio.obtenerSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.DocumentoDeContingencia, function (secuenciaDocumento) {
                        localStorage.setItem("IMPLEMENTS_FEL", true.toString());
                        return callBack("block", true, secuenciaDocumento);
                    }, function (error) {
                        return errorCallBack({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: error
                        });
                    });
                }
                else {
                    localStorage.setItem("IMPLEMENTS_FEL", false.toString());
                    return callBack("none", false);
                }
            }, function (e) {
                return errorCallBack({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: e
                });
            });
        }
        catch (e) {
            return errorCallBack({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: e.message
            });
        }
    };
    MenuControlador.prototype.seDebeCargarInformacionDeFEL = function (data, userRole) {
        var seDebe = data.rows.length > 0;
        seDebe = seDebe && data.rows.item(0).ENABLED.toUpperCase() === "SI";
        seDebe = seDebe && userRole === "VEN";
        return seDebe;
    };
    MenuControlador.prototype.mostrarTextoDeLabelsParaSecuenciaDeFEL = function (documentSequence) {
        if (documentSequence === void 0) { documentSequence = null; }
        if (documentSequence == null) {
            $("#UiDivAutorizacionFacturacionEnLinea").css("display", "none");
        }
        else {
            $("#lblFel_Serie").text(documentSequence.SERIE);
            $("#lblFel_DocTo").text(documentSequence.DOC_TO);
            $("#lblFel_DocFrom").text(documentSequence.DOC_FROM);
            $("#lblFel_CurrentDoc").text(documentSequence.CURRENT_DOC);
        }
    };
    MenuControlador.prototype.seValidoCorrectamente = function (display, secuenciaDocumento) {
        this.mostrarTextoDeLabelsParaSecuenciaDeFEL(secuenciaDocumento);
        $("#UiDivAutorizacionFacturacionEnLinea").css("display", display);
    };
    return MenuControlador;
}());
//# sourceMappingURL=MenuControlador.js.map