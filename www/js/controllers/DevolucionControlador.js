var _ListaSkuDevolver = null;
var _ValidarEstatus = null;


function DelegadoDevolucionContorles() {
    
    //-----Evnetos Controles-----//
    $("#btnSkuReturn").bind("touchstart", function () {
        if (gIsOnline == EstaEnLinea.Si) {
            MostrarPantallaDevolucion();
        } else {
            notify("Error: No esta conectado al servidor.");
        }

    });

    $("#UiBotonDevolucionEnviar").bind("touchstart", function () { UsuarioDeseaEnviarDEvolucion(); });
    $("#UiBotonDevolucionImprimir").bind("touchstart", function () { UsuarioDeseaImprimirDevolucion(); });
    $("#UiBotonDevolucionValidar").bind("touchstart", function () { UsuarioDeseaValidarDevolucion(); });
}

function CambiarBotonDevolucion() {
    try {
        
    } catch (e) {
        notify("Error: " + e.message);
    } 
}

function MostrarPantallaDevolucion() {
    $.mobile.changePage("#pageDevolucion", {
        transition: "slide",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    LimpiarControlesVariables(function () {
        LlenarListaSku(function () {
            //--
        }, function (err) {
            notify("Error: " + err.message);
        });
    }, function (err) {
        notify("Error: " + err.message);
    });

}

function LimpiarControlesVariables(callback, errCallback) {
    try {
        _ListaSkuDevolver = null;
        $("#UiListaDevolucionSku").children().remove('li');
        $('#UiBotonDevolucionEnviar').addClass("ui-disabled");
        $('#UiBotonDevolucionImprimir').addClass("ui-disabled");
        $('#UiBotonDevolucionValidar').addClass("ui-disabled");
        
        callback();
    } catch (e) {
        errCallback(e);
    }
}

function LlenarListaSku(callback, errCallback) {
    try {
        ObtenerSkuDevolucion(function (listaSku) {
            _ListaSkuDevolver = Array();
            for (var i = 0; i < listaSku.rows.length; i++) {
                var sku = {
                    ItemCode: listaSku.rows.item(i).SKU,
                    ItemDescription: listaSku.rows.item(i).SKU_NAME,
                    Quantity: listaSku.rows.item(i).ON_HAND
                };
                _ListaSkuDevolver.push(sku);
                AgregarUiListaDevolucion(sku, function () {

                }, function (err) {
                    errCallback(err);
                });
            }
            if (listaSku.rows.length !== 0) {
                if (localStorage.getItem('ID_ROUTE_RETURN') === undefined || localStorage.getItem('ID_ROUTE_RETURN') === null || localStorage.getItem('ID_ROUTE_RETURN') === "0") {
                    $('#UiBotonDevolucionEnviar').removeClass("ui-disabled");
                } else {
                    //$('#UiBotonDevolucionEnviar').removeClass("ui-disabled");
                    $('#UiBotonDevolucionValidar').removeClass("ui-disabled");
                }
            }
            callback();

        }, function (err) {
            errCallback(err);
        });
    } catch (e) {
        errCallback(e);
    }
}

function AgregarUiListaDevolucion(sku, callback, errCallback) {
    try {
        var li = "";
        li += "<li>";
        li += "<p>";
        li += "<h2>" + sku.ItemCode + "/" + sku.ItemDescription;
        li += "</h2>";
        li += "</p>";
        li += "<b>Cantidad: </b>";
        li += "<span class='ui-li-count' style='position:absolute; top:70%'> " + sku.Quantity + "</span>";
        li += "</p>";
        li += "</li>";
        $("#UiListaDevolucionSku").append(li);
        $("#UiListaDevolucionSku").listview('refresh');
        callback();
    } catch (e) {
        errCallback(e);
    }
}

function UsuarioDeseaEnviarDEvolucion() {
    try {
        EnviarDevolucionSku(_ListaSkuDevolver, function () {
            my_dialog("Espere...", "Haciendo Devolución Sku", "open");
        }, function (err) {
            notify("Error: " + err.message);
        });
    } catch (e) {
        notify("Error: " + e.message);
    }
}

function UsuarioDeseaValidarDevolucion() {
    try {
        ValidarDevolucionSku(localStorage.getItem('ID_ROUTE_RETURN'), 'COMPLETE'
            , function () {
                my_dialog("Espere...", "Validando Devolución Sku", "open");
            }, function (err) {
                notify("Error: " + err.message);
            });
    } catch (e) {
        notify("Error: " + e.message);
    }
}

function LimpiarInventario() {
    try {
        UpdateInventoriSkuDevolucion(function () {
            
        }, function(err) {
            notify("Error: " + err.message);
        });

    } catch (e) {
        notify("Error: " + e.message);
    } 
}

function UsuarioDeseaImprimirDevolucion() {
    try {
        ImprimirDevolucion(_ListaSkuDevolver, function () {
            //--
        }, function(err) {
            notify("Error: " + err.message);
        });
    } catch (e) {
        notify("Error: " + e.message);
    }
}

