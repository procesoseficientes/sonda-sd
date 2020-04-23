function DelegarCantidadSkuControlador() {
    //$("#UiBotonCalcularDenominacion").bind("touchstart", function () {
    //    UsuarioDeseaCalcularDenominaciones();
    //});

    //$("#UiBotonAceptarCantidadSku").bind("touchstart", function () {
    //    UsuarioDeseaAceptarCantidadDeSku();
    //});
}

function UsuarioDeseaAceptarCantidadDeSku() {
    var sku = $("#lblSKU_IDCant");
    var cantidad = $("#UiCantidadSKU");
    var preciounitario = sku.attr("precioUnitario");

    if (cantidad.val() !== "" && parseInt(cantidad.val()) > 0) {

        ObtenerSaldoActualSinSku(sku.attr("SKU"), cantidad.val(), preciounitario, function (skuN1, cantidadN1, precioUnitario, totalSinSku) {
            var granTotal = (precioUnitario * cantidadN1) + totalSinSku;
            
            ValidarSaldoCliente(gClientID, granTotal, skuN1, cantidadN1, OpcionValidarSaldoCliente.PonerCantidad,gSalesOrderType, function (sku, cantidadN2) {
                if (gIsOnline === 0) {
                    AddSKU(sku, "", sku, gTaskType, cantidadN2);
                    window.history.back();
                }
            }, function (err) {
                notify("Error al obtener saldo actual de la orden de venta: " + err.message);
            });

        }, function (err) {
            notify("Error al Validar el Total del cliente: " + err.message);
        });

    } else {
        notify("No puede dejar vacia la cantidad ni menor a 1");
    }
    sku = null;
    cantidad = null;
}

//function UsuarioDeseaCalcularDenominaciones() {
//    var sku = $("#lblSKU_IDCant");
//    var cantidad = $("#UiCantidadSKU");

//    if (cantidad.val() !== "" && parseInt(cantidad.val()) > 0) {
//        ValidarSkuEnConversionDePaquetes(sku.attr("SKU"), parseInt(cantidad.val()), function (tieneConversion, skuN1, cantidadN1) {
//            if (tieneConversion === 1) {
//                ObtenerDeMayorAMenorDenominacion(skuN1, cantidadN1, function (conversionesDePaquetes, residuoUnidad, descripcionUnidad) {
//                    CargarDenominaciones(conversionesDePaquetes, residuoUnidad, descripcionUnidad, function () {

//                    }, function (err) {
//                        notify("Error al mostrar las denominaciones: " + err.message);
//                    });
//                }, function (err) {
//                    notify("Error al calcular las denominaciones: " + err.message);
//                });
//            } else {
//                ToastThis("Este producto no tiene paquetes configurados");
//            }
//        }, function (err) {
//            notify("Error al validar si tiene paquetes el producto: " + err.message);
//        });
//    } else {
//        notify("No puede dejar vacia la cantidad ni menor a 1");
//    }

//    sku = null;
//    cantidad = null;
//}

function CargarDenominaciones(conversionesDePaquetes, residuoUnidad, descripcionUnidad, callback, errCallback) {
    try {
        var vli = "";
        var lista = $('#UiListaDenominacionDePaquetes');
        lista.children().remove('li');

        for (var i = (conversionesDePaquetes.length - 1) ; i > -1; i--) {
            if (conversionesDePaquetes[i].Qty > 0) {
                vLI = '';
                vLI += '<li class="ui-field-contain">';
                vLI += '<p><span><span class="medium">' + conversionesDePaquetes[i].DescriptionPackUnitFrom + ': </span>';
                vLI += "<span class='ui-li-count' style='position:absolute; top:50%'>" + conversionesDePaquetes[i].Qty + "</span></p>";
                vLI += '</li>';

                lista.append(vLI);
                lista.listview('refresh');
            }
        }

        if (residuoUnidad > 0) {
            vLI = '';
            vLI += '<li class="ui-field-contain">';
            vLI += '<p><span><span class="medium">' + descripcionUnidad + ': </span>';
            vLI += "<span class='ui-li-count' style='position:absolute; top:50%'>" + residuoUnidad + "</span></p>";
            vLI += '</li>';

            lista.append(vLI);
            lista.listview('refresh');
        }

        lista = null;
        callback();
    } catch (err) {
        errCallback(err);
    }
}

function LimpiarCamposCantidadSku() {
    var lista = $('#UiListaDenominacionDePaquetes');
    var cantidad = $("#UiCantidadSKU");

    cantidad.val("1");
    lista.children().remove('li');

    cantidad = null;
    lista = null;
}