
function GrabarConsignacion(consignacion, callBack) {
    try {
        InsertarConsignacionEncabezado(consignacion.encabezado,
            function (encabezadoConsignacion) {
                for (var i = 0; i < consignacion.detalle.length; i++) {
                    var sku = consignacion.detalle[i];
                    InsertarConsignacionDetalle(
                        encabezadoConsignacion.ConsignmentId,
                        sku,
                        i,
                        SiNo.No,
                        function (numeroDeLinea) {
                            if (numeroDeLinea === consignacion.detalle.length - 1) {
                                callBack();
                            }
                        });
                }
            });

    } catch (e) {
        notify(e.message);
    }
}

function InsertarConsignacionDesdeBo(consignacion) {
    try {
        InsertarConsignacionEncabezado(consignacion,
            function (consignacion) {
                for (var i = 0; i < consignacion.detalle.length; i++) {
                    InsertarConsignacionDetalle(consignacion.detalle[i].ConsignmentId,
                        consignacion.detalle[i],
                        i,
                        SiNo.Si,
                        null);
                }
            });
    } catch (e) {
        notify(e.message);
    }
}

function InsertarConsignacionEncabezado(encabezadoConsignacion, callBack) {
    try {
        var psql = "";

        SONDA_DB_Session.transaction(
            function (tx) {
                psql = " INSERT INTO CONSIGNMENT_HEADER(";
                psql += " CONSIGNMENT_ID, ";
                psql += "CUSTOMER_ID, ";
                psql += "DATE_CREATE, ";
                psql += "DATE_UPDATE, ";
                psql += "STATUS, ";
                psql += "POSTED_BY, ";
                psql += "IS_POSTED, ";
                psql += "POS_TERMINAL, ";
                psql += "GPS_URL, ";
                psql += "DOC_DATE, ";
                psql += "CLOSED_ROUTE_DATETIME, ";
                psql += "IS_ACTIVE_ROUTE, ";
                psql += "DUE_DATE, ";
                psql += "CONSIGNMENT_BO_NUM, ";
                psql += "DOC_SERIE, ";
                psql += "DOC_NUM, ";
                psql += "IS_RECONSIGN, ";
                psql += "TOTAL_AMOUNT, " +
                        "IMG, " +
                        "IS_CLOSED, " +
                        "IN_ROUTE, " +
                        "CONSIGNMENT_TYPE";
                psql += ") ";
                psql += " VALUES (";
                psql += encabezadoConsignacion.ConsignmentId;
                psql += ",'" + encabezadoConsignacion.CustomerId + "'";
                psql += ",'" + encabezadoConsignacion.DateCreate + "'";
                if (encabezadoConsignacion.DateUpdate == null) {
                    psql += "," + null;
                }
                else {
                    psql += ",'" + encabezadoConsignacion.DateUpdate + "'";
                }
                psql += ",'" + encabezadoConsignacion.Status + "'";
                psql += ",'" + encabezadoConsignacion.PostedBy + "'";
                psql += ", " + encabezadoConsignacion.IsPosted;
                psql += ",'" + encabezadoConsignacion.Pos_terminal + "'";
                psql += ",'" + encabezadoConsignacion.Gps + "'";
                psql += ",'" + encabezadoConsignacion.DocDate + "'";
                if (encabezadoConsignacion.ClosedRouteDateTime == null) {
                    psql += "," + null;
                }
                else {
                    psql += ",'" + encabezadoConsignacion.ClosedRouteDateTime + "'";
                }
                psql += ", " + encabezadoConsignacion.IsActiveRoute;
                if (encabezadoConsignacion.DueDate == null) {
                    psql += "," + null;
                }
                else {
                    psql += ",'" + encabezadoConsignacion.DueDate + "'";
                }
                psql += ", " + encabezadoConsignacion.ConsignmentId;
                psql += ", '" + encabezadoConsignacion.DocSerie + "' ";
                psql += ", " + encabezadoConsignacion.DocNum;
                if (encabezadoConsignacion.IsReconsign === undefined) {
                    psql += ", " + null;
                } else {
                    psql += ", " + encabezadoConsignacion.IsReconsign;
                }
                psql += ", " + encabezadoConsignacion.TotalAmount;
                psql += ", '" + encabezadoConsignacion.Image + "' ";
                psql += ", " + encabezadoConsignacion.IsClosed;
                if (parseInt(encabezadoConsignacion.InRoute) === 1) {
                    psql += ", " + parseInt(encabezadoConsignacion.InRoute);
                } else {
                    psql += ", " + null;
                }
                if ((!encabezadoConsignacion.ConsignmentType) || encabezadoConsignacion.ConsignmentType == undefined) {
                    psql += ", " + null;
                } else {
                    psql += ", '" + encabezadoConsignacion.ConsignmentType + "' ";
                }
                psql += ")";
                console.log(psql);
                tx.executeSql(psql);
            },
        function (err) {
            notify(err.message);
        },
        function () {
            if (callBack)
                callBack(encabezadoConsignacion);
        });
    } catch (e) {
        notify(e.message);
    }
}

function InsertarConsignacionDetalle(idConsignacion, sku, numeroLinea, vieneDeBo, callBack) {
    try {
        var psql = "";
        var fecha = getDateTime().toString();

        SONDA_DB_Session.transaction(
            function (tx) {

                psql = " INSERT INTO CONSIGNMENT_DETAIL(";
                psql += " CONSIGNMENT_ID, ";
                psql += "SKU, ";
                psql += "LINE_NUM, ";
                psql += "QTY, ";
                psql += "PRICE, ";
                psql += "DISCOUNT, ";
                psql += "TOTAL_LINE, ";
                psql += "POSTED_DATETIME, ";
                psql += "HANDLE_SERIAL, ";
                psql += "SERIAL_NUMBER ";
                psql += ") VALUES (";
                psql += idConsignacion;
                psql += ", '" + sku.SKU + "' ";
                psql += ", " + numeroLinea;
                psql += ", " + sku.QTY_CONSIGNMENT;
                psql += ", " + sku.PRICE;
                if (vieneDeBo === 1) {
                    psql += ", " + sku.DISCOUNT;
                }
                else {
                    psql += ", " + 0;
                }
                psql += ", " + sku.TOTAL_LINE;
                if (vieneDeBo === 1) {
                    psql += ",'" + sku.POSTED_DATETIME + "' ";
                }
                else {
                    psql += ", '" + fecha + "' ";
                }
                if (vieneDeBo) {
                    psql += ", " + sku.HANDLE_SERIAL;
                    psql += ", '" + sku.SERIAL_NUMBER + "' ";
                } else {
                    psql += ", " + sku.REQUERIES_SERIE;
                    psql += ", '" + sku.SERIE + "' ";
                }
                psql += ")";

                tx.executeSql(psql);
                console.log(psql);
            },
        function (err) {
            notify(err.message);
            console.log("InsertarConsignacionDetalle: " + err);
        },
        function () {
            if (callBack)
                callBack(numeroLinea);
        });
    } catch (e) {
        notify(e.message);
        console.log("InsertarConsignacionDetalle: " + e.message);
    }
}

function ObtenerSkus(callBack, errorCallBack) {
    try {

        window.gSkuList.length = 0;

        SONDA_DB_Session.transaction(function (tx) {
            var pSql = 'SELECT A.SKU, A.PRICE, B.SKU_NAME, B.ON_HAND, A.QTY, A.TOTAL_LINE, A.REQUERIES_SERIE, A.LINE_SEQ, ';
            pSql += ' B.IS_KIT, A.SERIE, A.SERIE_2 FROM INVOICE_DETAIL A, ';
            pSql += ' SKUS B WHERE A.INVOICE_NUM = -9999 AND B.SKU = A.SKU AND B.EXPOSURE = 1 ORDER BY A.PRICE DESC';

            tx.executeSql(pSql, []
                , function (tx, results) {
                    if (results.rows.length === 0) {
                        callBack();
                    } else {
                        for (var u = 0; u < results.rows.length; u++) {
                            var item = results.rows.item(u);
                            window.gSkuList.push(item);
                        }
                        callBack();
                    }
                }, function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        }, function (error) {
            if (error.code !== 0) {
                errorCallBack(error.message);
            }
        });
    } catch (e) {
        errorCallBack(e.message);
    }
}

function ObtenerSiguienteNumeroDeConsignacion() {
    try {
        var consignacionActual = localStorage.getItem("POS_CURRENT_CONSIGNMENT_ID");

        if (consignacionActual === undefined || consignacionActual === null) {
            localStorage.setItem("POS_CURRENT_CONSIGNMENT_ID", 1);
            consignacionActual = 1;
            return (consignacionActual * -1);
        } else {
            var consignacionSiguiente = parseInt(consignacionActual) + 1;
            localStorage.setItem("POS_CURRENT_CONSIGNMENT_ID", consignacionSiguiente);
            return (consignacionSiguiente * -1);
        }
    } catch (e) {
        notify(e.message);
        return null;
    }
}

function EliminarConsignacion(consignmentId) {
    try {
        SONDA_DB_Session.transaction(function (tx) { //callback
            var sqlEncabezado = "DELETE FROM CONSIGNMENT_HEADER WHERE CONSIGNMENT_ID =" + consignmentId;
            tx.executeSql(sqlEncabezado);

            var sqlDetalle = "DELETE FROM CONSIGNMENT_DETAIL WHERE CONSIGNMENT_ID = " + consignmentId;
            tx.executeSql(sqlDetalle);

        }, function (error) { //error callback
            if (error.code !== 0) {
                notify(error.message);
            }
        }, function () {//success

        });
    } catch (e) {
        notify(e.message);
    }
}

function QuitarSkusDeFactura(indice, lineSeq, sku, serie, qty, callBack) {
    try {
        var sql = "";
        SONDA_DB_Session.transaction(
            function (tx) {
                var pSQL = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" + sku + "' AND SERIE = '" + serie + "'";
                console.log(pSQL);
                tx.executeSql(pSQL);

                var pSQL1 = "UPDATE SKU_SERIES SET STATUS = 0 WHERE SKU = '" + sku + "' AND SERIE = '" + serie + "'";
                console.log(pSQL1);
                tx.executeSql(pSQL1);

                pSQL = 'UPDATE SKUS SET ON_HAND = ON_HAND + ' + parseInt(qty) + " WHERE SKU = '" + sku + "'";
                console.log(pSQL);
                tx.executeSql(pSQL);

                var pCurrentSEQ = Number(localStorage.getItem('POS_ITEM_SEQ'));
                localStorage.setItem('POS_ITEM_SEQ', Number(pCurrentSEQ) - 1);

            }
            , function (err) {
                notify("QuitarSkusDeFactura: " + err);
                console.log("QuitarSkusDeFactura: " + err);
            }
            , function () {
                callBack(indice);
            }
        );
    } catch (e) {
        notify(e.message);
        console.log(e.message);
    }
}

function AgregarSkus(skuParent, skuPrice, skuQty) {
    try {

        var pNextParentSeq = 1;
        var pSEQ = 0;
        var totalLine = (skuQty * skuPrice);
        var skuObject;
        var pExposure = 0;

        SONDA_DB_Session.transaction(
            function (tx) {
                var pSQL = "SELECT COUNT(1)+1 as CURRENT_SEQ FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" + skuParent + "'";

                try {

                    tx.executeSql(pSQL, [],
                        function (tx, results) {
                            pNextParentSeq = results.rows.item(0).CURRENT_SEQ;
                            pSQL = "SELECT * FROM SKUS WHERE SKU = '" + skuParent + "'";

                            tx.executeSql(pSQL, [],
                                function (tx, results) {
                                    skuObject = results.rows.item(0);


                                    var pREQUERIES_SERIE = skuObject.REQUERIES_SERIE;
                                    var pSKU_Price = skuPrice;
                                    var pSKUQTY = skuQty;
                                    var pSKU_Name = skuObject.SKU_NAME;
                                    pExposure = skuObject.EXPOSURE;

                                    if (PagoConsignacionesControlador.EstaEnPagoDeConsignacion) {

                                        var sql = "SELECT 1 AS EXISTE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" + skuParent + "'";
                                        console.log(sql);

                                        tx.executeSql(sql, [], function (tx, results) {
                                            if (results.rows.length > 0) {
                                                if (parseInt(results.rows.item(0).EXISTE) === 1) {
                                                    var sqlupdate = "UPDATE INVOICE_DETAIL SET QTY = QTY + " + parseInt(skuQty) +
                                                        ", TOTAL_LINE = TOTAL_LINE + " + parseFloat(totalLine) +
                                                        " WHERE INVOICE_NUM = -9999 AND SKU = '" + skuParent + "'";
                                                    console.log(sqlupdate);
                                                    tx.executeSql(sqlupdate);

                                                }
                                            } else {
                                                if (skuObject.REQUERIES_SERIE === 0) {
                                                    pSQL = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" + skuParent + "'";
                                                    tx.executeSql(pSQL);
                                                    console.log(pSQL);
                                                }
                                                pSQL = "";
                                                pSEQ = parseInt(pNextParentSeq) + 1;

                                                pSQL = 'INSERT INTO INVOICE_DETAIL(INVOICE_NUM, ' +
                                                    'SKU, ' +
                                                    'SKU_NAME, ' +
                                                    'QTY, ' +
                                                    'PRICE, ' +
                                                    'DISCOUNT, ' +
                                                    'TOTAL_LINE, ' +
                                                    'REQUERIES_SERIE, ' +
                                                    'SERIE, ' +
                                                    'SERIE_2, ' +
                                                    'LINE_SEQ, ' +
                                                    'IS_ACTIVE, ' +
                                                    'COMBO_REFERENCE, ' +
                                                    'PARENT_SEQ, ' +
                                                    'EXPOSURE, ' +
                                                    'PHONE) ';

                                                pSQL += " VALUES(-9999,'" + skuObject.SKU + "'," + "'" + skuObject.SKU_NAME + "', " + "" + skuQty + ", " + "" + skuPrice + ", 0, " + "" + totalLine + "," + "" + skuObject.REQUERIES_SERIE + ",0,0," + pSEQ + ", 3, " + "'" + skuParent + "'," + pNextParentSeq + "," + pExposure + ",'')";
                                                tx.executeSql(pSQL);
                                                console.log(pSQL);
                                            }
                                        }, function (tx, err) {
                                            if (err.code !== 0) {
                                                notify("No ha sido posible agregar el sku al detalle de pago debido a: " + err.message);
                                                console.log("AgregarSkus: " + err);
                                            }
                                        });
                                    } else {
                                        if (skuObject.REQUERIES_SERIE === 0) {
                                            pSQL = "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" + skuParent + "'";
                                            tx.executeSql(pSQL);
                                            console.log(pSQL);
                                        }
                                        pSQL = "";
                                        pSEQ = parseInt(pNextParentSeq) + 1;

                                        pSQL = 'INSERT INTO INVOICE_DETAIL(INVOICE_NUM, ' +
                                            'SKU, ' +
                                            'SKU_NAME, ' +
                                            'QTY, ' +
                                            'PRICE, ' +
                                            'DISCOUNT, ' +
                                            'TOTAL_LINE, ' +
                                            'REQUERIES_SERIE, ' +
                                            'SERIE, ' +
                                            'SERIE_2, ' +
                                            'LINE_SEQ, ' +
                                            'IS_ACTIVE, ' +
                                            'COMBO_REFERENCE, ' +
                                            'PARENT_SEQ, ' +
                                            'EXPOSURE, ' +
                                            'PHONE) ';

                                        pSQL += " VALUES(-9999,'" + skuObject.SKU + "'," + "'" + skuObject.SKU_NAME + "', " + "" + skuQty + ", " + "" + skuPrice + ", 0, " + "" + totalLine + "," + "" + skuObject.REQUERIES_SERIE + ",0,0," + pSEQ + ", 3, " + "'" + skuParent + "'," + pNextParentSeq + "," + pExposure + ",'')";
                                        tx.executeSql(pSQL);
                                        console.log(pSQL);

                                        if (PagoConsignacionesControlador.EstaEnPagoDeConsignacion === false) {
                                            pSQL = "";
                                            pSQL = 'UPDATE SKUS SET ON_HAND = ON_HAND - ' + parseInt(skuQty) + " WHERE SKU = '" + skuObject.SKU + "'";
                                            tx.executeSql(pSQL);
                                            console.log(pSQL);
                                        }
                                    }

                                    pExposure = null;
                                    pREQUERIES_SERIE = null;
                                    pSKU_Price = null;
                                    pSKUQTY = null;
                                    pSKU_Name = null;

                                },
                                function (err) {
                                    if (err.code !== 0) {
                                        notify(err.message);
                                        console.log("AgregarSkus: " + err);
                                    }
                                });
                        });
                } catch (e) {
                    notify(e.message);
                    console.log("AgregarSkus: " + e);
                }
                pSQL = null;
            }, function (err, tx) {
                if (err.code !== 0) {
                    notify(err.message);
                    console.log("AgregarSkus: " + err);
                }
            });
    } catch (e) {
        notify(e.message);
        console.log("AgregarSkus: " + e.message);
    }
}

function AgregarNuevosSkusAFactura(factura, callBack) {
    try {
        if (factura.length > 0) {
            for (var i = 0; i < factura.length; i++) {
                var skuSo = factura[i];
                if (parseInt(skuSo.QTY) !== 0) {
                    if (skuSo.REQUERIES_SERIE === 1 || skuSo.REQUERIES_SERIE === "1") {
                        var skuObject = {
                            SKU: skuSo.SKU
                            , PRICE: skuSo.PRICE
                            , SERIAL_NUMBER: skuSo.SERIE
                            , skuConSerie: true
                        }
                        PagoConsignacionesServicio.AgregarSkuConSerieAFactura(skuObject, function (error) {
                            notify(error);
                        });
                    } else {
                        AgregarSkus(skuSo.SKU, skuSo.PRICE, skuSo.QTY);
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

function LimpiarFacturaOriginal(factura, callBack) {
    try {
        if (factura.length > 0) {
            for (var i = 0; i < factura.length; i++) {
                var skuSo = factura[i];
                QuitarSkusDeFactura(i, skuSo.LINE_SEQ, skuSo.SKU, skuSo.SERIE, skuSo.QTY, function (indiceDevuelto) {
                    if (indiceDevuelto === factura.length - 1) {
                        callBack();
                    }
                });
            }
        } else {
            callBack();
        }
    } catch (e) {
        notify("LimpiarFacturaOriginal: " + e.message);
        console.log("LimpiarFacturaOriginal: " + e.message);
    }
}

function ObtenerFormatoDeImpresionConsignacion(consignacion, callback) {
    try {

        var formato = "";
        var altura = 270;
        var posY = 50;
        if (consignacion.detalle.length === 1) {
            altura += (consignacion.detalle.length * 160);
        } else if (consignacion.detalle.length > 1) {
            altura += (consignacion.detalle.length * 90);
        }

        //ENCABEZADO----------------------------------------------------------------
        formato = "! 0 50 50 " + altura + " 1 \r\n";
        formato += "! U1 PAGE-WIDTH 1400 \r\n";
        formato += "ON-FEED IGNORE \r\n";
        formato += "CENTER 550 T 1 2 0 10 " + CenterText(gCompanyName) + " \r\n";
        formato += "CENTER 550 T 1 2 0 50 " + CenterText(gBranchName) + " \r\n";

        if (gBranchAddress.length > 30) {
            posY += 50;
            formato += "CENTER 550 T 0 2 0 " + posY + " " + gBranchAddress.substring(0, 30) + "\r\n";

            posY += 20;
            formato += "CENTER 550 T 0 2 0 " + posY + " " + gBranchAddress.substring(31, gBranchAddress.length - 1) + "\r\n";

        } else {
            posY += 60;
            formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion01') + "\r\n";

            posY += 20;
            formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion02') + "\r\n";

            if (localStorage.getItem('direccionFacturacion03').length > 0) {
                posY += 20;
                formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion03') + "\r\n";

            }

            if (localStorage.getItem('direccionFacturacion04').length > 0) {
                posY += 20;
                formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion04') + "\r\n";
            }
        }

        posY += 20;
        formato += "L 0 " + posY + " 550 " + posY + " 2 \r\n";

        posY += 5;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posY + " CLIENTE: " + consignacion.encabezado.CustomerId + "\r\n";

        posY += 20;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posY + " SERIE: " + consignacion.encabezado.DocSerie + "\r\n";

        posY += 20;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posY + " DOCUMENTO #: " + consignacion.encabezado.DocNum + "\r\n";

        posY += 20;
        formato += "L 0 " + posY + " 575 " + posY + " 2 \r\n";

        posY += 10;
        formato += "CENTER 550 \r\n";
        formato += "T 7 0 0 " + posY + " DESCRIPCION \r\n";
        formato += "LEFT 5 \r\n";
        formato += "T 7 0 5 " + posY + " SKU \r\n";
        formato += "RIGHT \r\n";
        formato += "T 7 0 535 " + posY + " QTY \r\n";

        posY += 20;
        formato += "L 0 " + posY + " 575 " + posY + " 2 \r\n";

        //DETALLE--------------------------------------------------------------------
        for (var i = 0; i < consignacion.detalle.length; i++) {
            var skuDetalle = consignacion.detalle[i];
            posY += 10;
            formato += "CENTER 600 \r\n";

            if (skuDetalle.SKU_NAME.length > 25) {
                formato += "T 7 0 0 " + posY + " " + skuDetalle.SKU_NAME.substring(0, 25) + "..." + "\r\n";
            } else {
                formato += "T 7 0 0 " + posY + " " + skuDetalle.SKU_NAME + "\r\n";
            }

            formato += "LEFT 5 \r\n";
            formato += "T 7 0 5 " + posY + " " + skuDetalle.SKU + "\r\n";
            formato += "RIGHT\r\n";
            formato += "T 7 0 525 " + posY + " " + skuDetalle.QTY_CONSIGNMENT.toString() + "\r\n";
            if (skuDetalle.HANDLE_SERIAL === 1 || skuDetalle.HANDLE_SERIAL === "1") {
                posY += 20;
                formato += "LEFT 5 \r\n";
                formato += "T 7 0 5 " + posY + " Serie:" + skuDetalle.SERIAL_NUMBER + "\r\n";
            }
            posY += 25;
            formato += "L 0 " + posY + " 575 " + posY + " 0.5 \r\n";
        }
        //PIE------------------------------------------------------------------------

        posY += 20;
        formato += "CENTER 550 T 0 2 0 " + posY + " [" + gIsOnline + "] " + getDateTime() + " / RUTA: " + gCurrentRoute + " \r\n";

        posY += 20;
        formato += "CENTER 550 T 0 2 0 " + posY + "www.mobilityscm.com \r\n";

        formato += "PRINT\r\n";

        callback(formato);


    } catch (e) {
        notify(e.message);
    }
}

function ImprimirDocumento(documento, callback, errCallback) {
    try {

        window.bluetoothSerial.clear(function () {
            window.bluetoothSerial.isConnected(function () {
                setTimeout(function () {
                    window.bluetoothSerial.write(documento, function () {
                        window.bluetoothSerial.disconnect(function () {
                            setTimeout(callback, 2000);
                        }, function () {
                            errCallback();
                        });
                    }, function () {
                        errCallback();
                    });
                }, 2500);
            }, function () {
                window.bluetoothSerial.connect(gPrintAddress, function () {
                    setTimeout(function () {
                        window.bluetoothSerial.write(documento, function () {
                            window.bluetoothSerial.disconnect(function () {
                                setTimeout(callback, 2000);
                            }, function () {
                                errCallback();
                            });
                        }, function () {
                            errCallback();
                        });
                    }, 2500);
                }, function () {
                    errCallback();
                });
            });
        }, function () {
            window.bluetoothSerial.isConnected(function () {
                setTimeout(function () {
                    window.bluetoothSerial.write(documento, function () {
                        window.bluetoothSerial.disconnect(function () {
                            setTimeout(callback, 2000);
                        }, function () {
                            errCallback();
                        });
                    }, function () {
                        errCallback();
                    });
                }, 2500);
            }, function () {
                window.bluetoothSerial.connect(gPrintAddress, function () {
                    setTimeout(function () {
                        window.bluetoothSerial.write(documento, function () {
                            window.bluetoothSerial.disconnect(function () {
                                setTimeout(callback, 2000);
                            }, function () {
                                errCallback();
                            });
                        }, function () {
                            errCallback();
                        });
                    }, 2500);
                }, function () {
                    errCallback();
                });
            });
        });
    } catch (e) {
        notify(e.message);
    }
}

function ObtenerConsignaciones(callback, errCallback) {
    var consignaciones = new Array();
    SONDA_DB_Session.transaction(
         function (tx) {
             var psql = "SELECT ";
             psql += "CH.CONSIGNMENT_ID, ";
             psql += "CH.CUSTOMER_ID, ";
             psql += "CH.DATE_CREATE, ";
             psql += "CH.STATUS, ";
             psql += "CH.POSTED_BY, ";
             psql += "CH.IS_POSTED, ";
             psql += "CH.POS_TERMINAL, ";
             psql += "CH.GPS_URL, ";
             psql += "CH.DOC_DATE, ";
             psql += "CH.IS_ACTIVE_ROUTE, ";
             psql += "CH.CONSIGNMENT_BO_NUM, ";
             psql += "CH.DOC_SERIE, ";
             psql += "CH.DOC_NUM, ";
             psql += "IFNULL(CH.TOTAL_AMOUNT,0) TOTAL_AMOUNT, " +
                     "CH.IN_ROUTE, ";
             psql += "CH.CONSIGNMENT_TYPE ";
             psql += " FROM CONSIGNMENT_HEADER AS CH";

             tx.executeSql(psql, [],
                 function (tx, results) {
                     for (var i = 0; i < results.rows.length ; i++) {
                         var consignacion = {
                             ConsignmentId: results.rows.item(i).CONSIGNMENT_ID,
                             CustomerId: results.rows.item(i).CUSTOMER_ID,
                             DateCreate: results.rows.item(i).DATE_CREATE,
                             Status: results.rows.item(i).STATUS,
                             PostedBy: results.rows.item(i).POSTED_BY,
                             IsPosted: results.rows.item(i).IS_POSTED,
                             PosTerminal: results.rows.item(i).POS_TERMINAL,
                             GpsUrl: results.rows.item(i).GPS_URL,
                             DocDate: results.rows.item(i).DOC_DATE,
                             IsActiveRoute: results.rows.item(i).IS_ACTIVE_ROUTE,
                             ConsignmentBoNum: results.rows.item(i).CONSIGNMENT_BO_NUM,
                             DocSerie: results.rows.item(i).DOC_SERIE,
                             DocNum: results.rows.item(i).DOC_NUM,
                             InRoute: results.rows.item(i).IN_ROUTE,
                             TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
                             ConsignmentType: results.rows.item(i).CONSIGNMENT_TYPE
                         };
                         consignaciones.push(consignacion);
                     }
                     callback(consignaciones);
                 },
                 function (tx, err) {
                     if (err.code !== 0)
                         errCallback(err);
                 }
             );
         },
         function (err) {
             errCallback(err);
         });
}

function ObtenerDetallePorConsignacion(consignmentId, index, callBack, errorCallBack) {
    try {
        var psql = "";
        var detalleConsignacion = new Array();
        SONDA_DB_Session.transaction(
            function (tx) {
                psql = "SELECT ";
                psql += "CD.CONSIGNMENT_ID, ";
                psql += "CD.SKU, ";
                psql += "S.SKU_NAME, ";
                psql += "CD.LINE_NUM, ";
                psql += "CD.QTY, ";
                psql += "CD.PRICE, ";
                psql += "CD.DISCOUNT, ";
                psql += "CD.TOTAL_LINE, ";
                psql += "CD.POSTED_DATETIME, ";
                psql += "CD.HANDLE_SERIAL, ";
                psql += "CD.SERIAL_NUMBER ";
                psql += "FROM CONSIGNMENT_DETAIL AS CD INNER JOIN SKUS AS S ON(S.SKU = CD.SKU) ";
                psql += "WHERE CD.CONSIGNMENT_ID =" + parseInt(consignmentId);
                psql += " ORDER BY CD.LINE_NUM ASC";
                tx.executeSql(
                    psql
                    , []
                    , function (tx, results) {
                        for (var j = 0; j < results.rows.length; j++) {
                            var detalle = {
                                CONSIGNMENT_ID: results.rows.item(j).CONSIGNMENT_ID,
                                SKU: results.rows.item(j).SKU,
                                SKU_NAME: results.rows.item(j).SKU_NAME,
                                LINE_NUM: results.rows.item(j).LINE_NUM,
                                QTY_CONSIGNMENT: results.rows.item(j).QTY,
                                PRICE: results.rows.item(j).PRICE,
                                DISCOUNT: results.rows.item(j).DISCOUNT,
                                TOTAL_LINE: results.rows.item(j).TOTAL_LINE,
                                POSTED_DATETIME: results.rows.item(j).POSTED_DATETIME,
                                PAYMENT_ID: results.rows.item(j).PAYMENT_ID,
                                HANDLE_SERIAL: results.rows.item(j).HANDLE_SERIAL,
                                SERIAL_NUMBER: results.rows.item(j).SERIAL_NUMBER,
                                PAYMENT_OPTION: null
                            };
                            detalleConsignacion.push(detalle);
                        }
                        callBack(detalleConsignacion, index);
                    }
                    , function (err) {
                        if (err.code !== 0) {
                            errorCallBack(err);
                        }
                    });
            },
        function (err) {
            errorCallBack(err);
        },
        function () {
            //....
        });
    } catch (e) {
        errorCallBack(e);
    }
}


function ObtenerConsignacion(idConsignacion, callback, errCallback) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var psql = "SELECT ";
             psql += "CH.CONSIGNMENT_ID, ";
             psql += "CH.CUSTOMER_ID, ";
             psql += "CH.DATE_CREATE, ";
             psql += "CH.STATUS, ";
             psql += "CH.POSTED_BY, ";
             psql += "CH.IS_POSTED, ";
             psql += "CH.POS_TERMINAL, ";
             psql += "CH.GPS_URL, ";
             psql += "CH.DOC_DATE, ";
             psql += "CH.IS_ACTIVE_ROUTE, ";
             psql += "CH.CONSIGNMENT_BO_NUM, ";
             psql += "CH.DOC_SERIE, ";
             psql += "CH.DOC_NUM, ";
             psql += "IFNULL(CH.TOTAL_AMOUNT,0) TOTAL_AMOUNT, ";
             psql += "CH.CONSIGNMENT_TYPE ";
             psql += " FROM CONSIGNMENT_HEADER AS CH WHERE CH.CONSIGNMENT_ID = " + parseInt(idConsignacion);

             tx.executeSql(psql, [],
                 function (tx2, results) {
                     var consignacion = {
                         ConsignmentId: results.rows.item(0).CONSIGNMENT_ID,
                         CustomerId: results.rows.item(0).CUSTOMER_ID,
                         DateCreate: results.rows.item(0).DATE_CREATE,
                         Status: results.rows.item(0).STATUS,
                         PostedBy: results.rows.item(0).POSTED_BY,
                         IsPosted: results.rows.item(0).IS_POSTED,
                         PosTerminal: results.rows.item(0).POS_TERMINAL,
                         GpsUrl: results.rows.item(0).GPS_URL,
                         DocDate: results.rows.item(0).DOC_DATE,
                         IsActiveRoute: results.rows.item(0).IS_ACTIVE_ROUTE,
                         ConsignmentBoNum: results.rows.item(0).CONSIGNMENT_BO_NUM,
                         DocSerie: results.rows.item(0).DOC_SERIE,
                         DocNum: results.rows.item(0).DOC_NUM,
                         TotalAmount: results.rows.item(0).TOTAL_AMOUNT,
                         ConsignmentType: results.rows.item(0).CONSIGNMENT_TYPE
                     };
                     callback(consignacion);
                 },
                 function (tx2, err) {
                     if (err.code !== 0)
                         errCallback(err.message);
                 }
             );
         },
         function (err) {
             errCallback(err.message);
         });
}

function AnularConsigacion(consignacionId, razon, callBack, errorCallBack) {
    SONDA_DB_Session.transaction(function (trans) {
        var sql = "UPDATE CONSIGNMENT_HEADER SET STATUS = 'VOID', IS_CLOSED = 1, IS_POSTED = 5, REASON = '" + razon + "' WHERE CONSIGNMENT_ID = " + parseInt(consignacionId);
        console.log(sql);
        trans.executeSql(sql);
        callBack(consignacionId);
    }, function (err) {
        if (err.code !== 0) {
            console.log("Error al intentar anular la consignacion debido a: " + err.message);
            errorCallBack("Error al intentar anular la consignacion debido a: " + err.message);
        }
    });
}

function AgregarSkuDeConsigacionAInventario(consignacionId, callBack, errorCallBack) {
    SONDA_DB_Session.transaction(function (trans) {
        var sql = " SELECT SKU, QTY FROM CONSIGNMENT_DETAIL WHERE CONSIGNMENT_ID = " + parseInt(consignacionId);
        console.log(sql);
        trans.executeSql(sql, [],
            function (trans2, results) {
                if (results.rows.length > 0) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var sku = results.rows.item(i);
                        var sql2 = "UPDATE SKUS SET ON_HAND = (ON_HAND + " + parseInt(sku.QTY) + ") WHERE SKU = '" + sku.SKU + "' ";
                        console.log(sql2);
                        trans2.executeSql(sql2);
                    }
                    callBack(consignacionId);
                }
            }, function (error, trans2) {
                if (trans2.code !== 0) {
                    console.log("Error al intentar agregar el inventario de consignacion a la bodega del vendedor debido a: " + trans2.message);
                    errorCallBack("Error al intentar agregar el inventario de consignacion a la bodega del vendedor debido a: " + trans2.message);
                }
            });

    }, function (err) {
        if (err.code !== 0) {
            console.log("Error al intentar agregar el inventario de consignacion a la bodega del vendedor debido a: " + err.message);
            errorCallBack("Error al intentar agregar el inventario de consignacion a la bodega del vendedor debido a: " + err.message);
        }
    });
}

function AgregarTrazabilidad(consignmentId, docSerieSouce, docNumSource, codeSku, qtySku, paymentOption, docSerieTarget, docNumTarget, fechaTransaccion, callBack, errorCallBack) {
    SONDA_DB_Session.transaction(function (trans) {

        var sql = "INSERT INTO HISTORICAL_TRACEABILITY_CONSIGNMENT(CONSIGNMENT_ID, DOC_SERIE_SOURCE, DOC_NUM_SOURCE, SKU, QTY, ACTION,DOC_SERIE_TARGET, DOC_NUM_TARGET, DATE_TRANSACTION, IS_POSTED)" +
            "  VALUES( " + parseInt(consignmentId) + ", '" + docSerieSouce + "', " + parseInt(docNumSource) + ", '" + codeSku + "', " + parseInt(qtySku) + ",'" + paymentOption + "','" + docSerieTarget + "'," + parseInt(docNumTarget) + ", '" + fechaTransaccion + "', 0 )";
        console.log(sql);
        trans.executeSql(sql);
        callBack();

    }, function (err) {
        if (err.code !== 0) {
            console.log("Error al intentar agregar Trasabilidad debido a: " + err.message);
            errorCallBack("Error al intentar agregar Trasabilidad debido a: " + err.message);
        }
    });
}

function MarcarSeriesUtilizadasEnConsignacion(consignacion, callBack, errorCallBack) {
    try {
        var sql = "";
        SONDA_DB_Session.transaction(
            function (trans) {
                for (var i = 0; i < consignacion.detalle.length; i++) {
                    var skuTemp = consignacion.detalle[i];
                    sql = "UPDATE SKU_SERIES SET STATUS = " + SerieUtilizada.Si + " WHERE SKU = '" + skuTemp.SKU + "' AND SERIE = '" + skuTemp.SERIE + "'";
                    console.log(sql);
                    trans.executeSql(sql);
                }
                callBack(consignacion);
            }
            , function (error) {
                if (error.code !== 0) {
                    console.log("Error al intentar obtener las series por sku debido a: " + error.message);
                    errorCallBack(error.message);
                }
            });
    } catch (e) {
        errorCallBack(e.message);
    }
}