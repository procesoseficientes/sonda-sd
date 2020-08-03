
//-------- DELEGADO ---------------

function DelegarImpresionConsignacionControlador() {

    $("#UiBtnAceptarConfirmacionDeEnvioDeConsignacion").on("click", function () {
        EnviarData();
        ConfirmedInvoice();
        PagoConsignacionesControlador.EstaEnDetalle = false;
        PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
        document.getElementById("DivUiListaConsignacionesAPagar").style.display = "block";
        document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "none";
    });


    $("#UiBtnImprimirConsignacion").on("click", function () {
        EnviarData();
        ImprimirDetalleDeConsignacion();
    });

}

//--------- FUNCIONES ------------
function ImprimirDetalleDeConsignacion() {
    try {
        if (window.consignacion.encabezado !== undefined) {
            my_dialog("Imprimiendo Recibo", "Por favor, espere...", "open");
            ObtenerDetallePorConsignacion(
                window.consignacion.encabezado.ConsignmentId, 0, function(detalleConsignacion, index) {
                    window.consignacion.detalle = detalleConsignacion;
                    ObtenerFormatoDeImpresionConsignacion(window.consignacion, function (formatoConsignacion) {
                        ImprimirDocumento(formatoConsignacion, function () {
                            my_dialog("", "", "close");
                            ConfirmedInvoice();
                            PagoConsignacionesControlador.EstaEnDetalle = false;
                            PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                            document.getElementById("DivUiListaConsignacionesAPagar").style.display = "block";
                            document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "none";
                        }, function () {
                            my_dialog("", "", "close");
                            notify("Lo sentimos, no ha sido posible imprimir el Detalle de Consignacion...");
                            ConfirmedInvoice();
                            PagoConsignacionesControlador.EstaEnDetalle = false;
                            PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                            document.getElementById("DivUiListaConsignacionesAPagar").style.display = "block";
                            document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "none";
                        });
                    });
                }, function (error) {
                    my_dialog("", "", "close");
                    notify(error);
                });            
        }
    } catch (e) {
        notify(e.message);
    } 
}