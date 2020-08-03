var ClasificacionControlador = {
    delegarSockets: function(socketIo) {
        socketIo.on("GetNoInvoiceReasonsResponse", function(data) {
            switch (data.option) {
                case "get_not_invoice_reasons_request_reived":
                    ClasificacionesServicio.LimpiarTablaDeRazones(function () {
                        
                    }, function(error) {
                        notify(error);
                    });
                break;
                case "fail":
                    notify(data.error);
                    break;
                case "add_reason":
                    ClasificacionesServicio.InsertarRazon(data.row);
                    break;
                case "add_reasons_complete":
                    ClasificacionesServicio.AgregarRazonPorDefecto(function(error) {
                        notify(error);
                    });
                    break;
            }
        });

        socketIo.on("GetReasonsForVoidConsignmentResponse", function(data) {
            switch (data.option) {
            case "fail_get_reasons_void_consignment":
                notify(data.error);
                break;
            case "add_reason_void_consignment":
                ClasificacionesServicio.InsertarRazon(data.row);
                break;
            case "add_reasons_void_consignment_complete":
                ClasificacionesServicio.AgregarRazonPorDefectoConsignacion(function(error) {
                    notify(error);
                });
                break;
            }
        });

        socketIo.on("GetBusinessRivalResponse", function (data) {
            switch (data.option) {
                case "start":
                    ClasificacionesServicio.LimpiarTablaDeClasificaciones(function () {

                    }, function (error) {
                        notify(error);
                    });
                    break;
                case "fail":
                    notify(data.error);
                    break;
                case "add_business_rival":
                    ClasificacionesServicio.AgregarClasificacion(data.row);
                    break;
                case "add_business_rival_complete":
                    
                    break;
            }
        });

        socketIo.on("GetBusinessRivalCommentResponse", function (data) {
            switch (data.option) {
                case "start":
                    ClasificacionesServicio.LimpiarTablaDeClasificaciones(function () {

                    }, function (error) {
                        notify(error);
                    });
                    break;
                case "fail":
                    notify(data.error);
                    break;
                case "add_business_rival_comment":
                    ClasificacionesServicio.AgregarClasificacion(data.row);
                    break;
                case "add_business_rival_comment_complete":

                    break;
            }
        });
    }
}