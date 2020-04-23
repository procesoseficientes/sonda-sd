var _paymentServiceCallBack;
var _paymentServiceCustomer;
/*function ShowPaymentPage(callback, customer) {
    _paymentServiceCallBack = callback;
    customer.Balance = gInvocingTotal;
    _paymentServiceCustomer = customer;

    AddPayment(function () {
        $.mobile.changePage("#ui_payment_page", { transition: "flow", reverse: true, changeHash: true, showLoadMsg: false });
        UserWantsChangePaymentType("PMCASH");
        PopulateGeneralInfoTab();
        PopulatePaymentTab();
        PopulateDetailTab();
        PopulateTotalTab();
    }, function (err) {
        notify(err.message);
    });
}*/

function DelegatePaymentController() {
    $("#uiPaymentTxtCash").bind("keyup", function (event) {
        if (event.keyCode === 13) {
            UserWantsAddPayment();
        }
    });
    $("#uiPaymentTabConsignment").bind("touchstart", function () { PopulateInvoiceHeaderForConsignment(); });
    $("#cmbInvoicesForConsignment").change(function () {
        PopulateInvoiceSKUForConsignment(this.value);
    });
    $("#uiFirmaYFoto").bind("touchstart", function () {
        UsuarioDeseaFirmarYTomarFotografia();
    });
    $("#uiPaymentBtnAddConsignment").bind("touchstart", function () { AgregarConsignacion(); });
    $("#ui_payment_page").on("swipeleft", "#uiPaymentLstInvoiceTotal li", PaymentControllerSwipeHandler);
    $("#ui_payment_page").on("pageinit", VistaPagosTerminoDeCarga);

    $(document).on("pageshow", "#ui_payment_page", function () {
        $("#uiPaymenttabGenerales").addClass("ui-btn-active");
    });
};

function VistaPagosTerminoDeCarga() {
    $("#ui_payment_page").remove("li");
}
function MostrarNuevoBalance() {
    PopulateTotalTab();
    PopulatePaymentTab();
}

function PaymentControllerSwipeHandler(event) {
    try {
        if(event!=undefined)
        if (event.type === "swipeleft") {
            event.preventDefault();
            var id = $(this).attr('id');
            var paymentId = (new Number(id.substring(9, id.length)) * -1);
            try {
                ObtenerTipoYCantidadDelPago(paymentId, _paymentServiceCustomer, function (data) {
                    var mesage = "Confirma remover ";
                    switch (data.PaymentType) {
                        case "PMCASH":
                            mesage += "el pago al contado por ";
                            break;
                        case "CONSIGNMENT":
                            mesage += "la consignacion por ";
                            break;
                        default:
                            mesage += "de la lista el pago por ";
                    }
                    mesage += data.AmountPaid + "?";

                    navigator.notification.confirm(
                    mesage,//"Confirma remover de la lista el pago " + paymentId + "?", // message
                    function (buttonIndex) {
                        if (buttonIndex === 2) {
                            EliminarPagoDelBalanceDelCliente(paymentId, _paymentServiceCustomer, function () {
                                $("#" + id).remove();
                                MostrarNuevoBalance();
                            }, function (err) {
                                notify(err.message);
                            });

                        }
                    }, // callback to invoke with index of button pressed
                    'Sonda® ' + SondaVersion, // title
                    'No,Si' // buttonLabels
                );

                }, function (err) {
                    notify(err.message);
                });
            } catch (e) {
                notify(e.message);
            }

        }
    } catch (e) {
        notify(e.message);
    }

}

PaymentControllerSwipeHandler();



function UsuarioDeseaFirmarYTomarFotografia() {
    if (_paymentServiceCustomer.Balance > 0) {
        notify("Es necesario cancelar el total de la factura");
    } else {
        navigator.notification.confirm("Desea dar por finalizado el cobro?", function (buttonIndex) {
            if (buttonIndex === 2) {
                MostrarCapturaDeFirmaYFoto(OpcionFirmaYFotoTipo.Firma, function (firma, foto) {
                    SavePayments(_paymentServiceCustomer, function (customer) {
                        window.history.back();
                        _paymentServiceCallBack(customer, firma, foto);
                    }, function (err) {
                        notify(err.message);
                    });

                });
            }
        }, "Sonda® " + SondaVersion, "No,Si");

    }
}

function UserWantsChangePaymentType(values) {
    $("#uiPaymentDocumentWrapper").css('display', '');
    $("#uiPyamentBankWrapper").css('display', '');
    $("#uiPaymnetCashWrapper").css('display', '');
    $("#uiPaymentLiCash").css('display', '');
    $("#uiPaymentLiInvoiceBank").css('display', '');
    $("#uiPaymentRowBankAccount").css('display', '');
    $("#liInvoiceChange").css('display', '');

    switch (values) {
        case "PMCASH":
            $("#uiPaymentDocumentWrapper").css('display', 'none');
            $("#uiPyamentBankWrapper").css('display', 'none');
            break;
        case "PMCREDIT":
            $("#uiPaymentDocumentWrapper").css('display', 'none');
            $("#uiPyamentBankWrapper").css('display', 'none');
            $("#liInvoiceChange").css('display', 'none');
            break;
        case "PMCHEQUE":
            $("#uiPaymentRowBankAccount").css('display', 'none');
            $("#liInvoiceChange").css('display', 'none');
            break;
        case "PMDEPOSIT":
            $("#liInvoiceChange").css('display', 'none');
            break;
    }
}

function ShowPaymentPage(callback, customer) {
    _paymentServiceCallBack = callback;
    customer.Balance = gInvocingTotal;
    _paymentServiceCustomer = customer;

    //$(document).on('keyup', '#uiPaymentTxtCash', function (event) {
    //    if (event.keyCode === 13) {
    //        UserWantsAddPayment();
    //    }
    //});

    AddPayment(function () {
        AddConsignment(function () {
            $.mobile.changePage("#ui_payment_page", { transition: "flow", reverse: true, changeHash: true, showLoadMsg: false });
            UserWantsChangePaymentType("PMCASH");
            PopulateGeneralInfoTab();
            PopulatePaymentTab();
            PopulateDetailTab();
            PopulateTotalTab();
        }, function (err) {
            notify(err.message);
        });

    }, function (err) {
        notify(err.message);
    });
}

function ClearControlsPaymentTab() {
    $("#uiPaymentDatePaymentTerm").val("");
    $("#uiPyamentTxtDocNumber").val("");
    $("#uiPaymentTxtAccountNumber").val("");
    $("#uiPaymentTxtCash").val("");
    //$("#lblInvoiceChange").val("0");
}


function AddPayment(callback, errCallBack) {

    GetNexSequence("Payment", function (sequence) {
        var payment = {
            PaymentNum: sequence,
            ClientId: _paymentServiceCustomer.CustomerId,
            ClientName: _paymentServiceCustomer.CustomerName,
            TotalAmount: parseFloat(0.00).toFixed(2),
            PostedDatetime: getDateTime(),
            PosTerminal: gCurrentRoute,
            Gps: gCurrentGPS,
            DocDate: getDateTime(),
            DepositToDate: null,
            IsPosted: 0,
            Status: "OPEN",
            PaymentRows: Array()
        }
        _paymentServiceCustomer.Payments.push(payment);
        callback();
    }, function (err) {
        errCallBack(err);
    });
}

function AddConsignment(callback, errCallBack) {
    GetNexSequence("CONSIGNMENT", function (sequence) {
        var xdate = getDateTime();
        var consignment = {
            CONSIGNMENT_ID: sequence,
            CUSTOMER_ID: _paymentServiceCustomer.CustomerId,
            DATE_CREATE: xdate,
            DATE_UPDATE: xdate,
            STATUS: 'OPEN',
            POSTED_BY: gLoggedUser,
            IS_POSTED: 0,
            POS_TERMINAL: gCurrentRoute,
            GPS_URL: gCurrentGPS,
            DOC_DATE: xdate,
            CLOSED_ROUTE_DATETIME: null,
            IS_ACTIVE_ROUTE: 1,
            //FECHA DE EXPIRACION, SE DEBE CAMBIAR PARA FECHA ACTUAL, MAS NUMERO DE DIAS MAXIMOS EN CONSIGNACION
            DUE_DATE: null,
            CONSIGNMENT_DETAILS: Array()
        }
        _paymentServiceCustomer.Consignments.push(consignment);
        callback();
    }, function (err) {
        errCallBack(err);
    });
}

function addCashPaymentDetail(callback, errCallBack) {
    GetNexSequence("Payment", function (sequence) {
        var amount = parseInt($('#uiPaymentTxtCash').val());
        var payment = {
            PaymentNum: _paymentServiceCustomer.Payments[0].PaymentNum,
            Line_num: (_paymentServiceCustomer.Payments.length + 1),
            Invoice_num: _paymentServiceCustomer.Invoices[0].InvoiceNumin,
            Invoice_serie: _paymentServiceCustomer.Invoices[0].SatSerie,
            Amount_paid: amount
        }
        _paymentServiceCustomer.Payments.push(payment);
        callback();
    }, function (err) {
        errCallBack(err);
    });
}

function UserWantsAddPayment() {
    try {
        if ($('#uiPaymentTxtCash').val() === "") {
            return;
        }

        var balance = _paymentServiceCustomer.Balance;

        var qty = parseFloat($('#uiPaymentTxtCash').val());
        var vLi;
        var payment = {
            PaymentNum: _paymentServiceCustomer.Payments[_paymentServiceCustomer.Payments.length - 1].PaymentNum,
            PaymentType: $('#uiPaymentCboPaymentTerm').val(),
            TotalAmount: qty,
            DocDate: null,
            DocNum: null,
            Image: null,
            BankId: null,
            AccountNum: null,
            PostedDatetime: getDateTime(),
            PaymentId: 0
        };
        var previousBalance = 0;
        if ($('#uiPaymentCboPaymentTerm').val() === "PMCASH") {
            if (balance <= qty && qty !== 0 && balance !== 0) {
                payment.TotalAmount = balance;
                previousBalance = balance;
                var vuelto = 0;
                vuelto = qty - balance;

                AddPaymentToCustomerBalance(payment, _paymentServiceCustomer, function (paymentCb, customer) {
                    $("#uiPaymentLblInfInvoiceTotal_Vuelto").text("Q " + format_number(parseFloat(vuelto), 2));
                    $("#uiPaymentLblInfInvoiceTotal_Pendiente").text("Q " + format_number(parseFloat(customer.Balance), 2));

                    vLi = "";
                    vLi = '<li id="uiPayment' + ((paymentCb.PaymentId) * -1) + '" data-icon="false" class="ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
                    vLi = vLi + '<p>';
                    vLi = vLi + '<h2>' + "Contado" + '</h2>';
                    vLi = vLi + '</p>';
                    vLi = vLi + '<p>';
                    vLi = vLi + '<b>Saldo anterior: </b><span>' + "Q " + format_number(parseFloat(previousBalance), 2) + '</span>';
                    vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:30%; color:#FF0004"> ' + "-Q " + format_number(parseFloat(payment.TotalAmount), 2) + '</span>';
                    vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:70%"> ' + "Q " + format_number(parseFloat("0"), 2) + '</span>';
                    vLi = vLi + '</p>';
                    vLi = vLi + '</li>';
                    $("#uiPaymentLstInvoiceTotal").append(vLi);
                    $("#uiPaymentLstInvoiceTotal").listview('refresh');
                    ClearControlsPaymentTab();
                    $("#uiPaymentBalance").text(format_number(_paymentServiceCustomer.Balance, 2));
                    $("#lblConsignmentBalanceTotal").text(format_number(_paymentServiceCustomer.Balance, 2));

                }, function (err) { notify(err.message) });


                return;
            } else {
                if (balance <= 0) {
                    notify("No hay saldo pendiente");
                    return;
                }
            }
        } else {
            if ($('#uiPaymentCboPaymentTerm').val() !== "PMCREDIT") {
                payment.DocNum = $("#uiPyamentTxtDocNumber").val();
                payment.BankId = $("#uiPaymentLiInvoiceBank").val();
                if ($('#uiPaymentCboPaymentTerm').val() === "PMDEPOSIT") {
                    payment.AccountNum = $("#uiPaymentRowBankAccount").val();
                }
            }
        }
        if (balance >= qty && qty !== 0) {
            previousBalance = balance;


            AddPaymentToCustomerBalance(payment, _paymentServiceCustomer, function (paymentCb, customer) {
                var tipoCobro = "";
                switch (payment.PaymentType) {
                    case "PMCASH":
                        tipoCobro = "Contado";
                        break;
                    case "PMCREDIT":
                        tipoCobro = "Credito";
                        break;
                    case "PMCHEQUE":
                        tipoCobro = "Cheque";
                        break;
                    case "PMDEPOSIT":
                        tipoCobro = "Deposito";
                        break;
                }
                $("#uiPaymentLblInfInvoiceTotal_Pendiente").text("Q " + format_number(parseFloat(customer.Balance), 2));
                vLi = "";
                vLi = '<li id="uiPayment' + ((payment.PaymentId) * -1) + '" data-icon="false" class="ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
                vLi = vLi + '<p>';
                vLi = vLi + '<h2>' + tipoCobro + '</h2>';
                vLi = vLi + '</p>';
                vLi = vLi + '<p>';
                vLi = vLi + '<b>Saldo anterior: </b><span>' + "Q " + format_number(parseFloat(previousBalance), 2) + '</span>';
                vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:30%; color:#FF0004"> ' + "-Q " + format_number(parseFloat(payment.TotalAmount), 2) + '</span>';
                vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:70%"> ' + "Q " + format_number(parseFloat(customer.Balance), 2) + '</span>';
                vLi = vLi + '</p>';
                vLi = vLi + '</li>';
                $("#uiPaymentLstInvoiceTotal").append(vLi);
                $("#uiPaymentLstInvoiceTotal").listview('refresh');
                $("#uiPaymentBalance").text(format_number(_paymentServiceCustomer.Balance, 2));
                ClearControlsPaymentTab();
                $("#lblConsignmentBalanceTotal").text(format_number(_paymentServiceCustomer.Balance, 2));
            }, function (err) { notify(err.message) });

        } else {
            if (balance <= 0) {
                notify("No hay saldo pendiente");
            } else {
                notify("La cantidad es mayor al saldo");
            }

        }

    } catch (e) {
        notify("Error: " + e.message);
    }
}

function PopulatePaymentTab() {
    $("#lblConsignmentBalanceTotal").text(format_number(_paymentServiceCustomer.Balance, 2));
    $("#uiPaymentBalance").text(format_number(_paymentServiceCustomer.Balance, 2));
}

function PopulateTotalTab() {
    $("#uiPaymentLblInfInvoiceTotal_ClientName").text(_paymentServiceCustomer.CustomerName);
    $("#uiPaymentLblInfInvoiceTotal_Saldo").text("Q " + format_number(parseFloat(_paymentServiceCustomer.Balance), 2));
    $("#uiPaymentLblInfInvoiceTotal_Pendiente").text("Q " + format_number(parseFloat(_paymentServiceCustomer.Balance), 2));
    $("#uiPaymentLblInfInvoiceTotal_Vuelto").text("" + format_number(parseFloat("0"), 2));
}

function PopulateDetailTab() {
    if (_paymentServiceCustomer.Invoices.length > 0) {
        var lastInvoice = _paymentServiceCustomer.Invoices[_paymentServiceCustomer.Invoices.length - 1];
        $("#uiPaymentLblInfInvoice_NunDoc").text(lastInvoice.InvoiceNum);
        $("#uiPaymentLblInfInvoice_TotalDoc").text("Q " + format_number(parseFloat(lastInvoice.TotalAmount), 2));
        for (var i = 0; i < lastInvoice.InvoiceRows.length; i++) {
            var invoiceRow = lastInvoice.InvoiceRows[i];
            var vLi = '';
            vLi = '<li data-icon="false" class="ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
            vLi = vLi + '<p>'; vLi = vLi + '<span class="medium" style="background-color: #333333; border-radius: 4px; color: #ffffff; padding: 3px; box-shadow: 1px 10px 10px 1px silver; text-shadow: none">' + invoiceRow.SKU + '</span>&nbsp<span class="small-roboto">' + invoiceRow.SKU_NAME + '</span>';
            vLi = vLi + '</p>';
            vLi = vLi + '<p>';
            vLi = vLi + '<span>Cantidad: ' + invoiceRow.QTY + '</span>&nbsp';
            vLi = vLi + '<span>Unitario: ' + "Q " + format_number(parseFloat(invoiceRow.PRICE), 2) + '</span>';
            vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:70%">' + "Q " + format_number(parseFloat(invoiceRow.TOTAL_LINE), 2) + '</span>';
            vLi = vLi + '</p>';
            vLi = vLi + '</li>';

            $("#uiPaymentLstInfInvoice_Det").append(vLi);
        }
        $("#uiPaymentLstInfInvoice_Det").listview('refresh');
    }
}

function PopulateGeneralInfoTab() {
    $("#lblConsignmentBalanceTotal").text(format_number(_paymentServiceCustomer.Balance, 2));
    $("#uiPaymentLblInvoiceCustomer").text(_paymentServiceCustomer.CustomerId);
    $("#uiPaymentLblInvoice_Address").text(_paymentServiceCustomer.Address);
    $("#uiPaymentLblInvoiceTotalCostumer").text("Q " + format_number(parseFloat(_paymentServiceCustomer.Balance), 2));
}

function SavePayment() {
    if (_paymentServiceCustomer.Balance > 0) {
        notify("Debe Saldar el total de la deuda");
    } else {
        SavePayments(_paymentServiceCustomer, function (customer) {
            _paymentServiceCallBack(customer);
        }, function (err) {
            notify(err.message);
        });
    }
}

/*CONSIGNACION*/
function PopulateInvoiceHeaderForConsignment() {
    var comboInvoiceHeader = document.getElementById("cmbInvoicesForConsignment");
    $("#cmbInvoicesForConsignment").find('option').remove().end().append('<option value="" disabled selected>Seleccione una factura</option>').val('');
    //for (var i = 0; i < _paymentServiceCustomer.Invoices.length; i++) {
    var lastInvoice = _paymentServiceCustomer.Invoices.length - 1;
    var option = document.createElement("option");
    option.text = "No. " + _paymentServiceCustomer.Invoices[lastInvoice].SatSerie + "-" + _paymentServiceCustomer.Invoices[lastInvoice].InvoiceNum;
    option.value = _paymentServiceCustomer.Invoices[lastInvoice].InvoiceNum;
    comboInvoiceHeader.add(option);
    //}
};

function PopulateInvoiceSKUForConsignment(option) {
    if (_paymentServiceCustomer.Consignments[0].CONSIGNMENT_DETAILS.length !== 0) {
        if (_paymentServiceCustomer.Consignments[0].CONSIGNMENT_DETAILS[0].PAYMEN_ID !== 0) {
            return;
        }
    }
    var invoiceNum = option;
    var invoice = $.grep(_paymentServiceCustomer.Invoices, function (e) {
        return e.InvoiceNum == invoiceNum;
    });
    var totalInvoice = _paymentServiceCustomer.Balance;// invoice[0].TotalAmount - invoice[0].PaidToDate;


    $("#lblConsignmentBalanceTotal").text(format_number(totalInvoice, 2));


    $('#ulPaymentConsignment').children().remove('li');
    $("#ulPaymentConsignment").listview('refresh');
    for (var i = 0; i < invoice[0].InvoiceRows.length ; i++) {
        try {
            var invoiceRow = invoice[0].InvoiceRows[i];
            var pSku = invoiceRow.SKU;
            var pPrice = invoiceRow.PRICE;
            var pSkuName = invoiceRow.SKU_NAME;
            var pQty = invoiceRow.QTY;
            var pTotalLine = (pQty * pPrice);
            var pRequeriesSerie = invoiceRow.REQUERIES_SERIE;
            var pSerie = invoiceRow.SERIE;
            var pSerie2 = invoiceRow.SERIE_2;
            var pLineSeq = invoiceRow.LINE_SEQ;
            var pDiscount = invoiceRow.DISCOUNT;
            var vLi;
            vLi = '<li LineSeq="' + pLineSeq + '" SkuSerie="' + pSerie + '" id="SKU_LI' + pSku + '" data-filtertext="' + pSku + ' ' + pSkuName.replace(/"|'/g, "") + '">';
            var onSkuClick = "";

            onSkuClick = "RemoverUnSkuMasConsignacion(" + "'" + pSku + "', " + pPrice + " , " + validateQty(pSku) + " , " + pDiscount + " , " + option + ");";
            vLi = vLi + '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' + onSkuClick + '">';

            vLi = vLi + '<span class="small-roboto">' + pSkuName + '</span>';
            vLi = vLi + '<p><span id="SKU_CONS_' + pSku + '" class="small-roboto">Precio: Q' + format_number(pPrice, 2) + '</span></p>';
            //vLI = vLI + '<p><span class="small-roboto">Total: Q' + format_number(pTOTAL_LINE, 2) + '</span></p>'

            vLi = vLi + '<span class="small-roboto ui-li-count">Cantidad ' + validateQty(pSku) + '</span></a>';


            var xonclick2 = "AgregarUnSkuMasConsignacion(" + "'" + pSku + "', " + pPrice + " , " + validateQty(pSku) + " , " + pDiscount + " , " + option + ");";
            console.log(xonclick2);

            vLi = vLi + '<a href="#" onclick="' + xonclick2 + '" class="ui-nodisc-icon ui-alt-icon ui-icon-plus" data-theme="plus"></a></li>';

            $("#ulPaymentConsignment").append(vLi);


        } catch (e) { notify("ERROR, " + e.message); }
    }
    $("#ulPaymentConsignment").listview('refresh');
}

function validateQty(pSku) {
    var lastIndex = _paymentServiceCustomer.Consignments.length - 1;
    var consignmentDetails = _paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS;

    var consignment = $.grep(consignmentDetails, function (e) {
        console.log(e);
        return e.SKU == pSku;
    });

    if (consignment.length > 0) {
        return consignment[0].QTY;
    } else {
        return 0;
    }
}

function AgregarUnSkuMasConsignacion(pSku, pPrice, pQty, pDiscount, pInvoiceNum) {
    try {
        var lastIndex = _paymentServiceCustomer.Consignments.length - 1;
        //var lastInvoice = _paymentServiceCustomer.Invoices.length - 1;
        pQty = pQty + 1;
        var xdate = getDateTime();
        var invoice = $.grep(_paymentServiceCustomer.Invoices, function (e) {
            return e.InvoiceNum == pInvoiceNum;
        });
        var totalConsignment = 0;

        var flagCantidad = false;
        for (var i = 0; i < _paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS.length; i++) {
            var consignmentDet = _paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS[i];
            totalConsignment += (consignmentDet.QTY * consignmentDet.PRICE);
        }
        for (var j = 0; j < invoice[0].InvoiceRows.length; j++) {
            var invoiceDet = invoice[0].InvoiceRows[j];
            if (pSku == invoiceDet.SKU) {
                if (pQty > invoiceDet.QTY) {
                    flagCantidad = true;
                }
            }
        }

        if ((totalConsignment + pPrice) <= _paymentServiceCustomer.Balance) {
            if (!flagCantidad) {
                var totalInvoice = _paymentServiceCustomer.Balance + totalConsignment;
                totalConsignment += pPrice;
                if (totalInvoice >= totalConsignment) {

                    $("#lblConsignmentTotal").text(format_number(totalConsignment, 2));
                    $("#lblConsignmentTotal").val(format_number(totalConsignment, 2));
                    $("#ulPaymentConsignment").listview('refresh');
                    var consignment = $.grep(_paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS, function (e) {
                        return e.SKU == pSku;
                    });

                    if (consignment.length == 0) {
                        var consignmentDetail = {
                            CONSIGNMENT_ID: _paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_ID,
                            SKU: pSku,
                            LINE_NUM: 0,
                            QTY: pQty,
                            PRICE: pPrice,
                            DISCOUNT: pDiscount,
                            TOTAL_LINE: totalConsignment,
                            POSTED_DATETIME: xdate
                            , PAYMEN_ID: 0
                        };
                        _paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS.push(consignmentDetail);
                    } else {
                        consignment[0].QTY = pQty;
                        consignment[0].TOTAL_LINE = totalConsignment;
                    }
                } else {
                    notify("Cantidad " + pQty + " excede el monto de la factura");
                }
            } else {
                notify("Cantidad " + pQty + " excede el maximo de productos");
            }

        } else {
            notify("Se sobrepasa del del saldo");
        }

        PopulateInvoiceSKUForConsignment(pInvoiceNum);
    } catch (e) { notify("AgregarUnSkuMasConsignacion: " + e.message); console.log("catch: " + e.message); }
}

function RemoverUnSkuMasConsignacion(pSku, pPrice, pQty, pDiscount, pInvoiceNum) {
    try {
        if (pQty > 0) {
            var lastIndex = _paymentServiceCustomer.Consignments.length - 1;
            //var lastInvoice = _paymentServiceCustomer.Invoices.length - 1;
            pQty = pQty - 1;
            var xdate = getDateTime();
            var invoice = $.grep(_paymentServiceCustomer.Invoices, function (e) {
                return e.InvoiceNum == pInvoiceNum;
            });
            var totalConsignment = 0;


            for (var i = 0; i < _paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS.length; i++) {
                var consignmentDet = _paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS[i];
                totalConsignment += (consignmentDet.QTY * consignmentDet.PRICE);
            }

            var totalInvoice = _paymentServiceCustomer.Balance - totalConsignment;
            totalConsignment -= pPrice;

            $("#lblConsignmentTotal").text(format_number(totalConsignment, 2));
            $("#lblConsignmentTotal").val(format_number(totalConsignment, 2));
            $("#ulPaymentConsignment").listview('refresh');
            var consignment = $.grep(_paymentServiceCustomer.Consignments[lastIndex].CONSIGNMENT_DETAILS, function (e) {
                return e.SKU == pSku;
            });

            consignment[0].QTY = pQty;
            consignment[0].TOTAL_LINE = totalConsignment;

            PopulateInvoiceSKUForConsignment(pInvoiceNum);
        } else {
            notify("La cantidad no puede ser inferior a 0");
        }
    } catch (e) {
        notify("AgregarUnSkuMasConsignacion: " + e.message);
        console.log("catch: " + e.message);
    }
}

function AgregarConsignacion() {
    try {
        if ($('#lblConsignmentTotal').val() === "") {
            return;
        }

        var balance = _paymentServiceCustomer.Balance;

        var qty = parseFloat($('#lblConsignmentTotal').val());
        var vLi;
        var previousBalance = 0;
        var paymentRow = $.grep(_paymentServiceCustomer.Payments[_paymentServiceCustomer.Payments.length - 1].PaymentRows, function (e) {
            return e.PaymentType == 'CONSIGNMENT';
        });


        //actualizar un payment
        if (paymentRow.length > 0) {
            var invoice = _paymentServiceCustomer.Invoices[_paymentServiceCustomer.Invoices.length - 1];

            _paymentServiceCustomer.Payments[_paymentServiceCustomer.Payments.length - 1].TotalAmount = qty;

            paymentRow[0].AmountPaid = qty;
            invoice.PaidToDate = qty;
            previousBalance = _paymentServiceCustomer.Invoices[_paymentServiceCustomer.Invoices.length - 1].TotalAmount;
            var invoiceBalance = invoice.TotalAmount - invoice.PaidToDate;
            _paymentServiceCustomer.Balance = invoiceBalance;
            var previousLi = "#uiPayment" + (paymentRow[0].PaymentId * -1);
            $(previousLi).remove();

            $("#uiPaymentLblInfInvoiceTotal_Pendiente").text("Q " + format_number(parseFloat(_paymentServiceCustomer.Balance), 2));
            vLi = "";
            vLi = '<li id="uiPayment' + ((paymentRow[0].PaymentId) * -1) + '" data-icon="false" class="ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
            vLi = vLi + '<p>';
            vLi = vLi + '<h2>Consignación</h2>';
            vLi = vLi + '</p>';
            vLi = vLi + '<p>';
            vLi = vLi + '<b>Saldo anterior: </b><span>' + "Q " + format_number(parseFloat(previousBalance), 2) + '</span>';
            vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:30%; color:#FF0004"> ' + "-Q " + format_number(parseFloat(paymentRow[0].AmountPaid), 2) + '</span>';
            vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:70%"> ' + "Q " + format_number(parseFloat(_paymentServiceCustomer.Balance), 2) + '</span>';
            vLi = vLi + '</p>';
            vLi = vLi + '</li>';
            $("#uiPaymentLstInvoiceTotal").append(vLi);
            $("#uiPaymentLstInvoiceTotal").listview('refresh');
            $("#uiPaymentBalance").text(format_number(_paymentServiceCustomer.Balance, 2));


        } else {

            var payment = {
                PaymentNum: _paymentServiceCustomer.Payments[_paymentServiceCustomer.Payments.length - 1].PaymentNum,
                PaymentType: 'CONSIGNMENT',
                TotalAmount: qty,
                DocDate: null,
                DocNum: null,
                Image: null,
                BankId: null,
                AccountNum: null,
                PaymentId: 0
            };


            if (qty <= balance && qty !== 0) {
                previousBalance = balance;

                AddPaymentToCustomerBalanceConsignment(payment, _paymentServiceCustomer, function (paymentCb, customer) {
                    for (var i = 0; i < _paymentServiceCustomer.Consignments[0].CONSIGNMENT_DETAILS.length; i++) {
                        _paymentServiceCustomer.Consignments[0].CONSIGNMENT_DETAILS[i].PAYMEN_ID = ((payment.PaymentId) * -1);
                    }

                    _paymentServiceCustomer.Balance = customer.Balance;
                    $("#uiPaymentLblInfInvoiceTotal_Pendiente").text("Q " + format_number(parseFloat(customer.Balance), 2));
                    vLi = "";
                    vLi = '<li id="uiPayment' + ((payment.PaymentId) * -1) + '" data-icon="false" class="ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
                    vLi = vLi + '<p>';
                    vLi = vLi + '<h2>Consignación</h2>';
                    vLi = vLi + '</p>';
                    vLi = vLi + '<p>';
                    vLi = vLi + '<b>Saldo anterior: </b><span>' + "Q " + format_number(parseFloat(previousBalance), 2) + '</span>';
                    vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:30%; color:#FF0004"> ' + "-Q " + format_number(parseFloat(payment.TotalAmount), 2) + '</span>';
                    vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:70%"> ' + "Q " + format_number(parseFloat(customer.Balance), 2) + '</span>';
                    vLi = vLi + '</p>';
                    vLi = vLi + '</li>';
                    $("#uiPaymentLstInvoiceTotal").append(vLi);
                    $("#uiPaymentBalance").text(format_number(customer.Balance, 2));
                    $("#lblConsignmentBalanceTotal").text(format_number(customer.Balance, 2));
                    $("#uiPaymentLstInvoiceTotal").listview('refresh');
                }, function (err) { notify(err.message) });

            } else {
                if (balance <= 0) {
                    notify("No hay saldo pendiente");
                } else {
                    notify("La cantidad es mayor al saldo");
                }
            }
        }

        $("#lblConsignmentBalanceTotal").text(format_number(_paymentServiceCustomer.Balance, 2));
        $("#ulPaymentConsignment").listview('refresh');
        $("#lblConsignmentTotal").text(format_number(0, 2));

        var comboInvoiceHeader = document.getElementById("cmbInvoicesForConsignment");
        $("#cmbInvoicesForConsignment").find('option').remove().end().append('<option value="" disabled selected>Seleccione una factura</option>').val('');

        $('#ulPaymentConsignment').children().remove('li');
    } catch (e) {
        notify("Error: " + e.message);
    }






}