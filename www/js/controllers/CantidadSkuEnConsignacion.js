//------ VARIABLES GLOBALES --------------------------------------
var ultimoTxtSeleccionado = "";

//------ FUNCIONES -----------------------------------------------
function delegarCantidadSkuEnConsignacion() {

    $("#UiCantidadAConsignacionPage").on("pageshow", function () {
        document.getElementById("UiTxtCantidad").value = "";
        document.getElementById("UiTxtCantidad").focus();
    });

    $("#UiBtnCancelarIngresoCantidad").on("click", function () {
        CambiarFocus("");
        RegresarAPantallaDeConsignacion();
    });

    $("#UiBtnAgregarCantidad").on("click", function () {
        var txtCantidad = document.getElementById("UiTxtCantidad").value;

        if (txtCantidad === "") {
            notify("Por favor, ingrese la cantidad de SKU o la cantidad de Efectivo...");
            document.getElementById("UiTxtCantidad").focus();
        } else if (txtCantidad == 0) {
            notify("Por favor, ingrese una cantidad mayor a cero");
            document.getElementById("UiTxtCantidad").focus();
        } else {
            var label = $("#UiLblSku");
            var cantidadAConsignar = parseInt(txtCantidad);
            var skuLabel = {
                SKU: label.attr("SKU"),
                SERIE: label.attr("SERIE"),
                REQUERIES_SERIE: label.attr("REQUERIES_SERIE")
            }
            for (var i = 0; i < window.gSkuList.length; i++) {
                var skuSaleOrder = window.gSkuList[i];
                if (skuSaleOrder.SKU == skuLabel.SKU && skuSaleOrder.SERIE == skuLabel.SERIE) {
                    if (cantidadAConsignar > skuSaleOrder.QTY) {
                        notify("La cantidad de consignación no puede ser mayor a la ingresada en la Orden de Venta");
                        document.getElementById("UiTxtCantidad").focus();
                        break;
                    } else if (cantidadAConsignar === skuSaleOrder.QTY || cantidadAConsignar > 0) {
                        UsuarioDeseaAgregarProductoAConsignacion(skuSaleOrder, i, cantidadAConsignar, true);
                        RegresarAPantallaDeConsignacion();
                        break;
                    }
                    break;
                }
            }
        }
    });
}

function ValidarCantidad(cantidad, callBack) {
    try {

        var arregloCantidad = cantidad.split("");
        var cantidadApariciones = 0;

        arregloCantidad.forEach(function (caracter) {
            if (caracter === ".") {
                cantidadApariciones++;
            }
        });

        if (cantidadApariciones === 1 || cantidadApariciones === 0) {
            callBack(true, cantidad);
        } else {
            callBack(false, cantidad);
        }

    } catch (e) {
        notify(e.message);
    }
}