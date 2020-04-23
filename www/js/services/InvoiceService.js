function UpdateInvoiceCounter(invoiceNum, totalInvoiced, totalInvoicesProc) {
    localStorage.setItem('POS_CURRENT_INVOICE_ID', invoiceNum);
    $("#lblSumm_CurrentDoc").text(invoiceNum);
    localStorage.setItem('POS_TOTAL_INVOICED', totalInvoiced);
    localStorage.setItem('POS_TOTAL_INVOICES_PROC', Number(totalInvoicesProc));
    localStorage.setItem('POS_ITEM_SEQ', Number(0));
}

function PostInvoice(imageUri1, imageUri2, imageUri3) {
    var pTaxId = $("#txtNIT").val();
    var pCustName = $("#txtNombre").val();
    var pChange = $("#txtVuelto_summ").text();



    try {
        var invoiceNum = GetNextInvoiceID();
        // ReSharper disable once CoercedEqualsUsing
        if (invoiceNum != -1) {

            SONDA_DB_Session.transaction(
				function (tx) {
				    var pSql;
				    pSql = "UPDATE SKU_SERIES SET STATUS = 2 WHERE SERIE IN (SELECT SERIE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999)";
				    tx.executeSql(pSql);

				    pSql = "UPDATE INVOICE_DETAIL SET INVOICE_NUM = " + invoiceNum + ", IS_ACTIVE=1 WHERE INVOICE_NUM = -9999";

				    tx.executeSql(pSql);

				},
				function (tx, err) { my_dialog("", "", "close"); notify(err.message); },
				function () {
				    SONDA_DB_Session.transaction(
						function (tx) {
						    var currentSatResolution = localStorage.getItem('POS_SAT_RESOLUTION');
						    var currentSatResSerie = localStorage.getItem('POS_SAT_RES_SERIE');

						    var pSql = "INSERT INTO INVOICE_HEADER(INVOICE_NUM, TERMS, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES, POSTED_DATETIME, PRINT_REQUEST, PRINTED_COUNT, AUTH_ID, SAT_SERIE, CHANGE, IMG1, IMG2, IMG3) ";
						    pSql += " VALUES(" + invoiceNum + ",'CASH','" + pTaxId + "','";
						    pSql += pCustName + "', '" + gCurrentRoute + "','" + gCurrentGPS + "'," + gInvocingTotal + ",'', 0, 1, 0,'','','";
						    pSql += getDateTime() + "',1,0,'" + currentSatResolution + "','" + currentSatResSerie + "'," + pChange + ",'" + imageUri1 + "','" + imageUri2 + "','" + imageUri3 + "') ";

						    //alert(pSQL);
						    console.log(pSql);
						    tx.executeSql(pSql);

						}, function (tx, err) { console.log("err.message: " + err.message); my_dialog("", "", "close"); notify(err); },
						function () {
						    var currentSatResolution = localStorage.getItem('POS_SAT_RESOLUTION');
						    var totalInvoiced = Number(gInvocingTotal);
						    gTotalInvoicesProc++;
						    UpdateInvoiceCounter(invoiceNum, totalInvoiced, gTotalInvoicesProc);
						    //Process_SKUsToInvoice(gInvoiceNUM, pUpdateInventory); where pUpdateInventory is an integer flag that indicate if function have to update inventory (1=yes/0=no)
						    Process_SKUsToInvoice(invoiceNum, 1, currentSatResolution);
						}
					);
				}
			);

        } else {
            notify("ERROR, Resolucion de SAT ha sido agotada, contacte a su administrador.");
        }


    } catch (e) { console.log(e.message); notify("PostInvoice: " + e.message); }
}

function Process_SKUsToInvoice(invoiceId, updateInventory, resolution) {
    var pDetailResults = Array();
    var pHeaderResults = "";
    var pCombo = "";
    var singlesku = "";
    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                var pSql;
                pSql = 'SELECT A.INVOICE_NUM, A.SKU, A.PRICE, A.SKU_NAME, A.QTY, A.TOTAL_LINE, A.COMBO_REFERENCE,';
                pSql += 'A.REQUERIES_SERIE, A.LINE_SEQ, 1 AS IS_KIT, A.SERIE, A.SERIE_2, A.PARENT_SEQ, A.EXPOSURE FROM INVOICE_DETAIL A  ';
                pSql += 'WHERE A.INVOICE_NUM = ' + invoiceId;

                console.log(pSql);
                tx.executeSql(pSql, [],
                        function (tx, results) {
                            // ReSharper disable once AssignedValueIsNeverUsed
                            var invoiceDetail = {};


                            for (var i = 0; i <= (results.rows.length - 1) ; i++) {
                                invoiceDetail =

                                        {
                                            INVOICE_NUM: results.rows.item(i).INVOICE_NUM,
                                            SKU: results.rows.item(i).SKU,
                                            QTY: results.rows.item(i).QTY,
                                            PRICE: results.rows.item(i).PRICE,
                                            TOTAL_LINE: results.rows.item(i).TOTAL_LINE,
                                            SERIE: results.rows.item(i).SERIE,
                                            SERIE_2: results.rows.item(i).SERIE_2,
                                            COMBO_REFERENCE: results.rows.item(i).COMBO_REFERENCE,
                                            PARENT_SEQ: results.rows.item(i).PARENT_SEQ,
                                            EXPOSURE: results.rows.item(i).EXPOSURE,
                                            LINE_SEQ: results.rows.item(i).LINE_SEQ,
                                            INVOICE_RESOLUTION: resolution

                                        };
                                pDetailResults.push(invoiceDetail);
                                pCombo = results.rows.item(i).COMBO_REFERENCE;
                                singlesku = results.rows.item(i).SKU;

                                // ReSharper disable once CoercedEqualsUsing
                                if (updateInventory == 1) {
                                    UpdateInventory(pCombo, singlesku, 1, tx);
                                }

                            }

                            SONDA_DB_Session.transaction(
                                function (tx) {
                                    var pSql = "SELECT * FROM INVOICE_HEADER WHERE  ";
                                    pSql += " INVOICE_NUM = " + invoiceId;
                                    console.log(pSql);

                                    tx.executeSql(pSql, [],
                                                    function (tx, results) {

                                                        var invoiceHeader =
                         {
                             INVOICE_NUM: results.rows.item(0).INVOICE_NUM,
                             POS_TERMINAL: results.rows.item(0).POS_TERMINAL,
                             GPS: results.rows.item(0).GPS,
                             POSTED_DATETIME: results.rows.item(0).POSTED_DATETIME,
                             TOTAL_AMOUNT: results.rows.item(0).TOTAL_AMOUNT,
                             CLIENT_ID: results.rows.item(0).CLIENT_ID,
                             CLIENT_NAME: results.rows.item(0).CLIENT_NAME,
                             AUTH_ID: results.rows.item(0).AUTH_ID,
                             SAT_SERIE: results.rows.item(0).SAT_SERIE
                         }
                                                        pHeaderResults = JSON.stringify(invoiceHeader);

                                                        var xDetailData1 = JSON.stringify(pDetailResults);

                                                        var data = {
                                                            'data_header': pHeaderResults,
                                                            'data_detail': xDetailData1,
                                                            'routeid': gCurrentRoute,
                                                            'batt': gBatteryLevel,
                                                            'dbuser': gdbuser,
                                                            'dbuserpass': gdbuserpass
                                                        }

                                                        //console.log("gIsOnline:"+gIsOnline);



                                                        // ReSharper disable once CoercedEqualsUsing
                                                        if (gIsOnline == 1) {
                                                            if (updateInventory === 1) {

                                                                socket.emit('post_invoice', data);
                                                                ShowInvoiceConfirmation();

                                                            } else {
                                                                console.log("post_invoice_offline");
                                                                console.log(data);
                                                                socket.emit('post_invoice_offline', data);


                                                            }
                                                        } else {
                                                            ShowInvoiceConfirmation();
                                                        }


                                                    },
                                                    function (err) {
                                                        console.log(err.message);

                                                        my_dialog("", "", "close");
                                                        if (err.code !== 0) {
                                                            alert("Error processing SQL: " + err.code);
                                                        }
                                                    }
                                    );
                                    my_dialog("", "", "close");
                                },
                                        function (err) {
                                            my_dialog("", "", "close");
                                            if (err.code !== 0) {
                                                alert("Error processing SQL: " + err.code);
                                            }
                                        }
                            );

                        },
                        function (err) {
                            console.log(err.message);

                            my_dialog("", "", "close");
                            if (err.code !== 0) {
                                alert("Error processing SQL: " + err.code);
                            }
                        }
                );
                my_dialog("", "", "close");
            },
            function (err) {
                my_dialog("", "", "close");
                if (err.code !== 0) {
                    alert("Error processing SQL: " + err.code);
                }
            }
        );



    }
    catch (e) { console.log(e); notify("Process_SKUsToInvoice: " + e.message); }
}

function ConvertirBorradorAFactura(invoice, firma, foto, indice, maximo, callback, errCallback) {
    try {
        invoice.Img1 = foto;
        invoice.Img2 = firma;

        SONDA_DB_Session.transaction(function (tx) {
            var sql = "INSERT INTO INVOICE_HEADER(INVOICE_NUM, TERMS, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT,PAID_TO_DATE, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES, POSTED_DATETIME, PRINT_REQUEST, PRINTED_COUNT, AUTH_ID, SAT_SERIE, CHANGE, IMG1, IMG2, IMG3, GPS_EXPECTED) ";
            sql += " VALUES(" + invoice.InvoiceNum + ",'CASH','" + invoice.ClientId + "','";
            sql += invoice.ClientName + "', '" + gCurrentRoute + "','" + gCurrentGPS + "'," + invoice.TotalAmount + "," + invoice.PaidToDate + ",'', 0, 1, 0,'','','";
            sql += getDateTime() + "',1,0,'" + invoice.AuthId + "','" + invoice.SatSerie + "'," + "0" + ",'" + invoice.Img1 + "','" + invoice.Img2 + "','" + invoice.Img3 + "','" + gCurrentGPS + "') ";
            tx.executeSql(sql);

            sql = "UPDATE SKU_SERIES SET STATUS = 2 WHERE SERIE IN (SELECT SERIE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999)";
            tx.executeSql(sql);
            sql = "UPDATE INVOICE_DETAIL SET INVOICE_NUM = " + invoice.InvoiceNum + ", IS_ACTIVE=1 WHERE INVOICE_NUM = -9999";
            tx.executeSql(sql);

            for (var i = 0; i < invoice.InvoiceRows.length; i++) {
                sql = "UPDATE SKUS SET ON_HAND = (ON_HAND - " + invoice.InvoiceRows[i].QTY + ") WHERE SKU = '" + invoice.InvoiceRows[i].SKU + "'";
                tx.executeSql(sql);
            }

        }, function (err) {
            errCallback(err);
        }, function () {
            if (indice === maximo) {
                callback();
            }
            localStorage.setItem("POS_CURRENT_INVOICE_ID", invoice.InvoiceNum);
        });
    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }

}


function PostearFacturasPagadas(firma, foto, customer, callback, errCallback) {

    var borradores = $.grep(customer.Invoices, function (e) { return e.IsDraf === true });

    for (var i = 0; i < borradores.length; i++) {
        var borrador = borradores[i];
        ConvertirBorradorAFactura(borrador, firma, foto, i, borradores.length - 1, function () {
            callback();
        }, function (err) { errCallback(err) });
    }
}

function ConfirmPostInvoice(imageUri1, imageUri2, imageUri3) {
    try {
        // ReSharper disable once CoercedEqualsUsing


        SONDA_DB_Session.transaction(
            function (tx) {
                tx.executeSql('SELECT * FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND REQUERIES_SERIE = 1 AND (SERIE = 0 OR SERIE_2 = 0)', [],
                    function (tx, results) {
                        //console.log("algun registro sin serie: " + results.rows.length);
                        my_dialog("", "", "close");
                        if (results.rows.length === 0) {

                            if (imageUri1.length > 0) {
                                navigator.notification.confirm(
                                    "Confirma Facturar?",  // message
                                    function (buttonIndex) {
                                        if (buttonIndex === 2) {
                                            my_dialog("Factura", "Procesando...", "close");
                                            PostInvoice(imageUri1, imageUri2, imageUri3);
                                            my_dialog("", "", "close");

                                        }
                                    },   // callback to invoke with index of button pressed
                                    'Sonda® ' + SondaVersion,   // title
                                    'No,Si'    // buttonLabels
                                );
                            } else {
                                notify("ERROR, Aun Debe tomar la imagen frontal");
                            }
                        }
                        else {
                            notify("ERROR, Aun Debe ingresar la información de series/imei");
                        }
                    },
                    function (err) {
                        if (err.code !== 0) {
                            alert("Error processing SQL: " + err.code);
                        }
                        var pReturnValue = -2;
                        return pReturnValue;
                    }
                );
            },
            function (err) {
                if (err.code !== 0) {
                    alert("Error processing SQL: " + err.code);
                }
                var pReturnValue = -3;
                return pReturnValue;
            }
        );



    } catch (e) {
        notify("ConfirmPostInvoice: " + e.message);
    }
}

function InsertInvoiceDetail(pSkuParent, pSeq, paramQty, listaDePrecio) {
    try {

        var pNextParentSeq = 1;

        SONDA_DB_Session.transaction(
            function (tx) {
                var pSql = "SELECT COUNT(1)+1 as CURRENT_SEQ FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" + pSkuParent + "' AND EXPOSURE = 1";

                try {
                    tx.executeSql(pSql, [],
                        function (tx, results) {
                            pNextParentSeq = results.rows.item(0).CURRENT_SEQ;
                            //pSql = "SELECT S.*,0 AS REQUERIES_SERIE FROM SKUS S WHERE S.SKU = '" + pSkuParent + "'";

                            pSql = "SELECT S.*, 0 AS REQUERIES_SERIE, IFNULL(P.PRICE,0) COST";
                            pSql += " FROM SKUS S";
                            pSql += " INNER JOIN PRICE_LIST_BY_SKU_PACK_SCALE P ON (S.SKU = P.CODE_SKU)";
                            pSql += " WHERE S.SKU = '" + pSkuParent + "'";
                            pSql += " AND P.CODE_PRICE_LIST = '" + listaDePrecio + "'";


                            tx.executeSql(pSql, [],
                                function (tx, results) {
                                    
                                    var pRequeriesSerie = results.rows.item(0).REQUERIES_SERIE;
                                    var pSkuPrice = results.rows.item(0).COST;
                                    var pSkuQty = paramQty;
                                    var pSkuName = results.rows.item(0).SKU_NAME;
                                    var pExposure = results.rows.item(0).EXPOSURE;


                                    // ReSharper disable once CoercedEqualsUsing
                                    if (pRequeriesSerie == 0) {
                                        pSql = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" + pSkuParent + "'";
                                        console.log(pSql);
                                        tx.executeSql(pSql);
                                    }

                                    pSql = 'INSERT INTO INVOICE_DETAIL(INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT, TOTAL_LINE, REQUERIES_SERIE, SERIE, SERIE_2, LINE_SEQ, IS_ACTIVE, COMBO_REFERENCE, PARENT_SEQ, EXPOSURE, PHONE) ';
                                    pSql += " VALUES(-9999,'" + results.rows.item(0).SKU + "','" + pSkuName + "', " + pSkuQty + ", " + pSkuPrice;
                                    pSql += ", 0, " + parseFloat(pSkuPrice) * parseInt(pSkuQty) + "," + pRequeriesSerie + ",0,0," + pSeq + ", 3, '" + pSkuParent + "'," + pNextParentSeq + "," + pExposure + ",'')";


                                    tx.executeSql(pSql);

                                    my_dialog("", "", "close");
                                },
                                function (err) {
                                    my_dialog("", "", "close");
                                    if (err.code !== 0) {
                                        alert("Error on: insert into invoice_detail: " + err.code);
                                    }
                                }
                            );

                        }
                    );

                } catch (e) {
                    notify(e.message);
                }
            },
            function (err) {
                // ReSharper disable once CoercedEqualsUsing
                if (err.code != 0) {
                    alert("03.50.110.Error processing SQL: " + err.code);
                }
            }
        );
    } catch (e) {
        var xresult = "InsertInvoiceDetail.Catch:" + e.message;
        console.log(xresult);
        notify("InsertInvoiceDetail: " + xresult);
    }
}


function printinvoice(pInvoice, pIsRePrinted) {
    try {
        my_dialog("Imprimiendo Factura", "#" + pInvoice + " Espere...", "open");
        bluetoothSerial.isConnected(
           function () {
               printinvoice_joininfo(pInvoice, pIsRePrinted);
           },
           function () {
               try {
                   bluetoothSerial.connect
                   (gPrintAddress,
                       function () {
                           printinvoice_joininfo(pInvoice, pIsRePrinted);
                       },
                       function () {
                           my_dialog("", "", "close");
                           notify("ERROR, Unable to connect to the printer.(" + gPrintAddress + ")");
                       }
                   );
               } catch (e) {
                   my_dialog("", "", "close");
                   notify("printinvoice: " + e.message);
               }
           }
       );
    }
    catch (e) {
        my_dialog("", "", "close");
        alert('cannot print ' + e.message);
    }
}


function ObtenerFormatoDeImpresion(invoiceId, tipoDeImpresion, isRePrinted, callback, errCallback) {
    var lheader = "";
    var ldetail = "";
    var lfooter = "";
    //var ltipoImpresion = "";
    var gBranchName = localStorage.getItem('POS_SAT_BRANCH_NAME');
    var gBranchAddress = localStorage.getItem('POS_SAT_BRANCH_ADDRESS');
    var pCurrentSatResDate = localStorage.getItem('POS_SAT_RES_DATE');
    var pCurrentSatResDocStart = localStorage.getItem('POS_SAT_RES_DOC_START');
    var pCurrentSatResDocFinish = localStorage.getItem('POS_SAT_RES_DOC_FINISH');
    try {

        var pSql = "SELECT A.*, B.* FROM INVOICE_HEADER A, INVOICE_DETAIL B WHERE A.INVOICE_NUM = " + invoiceId;
        pSql += " AND B.INVOICE_NUM = A.INVOICE_NUM AND A.IS_CREDIT_NOTE = 0 AND B.IS_ACTIVE = 1 AND B.EXPOSURE = 1";

        SONDA_DB_Session.transaction(
            function (tx) {
                tx.executeSql(pSql, [],
                    function (tx, results) {
                        var pExpiresAuth = localStorage.getItem('SAT_RES_EXPIRE');
                        var pRes = localStorage.getItem('POS_SAT_RESOLUTION');


                        var printDocLen = new Number();

                        printDocLen = 430; //header;
                        printDocLen += parseInt(parseInt(results.rows.length) * 130); //detail
                        //printDocLen += parseInt(290); //footer

                        lheader = "! 0 50 50 " + printDocLen + " 1\r\n";
                        lheader += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
                        lheader += "CENTER 550 T 1 2 0 10  " + gBranchName + "\r\n";
                        lheader += "CENTER 550 T 0 2 0 60 " + gBranchAddress + "\r\n";
                        lheader += "CENTER 550 T 0 3 0 90 Factura Serie " + results.rows.item(0).SAT_SERIE + " # " + invoiceId + "\r\n";
                        lheader += "L 5 310 570 310 1\r\n";
                        lheader += "CENTER 550 T 0 2 0 120 A NOMBRE DE: " + results.rows.item(0).CLIENT_NAME + "\r\n";
                        lheader += "L 5 370 570 370 1\r\n";

                        //lheader += "CENTER 550 T 0 2 0 150 " + tipoDeImpresion + "\r\n";

                        var pRow = 180;

                        ldetail = "";
                        var pImei = 0;
                        var pImeiPrint = 0;

                        for (var i = 0; i <= (results.rows.length - 1) ; i++) {

                            ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " " + results.rows.item(i).SKU + "- " + results.rows.item(i).SKU_NAME + "\r\n";
                            pRow += parseInt(30);

                            ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " CANTIDAD: " + results.rows.item(i).QTY + " / PREC.UNIT. : Q" + format_number(results.rows.item(i).PRICE, 2) + "\r\n";
                            pRow += parseInt(30);

                            pImei = results.rows.item(i).SERIE_2;
                            if (isNaN(pImei)) {
                                pImeiPrint = 0;
                            } else {
                                pImeiPrint = pImei;
                            }

                            ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " SERIE: " + results.rows.item(i).SERIE + "/ IMEI: " + pImeiPrint + "/ " + results.rows.item(i).PHONE + "\r\n";
                            pRow += parseInt(30);

                            ldetail = ldetail + "RIGHT 550 T 0 2 0 " + (pRow - 90) + " Q" + format_number(results.rows.item(i).PRICE, 2) + "\r\n";

                            ldetail = ldetail + "L 5 " + pRow + " 570 " + pRow + " 1\r\n";
                            pRow += parseInt(10);

                        }


                        pRow += parseInt(30);
                        lfooter = "LEFT 5 T 0 2 0 " + pRow + " TOTAL: \r\n";
                        lfooter = lfooter + "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(results.rows.item(0).TOTAL_AMOUNT, 2) + "\r\n";



                        pRow += parseInt(30);
                        lfooter += "CENTER 550 T 0 2 0 " + pRow + " [" + gIsOnline + "] " + getDateTime() + " / RUTA " + gCurrentRoute + " \r\n";

                        pRow += parseInt(30);
                        lfooter += "CENTER 550 T 0 2 0 " + pRow + " " + isRePrinted + " \r\n";

                        //pRow += parseInt(30);
                        //lfooter += lfooter + "L 5  " + pRow + " 570 " + pRow + " 1\r\n";

                        lfooter = lfooter + "L 5  80 570 80 1\r\nPRINT\r\n";

                        var pCpCl = (lheader + "CENTER 550 T 0 2 0 150 *** COPIA CONTABILIDAD ***\r\n" + ldetail + lfooter);
                        pCpCl = pCpCl + (lheader + "CENTER 550 T 0 2 0 150 *** ORIGINAL CLIENTE ***\r\n" + ldetail + lfooter);

                        callback(pCpCl);


                    }, function (tx, err) { errCallback(err) });

            }, function (err) {
                errCallback(err);

            });


    } catch (e) {
        errCallback({ code: -1, message: e.message });
    }

}

function ImprimirFactura(invoiceId, isRePrinted, callback, errCallback) {
    //ObtenerFormatoDeImpresion(
    //                        invoiceId,
    //                        "*** COPIA CONTABILIDAD ***",
    //                        isRePrinted,
    //                        function (cpcl) {
    //                            bluetoothSerial.write(
    //                                cpcl,
    //                                callback,
    //                                function () {
    //                                    errCallback(
    //                                        {
    //                                            code: -1,
    //                                            message: "Imposible Imprimir"
    //                                        }
    //                                    );
    //                                });
    //                        },
    //                        errCallback);

    try {

        ObtenerFormatoDeImpresion(
            invoiceId,
            "*** ORIGINAL CLIENTE ***",
            isRePrinted,
            function (cpcl) {
                bluetoothSerial.write(
                    cpcl,
                    function () {
                        callback();
                    },
                    function () {
                        errCallback(
                        {
                            code: -1,
                            message: "Imposible Imprimir"
                        });
                    });
            }, errCallback);


    } catch (e) {
        notify("printinvoice_joininfo: " + e.message);
        my_dialog("", "", "close");
        return e.message;
    }
}

