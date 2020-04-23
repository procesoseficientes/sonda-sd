
function EjecutarTareaDeVenta(idCliente) {
    ShowSalesPage(function (customer) {
        ActualizarTareaEstado(gtaskid, TareaEstado.Completada, function () {
                EnviarData();
                $.mobile.changePage("#pickupplan_page", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            }, function (err) {
                notify(err.message);
                $.mobile.changePage("#pickupplan_page", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            }
        );
    }, idCliente);
}

function EjecutarTareaDePreVenta(idCliente) {
    EnviarData();
    $.mobile.changePage("#pos_skus_page", {
        transition: "flow",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    //ShowPreSalePage(function() {
    //EnviarData();
    //$.mobile.changePage("#pickupplan_page", {
    //    transition: "flow",
    //    reverse: true,
    //    changeHash: true,
    //    showLoadMsg: false
    //});
    //},idCliente);
}