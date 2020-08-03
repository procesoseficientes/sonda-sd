var consignacionesEnProcedimientoDePago = new Array();

var PagoConsignacionesControlador = {
    DelegarPagoConsignacionesControlador: function() {
        $("#UiPageConsignmentPayment").on("pageshow", function () {
            my_dialog("Procesando", "Procesando Consignaciones, por favor, espere...", "open");

            if (PagoConsignacionesControlador.EstaEnPagoDeConsignacion) {
                PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                my_dialog("Procesando", "Procesando Consignaciones, por favor, espere...", "close");
            } else if (PagoConsignacionesControlador.EstaEnIngresoDeCantidadSku) {
                PagoConsignacionesControlador.EstaEnIngresoDeCantidadSku = false;
                PagoConsignacionesControlador.MostrarDetalleDeConsignacionAPagar(PagoConsignacionesControlador.ConsignacionId);
                my_dialog("Procesando", "Procesando Consignaciones, por favor, espere...", "close");
            }
            else {
                document.getElementById("UiTotalCash").innerText = currencySymbol + ". "+ "0.00";
                document.getElementById("UiTotalConsignacion").innerText = currencySymbol + ". " + "0.00";
                document.getElementById("UiTotalRecogido").innerText = currencySymbol + ". " + "0.00";

                if (window.consignacionesEnProcedimientoDePago.length > 0) {
                    PagoConsignacionesControlador.MostrarListadoDeConsignacionesDeCliente(window.consignacionesEnProcedimientoDePago);
                    my_dialog("Procesando", "Procesando Consignaciones, por favor, espere...", "close");
                } else {
                    
                    var procesarConsignaciones = function() {
                        PagoConsignacionesServicio.AgregarConsignacionesATablasTemporales(
                            window.consignacionesEnProcedimientoDePago, function() {
                                PagoConsignacionesControlador.MostrarListadoDeConsignacionesDeCliente(window.consignacionesEnProcedimientoDePago);
                                my_dialog("Procesando", "Procesando Consignaciones, por favor, espere...", "close");
                            }, function(error) {
                                notify(error);
                            });
                    };

                    PagoConsignacionesServicio.ObtenerConsignacionesPorCliente(gClientCode, function(consignaciones) {
                        if (consignaciones.length > 0) {
                            for (var i = 0; i < consignaciones.length; i++) {
                                if (parseInt(consignaciones[i].CONSIGNMENT_BO_NUM) < 0) {
                                    my_dialog("Procesando", "Procesando Consignaciones, por favor, espere...", "close");
                                    notify("Lo sentimos, no se puede continuar debido a que aun no se han sincronizado todas las consignaciones con el servidor.\r\n " +
                                        "Por favor, asegurese de tener conexión al servidor para sincronizar la información y vuelva a intentar.");
                                    break;
                                } else {
                                    ObtenerDetallePorConsignacion(consignaciones[i].CONSIGNMENT_ID, i, function (detalle, indice) {
                                        if (detalle === undefined || detalle === null) {
                                            notify("Lo sentimos, una de las consignaciones no posee detalle, por favor, verifique y vuelva a intentar.");
                                        } else {
                                            consignaciones[indice].CONSIGNMENT_DETAIL = detalle;
                                        }
                                        if (indice === consignaciones.length - 1) {
                                            window.consignacionesEnProcedimientoDePago = consignaciones;
                                            procesarConsignaciones();
                                        }
                                    }, function (err) {
                                        notify(err.message);
                                    });
                                }
                            }
                        } else {
                            my_dialog("Procesando", "Procesando Consignaciones, por favor, espere...", "close");
                            notify("El Cliente " + gClientCode + " no tiene consignaciones activas y/o vencidas.");
                        }
                    }, function(error) {
                        notify(error.message);
                    });
                }
            }
        });

        $("#UiPageConsignmentPayment").on("click", "#UiListaConsignacionesAPagar a", function(e) {
            var id = e.currentTarget.attributes["id"].nodeValue;
            var docSerie = e.currentTarget.attributes["DOC_SERIE"].nodeValue;
            var docNum = e.currentTarget.attributes["DOC_NUM"].nodeValue;
            

            if (id.toString().indexOf("_") > -1) {
                var idSplit = id.toString().split("_");

                switch (idSplit[0]) {
                case "CH":
                    PagoConsignacionesControlador.MostrarOpcionesDeEncabezadoConsignacion(id,docSerie,parseInt(docNum));
                    break;

                case "CD":
                    document.getElementById("DivUiListaConsignacionesAPagar").style.display = "none";
                    document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "block";
                    PagoConsignacionesControlador.docSerieParaDetalle = docSerie;
                    PagoConsignacionesControlador.docNumParaDetalle = parseInt(docNum);
                    PagoConsignacionesControlador.MostrarDetalleDeConsignacionAPagar(parseInt(idSplit[1]));
                    PagoConsignacionesControlador.EstaEnDetalle = true;
                    break;
                }
            }
        });

        $("#UiPageConsignmentPayment").on("click", "#UiListaDetalleDeConsignacionAPagar a", function(e) {
            var sku = e.currentTarget.attributes["id"].nodeValue;
            var skuName = e.currentTarget.attributes["SKU_NAME"].nodeValue;
            var qtySkuEnConsignacion = e.currentTarget.attributes["QTY"].nodeValue;
            var totalLine = e.currentTarget.attributes["TOTAL"].nodeValue;
            var consignmentHeader = e.currentTarget.attributes["HEADER"].nodeValue;
            var priceSku = e.currentTarget.attributes["PRICE"].nodeValue;
            var docSerie = e.currentTarget.attributes["DOC_SERIE"].nodeValue;
            var docNum = e.currentTarget.attributes["DOC_NUM"].nodeValue;
            var handleSerial = e.currentTarget.attributes["HANDLE_SERIAL"].nodeValue;

            priceSku = parseFloat(priceSku);
            if (parseFloat(qtySkuEnConsignacion) === 0) {
                navigator.notification.confirm(
                    "El SKU ya se encuentra en procedimiento de pago.\r\n Desea Restablecer la última opción seleccionada?", function(buttonIndex) {
                        if (buttonIndex === 2) {
                            PagoConsignacionesControlador.ConsignacionId = parseInt(consignmentHeader);
                            PagoConsignacionesServicio.RestablecerOpcionDePagoDeDetalleDeconsignacion(consignmentHeader, sku, function() {
                                PagoConsignacionesControlador.MostrarDetalleDeConsignacionAPagar(parseInt(consignmentHeader));
                                PagoConsignacionesControlador.CalcularPagoCash();
                            }, function(error) {
                                notify(error);
                            });
                        }
                    }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
            } else {
                PagoConsignacionesControlador.MostrarOpcionesDeDetalleDeConsignacion(sku, skuName, parseFloat(totalLine), consignmentHeader, qtySkuEnConsignacion, priceSku, docSerie, docNum, handleSerial);
            }
        });

        $("#UiBtnProcesarConsignacion").on("click", function () {
            var totalEnProcesoDeConsignacion = document.getElementById("UiBtnTotalEnProcesoDeConsignacion").innerText.replace(currencySymbol + ".", "").trimLeft();;
            //totalEnProcesoDeConsignacion = totalEnProcesoDeConsignacion.replace(currencySymbol + ".", "").trimLeft();
            totalEnProcesoDeConsignacion = (1 * parseFloat(totalEnProcesoDeConsignacion).toFixed(2));

            var totalCash = document.getElementById("UiTotalCash").innerText.replace(currencySymbol + ".", "").trimLeft();;
            var totalConsignado = document.getElementById("UiTotalConsignacion").innerText.replace(currencySymbol + ".", "").trimLeft();;
            var totalRecogido = document.getElementById("UiTotalRecogido").innerText.replace(currencySymbol + ".", "").trimLeft();;
            var granTotal = (parseFloat(totalCash) + parseFloat(totalConsignado) + parseFloat(totalRecogido));
            granTotal = (1 * parseFloat(granTotal).toFixed(2));

            var mensajeRecogerProducto = "";

            if (granTotal < totalEnProcesoDeConsignacion) {
                notify("No ha cuadrado el total de pago de consignaciones, por favor, verifique y vuelva a intentar.");
            } else if (granTotal === totalEnProcesoDeConsignacion) {
                PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;

                PagoConsignacionesControlador.totalRecogido = totalRecogido;
                PagoConsignacionesControlador.totalReconsignado = totalConsignado;
                PagoConsignacionesControlador.totalEfectivo = totalCash;
                PagoConsignacionesControlador.totalEnProcesoDeConsignacion = totalEnProcesoDeConsignacion;
                PagoConsignacionesControlador.granTotal = granTotal;

                if (parseFloat(totalRecogido) > 0 ) {
                    if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length === 0) {
                        mensajeRecogerProducto = "Puede tomar 3 fotografías del producto recogido, desea Capturar la Primera Imágen?";
                        PagoConsignacionesControlador.MostrarMensajeDeCapturaDeFotografias(mensajeRecogerProducto, function() {
                            if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length === 0) {
                                notify("Debe tomar al menos Una Fotografía, de lo contrario, no se podrá continuar");
                            } else if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length === 1) {
                                mensajeRecogerProducto = "Desea Capturar la Segunda Imágen?";
                                PagoConsignacionesControlador.MostrarMensajeDeCapturaDeFotografias(mensajeRecogerProducto, function() {
                                    if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length === 2) {
                                        mensajeRecogerProducto = "Desea Capturar la Tercera Imágen?";

                                        PagoConsignacionesControlador.MostrarMensajeDeCapturaDeFotografias(mensajeRecogerProducto, function () {

                                            if (parseFloat(totalConsignado > 0)) {
                                                navigator.notification.confirm(
                                                    "Debe Capturar una imágen del producto Reconsignado. Desea Capturarla?", function(buttonIndex) {
                                                        if (buttonIndex === 2) {
                                                            PagoConsignacionesControlador.TomarFotografiaDeProductoReconsignado(function() {
                                                                PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                    PagoConsignacionesControlador.totalEfectivo
                                                                    , PagoConsignacionesControlador.totalReconsignado
                                                                    , PagoConsignacionesControlador.totalRecogido
                                                                    , PagoConsignacionesControlador.granTotal
                                                                    );
                                                            },function(error) {
                                                                notify(error);
                                                            });
                                                        }
                                                    }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                                            } else {
                                                PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                    PagoConsignacionesControlador.totalEfectivo
                                                                    , PagoConsignacionesControlador.totalReconsignado
                                                                    , PagoConsignacionesControlador.totalRecogido
                                                                    , PagoConsignacionesControlador.granTotal
                                                                    );
                                            }
                                            

                                        }, function (error) {
                                            if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length > 0) {
                                                if (parseFloat(totalConsignado > 0)) {
                                                    navigator.notification.confirm(
                                                        "Debe Capturar una imágen del producto Reconsignado. Desea Capturarla?", function (buttonIndex) {
                                                            if (buttonIndex === 2) {
                                                                PagoConsignacionesControlador.TomarFotografiaDeProductoReconsignado(function () {
                                                                    PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                        PagoConsignacionesControlador.totalEfectivo
                                                                        , PagoConsignacionesControlador.totalReconsignado
                                                                        , PagoConsignacionesControlador.totalRecogido
                                                                        , PagoConsignacionesControlador.granTotal
                                                                        );
                                                                }, function (error) {
                                                                    notify(error);
                                                                });
                                                            }
                                                        }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                                                } else {
                                                    PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                        PagoConsignacionesControlador.totalEfectivo
                                                                        , PagoConsignacionesControlador.totalReconsignado
                                                                        , PagoConsignacionesControlador.totalRecogido
                                                                        , PagoConsignacionesControlador.granTotal
                                                                        );
                                                }
                                            } else {
                                                notify(error);
                                            }
                                        });
                                    } else {
                                        if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length > 0) {
                                            if (parseFloat(totalConsignado > 0)) {
                                                navigator.notification.confirm(
                                                    "Debe Capturar una imágen del producto Reconsignado. Desea Capturarla?", function (buttonIndex) {
                                                        if (buttonIndex === 2) {
                                                            PagoConsignacionesControlador.TomarFotografiaDeProductoReconsignado(function () {
                                                                PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                    PagoConsignacionesControlador.totalEfectivo
                                                                    , PagoConsignacionesControlador.totalReconsignado
                                                                    , PagoConsignacionesControlador.totalRecogido
                                                                    , PagoConsignacionesControlador.granTotal
                                                                    );
                                                            }, function (error) {
                                                                notify(error);
                                                            });
                                                        }
                                                    }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                                            } else {
                                                PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                    PagoConsignacionesControlador.totalEfectivo
                                                                    , PagoConsignacionesControlador.totalReconsignado
                                                                    , PagoConsignacionesControlador.totalRecogido
                                                                    , PagoConsignacionesControlador.granTotal
                                                                    );
                                            }
                                        }
                                    }
                                }, function(error) {
                                    if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length > 0) {
                                        if (parseFloat(totalConsignado > 0)) {
                                            navigator.notification.confirm(
                                                "Debe Capturar una imágen del producto Reconsignado. Desea Capturarla?", function (buttonIndex) {
                                                    if (buttonIndex === 2) {
                                                        PagoConsignacionesControlador.TomarFotografiaDeProductoReconsignado(function () {
                                                            PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                PagoConsignacionesControlador.totalEfectivo
                                                                , PagoConsignacionesControlador.totalReconsignado
                                                                , PagoConsignacionesControlador.totalRecogido
                                                                , PagoConsignacionesControlador.granTotal
                                                                );
                                                        }, function (error) {
                                                            notify(error);
                                                        });
                                                    }
                                                }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                                        } else {
                                            PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                                PagoConsignacionesControlador.totalEfectivo
                                                                , PagoConsignacionesControlador.totalReconsignado
                                                                , PagoConsignacionesControlador.totalRecogido
                                                                , PagoConsignacionesControlador.granTotal
                                                                );
                                        }
                                    } else {
                                        notify(error);
                                    }
                                });
                            } else {
                                if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length > 0) {
                                    if (parseFloat(totalConsignado > 0)) {
                                        navigator.notification.confirm(
                                            "Debe Capturar una imágen del producto Reconsignado. Desea Capturarla?", function (buttonIndex) {
                                                if (buttonIndex === 2) {
                                                    PagoConsignacionesControlador.TomarFotografiaDeProductoReconsignado(function () {
                                                        PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                            PagoConsignacionesControlador.totalEfectivo
                                                            , PagoConsignacionesControlador.totalReconsignado
                                                            , PagoConsignacionesControlador.totalRecogido
                                                            , PagoConsignacionesControlador.granTotal
                                                            );
                                                    }, function (error) {
                                                        notify(error);
                                                    });
                                                }
                                            }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                                    } else {
                                        PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                            PagoConsignacionesControlador.totalEfectivo
                                                            , PagoConsignacionesControlador.totalReconsignado
                                                            , PagoConsignacionesControlador.totalRecogido
                                                            , PagoConsignacionesControlador.granTotal
                                                            );
                                    }
                                }
                            }
                        }, function(error) {
                            notify(error);
                        });
                    } else {
                        if (parseFloat(totalConsignado > 0)) {
                            navigator.notification.confirm(
                                "Debe Capturar una imágen del producto Reconsignado. Desea Capturarla?", function (buttonIndex) {
                                    if (buttonIndex === 2) {
                                        PagoConsignacionesControlador.TomarFotografiaDeProductoReconsignado(function () {
                                            PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                PagoConsignacionesControlador.totalEfectivo
                                                , PagoConsignacionesControlador.totalReconsignado
                                                , PagoConsignacionesControlador.totalRecogido
                                                , PagoConsignacionesControlador.granTotal
                                                );
                                        }, function (error) {
                                            notify(error);
                                        });
                                    }
                                }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                        } else {
                            PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                                PagoConsignacionesControlador.totalEfectivo
                                                , PagoConsignacionesControlador.totalReconsignado
                                                , PagoConsignacionesControlador.totalRecogido
                                                , PagoConsignacionesControlador.granTotal
                                                );
                        }
                    }
                } else {
                    if (parseFloat(totalConsignado > 0)) {
                        navigator.notification.confirm(
                            "Debe Capturar una imágen del producto Reconsignado. Desea Capturarla?", function (buttonIndex) {
                                if (buttonIndex === 2) {
                                    PagoConsignacionesControlador.TomarFotografiaDeProductoReconsignado(function () {
                                        PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                            PagoConsignacionesControlador.totalEfectivo
                                            , PagoConsignacionesControlador.totalReconsignado
                                            , PagoConsignacionesControlador.totalRecogido
                                            , PagoConsignacionesControlador.granTotal
                                            );
                                    }, function (error) {
                                        notify(error);
                                    });
                                }
                            }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                    } else {
                        PagoConsignacionesControlador.ProcesarCobroConsignaciones(
                                            PagoConsignacionesControlador.totalEfectivo
                                            , PagoConsignacionesControlador.totalReconsignado
                                            , PagoConsignacionesControlador.totalRecogido
                                            , PagoConsignacionesControlador.granTotal
                                            );
                    }
                }

                totalEnProcesoDeConsignacion = null;
                totalCash = null;
                totalConsignado = null;
                totalRecogido = null;
                granTotal = null;
            }
        });

        $("#UiBtnSummConsignment").on("click", function() {
            PagoConsignacionesControlador.MostrarPantallaPrincipalDePagoDeConsignacion();
        });

        $("#UiBtnAceptarFinalizacionDeProcedimientoDePago").on("click", function() {
            $.mobile.changePage("#menu_page", {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        });
    }
    ,
    MostrarPantallaPrincipalDePagoDeConsignacion: function() {
        try {

            actualizarEstadoDeTarea(gTaskId,
                null,
                null,
                function() {
                    $.mobile.changePage("#UiPageConsignmentPayment",
                    {
                        transition: "pop",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                },
                TareaEstado.Aceptada);


        } catch (e) {
            notify(e.message);
        }
    }
    ,
    ProcesarCobroConsignaciones: function (efectivo,reconsignado,recogido,totalConsignado) {
        try {
            PagoConsignacionesControlador.EstaEnPagoDeConsignacion = true;
            my_dialog("Procesando", "Procesando Cobro.\r\nPor favor, espere...", "open");
            var skusHuerfanos = 0;
            
            var verificarInformacion = function() {
                if (skusHuerfanos > 0) {
                    notify("Lo sentimos, no se puede continuar el proceso de Finalización de Pago debido a que aún falta que procese algunos SKU(s), por favor, verifique y vuelva a intentar.");
                    my_dialog("", "", "close");
                } else {
                    efectivo = (1 * parseFloat(efectivo).toFixed(2));
                    reconsignado = (1 * parseFloat(reconsignado).toFixed(2));
                    recogido = (1 * parseFloat(recogido).toFixed(2));
                    totalConsignado = (1 * parseFloat(totalConsignado).toFixed(2));

                    if (reconsignado === totalConsignado) {
                        navigator.notification.confirm(
                            "Esta seguro de Reconsignar todo el producto? \r\n", function(buttonIndex) {
                                if (buttonIndex === 2) {
                                    PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.Reconsignacion, function(tieneSecuencia) {
                                        if (tieneSecuencia) {
                                            var procesaConsignacion = function (fecha) {
                                                PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.Reconsignacion, function (serie, numero) {
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
                                                        DueDate: fecha.toString(),
                                                        ConsignmentBoNum: null,
                                                        DocSerie: serie,
                                                        DocNum: numero,
                                                        Image: PagoConsignacionesControlador.imagenProductoReconsignado,
                                                        IsClosed: 0,
                                                        IsReconsign: 1,
                                                        InRoute: 1,
                                                        TotalAmount: reconsignado
                                                    }
                                                    window.consignacion.encabezado = consignacionEncabezado;
                                                    var consignacionId = consignacionEncabezado.ConsignmentId;
                                                    InsertarConsignacionEncabezado(consignacionEncabezado, function () {
                                                        PagoConsignacionesServicio.ActualizarDetalleDeReconsignacion(consignacionId, function () {
                                                            PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(function () {
                                                                PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.Reconsignacion, numero, function () {
                                                                    
                                                                        actualizarEstadoDeTarea(gTaskId, 1, "Genero Gestion", function () {
                                                                            PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                                ConsignmentPaymentOptions.ReConsignar,
                                                                                serie,
                                                                                numero,
                                                                                function () {
                                                                                    ToastThis("Consignacion grabada exitosamente...");

                                                                                    $.mobile.changePage("#confirmation_consignment", {
                                                                                        transition: "pop",
                                                                                        reverse: true,
                                                                                        changeHash: true,
                                                                                        showLoadMsg: false
                                                                                    });
                                                                                    window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                   
                                                                                    document.getElementById("DivUiListaConsignacionesAPagar").style.display = "block";
                                                                                    document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "none";
                                                                                }, function (error) {
                                                                                    notify(error);
                                                                                });
                                                                        }, TareaEstado.Completada);
                                                                   
                                                                }, function(error) {
                                                                    notify(error);
                                                                });
                                                            }, function (error) {
                                                                notify(error);
                                                            });
                                                        }, function (error) {
                                                            notify(error);
                                                        });
                                                    });
                                                }, function (error) {
                                                    notify(error);
                                                });
                                            };
                                            PagoConsignacionesServicio.ObtenerFechaDeVencimientoDeReconsignaciones(function (fechaVencimiento) {
                                                if (fechaVencimiento === null || fechaVencimiento === "") {
                                                    PagoConsignacionesServicio.CalcularFechaDeVencimientoDeReconsignacion(function (fechaVencimientoCalculada) {
                                                        procesaConsignacion(fechaVencimientoCalculada);
                                                    }, function (error) {
                                                        console.log(error);
                                                        notify(error);
                                                    });
                                                } else {
                                                    procesaConsignacion(fechaVencimiento);
                                                }
                                            }, function (error) {
                                                notify(error);
                                            });
                                        } else {
                                            notify("Usted no cuenta con Secuencia de Documentos de Reconsignación, por favor, comuníquese con su Administrador de Sonda.");
                                        }
                                    }, function(error) {
                                        notify(error);
                                    });
                                }
                            }, "Sonda® SD " + SondaVersion, ["No", "Si"]
                        );
                    } else if (recogido === totalConsignado) {
                        navigator.notification.confirm( 
                            "Todo el producto en Consignación será Recogido. \r\n Desea continuar?", function(buttonIndex) {
                                if (buttonIndex === 2) {
                                    PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario, function(tieneSecuencia) {
                                        if (tieneSecuencia) {
                                            PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.RecogerInventario, function(serie, numero) {
                                                CantidadSkuARecogerProductoEnConsignacionControlador.UltimoDocumentoDeRecoleccion = numero;
                                                var recollecionEncabezado = {
                                                    SKU_COLLECTED_ID: (numero * -1),
                                                    CUSTOMER_ID: gClientCode,
                                                    DOC_SERIE: serie,
                                                    DOC_NUM: numero,
                                                    CODE_ROUTE: gCurrentRoute,
                                                    GPS_URL: gCurrentGPS,
                                                    LAST_UPDATE: getDateTime(),
                                                    LAST_UPDATE_BY: gLastLogin,
                                                    TOTAL_AMOUNT: recogido,
                                                    IS_POSTED: 0,
                                                    IMG_1: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[0],
                                                    IMG_2: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[1],
                                                    IMG_3: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[2]
                                                }
                                                RecogerProductoEnConsignacionServicio.InsertarEncabezadoDeRecollecionDeInventarioEnConsignacion(recollecionEncabezado, function(encabezado) {
                                                    RecogerProductoEnConsignacionServicio.ActualizarDetalleDeRecollecion(encabezado, function() {
                                                        PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario, numero, function() {
                                                            PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(function () {
                                                                
                                                                    actualizarEstadoDeTarea(gTaskId, 1, "Genero Gestion", function () {
                                                                        PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                            ConsignmentPaymentOptions.Recoger, serie, numero, function () {
                                                                                $.mobile.changePage("#UiConfirmationRecollectPage", {
                                                                                    transition: "pop",
                                                                                    reverse: true,
                                                                                    changeHash: true,
                                                                                    showLoadMsg: false
                                                                                });
                                                                                window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                               
                                                                                EnviarData();
                                                                            }, function (error) {
                                                                                notify(error);
                                                                            });
                                                                    }, TareaEstado.Completada);
                                                                
                                                            }, function(error) {
                                                                notify(error);
                                                            });
                                                        }, function(error) {
                                                            notify(error);
                                                        });
                                                    }, function(error) {
                                                        notify(error);
                                                    });
                                                }, function(error) {
                                                    notify(error);
                                                });

                                            }, function(error) {
                                                notify(error);
                                            });
                                        } else {
                                            notify("Usted no cuenta con Secuencia de Documentos para Recoger Inventario en Consignación, por favor, comuníquese con su Administrador de Sonda.");
                                        }
                                    }, function(error) {
                                        notify(error);
                                    });
                                } 
                            }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                    } else if (efectivo > 0) {
                        var procesarFacturacionReconsignacionYRecoleccionDeProductos = function() {
                            window.gInvocingTotal = efectivo;
                            $("#lblTotalSKU").text(window.gInvocingTotal.toString());
                            my_dialog("", "", "close");
                            TotalSKU_Click("pagoConsignacion");
                            PagoConsignacionesControlador.EstaEnPagoDeConsignacion = true;
                        };

                        if (reconsignado > 0) {
                            PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.Reconsignacion, function(tieneSecuencia) {
                                if (tieneSecuencia) {
                                    PagoConsignacionesControlador.TotalReconsignado = reconsignado;
                                    if (recogido > 0) {
                                        PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario, function(tieneSecuenciaParaRecoger) {
                                            if (tieneSecuenciaParaRecoger) {
                                                PagoConsignacionesControlador.TotalRecogido = recogido;
                                                    procesarFacturacionReconsignacionYRecoleccionDeProductos();
                                            } else {
                                                notify("Usted no cuenta con Secuencia de Documentos para Recoger Inventario en Consignación, por favor, comuníquese con su Administrador de Sonda.");
                                                PagoConsignacionesControlador.TotalRecogido = 0;
                                            }
                                        }, function(error) {
                                            notify(error);
                                        });
                                    } else {
                                        procesarFacturacionReconsignacionYRecoleccionDeProductos();
                                        PagoConsignacionesControlador.TotalRecogido = 0;
                                    }
                                } else {
                                    notify("Usted no cuenta con Secuencia de Documentos para Reconsignar, por favor, comuníquese con su Administrador de Sonda.");
                                    PagoConsignacionesControlador.TotalReconsignado = 0;
                                }
                            }, function(error) {
                                notify(error);
                            });
                        } else {
                            PagoConsignacionesControlador.TotalReconsignado = 0;
                            if (recogido > 0) {
                                PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario
                                    , function(tieneSecuencia) {
                                        if (tieneSecuencia) {
                                            PagoConsignacionesControlador.TotalRecogido = recogido;
                                            
                                                procesarFacturacionReconsignacionYRecoleccionDeProductos();
                                            
                                        } else {
                                            notify("Usted no cuenta con Secuencia de Documentos para Recoger Inventario en Consignación, por favor, comuníquese con su Administrador de Sonda.");
                                            PagoConsignacionesControlador.TotalRecogido = 0;
                                        }
                                    }
                                    , function(error) {
                                        notify(error);
                                    });
                            } else {
                                PagoConsignacionesControlador.TotalRecogido = 0;
                                procesarFacturacionReconsignacionYRecoleccionDeProductos();
                            }
                            
                        }
                    } else if(efectivo === 0){

                        //Si tiene algun producto o productos reconsignado(s) debe realizar el proceso de Reconsignacion...
                        if (reconsignado> 0) {
                            PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.Reconsignacion, function (tieneSecuencia) {
                                if (tieneSecuencia) {
                                    var procesaConsignacion = function (fecha) {
                                        PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.Reconsignacion, function (serie, numero) {
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
                                                DueDate: fecha.toString(),
                                                ConsignmentBoNum: null,
                                                DocSerie: serie,
                                                DocNum: numero,
                                                Image: PagoConsignacionesControlador.imagenProductoReconsignado,
                                                IsClosed: 0,
                                                IsReconsign: 1,
                                                InRoute: 1,
                                                TotalAmount: reconsignado
                                            }
                                            window.consignacion.encabezado = consignacionEncabezado;
                                            var consignacionId = consignacionEncabezado.ConsignmentId;
                                            InsertarConsignacionEncabezado(consignacionEncabezado, function () {
                                                PagoConsignacionesServicio.ActualizarDetalleDeReconsignacion(consignacionId, function () {
                                                    PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.Reconsignacion, numero, function () {
                                                        PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                            ConsignmentPaymentOptions.ReConsignar,
                                                            serie,
                                                            numero,
                                                            function() {
                                                                if (recogido > 0) {
                                                                    PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.RecogerInventario, function (serie2, numero2) {
                                                                        CantidadSkuARecogerProductoEnConsignacionControlador.UltimoDocumentoDeRecoleccion = numero2;
                                                                        var recollecionEncabezado = {
                                                                            SKU_COLLECTED_ID: (numero2 * -1),
                                                                            CUSTOMER_ID: gClientCode,
                                                                            DOC_SERIE: serie2,
                                                                            DOC_NUM: numero2,
                                                                            CODE_ROUTE: gCurrentRoute,
                                                                            GPS_URL: gCurrentGPS,
                                                                            LAST_UPDATE: getDateTime(),
                                                                            LAST_UPDATE_BY: gLastLogin,
                                                                            TOTAL_AMOUNT: recogido,
                                                                            IS_POSTED: 0,
                                                                            IMG_1: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[0],
                                                                            IMG_2: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[1],
                                                                            IMG_3: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[2]
                                                                        }
                                                                        RecogerProductoEnConsignacionServicio.InsertarEncabezadoDeRecollecionDeInventarioEnConsignacion(recollecionEncabezado, function (encabezado) {
                                                                            RecogerProductoEnConsignacionServicio.ActualizarDetalleDeRecollecion(encabezado, function () {
                                                                                PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario, numero2, function () {
                                                                                    PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(function () {

                                                                                        actualizarEstadoDeTarea(gTaskId, 1, "Genero Gestion", function () {
                                                                                                PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                                                    ConsignmentPaymentOptions.Recoger,
                                                                                                    serie2,
                                                                                                    numero2
                                                                                                    , function () {
                                                                                                        $.mobile.changePage("#UiConfirmationRecollectPage", {
                                                                                                            transition: "pop",
                                                                                                            reverse: true,
                                                                                                            changeHash: true,
                                                                                                            showLoadMsg: false
                                                                                                        });
                                                                                                        document.getElementById("DivUiListaConsignacionesAPagar").style.display = "block";
                                                                                                        document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "none";
                                                                                                        window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                                        PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                                    
                                                                                                        if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length > 0) {
                                                                                                            PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                                        }
                                                                                                        EnviarData();
                                                                                                    }
                                                                                                    , function (error) {
                                                                                                        notify(error);
                                                                                                    });
                                                                                            }, TareaEstado.Completada);
                                                                                       
                                                                                    }, function (error) {
                                                                                        notify(error);
                                                                                    });
                                                                                }, function (error) {
                                                                                    notify(error);
                                                                                });
                                                                            }, function (error) {
                                                                                notify(error);
                                                                            });
                                                                        }, function (error) {
                                                                            notify(error);
                                                                        });

                                                                    }, function (error) {
                                                                        notify(error);
                                                                    });
                                                                } else {
                                                                    PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(function () {

                                                                            actualizarEstadoDeTarea(gTaskId, 1, "Genero Gestion", function () {
                                                                                $.mobile.changePage("#UiConfirmationRecollectPage", {
                                                                                    transition: "pop",
                                                                                    reverse: true,
                                                                                    changeHash: true,
                                                                                    showLoadMsg: false
                                                                                });
                                                                                document.getElementById("DivUiListaConsignacionesAPagar").style.display = "block";
                                                                                document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "none";
                                                                                window.consignacionesEnProcedimientoDePago.length = 0;
                                                                               
                                                                                if (PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length > 0) {
                                                                                    PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                }
                                                                                EnviarData();
                                                                            }, TareaEstado.Completada);
                                                                       
                                                                    }, function (error) {
                                                                        notify(error);
                                                                    });
                                                                }
                                                            }
                                                            , function(error) {
                                                                notify(error);
                                                            });
                                                    }, function (error) {
                                                        notify(error);
                                                    });
                                                }, function (error) {
                                                    notify(error);
                                                });
                                            });
                                        }, function (error) {
                                            notify(error);
                                        });
                                    };
                                    PagoConsignacionesServicio.ObtenerFechaDeVencimientoDeReconsignaciones(function (fechaVencimiento) {
                                        if (fechaVencimiento === null || fechaVencimiento === "") {
                                            PagoConsignacionesServicio.CalcularFechaDeVencimientoDeReconsignacion(function (fechaVencimientoCalculada) {
                                                procesaConsignacion(fechaVencimientoCalculada);
                                            }, function (error) {
                                                console.log(error);
                                                notify(error);
                                            });
                                        } else {
                                            procesaConsignacion(fechaVencimiento);
                                        }
                                    }, function (error) {
                                        notify(error);
                                    });
                                } else {
                                    notify("Usted no cuenta con Secuencia de Documentos de Reconsignación, por favor, comuníquese con su Administrador de Sonda.");
                                }
                            }, function (error) {
                                notify(error);
                            });
                        } else if (recogido > 0) {
                            //Si recogio productos de consignaciones, guarda el documento de devolucion de inventario
                            PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.RecogerInventario, function (serie, numero) {
                                CantidadSkuARecogerProductoEnConsignacionControlador.UltimoDocumentoDeRecoleccion = numero;
                                var recollecionEncabezado = {
                                    SKU_COLLECTED_ID: (numero * -1),
                                    CUSTOMER_ID: gClientCode,
                                    DOC_SERIE: serie,
                                    DOC_NUM: numero,
                                    CODE_ROUTE: gCurrentRoute,
                                    GPS_URL: gCurrentGPS,
                                    LAST_UPDATE: getDateTime(),
                                    LAST_UPDATE_BY: gLastLogin,
                                    TOTAL_AMOUNT: recogido,
                                    IS_POSTED: 0,
                                    IMG_1: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[0],
                                    IMG_2: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[1],
                                    IMG_3: PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario[2]
                                }
                                RecogerProductoEnConsignacionServicio.InsertarEncabezadoDeRecollecionDeInventarioEnConsignacion(recollecionEncabezado, function (encabezado) {
                                    RecogerProductoEnConsignacionServicio.ActualizarDetalleDeRecollecion(encabezado, function () {
                                        PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario, numero, function () {
                                            PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(function () {
                                               
                                                    actualizarEstadoDeTarea(gTaskId, 1, "Genero Gestion", function () {
                                                        PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                            ConsignmentPaymentOptions.Recoger,
                                                            serie,
                                                            numero,
                                                            function () {
                                                                $.mobile.changePage("#UiConfirmationRecollectPage", {
                                                                    transition: "pop",
                                                                    reverse: true,
                                                                    changeHash: true,
                                                                    showLoadMsg: false
                                                                });
                                                                document.getElementById("DivUiListaConsignacionesAPagar").style.display = "block";
                                                                document.getElementById("DivUiListaDetalleDeConsignacionAPagar").style.display = "none";
                                                                window.consignacionesEnProcedimientoDePago.length = 0;
                                                                PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                EnviarData();
                                                            }
                                                            , function (error) {
                                                                notify(error);
                                                            });
                                                    }, TareaEstado.Completada);
                                               
                                            }, function (error) {
                                                notify(error);
                                            });
                                        }, function (error) {
                                            notify(error);
                                        });
                                    }, function (error) {
                                        notify(error);
                                    });
                                }, function (error) {
                                    notify(error);
                                });

                            }, function (error) {
                                notify(error);
                            });
                        }



                    }
                }
            };

            PagoConsignacionesServicio.ObtenerDetalleDeConsignacionesParaFinalizarProcesoDeCobro(function(skus) {
                if (skus.length > 0) {
                    my_dialog("Procesando", "Procesando Cobro.\r\nPor favor, espere...", "close");

                    for (var i = 0; i < skus.length; i++) {
                        var sku = skus[i];
                        if (sku.LAST_PAYMENT_OPTION === "" || sku.LAST_PAYMENT_OPTION === null) {
                            skusHuerfanos++;
                        } else {
                            if (sku.LAST_PAYMENT_OPTION.toString().indexOf(",") !== -1) {
                                var opcionesDePago = sku.LAST_PAYMENT_OPTION.toString().split(",");
                                for (var j = 0; j < opcionesDePago.length; j++) {
                                    switch (opcionesDePago[j]) {
                                        case ConsignmentPaymentOptions.Pagado:
                                            AgregarSkus(sku.SKU, sku.PRICE, sku.QTY_PAID);
                                            break;
                                        case ConsignmentPaymentOptions.ReConsignar:
                                            PagoConsignacionesServicio.AgregarSkuAReconsignacion(sku,function(error) {
                                                console.log(error);
                                                notify(error);
                                            });
                                            break;
                                    }
                                }
                            } else {
                                switch (sku.LAST_PAYMENT_OPTION) {
                                    case ConsignmentPaymentOptions.Pagado:
                                        if (sku.HANDLE_SERIAL === 1) {
                                            console.log(sku.toString());
                                            PagoConsignacionesServicio.AgregarSkuConSerieAFactura(sku, function(error) {
                                                notify(error);
                                            });
                                        } else {
                                            AgregarSkus(sku.SKU, sku.PRICE, sku.QTY_PAID);
                                        }
                                        break;
                                    case ConsignmentPaymentOptions.ReConsignar:
                                        PagoConsignacionesServicio.AgregarSkuAReconsignacion(sku,function(error) {
                                            console.log(error);
                                            notify(error);
                                        });
                                        break;
                                }
                            }
                        }
                        if (i === skus.length - 1) {
                            verificarInformacion();
                        }
                    }

                } else {
                    PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                    my_dialog("Procesando", "Procesando Cobro.\r\nPor favor, espere...", "close");
                    notify("No se encontraron SKUS.");
                }
            }, function (error) {
                PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                my_dialog("Procesando", "Procesando Cobro.\r\nPor favor, espere...", "close");
                notify(error);
            });
        } catch (e) {
            PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
            notify(e.message);
        }
    }
    ,
    VolverAPantallaPrincipal: function() {
        try {
            navigator.notification.confirm(
                "Esta seguro de abandonar la tarea actual? \n", function(buttonIndex) {
                    if (buttonIndex === 2) {
                        $.mobile.changePage("#menu_page", {
                            transition: "pop",
                            reverse: true,
                            changeHash: true,
                            showLoadMsg: false
                        });
                        window.consignacionesEnProcedimientoDePago.length = 0;
                        PagoConsignacionesControlador.EstaEnDetalle = false;
                        PagoConsignacionesServicio.LimpiarTablasTemporales();
                    }
                }, "Sonda® SD " + SondaVersion, ["No", "Si"]
            );
        } catch (e) {
            notify(e.message);
        }
    }
    ,
    MostrarListadoDeConsignacionesDeCliente: function(listadoDeConsignaciones) {
        try {
            var totalconsignado = 0;
            var listaConsignaciones = $("#UiListaConsignacionesAPagar");
            listaConsignaciones.children().remove("li");

            if (listadoDeConsignaciones.length > 0) {
                for (var i = 0; i < listadoDeConsignaciones.length; i++) {
                    var consignacionEncabezado = listadoDeConsignaciones[i];
                    totalconsignado += consignacionEncabezado.TOTAL_AMOUNT;
                    var li = "";

                    var fechaCreacion = "";
                    var fechaVencimiento = "";

                    if (consignacionEncabezado.DATE_CREATE.toString().indexOf("T") > -1) {
                        fechaCreacion = consignacionEncabezado.DATE_CREATE.toString().split("T")[0];
                    } else {
                        fechaCreacion = consignacionEncabezado.DATE_CREATE.toString().split(" ")[0];
                    }

                    if (consignacionEncabezado.DUE_DATE === null || consignacionEncabezado.DUE_DATE === "null" || consignacionEncabezado.DUE_DATE === undefined) {
                        fechaVencimiento = "...";
                    } else {
                        if (consignacionEncabezado.DUE_DATE.toString().indexOf("T") > -1) {
                            fechaVencimiento = consignacionEncabezado.DUE_DATE.toString().split("T")[0];
                        } else {
                            fechaVencimiento = consignacionEncabezado.DUE_DATE.toString().split(" ")[0];
                        }
                    }

                    li = "<li data-mini='true' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-arrow-r'>";
                    li += "<a id='CH_" + consignacionEncabezado.CONSIGNMENT_ID +
                        "' TOTAL='" + consignacionEncabezado.TOTAL_AMOUNT +
                        "' DOC_SERIE = '" + consignacionEncabezado.DOC_SERIE +
                        "' DOC_NUM = "+ consignacionEncabezado.DOC_NUM + ">"; //DONDE CH SIGNIFICA CONSIGNMENT_HEADER
                    li += "<span>#" + consignacionEncabezado.CONSIGNMENT_BO_NUM + " </span>";
                    li += "<p><b> Creada el: </b>" + fechaCreacion + " </p>";
                    li += "<p> <b>Vence el: </b>" + fechaVencimiento + " </p>";
                    li += "<span class='ui-li-count'><strong>" + currencySymbol + ". " + format_number(consignacionEncabezado.TOTAL_AMOUNT, 2) + "</strong> </span>";
                    li += "</a>";
                    li += "<a href='#' id='CD_" + consignacionEncabezado.CONSIGNMENT_ID +
                        "' DOC_SERIE = '" + consignacionEncabezado.DOC_SERIE +
                        "' DOC_NUM = "+ consignacionEncabezado.DOC_NUM + "></a>"; //DONDE CD SIGNIFICA CONSIGNMENT_DETAIL
                    li += "</li>";

                    listaConsignaciones.append(li);
                    listaConsignaciones.listview("refresh");

                    document.getElementById("UiBtnTotalEnProcesoDeConsignacion").innerHTML = currencySymbol + ". " + format_number(totalconsignado, 2);
                }
            } else {
                document.getElementById("UiBtnTotalEnProcesoDeConsignacion").innerHTML = currencySymbol + ". " + format_number(totalconsignado, 2);
                notify("El cliente seleccionado no tiene consignaciones activas");
            }

        } catch (e) {
            notify(e.message);
        }
    }
    ,
    MostrarOpcionesDeEncabezadoConsignacion: function(idConsignacion,docSerie,docNum) {
        try {
            var idConsignacionATrabajar = idConsignacion.toString().split("_")[1];

            var opcionesConsignacion = function(puedeReconsignar) {
                var config = {};
                if (puedeReconsignar) {
                    config = {
                        title: "Opciones",
                        items: [
                            { text: "Pagar", value: ConsignmentPaymentOptions.Pagado },
                            { text: "Re-Consignar", value: ConsignmentPaymentOptions.ReConsignar },
                            { text: "Recoger", value: ConsignmentPaymentOptions.Recoger },
                            { text: "Restablecer", value: ConsignmentPaymentOptions.Reset }
                        ],
                        doneButtonLabel: "Ok",
                        cancelButtonLabel: "Cancelar"
                    };
                } else {
                    config = {
                        title: "Opciones",
                        items: [
                            { text: "Pagar", value: ConsignmentPaymentOptions.Pagado },
                            { text: "Recoger", value: ConsignmentPaymentOptions.Recoger },
                            { text: "Restablecer", value: ConsignmentPaymentOptions.Reset }
                        ],
                        doneButtonLabel: "Ok",
                        cancelButtonLabel: "Cancelar"
                    };
                }


                window.plugins.listpicker.showPicker(config,
                    function(item) {
                        switch (item) {
                            case ConsignmentPaymentOptions.Pagado:
                                PagoConsignacionesServicio.RestablecerOpcionDePagoDeConsignacionCompleta(idConsignacionATrabajar, docSerie, docNum,function () {
                                    PagoConsignacionesControlador.ActualizarEstadoConsignacionEncabezado(idConsignacionATrabajar, ConsignmentPaymentOptions.Pagado, docSerie, docNum);
                                }, function (error) {
                                    notify(error);
                                });
                            
                            break;
                            case ConsignmentPaymentOptions.ReConsignar:
                                PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.Reconsignacion, function(tieneSecuencia) {
                                    if (tieneSecuencia) {
                                        PagoConsignacionesServicio.RestablecerOpcionDePagoDeConsignacionCompleta(idConsignacionATrabajar, docSerie, docNum,function () {
                                            PagoConsignacionesControlador.ActualizarEstadoConsignacionEncabezado(idConsignacionATrabajar, ConsignmentPaymentOptions.ReConsignar, docSerie, docNum);
                                        }, function (error) {
                                            notify(error);
                                        });
                                    } else {
                                        notify("Usted no cuenta con Secuencia de Documentos de Reconsignación, por favor, comuníquese con su Administrador de Sonda.");
                                    }
                                }, function(error) {
                                    notify(error);
                                });
                                break;
                            case ConsignmentPaymentOptions.Recoger:
                                PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario, function(tieneSecuencia) {
                                    if (tieneSecuencia) {
                                        PagoConsignacionesServicio.RestablecerOpcionDePagoDeConsignacionCompleta(idConsignacionATrabajar, docSerie, docNum, function () {
                                            PagoConsignacionesControlador.ActualizarEstadoConsignacionEncabezado(idConsignacionATrabajar, ConsignmentPaymentOptions.Recoger, docSerie, docNum);
                                        }, function (error) {
                                            notify(error);
                                        });
                                    } else {
                                        notify("Usted no cuenta con Secuencia de Documentos para Recoger Inventario en Consignación, por favor, comuníquese con su Administrador de Sonda.");
                                    }
                                }, function(error) {
                                    notify(error);
                                });
                                break;
                        case ConsignmentPaymentOptions.Reset:
                            PagoConsignacionesControlador.ActualizarEstadoConsignacionEncabezado(idConsignacionATrabajar, ConsignmentPaymentOptions.Reset, docSerie, docNum);
                            break;
                        }
                    }
                );
            }

            var puedeReconsignar = false;
            var reglaServicio = new ReglaServicio();
            reglaServicio.obtenerRegla("PuedeReconsignar", function (regla) {
                if (regla.rows.length > 0) {
                    if (regla.rows.item(0).ENABLED === "Si" || regla.rows.item(0).ENABLED === "SI") {
                        puedeReconsignar = true;
                        opcionesConsignacion(puedeReconsignar);
                        reglaServicio = null;
                    } else {
                        opcionesConsignacion(puedeReconsignar);
                        reglaServicio = null;
                    }
                } else {
                    opcionesConsignacion(puedeReconsignar);
                    reglaServicio = null;
                }
            }, function (err) {
                reglaServicio = null;
                notify(err);
            });
        } catch (e) {
            notify(e.message);
        }
    }
    ,
    MostrarDetalleDeConsignacionAPagar: function(consignacionId) {
        try {
            var objetoLista = $("#UiListaDetalleDeConsignacionAPagar");
            objetoLista.children().remove("li");

            var docSerie = PagoConsignacionesControlador.docSerieParaDetalle;
            var docNum = PagoConsignacionesControlador.docNumParaDetalle;

            PagoConsignacionesServicio.ObtenerDetalleDeConsignacionTemporal(
                consignacionId
                , function(detalle) {
                    for (var i = 0; i < detalle.length; i++) {
                        var skuDetalle = detalle[i];
                        var li = "";
                        li += "<li>";
                        li += '<a href="#" id="' + skuDetalle.SKU +
                            '" SKU_NAME="' + skuDetalle.SKU_NAME +
                            '"  TOTAL="' + (parseFloat(skuDetalle.QTY_CONSIGNMENT) * parseFloat(skuDetalle.PRICE)) +
                            '" HEADER="' + skuDetalle.CONSIGNMENT_ID +
                            '" QTY="' + skuDetalle.QTY_CONSIGNMENT +
                            '" PRICE = ' + parseFloat(skuDetalle.PRICE) + "" +
                            ' DOC_SERIE = "' + docSerie +'" ' +
                            'DOC_NUM = "' + docNum+ '"' +
                            'HANDLE_SERIAL="' + skuDetalle.HANDLE_SERIAL +'">';
                        li += "<span>" + skuDetalle.SKU + "</SPAN>";
                        li += '<p style="white-space : normal; width: 70%">' + skuDetalle.SKU_NAME + "</p>";
                        li += "<p>Cantidad: " + skuDetalle.QTY_CONSIGNMENT + " Precio: " + currencySymbol + ". " + + format_number(skuDetalle.PRICE, 2) + "</p>";
                        li += "<span class='ui-li-count'><strong>" + currencySymbol + ". " + format_number((parseFloat(skuDetalle.QTY_CONSIGNMENT) * parseFloat(skuDetalle.PRICE)), 2) + "</strong> </span>";
                        li += "</a>";
                        li += "</li>";
                        objetoLista.append(li);
                        objetoLista.listview("refresh");
                    }
                }
                , function(error) {
                    notify(error);
                });
        } catch (e) {
            notify(e.message);
        }
    }
    ,
    MostrarOpcionesDeDetalleDeConsignacion: function (sku,
        skuName,
        totalLine,
        consignmentHeader,
        qtySkuEnConsignacion,
        priceSku,
        docSerie,
        docNum, 
        handleSerial) {
        try {

            PagoConsignacionesControlador.serieDocumento = docSerie;
            PagoConsignacionesControlador.serieNumero = parseInt(docNum);

            var opcionesConsignacion = function(puedeReconsignar) {
                var config = {};
                if (puedeReconsignar) {
                    config = {
                        title: "Opciones",
                        items: [
                            { text: "Pagar", value: ConsignmentPaymentOptions.Pagado },
                            { text: "Re-Consignar", value: ConsignmentPaymentOptions.ReConsignar },
                            { text: "Recoger", value: ConsignmentPaymentOptions.Recoger },
                            { text: "Restablecer", value: ConsignmentPaymentOptions.Reset }
                        ],
                        doneButtonLabel: "Ok",
                        cancelButtonLabel: "Cancelar"
                    };
                } else {
                    config = {
                        title: "Opciones",
                        items: [
                            { text: "Pagar", value: ConsignmentPaymentOptions.Pagado },
                            { text: "Recoger", value: ConsignmentPaymentOptions.Recoger },
                            { text: "Restablecer", value: ConsignmentPaymentOptions.Reset }
                        ],
                        doneButtonLabel: "Ok",
                        cancelButtonLabel: "Cancelar"
                    };
                }


                window.plugins.listpicker.showPicker(config,
                 function (item) {
                     switch (item) {
                         case ConsignmentPaymentOptions.Pagado:
                             PagoConsignacionesControlador.ConsignacionId = parseInt(consignmentHeader);
                             CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada = ConsignmentPaymentOptions.Pagado;
                             CantidadSkuEnConsignacionControlador.CodeSku = sku;
                             CantidadSkuEnConsignacionControlador.SkuQty = parseInt(qtySkuEnConsignacion);
                             CantidadSkuEnConsignacionControlador.SkuName = skuName;
                             CantidadSkuEnConsignacionControlador.handleSerial = parseInt(handleSerial);
                             CantidadSkuEnConsignacionControlador.ConsignacionId = parseInt(consignmentHeader);

                             CantidadSkuEnConsignacionControlador.MostrarPantallaDeIngresoDeCantidadDeSku();
                             PagoConsignacionesControlador.EstaEnIngresoDeCantidadSku = true;
                             
                             break;
                         case ConsignmentPaymentOptions.ReConsignar:
                             PagoConsignacionesControlador.ConsignacionId = parseInt(consignmentHeader);
                             PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.Reconsignacion, function(tieneSecuencia) {
                                 if (tieneSecuencia) {
                                     PagoConsignacionesControlador.ObtenerPrecioParaSkuAReconsignar(sku, function(skuObject) {
                                         if (parseFloat(skuObject.SKU_PRICE) === 0) {
                                             notify("El SKU seleccionado tiene precio Cero, por lo tanto no se puede reconsignar.");
                                         } else {
                                             CantidadSkuEnConsignacionControlador.CodeSku = skuObject.SKU;
                                             CantidadSkuEnConsignacionControlador.SkuName = skuObject.SKU_NAME;
                                             CantidadSkuEnConsignacionControlador.SkuQty = parseInt(qtySkuEnConsignacion);
                                             CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada = ConsignmentPaymentOptions.ReConsignar;
                                             CantidadSkuEnConsignacionControlador.SkuPriceForReconsign = parseFloat(skuObject.SKU_PRICE);
                                             CantidadSkuEnConsignacionControlador.handleSerial = parseInt(handleSerial);
                                             CantidadSkuEnConsignacionControlador.ConsignacionId = parseInt(consignmentHeader);

                                             CantidadSkuEnConsignacionControlador.MostrarPantallaDeIngresoDeCantidadDeSku();
                                             PagoConsignacionesControlador.EstaEnIngresoDeCantidadSku = true;
                                         }
                                     }, function(error) {
                                         notify(error);
                                     });
                                 } else {
                                     notify("Usted no cuenta con Secuencia de Documentos de Reconsignación, por favor, comuníquese con su Administrador de Sonda.");
                                 }
                             }, function(error) {
                                 notify(error);
                             });
                             break;
                         case ConsignmentPaymentOptions.Recoger:
                             PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.RecogerInventario, function(tieneSecuencia) {
                                 if (tieneSecuencia) {
                                     CantidadSkuARecogerProductoEnConsignacionControlador.SkuQty = parseInt(qtySkuEnConsignacion);
                                     CantidadSkuARecogerProductoEnConsignacionControlador.CodeSku = sku;
                                     CantidadSkuARecogerProductoEnConsignacionControlador.SkuName = skuName;
                                     CantidadSkuARecogerProductoEnConsignacionControlador.ConsignmentId = parseInt(consignmentHeader);
                                     CantidadSkuARecogerProductoEnConsignacionControlador.OpcionDePagoSeleccionada = ConsignmentPaymentOptions.Recoger;
                                     CantidadSkuARecogerProductoEnConsignacionControlador.SkuPrice = priceSku;
                                     CantidadSkuARecogerProductoEnConsignacionControlador.handleSerial = parseInt(handleSerial);

                                     PagoConsignacionesControlador.EstaEnIngresoDeCantidadSku = true;
                                     PagoConsignacionesControlador.ConsignacionId = parseInt(consignmentHeader);
                                     CantidadSkuARecogerProductoEnConsignacionControlador.MostrarPantallaParaRecogerSkuEnConsignacion();
                                 } else {
                                     notify("Usted no cuenta con Secuencia de Documentos para Recoger Inventario en Consignación, por favor, comuníquese con su Administrador de Sonda.");
                                 }
                             }, function(error) {
                                 notify(error);
                             });
                             break;
                         case ConsignmentPaymentOptions.Reset:
                             PagoConsignacionesControlador.ConsignacionId = parseInt(consignmentHeader);
                             PagoConsignacionesServicio.RestablecerOpcionDePagoDeDetalleDeconsignacion(consignmentHeader, sku, function() {
                                 PagoConsignacionesControlador.MostrarDetalleDeConsignacionAPagar(parseInt(consignmentHeader));
                                 PagoConsignacionesControlador.CalcularPagoCash();
                             }, function(error) {
                                 notify(error);
                             });
                             break;
                     }
                 });
            }

            var puedeReconsignar = false;
            var reglaServicio = new ReglaServicio();
            reglaServicio.obtenerRegla("PuedeReconsignar", function(regla) {
                if (regla.rows.length > 0) {
                    if (regla.rows.item(0).ENABLED === "Si" || regla.rows.item(0).ENABLED === "SI") {
                        puedeReconsignar = true;
                        reglaServicio = null;
                        opcionesConsignacion(puedeReconsignar);
                    } else {
                        reglaServicio = null;
                        opcionesConsignacion(puedeReconsignar);
                    }
                } else {
                    reglaServicio = null;
                    opcionesConsignacion(puedeReconsignar);
                }
            }, function (err) {
                reglaServicio = null;
                notify(err);
            });
        } catch (e) {
            notify(e.message);
        }
    }
    ,
    ActualizarEstadoConsignacionEncabezado: function(idConsignacion, paymentOption,docSerie,docNum) {
        try {

            switch (paymentOption) {
            case ConsignmentPaymentOptions.Reset:
                PagoConsignacionesServicio.RestablecerOpcionDePagoDeConsignacionCompleta(idConsignacion, docSerie, docNum, function () {
                    PagoConsignacionesControlador.CalcularPagoCash();
                }, function(error) {
                    notify(error);
                });
                break;

                case ConsignmentPaymentOptions.ReConsignar:
                    PagoConsignacionesServicio.CalcularFechaDeVencimientoDeReconsignacion(function (fechaVencimiento) {

                        navigator.notification.confirm(
                            "La Re-Consignación vencerá el: " + fechaVencimiento.toString() + "\r\nDesea Continuar?", function (buttonIndex) {
                                if (buttonIndex === 2) {
                                    PagoConsignacionesControlador.FechaVencimientoReconsignacion = fechaVencimiento;
                                    PagoConsignacionesServicio.MarcarConsignacionCompleta(idConsignacion, paymentOption, docSerie, docNum, function () {
                                        PagoConsignacionesControlador.CalcularPagoCash();
                                        if (paymentOption !== ConsignmentPaymentOptions.Pagado) {
                                            notify("Esta Consignación no formará parte de ningun proceso de facturacion.");
                                        }
                                    }, function (error) {
                                        notify(error);
                                    });
                                }
                            }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                    }, function (error) {
                        console.log(error);
                        notify(error);
                    });
                    break;

                case ConsignmentPaymentOptions.Pagado:
                    PagoConsignacionesServicio.MarcarConsignacionCompleta(idConsignacion, paymentOption, docSerie, docNum, function () {
                        PagoConsignacionesControlador.CalcularPagoCash();
                    }, function (error) {
                        console.log(error);
                        notify(error);
                    });
                    break;

                case ConsignmentPaymentOptions.Recoger:
                    navigator.notification.confirm(
                           "Esta acción hara que los productos de la consignación no formen parte de algún proceso de facturación.\r\nDesea Continuar?", function (buttonIndex) {
                               if (buttonIndex === 2) {

                                   navigator.notification.prompt(
                                       "Opciones: \r\n 1 = Buen Estado \r\n 0 = Mal Estado"
                                       , function (results) {
                                           if (results.buttonIndex === 2) {
                                               switch (results.input1) {
                                                   case "":
                                                       notify("Debe seleccionar una opción.");
                                                       break;
                                                   case "1":
                                                       //..Guardar productos en la bodega del vendedor porque estan en buen estado 1 -> Buen Estado
                                                       CantidadSkuARecogerProductoEnConsignacionControlador.EstadoSku = 1;
                                                       PagoConsignacionesServicio.MarcarConsignacionCompleta(idConsignacion, paymentOption, docSerie, docNum, function () {
                                                           PagoConsignacionesControlador.CalcularPagoCash();
                                                       }, function(error) {
                                                           notify(error);
                                                       });
                                                       break;
                                                   case "0":
                                                       //..Guardar productos en la tabla de productos recogidos porque estan en mal estado 0 -> Mal Estado
                                                       CantidadSkuARecogerProductoEnConsignacionControlador.EstadoSku = 0;
                                                       PagoConsignacionesServicio.MarcarConsignacionCompleta(idConsignacion, paymentOption, docSerie, docNum, function () {
                                                           PagoConsignacionesControlador.CalcularPagoCash();
                                                       }, function(error) {
                                                           notify(error);
                                                       });
                                                       break;
                                                   default:
                                                       notify("Opción incorrecta, por favor, verifique y vuelva a intentar.");
                                               }
                                           }
                                       }
                                   , "Estado del Producto"
                                   , ["Cancelar", "Aceptar"]);


                               }
                           }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
                    break;
            }
        } catch (e) {
            console.log(e.message);
            notify(e.message);
        }
    }
    ,
    EstaEnDetalle: false
    ,
    EstaEnPagoDeConsignacion: false
    ,
    EstaEnIngresoDeCantidadSku: false
    ,
    ConsignacionId: null
    ,
    CalcularPagoCash: function() {
        try {
            var totalConsignacionesPagadas = 0;
            var totalConsignacionesReconsignadas = 0;
            var totalConsignacionesRecogidas = 0;

            var totalConsignado = document.getElementById("UiBtnTotalEnProcesoDeConsignacion").innerText;

            PagoConsignacionesServicio.ObtenerTotalesDeDetalleTemporal(function(totales) {

                totalConsignacionesPagadas = parseFloat(totales.TOTAL_PAID);
                document.getElementById("UiTotalCash").innerText = currencySymbol + ". " + format_number(totalConsignacionesPagadas, 2);
                    
                totalConsignacionesReconsignadas = parseFloat(totales.TOTAL_RECONSIGNED);
                document.getElementById("UiTotalConsignacion").innerText = currencySymbol + ". " + format_number(totalConsignacionesReconsignadas, 2);
                        
                totalConsignacionesRecogidas += parseFloat(totales.TOTAL_RECOLLECTED);
                document.getElementById("UiTotalRecogido").innerText = currencySymbol + ". " + format_number(totalConsignacionesRecogidas, 2);
                 
                var total = (parseFloat(totalConsignacionesPagadas) + parseFloat(totalConsignacionesRecogidas) + parseFloat(totalConsignacionesReconsignadas));

                if (total > 0) {
                    if (parseFloat(total) === parseFloat(totalConsignado)) {
                        notify("Ha cuadrado el pago total de la consignación.");
                    }
                }
            }, function(error) {
                notify(error);
            });

        } catch (e) {
            notify("No se ha podido actualizar CASH debido a: " + e.message);
        }
    }
    ,
    CambiarEstadoDeConsignacionesPagadas: function(callBack,errorCallBack) {
        try {
            PagoConsignacionesServicio.ObtenerConsignacionesParaCambioDeEstatus(function(consignaciones) {
                for (var i = 0; i < consignaciones.length; i++) {
                    PagoConsignacionesServicio.MarcarConsignacionComoPagada(consignaciones[i], function(error) {
                        notify("No se pudo actualizar el STATUS de las consignaciones pagadas debido a: " + error.message);
                    });
                }
                callBack();
            }, function (error) {
                errorCallBack(error);
            });
        } catch (e) {
            errorCallBack("No se ha podido actualizar el Estado de las consignaciones pagadas debido a: " + e.message);
        }
    }
    ,
    SkusEnProcedimientoDePago: new Array()
    ,
    ConsignacionesPagadas: new Array()
    ,
    TotalConsignado: 0
    ,
    TotalReconsignado: 0
    ,
    TotalRecogido: 0
    ,
    totalConsignado: 0
    ,
    totalRecogido: 0
    ,
    totalReconsignado: 0
    ,
    totalEfectivo: 0
    ,
    totalEnProcesoDeConsignacion: 0
    ,
    granTotal: 0
    ,
    serieDocumento: ""
    ,
    serieNumero: -1
    ,
    docSerieParaDetalle: ""
    ,
    docNumParaDetalle: -1
    ,
    FechaVencimientoReconsignacion: ""
    ,
    FotografiasDeRecollecionDeInventario: new Array()
    ,
    ObtenerPrecioParaSkuAReconsignar: function(codeSku,callBack,errorCallBack) {
        try {
            var sku = {
                SKU: codeSku
            }
            ObtenerListaDePreciosDeCliente(gClientCode, function(priceListId) {
                ObtenerSkuPorListaDePrecios(priceListId
                    , sku
                    , function(skuRet) {
                        callBack(skuRet);
                    }, function (error) {
                        errorCallBack(error);
                    });
            }, function(error) {
                errorCallBack("No se pudo obtener el precio para el sku seleccionado debido a: " + error.message);
            });
        } catch (e) {
            errorCallBack("No se pudo obtener el precio para el sku seleccionado debido a: " + e.message);
        } 
    }
    ,
    EliminarSkusDeProcesoDePago: function() {
        PagoConsignacionesServicio.QuitarSkusEnProcesoDeFacturacion(function() {
            //...
        },function(error) {
            notify(error);
        });
    }
    ,
    TomarFotografiasDeProductoRecogido: function(callBack,errorCallBack) {
        var error = "";
        try {
            navigator.camera.getPicture
            (
                function (imageURI) {
                    var image = "data:image/jpeg;base64," + imageURI;
                    PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.push(image);
                    image = null;
                    callBack();
                },
                function (message) {
                    error = "No se pudo capturar la imágen del producto debido a: " + message;
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
            error = "Error al intentar capturar las fotografías del producto recogido de consignación debido a: " + e.message;
            console.log(error);
            errorCallBack(error);
        } 
    }
    ,
    MostrarMensajeDeCapturaDeFotografias:function(mensaje, callBack, errorCallBack) {
        navigator.notification.confirm(mensaje, function(buttonIndex) {
            if (buttonIndex === 2) {
                PagoConsignacionesControlador.TomarFotografiasDeProductoRecogido(function() {
                    callBack();
                }, function (error) {
                    errorCallBack(error);
                });
            } else {
                errorCallBack("Debe tomar al menos Una Fotografía, de lo contrario, no se podrá continuar");
            }
        }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
    }
    ,
    imagenProductoReconsignado: ""
    ,
    TomarFotografiaDeProductoReconsignado: function(callBack,errorCallBack) {
        var error = "";
        try {
            navigator.camera.getPicture
           (
               function (imageURI) {
                   var image = "data:image/jpeg;base64," + imageURI;
                   PagoConsignacionesControlador.imagenProductoReconsignado.push(image);
                   image = null;
                   callBack();
               },
               function (message) {
                   error = "No se pudo capturar la imágen del producto debido a: " + message;
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
            error = "Error al intentar capturar la imágen del producto Reconsignado debido a: " + e.message;
            console.log(error);
            errorCallBack(error);
        } 
    }
    ,
    ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad: function(paymentOption, docSerie, docNum, callBack, errorCallBack) {
        PagoConsignacionesServicio.ActualizarSerieYDocumentoDeProcesosDePago(paymentOption, docSerie, docNum, function() {
            callBack();
        },function(error) {
            errorCallBack(error);
        });
    }
}