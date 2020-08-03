var este;
var ReporteDeLiquidacionControlador = (function () {

    function ReporteDeLiquidacionControlador() {
        this.reporteLiquidacionServicio = new ReporteDeLiquidacionServicio();
        this.manejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
        this.objetoReportes = {
            INVENTARIO: new Array(),
            TOTAL_FACTURADO: 0,
            TOTAL_RECOGIDO: 0,
            TOTAL_CONSIGNADO: 0,
            TOTAL_A_LIQUIDAR: 0,
            TOTAL_DEPOSITOS_DE_RUTA: 0,
            DEPOSITOS_DE_RUTA: new Array(),
            ENTREGAS_DE_RUTA: [],
            DEMANDAS_DE_DESPACHO_NO_ENTREGADAS_O_CANCELADAS: [],
            TOTAL_FACTURADO_AL_CREDITO: 0,
            FACTURAS_DE_RUTA: [],
            VISUALIZAR_E_IMPRIMIR_RESUMEN_DE_FACTURAS: false
        };
        this.reporteSeleccionadoPorElUsuario = false;
    }

    ReporteDeLiquidacionControlador.prototype.delegarReporteDeLiquidacionControlador = function () {
        este = this;

        $("#UiLiquidationReportPage").on("pageshow",
            function () {

                my_dialog("Espere", "Procesando Información...", "open");
                var montoLiquidacion = $("#UiMontoTotalReporteLiquidacion");

                este.AgregarInformacionDeDireccionesYEmpresa();

                var btnLiquidacionDeRuta = $("#UiBtnTabLiquidacionDeRuta");
                btnLiquidacionDeRuta.click();

                este.reporteLiquidacionServicio.ObtenerTotalFacturado(function (facturado, facturadoAlCredito) {
                    este.objetoReportes.TOTAL_FACTURADO = facturado;
                    este.objetoReportes.TOTAL_FACTURADO_AL_CREDITO = facturadoAlCredito;
                    este.reporteLiquidacionServicio.ObtenerTotalConsignado(function (consignado) {
                        este.objetoReportes.TOTAL_CONSIGNADO = consignado;
                        este.reporteLiquidacionServicio.ObtenerTotalRecogido(function (recogido) {
                            este.objetoReportes.TOTAL_RECOGIDO = recogido;
                            este.reporteLiquidacionServicio
                                .ObtenerInformacionDeInventario(function (inventario) {
                                    este.objetoReportes.INVENTARIO = inventario;
                                    var totales = (este.objetoReportes.TOTAL_FACTURADO);
                                    este.objetoReportes.TOTAL_A_LIQUIDAR = parseFloat(totales);
                                    montoLiquidacion
                                        .text(currencySymbol + ". " + format_number(totales, 2));
                                    totales = null;
                                    este.reporteLiquidacionServicio
                                        .ObtenerTotalDeDepositosDeRuta(function (totalDeDepositosDeRuta) {
                                            este.objetoReportes
                                                .TOTAL_DEPOSITOS_DE_RUTA = totalDeDepositosDeRuta;
                                            este.reporteLiquidacionServicio
                                                .ObtenerDetalleDeDepositosDeRuta(function (depositosDeRuta) {
                                                    este.objetoReportes
                                                        .DEPOSITOS_DE_RUTA = depositosDeRuta;

                                                    este.reporteLiquidacionServicio.ResumenFacturaLiquidacion(function (resumenDeFacturas, seVisualizaEImprimeResumen) {

                                                        este.objetoReportes.FACTURAS_DE_RUTA = resumenDeFacturas;
                                                        este.objetoReportes
                                                            .VISUALIZAR_E_IMPRIMIR_RESUMEN_DE_FACTURAS = seVisualizaEImprimeResumen;

                                                        este.CrearListadoDeSkusInventario(este
                                                            .objetoReportes.INVENTARIO,
                                                            este.objetoReportes.TOTAL_A_LIQUIDAR,
                                                            este.objetoReportes
                                                            .TOTAL_DEPOSITOS_DE_RUTA,
                                                            este.objetoReportes.DEPOSITOS_DE_RUTA,
                                                            este.objetoReportes
                                                            .TOTAL_FACTURADO_AL_CREDITO,
                                                            este.objetoReportes.FACTURAS_DE_RUTA,
                                                            este.objetoReportes
                                                            .VISUALIZAR_E_IMPRIMIR_RESUMEN_DE_FACTURAS
                                                            ,
                                                            function () {
                                                                este.reporteLiquidacionServicio
                                                                    .ObtenerNotasDeEntrega(function (notasDeEntrega) {
                                                                        este.objetoReportes
                                                                            .ENTREGAS_DE_RUTA =
                                                                            notasDeEntrega;
                                                                        este
                                                                            .CrearListadoDeNotasDeEntrega(notasDeEntrega,
                                                                                function () {
                                                                                    este
                                                                                        .reporteLiquidacionServicio.ObtenerOrdenesDeVentaNoEntregadas(function (ordenesDeVentaNoEntregadas) {
                                                                                            este
                                                                                                .objetoReportes
                                                                                                .DEMANDAS_DE_DESPACHO_NO_ENTREGADAS_O_CANCELADAS = ordenesDeVentaNoEntregadas;
                                                                                            este
                                                                                                .CrearListadoDeOrdenesDeVentaNoEntregadas(ordenesDeVentaNoEntregadas,
                                                                                                    function () {
                                                                                                        InteraccionConUsuarioServicio.desbloquearPantalla();
                                                                                                        my_dialog("", "", "close");
                                                                                                    },
                                                                                                    function (error) {
                                                                                                        este.MostrarErrorDeProceso(error);
                                                                                                    });
                                                                                        },
                                                                                            function (error) {
                                                                                                este.MostrarErrorDeProceso(error);
                                                                                            });
                                                                                },
                                                                                function (error) {
                                                                                    este
                                                                                        .MostrarErrorDeProceso(error);
                                                                                });
                                                                    },
                                                                        function (error) {
                                                                            este
                                                                                .MostrarErrorDeProceso(error);
                                                                        });
                                                            },
                                                            function (error) {
                                                                este.MostrarErrorDeProceso(error);
                                                            });
                                                    }, function (error) {
                                                        este.MostrarErrorDeProceso(error);
                                                    });
                                                },
                                                    function (error) {
                                                        este.MostrarErrorDeProceso(error);
                                                    });
                                        },
                                            function (error) {
                                                este.MostrarErrorDeProceso(error);
                                            });
                                },
                                    function (error) {
                                        este.MostrarErrorDeProceso(error);
                                    });
                        },
                            function (error) {
                                este.MostrarErrorDeProceso(error);
                            });
                    },
                        function (error) {
                            este.MostrarErrorDeProceso(error);
                        });
                },
                    function (error) {
                        este.MostrarErrorDeProceso(error);
                    });
            });

        $("#btnFinishPOS").bind("touchstart", function () {
            if (gIsOnline == EstaEnLinea.Si) {
                InteraccionConUsuarioServicio.bloquearPantalla();
                este.ValidarMostrarVista(function (mostrarReporte) {
                    if (mostrarReporte) {
                        InteraccionConUsuarioServicio.bloquearPantalla();
                        este.reporteLiquidacionServicio.limpiarInformacionDeReporteDeLiquidacion(function () {
                            este.reporteLiquidacionServicio.ActualizarCantidadesVendidas(function () {
                                este.reporteLiquidacionServicio.ActualizrCantidadesConsignadas(function () {
                                    este.reporteLiquidacionServicio.ActualizrCantidadesRecogidas(function () {
                                        este.reporteLiquidacionServicio.ActualizarCantidadesTransferidas(function () {
                                            este.reporteLiquidacionServicio.AgregarCantidadesRecogidasEnEntregas(function () {
                                                $.mobile.changePage("#UiLiquidationReportPage", {
                                                    transition: "flow",
                                                    reverse: true,
                                                    changeHash: true,
                                                    showLoadMsg: false
                                                });
                                            }, function (error) {
                                                InteraccionConUsuarioServicio.desbloquearPantalla();
                                                notify("Erro al obtener CantidadesRecogidasEnEntregas: " + error);
                                            });
                                        }, function (error) {
                                            InteraccionConUsuarioServicio.desbloquearPantalla();
                                            notify(error);
                                        });
                                    }, function (error) {
                                        InteraccionConUsuarioServicio.desbloquearPantalla();
                                        notify(error);
                                    });
                                }, function (error) {
                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                    notify(error);
                                });
                            }, function (error) {
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                                notify(error);
                            });
                        }, function (error) {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            notify(error);
                        });
                    } else {
                        este.UsuarioDeseaFinalizarRuta();
                    }
                });
            } else {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify("No tiene conexión al servidor, por favor intentarlo de nuevo");
            }
        });

        $("#UiBtnCancelCloseRoute").on("click", function () {
            DocumentosDeDevolucionControlador.VolverAMenu();
        });

        $("#UiBtnPrintLiquidationReport").on("click", function () {
            my_dialog("Espere", "Imprimiendo Reporte...", "open");
            este.ImprimirReporte();

        });

        $("#UiBtnCloseRoute").on("click", function () {
            TareaServicio.ValidarParametroYTareasParaFinDeRuta(function (permiteAvanzar) {
                if (permiteAvanzar) {
                    este.UsuarioDeseaFinalizarRuta();
                } else {
                    notify("Para poder finalizar la ruta se deben de completar todas las tareas");
                }
            }, function (error) {
                notify("Error al validar parametro y tareas para fin de ruta debido a: " + error);
            });

        });

        $("#UiBtnTabLiquidacionDeRuta").on("click",
            function () {
                este.reporteSeleccionadoPorElUsuario = "UiBtnTabLiquidacionDeRuta";
                este.VisualizarReporteSeleccionado();
            });

        $("#UiBtnTabEntregas").on("click",
            function () {
                este.reporteSeleccionadoPorElUsuario = "UiBtnTabEntregas";
                este.VisualizarReporteSeleccionado();
            });

    };

    ReporteDeLiquidacionControlador.prototype.ValidarMostrarVista = function (callBack) {
        var reglaServicio = new ReglaServicio();
        reglaServicio.obtenerRegla("VisualizarReporteLiquidacion", function (regla) {
            if (regla.rows.length > 0) {
                if (regla.rows.item(0).ENABLED === "Si" || regla.rows.item(0).ENABLED === "SI") {
                    callBack(true);
                    reglaServicio = null;
                } else {
                    callBack(false);
                    reglaServicio = null;
                }
            } else {
                callBack(false);
                reglaServicio = null;
            }
        }, function (err) {
            callBack(false);
            reglaServicio = null;
            notify(err);
        });
    };

    ReporteDeLiquidacionControlador.prototype.UsuarioDeseaFinalizarRuta = function() {
        var _this = this;
        ObtenerFacturasNoPosteadas(function(facturas) {
                if (facturas.length > 0) {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("Tiene " + facturas.length + " facturas sin sincronizar, por favor espere.");
                    EnviarData();
                    return;
                } else {
                    var clienteServicio = new ClienteServicio();
                    clienteServicio.obtenerClientesConEtiquetasNoSincronizados(function(clientes) {
                            if (clientes.length > 0) {
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                                notify("Tiene " +
                                    clientes.length +
                                    " clientes nuevos sin sincronizar, por favor espere.");
                                EnviarData();
                            } else {
                                var tareas = [];
                                ObtenerTareasNoPosteadas(function(tareasNoPosteadas) {
                                        if (tareasNoPosteadas.length > 0) {
                                            InteraccionConUsuarioServicio.desbloquearPantalla();
                                            notify("Tiene " +
                                                tareasNoPosteadas.length +
                                                " tareas sin sincronizar, por favor espere.");
                                            EnviarData();
                                        } else {
                                            ValidarValidacionesDeFacturasSincronizadas(function() {
                                                    VerificarValidacionesDeClientesSincronizados(function() {
                                                            VerificarClientesEnServidor(true,
                                                                TipoDeValidacionDeCliente.FinDeRuta,
                                                                _this.ValidarFinalizacionDeRuta,
                                                                function (error) {
                                                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                                                    notify(error);
                                                                });
                                                        },
                                                        function(error) {
                                                            InteraccionConUsuarioServicio.desbloquearPantalla();
                                                            notify(error);
                                                            EnviarData();
                                                        });
                                                },
                                                function(err) {
                                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                                    notify(err);
                                                    EnviarData();
                                                });
                                        }
                                    },
                                    function(error) {
                                        InteraccionConUsuarioServicio.desbloquearPantalla();
                                        notify("UsuarioDeseaFinalizarRuta: " + error);
                                    },
                                    tareas);
                            }
                        },
                        function(error) {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            notify("Error al intentar obtener los clientes no sincronizados debido a: " +
                                error
                                .mensaje);
                        });
                }

            },
            function(err) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify(err.message);
            },
            []);

    };

    ReporteDeLiquidacionControlador.prototype.ValidarFinalizacionDeRuta = function (data) {
        SocketControlador.socketIo.removeListener("ValidateScoutingsPOS_Request" + data.Source, this.ValidarFinalizacionDeRuta);
        if (data.option === OpcionRespuesta.Exito) {
            VerificarDocumentosEnServidor(TipoDeValidacionDeFactura.FinDeRuta,
                true,
                este.FinalizarRuta,
                function (err) {
                    notify(err);
                    EnviarData();
                });
        } else {
            if (data.reSend === 1 && data.Source === TipoDeValidacionDeCliente.FinDeRuta) {
                var clienteServicio = new ClienteServicio();
                clienteServicio.cambiarEstadoAClientesParaReenviar(data.reenviarScoutings,
                    function () {
                        EnviarData();
                        notify("No se han sincronizado todos los clientes, espere por favor...");
                    },
                    function (resultado) {
                        notify("Error al intentar enviar nuevamente los clientes debido a: " + resultado.mensaje);
                    });
            } else {
                notify("Error al validar clientes nuevos: " + data.message);
            }
        }
    };

    ReporteDeLiquidacionControlador.prototype.FinalizarRuta = function (data) {
        SocketControlador.socketIo.removeListener("ValidateInvoices_Request", this.FinalizarRuta);
        if (data.option === OpcionRespuesta.Exito) {
            este.MostrarFinDeRuta();
        } else {
            if (data.reSend === 1) {
                CambiarEstadoParaReenviarFacturas(data.reenviarFacturas, function () {
                    EnviarData();
                    notify("No se han sincronizados las facturas, espere por favor");
                }, function (err) {
                    notify("Errol al intentar enviar las facturas pendientes: " + err.message);
                });
            } else {
                notify("Error al validar facturas: " + data.message);
            }
        }
    };

    ReporteDeLiquidacionControlador.prototype.MostrarFinDeRuta = function () {
        navigator.notification.confirm("¿Confirma Finalizar Ruta?", function (buttonIndex) {
            if (buttonIndex === 2) {
                InteraccionConUsuarioServicio.bloquearPantalla();
                if (gIsOnline == EstaEnLinea.Si) {
                    InteraccionConUsuarioServicio.bloquearPantalla();
                    este.ValidarCantidadDeTransferenciasPendientes(function(validarTransferenciasPendientes) {
                        if (validarTransferenciasPendientes) {
                            ObtenerCantidadDeTransferenciasPendientes(function(transferenciasPendientes) {
                                    if (transferenciasPendientes > 0) {
                                        InteraccionConUsuarioServicio.desbloquearPantalla();
                                        notify("Aún tiene " +
                                            transferenciasPendientes +
                                            " transferencias pendientes de aceptar, por favor, verifique y vuelva a intentar.");
                                    } else {
                                        closepos_action();
                                    }
                                },
                                function(error) {
                                    InteraccionConUsuarioServicio.desbloquearPantalla();
                                    notify(error);
                                });
                        } else {
                            closepos_action();
                        }
                    });
                } else {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify("Por favor, asegurese de tener conexión hacia el servidor y vuelva a intentar...");
                }
            } else {
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        }, "Sonda® SD " + SondaVersion, "No,Si");
    };

    ReporteDeLiquidacionControlador.prototype.ObtenerFormatoDeImpresionDeReporteDeLiquidacion = function (callBack, errorCallBack) {
        var _this = this;
        ObtenerFormatoDeImpresionDeReporteDeLiquidacionFinDeRuta(_this.objetoReportes, function (formato) {
            _this.reporteLiquidacionServicio.ImprimirReporteDeLiquidacion(formato, function () {
                my_dialog("", "", "close");
                ToastThis("Reporte impreso exitosamente...");
            }, function (error) {
                my_dialog("", "", "close");
                notify(error);
            });
        }, function (error) {
            my_dialog("", "", "close");
            notify(error);
        });
    };

    ReporteDeLiquidacionControlador.prototype.ObtenerFormatoDeImpresionDeReporteDeLiquidacionDeEntregas = function (callBack, errorCallBack) {
        var _this = this;
        ObtenerFormatoDeImpresionDeReporteDeLiquidacionDeEntrega(_this.objetoReportes, function (formato) {
            _this.reporteLiquidacionServicio.ImprimirReporteDeLiquidacion(formato, function () {
                my_dialog("", "", "close");
                ToastThis("Reporte impreso exitosamente...");
            }, function (error) {
                my_dialog("", "", "close");
                notify(error);
            });
        }, function (error) {
            my_dialog("", "", "close");
            notify(error);
        });
    };

    ReporteDeLiquidacionControlador.prototype.CrearListadoDeSkusInventario = function (skus, totalALiquidar, totalDepositado, depositosDeRuta, facturadoAlCredito, resumenFacturaLiquidacion, seVisualizaResumenDeFacturas, callBack, errorCallBack) {
        var _this = this;
        try {

            _this.manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function(manejoDeDecimales) {
                var objetoDetalle = $("#UiDetalleReporteDeLiquidacion");
                objetoDetalle.children().remove("li");
                skus.reverse();

                var li = "";

                if (depositosDeRuta.length > 0) {

                    li = "<li data-icon='false'>";
                    li += "<h3 style='font-size:1em; text-align:center;'>LIQUIDACIÓN MONETARIA</h3>";
                    li += "</li>";
                    objetoDetalle.append(li);
                    objetoDetalle.listview("refresh");

                    for (var j = 0; j < depositosDeRuta.length; j++) {
                        var deposito = depositosDeRuta[j];

                        li = "<li>";
                        li += '<table style="width: 100%">';
                        li += "<tr>";
                        li += "<td>";
                        li += "<div>";
                        li += "<b>DP" +
                            (j + 1) +
                            " - " +
                            deposito.ACCOUNT_NUM +
                            ' <span style="float:right">' +
                            currencySymbol +
                            ". " +
                            format_number(deposito.AMOUNT, manejoDeDecimales.defaultDisplayDecimals) +
                            "</span></b>";
                        li += "</div>";
                        li += "</td>";
                        li += "</tr>";
                        li += "</table>";
                        li += "</li>";

                        if (j === depositosDeRuta.length - 1) {
                            if (facturadoAlCredito > 0) {
                                li += "<li>";
                                li += '<table style="width: 100%">';
                                li += "<tr>";
                                li += "<td>";
                                li += "<div>";
                                li += '<b>Crédito: <span id="UiMonotoFacturadoAlCredito" style="float: right">' +
                                    currencySymbol +
                                    ". " +
                                    format_number(facturadoAlCredito, manejoDeDecimales.defaultDisplayDecimals) +
                                    "</span></b>";
                                li += "</div>";
                                li += "</td>";
                                li += "</tr>";
                                li += "</table>";
                                li += "</li>";
                            }

                            li += "<li>";
                            li += '<table style="width: 100%">';
                            li += "<tr>";
                            li += "<td>";
                            li += "<div>";
                            li +=
                                '<b>Efectivo: <span id="UiMonotoALiquidarMenosDepositosDeRuta" style="float: right">' +
                                currencySymbol +
                                ". " +
                                format_number((totalALiquidar - totalDepositado - facturadoAlCredito), manejoDeDecimales.defaultDisplayDecimals) +
                                "</span></b>";
                            li += "</div>";
                            li += "</td>";
                            li += "</tr>";
                            li += "</table>";
                            li += "</li>";
                        }

                        objetoDetalle.append(li);
                        objetoDetalle.listview("refresh");
                    }
                } else {
                    if (facturadoAlCredito > 0) {
                        li = "<li>";
                        li += '<table style="width: 100%">';
                        li += "<tr>";
                        li += "<td>";
                        li += "<div>";
                        li += '<b>Crédito: <span id="UiMonotoFacturadoAlCredito" style="float: right">' +
                            currencySymbol +
                            ". " +
                            format_number(facturadoAlCredito, manejoDeDecimales.defaultDisplayDecimals) +
                            "</span></b>";
                        li += "</div>";
                        li += "</td>";
                        li += "</tr>";
                        li += "</table>";
                        li += "</li>";

                        li += "<li>";
                        li += '<table style="width: 100%">';
                        li += "<tr>";
                        li += "<td>";
                        li += "<div>";
                        li += '<b>Efectivo: <span id="UiMonotoALiquidarMenosDepositosDeRuta" style="float: right">' +
                            currencySymbol +
                            ". " +
                            format_number((totalALiquidar - facturadoAlCredito), manejoDeDecimales.defaultDisplayDecimals) +
                            "</span></b>";
                        li += "</div>";
                        li += "</td>";
                        li += "</tr>";
                        li += "</table>";
                        li += "</li>";

                        objetoDetalle.append(li);
                        objetoDetalle.listview("refresh");
                    }
                }

                li = "<li data-icon='false'>";
                li += "<h3 style='font-size:1em; text-align:center;'>LIQUIDACIÓN INVENTARIO</h3>";
                li += '<table style="width: 100%">';
                li += "<tr>";
                li += "<td>";
                li += "<p><b>INV.INI</b> = Inventario Inicial </p>";
                li += "<p><b>CON.</b> = Consignaciones </p>";
                li += "<p><b>DEV.</b> = Devoluciones </p>";
                li += "<p><b>TRANS.</b> = Transferencias </p>";
                li += "</td>";
                li += "</tr>";
                li += "</table>";
                li += "</li>";
                objetoDetalle.append(li);
                objetoDetalle.listview("refresh");

                for (var i = 0; i < skus.length; i++) {
                    var sku = skus[i];
                    li = "<li data-icon='false'>";
                    li += "<span style='font-size:1em;'><b>" + sku.SKU + " " + sku.SKU_NAME + "</b></span>";
                    li +=
                        "<table style='width: 100%; border: 1px solid black;' data-role='table' data-mode='reflow' class='ui-responsive table-stroke'>";
                    //cabeceras
                    li += "<tr>";
                    li += "<td style='width: 20%;'>";
                    li += "<span>" + "<b>" + "INV.INI" + "</b>";
                    li += "</td>";
                    li += "<td style='width: 20%;'>";
                    li += "<span>" + "<b>" + "VENTAS" + "</b>";
                    li += "</td>";
                    li += "<td style='width: 20%;'>";
                    li += "<span>" + "<b>" + "CON." + "</b>";
                    li += "</td>";
                    li += "<td style='width: 20%;'>";
                    li += "<span>" + "<b>" + "DEV." + "</b>";
                    li += "</td>";
                    li += "<td style='width: 20%;'>";
                    li += "<span>" + "<b>" + "TRANS." + "</b>";
                    li += "</td>";
                    li += "</tr>";
                    //valores
                    li += "<tr>";
                    li += "<td style='width: 20%; text-align: right;'>";
                    li += "<span>" + format_number(sku.INITIAL_INV, manejoDeDecimales.defaultDisplayDecimalsForSkuQty) + "</span>";
                    li += "</td>";
                    li += "<td style='width: 20%; text-align: right;'>";
                    li += "<span>" + "-" + format_number(sku.QTY_SOLD, manejoDeDecimales.defaultDisplayDecimalsForSkuQty) + "</span>";
                    li += "</td>";
                    li += "<td style='width: 20%; text-align: right;'>";
                    li += "<span>" + "-" + format_number(sku.QTY_CONSIGNED, manejoDeDecimales.defaultDisplayDecimalsForSkuQty) + "</span>";
                    li += "</td>";
                    li += "<td style='width: 20%; text-align: right'>";
                    li += "<span>" + "+" + format_number(sku.QTY_COLLECTED, manejoDeDecimales.defaultDisplayDecimalsForSkuQty) + "</span>";
                    li += "</td>";
                    li += "<td style='width: 20%; text-align: right'>";
                    li += "<span>" + "+" + format_number(sku.QTY_TRANSFERED, manejoDeDecimales.defaultDisplayDecimalsForSkuQty) + "</span>";
                    li += "</td>";
                    li += "</tr>";
                    //totales
                    li += "<tr>";
                    li += "<td colspan='3' style='width: 50%; text-align: left;'>";
                    li += "<span>" + "<b>" + "TOTAL: " + "</b>" + "</span>";
                    li += "</td>";
                    li += "<td colspan='2' style='width: 50%; text-align: right'>";
                    li += "<span>" + format_number(sku.DIFFERENCE, manejoDeDecimales.defaultDisplayDecimalsForSkuQty) + "</span>";
                    li += "</td>";
                    li += "</tr>";
                    li += "</table>";
                    li += "</li>";
                    objetoDetalle.append(li);
                    objetoDetalle.listview("refresh");
                }
                if (facturadoAlCredito > 0) {
                    li = "<li>";
                    li += '<table style="width: 100%">';
                    li += "<tr>";
                    li += "<td>";
                    li += "<div>";
                    li += '<b>Crédito: <span id="UiMonotoFacturadoAlCredito" style="float: right">' +
                        currencySymbol +
                        ". " +
                        format_number(facturadoAlCredito, manejoDeDecimales.defaultDisplayDecimals) +
                        "</span></b>";
                    li += "</div>";
                    li += "</td>";
                    li += "</tr>";
                    li += "</table>";
                    li += "</li>";

                    li += "<li>";
                    li += '<table style="width: 100%">';
                    li += "<tr>";
                    li += "<td>";
                    li += "<div>";
                    li += '<b>Efectivo: <span id="UiMonotoALiquidarMenosDepositosDeRuta" style="float: right">' +
                        currencySymbol +
                        ". " +
                        format_number((totalALiquidar - facturadoAlCredito), manejoDeDecimales.defaultDisplayDecimals) +
                        "</span></b>";
                    li += "</div>";
                    li += "</td>";
                    li += "</tr>";
                    li += "</table>";
                    li += "</li>";

                    objetoDetalle.append(li);
                    objetoDetalle.listview("refresh");
                }
                if (seVisualizaResumenDeFacturas && resumenFacturaLiquidacion.length > 0) {
                    var totalFacturado = 0;
                    li = "<li>";
                    li += '<h1 style="text-align: center;"> LIQUIDACION DE FACTURAS </h1>';
                    li +=
                        '<table style="width: 100%; border: 1px solid black; " data-role="table" data-mode="reflow" class="ui-responsive table-stroke">';
                    li += "<tr>";
                    li += "<td>";
                    li += "<b>FACTURA</b>";
                    li += "</td>";
                    li += "<td>";
                    li += "<b>MONTO</b>";
                    li += "</td>";
                    li += "</tr>";

                    for (var index = 0; index < resumenFacturaLiquidacion.length; index++) {
                        var factura = resumenFacturaLiquidacion[index];

                        var numeroFactura = (factura.STATUS === 3)
                            ? (factura.INVOICE_NUM + " (Anulada)")
                            : factura.INVOICE_NUM;

                        totalFacturado += (factura.STATUS === 3) ? 0 : factura.TOTAL_AMOUNT;

                        li += "<tr>";

                        li += "<td>";
                        li += "<div>" + numeroFactura + "</div>";
                        li += "</td>";

                        li += "<td>";
                        li += "<div>" + currencySymbol + ". " + format_number(factura.TOTAL_AMOUNT, manejoDeDecimales.defaultDisplayDecimals) + "</div>";
                        li += "</td>";

                        li += "</tr>";
                    }

                    li += "</table>";

                    li += "<p>";

                    li += '<span style="float: left;">';
                    li += "<b>Total Facturado</b>";
                    li += "</span>";

                    li += '<span style="float: right;">';
                    li += "<b>" + currencySymbol + ". " + format_number(totalFacturado, manejoDeDecimales.defaultDisplayDecimals) + "</b>";
                    li += "</span>";

                    li += "</p>";

                    li += "</li>";

                    objetoDetalle.append(li);
                    objetoDetalle.listview("refresh");
                }

                callBack();
            });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionControlador.prototype.ValidarCantidadDeTransferenciasPendientes = function (callBack) {
        var reglaServicio = new ReglaServicio();
        reglaServicio.obtenerRegla("ValidarTransferencias", function (regla) {
            if (regla.rows.length > 0) {
                if (regla.rows.item(0).ENABLED === "Si" || regla.rows.item(0).ENABLED === "SI") {
                    callBack(true);
                    reglaServicio = null;
                } else {
                    callBack(false);
                    reglaServicio = null;
                }
            } else {
                callBack(false);
                reglaServicio = null;
            }
        }, function (err) {
            callBack(false);
            reglaServicio = null;
            notify(err);
        });
    }

    ReporteDeLiquidacionControlador.prototype.CrearListadoDeNotasDeEntrega = function (notasDeEntrega, callBack, errorCallBack) {
        var objetoDetalle = $("#UiDetalleReporteDeEntrega");
        var contenedorDeDetalleDeReporteDeEntrega = $("#UiColapsibleReporteEntregas");

        try {

            objetoDetalle.children().remove("li");
            notasDeEntrega.reverse();

            var li = "";

            for (var i = 0; i < notasDeEntrega.length; i++) {
                var notaDeEntrega = notasDeEntrega[i];
                li += "<li data-icon='false' style='border-bottom: 2px solid black'>";
                li +=
                    "<table style='width: 100%;' data-role='table' data-mode='reflow' class='ui-responsive table-stroke'>";

                //valores
                li += "<tr>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<p><b> ENTREGA: </b> " + notaDeEntrega.DELIVERY_NOTE_ID + " </p>";
                li += "</td>";
                li += "<td style='width: 50%; text-align: left;'>";
                if (UsuarioFacturaEnRuta) {
                    if (this.campoEsNullOUndefined(notaDeEntrega.INVOICE_ID)) {
                        li += '<p><b> FACTURA: </b><p>N/A</p></p>';
                    } else {
                        li += '<p><b> FACTURA: </b><p style="' + (notaDeEntrega.INVOICE_STATUS === "CANCELADA" ? "color: red;" : "color: green;") + '">' + notaDeEntrega.INVOICE_ID + "/" + notaDeEntrega.INVOICE_STATUS + "</p></p>";
                    }
                } else {
                    li += '<p><b> FACTURA: </b><p style="color: green;">' + notaDeEntrega.INVOICE_ID + "</p></p>";
                }

                li += "</td>";
                li += "</tr>";
                li += "<tr>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<p><b> CODIGO: </b>" + notaDeEntrega.CODE_CUSTOMER + "</p>";
                li += "</td>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<p><b> MONTO: </b>" + notaDeEntrega.TOTAL_AMOUNT + "</p>";
                li += "</td>";
                li += "</tr>";
                li += "<tr>";
                li += "<td style='text-align: left;' colspan='2'>";
                li += "<p><b> CLIENTE: </b>" + notaDeEntrega.cliente.RELATED_CLIENT_NAME + "</p>";
                li += "</td>";
                li += "</tr>";
                li += "</table>";
                li += "</li>";
            }

            if (li !== "") {
                objetoDetalle.append(li);
                contenedorDeDetalleDeReporteDeEntrega.trigger("refresh");
            }
            callBack();
        } catch (e) {
            errorCallBack("Error al crear listado de notas de entrega." + e.message);
        } finally {
            objetoDetalle = null;
            contenedorDeDetalleDeReporteDeEntrega = null;
        }
    };

    ReporteDeLiquidacionControlador.prototype.CrearListadoDeOrdenesDeVentaNoEntregadas = function (ordenesDeVentaNoEntregadas, callBack, errorCallBack) {

        var objetoDetalle = $("#UiDetalleReporteDeFacturasNoEntregadas");
        var contenedorDeDetalleDeReporteDeOrdenesDeVentaCanceladas = $("#UiColapsibleReporteOrdenesDeVentaCanceladas");
        try {
            objetoDetalle.children().remove("li");
            ordenesDeVentaNoEntregadas.reverse();

            var li = "";

            for (var i = 0; i < ordenesDeVentaNoEntregadas.length; i++) {
                var ordenDeVenta = ordenesDeVentaNoEntregadas[i];
                li += "<li data-icon='false' style='border-bottom: 2px solid black'>";
                li += "<table style='width: 100%;' data-role='table' data-mode='reflow' class='ui-responsive table-stroke'>";

                //valores
                li += "<tr>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<p><b> ORDEN: </b> " + ordenDeVenta.DOC_NUM + " </p>";
                li += "</td>";
                li += "<td style='width: 50%; text-align: left;'>";
                if (this.campoEsNullOUndefined(ordenDeVenta.ERP_REFERENCE_DOC_NUM)) {
                    li += "<p><b> FACTURA: </b>N/A</p>";
                } else {
                    li += "<p><b> FACTURA: </b>" + ordenDeVenta.ERP_REFERENCE_DOC_NUM + "</p>";
                }
                li += "</td>";
                li += "</tr>";
                li += "<tr>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<p><b> CODIGO: </b>" + ordenDeVenta.CLIENT_CODE + "</p>";
                li += "</td>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<p><b> MONTO: </b>" + ordenDeVenta.TOTAL_AMOUNT + "</p>";
                li += "</td>";
                li += "</tr>";
                li += "<tr>";
                li += "<td style='text-align: left;' colspan='2'>";
                li += "<p><b> CLIENTE: </b>" + ordenDeVenta.CLIENT_NAME + "</p>";
                li += "</td>";
                li += "</tr>";
                li += "</table>";
                li += "</li>";
            }
            if (li !== "") {
                objetoDetalle.append(li);
                contenedorDeDetalleDeReporteDeOrdenesDeVentaCanceladas.trigger("refresh");
            }
            callBack();
        } catch (e) {
            errorCallBack("Error al crear listado de ordenes de venta canceladas." + e.message);
        }
        finally {
            objetoDetalle = null;
            contenedorDeDetalleDeReporteDeOrdenesDeVentaCanceladas = null;
        }
    };

    ReporteDeLiquidacionControlador.prototype.campoEsNullOUndefined = function (campo) {
        return !campo || campo === "undefined" || campo == null || campo == "null";
    }

    ReporteDeLiquidacionControlador.prototype.ImprimirReporte = function () {
        var _este = this;
        switch (_este.reporteSeleccionadoPorElUsuario) {
            case "UiBtnTabLiquidacionDeRuta":
                _este.ObtenerFormatoDeImpresionDeReporteDeLiquidacion();
                break;

            case "UiBtnTabEntregas":
                _este.ObtenerFormatoDeImpresionDeReporteDeLiquidacionDeEntregas();
                break;
        }
    };

    ReporteDeLiquidacionControlador.prototype.VisualizarReporteSeleccionado = function () {
        var objetoReporteRuta = $("#UiTabLiquidacionDeRuta");
        var objetoReporteEntregas = $("#UiTabReporteDeEntregas");

        switch (este.reporteSeleccionadoPorElUsuario) {
            case "UiBtnTabLiquidacionDeRuta":
                objetoReporteRuta.css("display", "block");
                objetoReporteEntregas.css("display", "none");
                break;

            case "UiBtnTabEntregas":
                objetoReporteRuta.css("display", "none");
                objetoReporteEntregas.css("display", "block");
                break;
        }
    };

    ReporteDeLiquidacionControlador.prototype.MostrarErrorDeProceso = function (mensajeDeError) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        my_dialog("", "", "close");
        notify(mensajeDeError);
    };

    ReporteDeLiquidacionControlador.prototype.AgregarInformacionDeDireccionesYEmpresa = function () {
        var empresa = $("#UiNombreEmpresaReporteLiquidacion");
        var empresa2 = $("#UiNombreEmpresa2ReporteLiquidacion");
        var direccion1 = $("#UiDireccion1Empresa");
        var direccion2 = $("#UiDireccion2Empresa");
        var direccion3 = $("#UiDireccion3Empresa");
        var direccion4 = $("#UiDireccion4Empresa");

        EstablecerValorEnCampo(empresa, "POS_COMPANY_NAME");
        EstablecerValorEnCampo(empresa2, "POS_SAT_BRANCH_NAME");
        EstablecerValorEnCampo(direccion1, "direccionFacturacion01");
        EstablecerValorEnCampo(direccion2, "direccionFacturacion02");
        EstablecerValorEnCampo(direccion3, "direccionFacturacion03");
        EstablecerValorEnCampo(direccion4, "direccionFacturacion04");

        empresa = $("#UiNombreEmpresaReporteEntrega");
        empresa2 = $("#UiNombreEmpresa2ReporteEntrega");
        direccion1 = $("#UiDireccion1EmpresaEntrega");
        direccion2 = $("#UiDireccion2EmpresaEntrega");
        direccion3 = $("#UiDireccion3EmpresaEntrega");
        direccion4 = $("#UiDireccion4EmpresaEntrega");

        EstablecerValorEnCampo(empresa, "POS_COMPANY_NAME");
        EstablecerValorEnCampo(empresa2, "POS_SAT_BRANCH_NAME");
        EstablecerValorEnCampo(direccion1, "direccionFacturacion01");
        EstablecerValorEnCampo(direccion2, "direccionFacturacion02");
        EstablecerValorEnCampo(direccion3, "direccionFacturacion03");
        EstablecerValorEnCampo(direccion4, "direccionFacturacion04");

        empresa = null;
        empresa2 = null;
        direccion1 = null;
        direccion2 = null;
        direccion3 = null;
        direccion4 = null;
    };

    return ReporteDeLiquidacionControlador;
}());

function EstablecerValorEnCampo(etiquetaDeCampo, campo) {
    etiquetaDeCampo.text(ObtenerValorDeAlmacenamientoLocal(campo));
}

function ObtenerValorDeAlmacenamientoLocal(campo) {
    var valor = localStorage.getItem(campo);
    return valor ? valor : "...";
}