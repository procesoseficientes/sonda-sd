//var gInvocingTotal = 0;
var _callPreSaleServiceBack;
var _preSalesControllerCustomer;
var _preSaleServiceCallBack;
var _preSaleServiceRelgas;
var _preSaleServiceRelgasIndice;
var _preSaleServiceTotal = 0;
var _preSaleServiceMinimo = 0;
var _preSale = null;
var _preSaleRestante = null;
var _preSaleServiceTotalOrden = 0;
var _preSaleRestP = null;
var _borrarDomi = false;

function DelegarPreSaleController() {
    
}

function UsuarioDeseaAgregarUnProductoMas(idProducto) {
    AumentarEnUnoProductoDeBorradorDeOrdenDeVenta(function(inventario) {
        $("#SKU_QTY_" + inventario.SKU.replace(" ", "_")).html('Cant.: ' + (inventario.QTY) + ' Pre.: Q' + format_number(inventario.PRICE, 2));
        $("#SKU_LINE_TOTAL_" + inventario.SKU.replace(" ", "_")).html('Q' + format_number(inventario.PRICE * inventario.QTY, 2));
        $("#lblTotalSKU").text(format_number(gInvocingTotal, 2));
        socket.emit("CheckInventory", { 'sku': inventario.SKU, 'warehouse': gPreSaleWhs, 'dbuser': gdbuser, 'dbuserpass': gdbuserpass });

    }, function(err) {
        notify(err.message);
    }, idProducto);
}

function ShowPreSalePage(callback, customerId) {
    _callPreSaleServiceBack = callback;
    ObtenerFacturasCliente(customerId);
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE FROM SALES_ORDER_DETAIL WHERE SALES_ORDER_ID = -9999";
            tx.executeSql(sql);

            $("#FechaEntrega").val(ObtenerFechaFutura(1));
        },
        function (err) {
            notify("Error al limpiar SKU seleccionados");
        }
    );
    _preSaleServiceTotal = 0;
    _preSaleServiceMinimo = 0;
    _preSaleServiceTotalOrden = 0;
    _preSale = null;
    _preSaleRestante = null;
    _preSaleRestP = null;
    _borrarDomi = false;
    $("#UiTotalPreVenta").val("");
    PopulateCustomer(function (customer) {
        _preSalesControllerCustomer = customer;
        
        gDescuento = ToDecimal(customer.Discount);
        var porcentajeDescuento = $("#UiPorcentajeDeDescuento");
        porcentajeDescuento.attr("placeholder", ("%Max." + ToDecimal(gDescuento)));
        ToastThis("El porcentaje maximo de descuento es: " +ToDecimal(gDescuento) + "%");

        ObtenerSaldoActual(gClientID, function (idCliente, saldo) {
            window.gSaldoTotal = saldo;
            $.mobile.changePage("#pos_skus_page", { transition: "flow", reverse: true, changeHash: true, showLoadMsg: false });
            $("#lblSaldoTotal").text(format_number(ToDecimal(gSaldoTotal), 2));
        }, function (err) {
            notify("Error al obtener saldo del cliente: " + err.message);
        });

        porcentajeDescuento = null;
    }, function (err) {
        notify(err.message);
    }, customerId);
}

function UserWantsSavePreSale() {
    navigator.notification.confirm("Desea finalizar el documento?",
            function (respuesta) {
                if (respuesta === 2) {
                    my_dialog("", "", "close");
                    ObtenerPosicionGPS(function () {
                        ActualizarTareaEstado(gtaskid, TareaEstado.Completada, function() {
                            SaveTempSale(function (customer) {
                                $("#FechaEntrega").val("");
                                ObtenerReglas("agregaPreventa", function (pReglas) {
                                    ReglaPosteriorFinalizarPreVenta(pReglas, 0, customer, function (customer) {
                                        SeguirPreVenta(customer);
                                    }, function (err) {
                                        my_dialog("", "", "close");
                                        notify(err.message);
                                    });
                                }, function (err) {
                                    my_dialog("", "", "close");
                                    SeguirPreVenta(customer);
                                });
                            }, function (err) {
                                notify(err.message);
                            });
                        }, function(err) {
                            notify(err.message);
                        });
                    });
                } else {
                    my_dialog("", "", "close");
                }
            }, "Sonda® " + SondaVersion,
            "No,Si");
}

function SaveTempSale(callback, errCallBack) {
    GetNexSequence("SALES", function (sequence) {
        ObtenerSecuenciaSiguiente(TipoDocumento.OrdenDeVenta, function(serie, numeroDeDocumento) {
            var sale = {
                SalesOrderId: sequence,
                DocSerie: serie,
                DocNum: numeroDeDocumento,
                Terms: null,
                PostedDatetime: getDateTime(),
                ClientId: _preSalesControllerCustomer.CustomerId,
                PosTerminal: gCurrentRoute,
                GpsUrl: gCurrentGPS,
                TotalAmount: gInvocingTotal,
                Status: 0,
                PostedBy: localStorage.getItem("LAST_LOGIN_ID"),
                Image1: null,
                Image2: null,
                Image3: null,
                DeviceBatteryFactor: gBatteryLevel,
                VoidDatetime: null,
                VoidReason: null,
                VoidNotes: null,
                Voided: null,
                ClosedRouteDatetime: null,
                Datetime: null,
                IsActiveRoute: 1,
                GpsExpected: _preSalesControllerCustomer.Gps,
                SalesOrderIdBo: null,
                IsPosted: 0,
                DeliveryDate: $("#FechaEntrega").val(),
                IsParent: 1,
                ReferenceId: localStorage.getItem("LAST_LOGIN_ID") + getDateTime() + sequence,
                TimesPrinted: 0,
                Sinc: 0,
                IsPostedVoid: 2,
                IsVoid: 0,
                SalesOrderType: gSalesOrderType,
                Discount: _preSalesControllerCustomer.AppliedDiscount,
                SaleDetails: Array()
            };

            GetSaleDetail(sale, function (sale) {
                _preSalesControllerCustomer.Sales.push(sale);
                callback(_preSalesControllerCustomer);
            }, function (err) {
                errCallBack(err);
            });

        }, function(err) {
            errCallBack(err);
        });
    }, function (err) {
        errCallBack(err);
    });

};

function GetSaleDetail(sale, callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT *  ";
             sql += " FROM SALES_ORDER_DETAIL ";
             sql += " WHERE SALES_ORDER_ID=-9999 ";
             sql += " ORDER BY PRICE DESC ";

             tx.executeSql(sql, [],
                function (tx, results) {
                    for (var i = 0; i < results.rows.length ; i++) {
                        var saleDetail = {
                            SalesOrderId: results.rows.item(i).SALES_ORDER_ID,
                            Sku: results.rows.item(i).SKU,
                            LineSeq: results.rows.item(i).LINE_SEQ,
                            Qty: results.rows.item(i).QTY,
                            Price: results.rows.item(i).PRICE,
                            Discount: results.rows.item(i).DISCOUNT,
                            TotalLine: results.rows.item(i).TOTAL_LINE,
                            PostedDatetime: results.rows.item(i).POSTED_DATETIME,
                            Serie: results.rows.item(i).SERIE,
                            Serie2: results.rows.item(i).SERIE_2,
                            RequeriesSerie: results.rows.item(i).REQUERIES_SERIE,
                            ComboReference: results.rows.item(i).COMBO_REFERENCE,
                            ParentSeq: results.rows.item(i).PARENT_SEQ,
                            IsActiveRoute: results.rows.item(i).IS_ACTIVE_ROUTE,
                            SkuName: results.rows.item(i).SKU_NAME,
                            IsPostedVoid: results.rows.item(i).IS_POSTED_VOID,
                            IsVoid: results.rows.item(i).IS_VOID
                        };
                        if (_preSaleServiceMinimo === 0) {
                            _preSaleServiceMinimo = ToDecimal(saleDetail.Price);
                        } else {
                            if (_preSaleServiceMinimo > ToDecimal(saleDetail.Price)) {
                                _preSaleServiceMinimo = ToDecimal(saleDetail.Price);
                            }
                        }

                        sale.SaleDetails.push(saleDetail);
                    }
                    callback(sale);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        });
}

function ShowRepPreSalePage(callback, customer) {
    _preSaleServiceCallBack = callback;
    _preSalesControllerCustomer = customer;
    $.mobile.changePage("#UiPageRepPreSale", { transition: "flow", reverse: true, changeHash: true, showLoadMsg: false });
    //customer.Sales[customer.Sales.length]
    MostrarReportePreventa(_preSalesControllerCustomer);
}

function MostrarReportePreventa(customer) {
    $("#UiEtiquetaRepPreSaleRanzonSocial").text(customer.CustomerName);
    $("#UiEtiquetaRepPreSaleDireccion").text(customer.Address);
    $("#UiEtiquetaRepPreSaleNoTelefono").text(customer.Phone);
    $("#UiEtiquetaRepPreSaleContacto").text(customer.ContactCustomer);
    $("#UiEtiquetaFecEntre").text(customer.Sales[customer.Sales.length - 1].DeliveryDate);
    $("#UiEtiquetaTotal").text(ToDecimal(gInvocingTotal));
    $("#UiEtiquetaSerieDeDocumento").text(customer.Sales[0].DocSerie);
    $("#UiEtiquetaNumeroDeDocumento").text(customer.Sales[0].DocNum);
    $("#UiEtiquetaEstadoOrdenDeVenta").text("Activa");
    $("#listaFirmFotoPreVenta").show();
    $("#listaImprimirPreVenta").hide();
    GenerarListaRepPreSale(customer.Sales[customer.Sales.length - 1].SaleDetails, function() {
        ObtenerPreVentaDetalleSplit(customer.Sales[customer.Sales.length - 1].ReferenceId, function (referenciaId, saleDetail) {
            GenerarListaRepPreSaleCompleto(saleDetail, 0, function() {
                
            }, function(err) {
                notify(err.message);
            });
        }, function(err) {
            notify(err.message);
        });
    }, function (err) {
        notify(err.message);
    });
}

function DarFormatoACantidad(n, currency) {
    return currency + " " + n.toFixed(2).replace(/./g, function (c, i, a) {
        return i > 0 && c !== "." && (a.length - i) % 3 === 0 ? "," + c : c;
    });
}

function GenerarListaRepPreSale(saleDetail, callback, errCallBack) {
    try {
        $('#UiListaRepPrsSale').children().remove('li');
        for (var i = 0; i < saleDetail.length; i++) {
            var item = saleDetail[i];
            var vli = "<li data-icon='false' class='ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'>";
            vli = vli + "<p><h2>" + item.Sku + "/" + item.SkuName + "</h2></p><br>";
            vli = vli + "<p>";
            vli = vli + "<b>Cantidad: </b><span>" + item.Qty + " </span>";
            vli = vli + "<span class='ui-li-count'>Q" + ToDecimal(item.TotalLine) + "</span>";
            vli = vli + "<span class='ui-li-count' style='position:absolute; top:70%'>Q" + ToDecimal(item.Price) + "</span>";
            vli = vli + "</p>";

            $("#UiListaRepPrsSale").append(vli);
            $("#UiListaRepPrsSale").listview('refresh');
        }
        callback();
    } catch (e) {
        errCallBack(e);
    }
}

function LimpiarReportePreVenta() {
    $("#UiEtiquetaRepPreSaleRanzonSocial").text("...");
    $("#UiEtiquetaRepPreSaleDireccion").text("...");
    $("#UiEtiquetaRepPreSaleNoTelefono").text("...");
    $("#UiEtiquetaRepPreSaleContacto").text("...");
    $("#UiEtiquetaSerieDeDocumento").text("...");
    $("#UiEtiquetaNumeroDeDocumento").text("...");
    $("#UiEtiquetaEstadoOrdenDeVenta").text("...");
    $("#UiEtiquetaFecEntre").text("...");
    $("#UiEtiquetaTotal").text("...");
}

function MostrarPaginaEncabezadoPresale(taskId) {
    try {
        ObtenerPreventasEncabezadoCliente(taskId, function (pCliente) {
            $.mobile.changePage("#UiPageRepPreSale", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            LimpiarReportePreVenta();
            var preventa = pCliente.rows.item(0);
            $("#UiEtiquetaRepPreSaleRanzonSocial").text(preventa.CLIENT_NAME);
            $("#UiEtiquetaRepPreSaleDireccion").text(preventa.ADDRESS);
            $("#UiEtiquetaRepPreSaleNoTelefono").text(preventa.PHONE);
            $("#UiEtiquetaRepPreSaleContacto").text(preventa.CONTACT_CUSTOMER);
            $("#UiEtiquetaFecEntre").text(preventa.DELIVERY_DATE);
            $("#UiEtiquetaTotal").text(preventa.TOTAL_AMOUNT);
            $("#UiEtiquetaSerieDeDocumento").text(preventa.DOC_SERIE);
            $("#UiEtiquetaNumeroDeDocumento").text(preventa.DOC_NUM);

            if (preventa.IS_VOID === 0) {
                $("#UiEtiquetaEstadoOrdenDeVenta").text("Activa");
            } else {
                $("#UiEtiquetaEstadoOrdenDeVenta").text("Anulada");
            }

            $("#listaFirmFotoPreVenta").hide();
            if (preventa.TIMES_PRINTED < gMaxImpresiones) {
                $("#listaImprimirPreVenta").show();
            } else {
                $("#listaImprimirPreVenta").hide();
                ToastThis("Ya ha impreso el documento 5 veces");
            }

            ObtenerPreventasDetalleCliente(preventa.REFERENCE_ID, function (pSaleDetail) {
                GenerarListaRepPreSaleCompleto(pSaleDetail, 1, function() {
                    
                }, function (err) {
                    notify("Error al generar el detalle de la orden de venta: " + err.message);
                });
            }, function (err) {
                notify("Error al obtener el detalle de la orden de venta: " + err.message);
            });
        }, function (err) {
            notify("Error al obtener la orden de venta: " + err.message);
        });
    } catch (e) {
        notify("ERROR: " + e.message);
    }
}

function GenerarListaRepPreSaleCompleto(saleDetail,limpiar,callback, errCallback) {
    try {
        if (limpiar === 1) {
            $('#UiListaRepPrsSale').children().remove('li');
        }

        var total = 0;
        var desc = 0;

        for (var i = 0; i < saleDetail.rows.length; i++) {
            var vli = "<li data-icon='false' class='ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'>";
            vli = vli + "<p><h2>" + saleDetail.rows.item(i).SKU + "/" + saleDetail.rows.item(i).SKU_NAME + "</h2></p><br>";
            vli = vli + "<p>";
            vli = vli + "<b>Cantidad: </b><span>" + saleDetail.rows.item(i).QTY + " </span>";
            vli = vli + "<span class='ui-li-count'>Q" + ToDecimal(saleDetail.rows.item(i).TOTAL_LINE) + "</span>";
            vli = vli + "<span class='ui-li-count' style='position:absolute; top:70%'>Q" + ToDecimal(saleDetail.rows.item(i).PRICE) + "</span>";
            vli = vli + "</p>";

            $("#UiListaRepPrsSale").append(vli);
            $("#UiListaRepPrsSale").listview('refresh');

            total = ToDecimal(total + saleDetail.rows.item(i).TOTAL_LINE);
            desc = ToDecimal(total * saleDetail.rows.item(i).DISCOUNT_BY_GENERAL_AMOUNT);
        }

        total = total - desc;

        if (limpiar === 1) {
            $("#UiEtiquetaTotal").text(total);
        }

        callback();
    } catch (e) {
        errCallback(e);
    }
}

function UsuarioDeseaFirmarYTomarFotografiaPreVenta() {
    navigator.notification.confirm("Desea dar por finalizado la orden de venta?", function (buttonIndex) {
        if (buttonIndex === 2) {
            
            MostrarCapturaDeFirmaYFoto(OpcionFirmaYFotoTipo.Firma, function (firma, foto) {
                window.history.back();
                _preSaleServiceCallBack(_preSalesControllerCustomer, firma, foto);
            });
        }
    }, "Sonda® " + SondaVersion, "No,Si");
}

function UsuarioDeseaReImprimirOrdenDeVenta() {
    navigator.notification.confirm("Desea imprimir la orden de venta?", function (buttonIndex) {
        if (buttonIndex === 2) {
            ObtenerDocumnetoImpreso(gtaskid, function (taskid,documento) {
                ImprimirDocumento(documento, function() {
                    ActualizarVecesImpresionDeOrdenDeVenta(taskid, function() {
                        ObtenerNumeroDeImpreciones(taskid, function (taskidN1, numero) {
                            if (numero > (gMaxImpresiones - 1)) {
                                $("#listaImprimirPreVenta").hide();
                                ToastThis("Ya ha impreso el documento 5 veces");
                            }
                            EnviarData();
                        }, function(err) {
                            notify(err.message);
                        });
                    }, function (err) {
                        notify(err.message);
                    });
                }, function(err) {
                    notify(err.message);
                });
            });
        }
    }, "Sonda® " + SondaVersion, "No,Si");
}

function ImprimirPreVenta(customer, opcion, callback, errCallback) {
    try {

        ObtenerFormatoDeImpresionPreSale(
            customer,
            function (cpcl) {
                if (opcion === OpcionImprimir.Ambos || opcion === OpcionImprimir.Imprimir) {
                    bluetoothSerial.write(
                        cpcl,
                        function () {
                            ActualizarDocumnetoImpreso(gtaskid, cpcl, function () {
                                EnviarData();
                                callback();
                            }, function (err) {
                                errCallback(err);
                            });
                        },
                        function() {
                            errCallback(
                            {
                                code: -1,
                                message: "Imposible Imprimir"
                            });
                        });
                } else {
                    ActualizarDocumnetoImpreso(gtaskid, cpcl, function() {
                        callback();
                    }, function(err) {
                        errCallback(err);
                    });
                }
            }, function (err) {
                errCallback(err);
            });
    } catch (e) {
        errCallback(e);
    }
}

function ObtenerFormatoDeImpresionPreSale(customer, callback, errCallback) {
    var lheader = "";
    var ldetail = "";
    var lfooter = "";

    try {
        ObtenerPreventasDetalleCliente(customer.Sales[customer.Sales.length - 1].ReferenceId, function (salesOrdesDetail) {
            CalcularDescuento(salesOrdesDetail.rows.item(0).TOTAL_AMOUNT, salesOrdesDetail.rows.item(0).DISCOUNT, function (descuento) {
                try {
                    var printDocLen = new Number();

                    printDocLen = 350; //header;
                    printDocLen += parseInt(parseInt(salesOrdesDetail.rows.length) * 150); //detail

                    lheader = "! 0 50 50 " + printDocLen + " 1\r\n";
                    lheader += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
                    if (customer.CustomerName.length < 21) {
                        lheader += "CENTER 550 T 1 2 0 10  " + customer.CustomerName + "\r\n";
                    } else {
                        lheader += "CENTER 550 T 0 2 0 10  " + customer.CustomerName + "\r\n";
                    }
                    lheader += "CENTER 550 T 0 2 0 60 " + customer.Address + "\r\n";
                    var serie = customer.Sales[0].DocSerie;
                    var docNum = customer.Sales[0].DocNum;

                    lheader += "CENTER 550 T 0 3 0 90 Orden de Venta Serie " + serie + "\r\n";
                    lheader += "CENTER 550 T 0 3 0 120 No." + docNum + "\r\n";
                    lheader += "CENTER 550 T 0 3 0 150 ***** ORIGINAL ***** \r\n";

                    var pRow = 210;

                    ldetail = "";
                    //var pTotal = 0;

                    for (var i = 0; i < salesOrdesDetail.rows.length; i++) {
                        var item = salesOrdesDetail.rows.item(i);
                        ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " " + item.SKU + "- " + item.SKU_NAME + "\r\n";
                        pRow += parseInt(30);

                        ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " CANTIDAD: " + item.QTY + " / PREC.UNIT. : Q" + format_number(ToDecimal(item.PRICE),2) + "\r\n";
                        ldetail = ldetail + "RIGHT 550 T 0 2 0 " + (pRow) + " Q" + format_number(ToDecimal(item.TOTAL_LINE),2) + "\r\n";
                        pRow += parseInt(30);

                        if (item.SERIE !== 0) {
                            ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " SERIE: " + item.SERIE + "/ IMEI: " + "0" + "/\r\n";
                            pRow += parseInt(30);
                        }

                        if (parseFloat(item.HANDLE_DIMENSION) === 1) {
                            ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " DIMENSION: " + item.LONG + "\r\n";
                            pRow += 30;
                        }

                        ldetail = ldetail + "L 5 " + pRow + " 570 " + pRow + " 1\r\n";
                        pRow += parseInt(10);

                        //pTotal += item.TOTAL_LINE;
                    }

                    pRow += parseInt(30);
                    lfooter += "LEFT 5 T 0 2 0 " + pRow + " SUBTOTAL: \r\n";
                    lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(ToDecimal(salesOrdesDetail.rows.item(0).TOTAL_AMOUNT),2) + "\r\n";

                    pRow += parseInt(30);
                    lfooter += "LEFT 5 T 0 2 0 " + pRow + " DESCUENTO: \r\n";
                    lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(ToDecimal(salesOrdesDetail.rows.item(0).TOTAL_AMOUNT - descuento),2) + "\r\n";

                    pRow += parseInt(30);
                    lfooter += "LEFT 5 T 0 2 0 " + pRow + " TOTAL: \r\n";
                    lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(ToDecimal(descuento),2) + "\r\n";

                    pRow += parseInt(30);
                    lfooter += "CENTER 550 T 0 2 0 " + pRow + " " + getDateTime() + " / RUTA " + gCurrentRoute + " \r\n";

                    pRow += parseInt(30);
                    lfooter += "L 5  80 570 80 1\r\nPRINT\r\n";

                    var pCpCl = (lheader + ldetail + lfooter);

                    callback(pCpCl);
                } catch (er) {
                    errCallback({ code: -1, message: er.message });
                }
            }, function(err) {
                errCallback(err);
            });
            
        }, function(err) {
            errCallback(err);
        });
    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }

}

function SeguirPreVenta(customer) {
    ActualizarIdClienteItems(customer, function () {
        ShowRepPreSalePage(function (customer, firma, foto) {
            ConvertirBorradorAOrdenDeCompra(customer.Sales[customer.Sales.length - 1], firma, foto, gtaskid, _borrarDomi, true, function () {
                ConectarImpresora(localStorage.getItem('PRINTER_ADDRESS'), function () {
                    navigator.notification.confirm("Desea imprimir la orden de venta?",
                    function (respuesta) {
                        if (respuesta === 2) {
                            ImprimirPreVenta(_preSalesControllerCustomer, OpcionImprimir.Ambos, function () {
                                ActualizarVecesImpresionDeOrdenDeVenta(gtaskid, function() {
                                    EnviarData();
                                    _callPreSaleServiceBack();
                                }, function (err) {
                                    notify(err.message);
                                });
                            }, function (err) {
                                notify(err.message);
                            });
                        } else {
                            ImprimirPreVenta(_preSalesControllerCustomer, OpcionImprimir.Guardar, function () {
                                my_dialog("", "", "close");
                                _callPreSaleServiceBack();
                            }, function (err) {
                                notify(err.message);
                            });
                        }
                    }, "Sonda® " + SondaVersion,
                "No,Si");
                });
            }, function (err) {
                notify(err.message);
            });

        }, customer);
    }, function (err) {
        notify(err.message);
    });
}

function ReglaPosteriorFinalizarPreVenta(reglas, reglaActual, customer, callback, errCallbak) {
    try {
        if (reglaActual < reglas.rows.length) {

            var regla = reglas.rows.item(reglaActual);

            switch (regla.TYPE_ACTION) {
                default:
                    callback(customer);
                    break;
            }
        } else {
            callback(customer);
        }
    } catch (err) {
        errCallbak(err.message);
    }
}

function MostrarFacturasPreVEnta(reglas, reglaActual, customer, callback) {
    try {
        _preSaleServiceCallBack = callback;
        _preSaleServiceRelgas = reglas;
        _preSaleServiceRelgasIndice = reglaActual;
        _preSalesControllerCustomer = customer;
        $('#UiListaPreVentaPrincipal').children().remove('li');
        $('#UiListaPreVentaRestante').children().remove('li');
        $.mobile.changePage("#UiPagePreventa", { transition: "flow", reverse: true, changeHash: true, showLoadMsg: false });
    } catch (err) {
        notify(err.message);
    }
}

function AceptarPreVenta() {
    if (_preSale !== null) {
        navigator.notification.confirm("Desea dar por finalizado la orden de venta?", function (buttonIndex) {
            if (buttonIndex === 2) {
                _borrarDomi = true;
                GrabarPreVentasRestantes(0, function () {
                    _preSalesControllerCustomer.Sales[_preSalesControllerCustomer.Sales.length - 1] = _preSale;
                    _preSaleServiceCallBack(_preSaleServiceRelgas, _preSaleServiceRelgasIndice, _preSalesControllerCustomer);
                }, function (err) {
                    alert(err.message);
                });
            }
        }, "Sonda® " + SondaVersion, "No,Si");
    } else {
        notify("Ingrese el total sugerido para la orden de venta principal");
    }
}

function GrabarPreVentasRestantes(index, callback, errCallBack) {
    GetNexSequence("SALES", function(sequence) {
        if (_preSaleRestante.preSaleR.length !== index) {
            ObtenerSecuenciaSiguiente(TipoDocumento.OrdenDeVenta, function(serie, numeroDeDocumento) {
                _preSaleRestante.preSaleR[index].SalesOrderId = sequence;
                _preSaleRestante.preSaleR[index].DocNum = numeroDeDocumento;
                _preSaleRestante.preSaleR[index].IsParent = 0,
                    ConvertirBorradorAOrdenDeCompra(_preSaleRestante.preSaleR[index], null, null, gtaskid, _borrarDomi, false, function() {
                        GrabarPreVentasRestantes(index + 1, function() {
                            callback();
                        }, function(err) {
                            errCallBack(err);
                        });
                    }, function(err) {
                        errCallBack(err);
                    });
            }, function(err) {
                errCallBack(err);
            });
        } else {
            callback();
        }
    }, function(err) {
        errCallBack(err);
    });
}

function AjustarOrdenDeVenta() {
    try {
        _preSale = null;

        _preSaleRestP = null;
        _preSaleServiceTotalOrden = 0;
        var sale = jQuery.extend({}, _preSalesControllerCustomer.Sales[_preSalesControllerCustomer.Sales.length - 1]);
        ObtenerPreVentaDetalle(sale, function (sale, preVentaDetalles) {
            _preSale = jQuery.extend({}, sale);
            _preSale.SaleDetails = Array();
            if (preVentaDetalles.rows.length > 0) {
                for (var i = 0; i < preVentaDetalles.rows.length ; i++) {
                    var saleDetail = {
                        SalesOrderId: preVentaDetalles.rows.item(i).SALES_ORDER_ID,
                        Sku: preVentaDetalles.rows.item(i).SKU,
                        LineSeq: preVentaDetalles.rows.item(i).LINE_SEQ,
                        Qty: preVentaDetalles.rows.item(i).QTY,
                        Price: preVentaDetalles.rows.item(i).PRICE,
                        Discount: preVentaDetalles.rows.item(i).DISCOUNT,
                        TotalLine: preVentaDetalles.rows.item(i).TOTAL_LINE,
                        PostedDatetime: preVentaDetalles.rows.item(i).POSTED_DATETIME,
                        Serie: preVentaDetalles.rows.item(i).SERIE,
                        Serie2: preVentaDetalles.rows.item(i).SERIE_2,
                        RequeriesSerie: preVentaDetalles.rows.item(i).REQUERIES_SERIE,
                        ComboReference: preVentaDetalles.rows.item(i).COMBO_REFERENCE,
                        ParentSeq: preVentaDetalles.rows.item(i).PARENT_SEQ,
                        IsActiveRoute: preVentaDetalles.rows.item(i).IS_ACTIVE_ROUTE,
                        SkuName: preVentaDetalles.rows.item(i).SKU_NAME,
                        IsPostedVoid: preVentaDetalles.rows.item(i).IS_POSTED_VOID,
                        IsVoid: preVentaDetalles.rows.item(i).IS_VOID
                    };
                    _preSaleServiceTotalOrden += ToDecimal(saleDetail.TotalLine);
                    _preSale.SaleDetails.push(saleDetail);
                }
            }

            ObtenerPreVentaDetalleRestante(sale, function (sale, preVentaDetalles) {
                _preSaleRestP = jQuery.extend({}, sale);
                _preSaleRestP.SaleDetails = Array();
                var sl = jQuery.extend({}, sale);
                sl.SaleDetails = Array();
                for (var i = 0; i < preVentaDetalles.rows.length; i++) {
                    var saleDetail = {
                        SalesOrderId: preVentaDetalles.rows.item(i).SALES_ORDER_ID,
                        Sku: preVentaDetalles.rows.item(i).SKU,
                        LineSeq: preVentaDetalles.rows.item(i).LINE_SEQ,
                        Qty: 0,
                        Price: preVentaDetalles.rows.item(i).PRICE,
                        Discount: preVentaDetalles.rows.item(i).DISCOUNT,
                        TotalLine: 0,
                        PostedDatetime: preVentaDetalles.rows.item(i).POSTED_DATETIME,
                        Serie: preVentaDetalles.rows.item(i).SERIE,
                        Serie2: preVentaDetalles.rows.item(i).SERIE_2,
                        RequeriesSerie: preVentaDetalles.rows.item(i).REQUERIES_SERIE,
                        ComboReference: preVentaDetalles.rows.item(i).COMBO_REFERENCE,
                        ParentSeq: preVentaDetalles.rows.item(i).PARENT_SEQ,
                        IsActiveRoute: preVentaDetalles.rows.item(i).IS_ACTIVE_ROUTE,
                        SkuName: preVentaDetalles.rows.item(i).SKU_NAME,
                        IsPostedVoid: preVentaDetalles.rows.item(i).IS_POSTED_VOID,
                        IsVoid: preVentaDetalles.rows.item(i).IS_VOID
                    };
                    for (var j = 0; j < preVentaDetalles.rows.item(i).QTY; j++) {
                        if (_preSale.SaleDetails.length === 0) {
                            saleDetail.Qty += 1;
                            saleDetail.TotalLine = (saleDetail.Qty * saleDetail.Price);
                            _preSaleServiceTotalOrden = (_preSaleServiceTotalOrden + saleDetail.Price);

                            if ((j + 1) === preVentaDetalles.rows.item(i).QTY) {
                                var sdp = jQuery.extend({}, saleDetail);
                                _preSale.SaleDetails.push(sdp);
                            } else {
                                if ((_preSaleServiceTotalOrden + saleDetail.Price) > _preSaleServiceTotal) {
                                    var sdp = jQuery.extend({}, saleDetail);
                                    _preSale.SaleDetails.push(sdp);
                                    saleDetail.Qty = 0;
                                    saleDetail.TotalLine = 0;
                                }
                            }
                        }
                        else if ((_preSaleServiceTotalOrden + saleDetail.Price) <= _preSaleServiceTotal) {
                            saleDetail.Qty += 1;
                            saleDetail.TotalLine = (saleDetail.Qty * saleDetail.Price);
                            _preSaleServiceTotalOrden = (_preSaleServiceTotalOrden + saleDetail.Price);

                            if ((j + 1) === preVentaDetalles.rows.item(i).QTY) {
                                var sdp = jQuery.extend({}, saleDetail);
                                _preSale.SaleDetails.push(sdp);
                            } else {
                                if ((_preSaleServiceTotalOrden + saleDetail.Price) >= _preSaleServiceTotal) {
                                    var sdp = jQuery.extend({}, saleDetail);
                                    _preSale.SaleDetails.push(sdp);
                                    saleDetail.Qty = 0;
                                    saleDetail.TotalLine = 0;
                                }
                            }
                        } else {
                            var sdr = jQuery.extend({}, saleDetail);
                            sdr.Qty = preVentaDetalles.rows.item(i).QTY - (j);
                            sdr.TotalLine = (sdr.Qty * sdr.Price);
                            _preSaleRestP.SaleDetails.push(sdr);
                            break;
                        }
                    }
                }
                GenerarListasDeOrdenes(function () {
                    GenerarPreVenteCF(function () {

                    }, function (err) {
                        notify(err.message);
                    });
                }, function (err) {
                    notify(err.message);
                });
            }, function (err) {
                notify(err.message);
            });
        }, function (err) {
            notify(err.message);
        });
    } catch (err) {
        notify(err.message);
    }
}

function GenerarPreVenteCF(callback, errCallbak) {
    try {
        _preSaleRestante = {
            preSaleR: Array()
        };
        var montoMaximo = 0;
        var slR = jQuery.extend({}, _preSaleRestP);
        slR.SaleDetails = Array();
        for (var i = 0; i < _preSaleRestP.SaleDetails.length; i++) {
            var item = _preSaleRestP.SaleDetails[i];
            var saleDetail = jQuery.extend({}, _preSaleRestP.SaleDetails[i]);
            saleDetail.Qty = 0;
            saleDetail.TotalLine = 0;
            for (var j = 0; j < item.Qty; j++) {
                if ((montoMaximo + saleDetail.Price) <= MaximoCF) {
                    saleDetail.Qty += 1;
                    saleDetail.TotalLine = (saleDetail.Qty * saleDetail.Price);
                    montoMaximo = (montoMaximo + saleDetail.Price);

                    if ((j + 1) === item.Qty) {
                        var sdR = jQuery.extend({}, saleDetail);
                        slR.SaleDetails.push(sdR);
                        if ((i + 1) === _preSaleRestP.SaleDetails.length) {
                            var sdp = jQuery.extend({}, slR);
                            _preSaleRestante.preSaleR.push(sdp);
                        } else {
                            if ((montoMaximo + _preSaleRestP.SaleDetails[i + 1].Price) >= MaximoCF) {
                                var sdp = jQuery.extend({}, slR);
                                _preSaleRestante.preSaleR.push(sdp);
                                slR.SaleDetails = Array();
                                saleDetail.Qty = 0;
                                saleDetail.TotalLine = 0;
                                montoMaximo = 0;
                            }
                        }
                    } else {
                        if ((montoMaximo + saleDetail.Price) >= MaximoCF) {
                            var sdR = jQuery.extend({}, saleDetail);
                            slR.SaleDetails.push(sdR);
                            var sdp = jQuery.extend({}, slR);
                            _preSaleRestante.preSaleR.push(sdp);
                            slR.SaleDetails = Array();
                            saleDetail.Qty = 0;
                            saleDetail.TotalLine = 0;
                            montoMaximo = 0;
                        }
                    }
                }
            }
        }

    } catch (err) {
        errCallbak(err);
    }
}

function QuitarSkuPrincial(sku) {
    if (_preSale.SaleDetails.length === 1 && _preSale.SaleDetails[0].Qty === 1) {
        notify("La orden no puede ir vacia.");
    } else {
        for (var i = 0; i < _preSale.SaleDetails.length; i++) {
            if (_preSale.SaleDetails[i].Sku === sku) {
                _preSale.SaleDetails[i].Qty -= 1;
                _preSale.SaleDetails[i].TotalLine = (_preSale.SaleDetails[i].Qty * _preSale.SaleDetails[i].Price);
                break;
            }
        }
        var spp = Array();
        for (var i = 0; i < _preSale.SaleDetails.length; i++) {
            if (_preSale.SaleDetails[i].Qty > 0) {
                spp.push(_preSale.SaleDetails[i]);
            }
        }
        _preSale.SaleDetails = spp;

        var existe = false;
        for (var i = 0; i < _preSaleRestP.SaleDetails.length; i++) {
            if (_preSaleRestP.SaleDetails[i].Sku === sku) {
                _preSaleRestP.SaleDetails[i].Qty += 1;
                _preSaleRestP.SaleDetails[i].TotalLine = (_preSaleRestP.SaleDetails[i].Qty * _preSaleRestP.SaleDetails[i].Price);
                existe = true;
                break;
            }
        }
        if (!existe) {
            var sale = jQuery.extend({}, _preSalesControllerCustomer.Sales[_preSalesControllerCustomer.Sales.length - 1]);
            for (var i = 0; i < sale.SaleDetails.length; i++) {
                if (sale.SaleDetails[i].Sku === sku) {
                    var sldr = jQuery.extend({}, sale.SaleDetails[i]);
                    sldr.Qty = 1;
                    sldr.TotalLine = sldr.Price;
                    _preSaleRestP.SaleDetails.push(sldr);
                    break;
                }
            }
        }
        GenerarListasDeOrdenes(function () {
            GenerarPreVenteCF(function () {

            }, function (err) {
                notify(err.message);
            });
        }, function (err) {
            notify(err.message);
        });
    }
}

function QuitarSkuRestante(sku) {
    for (var i = 0; i < _preSaleRestP.SaleDetails.length; i++) {
        if (_preSaleRestP.SaleDetails[i].Sku === sku) {
            _preSaleRestP.SaleDetails[i].Qty -= 1;
            _preSaleRestP.SaleDetails[i].TotalLine = (_preSaleRestP.SaleDetails[i].Qty * _preSaleRestP.SaleDetails[i].Price);
            break;
        }
    }
    var spp = Array();
    for (var i = 0; i < _preSaleRestP.SaleDetails.length; i++) {
        if (_preSaleRestP.SaleDetails[i].Qty > 0) {
            spp.push(_preSaleRestP.SaleDetails[i]);
        }
    }
    _preSaleRestP.SaleDetails = spp;

    var existe = false;
    for (var i = 0; i < _preSale.SaleDetails.length; i++) {
        if (_preSale.SaleDetails[i].Sku === sku) {
            _preSale.SaleDetails[i].Qty += 1;
            _preSale.SaleDetails[i].TotalLine = (_preSale.SaleDetails[i].Qty * _preSale.SaleDetails[i].Price);
            existe = true;
            break;
        }
    }
    if (!existe) {
        var sale = jQuery.extend({}, _preSalesControllerCustomer.Sales[_preSalesControllerCustomer.Sales.length - 1]);
        for (var i = 0; i < sale.SaleDetails.length; i++) {
            if (sale.SaleDetails[i].Sku === sku) {
                var sldr = jQuery.extend({}, sale.SaleDetails[i]);
                sldr.Qty = 1;
                sldr.TotalLine = sldr.Price;
                _preSale.SaleDetails.push(sldr);
                break;
            }
        }
    }
    GenerarListasDeOrdenes(function () {
        GenerarPreVenteCF(function () {

        }, function (err) {
            notify(err.message);
        });
    }, function (err) {
        notify(err.message);
    });

}

function GenerarListasDeOrdenes(callback, errCallbak) {
    try {
        var vli = "";
        var totalP = 0;
        $('#UiListaPreVentaPrincipal').children().remove('li');
        for (var i = 0; i < _preSale.SaleDetails.length; i++) {
            var item = _preSale.SaleDetails[i];
            if (item.Qty > 0) {
                vli = "<li>";
                vli = vli + "<a href='#'>";
                vli = vli + "<h5>" + item.Sku + "/" + item.SkuName + "</h5>";
                vli = vli + "<b>Cant:</b><span>" + item.Qty + " </span>";
                vli = vli + "<b>P/U:</b><span>" + ToDecimal(item.Price) + " </span>";
                vli = vli + "<span class='ui-li-count' style='position:absolute; top:70%'>Q" + ToDecimal(item.TotalLine) + "</span>";
                vli = vli + "</a>";

                if (ToDecimal(item.Price) <= MaximoCF) {
                    var pClick = 'QuitarSkuPrincial("' + item.Sku + '");';
                    vli = vli + "<a href='#' class='ui-alt-icon ui-shadow ui-nodisc-icon ui-icon-minus' onclick='" + pClick + "' ></a>";
                }
                vli = vli + "</li>";
                totalP += item.TotalLine;
                $("#UiListaPreVentaPrincipal").append(vli);
                $("#UiListaPreVentaPrincipal").listview('refresh');
            }
        }
        vli = "<li>";
        vli = vli + "<h5>Total</h5>";
        vli = vli + "<span class='ui-li-count'> Q " + ToDecimal(totalP) + "</span>";
        vli = vli + "</li>";
        $("#UiListaPreVentaPrincipal").append(vli);
        $("#UiListaPreVentaPrincipal").listview('refresh');

        totalP = 0;
        $('#UiListaPreVentaRestante').children().remove('li');
        for (var i = 0; i < _preSaleRestP.SaleDetails.length; i++) {
            var item = _preSaleRestP.SaleDetails[i];
            if (item.Qty > 0) {
                vli = "<li>";
                vli = vli + "<a href='#'>";
                vli = vli + "<h5>" + item.Sku + "/" + item.SkuName + "</h5>";
                vli = vli + "<b>Cant:</b><span>" + item.Qty + " </span>";
                vli = vli + "<b>P/U:</b><span>" + ToDecimal(item.Price) + " </span>";
                vli = vli + "<span class='ui-li-count' style='position:absolute; top:70%'>Q" + ToDecimal(item.TotalLine) + "</span>";
                vli = vli + "</a>";
                var pClick = 'QuitarSkuRestante("' + item.Sku + '");';
                vli = vli + "<a href='#' class='ui-alt-icon ui-shadow ui-nodisc-icon ui-icon-minus' onclick='" + pClick + "' ></a>";
                vli = vli + "</li>";
                totalP += item.TotalLine;
                $("#UiListaPreVentaRestante").append(vli);
                $("#UiListaPreVentaRestante").listview('refresh');
            }
        }
        if (totalP > 0) {
            vli = "<li>";
            vli = vli + "<h5>Total</h5>";
            vli = vli + "<span class='ui-li-count'> Q " + ToDecimal(totalP) + "</span>";
            vli = vli + "</li>";
            $("#UiListaPreVentaRestante").append(vli);
            $("#UiListaPreVentaRestante").listview('refresh');
        }
        callback();
    } catch (err) {
        errCallbak(err);
    }
}

function UsuarioDeseaVerOpcionesDeTipoDeOrdenesDeVenta(callback,errCallBack) {
    try {
        // Prepare the picker configuration
        var config = {
            title: "Tipo de Orden de Venta",
            items: [
                { text: "Contado", value: OrdenDeVentaTipo.Contado },
                { text: "Credito", value: OrdenDeVentaTipo.Credito}
            ],
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };
        // Show the picker
        window.plugins.listpicker.showPicker(config,
        function (item) {
            switch (item) {
                case OrdenDeVentaTipo.Contado:
                    window.gSalesOrderType = OrdenDeVentaTipo.Contado;
                    ToastThis("Orden de Venta de Tipo: Contado");
                    callback();
                    break;
                case OrdenDeVentaTipo.Credito:
                    window.gSalesOrderType = OrdenDeVentaTipo.Credito;
                    ToastThis("Orden de Venta de Tipo: Credito");
                    callback();
                    break;
            }
        }
        );
    } catch (e) {
        notify("Error al cargar los Tipos de Orden de Venta: " + e.message);
        errCallBack(e);
    }
}