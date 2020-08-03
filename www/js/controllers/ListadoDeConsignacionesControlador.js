var consignacionId = 0;
var clientIdPrint = null;
var resumenConsignacion = {};

//------------- DELEGADO -----------------------------
function delegarListadoDeConsignacionesControlador() {

    $("#UiBtnViewConsignmentList").on("click",
        function() {
            $.mobile.changePage("#PageConsignmentList",
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        });
    
    $("#PageConsignmentList").on("pageshow", function() {
        CargarListaDeConsignaciones();
    });

    $("#PageConsignmentList").on("click", "#UiListaDeConsignaciones li", function(e) {
        var id = e.currentTarget.attributes["id"].nodeValue;
        var client = e.currentTarget.attributes["CUSTOMER_ID"].nodeValue;
        var estado = e.currentTarget.attributes["STATUS"].nodeValue;
        var enRuta = e.currentTarget.attributes["IN_ROUTE"].nodeValue;

        var listPicker = function(configuracion) {
            window.plugins.listpicker.showPicker(configuracion,
                function(item) {
                    consignacionId = parseInt(id);
                    clientIdPrint = client;
                    switch (item) {
                    case "detail":
                        MostrarDetalleDeConsignacion(id, function() {
                            $.mobile.changePage("#UiVentanaDetalleConsignacion", {
                                transition: "pop",
                                reverse: true,
                                changeHash: true,
                                showLoadMsg: false
                            });
                        });
                        break;

                    case "void":
                        if (enRuta === "undefined" || enRuta === "null" || enRuta === null) {
                            notify("Esta consignación no se puede Anular debido a que no ha sido creada en el plan de ruta actual.");
                        } else {
                            ClasificacionesServicio.ObtenerRasones(TiposDeRazones.AnulacionConsignacion,
                                function(razones) {
                                    if (razones.length > 0) {
                                        var listaRazones = new Array();
                                        for (var i = 0; i < razones.length; i++) {
                                            var item = { text: razones[i].REASON_PROMPT, value: razones[i].REASON_VALUE };
                                            listaRazones.push(item);
                                        }

                                        var configOptions = {
                                            title: "¿Por qué desea Anular la Consignación?: ",
                                            items: listaRazones,
                                            doneButtonLabel: "OK",
                                            cancelButtonLabel: "CANCELAR"
                                        }

                                        window.plugins.listpicker.showPicker(configOptions, function(item) {
                                            AnularConsigacion(consignacionId, item,
                                                function(consignacionIdReturn) {
                                                    AgregarSkuDeConsigacionAInventario(consignacionIdReturn, function() {
                                                        EnviarData();
                                                        CargarListaDeConsignaciones();
                                                    }, function(error) {
                                                        notify(error);
                                                    });
                                                }, function(error) {
                                                    notify(error);
                                                });
                                        });
                                    } else {
                                        notify("Lo sentimos, no se han encontrado razones de No Facturación, por favor, intente nuevamente.");
                                    }
                                }, function(error) {
                                    notify(error);
                                });
                        }
                    }

                }
            );
        }

        if (id !== "divider") {

            var config = {}
            if (estado === ConsignmentStatus.Activa || estado === ConsignmentStatus.Vencida) {
                config = {
                    title: "Seleccione una acción",
                    items: [
                        { text: "Ver Detalle", value: "detail" }
                        , { text: "Anular", value: "void" }
                    ]
                };
                listPicker(config);
            } else if (estado === ConsignmentStatus.Cancelada || estado === ConsignmentStatus.Anulada) {
                config = {
                    title: "Seleccione una acción",
                    items: [
                        { text: "Ver Detalle", value: "detail" }
                    ]
                };
                listPicker(config);
            } 

        }
    });

    $("#UiBtnVolverAMenu").on("click", function() {
        $.mobile.changePage("#menu_page", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    });

    $("#UiBtnRecargarListaDeConsignaciones").on("click", function() {
        CargarListaDeConsignaciones();
    });

    $("#UiBtnVolver").on("click", function () {
        consignacionId = 0;
        $.mobile.changePage("#PageConsignmentList", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    });

    $("#UiBtnImprimirDetalleDeconsignacion").on("click", function() {
        ReimprimirConsignacion();
    });
}

//------------- FUNCIONES ----------------------------
function CargarListaDeConsignaciones() {
    try {
        var objetoLista = $("#UiListaDeConsignaciones");
        objetoLista.children().remove("li");

        ObtenerConsignaciones(function(encabezadoConsignaciones) {
            if (encabezadoConsignaciones.length > 0) {

                for (var i = 0; i < encabezadoConsignaciones.length; i++) {
                    var consignacionEncabezado = encabezadoConsignaciones[i];
                    var li = "";

                    var fecha = "";

                    if (consignacionEncabezado.DateCreate.toString().indexOf("T") > -1) {
                        fecha = consignacionEncabezado.DateCreate.toString().split("T")[0];
                    } else {
                        fecha = consignacionEncabezado.DateCreate.toString().split(" ")[0];
                    }

                    li = "<li id='" + consignacionEncabezado.ConsignmentId +
                            "' CUSTOMER_ID='" + consignacionEncabezado.CustomerId +
                            "' STATUS=" + consignacionEncabezado.Status + " IN_ROUTE = " + consignacionEncabezado.InRoute + ">";

                    if (consignacionEncabezado.Status === ConsignmentStatus.Anulada) {
                        li += "<a href='#' style='background-color: #FFA6A6'>";
                    } else {
                        li += "<a href='#'>";
                    }
                    if (consignacionEncabezado.Status === ConsignmentStatus.Cancelada) {
                        li += '<p style="background-color: green;width:1em;height:1em;float: left"></p>';
                    } else if (consignacionEncabezado.Status === ConsignmentStatus.Vencida) {
                        li += '<p style="background-color: red;width:1em;height:1em;float: left"> </p>';
                    } else if (consignacionEncabezado.Status === ConsignmentStatus.Activa) {
                        li += "";
                    }
                    li += "<h2>" + (i + 1) + ") " + consignacionEncabezado.ConsignmentId === consignacionEncabezado.ConsignmentBoNum ? consignacionEncabezado.ConsignmentId : consignacionEncabezado.ConsignmentBoNum + "</h2>";
                    li += "<p><strong>Cliente: " + consignacionEncabezado.CustomerId + "</strong></p>";
                    li += "<p><strong>Fecha: " + fecha + " </strong></p>";
                    li += "<span class='ui-li-count'><strong>" + currencySymbol + ". " + format_number(consignacionEncabezado.TotalAmount, 2) + " </strong></span>";
                    li += "</a>";
                    li += "</li>";

                    objetoLista.append(li);
                    objetoLista.listview("refresh");

                }
            }
            //objetoLista.trigger("create");
        }, function(error) {
            notify(error.message);
        });

    } catch (e) {
        notify(e.message);
    }
}

function MostrarDetalleDeConsignacion(consignacionId,callBack) {
    try {

        var objetoDetalle = $("#UiDetalleConsignacion");
        objetoDetalle.children().remove("li");
        var totalConsignacion = 0;

        ObtenerDetallePorConsignacion(consignacionId,0, function (detalleConsignacion,index) {

            if (detalleConsignacion.length > 0) {

                for (var i = 0; i < detalleConsignacion.length; i++) {
                    var itemDetalle = detalleConsignacion[i];
                    var li = "";

                    li = "<li>";
                    li += "<a href='#'>";
                    li += "<h2>" + itemDetalle.SKU + "</h2>";
                    li += '<h3 style="width: 70%">'+itemDetalle.SKU_NAME + "</h3>";
                    li += "<p>";
                    li += "<strong>Cantidad: </strong> " + itemDetalle.QTY_CONSIGNMENT;
                    li += "<strong> Precio: </strong> " + currencySymbol + " " + itemDetalle.PRICE;
                    if (itemDetalle.HANDLE_SERIAL === "1" || itemDetalle.HANDLE_SERIAL === 1) {
                        li += "<br><strong>Serie: </strong>" + itemDetalle.SERIAL_NUMBER;
                    }
                    li += "</p>";
                    li += "<span class='ui-li-count'><strong>" + currencySymbol + ". " + itemDetalle.TOTAL_LINE + " </strong></span>";
                    li += "</a>";
                    li += "</li>";

                    objetoDetalle.append(li);
                    objetoDetalle.listview("refresh");
                    totalConsignacion += itemDetalle.TOTAL_LINE;
                }

            }
            document.getElementById("UiLblDetalleConsignacionTotal").textContent = currencySymbol + ". " + format_number(totalConsignacion, 2);
        }, function(error) {
            notify(error.message);
        });
        callBack();
    } catch (e) {
        notify(e.message);
    } 
}

function ReimprimirConsignacion() {
    try {
        my_dialog("Imprimiendo Recibo", "Por favor, espere...", "open");
        var encabezado;
        ObtenerConsignacion(consignacionId, function(consignacion) {
            if (consignacion !== undefined) {
                encabezado = consignacion;
                ObtenerDetallePorConsignacion(consignacion.ConsignmentId, 0, function(detalle, index) {
                    resumenConsignacion = {
                        encabezado: encabezado,
                        detalle: detalle
                    }
                    ObtenerFormatoDeImpresionConsignacion(resumenConsignacion, function (formato) {
                        ImprimirDocumento(formato, function () {
                            my_dialog("", "", "close");
                        }, function () {
                            my_dialog("", "", "close");
                            notify("Lo sentimos, no ha sido posible imprimir el Detalle de Consignacion...");
                        });
                    });
                }, function (error) {
                    my_dialog("", "", "close");
                    notify(error);
                });
            }
        }, function (error) {
            my_dialog("", "", "close");
            notify(error);
        });
    } catch (e) {
        notify(e.message);
    } 
}