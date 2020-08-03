//------------VARIABLES GLOBALES---------------------
var productosConsignacion = new Array();
var vistaCargandosePorPrimeraVez = true;
var facturaCompletaEnConsignacion = false;
var facturaActualTieneConsignacion = false;
var consignacion = {};
var cantidadEfectivo;
var cantidadTotal;
var cantidadDisponibleParaConsignacion;
var conConsignacion = 0;
var imagenConsignacion = "";
var tipoDeConsignacion = "";

//----------DELEGADO---------------------------------
function DelegarConsignacionControlador() {

    $("#PageConsignment").on("pageshow", function () {

        CambiarFocus("");
        if (vistaCargandosePorPrimeraVez) {
            if (tipoDeConsignacion === "AMOUNT") {
                LlenarListaDeProdcutos();
            } else {
                consignacion = {};
                ObtenerSkus(function () {
                    LlenarListaDeProductosParaConsignacionPorSku();
                }, function (error) {
                    notify(error);
                });
            }
        } else {
            LlenarListaDeProductosParaConsignacionPorSku();
        }
    });

    $("#UiBtnAgregarConsignacion").on("click", function () {
        PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.Consignacion, function (tieneSecuencia) {
            if (tieneSecuencia) {
                cantidadEfectivo = document.getElementById("txtCash_summ").value;
                cantidadTotal = document.getElementById("lblTotalSKU").textContent;
                navigator.notification.confirm("Elija el tipo de consignación.", function (buttonIndex) {
                    if (buttonIndex === 1) {
                        ValidarCantidad(cantidadEfectivo, function (esValida, cantidadDevuelta) {
                            if (esValida) {
                                tipoDeConsignacion = "AMOUNT";

                                if (cantidadDevuelta !== "") {
                                    cantidadEfectivo = parseFloat(cantidadEfectivo);
                                    cantidadTotal = parseFloat(cantidadTotal);


                                    if (cantidadEfectivo > cantidadTotal) {
                                        notify("La cantidad ingresada supera el Total de la Factura. \r\n Por favor, verifique y vuelva a intentar.");
                                        document.getElementById("txtCash_summ").focus();
                                    } else if (cantidadEfectivo < 0 || cantidadEfectivo < 1) {
                                        if (cantidadEfectivo === 0) {
                                            navigator.notification.confirm(
                                                "Esta seguro de dejar Todo el Producto en Consignación?", function (buttonIndex) {
                                                    if (buttonIndex === 1) {
                                                        cantidadDisponibleParaConsignacion = (cantidadTotal);
                                                        window.facturaCompletaEnConsignacion = true;

                                                        if (facturaActualTieneConsignacion) {
                                                            QuitarSkusDeConsignacion();
                                                            vistaCargandosePorPrimeraVez = false;
                                                            AjustarFactura(function () {
                                                                MostrarPantallaDeConsignacion();
                                                            });
                                                        } else {
                                                            vistaCargandosePorPrimeraVez = true;
                                                            MostrarPantallaDeConsignacion();
                                                        }
                                                    }
                                                }, "Sonda SD", ["Si", "No"]);
                                        }
                                    } else if (cantidadEfectivo < cantidadTotal || cantidadEfectivo === cantidadTotal) {
                                        window.facturaCompletaEnConsignacion = false;
                                        cantidadDisponibleParaConsignacion = (cantidadTotal - cantidadEfectivo);


                                        if (facturaActualTieneConsignacion) {
                                            QuitarSkusDeConsignacion();
                                            vistaCargandosePorPrimeraVez = false;
                                            AjustarFactura(function () { });
                                            MostrarPantallaDeConsignacion();

                                        } else {
                                            vistaCargandosePorPrimeraVez = true;
                                            MostrarPantallaDeConsignacion();
                                        }
                                    }

                                } else {
                                    notify("Por favor ingrese la cantidad de efectivo");
                                    document.getElementById("txtCash_summ").focus();
                                }

                            } else {
                                notify("Por favor ingrese una cantidad válida de efectivo");
                                document.getElementById("txtCash_summ").focus();
                            }
                        });
                    } else if (buttonIndex === 2) {
                        tipoDeConsignacion = "SKU";
                        MostrarPantallaDeConsignacion();
                    }
                }, "Sonda SD", ["Por Monto", "Por SKU"]);

            } else {
                notify("Usted no cuenta con Secuencia de Documentos de Consignación, por favor, comuníquese con su Administrador de Sonda.");
            }
        }, function (error) {
            notify(error);
        });
    });

    $("#PageConsignment").on("click", "#UiListaSkusOrdenDeVenta li", function (e) {
        if (tipoDeConsignacion === "AMOUNT")
            return;
        var id = e.currentTarget.attributes["id"].nodeValue;
        for (var i = 0; i < window.gSkuList.length; i++) {
            var sku = window.gSkuList[i];
            if (sku.SKU === id) {
                PantallaDeIngresoDeCantidad(sku);
                break;
            }
        }

    });

    $("#PageConsignment").on("swipeleft", "#UiListaSkusEnConsignacion li", function (e) {
        if (tipoDeConsignacion === "AMOUNT")
            return;
        var id = e.currentTarget.attributes["id"].nodeValue;

        navigator.notification.confirm(
            "Esta seguro de eliminar el SKU de consignacion?"
            , function (buttonIndex) {
                if (buttonIndex === 1) {
                    for (var i = 0; i < window.productosConsignacion.length; i++) {
                        var sku = window.productosConsignacion[i];
                        if (sku.SKU === id) {
                            UsuarioDeseaQuitarProductoAConsignacion(sku, i);
                            break;
                        }
                    }
                    LlenarListaDeProductosParaConsignacionPorSku();
                }
            }, "Sonda SD"
        , ["Si", "No"]);
    });

    $("#PageConsignment").on("click", "#UiListaSkusEnConsignacion li", function (e) {
        if (tipoDeConsignacion === "AMOUNT")
            return;
        var id = e.currentTarget.attributes["id"].nodeValue;
        for (var i = 0; i < window.gSkuList.length; i++) {
            var sku = window.gSkuList[i];
            if (sku.SKU === id) {
                if (parseInt(sku.QTY) > 0) {
                    PantallaDeIngresoDeCantidad(sku);
                } else {
                    notify("La cantidad vendida de este SKU ya se encuentra en consignación.");
                }
                break;
            }
        }
    });

    $("#UiBtnGrabarConsignacion").on("click", function () {
        navigator.notification.confirm(
           "Esta seguro de Guardar el proceso de consignación?\r\nDeberá capturar una fotografía del producto que esta dejando en consignación"
           , function (buttonIndex) {
               if (buttonIndex === 1) {
                   capturarImagenDeConsignacion(function (image) {
                       ActualizarDatosDeFacturacion();
                       //UsuarioDeseaGrabarConsignacion();
                   }, function (error) {
                       if (error === "Camera cancelled.") {
                           notify("Debe capturar la fotografía del producto que esta dejando en Consignación.");
                       } else {
                           notify(error);
                       }
                   });
               }
           }, "Sonda SD"
       , ["Si", "No"]);
    });

    $("#UiBtnCancelarConsignacion").on("click", function () {
        CancelarIngresoConsignacion();
    });

    $("#UiBtnDivListaSkusEnOrdenDeVenta").on("click", function (e) {
        var id = e.currentTarget.attributes["id"].nodeValue;
        CambiarFocus(id);
    });

    $("#UiDivGrabarConsignacion").on("click", function (e) {
        var id = e.currentTarget.attributes["id"].nodeValue;
        CambiarFocus(id);
    });
}

//----------FUNCIONES--------------------------------

function capturarImagenDeConsignacion(callBack, errorCallBack) {
    try {
        navigator.camera.getPicture
            (
                function (imageURI) {
                    var image = "data:image/jpeg;base64," + imageURI;
                    window.imagenConsignacion = image;
                    callBack(image);
                    image = null;
                },
                function (message) {
                    var error = "No se pudo capturar la imágen del producto debido a: " + message;
                    console.log(error);
                    errorCallBack(error);
                },
                {
                    quality: 90,
                    targetWidth: 350,
                    targetHeight: 350,
                    saveToPhotoAlbum: false,
                    sourceType: navigator.camera.PictureSourceType.CAMERA,
                    correctOrientation: true,
                    destinationType: Camera.DestinationType.DATA_URL
                }
            );
    } catch (e) {
        var error2 = ("No se pudo capturar la imágen debido a: " + e.message);
        console.log(error2);
        errorCallBack(error2);
    }
}

function MostrarPantallaDeConsignacion() {
    $.mobile.changePage("#PageConsignment", {
        transition: "pop",
        reverse: false,
        changeHash: false,
        showLoadMsg: false
    });
}

function CambiarFocus(idBtn) {
    try {
        switch (idBtn) {
            case "UiBtnDivListaSkusEnOrdenDeVenta":
                $("#UiDivGrabarConsignacion").removeClass("ui-btn-active");
                $("#UiBtnDivListaSkusEnOrdenDeVenta").addClass("ui-btn-active");

                $("#UiDivFinalizarConsignacion").css("display", "none");
                $("#UiDivSkus").css("display", "block");
                break;

            case "UiDivGrabarConsignacion":
                $("#UiBtnDivListaSkusEnOrdenDeVenta").removeClass("ui-btn-active");
                $("#UiDivGrabarConsignacion").addClass("ui-btn-active");

                $("#UiDivSkus").css("display", "none");
                $("#UiDivFinalizarConsignacion").css("display", "block");
                break;

            default:
                $("#UiDivGrabarConsignacion").removeClass("ui-btn-active");
                $("#UiBtnDivListaSkusEnOrdenDeVenta").addClass("ui-btn-active");

                $("#UiDivFinalizarConsignacion").css("display", "none");
                $("#UiDivSkus").css("display", "block");
        }
    } catch (e) {
        notify(e.message);
    }
}

function CancelarIngresoConsignacion() {
    if (window.productosConsignacion.length > 0) {
        navigator.notification.confirm(
      "Esta seguro de Cancelar el proceso de consignación?"
      , function (buttonIndex) {
          if (buttonIndex === 1) {
              UsuarioDeseaCancelarConsignacion();
          }
      }, "Sonda SD"
  , ["Si", "No"]);
    } else {
        UsuarioDeseaCancelarConsignacion();
    }
}

function usuarioDeseaRetornarAFinalizarVenta() {
    $.mobile.changePage("#summary_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}

function RegresarAPantallaDeConsignacion() {
    vistaCargandosePorPrimeraVez = false;
    $.mobile.changePage("#PageConsignment", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}

function PantallaDeIngresoDeCantidad(skuObject) {
    try {
        var sku = $("#UiLblSku");
        sku.attr("SKU", skuObject.SKU);
        sku.attr("SKU_NAME", skuObject.SKU_NAME);
        sku.attr("QTY", skuObject.QTY);
        sku.attr("LINE_SEQ", skuObject.LINE_SEQ);
        sku.attr("PRICE", skuObject.PRICE);
        sku.attr("TOTAL_LINE", skuObject.TOTAL_LINE);
        sku.attr("SERIE", skuObject.SERIE);
        sku.attr("REQUERIES_SERIE", skuObject.REQUERIES_SERIE);
        sku.text(skuObject.SKU + " " + skuObject.SKU_NAME);
        sku = null;

        document.getElementById("UiLblCantidadSkuEnVenta").textContent = skuObject.QTY;
        document.getElementById("UiLblPrecioSkuEnVenta").textContent = "Q " + format_number(skuObject.PRICE, 2);
        document.getElementById("UiLblTotalSkuEnVenta").textContent = "Q " + format_number((parseInt(skuObject.QTY) * parseFloat(skuObject.PRICE)), 2);

        $.mobile.changePage("#UiCantidadAConsignacionPage", {
            transition: "none",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });

    } catch (e) {
        notify(e.message);
    }
}

function UsuarioDeseaAgregarProductoAConsignacion(skuOrdenDeVenta, indice, cantidadAConsignar, refrescarLista) {
    try {
        var skuObject = {};
        var skuEnConsignacion = {};
        var existeEnConsignacion = false;
        var index = null;

        if (skuOrdenDeVenta.REQUERIES_SERIE === 0) {
            for (var l = 0; l < window.productosConsignacion.length; l++) {
                skuEnConsignacion = window.productosConsignacion[l];
                if (skuEnConsignacion.SKU == skuOrdenDeVenta.SKU && skuOrdenDeVenta.SERIE == skuEnConsignacion.SERIE) {
                    existeEnConsignacion = true;
                    index = l;
                    break;
                }
            }
        }

        switch (existeEnConsignacion) {
            case true:
                skuObject = {
                    IS_KIT: skuEnConsignacion.IS_KIT,
                    LINE_SEQ: skuEnConsignacion.LINE_SEQ,
                    ON_HAND: skuEnConsignacion.ON_HAND,
                    PRICE: skuEnConsignacion.PRICE,
                    QTY_CONSIGNMENT: (skuEnConsignacion.QTY_CONSIGNMENT + cantidadAConsignar),
                    REQUERIES_SERIE: skuEnConsignacion.REQUERIES_SERIE,
                    SERIE: skuEnConsignacion.SERIE,
                    SERIE_2: skuEnConsignacion.SERIE_2,
                    SKU: skuEnConsignacion.SKU,
                    SKU_NAME: skuEnConsignacion.SKU_NAME,
                    TOTAL_LINE: (parseInt(skuEnConsignacion.QTY_CONSIGNMENT) + parseInt(cantidadAConsignar)) * skuEnConsignacion.PRICE
                };

                window.productosConsignacion[index] = skuObject;
                break;

            case false:
                skuObject = {
                    IS_KIT: skuOrdenDeVenta.IS_KIT,
                    LINE_SEQ: skuOrdenDeVenta.LINE_SEQ,
                    ON_HAND: skuOrdenDeVenta.ON_HAND,
                    PRICE: skuOrdenDeVenta.PRICE,
                    QTY_CONSIGNMENT: (cantidadAConsignar),
                    REQUERIES_SERIE: skuOrdenDeVenta.REQUERIES_SERIE,
                    SERIE: skuOrdenDeVenta.SERIE,
                    SERIE_2: skuOrdenDeVenta.SERIE_2,
                    SKU: skuOrdenDeVenta.SKU,
                    SKU_NAME: skuOrdenDeVenta.SKU_NAME,
                    TOTAL_LINE: (cantidadAConsignar) * skuOrdenDeVenta.PRICE
                };

                window.productosConsignacion.push(skuObject);
                break;
        }

        skuObject = {
            IS_KIT: skuOrdenDeVenta.IS_KIT
            , LINE_SEQ: skuOrdenDeVenta.LINE_SEQ
            , ON_HAND: skuOrdenDeVenta.ON_HAND
            , PRICE: skuOrdenDeVenta.PRICE
            , QTY: (parseInt(skuOrdenDeVenta.QTY) - parseInt(cantidadAConsignar))
            , REQUERIES_SERIE: skuOrdenDeVenta.REQUERIES_SERIE
            , SERIE: skuOrdenDeVenta.SERIE
            , SERIE_2: skuOrdenDeVenta.SERIE_2
            , SKU: skuOrdenDeVenta.SKU
            , SKU_NAME: skuOrdenDeVenta.SKU_NAME
            , TOTAL_LINE: (parseInt(skuOrdenDeVenta.QTY) - parseInt(cantidadAConsignar)) * skuOrdenDeVenta.PRICE
        }
        window.gSkuList[indice] = skuObject;

        skuObject = {};
        skuEnConsignacion = {};
        existeEnConsignacion = false;
        index = null;
        indice = null;
        cantidadAConsignar = null;
        if (refrescarLista) {
            CrearListadoDeProductosEnVenta(function () {
            });
        }
    } catch (e) {
        notify(e.message);
    }
}

function UsuarioDeseaQuitarProductoAConsignacion(skuConsignacion, indice) {
    try {
        var skuObject = {};

        for (var l = 0; l < window.gSkuList.length; l++) {
            var skuOrdenDeVenta = window.gSkuList[l];
            if (skuOrdenDeVenta.SKU == skuConsignacion.SKU && skuOrdenDeVenta.SERIE == skuConsignacion.SERIE) {
                skuObject = {
                    IS_KIT: skuOrdenDeVenta.IS_KIT,
                    LINE_SEQ: skuOrdenDeVenta.LINE_SEQ,
                    ON_HAND: skuOrdenDeVenta.ON_HAND,
                    PRICE: skuOrdenDeVenta.PRICE,
                    QTY: (parseInt(skuOrdenDeVenta.QTY) + parseInt(skuConsignacion.QTY_CONSIGNMENT)),
                    REQUERIES_SERIE: skuOrdenDeVenta.REQUERIES_SERIE,
                    SERIE: skuOrdenDeVenta.SERIE,
                    SERIE_2: skuOrdenDeVenta.SERIE_2,
                    SKU: skuOrdenDeVenta.SKU,
                    SKU_NAME: skuOrdenDeVenta.SKU_NAME,
                    TOTAL_LINE: (parseInt(skuOrdenDeVenta.QTY) + parseInt(skuConsignacion.QTY_CONSIGNMENT)) * skuConsignacion.PRICE
                };
                window.gSkuList[l] = skuObject;
                window.productosConsignacion.splice(indice, 1);
                break;
            }
        }
    } catch (e) {
        notify(e.message);
    }
}

function LlenarListaDeConsginacion() {
    try {

        var listaSkusDeConsignacion = $("#UiListaSkusEnConsignacion");
        listaSkusDeConsignacion.children().remove("li");
        var totalEnConsignacion = 0;

        if (productosConsignacion.length > 0) {

            for (var i = 0; i < window.productosConsignacion.length; i++) {
                var li = "";
                var sku = window.productosConsignacion[i];
                li = "<li id='" + sku.SKU + "' class='small-roboto'>";
                //li += "<a href='#'>";
                li += "<p>";
                li += "<span><strong>SKU: </strong>" + sku.SKU + "</span>";
                li += "<br><span>" + sku.SKU_NAME + "</span>";
                if (sku.REQUERIES_SERIE === 1) {
                    li += "<br><span><strong>Serie: </strong>" + sku.SERIE + "</span>";
                }
                li += "<br><span><strong>Cantidad: </strong>" + sku.QTY_CONSIGNMENT + "<strong> Precio: </strong>" + currencySymbol + " " + sku.PRICE + "<strong> Total: </strong>" + currencySymbol + " " + (parseInt(sku.QTY_CONSIGNMENT) * parseFloat(sku.PRICE)) + "</span>";
                li += "</p>";
                //li += "</a>";
                li += "</li>";
                listaSkusDeConsignacion.append(li);
                listaSkusDeConsignacion.listview("refresh");
                totalEnConsignacion += (parseInt(sku.QTY_CONSIGNMENT) * parseFloat(sku.PRICE));
            }
        }
        document.getElementById("UiLblTotalEnConsignacion").textContent = currencySymbol + " " + format_number(totalEnConsignacion, 2);
    } catch (e) {
        alert(e.message);
    }
}

function LlenarListaDeProductosParaConsignacionPorSku() {
    try {
        CrearListadoDeProductosEnVenta(function () {
            LlenarListaDeConsginacion();
            LlenarDetalleFinalDeConsignacion();
        });

    } catch (e) {
        notify(e.message);
    }
}

function LlenarListaDeProdcutos() {
    try {
        ObtenerSkus(function () {
            consignacion = {};
            AjustarFactura(function () {
                CrearListadoDeProductosEnVenta(function () {
                    LlenarListaDeConsginacion();
                    LlenarDetalleFinalDeConsignacion();
                });
            });
        }, function (error) {
            notify(error);
        });
    } catch (e) {
        notify(e.message);
    }
}

function AjustarFactura(callBack) {
    try {
        var total = 0;
        var i, j, sku, cantidad;
        //for (i = 0; i < window.gSkuList.length; i++) {
        //    sku = window.gSkuList[i];
        //    var totalSku = (parseInt(sku.QTY) * parseInt(sku.PRICE));
        //    if (total < cantidadDisponibleParaConsignacion && totalSku <= cantidadDisponibleParaConsignacion) {
        //        UsuarioDeseaAgregarProductoAConsignacion(sku, i, parseInt(sku.QTY), false);
        //        total += totalSku;
        //    }
        //}

        if (total < cantidadDisponibleParaConsignacion) {
            for (i = 0; i < window.gSkuList.length; i++) {
                sku = window.gSkuList[i];
                cantidad = parseFloat(sku.QTY);
                for (j = 0; j < cantidad; j++) {
                    if ((total + parseInt(sku.PRICE)) <= cantidadDisponibleParaConsignacion) {
                        UsuarioDeseaAgregarProductoAConsignacion(sku, i, 1, false);
                        total += parseFloat(sku.PRICE);
                        sku = window.gSkuList[i];
                    } else {
                        break;
                    }
                }
            }
            callBack();
        } else {
            callBack();
        }
    } catch (e) {
        notify(e.message);
    }
}

function CrearListadoDeProductosEnVenta(callBack) {
    try {
        var listaSkusOrdenDeVenta = $("#UiListaSkusOrdenDeVenta");
        listaSkusOrdenDeVenta.children().remove("li");
        var totalEnVenta = 0;
        if (!window.facturaCompletaEnConsignacion) {
            if (window.gSkuList.length > 0) {
                for (var i = 0; i < window.gSkuList.length; i++) {
                    var sku = window.gSkuList[i];
                    if (parseFloat(sku.QTY) > 0) {
                        var li = "";
                        li = "<li id='" + sku.SKU + "' class='small-roboto'>";
                        //li += "<a href='#'>";
                        li += "<p>";
                        li += "<span><strong>SKU: </strong>" + sku.SKU + "</span>";
                        li += "<br>" + sku.SKU_NAME + "</span>";
                        if (sku.REQUERIES_SERIE === 1) {
                            li += "<br><span><strong>Serie: </span>" + sku.SERIE + "</span>";
                        }
                        li += "<br><span><strong>Cantidad: </strong>" + sku.QTY + "<strong> Precio: </strong>" + currencySymbol + " " + sku.PRICE + "<strong> Total: </strong>" + currencySymbol + " " + (parseInt(sku.QTY) * parseFloat(sku.PRICE)) + "</span>";
                        li += "</p>";
                        //li += "</a>";
                        li += "</li>";
                        listaSkusOrdenDeVenta.append(li);
                        listaSkusOrdenDeVenta.listview("refresh");
                        totalEnVenta += (parseFloat(sku.QTY) * parseFloat(sku.PRICE));
                    }
                }
                callBack();
            } else {
                callBack();
            }
        } else {
            callBack();
        }
        document.getElementById("UiLblTotalEnVenta").textContent = currencySymbol + " " + format_number(totalEnVenta, 2);
    } catch (e) {
        notify(e.message);
    }
}

function LlenarDetalleFinalDeConsignacion() {
    try {
        //var detalleProductosEnVenta = $("#UiDetalleProductosEnVenta");
        //var detalleProductosEnConsignacion = $("#UiDetalleProductosEnConsignacion");
        //detalleProductosEnVenta.children().remove("li");
        //detalleProductosEnConsignacion.children().remove("li");

        var totalSkusEnVenta = 0;
        var totalSkusEnConsignacion = 0;
        var totalGeneral = 0;

        if (!window.facturaCompletaEnConsignacion) {
            window.gSkuList.forEach(function (sku) {
                if (sku.QTY > 0) {
                    var total = parseFloat(sku.QTY) * parseFloat(sku.PRICE);
                    totalSkusEnVenta += total;
                }
            });
        }

        window.productosConsignacion.forEach(function (sku) {
            if (sku.QTY_CONSIGNMENT > 0) {
                var total = parseFloat(sku.QTY_CONSIGNMENT) * parseFloat(sku.PRICE);
                totalSkusEnConsignacion += total;
            }
        });

        totalGeneral = (totalSkusEnVenta + totalSkusEnConsignacion);

        document.getElementById("UiLblResumenTotalEnVenta").textContent = currencySymbol + " " + format_number(totalSkusEnVenta, 2);
        document.getElementById("UiLblResumenTotalEnConsignacion").textContent = currencySymbol + " " + format_number(totalSkusEnConsignacion, 2);
        document.getElementById("UiLblResumenTotalGeneral").textContent = currencySymbol + " " + format_number(totalGeneral, 2);


        //if (window.gSkuList.length > 0) {
        //    for (var i = 0; i < window.gSkuList.length; i++) {
        //        var item = window.gSkuList[i];
        //        var li = "";

        //        if (i === 0) {
        //            var liDivider = "<li data-role='list-divider'>SKU(s) En Venta: <span class='ui-li-count'>" + totalSkusEnVenta + "</span></li>";
        //            detalleProductosEnVenta.append(liDivider);
        //            detalleProductosEnVenta.listview("refresh");

        //            liDivider = null;
        //        }

        //        if (parseInt(item.QTY) > 0) {
        //            li = "<li>";
        //            li += "<a href='#'>";
        //            li += "<h2>" + item.SKU + "</h2>";
        //            li += "<p><strong>" + item.SKU_NAME + "</strong></p>";
        //            li += "<span class='ui-li-count'>" + item.QTY + "</span>";
        //            li += "</a>";
        //            li += "</li>";

        //            detalleProductosEnVenta.append(li);
        //            detalleProductosEnVenta.listview("refresh");
        //        }

        //        li = null;
        //        item = null;
        //    }
        //} else {
        //    var liDividerEnCero = "<li data-role='list-divider'>SKU(s) En Venta: <span class='ui-li-count'>" + totalSkusEnVenta + "</span></li>";
        //    detalleProductosEnVenta.append(liDividerEnCero);
        //    detalleProductosEnVenta.listview("refresh");
        //    liDividerEnCero = null;
        //}

        //if (window.productosConsignacion.length > 0) {
        //    for (var j = 0; j < window.productosConsignacion.length; j++) {
        //        var itemConsignacion = window.productosConsignacion[j];
        //        var liConsig = "";

        //        if (j === 0) {
        //            var liDividerConsig = "<li data-role='list-divider'>Total En Consignación: <span class='ui-li-count'>" + window.productosConsignacion.length + "</span></li>";
        //            detalleProductosEnConsignacion.append(liDividerConsig);
        //            detalleProductosEnConsignacion.listview("refresh");
        //            liDividerConsig = null;
        //        }
        //        liConsig = "<li>";
        //        liConsig += "<a href='#'>";
        //        liConsig += "<h2>" + itemConsignacion.SKU + "</h2>";
        //        liConsig += "<p><strong>" + itemConsignacion.SKU_NAME + "</strong></p>";
        //        liConsig += "<span class='ui-li-count'>" + itemConsignacion.QTY_CONSIGNMENT + "</span>";
        //        liConsig += "</a>";
        //        liConsig += "</li>";

        //        detalleProductosEnConsignacion.append(liConsig);
        //        detalleProductosEnConsignacion.listview("refresh");

        //        liConsig = null;
        //        itemConsignacion = null;
        //    }
        //} else {
        //    var liDividerConsigEnCero = "<li data-role='list-divider'>Total En Consignación: <span class='ui-li-count'>" + window.productosConsignacion.length + "</span></li>";
        //    detalleProductosEnConsignacion.append(liDividerConsigEnCero);
        //    detalleProductosEnConsignacion.listview("refresh");
        //    liDividerConsigEnCero = null;
        //}


        //detalleProductosEnVenta = null;
        //detalleProductosEnConsignacion = null;

    } catch (e) {
        notify(e.message);
    }
}

function UsuarioDeseaGrabarConsignacion(callBack) {
    try {
        conConsignacion = 0;
        var consignacionDetalle = new Array();
        //var conConsignacion = 0;
        var totalAmount = 0;
        var docSerie = "";
        var docNum = -1;

        for (var i = 0; i < window.productosConsignacion.length; i++) {
            var skuTemporal = window.productosConsignacion[i];
            totalAmount += skuTemporal.TOTAL_LINE;
            consignacionDetalle.push(skuTemporal);
        }

        if (window.productosConsignacion.length > 0) {
            PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.Consignacion, function (serie, numero) {
                docSerie = serie;
                docNum = numero;
                var consignacionEncabezado = {
                    ConsignmentId: ObtenerSiguienteNumeroDeConsignacion(),
                    CustomerId: gClientCode,
                    DateCreate: getDateTime().toString(),
                    DateUpdate: null,
                    Status: "ACTIVE",
                    PostedBy: gCurrentRoute,
                    IsPosted: 0,
                    Pos_terminal: gCurrentRoute,
                    Gps: gCurrentGPS,
                    DocDate: getDateTime().toString(),
                    ClosedRouteDateTime: null,
                    IsActiveRoute: 1,
                    DueDate: null,
                    ConsignmentBoNum: null,
                    DocSerie: serie,
                    DocNum: numero,
                    Image: imagenConsignacion,
                    IsClosed: 0,
                    IsReconsign: 0,
                    InRoute: 1,
                    TotalAmount: totalAmount,
                    ConsignmentType: tipoDeConsignacion
                }

                consignacion = {
                    encabezado: consignacionEncabezado,
                    detalle: consignacionDetalle
                }
                MarcarSeriesUtilizadasEnConsignacion(consignacion, function (consignacion) {
                    GrabarConsignacion(consignacion, function () {
                        PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.Consignacion, docNum, function () {
                            ToastThis("Consignacion Grabada Exitosamente");
                            conConsignacion = 1;
                            callBack(conConsignacion);
                            //usuarioDeseaRetornarAFinalizarVenta(); 
                        }, function (error) {
                            notify(error);
                        });
                    });
                }, function (error) {
                    notify(error);
                });

            }, function (error) {
                notify(error);
            });
        } else {
            callBack(conConsignacion);
        }

    } catch (e) {
        notify(e.message);
    }
}

function UsuarioDeseaCancelarConsignacion() {
    try {

        QuitarSkusDeConsignacion();

        ActualizarDatosDeFacturacion();
        usuarioDeseaRetornarAFinalizarVenta();
        document.getElementById("UiLblDetalleTotalEnConsignacion").textContent = currencySymbol + ". 0.00";
        vistaCargandosePorPrimeraVez = true;
        facturaActualTieneConsignacion = false;
        imagenConsignacion = "";

    } catch (e) {
        notify(e.message);
    }
}

function QuitarSkusDeConsignacion() {
    try {
        while (window.productosConsignacion.length > 0) {
            var sku = window.productosConsignacion[0];
            UsuarioDeseaQuitarProductoAConsignacion(sku, 0);
        }
    } catch (e) {
        notify(e.message);
    }
}

function ActualizarDatosDeFacturacion() {
    try {
        var lblTotal = $("#lblTotalSKU_summ");
        var totalEnVenta = 0;
        var totalEnConsignacion = 0;

        for (var i = 0; i < window.gSkuList.length; i++) {
            var skuTemp = window.gSkuList[i];

            if (parseFloat(skuTemp.QTY) > 0) {
                totalEnVenta += parseFloat(skuTemp.TOTAL_LINE);
            }
        }

        window.productosConsignacion.forEach(function (sku) {
            if (parseInt(sku.QTY_CONSIGNMENT) > 0) {
                totalEnConsignacion += parseFloat(sku.TOTAL_LINE);
            }
        });

        lblTotal.text(format_number(totalEnVenta, 2));
        document.getElementById("UiLblDetalleTotalEnConsignacion").textContent = currencySymbol + ". " + format_number(totalEnConsignacion, 2);
        facturaCompletaEnConsignacion = totalEnVenta === 0 ? true : false;
        facturaActualTieneConsignacion = true;
        window.gUsuarioEntraAResumenDeFacturacionDesdeListadoDeSkus = false;

        usuarioDeseaRetornarAFinalizarVenta();

    } catch (e) {
        notify(e.message);
    }
}

function LimpiarDatosConsignacion() {
    try {
        window.gSkuList.length = 0;
        window.facturaCompletaEnConsignacion = false;
        window.productosConsignacion.length = 0;
        window.facturaActualTieneConsignacion = false;
        window.vistaCargandosePorPrimeraVez = true;
        window.cantidadEfectivo = "";
        window.consignacion = {};
        window.cantidadEfectivo = 0;
        window.cantidadTotal = 0;
        window.cantidadDisponibleParaConsignacion = 0;
    } catch (e) {
        notify(e.message);
    }
}