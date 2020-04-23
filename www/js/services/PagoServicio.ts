class PagoServicio implements IPagoServicio {
    ordenDeVentaServicio = new OrdenDeVentaServicio();

    formarPagoUnico(cliente: Cliente, ordenDeVenta: OrdenDeVenta, tipoDePago: TipoDePago, callback: (pago: PagoEncabezado) => void, errCallBack: (resultado: Operacion) => void): void {
        try {
            GetNexSequence("PAYMENT", (sequence) => {
                var pago = new PagoEncabezado();
                pago.pagoDetalle = [];

                var detalle = new PagoDetalle();

                pago.paymentNum = parseInt(sequence);
                pago.clientId = cliente.clientId;
                pago.clientName = cliente.clientName;
                pago.totalAmount = ordenDeVenta.totalAmount;
                pago.postedDatetime = ordenDeVenta.postedDatetime;
                pago.posTerminal = ordenDeVenta.posTerminal;
                pago.gps = ordenDeVenta.gpsUrl;
                pago.docDate = ordenDeVenta.postedDatetime;
                pago.depositToDate = null;
                pago.isPosted = 0;
                pago.status = 'OPEN';
                pago.paymentBoNum = null;

                detalle.id = pago.paymentNum;
                detalle.paymentNum = null;
                detalle.paymentType = tipoDePago.toString();
                detalle.lineNum = 1;
                detalle.docDate = null;
                detalle.docNum = null;
                detalle.image = null;
                detalle.bankId = null;
                detalle.accountNum = null;
                detalle.invoiceNum = null;
                detalle.invoiceSerie = null;
                detalle.amountPaid = pago.totalAmount;

                pago.pagoDetalle.push(detalle);

                callback(pago);
            }, (err) => {
                notify("Error al obtener sequencia de documento: " + err.message);
            });


            //detalle.
        } catch (err) {
            errCallBack(<Operacion>{ codigo: -1, mensaje: "Error al generar el pago:" + err.message });
        }
    }

    formarPagoUnicoDesdeLista(cliente: Cliente, listaSku: Sku[], tipoDePago: TipoDePago, numeroDeDocumento: string, imagen1: string, imagen2: string, callback: (pago: PagoEncabezado) => void, errCallBack: (resultado: Operacion) => void): void {
        try {
            this.obtenerSecuenciaDeDocumentos((sequence: string, serie: string, numeroDeDocumentoDeSecuencia: number) => {
                let pago = new PagoEncabezado();
                pago.pagoDetalle = [];
                let detalle = new PagoDetalle();

                pago.paymentNum = parseInt(sequence);
                pago.clientId = cliente.clientId;
                pago.clientName = cliente.clientName;
                pago.totalAmount = cliente.totalAmout;
                pago.postedDatetime = getDateTime();
                pago.posTerminal = gCurrentRoute;
                pago.gps = gCurrentGPS;
                pago.docDate = getDateTime();
                pago.depositToDate = null;
                pago.isPosted = 0;
                pago.status = 'OPEN';
                pago.paymentBoNum = null;
                pago.docSerie = serie;
                pago.docNum = numeroDeDocumentoDeSecuencia;

                detalle.id = pago.paymentNum;
                detalle.paymentNum = pago.paymentNum;
                detalle.paymentType = tipoDePago.toString();
                detalle.lineNum = 1;
                detalle.docDate = null;
                detalle.docNum = null;
                detalle.image = null;
                detalle.bankId = null;
                detalle.accountNum = null;
                detalle.invoiceNum = null;
                detalle.invoiceSerie = null;
                detalle.amountPaid = pago.totalAmount;
                detalle.sourceDocType = TipoTarea.Preventa.toString();
                detalle.documentNumber = numeroDeDocumento;
                detalle.image1 = imagen1;
                detalle.image2 = imagen2;

                pago.pagoDetalle.push(detalle);

                callback(pago);
            });
        } catch (err) {
            errCallBack(<Operacion>{ codigo: -1, mensaje: "Error al generar el pago:" + err.message });
        }
    }

    obtenerFormatoDeImpresionDePago(cliente: Cliente, ordenDeVenta: OrdenDeVenta, pago: PagoEncabezado, callback: (formato: string) => void, callbackError: (resultado: Operacion) => void): void {
        try {
            this.ordenDeVentaServicio.obtenerCantidadDeSkuPorOrdenDeVenta(ordenDeVenta, (cantidad: number) => {
                let nameEnterprise = localStorage.getItem("NAME_ENTERPRISE");
                let lheader = "";
                let ldetail = "";
                let lfooter = "";

                let printDocLen = 0;

                printDocLen = 380; //header;
                if (pago.pagoDetalle.length === 1) {
                    printDocLen += pago.pagoDetalle.length * 200; //detail
                } else {
                    printDocLen += pago.pagoDetalle.length * 150; //detail
                }


                lheader = "! 0 50 50 " + printDocLen + " 1\r\n";
                lheader += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
                lheader += "CENTER 550 T 1 2 0 10 " + nameEnterprise + "\r\n";
                lheader += "L 5  50 570 50 1\r\n";


                if (cliente.clientName.length < 21) {
                    lheader += "CENTER 550 T 1 2 0 60  " + cliente.clientName + "\r\n";
                } else {
                    lheader += "CENTER 550 T 0 2 0 60  " + cliente.clientName + "\r\n";
                }
                lheader += "CENTER 550 T 0 2 0 100 " + cliente.address + "\r\n";
                let serie = ordenDeVenta.docSerie;
                let docNum = ordenDeVenta.docNum;

                lheader += "CENTER 550 T 0 3 0 130 Recibo de Pago \r\n";
                lheader += "CENTER 550 T 0 3 0 160 Orden de Venta Serie " + serie + "\r\n";
                lheader += "CENTER 550 T 0 3 0 190 No." + docNum + "\r\n";
                lheader += "CENTER 550 T 0 3 0 220 ***** ORIGINAL ***** \r\n";

                let pRow = 250;

                ldetail = "";
                let i = 0;
                let item = new PagoDetalle();
                let tipoDePago = "";
                let totalDePago = 0;

                for (i = 0; i < pago.pagoDetalle.length; i++) {
                    item = pago.pagoDetalle[i];

                    switch (item.paymentType) {
                        case TipoDePago.Efectivo.toString():
                            tipoDePago = "Efectico";
                            break;
                        case TipoDePago.Cheque.toString():
                            tipoDePago = "Cheque";
                            break;
                    }

                    ldetail = ldetail + "LEFT 5 T 0 2 0 " + pRow + " Forma de Pago: " + tipoDePago + (item.paymentType !== TipoDePago.Efectivo.toString() ? (" No. de Doc: " + item.documentNumber + "\r\n") : "\r\n");
                    ldetail = ldetail + "RIGHT 550 T 0 2 0 " + (pRow) + " Q" + format_number(item.amountPaid, 2) + "\r\n";

                    pRow += 30;
                    totalDePago += item.amountPaid;
                }
                pRow += 30;
                ldetail += "L 5  " + pRow + " 570 " + pRow + " 1\r\n";

                pRow += 30;
                lfooter += "LEFT 5 T 0 2 0 " + pRow + " Cantidad de SKU:" + "\r\n";
                lfooter += "RIGHT 550 T 0 2 0 " + pRow + " " + cantidad + "\r\n";

                pRow += 30;
                ldetail += "L 5  " + pRow + " 570 " + pRow + " 1\r\n";

                pRow += 30;
                lfooter += "LEFT 5 T 0 2 0 " + pRow + " SUBTOTAL: \r\n";
                lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(ordenDeVenta.totalAmount, 2) + "\r\n";


                if ((pago.totalAmount - totalDePago) > 0) {
                    pRow += 30;
                    lfooter += "LEFT 5 T 0 2 0 " + pRow + " AJUSTE: \r\n";
                    lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number((pago.totalAmount - totalDePago), 2) + "\r\n";
                }

                pRow += 30;
                lfooter += "LEFT 5 T 0 2 0 " + pRow + " TOTAL:" + "\r\n";
                lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q" + format_number(pago.totalAmount, 2) + "\r\n";

                pRow += 30;
                lfooter += "CENTER 550 T 0 2 0 " + pRow + " " + getDateTime() + " / RUTA " + gCurrentRoute + " \r\n";

                pRow += 30;
                lfooter += "L 5  120 570 120 1\r\n";
                lfooter += "PRINT\r\n";

                var pCpCl = (lheader + ldetail + lfooter);
                callback(pCpCl);
            });
        } catch (err) {
            callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener formato de impresion de pago de la orden de venta: " + err.message });
        } 
    }

    guardarPago(pago: PagoEncabezado,esPagoFalso: boolean, callback: (pago) => void, callbackError: (resultado: Operacion) => void) {
        try {
            if (esPagoFalso) {
                SONDA_DB_Session.transaction(
                    (tx) => {
                        var sql = this.obtnerFormatoSqlDeInsertarParaPagoEncabezado(pago);
                        tx.executeSql(sql);
                        var i: number;
                        for (i = 0; i < pago.pagoDetalle.length; i++) {
                            sql = this.obtnerFormatoSqlDeInsertarParaPagoDetalle(pago.pagoDetalle[i]);
                            tx.executeSql(sql);
                        }
                        callback(pago);
                    }, (err: SqlError) => {
                        callbackError(<Operacion>{ codigo: -1, mensaje: "2:Error al guardar el pago: " + err.message });
                    });
            } else {
                callback(pago);
            }
        } catch (e) {
            callbackError(<Operacion>{ codigo: -1, mensaje: "1:Error al guardar el pago: " + e.message });
        } 
    }

    obtnerFormatoSqlDeInsertarParaPagoEncabezado(pago: PagoEncabezado) {
        let sql = "";

        sql += "	INSERT INTO PAYMENT_HEADER (";
        sql += "PAYMENT_NUM, ";
        sql += "CLIENT_ID, ";
        sql += "CLIENT_NAME,";
        sql += "TOTAL_AMOUNT, ";
        sql += "POSTED_DATETIME, ";
        sql += "POS_TERMINAL, ";
        sql += "GPS, ";
        sql += "DOC_DATE, ";
        sql += "DEPOSIT_TO_DATE, ";
        sql += "IS_POSTED, ";
        sql += "STATUS,";
        sql += "DOC_SERIE, ";
        sql += "DOC_NUM";
        sql += ")VALUES(";
        sql += "" + pago.paymentNum + ",";
        sql += "'" + pago.clientId + "',";
        sql += "'" + pago.clientName + "',";
        sql += "" + pago.totalAmount + ",";
        sql += "'" + pago.postedDatetime + "',";
        sql += "'" + pago.posTerminal + "',";
        sql += "'" + pago.gps + "',";
        sql += "'" + pago.docDate + "',";
        sql += "'" + pago.depositToDate + "',";
        sql += pago.isPosted + ",";
        sql += "'" + pago.status + "',";
        sql += "'" + pago.docSerie + "',";
        sql += pago.docNum;
        sql += ");";

        return sql;
    }

    obtnerFormatoSqlDeInsertarParaPagoDetalle(pagoDetalle: PagoDetalle){
        let sql = "";

        sql += "INSERT INTO PAYMENT_DETAIL(";
        sql += "ID,";
        sql += " PAYMENT_NUM,";
        sql += " PAYMENT_TYPE,";
        sql += " LINE_NUM,";
        sql += " DOC_DATE,";
        sql += " DOC_NUM,";
        sql += " IMAGE,";
        sql += " BANK_ID,";
        sql += " ACCOUNT_NUM,";
        sql += " INVOICE_NUM,";
        sql += " INVOICE_SERIE,";
        sql += " AMOUNT_PAID,";
        sql += " DOCUMENT_NUMBER,";
        sql += " SOURCE_DOC_TYPE,";
        sql += " SOURCE_DOC_SERIE,";
        sql += " SOURCE_DOC_NUM,";
        sql += " IMAGE_1,";
        sql += " IMAGE_2";
        sql += ") VALUES (";
        sql += "" + pagoDetalle.id + ",";
        sql += " " + pagoDetalle.paymentNum + ",";
        sql += " '" + pagoDetalle.paymentType + "',";
        sql += " " + pagoDetalle.lineNum + ",";
        sql += " '" + pagoDetalle.docDate + "',";
        sql += " " + pagoDetalle.docNum + ",";
        sql += " " + pagoDetalle.image + ",";
        sql += " '" + pagoDetalle.bankId + "',";
        sql += " '" + pagoDetalle.accountNum + "',";
        sql += " " + pagoDetalle.invoiceNum + ",";
        sql += " '" + pagoDetalle.invoiceSerie + "',";
        sql += " " + pagoDetalle.amountPaid + ",";
        sql += " '" + pagoDetalle.documentNumber + "',";
        sql += " '" + pagoDetalle.sourceDocType + "',";
        sql += " '" + pagoDetalle.sourceDocSerie + "',";
        sql += " " + pagoDetalle.sourceDocNum + ",";
        sql += (pagoDetalle.image1 !== undefined ? " '" + pagoDetalle.image1 + "'," : "NULL,");
        sql += (pagoDetalle.image2 !== undefined ? " '" + pagoDetalle.image2 + "'": "NULL");
        sql += ")";

        return sql;
    }

    obtenerSecuenciaDeDocumentos(callback: (sequence: string, serie: string, numeroDeDocumento: number) => void) {
        try {
            GetNexSequence(TIpoDeDocumento.Pago.toString(), (sequence) => {
                ObtenerSecuenciaSiguiente(TIpoDeDocumento.Pago.toString(), (serie, numeroDeDocumento) => {
                    callback(sequence, serie, numeroDeDocumento);
                }, (err) => {
                    notify("3:Error al obtener sequencia de documento de pago: " + err.message);
                });
            }, (err) => {
                notify("2:Error al obtener sequencia de documento de pago: " + err.message);
            });
        } catch (err) {
            notify("1:Error al obtener secuencia de documento: de pago" + err.message);
        }
    }

    obtenerTipoDePagoPorDocumentoDeOrdenDeVenta(ordenDeVenta: OrdenDeVenta,callback: (tipoDePago: string) => void, callbackError: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction(
                (tx) => {
                    var sql = "SELECT";
                    sql += " PAYMENT_TYPE";
                    sql += " FROM PAYMENT_DETAIL";
                    sql += " WHERE SOURCE_DOC_SERIE = '" + ordenDeVenta.docSerie + "'";
                    sql += " AND SOURCE_DOC_NUM = " + ordenDeVenta.docNum;
                    sql += " LIMIT 1";

                    tx.executeSql(sql, [],
                        (tx: SqlTransaction, results: SqlResultSet) => {
                            if (results.rows.length >= 1) {
                                var pago: any = results.rows.item(0);
                                callback(pago.PAYMENT_TYPE);
                            } else {
                                callback("Sin Pago");
                            }
                        });
                },
                (err: SqlError) => {
                    callbackError(<Operacion>{ codigo: -1, mensaje: "Error al actualizar el documento de impreso: " + err.message });
                });
        } catch (e) {
            callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener el tipo de pago: " + e.message });
        } 
    }
}