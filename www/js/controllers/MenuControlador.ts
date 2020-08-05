class MenuControlador {

    invoiceInRoute: boolean = false;
    deliveryInRoute: boolean = false;

    mostrarUOcultarOpcionesDeFacturacion(callBack) {
        try {
            this.invoiceInRoute = localStorage.getItem("INVOICE_IN_ROUTE") == "1";
            this.deliveryInRoute = localStorage.getItem("DELIVERY_IN_ROUTE") == "1";
            this.mostrarUOcultarOpcionesDeFacturacionYEntrega(this.invoiceInRoute, this.deliveryInRoute, (error) => {
                notify("Error al mostrar opciones de facturación: " + error.mensaje);
            });
            callBack();
        } catch (e) {
            this.deliveryInRoute = SiNo.No;
            this.invoiceInRoute = SiNo.No;
            this.mostrarUOcultarOpcionesDeFacturacionYEntrega(this.invoiceInRoute, this.deliveryInRoute, (error: Operacion) => {
                notify("Error al mostrar opciones de facturación: " + error.mensaje);
            });
            callBack();
        }

    }

    mostrarUOcultarOpcionesDeFacturacionYEntrega(invoiceInRoute: boolean, deliveryInRoute: boolean, errorCallback: (error: Operacion) => void) {
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
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }


}