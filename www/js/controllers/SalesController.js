var gInvocingTotal = 0;
var gSaldoTotal = 0.00;
var gDescuento = 0.00;
var _callSalesServiceBack;
var _salesControllerCustomer;
var datosSku = null;
var ventanaPopUP;

function DelagateSalesController() {
    $("#pos_skus_page").on("pageshow", function () {
        //VistaVentaTerminoDeCarga();
        if (gTaskType === TareaTipo.Preventa) {
            if ($("#FechaEntrega").val() === "") {
                $("#FechaEntrega").val(ObtenerFechaFutura(1));
            }
            document.getElementById("panelFechaEntrega").style.display = "";
        } else {
            document.getElementById("panelFechaEntrega").style.display = "none";
        }
    });


    $("#AcceptQtyDispatch").bind("touchstart", function () {
        var qtySkuRecivida = $("#qtySku");
        UsuarioDeseaAgregarSku(qtySkuRecivida.val());
        qtySkuRecivida = null;
    });

    
}


function VistaVentaTerminoDeCarga() {
    ObtenerSaldoActual(gClientID, function (idCliente, saldo) {
        gSaldoTotal = saldo;
        PopulateSalesSKUsList(gTaskType);
    }, function(err) {
        notify("Error al obtener saldo del cliente: " + err.message);
    });
}

function BorrarDetallesTemporales() {
    try {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999";
            tx.executeSql(sql);
            $("#lblSaldoTotal").text("0.00");
            $("#lblTotalSKU").text("0.00");
            $("#lblTotalDescuento").text("0.00");
            $("#UiPorcentajeDeDescuento").val("");
            $('#pos_skus_page_listview').children().remove('li');

            $('#ulPaymentConsignment').children().remove('li');
            $('#uiPaymentLstInvoiceTotal').children().remove('li');
            $("#lblConsignmentTotal").text("0.00");

            $('#uiPaymentLstInfInvoice_Det').children().remove('li');
            gInvocingTotal = 0;
        }, function (err) {
            ToastThis(err.message);
        }, function () { }
        );
    }
    catch (e) {
        ToastThis(e.message);
    }
}

function PosSkuSwipeHandler(event) {
    try {
        if (event.type === "swipeleft") {
            event.preventDefault();

            var id = $(this).attr('id');
            var sku = id.substring(4, id.length);
            var lineSeq = $(this).attr('LineSeq');
            var serie = $(this).attr('SkuSerie');

            try {
                navigator.notification.confirm(
                    "Confirma remover de la lista al SKU " + sku + "?", // message
                    function (buttonIndex) {
                        if (buttonIndex === 2) {
                            RemoveSKU(sku, lineSeq, serie, gTaskType);
                        }
                    }, // callback to invoke with index of button pressed
                    'Sonda® ' + SondaVersion, // title
                    'No,Si' // buttonLabels
				);

            } catch (e) {
                alert("PosSkuSwipeHandler: " + e.message);
            }

        }
    } catch (e1) {
        alert("sku_swipe:" + e1.message);
    }
}

function RemoveSKU(idSku, lineSeq, serie, tareaTipo) {
    try {

        SONDA_DB_Session.transaction(
                function (tx) {
                    var sql = "";
                    if (tareaTipo === TareaTipo.Venta) {
                        sql = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND LINE_SEQ = " + lineSeq;
                        tx.executeSql(sql);

                        var sql1 = "UPDATE SKU_SERIES SET STATUS = 0 WHERE SKU = '" + idSku + "' AND SERIE = '" + serie + "'";
                        tx.executeSql(sql1);
                    } else {
                        sql = "DELETE FROM SALES_ORDER_DETAIL WHERE SALES_ORDER_ID = -9999 AND LINE_SEQ = " + lineSeq;
                        tx.executeSql(sql);
                    }
            },
                function (err) {
                    notify("RemoveSKU: " + err.message);
                },
            function () {
                ObtenerSaldoActual(gClientID, function (idCliente, saldo) {
                    gSaldoTotal = saldo;
                    PopulateSalesSKUsList(gTaskType);
                }, function (err) {
                    notify("Error al obtener saldo del cliente: " + err.message);
                });
                my_dialog("", "", "close");
            }
        );


    } catch (e) {
        notify("RemoveSKU: " + e.message);
    }
}

function ShowSalesPage(callback, customerId) {
    _callSalesServiceBack = callback;
    PopulateCustomer(function (customer) {
        _salesControllerCustomer = customer;

        gDescuento = ToDecimal(customer.Discount);
        var porcentajeDescuento = $("#UiPorcentajeDeDescuento");
        porcentajeDescuento.attr("placeholder", ("%Max. " + ToDecimal(gDescuento)));
        ToastThis("El porcentaje maximo de descuento es: " + ToDecimal(gDescuento) + "%");

        var balance = customer.Balance;
        if (balance > 0) {
            ShowPaymentPage(function (customer, firma, foto) {
                $.mobile.changePage("#pos_skus_page", { transition: "flow", reverse: true, changeHash: true, showLoadMsg: false });
            }, customer);
        } else {
            $.mobile.changePage("#pos_skus_page", { transition: "flow", reverse: true, changeHash: true, showLoadMsg: false });
        }

        porcentajeDescuento = null;
    }, function (err) {
        notify(err.message);
    }, customerId);

}

function UserWantsSaveInvoice() {
    navigator.notification.confirm("Desea finalizar el documento?",
        function (respuesta) {
            if (respuesta === 2) {
                my_dialog("", "", "close");

                SaveTempInvoice(function (customer) {
                    ActualizarIdClienteItems(customer, function () {
                        ShowPaymentPage(function (cust, firma, foto) {
                            if (cust.Balance === 0) {
                                ConectarImpresora(localStorage.getItem('PRINTER_ADDRESS'), function () {
                                    ObtenerPosicionGPS(function () {
                                        PostearFacturasPagadas(firma, foto, cust, function () {
                                            GuardarConsignacion(cust.Consignments, function () {
                                                var facturaActual = cust.Invoices[cust.Invoices.length - 1];
                                                ImprimirFactura(facturaActual.InvoiceNum, "", function () {
                                                    EnviarData();
                                                    PopulateCustomer(function (pCustomer) {
                                                        _callSalesServiceBack(pCustomer);
                                                    }, function (err) {
                                                        notify(err.message);
                                                        _callSalesServiceBack(customer);
                                                    }, cust.CustomerId);
                                                }, function (err) {
                                                    EnviarData();
                                                    notify(err.message);
                                                    _callSalesServiceBack(customer);
                                                });
                                            }, function (err) {
                                                notify(err.message);
                                            });

                                        }, function (err) {
                                            notify(err.message);
                                        });
                                    });
                                });
                            } else {
                                notify("ERROR, Debe cancelar la totalidad de la factura Q" + format_number(gInvocingTotal, 2));
                            }
                        }, customer);
                    }, function (err) {
                        notify(err.message);
                    });
                }, function (err) {
                    notify(err.message);
                });

            } else {
                my_dialog("", "", "close");
            }
        }, "Sonda® " + SondaVersion,
        "No,Si");
}

function GetInvoiceDetail(invoice, callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT *  ";
             sql += " FROM INVOICE_DETAIL ";
             sql += " WHERE INVOICE_NUM=-9999";

             tx.executeSql(sql, [],
                function (tx, results) {
                    for (var i = 0; i < results.rows.length ; i++) {
                        var rows = {
                            InvoiceNum: results.rows.item(i).INVOICE_NUM,
                            SKU: results.rows.item(i).SKU,
                            SKU_NAME: results.rows.item(i).SKU_NAME,
                            QTY: results.rows.item(i).QTY,
                            PRICE: results.rows.item(i).PRICE,
                            DISCOUNT: results.rows.item(i).DISCOUNT,
                            TOTAL_LINE: results.rows.item(i).TOTAL_LINE,
                            SERIE: results.rows.item(i).SERIE,
                            SERIE_2: results.rows.item(i).SERIE_2,
                            REQUERIES_SERIE: results.rows.item(i).REQUERIES_SERIE,
                            LINE_SEQ: results.rows.item(i).LINE_SEQ,
                            IS_ACTIVE: results.rows.item(i).IS_ACTIVE,
                            COMBO_REFERENCE: results.rows.item(i).COMBO_REFERENCE,
                            PARENT_SEQ: results.rows.item(i).PARENT_SEQ,
                            EXPOSURE: results.rows.item(i).EXPOSURE,
                            PHONE: results.rows.item(i).PHONE
                        };
                        invoice.InvoiceRows.push(rows);
                    }

                    callback(invoice);

                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        }
            );
}

function SaveTempInvoice(callback, errCallBack) {
    var invoice = {
        InvoiceNum: (new Number(localStorage.getItem('POS_CURRENT_INVOICE_ID')) + 1),
        Terms: null,
        PostedDatetime: getDateTime(),
        ClientId: _salesControllerCustomer.CustomerId,
        ClientName: _salesControllerCustomer.CustomerName,
        PosTerminal: gCurrentRoute,
        Gps: gCurrentGPS,
        TotalAmount: gInvocingTotal,
        PaidToDate: 0,
        ErpInvoiceId: 0,
        IsPosted: 0,
        Status: 0,
        IsCreditNote: 0,
        VoidReason: null,
        VoidNotes: null,
        VoidInvoiceId: null,
        PrintRequest: null,
        PrintedCount: null,
        AuthId: localStorage.getItem('POS_SAT_RESOLUTION'),
        SatSerie: localStorage.getItem('POS_SAT_RES_SERIE'),
        Change: null,
        Img1: null,
        Img2: null,
        Img3: null,
        IsDraf: true,
        InvoiceRows: Array()
    };

    GetInvoiceDetail(invoice, function (invoice) {
        _salesControllerCustomer.Invoices.push(invoice);
        callback(_salesControllerCustomer);
    }, function (err) {
        errCallBack(err);
    });


};

function UserWantsChooseItem() {
    PopulateSKUGrid(gTaskType);
    $.mobile.changePage("#skus_list_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}

function GetNextSKUSeq() {
    var pSeq = Number(localStorage.getItem('POS_ITEM_SEQ'));
    return pSeq;

}

function ValidatedSKUQty(pSku, pQty, tareaTipo, callback, errCallback) {
    if (tareaTipo === TareaTipo.Venta) {
        SONDA_DB_Session.transaction(
             function (tx) {
                 var sql = "SELECT SKU_NAME";
                 sql += " FROM SKUS";
                 sql += " WHERE";
                 sql += " sku='" + pSku + "'";
                 sql += " AND ON_HAND >= " + pQty;

                 tx.executeSql(sql, [],
                    function (tx, results) {
                        if (results.rows.length > 0) {
                            callback();
                        } else {
                            errCallback({ message: "Cantidad seleccionada sobrepasa las existencias" });
                        }
                    },
                    function (tx, err) {
                        if (err.code !== 0)
                            errCallback(err);
                    }
                );
             },
            function (err) {
                errCallback(err);
            }
                );
    } else {
        callback();
    }
}

function AddSKU(pSku, pSkuName, pSkuParent, tareaTipo, pQty) {
    try {
        ValidatedSKUQty(pSku, pQty, tareaTipo, function myfunction() {
            ObtenerListaDePreciosDeCliente(gClientID, function (listaDePrecio) {
                var pSeq = GetNextSKUSeq();
                if (tareaTipo === TareaTipo.Venta) {
                    InsertInvoiceDetail(pSku, pSeq, pQty, listaDePrecio);
                } else {
                    InsertSaleOrderDetail(pSku, pSeq, pQty, listaDePrecio);
                }
                ObtenerSaldoActual(gClientID, function(idCliente, saldo) {
                    gSaldoTotal = saldo;
                    PopulateSalesSKUsList(gTaskType);

                    localStorage.setItem('POS_ITEM_SEQ', pSeq + 1);

                    $("#" + pSkuParent.replace(" ", "_")).remove();
                    $("#skus_listview_panel").listview('refresh');
                }, function(err) {
                    notify("Error al obtener saldo del cliente: " + err.message);
                });
            }, function(err) {
                notify("Error al obtener lista de precios del cliente: " + err.message);
            });
        }, function (err) {
            notify(err.message);
            console.log("catch: " + err.message);
        });
    } catch (e) {
        notify("AddSKU: " + e.message); console.log("catch: " + e.message);
    }

}

function SetSKUCant(pSKU, pSKU_NAME, pLineSeq, qty, precioUnitario, tareaTipo,data) {
    var cantidad = $("#UiCantidadSKU");
    var sku = $("#lblSKU_IDCant");
    var ultimaCantidad = $("#ultPedido");

    LimpiarCamposCantidadSku();

    sku.text(pSKU + " " + pSKU_NAME);
    sku.attr("LineSeq", pLineSeq);
    sku.attr("SKU", pSKU);
    sku.attr("precioUnitario", precioUnitario);
    cantidad.val(qty);

    ultimaCantidad.text(data.pLastQtySold);
    //ultimaCantidad.hide();


    //UsuarioDeseaCalcularDenominaciones();

    $.mobile.changePage("#skucant_page", {
        transition: "none",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });

    sku = null;
    cantidad = null;
    ultimaCantidad = null;
}

function SetSKUSeries(pSKU, pSKU_NAME, pLineSeq, tareaTipo) {

    $.mobile.changePage("#series_page", {
        transition: "slide",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
    PopulateSKUSeriesGrid(pSKU, pLineSeq);

}

function PopulateSKUSeriesGrid(pSKU, pLINE_SEQ) {
    //my_dialog("Cargando listado Series", "Espere...", "open");

    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                var pDoc = '';
                var pImg = '';
                var pSQL = "SELECT * FROM SKU_SERIES";// WHERE SKU= '" + pSKU + "' AND STATUS=0"; //
                console.log(pSQL);
                tx.executeSql(pSQL, [],
                    function (tx, results) {
                        $('#series_listview_panel').children().remove('li');
                        $("#divSeriesSKU").attr('LineSeq', pLINE_SEQ);
                        for (i = 0; i <= (results.rows.length - 1) ; i++) {


                            var xonclick2 = 'UpdateSKUSeries(' + "'" + pSKU + "'," + pLINE_SEQ + ",'" + results.rows.item(i).SERIE + "','" + results.rows.item(i).ICC + "','" + results.rows.item(i).PHONE + "'" + ');';

                            //tx.executeSql('CREATE TABLE IF NOT EXISTS SKU_SERIES(SKU, IMEI, SERIE, PHONE, ICC, STATUS, LOADED_LAST_UPDATED)');
                            var vLi = '';
                            vLi += '<li class="ui-nodisc-icon ui-alt-icon">';
                            vLi += '<a href="#" onclick="' + xonclick2 + '">';
                            vLi += '<p><span class="title">' + results.rows.item(i).SERIE + '</span></p>';
                            vLi += '<p><div class="ui-nodisc-icon ui-alt-icon">';

                            xonclick2 = "notify('IMEI: " + results.rows.item(i).ICC + "');";
                            vLi += '<a style="text-align:center" href="#" class="ui-corner-all ui-btn-icon-notext ui-btn-inline ui-btn-icon-left ui-btn ui-btn-c ui-shadow ui-icon-tag ui-nodisc-icon" onclick="' + xonclick2 + '">IMEI</a>';

                            xonclick2 = "notify('Celular: " + results.rows.item(i).PHONE + "');";
                            vLi += '<a style="text-align:center" href="#" class="ui-corner-all ui-btn-icon-notext ui-btn-inline ui-btn-icon-left ui-btn ui-btn-c ui-shadow ui-icon-phone ui-nodisc-icon" onclick="' + xonclick2 + '">' + results.rows.item(i).PHONE + '</a>';
                            vLi += '</div></a></li>';

                            //  console.log(vLI);


                            $("#series_listview_panel").append(vLi);

                        }
                        console.log("termino.");
                        $("#series_listview_panel").listview('refresh');
                        my_dialog("", "", "close");
                    },
                    function (err) {
                        console.log("01.40.99:" + err.code);

                        my_dialog("", "", "close");
                        if (err.code !== 0) {
                            alert("Error processing SQL: " + err.code);
                        }
                    }
                );
            },
            function (err) {
                console.log("01.40.100:" + err.code);
                if (err.code !== 0) {
                    alert("Error processing SQL: " + err.code);
                }
            }
        );
    } catch (e) {
        alert(e.message);
        my_dialog("", "", "close"); console.log(e.message);
    }


}

function SetSpecifiSKUQty(pQTY) {
    var pSKU = $("#lblSKU_IDCant").attr("SKU");

    AddSKU(pSKU, "", pSKU, gTaskType, pQTY);

    $.mobile.changePage("#pos_skus_page", { transition: "none", reverse: true, changeHash: true, showLoadMsg: false });
}

function AgregarUnSkuMas(pSku, pSkuName, pSkuParent, pQty, tareaTipo) {
    var pSql = "";
    if (tareaTipo === TareaTipo.Venta) {
        pSql = "SELECT REQUERIES_SERIE FROM SKUS S WHERE S.SKU = '" + pSkuParent + "'";
    } else {
        pSql = "SELECT 0  AS REQUERIES_SERIE FROM SKU_PRESALE S WHERE S.SKU =  '" + pSkuParent + "'";
    }


    SONDA_DB_Session.transaction(
    function (tx) {
        tx.executeSql(pSql, [],
            function (tx, results) {
                var pRequeriesSerie = results.rows.item(0).REQUERIES_SERIE;

                if (pRequeriesSerie === 1) {
                    AddSKU(pSku, pSkuName, pSkuParent, tareaTipo, pQty);
                } else {
                    AddSKU(pSku, pSkuName, pSkuParent, tareaTipo, pQty + 1);
                }
            }, function (tx, err) {

            });
    });
}

//Se pasa
function PopulateSalesSKUsList(tareaTipo) {
    try {
        gInvocingTotal = 0;
        $("#lblTotalSKU").text("0.00");
        $("#lblSaldoTotal").text("0.00");
        //$("#lblTotalDescuento").text("0.00");
        UsuarioDeseaCambiarDescuento();

        $('#pos_skus_page_listview').children().remove('li');
        SONDA_DB_Session.transaction(
            function (tx) {
                var sql = '';
                if (tareaTipo === TareaTipo.Venta) {
                    sql = 'SELECT A.SKU';
                    sql += ', A.PRICE';
                    sql += ', B.SKU_NAME';
                    sql += ', A.QTY';
                    sql += ', A.TOTAL_LINE';
                    sql += ', A.REQUERIES_SERIE';
                    sql += ', A.LINE_SEQ';
                    sql += ', B.IS_KIT';
                    sql += ', A.SERIE';
                    sql += ', A.SERIE_2';
                    sql += ' FROM INVOICE_DETAIL A';
                    sql += ' INNER JOIN SKUS B ON(B.SKU = A.SKU)';
                    sql += ' WHERE A.INVOICE_NUM = -9999 AND B.EXPOSURE = 1';
                    sql += ' ORDER BY B.SKU_NAME';
                } else if (tareaTipo === TareaTipo.Preventa) {
                    sql = "SELECT A.SKU";
                    sql += " ,A.PRICE";
                    sql += " ,A.SKU_NAME";
                    sql += " ,A.QTY";
                    sql += " ,A.TOTAL_LINE";
                    sql += " ,A.REQUERIES_SERIE";
                    sql += " ,A.LINE_SEQ";
                    sql += " ,0 IS_KIT";
                    sql += " ,A.SERIE";
                    sql += " ,A.SERIE_2";
                    sql += " ,B.ON_HAND-B.IS_COMITED AVAILABLE";
                    sql += " FROM SALES_ORDER_DETAIL A";
                    sql += " INNER JOIN SKU_PRESALE B ON (B.SKU = A.SKU)";
                    sql += " WHERE A.SALES_ORDER_ID = -9999";
                    sql += " ORDER BY A.SKU_NAME";
                }

                tx.executeSql(sql, [],
                    function (tx, results) {
                        if (results.rows.length <= 0) {
                            //return 0;
                        } else {
                            for (var i = 0; i <= (results.rows.length - 1) ; i++) {
                                try {
                                    var pSku = null;
                                    var pPrice = null;
                                    var pSkuName = null;
                                    var pQty = null;
                                    var pTotalLine = null;
                                    var pRequeriesSerie = null;
                                    var pSerie = null;
                                    var pSerie2 = null;
                                    var pLineSeq = null;
                                    var vLi =null;
                                    var onSkuClick = null;

                                    if (tareaTipo === TareaTipo.Venta) {
                                        pSku = results.rows.item(i).SKU;
                                        pPrice = results.rows.item(i).PRICE;
                                        pSkuName = results.rows.item(i).SKU_NAME;
                                        pQty = results.rows.item(i).QTY; //var pTOTAL_LINE = productos(i).TOTAL_LINE;
                                        pTotalLine = (pQty * pPrice);
                                        pRequeriesSerie = results.rows.item(i).REQUERIES_SERIE;
                                        pSerie = results.rows.item(i).SERIE;
                                        pSerie2 = results.rows.item(i).SERIE_2;
                                        pLineSeq = results.rows.item(i).LINE_SEQ;
                                        vLi = '<li LineSeq="' + pLineSeq + '" SkuSerie="' + pSerie + '" id="SKU_' + pSku + '" data-filtertext="' + pSku + ' ' + pSkuName + '">';
                                        onSkuClick = ""; // ReSharper disable once CoercedEqualsUsing
                                        if (pRequeriesSerie == 1) {
                                            onSkuClick = 'SetSKUSeries(' + "'" + pSku + "','" + pSkuName.replace(/"|'/g, "") + "'" + ',' + pLineSeq + ",'" + tareaTipo + "');";
                                            vLi = vLi + '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' + onSkuClick + '">';

                                        } else {

                                            onSkuClick = 'SetSKUCant(' + "'" + pSku + "','" + pSkuName.replace(/"|'/g, "") + "'" + ',' + pLineSeq + ',' + pQty + ',' + pPrice + ",'" + tareaTipo + "');";
                                            vLi = vLi + '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' + onSkuClick + '">';
                                        }
                                        vLi = vLi + '<span class="small-roboto">' + pSku +' '+ pSkuName + '</span>';
                                        vLi = vLi + '<p><span id="SKU_QTY_' + pSku + '" class="small-roboto">Cant.: ' + pQty + ' Pre.: Q' + format_number(pPrice, 2) + '</span></p>';

                                        //vLI = vLI + '<p><span class="small-roboto">Total: Q' + format_number(pTOTAL_LINE, 2) + '</span></p>'

                                        // ReSharper disable once CoercedEqualsUsing
                                        if (pRequeriesSerie == 1) {
                                            if (pSerie === 0) {
                                                vLi = vLi + '<span style="color:red" class="small-roboto">Se requiere info. adicional</span>';
                                            } else {
                                                vLi = vLi + '<span style="color:blue" class="small-roboto">SN:' + pSerie + ' IM:' + pSerie2 + '</span>';
                                            }
                                        }

                                        vLi = vLi + '<span class="small-roboto ui-li-count">Q' + format_number(pTotalLine, 2) + '</span></a>';

                                        gInvocingTotal = gInvocingTotal + pTotalLine;

                                        $("#pos_skus_page_listview").append(vLi);

                                        $("#lblTotalSKU").text(format_number(gInvocingTotal, 2));
                                    } else { //preventa 
                                        pSku = results.rows.item(i).SKU;
                                        pPrice = results.rows.item(i).PRICE;
                                        pSkuName = results.rows.item(i).SKU_NAME;
                                        pQty = results.rows.item(i).QTY;
                                        pTotalLine = (pQty * pPrice);
                                        pRequeriesSerie = results.rows.item(i).REQUERIES_SERIE;
                                        pSerie = results.rows.item(i).SERIE;
                                        pSerie2 = results.rows.item(i).SERIE_2;
                                        pLineSeq = results.rows.item(i).LINE_SEQ;
                                        var disponible = results.rows.item(i).AVAILABLE;
                                        vLi = '<li LineSeq="' + pLineSeq + '" SkuSerie="' + pSerie + '" id="SKU_' + pSku + '" data-filtertext="' + pSku + ' ' + pSkuName + '">';
                                        onSkuClick = ""; // ReSharper disable once CoercedEqualsUsing
                                        if (pRequeriesSerie == 1) {
                                            onSkuClick = 'SetSKUSeries(' + "'" + pSku + "','" + pSkuName.replace(/"|'/g, "") + "'" + ',' + pLineSeq + ",'" + tareaTipo + "');";
                                            vLi = vLi + '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' + onSkuClick + '">';

                                        } else {

                                            onSkuClick = 'SetSKUCant(' + "'" + pSku + "','" + pSkuName.replace(/"|'/g, "") + "'" + ',' + pLineSeq + ',' + pQty + ',' + pPrice + ",'" + tareaTipo + "');";
                                            vLi = vLi + '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' + onSkuClick + '">';
                                        }
                                        vLi = vLi + '<span class="small-roboto">' + pSkuName + '</span>';
                                        vLi = vLi + '<p><span id="SKU_QTY_' + pSku.replace(" ", "_") + '" class="small-roboto">Cant.: ' + pQty + ' Pre.: Q' + format_number(pPrice, 2) + '</span></p>';
                                        vLi += '<p><span id="SKU_AVAIL_' + pSku.replace(" ", "_") + '" class="small-roboto">Disponible: ' + disponible + '</span></p>';
                                        //vLI = vLI + '<p><span class="small-roboto">Total: Q' + format_number(pTOTAL_LINE, 2) + '</span></p>'

                                        // ReSharper disable once CoercedEqualsUsing
                                        if (pRequeriesSerie == 1) {
                                            if (pSerie === 0) {
                                                vLi = vLi + '<span style="color:red" class="small-roboto">Se requiere info. adicional</span>';
                                            } else {
                                                vLi = vLi + '<span style="color:blue" class="small-roboto">SN:' + pSerie + ' IM:' + pSerie2 + '</span>';
                                            }
                                        }


                                        vLi = vLi + '<span id="SKU_LINE_TOTAL_' + pSku + '" class="small-roboto ui-li-count">Q' + format_number(pPrice * pQty, 2) + '</span></a>';

                                        gInvocingTotal = gInvocingTotal + pTotalLine;

                                        $("#pos_skus_page_listview").append(vLi);

                                        $("#lblTotalSKU").text(format_number(gInvocingTotal, 2));
                                        socket.emit("CheckInventory", { 'sku': pSku, 'warehouse': gPreSaleWhs, 'dbuser': gdbuser, 'dbuserpass': gdbuserpass });
                                    }

                                } catch (e) {
                                    my_dialog("", "", "close");
                                    console.log("ERROR, " + e.message);
                                }
                            }
                            $("#lblSaldoTotal").text(format_number(ToDecimal(ToDecimal(gInvocingTotal) + ToDecimal(gSaldoTotal)), 2));
                        }
                        $("#pos_skus_page_listview").listview('refresh');
                        my_dialog("", "", "close");
                        //return 1;
                    },
                    function (tx, err) {
                        my_dialog("", "", "close");
                        if (err.code !== 0) {
                            alert("10.20.50.90, Error processing SQL: " + err.message);
                        }
                    }
                );

                my_dialog("", "", "close");
            },
            function (err) {
                console.log("aqui el error: " + err.message);

                my_dialog("", "", "close");
                if (err.code !== 0) {
                    alert("Error processing SQL: " + err);
                }
            }
        );
        my_dialog("", "", "close");
    } catch (e) {
        my_dialog("", "", "close");
        notify("PopulateSalesSKUsList: " + e.message);
        console.log(e.message);
    }
    my_dialog("", "", "close");
}

function PopulateSKUGrid(tareaTipo) {
    //var priceListId = null;
    var tipoFamiliaSku = null;
    var skulist = $("#skus_listview_panel");
        
        if (localStorage.getItem('LISTA_TIPO_FAMILIA_SKU') === null) {
            localStorage.setItem('LISTA_TIPO_FAMILIA_SKU', "ALL");
        }

        tipoFamiliaSku = localStorage.getItem('LISTA_TIPO_FAMILIA_SKU');
        skulist.children().remove("li");

        ObtenerListaDePreciosDeCliente(gClientID, function(priceList) {
            ObtenerSkusPorListaDePrecios(priceList, tareaTipo, tipoFamiliaSku, function (productos, tareaTipo) {
                for (var i = 0; i < productos.length; i++) {
                    var vLi = null;
                    try {
                        var uClick = null;
                        
                        if (tareaTipo === TareaTipo.Venta) {
                            
                            uClick = "UsuarioDeseaAgregarSkuYCantidad('" + productos[i].SKU + "','" + productos[i].SKU_NAME.replace(/"|'/g, "") + "', '" + productos[i].SKU + "'," + productos[i].COST + ", '" + tareaTipo + "',1, '" + productos[i].LAST_QTY_SOLD + "')";

                            vLi = '<li data-icon="false" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check" ';
                            vLi += 'id="' + productos[i].SKU.replace(" ", "_") + '">';
                            vLi += '<a href="#" onclick="' + uClick + '">';

                            vLi += '<p>';
                            vLi += '<span style="background-color: #005599; border-radius: 4px; color: #ffffff; padding: 3px; ';
                            vLi += ' box-shadow: 1px 10px 10px 1px silver; text-shadow: none">' + productos[i].ON_HAND + '</span>&nbsp';
                            vLi += '<span class="small-roboto">' + productos[i].SKU + ' ' + productos[i].SKU_NAME + '</span>';
                            vLi += '</p>';
                            vLi += "<p>";
                            vLi += '<span class="ui-li-count"> Q' + format_number(productos[i].COST, 2) + '</span>';

                            if (productos[i].CODE_FAMILY_SKU !== null && productos[i].CODE_FAMILY_SKU !== "") {
                                vLi += '<span class="small-roboto">Cod. Fam. SKU: ' + productos[i].CODE_FAMILY_SKU + '</span>';
                            }
                            if (productos[i].LAST_QTY_SOLD > 0) {
                                vLi += '<span class="small-roboto"> Ult. Pedido: ' + productos[i].LAST_QTY_SOLD + '</span>';
                            }
                            vLi += "</p>";
                            vLi += '</a>';
                            vLi += '</li>';

                            skulist.append(vLi);
                            skulist.listview('refresh');

                        } else if (tareaTipo === TareaTipo.Preventa) {
                            uClick = "UsuarioDeseaAgregarSkuYCantidad('" + productos[i].SKU + "','" + productos[i].SKU_NAME.replace(/"|'/g, "") + "', '" + productos[i].SKU + "'," + productos[i].COST + ", '" + tareaTipo + "',1, '" + productos[i].LAST_QTY_SOLD + "')";

                            vLi = '<li data-icon="false" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check" ';
                            vLi += 'id="' + productos[i].SKU.replace(" ", "_") + '">';
                            vLi += '<a href="#" onclick="' + uClick + '">';

                            vLi += '<p>';
                            vLi += '<span style="background-color: #005599; border-radius: 4px; color: #ffffff; padding: 3px; ';
                            vLi += 'box-shadow: 1px 10px 10px 1px silver; text-shadow: none">' + productos[i].ON_HAND + '</span>&nbsp';
                            vLi += '<span class="small-roboto">' + productos[i].SKU + ' ' + productos[i].SKU_NAME + '</span>';
                            vLi += "<p>";
                            vLi += '<span class="ui-li-count"> Q' + format_number(productos[i].COST, 2);
                            vLi += '</span>';

                            if (productos[i].CODE_FAMILY_SKU !== null && productos[i].CODE_FAMILY_SKU !== "") {
                                vLi += '<span class="small-roboto">Cod. Fam. SKU: ' + productos[i].CODE_FAMILY_SKU + '</span>';
                            }

                            vLi += "</p>";
                            vLi += '<p>';
                            vLi += '<span class="small-roboto"> Reservados:' + productos[i].IS_COMITED + '</span>';
                            vLi += '<span class="small-roboto"> Diferencia: ' + productos[i].DIFFERENCE + '</span>';
                            if (productos[i].LAST_QTY_SOLD > 0) {
                                vLi += '<span class="small-roboto"> Ult. Pedido: ' + productos[i].LAST_QTY_SOLD + '</span>';
                            }
                            vLi += '</p>';

                            vLi += '</a>';
                            vLi += '</li>';
                            skulist.append(vLi);
                            skulist.listview('refresh');

                        }
                        
                    } catch (e1) {
                        notify(e1.message);
                        skulist = null;
                    }
                }
                skulist = null;
            }, function(err) {
                //No se encontraron SKUs para la lista de precios
                notify(err.message);
            });
        }, function (err) {
            //No se pudo obtener la lista de precios del cliente
            notify(err.message);
        });
}

function UsuarioDeseaFinalizarDocumento() {
    if (gInvocingTotal <= 0) {
        notify('ERROR, Total no puede ser cero.');
    } else {
        var porcentajeDeDescuento = $("#UiPorcentajeDeDescuento");
        var descuento = ToDecimal(porcentajeDeDescuento.val() === "" ? 0 : porcentajeDeDescuento.val());

        CalcularDescuento(gInvocingTotal, descuento, function (totalDescuento) {
            ValidarSaldoCliente(gClientID, gInvocingTotal, '', 0, OpcionValidarSaldoCliente.FinalizarDocumento, window.gSalesOrderType, function(sku, cantidad) {
                if (gIsOnline === 0) {
                    var porcentajeDescuento = $("#UiPorcentajeDeDescuento");
                    if (gTaskType === TareaTipo.Venta) {
                        _salesControllerCustomer.AppliedDiscount = ToDecimal(porcentajeDescuento.val());
                        UserWantsSaveInvoice();
                    } else {
                        if ($("#FechaEntrega").val() === "" || !ValidarFechaDeEntrega(ObtenerFecha(), $("#FechaEntrega").val())) {
                            notify('ERROR, Tiene que indicar una fecha correcta.');
                        } else {
                            _preSalesControllerCustomer.AppliedDiscount = ToDecimal(porcentajeDescuento.val());
                            UserWantsSavePreSale();
                        }
                    }
                }
            }, function(err) {
                notify("Error al validar saldo del cliente: " + err.message);
            });
        }, function(err) {
          notify(err.message);
        });
        porcentajeDeDescuento = null;
    }
}

function UsuarioDeseaAgregarSku(cantidad) {
    try {
        if (cantidad <= 0) {
            notify("Ingrese una Cantidad Mayor a Cero.");
            $("#qtySku").focus();
        } else {

            ventanaPopUP.popup("close");
            
            ventanaPopUP = null;

            var granTotal = gInvocingTotal + datosSku.precio;
            ValidarSaldoCliente(gClientID, granTotal, datosSku.pSku, cantidad, OpcionValidarSaldoCliente.AgregarSku,window.gSalesOrderType, function(sku, cantidad) {
                if (gIsOnline === 0) {
                    AddSKU(sku, datosSku.pSkuName, datosSku.pSkuParent, datosSku.tareaTipo, cantidad);
                }
            }, function(err) {
                notify("Error al validar saldo del cliente: " + err.message);
            });
        }
        
        //cantidad = null;
    } catch (e) {
        notify(e.message);
    }
}

function MostarPopupDeSkuYCantidad() {
    
    ventanaPopUP = null;
    ventanaPopUP = $("#VentanaAgregarCantidadSku");
    ventanaPopUP.popup("open", { transition: "pop" });

    //ventana.focus();
    //ventana = null;
    //qtySku = null;
} 

function UsuarioDeseaAgregarSkuYCantidad(pSku, pSkuName, pSkuParent, precio, tareaTipo, pQty,pUltimaCantidadVendida) {
    
        datosSku = {
            "pSku": pSku,
            "pSkuName": pSkuName,
            "pSkuParent": pSkuParent,
            "precio": precio,
            "tareaTipo": tareaTipo,
            "pQty": pQty
            ,"pLastQtySold": pUltimaCantidadVendida
        };
    

    //$("#qtySku").val("");
    //$("#skuToDispatch").text(datosSku.pSku);
    //$("#descriptionSkuDispatch").text(datosSku.pSkuName);

    //MostarPopupDeSkuYCantidad();
    SetSKUCant(datosSku.pSku
        , datosSku.pSkuName
        , datosSku.pSkuParent
        , datosSku.pQty
        , datosSku.precio
        , datosSku.tareaTipo
        ,datosSku
        );
}

function UsuarioDeseaCambiarDescuento() {
    var porcentajeDeDescuento = $("#UiPorcentajeDeDescuento");
    var descuento = ToDecimal(porcentajeDeDescuento.val() === "" ? 0 : porcentajeDeDescuento.val());
    CalcularDescuento(gInvocingTotal, descuento, function (totalDescuento) {
        var totalCd = $("#lblTotalDescuento");
        totalCd.text(format_number(ToDecimal(totalDescuento), 2));
        totalCd = null;
    }, function(err) {
        notify(err.message);
    });
    
    porcentajeDeDescuento = null;
}

function CalcularDescuento(total, porcentajeDescuento, callback, errCallback) {
    if (porcentajeDescuento >= 0) {
        if (porcentajeDescuento <= ToDecimal(gDescuento)) {
            porcentajeDescuento = format_number(ToDecimal(gInvocingTotal - ((porcentajeDescuento * gInvocingTotal) / 100)), 2);
            callback(porcentajeDescuento);
        } else {
            errCallback({ code: -1 ,message: "El descuento no puede ser mayor a " + ToDecimal(gDescuento) + "%" });
        }
    } else {
        errCallback({ code: -1, message: "El descuento no puede ser menor a cero" });
    }
}