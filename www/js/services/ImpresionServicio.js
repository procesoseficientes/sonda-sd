function ConectarImpresora(impresora, callback, errorCallback) {
    try {
        if (impresora !== "") {
            gPrintAddress = impresora;

            bluetoothSerial.isConnected(function () {
                callback();
            }, function () {
                bluetoothSerial.connectInsecure(gPrintAddress, function () {
                    gTimeout = setTimeout(function () {
                        callback();
                        clearTimeout(gTimeout);
                    }, 2500);
                },
                    function () {
                        errorCallback("No se ha podido establecer conexión con la impresora");
                    }
                );
            });
        } else {
            errorCallback("No se ha localizado impresora");
        }
    } catch (e) {
        errorCallback("No se ha podido imprimir debido a: " + e.message);
    }
}

function Imprimir(formato, callback, errCallback) {
    bluetoothSerial.write(
        formato, function () {
            callback();
            var intentos = 0;
            var interval = setInterval(function () {
                intentos++;
                if (intentos == 5) {
                    bluetoothSerial.disconnect(null, null);
                    clearInterval(interval);
                }
            },
                1000);
        }, function (err) {
            errCallback(err);
        });
}

function ObtenerFormatoImpresionDevolucion(lskSku, callback, errCallback) {
    try {
        var formato = "";
        var formatoEncabezado = "";
        var formatoDetalle = "";
        var formatoCopia = "";
        //formato = "! 0 50 50 " + print_doc_len + " 1\r\n";
        formatoEncabezado += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
        formatoEncabezado += "CENTER 550 T 1 2 0 10 " + CenterText(gCompanyName) + "\r\n";
        formatoEncabezado += "CENTER 550 T 1 2 0 60 " + CenterText(gBranchName) + "\r\n";
        formatoEncabezado += "L 5 100 570 100  1\r\n";

        formatoEncabezado += "LEFT 5 T 0 2 0  110 Vendedor: " + localStorage.getItem('POS_LAST_LOGIN_ID') + "\r\n";
        formatoEncabezado += "LEFT 5 T 0 2 0  140 Ruta: " + localStorage.getItem('POS_CURRENT_ROUTE') + "\r\n";

        //formatoCopia += "CENTER 550 T 1 2 0 170 " + localStorage.getItem('POS_CURRENT_ROUTE') + "\r\n";

        var pRow = 210;
        for (var i = 0; i < lskSku.length  ; i++) {
            var sku = lskSku[i];

            formatoDetalle += "LEFT 5 T 0 2 0 " + pRow + " " + sku.ItemCode + "- " + sku.ItemDescription + "\r\n";
            pRow += parseInt(30);

            formatoDetalle += "LEFT 5 T 0 2 0 " + pRow + " CANTIDAD: " + sku.Quantity + "\r\n";
            pRow += parseInt(30);

            formatoDetalle += "L 5 " + pRow + " 570 " + pRow + " 1\r\n";
            pRow += parseInt(10);

        };

        pRow += parseInt(30);
        formatoDetalle += "LEFT 5 T 0 2 0 " + pRow + " F. Encargado: \r\n";

        pRow += parseInt(30);
        formatoDetalle += "L 5 " + pRow + " 570 " + pRow + " 1\r\n";


        pRow += parseInt(50);
        formatoDetalle += "LEFT 5 T 0 2 0 " + pRow + " F. Vendedor: \r\n";

        pRow += parseInt(30);
        formatoDetalle += "L 5 " + pRow + " 570 " + pRow + " 1\r\n";

        pRow += parseInt(30);
        formatoDetalle += "CENTER 570 T 0 1 0 " + pRow + " www.mobilityscm.com\r\n";
        pRow += parseInt(70);
        formatoDetalle += "L 5 T 0 2 0 " + pRow + " \r\nPRINT \r\n";
        pRow += parseInt(30);

        formato = "! 0 50 50 " + pRow + " 1\r\n" + formatoEncabezado + "CENTER 550 T 0 2 0 180 *****ORIGINAL***** \r\n" + formatoDetalle;

        formato += "! 0 50 50 " + pRow + " 1\r\n" + formatoEncabezado + "CENTER 550 T 0 2 0 180 *****COPIA***** \r\n" + formatoDetalle;


        callback(formato);
    } catch (e) {
        errCallback(e);
    }
}


function ObtenerFormatoDeImpresionRecollecionConsignacion(documento, callBack, errorCallBack) {
    try {
        var formato = "";
        var altura;
        var posY = 50;
        if (documento.DEVOLUTION_DETAIL.length === 1) {
            altura = 550;
            altura += (documento.DEVOLUTION_DETAIL.length * 180);
        } else if (documento.DEVOLUTION_DETAIL.length === 2) {
            altura = 600;
            altura += (documento.DEVOLUTION_DETAIL.length * 100);
        } else if (documento.DEVOLUTION_DETAIL.length > 2) {
            altura = 500;
            altura += (documento.DEVOLUTION_DETAIL.length * 80);
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
        formato += "L 0 " + posY + " 575 " + posY + " 2 \r\n";

        posY += 5;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posY + " CLIENTE: " + documento.CUSTOMER_ID + "\r\n";

        posY += 20;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posY + " SERIE: " + documento.DOC_SERIE + "\r\n";

        posY += 20;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posY + "DOCMENTO #: " + documento.DOC_NUM + "\r\n";

        posY += 20;
        formato += "L 0 " + posY + " 575 " + posY + " 2 \r\n";

        posY += 20;
        formato += "CENTER 475 \r\n";
        formato += "T 7 0 0 " + posY + " DESCRIPCION \r\n";
        formato += "LEFT 5 \r\n";
        formato += "T 7 0 5 " + posY + " SKU \r\n";
        formato += "RIGHT 450\r\n";
        formato += "T 7 0 450 " + posY + " CANT. \r\n";
        formato += "RIGHT 550\r\n";
        formato += "T 7 0 550 " + posY + " ESTADO \r\n";

        posY += 20;
        formato += "L 0 " + posY + " 575 " + posY + " 0.5 \r\n";

        //DETALLE--------------------------------------------------------------------
        for (var i = 0; i < documento.DEVOLUTION_DETAIL.length; i++) {
            var skuDetalle = documento.DEVOLUTION_DETAIL[i];
            posY += 10;
            var status;
            if (parseInt(skuDetalle.IS_GOOD_STATE) === 1) {
                status = "BUEN ESTADO";
            } else {
                status = "MAL ESTADO";
            }
            formato += "CENTER 475 \r\n";

            if (skuDetalle.SKU_NAME.length > 30) {
                formato += "T 0 2 0 " + posY + " " + skuDetalle.SKU_NAME.substring(0, 30) + "..." + "\r\n";
            } else {
                formato += "T 0 2 0 " + posY + " " + skuDetalle.SKU_NAME + "\r\n";
            }

            formato += "LEFT 5 \r\n";
            formato += "T 0 2 5 " + posY + " " + skuDetalle.CODE_SKU + "\r\n";
            formato += "RIGHT 410\r\n";
            formato += "T 0 2 410 " + posY + " " + skuDetalle.QTY_SKU.toString() + "\r\n";
            formato += "RIGHT 550\r\n";
            formato += "T 0 2 550 " + posY + " " + status + "\r\n";
            if (skuDetalle.HANDLE_SERIAL === 1 || skuDetalle.HANDLE_SERIAL === "1") {
                posY += 20;
                formato += "LEFT 5 \r\n";
                formato += "T 7 0 5 " + posY + " Serie:" + skuDetalle.SERIAL_NUMBER + "\r\n";
            }

            posY += 25;
            formato += "L 0 " + posY + " 575 " + posY + " 0.5 \r\n";
        }

        //PIE------------------------------------------------------------------------
        posY += 155;
        formato += "LEFT 5 L 0 " + posY + " 250 " + posY + " 1 \r\n";
        formato += "RIGHT 550 L 500 " + posY + " 700 " + posY + " 1 \r\n";

        posY += 10;
        formato += "LEFT 5 T 0 2 5 " + posY + " FIRMA CLIENTE \r\n";
        formato += "RIGHT 550 T 0 2 300 " + posY + " FIRMA VENDEDOR \r\n";

        posY += 40;
        formato += "CENTER 550 T 0 2 0 " + posY + " [" + gIsOnline + "] " + getDateTime() + " / RUTA: " + gCurrentRoute + " \r\n";

        posY += 20;
        formato += "CENTER 550 T 0 2 0 " + posY + " www.mobilityscm.com \r\n";

        formato += "PRINT\r\n";

        callBack(formato);
    } catch (e) {
        errorCallBack("Error al intentar obtener el formato de impresión para los productos recogidos debido a: " + e.message);
    }
}

function ObtenerFormatoDeImpresionDeReporteDeLiquidacionFinDeRuta(objetoReportes, callBack, errorCallBack) {
    try {
        var manejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
        manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function(manejoDeDecimales) {

        var formato = "";
        var rowPosition = 50;
        var skusInventario = objetoReportes.INVENTARIO;
        var depositosDeRuta = objetoReportes.DEPOSITOS_DE_RUTA;

        //ENCABEZADO----------------------------------------------------------------
        formato = "! 0 50 50 _DOC_LEN_ 1 \r\n";
        formato += "! U1 PAGE-WIDTH 1400 \r\n";
        formato += "ON-FEED IGNORE \r\n";
            formato += "CENTER 550 T 1 2 0 10 " +
                (gBranchName.length > 30 ? CenterText(gBranchName) : gBranchName) +
                "\r\n";

        if (gBranchAddress.length > 30) {
            rowPosition += 50;
            formato += "CENTER 550 T 0 2 0 " + rowPosition + " " + gBranchAddress.substring(0, 30) + "\r\n";

            rowPosition += 20;
                formato += "CENTER 550 T 0 2 0 " +
                    rowPosition +
                    " " +
                    gBranchAddress.substring(31, gBranchAddress.length - 1) +
                    "\r\n";

        } else {
            if (localStorage.getItem('direccionFacturacion01')) {
                rowPosition += 60;
                    formato += "CENTER 550 T 0 2 0 " +
                        rowPosition +
                        " " +
                        localStorage.getItem('direccionFacturacion01') +
                        "\r\n";
            }

            if (localStorage.getItem('direccionFacturacion02')) {
                rowPosition += 20;
                    formato += "CENTER 550 T 0 2 0 " +
                        rowPosition +
                        " " +
                        localStorage.getItem('direccionFacturacion02') +
                        "\r\n";
            }

            if (localStorage.getItem('direccionFacturacion03')) {
                rowPosition += 20;
                    formato += "CENTER 550 T 0 2 0 " +
                        rowPosition +
                        " " +
                        localStorage.getItem('direccionFacturacion03') +
                        "\r\n";
            }

            if (localStorage.getItem('direccionFacturacion04')) {
                rowPosition += 20;
                    formato += "CENTER 550 T 0 2 0 " +
                        rowPosition +
                        " " +
                        localStorage.getItem('direccionFacturacion04') +
                        "\r\n";
            }
        }

        rowPosition += 20;
        formato += "CENTER 550 T 7 0 0 " + rowPosition + " REPORTE DE LIQUIDACIÓN \r\n";

        rowPosition += 20;
        formato += "LEFT 5 \r\n";
        formato += "T 7 0 5 " + rowPosition + " Monto A Liquidar: \r\n";
        formato += "RIGHT 550\r\n";
            formato += "T 7 0 550 " +
                rowPosition +
                " " +
                currencySymbol +
                ". " +
                format_number(objetoReportes.TOTAL_A_LIQUIDAR, manejoDeDecimales.defaultDisplayDecimals) +
                "\r\n";

        rowPosition += 25;
        formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 2 \r\n";

        //DETALLE-------------------------------------------------------------------------------------------------

        //DEPOSITOS DE RUTA
        if (depositosDeRuta.length > 0) {
            rowPosition += 20;
            formato += "CENTER 550 T 7 0 0 " + rowPosition + " LIQUIDACIÓN MONETARIA" + "\r\n";

            rowPosition += 5;
            for (var j = 0; j < depositosDeRuta.length; j++) {
                var deposito = depositosDeRuta[j];

                rowPosition += 20;
                formato += "LEFT 5 \r\n";
                formato += "T 7 0 5 " + rowPosition + " DP" + (j + 1) + " - " + deposito.ACCOUNT_NUM + " \r\n";
                formato += "RIGHT 550\r\n";
                formato += "T 7 0 550 " +
                    rowPosition +
                    " " +
                    currencySymbol +
                    ". " +
                        format_number(deposito.AMOUNT, manejoDeDecimales.defaultDisplayDecimals) +
                    "\r\n";

                rowPosition += 23;
                formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 0.5 \r\n";

                if (j === depositosDeRuta.length - 1) {

                    if (objetoReportes.TOTAL_FACTURADO_AL_CREDITO > 0) {
                        rowPosition += 20;
                        formato += "LEFT 5 \r\n";
                        formato += "T 7 0 5 " + rowPosition + " Crédito: \r\n";
                        formato += "RIGHT 550\r\n";
                        formato += "T 7 0 550 " +
                            rowPosition +
                            " " +
                            currencySymbol +
                            ". " +
                                (format_number(objetoReportes.TOTAL_FACTURADO_AL_CREDITO, manejoDeDecimales.defaultDisplayDecimals)) +
                            "\r\n";
                    }

                    rowPosition += 20;
                    formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " + rowPosition + " Efectivo: \r\n";
                    formato += "RIGHT 550\r\n";
                    formato += "T 7 0 550 " +
                        rowPosition +
                        " " +
                        currencySymbol +
                        ". " +
                        (format_number((objetoReportes.TOTAL_A_LIQUIDAR -
                                objetoReportes.TOTAL_DEPOSITOS_DE_RUTA -
                                objetoReportes.TOTAL_FACTURADO_AL_CREDITO),
                                manejoDeDecimales.defaultDisplayDecimals)) +
                        "\r\n";

                    rowPosition += 25;
                    formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 2 \r\n";
                }

            }
        } else {
            if (objetoReportes.TOTAL_FACTURADO_AL_CREDITO > 0) {
                rowPosition += 20;
                formato += "LEFT 5 \r\n";
                formato += "T 7 0 5 " + rowPosition + " Crédito: \r\n";
                formato += "RIGHT 550\r\n";
                formato += "T 7 0 550 " +
                    rowPosition +
                    " " +
                    currencySymbol +
                    ". " +
                        (format_number(objetoReportes.TOTAL_FACTURADO_AL_CREDITO, manejoDeDecimales.defaultDisplayDecimals)) +
                    "\r\n";
            }

            rowPosition += 20;
            formato += "LEFT 5 \r\n";
            formato += "T 7 0 5 " + rowPosition + " Efectivo: \r\n";
            formato += "RIGHT 550\r\n";
            formato += "T 7 0 550 " +
                rowPosition +
                " " +
                currencySymbol +
                ". " +
                (format_number((objetoReportes.TOTAL_A_LIQUIDAR -
                        objetoReportes.TOTAL_FACTURADO_AL_CREDITO),
                        manejoDeDecimales.defaultDisplayDecimals)) +
                "\r\n";

            rowPosition += 25;
            formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 2 \r\n";
        }

        rowPosition += 20;
        formato += "CENTER 550 T 7 0 0 " + rowPosition + " LIQUIDACIÓN INVENTARIO \r\n";

        rowPosition += 25;
        formato += "LEFT 5 \r\n";
        formato += "T 7 0 5 " + rowPosition + " INV.INI = Inventario Inicial  \r\n";

        rowPosition += 20;
        formato += "LEFT 5 \r\n";
        formato += "T 7 0 5 " + rowPosition + " CON. = Consignaciones \r\n";

        rowPosition += 20;
        formato += "LEFT 5 \r\n";
        formato += "T 7 0 5 " + rowPosition + " DEV. = Devoluciones  \r\n";

        rowPosition += 20;
        formato += "LEFT 5 \r\n";
        formato += "T 7 0 5 " + rowPosition + " TRANS. = Transferencias \r\n";

        rowPosition += 25;
        formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 2 \r\n";

        // SKUS DE INVENTARIO
        for (var i = 0; i < skusInventario.length; i++) {
            var sku = skusInventario[i];

            rowPosition += 10;
            if (sku.SKU_NAME.length > 25) {
                    formato += "CENTER 550 T 7 0 0 " +
                        rowPosition +
                        " " +
                        sku.SKU +
                        " " +
                        sku.SKU_NAME.substring(0, 25) +
                        "..." +
                        "\r\n";
            } else {
                formato += "CENTER 550 T 7 0 0 " + rowPosition + " " + sku.SKU + " " + sku.SKU_NAME + "\r\n";
            }


            rowPosition += 20;
            formato += "CENTER 400 \r\n";
            formato += "T 7 0 0 " + rowPosition + " VENTAS \r\n";
            formato += "LEFT 5 \r\n";
            formato += "T 7 0 5 " + rowPosition + " INV.INI  \r\n";
            formato += "RIGHT 325\r\n";
            formato += "T 7 0 325 " + rowPosition + " CON. \r\n";
            formato += "RIGHT 425\r\n";
            formato += "T 7 0 425 " + rowPosition + " DEV. \r\n";
            formato += "RIGHT 550\r\n";
            formato += "T 7 0 550 " + rowPosition + " TRANS. \r\n";

            rowPosition += 25;
            formato += "CENTER 380 \r\n";
                formato += "T 0 2 0 " + rowPosition + " -" + (format_number(sku.QTY_SOLD,manejoDeDecimales.defaultDisplayDecimalsForSkuQty)) + "\r\n";
            formato += "LEFT 25 \r\n";
                formato += "T 0 2 25 " + rowPosition + " " + (format_number(sku.INITIAL_INV, manejoDeDecimales.defaultDisplayDecimalsForSkuQty)) + "\r\n";
            formato += "RIGHT 300 \r\n";
                formato += "T 0 2 300 " + rowPosition + " -" + (format_number(sku.QTY_CONSIGNED, manejoDeDecimales.defaultDisplayDecimalsForSkuQty)) + "\r\n";
            formato += "RIGHT 400 \r\n";
                formato += "T 0 2 400 " + rowPosition + " +" + (format_number(sku.QTY_COLLECTED, manejoDeDecimales.defaultDisplayDecimalsForSkuQty)) + "\r\n";
            formato += "RIGHT 530 \r\n";
                formato += "T 0 2 530 " + rowPosition + " +" + (format_number(sku.QTY_TRANSFERED, manejoDeDecimales.defaultDisplayDecimalsForSkuQty)) + "\r\n";

            rowPosition += 20;
            formato += "LEFT 5 \r\n";
            formato += "T 7 0 5 " + rowPosition + " DIFERENCIA: \r\n";
            formato += "RIGHT 550\r\n";
                formato += "T 0 2 550 " + rowPosition + " " + (format_number(sku.DIFFERENCE, manejoDeDecimales.defaultDisplayDecimalsForSkuQty)) + "\r\n";

            rowPosition += 23;
            formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 0.5 \r\n";

        }

        //RESUMEN DE FACTURAS -------------------------------------------------------
            if (objetoReportes
                .VISUALIZAR_E_IMPRIMIR_RESUMEN_DE_FACTURAS &&
                objetoReportes.FACTURAS_DE_RUTA.length > 0) {
            var sumatoriaTotalDeFacturas = 0;

            rowPosition += 20;
            formato += "CENTER 550 T 7 0 0 " + rowPosition + " LIQUIDACION DE FACTURAS \r\n";


            rowPosition += 20;
            formato += "LEFT 5 \r\n";
            formato += "T 7 0 5 " + rowPosition + " FACTURA\r\n";
            formato += "RIGHT 550\r\n";
            formato += "T 7 0 550 " + rowPosition + " MONTO \r\n";

            rowPosition += 23;
            formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 0.5 \r\n";

                objetoReportes.FACTURAS_DE_RUTA.forEach(function(factura) {

                sumatoriaTotalDeFacturas += (factura.STATUS === 3) ? 0 : factura.TOTAL_AMOUNT;

                rowPosition += 20;
                formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " +
                        rowPosition +
                        " " +
                        (factura.STATUS == 3 ? (factura.INVOICE_NUM + "(Anulada)") : factura.INVOICE_NUM) +
                        "\r\n";
                formato += "RIGHT 550\r\n";
                    formato += "T 7 0 550 " +
                        rowPosition +
                        " " +
                        currencySymbol +
                        ". " +
                        (format_number((factura.TOTAL_AMOUNT), manejoDeDecimales.defaultDisplayDecimals)) +
                        "\r\n";

            });

            rowPosition += 25;
            formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 0.5 \r\n";

            rowPosition += 15;
            formato += "CENTER 400 \r\n";
            formato += "T 7 0 0 " + rowPosition + " Total Facturado: \r\n";
            formato += "RIGHT 425\r\n";
                formato += "T 7 0 425 " +
                    rowPosition +
                    " " +
                    currencySymbol +
                    ". " +
                    (format_number((sumatoriaTotalDeFacturas), manejoDeDecimales.defaultDisplayDecimals)) +
                    "\r\n";

            rowPosition += 25;
            formato += "L 0 " + rowPosition + " 550 " + rowPosition + " 2 \r\n";

        }


        //PIE------------------------------------------------------------------------
        rowPosition += 155;
        formato += "LEFT 5 L 0 " + rowPosition + " 250 " + rowPosition + " 1 \r\n";
        formato += "RIGHT 550 L 500 " + rowPosition + " 700 " + rowPosition + " 1 \r\n";

        rowPosition += 10;
        formato += "LEFT 5 T 0 2 5 " + rowPosition + " FIRMA LIQUIDADOR \r\n";
        formato += "RIGHT 550 T 0 2 250 " + rowPosition + " FIRMA VENDEDOR \r\n";

        rowPosition += 40;
            formato += "CENTER 550 T 0 2 0 " +
                rowPosition +
                " [" +
                gIsOnline +
                "] " +
                getDateTime() +
                " / RUTA: " +
                gCurrentRoute +
                " \r\n";

        rowPosition += 20;
        formato += "CENTER 550 T 0 2 0 " + rowPosition + " www.mobilityscm.com/sonda \r\n";

        formato += "PRINT\r\n";

        formato = formato.replace("_DOC_LEN_", rowPosition + 150);

        callBack(formato);
        });
    } catch (e) {
        console.log("Error al intentar obtener el formato de impresion debido a: " + e.message);
        errorCallBack(e.message);
    }
}


function ObtenerFormatoDeImpresionDeReporteDeLiquidacionDeEntrega(objetoReportes, callBack, errorCallBack) {
    try {

        var manejoDeDecimalesServicio = new ManejoDeDecimalesServicio();

        manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (configuracionDeDecimales) {

            var formato = "";
            var posY = 100;
            var entregasCompletadas = objetoReportes.ENTREGAS_DE_RUTA;
            var entregasNoCompletadas = objetoReportes.DEMANDAS_DE_DESPACHO_NO_ENTREGADAS_O_CANCELADAS;

            //ENCABEZADO----------------------------------------------------------------
            formato = "! 0 50 50 DOC_LEN 1 \r\n";
            formato += "! U1 PAGE-WIDTH 1400 \r\n";
            formato += "ON-FEED IGNORE \r\n";
            formato += "CENTER 550 T 1 2 0 10 " + (gBranchName.length > 30 ? CenterText(gBranchName) : gBranchName) + "\r\n";

            if (gBranchAddress.length > 30) {
                posY += 50;
                formato += "CENTER 550 T 0 2 0 " + posY + " " + gBranchAddress.substring(0, 30) + "\r\n";

                posY += 20;
                formato += "CENTER 550 T 0 2 0 " + posY + " " + gBranchAddress.substring(31, gBranchAddress.length - 1) + "\r\n";

            } else {
                if (localStorage.getItem('direccionFacturacion01')) {
                    posY += 60;
                    formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion01') + "\r\n";
                }

                if (localStorage.getItem('direccionFacturacion02')) {
                    posY += 20;
                    formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion02') + "\r\n";
                }

                if (localStorage.getItem('direccionFacturacion03')) {
                    posY += 20;
                    formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion03') + "\r\n";
                }

                if (localStorage.getItem('direccionFacturacion04')) {
                    posY += 20;
                    formato += "CENTER 550 T 0 2 0 " + posY + " " + localStorage.getItem('direccionFacturacion04') + "\r\n";
                }
            }

            posY += 20;
            formato += "CENTER 550 T 7 0 0 " + posY + " REPORTE DE LIQUIDACIÓN DE ENTREGAS \r\n";

            posY += 25;
            formato += "L 0 " + posY + " 550 " + posY + " 2 \r\n";

            //DETALLE-------------------------------------------------------------------------------------------------

            //ENTREGAS COMPLETADAS
            if (TieneEntregasCompletadas(entregasCompletadas)) {

                posY += 20;
                formato += "SETBOLD 1\r\n";
                formato += "CENTER 550 T 7 0 0 " + posY + " ENTREGAS PROCESADAS \r\n";
                formato += "SETBOLD 0\r\n";

                posY += 15;
                entregasCompletadas.map(function (entregaCompletada) {

                    posY += 20;
                    formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " + posY + " Entrega: " + entregaCompletada.DELIVERY_NOTE_ID + " \r\n";
                    formato += "RIGHT 550\r\n";
                    formato += "T 7 0 550 " + posY + " Factura: " + entregaCompletada.INVOICE_ID + "/" + entregaCompletada.INVOICE_STATUS + "\r\n";

                    posY += 20;
                    formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " + posY + " Cliente: " + entregaCompletada.CODE_CUSTOMER + " \r\n";
                    formato += "RIGHT 550\r\n";
                    formato += "T 7 0 550 " + posY + " Monto: " + format_number(trunc_number(entregaCompletada.TOTAL_AMOUNT, configuracionDeDecimales.defaultCalculationsDecimals), configuracionDeDecimales.defaultDisplayDecimals) + "\r\n";

                    posY += 20;
                    formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " + posY + " Nom. Cliente: " + entregaCompletada.cliente.RELATED_CLIENT_NAME + " \r\n";

                    posY += 25;
                    formato += "L 0 " + posY + " 550 " + posY + " 2 \r\n";

                });

            }

            //ENTREGAS NO COMPLETADAS
            if (TieneEntregasCanceladas(entregasNoCompletadas)) {

                posY += 20;
                formato += "SETBOLD 1\r\n";
                formato += "CENTER 550 T 7 0 0 " + posY + " ENTREGAS NO PROCESADAS \r\n";
                formato += "SETBOLD 0\r\n";

                posY += 15;
                entregasNoCompletadas.map(function (entregaCancelada) {

                    posY += 20;
                    formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " + posY + " Orden: " + entregaCancelada.DOC_NUM + " \r\n";
                    formato += "RIGHT 550\r\n";
                    formato += "T 7 0 550 " + posY + " Factura: " + entregaCancelada.ERP_REFERENCE_DOC_NUM + "\r\n";

                    posY += 20;
                    formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " + posY + " Cliente: " + entregaCancelada.CLIENT_CODE + " \r\n";
                    formato += "RIGHT 550\r\n";
                    formato += "T 7 0 550 " + posY + " Monto: " + format_number(trunc_number(entregaCancelada.TOTAL_AMOUNT, configuracionDeDecimales.defaultCalculationsDecimals), configuracionDeDecimales.defaultDisplayDecimals) + "\r\n";

                    posY += 20;
                    formato += "LEFT 5 \r\n";
                    formato += "T 7 0 5 " + posY + " Nom. Cliente: " + entregaCancelada.CLIENT_NAME + " \r\n";

                    posY += 25;
                    formato += "L 0 " + posY + " 550 " + posY + " 2 \r\n";

                });

            }

            //PIE------------------------------------------------------------------------
            posY += 155;
            formato += "LEFT 5 L 0 " + posY + " 250 " + posY + " 1 \r\n";
            formato += "RIGHT 550 L 500 " + posY + " 700 " + posY + " 1 \r\n";

            posY += 10;
            formato += "LEFT 5 T 0 2 5 " + posY + " FIRMA LIQUIDADOR \r\n";
            formato += "RIGHT 550 T 0 2 250 " + posY + " FIRMA OPERADOR \r\n";

            posY += 40;
            formato += "CENTER 550 T 0 2 0 " + posY + " [" + gIsOnline + "] " + getDateTime() + " / RUTA: " + gCurrentRoute + " \r\n";

            posY += 20;
            formato += "CENTER 550 T 0 2 0 " + posY + " www.mobilityscm.com/sonda \r\n";

            formato += "PRINT\r\n";

            formato = formato.replace("DOC_LEN", posY + 300);

            callBack(formato);

        });



    } catch (e) {
        errorCallBack("Error al intentar obtener el formato de impresion debido a: " + e.message);
    }
}

function TieneEntregasCompletadas(entregasCompletadas) {
    return entregasCompletadas.length > 0;
}

function TieneEntregasCanceladas(demandasDeDespachoCanceladas) {
    return demandasDeDespachoCanceladas.length > 0;
}

function ObtenerFormatoDeImpresionDePago(documentoDePago, callback, errorCallback) {
    try {

        var pagosEnEfectivo = documentoDePago.overdueInvoicePaymentTypeDetail.filter(function (pago) {
            return pago.paymentType === TipoDePagoFacturaVencida.Efectivo;
        });

        var pagosEnCheque = documentoDePago.overdueInvoicePaymentTypeDetail.filter(function (pago) {
            return pago.paymentType === TipoDePagoFacturaVencida.Cheque;
        });

        var pagosEnDeposito = documentoDePago.overdueInvoicePaymentTypeDetail.filter(function (pago) {
            return pago.paymentType === TipoDePagoFacturaVencida.Deposito;
        });

        var totalDePagoEnDepositos = 0;
        var totalDePagoEnCheques = 0;

        pagosEnDeposito.forEach(function(pago) {
            totalDePagoEnDepositos += pago.amount;
        });

        pagosEnCheque.forEach(function(pago) {
            totalDePagoEnCheques += pago.amount;
        });

        var posicionDeLinea = 10;

        var formato = "";

        formato = "! 0 50 50 _DOC_LEN_ 1\r\n";
        formato += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
        formato += "CENTER 550 T 7 0 0 " + posicionDeLinea + " " + CenterText(gCompanyName) + "\r\n";
        posicionDeLinea += 30;
        formato += "CENTER 550 T 7 0 0 " + posicionDeLinea + " " + CenterText(documentoDePago.branchName) + "\r\n";

        if (documentoDePago.branchAddress.length > 30) {
            posicionDeLinea += 30;
            formato += "CENTER 550 T 0 2 0 " + posicionDeLinea + " " + documentoDePago.branchAddress.substring(0, 30) + "\r\n";
            posicionDeLinea += 30;
            formato += "CENTER 550 T 0 2 0 " +
                posicionDeLinea +
                " " +
                documentoDePago.branchAddress.substring(31, documentoDePago.branchAddress.length - 1) +
                "\r\n";
        } else {
            posicionDeLinea += 30;
            formato += "CENTER 550 T 0 2 0 " + posicionDeLinea + " " + documentoDePago.branchAddress + "\r\n";
        }

        posicionDeLinea += 20;
        formato += "L 0 " + posicionDeLinea + " 575 " + posicionDeLinea + " 2 \r\n";

        posicionDeLinea += 5;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posicionDeLinea + " CLIENTE: " + documentoDePago.codeCustomer + "\r\n";

        posicionDeLinea += 20;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posicionDeLinea + " SERIE: " + documentoDePago.docSerie + "\r\n";

        posicionDeLinea += 20;
        formato += "CENTER 575 \r\n";
        formato += "T 7 0 0 " + posicionDeLinea + "DOCUMENTO #: " + documentoDePago.docNum + "\r\n";

        if (documentoDePago.isReprint) {
            posicionDeLinea += 30;
            formato += "CENTER 550 T 7 0 0 " + posicionDeLinea + " *** COPIA CONTABILIDAD ***\r\n";
        } else {
            posicionDeLinea += 30;
            formato += "CENTER 550 T 7 0 0 " + posicionDeLinea + " *** ORIGINAL CLIENTE ***\r\n";
        }

        posicionDeLinea += 30;
        formato += "LEFT 5 T 7 0 0 " + posicionDeLinea + " Factura No. \r\n";
        formato += "RIGHT 550 T 7 0 0 " + posicionDeLinea + " Monto Cancelado\r\n";

        posicionDeLinea += 20;
        formato += "L 0 " + posicionDeLinea + " 575 " + posicionDeLinea + " 2 \r\n";

        var totalFacturas = 0;
        documentoDePago.overdueInvoicePaymentDetail.forEach(function (detalleDePago, numeroDeIteracion) {
            if (numeroDeIteracion === 0) {
                posicionDeLinea += 20;
            } else {
                posicionDeLinea += 30;
            }

            totalFacturas += detalleDePago.payedAmount;
            
            formato += "LEFT 5 T 7 0 0 " + posicionDeLinea + " " + detalleDePago.invoiceId + "\r\n";
            formato += "RIGHT 550 T 7 0 0 " +
                posicionDeLinea +
                " " +
                (window.accounting.formatMoney(detalleDePago.payedAmount)) +
                "\r\n";
        });

        posicionDeLinea += 20;
        formato += "RIGHT 550 T 7 0 0 " +
               posicionDeLinea +
               " Total Facturas: " +
               (window.accounting.formatMoney(totalFacturas)) +
               "\r\n";

        posicionDeLinea += 30;
        formato += "CENTER 550 T 7 0 0 " + posicionDeLinea + " DETALLE DE PAGOS\r\n";

        if (pagosEnEfectivo.length > 0) {
            posicionDeLinea += 30;
            formato += "LEFT 5 T 7 0 5 " + posicionDeLinea + " Efectivo\r\n";
            
            formato += "RIGHT 550 T 7 0 0 " +
               posicionDeLinea +
               " " +
               (window.accounting.formatMoney(pagosEnEfectivo[0].amount)) +
               "\r\n";
        }

        if (pagosEnDeposito.length > 0) {
            posicionDeLinea += 30;
            formato += "LEFT 5 T 7 0 5 " + posicionDeLinea + " Depósitos\r\n";

            formato += "RIGHT 550 T 7 0 0 " +
              posicionDeLinea +
              " " +
              (window.accounting.formatMoney(totalDePagoEnDepositos)) +
              "\r\n";
            
            pagosEnDeposito.forEach(function (pago, numeroDeIteracion) {
                if (numeroDeIteracion === 0) {
                    posicionDeLinea += 25;
                } else {
                    posicionDeLinea += 20;
                }

                formato += "LEFT 5 T 7 0 15 " + posicionDeLinea + " " + pago.bankName + " " + pago.documentNumber + "\r\n";
                formato += "LEFT 5 T 7 0 300 " +
                    posicionDeLinea +
                    " " +
                    (window.accounting.formatMoney(pago.amount)) +
                    "\r\n";
            });
        }

        if (pagosEnCheque.length > 0) {
            posicionDeLinea += 30;
            formato += "LEFT 5 T 7 0 0 " + posicionDeLinea + " Cheques\r\n";

            formato += "RIGHT 550 T 7 0 0 " +
              posicionDeLinea +
              " " +
              (window.accounting.formatMoney(totalDePagoEnCheques)) +
              "\r\n";

            pagosEnCheque.forEach(function(pago, numeroDeIteracion) {
                if (numeroDeIteracion === 0) {
                    posicionDeLinea += 25;
                } else {
                    posicionDeLinea += 20;
                }

                formato += "LEFT 5 T 7 0 15 " + posicionDeLinea + " " + pago.bankName + " " + pago.documentNumber + "\r\n";
                formato += "LEFT 5 T 7 0 300 " +
                    posicionDeLinea +
                    " " +
                    (window.accounting.formatMoney(pago.amount)) +
                    "\r\n";
            });
        }

        posicionDeLinea += 25;
        formato += "L 0 " + posicionDeLinea + " 575 " + posicionDeLinea + " 2 \r\n";

        posicionDeLinea += 20;
        formato += "RIGHT 550 T 7 0 0 " +
            posicionDeLinea +
            " Total de Pagos: " +
            (window.accounting.formatMoney(documentoDePago.paymentAmount)) +
            "\r\n";

        if (documentoDePago.paidComment) {
            posicionDeLinea += 20;
            formato += "LEFT 5 T 7 0 0 " + posicionDeLinea + " " + documentoDePago.paidComment + "\r\n";
        }

        posicionDeLinea += 30;
        formato += "CENTER 550 T 0 2 0 " +
            posicionDeLinea +
            " [" +
            gIsOnline +
            "] " +
            getDateTime() +
            " / RUTA " +
            gCurrentRoute +
            " \r\n";

        if (documentoDePago.reprint) {
            posicionDeLinea += 30;
            formato += "CENTER 550 T 7 0 0 " + posicionDeLinea + " *** RE-IMPRESO *** \r\n";
        }

        posicionDeLinea += 20;
        formato = formato + "PRINT\r\n";

        formato = formato.replace("_DOC_LEN_", (posicionDeLinea + 100));

        callback(formato);
    } catch (e) {
        errorCallback(e.message);
    }
}