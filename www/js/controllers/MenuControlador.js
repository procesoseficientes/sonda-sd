var MenuControlador = (function () {
    function MenuControlador() {
        this.invoiceInRoute = false;
        this.deliveryInRoute = false;
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
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    return MenuControlador;
}());
//# sourceMappingURL=MenuControlador.js.map