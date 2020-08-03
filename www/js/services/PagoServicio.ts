class PagoServicio implements IPagoServicio {
    guardarDocumentoDePago(documentoDePago: PagoDeFacturaVencidaEncabezado,
        callback: () => void,
        errorCallback: (error: Operacion) => void): void {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {

                trans.executeSql(this.obtenerFormatoSqlDeInsercionDeEncabezadoDeDocumentoDePago(documentoDePago));

                documentoDePago.overdueInvoicePaymentDetail.forEach((detalleDeDocumentoDePago: PagoDeFacturaVencidaDetalle) => {
                    trans.executeSql(this.obtenerFormatoSqlDeInsercionDeDetalleDeDocumentoDePago(detalleDeDocumentoDePago));
                });

                documentoDePago.overdueInvoicePaymentDetail.forEach((detalleDeDocumentoDePago: PagoDeFacturaVencidaDetalle) => {
                    trans.executeSql(this.obtenerFormatoSqlDeActualizacionDeMontoPendienteDePagoEnFacturaOriginal(detalleDeDocumentoDePago));
                });

                documentoDePago.overdueInvoicePaymentTypeDetail.forEach((tipoDePago: TipoDePagoEnFacturaVencida) => {
                    trans.executeSql(this.obtenerFormatoSqlDeInsercionDeTipoDePago(tipoDePago));
                });

                trans.executeSql(this.obtenerFormatoDeActualizacionDeBalanceDeCliente(documentoDePago));

                trans.executeSql(this.obtenerFormatoDeActualizacionDeSecuenciaDeDocumentos(documentoDePago));
            }, (error: SqlError) => {
                errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as
                    Operacion);
            }, callback);
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    obtenerFormatoSqlDeInsercionDeEncabezadoDeDocumentoDePago(documentoDePago: PagoDeFacturaVencidaEncabezado): string {
        let sql: Array<string> = [];

        sql.push("INSERT INTO OVERDUE_INVOICE_PAYMENT_HEADER(CODE_CUSTOMER, DOC_SERIE, DOC_NUM");
        sql.push(" ,CREATED_DATE, CODE_ROUTE, LOGIN_ID, PAYMENT_AMOUNT, IS_POSTED, COMMENT, PAYMENT_APPLIED_TO)");
        sql.push(" VALUES(");
        sql.push(` '${documentoDePago.codeCustomer}'`);
        sql.push(` ,'${documentoDePago.docSerie}'`);
        sql.push(` ,${documentoDePago.docNum}`);
        sql.push(` ,'${documentoDePago.createdDate}'`);
        sql.push(` ,'${documentoDePago.codeRoute}'`);
        sql.push(` ,'${documentoDePago.loginId}'`);
        sql.push(` ,${documentoDePago.paymentAmount}`);
        sql.push(` ,${SiNo.No}`);
        sql.push(` ,'${documentoDePago.paidComment}'`);
        sql.push(` ,'${documentoDePago.paymentType}'`);
        sql.push(` )`);

        return sql.join("");
    }

    obtenerFormatoSqlDeInsercionDeDetalleDeDocumentoDePago(detalleDeDocumentoDePago: PagoDeFacturaVencidaDetalle): string {
        let sql: Array<string> = [];

        sql.push("INSERT INTO OVERDUE_INVOICE_PAYMENT_DETAIL(INVOICE_ID, DOC_ENTRY, DOC_SERIE, DOC_NUM, PAYED_AMOUNT)");
        sql.push(" VALUES(");
        sql.push(` ${detalleDeDocumentoDePago.invoiceId}`);
        sql.push(` ,${detalleDeDocumentoDePago.docEntry}`);
        sql.push(` ,'${detalleDeDocumentoDePago.docSerie}'`);
        sql.push(` ,${detalleDeDocumentoDePago.docNum}`);
        sql.push(` ,${detalleDeDocumentoDePago.payedAmount}`);
        sql.push(` )`);

        return sql.join("");
    }

    obtenerDocumentosDePagoNoPosteadosEnElServidor(callback:
        (documentosDePagoNoPosteadosEnElServidor: PagoDeFacturaVencidaEncabezado[]) => void): void {
        this.obtenerEncabezadoDeDocumentosNoPosteadosEnElServidor(callback);
    }

    obtenerEncabezadoDeDocumentosNoPosteadosEnElServidor(callback:
        (documentosDePagoNoPosteadosEnElServidor: PagoDeFacturaVencidaEncabezado[]) => void): void {
        let sql: Array<string> = [];
        let documentosDePagoNoPosteados: Array<PagoDeFacturaVencidaEncabezado> = [];

        sql.push(`SELECT CODE_CUSTOMER, DOC_SERIE, DOC_NUM, CREATED_DATE, CODE_ROUTE, LOGIN_ID, PAYMENT_AMOUNT, COMMENT FROM OVERDUE_INVOICE_PAYMENT_HEADER`);
        sql.push(` WHERE IS_POSTED = ${SiNo.No}`);

        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            trans.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let documentoTemporal: any = results.rows.item(i);
                        let documento: PagoDeFacturaVencidaEncabezado = new PagoDeFacturaVencidaEncabezado();

                        documento.codeCustomer = documentoTemporal.CODE_CUSTOMER;
                        documento.docSerie = documentoTemporal.DOC_SERIE;
                        documento.docNum = documentoTemporal.DOC_NUM;
                        documento.createdDate = documentoTemporal.CREATED_DATE;
                        documento.codeRoute = documentoTemporal.CODE_ROUTE;
                        documento.loginId = documentoTemporal.LOGIN_ID;
                        documento.paymentAmount = documentoTemporal.PAYMENT_AMOUNT;
                        documento.paidComment = documentoTemporal.COMMENT;

                        documentosDePagoNoPosteados.push(documento);
                    }

                    this.obtenerDetalleDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteados, 0, (documentosDePago: PagoDeFacturaVencidaEncabezado[], transaccionActual: SqlTransaction) => {
                        this
                            .obtenerDetalleDeTiposDePagoDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePago,
                            0,
                            callback,
                            transaccionActual);
                    }, transResult);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    console.log(`Error al obtener los documentos de pago de facturas vencidas no posteados debido a: '${error.message}'`);
                });
        }, (error: SqlError) => {
            console.log(`Error al obtener los documentos de pago de facturas vencidas no posteados debido a: '${error.message}'`);
        });
    }

    obtenerDetalleDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteadosEnElServidor:
        PagoDeFacturaVencidaEncabezado[],
        posicionActualDeDocumentoProcesado: number,
        callback: (documentosDePagoNoPosteadosEnElServidor: PagoDeFacturaVencidaEncabezado[], transaccionSql: SqlTransaction) => void
        , transaccionActual: SqlTransaction) {

        if (documentosDePagoNoPosteadosEnElServidor.length > posicionActualDeDocumentoProcesado) {

            let sql: Array<string> = [];

            sql.push("SELECT INVOICE_ID, DOC_ENTRY, DOC_SERIE, DOC_NUM, PAYED_AMOUNT FROM OVERDUE_INVOICE_PAYMENT_DETAIL");
            sql.push(` WHERE DOC_SERIE = '${documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docSerie}'`);
            sql.push(` AND DOC_NUM = ${documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docNum}`);

            transaccionActual.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let detalleTemporal: any = results.rows.item(i);
                        let detalle: PagoDeFacturaVencidaDetalle = new PagoDeFacturaVencidaDetalle();

                        detalle.invoiceId = detalleTemporal.INVOICE_ID;
                        detalle.docEntry = detalleTemporal.DOC_ENTRY;
                        detalle.docSerie = detalleTemporal.DOC_SERIE;
                        detalle.docNum = detalleTemporal.DOC_NUM;
                        detalle.payedAmount = detalleTemporal.PAYED_AMOUNT;

                        documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado]
                            .overdueInvoicePaymentDetail.push(detalle);
                    }
                    this.obtenerDetalleDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteadosEnElServidor, posicionActualDeDocumentoProcesado + 1, callback, transResult);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    console.log(`Error al obtener el detalle de los documentos de pago de facturas vencidas no posteados debido a: '${error.message}'`);
                });

        } else {
            callback(documentosDePagoNoPosteadosEnElServidor, transaccionActual);
        }
    }

    marcarDocumentosDePagoComoPosteadosEnElServidor(documentosDePagoPosteadosEnElServidor): void {
        try {
            if (documentosDePagoPosteadosEnElServidor.length > 0) {
                SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                    documentosDePagoPosteadosEnElServidor.forEach((documentoPosteado: any) => {
                        if (documentoPosteado.RESULT === ResultadoDePosteoEnServidor.Exitoso) {

                            trans.executeSql(this.obtenerFormatoDeActualizacionDePosteoDeEncabezadoDeDocumentoDePago(documentoPosteado));

                            trans.executeSql(this.obtenerFormatoDeActualizacionDePosteoDeDetalleDeDocumentoDePago(documentoPosteado));

                            trans.executeSql(this.obtenerFormatoDeActualizacionDePosteoDeDetalleDeTipoDePagoDeDocumentoDePago(documentoPosteado));
                        }
                    });
                }, (error: SqlError) => {
                    console
                        .log(`Error al marcar el pago de factura vencida como posteado en el servidor debido a: '${error
                            .message}'`);
                });
            }
        } catch (e) {
            console
                .log(`Error al actualizar los documentos de pago de facturas vencidas posteados en el servidor debido a: ${e.message}`);
        }
    }

    obtenerFormatoDeActualizacionDePosteoDeEncabezadoDeDocumentoDePago(documentoPosteado: any): string {
        let sql: Array<string> = [];

        sql.push(`UPDATE OVERDUE_INVOICE_PAYMENT_HEADER`);
        sql.push(` SET IS_POSTED = ${SiNo.Si}, ID = ${documentoPosteado.PAYMENT_ID_BO}`);
        sql.push(` WHERE DOC_SERIE = '${documentoPosteado.DOC_SERIE}' AND DOC_NUM = ${documentoPosteado.DOC_NUM}`);

        return sql.join("");
    }

    obtenerFormatoDeActualizacionDePosteoDeDetalleDeDocumentoDePago(documentoPosteado: any): string {
        let sql: Array<string> = [];

        sql.push(`UPDATE OVERDUE_INVOICE_PAYMENT_DETAIL SET PAYMENT_HEADER_ID = ${documentoPosteado.PAYMENT_ID_BO} `);
        sql.push(` WHERE DOC_SERIE = '${documentoPosteado.DOC_SERIE}' AND DOC_NUM = ${documentoPosteado.DOC_NUM}`);

        return sql.join("");
    }

    imprimirPago(pago: PagoDeFacturaVencidaEncabezado, callback: () => void, errorCallback: (error: any) => void): void {
        ObtenerFormatoDeImpresionDePago(pago, (formatoDeImpresion) => {
            ConectarImpresora(gPrintAddress, () => {
                Imprimir(formatoDeImpresion,
                    () => {
                        callback();
                    },
                    errorCallback);
            }, errorCallback);
        }, errorCallback);
    }

    obtenerFormatoDeActualizacionDeSecuenciaDeDocumentos(documentoDePago: PagoDeFacturaVencidaEncabezado): string {
        let sql: Array<string> = [];

        sql.push(`UPDATE DOCUMENT_SEQUENCE SET CURRENT_DOC = ${documentoDePago.docNum}`);
        sql.push(` WHERE SERIE='${documentoDePago.docSerie}' AND DOC_TYPE = '${SecuenciaDeDocumentoTipo.PagoDeFacturaVencida}'`);

        return sql.join("");
    }

    obtenerParametroDePorcentajeDePagoMinimoDeFacturasVencidas(grupoParametro, tipoParametro, callback: (aplicaParametroDePorcentajeMinimoDePago: boolean, valorDePorcentajeMinimoDePago: number) => void, errorCallback: (resultado: Operacion) => void): void {
        try {
            let sql: Array<string> = [];

            sql.push(`SELECT IDENTITY, GROUP_ID, PARAMETER_ID, VALUE`);
            sql.push(` FROM PARAMETERS`);
            sql.push(` WHERE GROUP_ID='${grupoParametro}'`);
            sql.push(` AND PARAMETER_ID='${tipoParametro}'`);

            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                trans.executeSql(sql.join(""),
                    [],
                    (transResult: SqlTransaction, results: SqlResultSet) => {
                        if (this.verificarSiAplicaParametroDePorcentajeMinimoDePagoDeFacturasVencidas(results)) {
                            callback(true, parseFloat((results.rows.item(0) as any).VALUE));
                        } else {
                            callback(false, 0);
                        }
                    },
                    (transResult: SqlTransaction, errorTrans: SqlError) => {
                        errorCallback({
                            codigo: errorTrans.code,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: `Error al obtener el parametro de porcentaje de pago minimo de facturas vencidas debido a: ${errorTrans.message}`
                        } as Operacion);
                    });
            }, (error: SqlError) => {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: `Error al obtener el parametro de porcentaje de pago minimo de facturas vencidas debido a: ${error.message}`
                } as Operacion);
            });

        } catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Error al obtener el parametro de porcentaje de pago minimo de facturas vencidas debido a: ${e
                    .message}`
            } as Operacion);
        }
    }

    verificarSiAplicaParametroDePorcentajeMinimoDePagoDeFacturasVencidas(resultadoDeConsulta: SqlResultSet): boolean {
        return resultadoDeConsulta.rows.length > 0 &&
            (resultadoDeConsulta.rows.item(0) as any).VALUE &&
            parseFloat((resultadoDeConsulta.rows.item(0) as any).VALUE.toString()) >= 0;
    }

    obtenerFormatoSqlDeActualizacionDeMontoPendienteDePagoEnFacturaOriginal(detalleDeDocumentoDePago: PagoDeFacturaVencidaDetalle): string {
        let sql: Array<string> = [];

        sql.push(`UPDATE OVERDUE_INVOICE_BY_CUSTOMER SET PENDING_TO_PAID = PENDING_TO_PAID - ${detalleDeDocumentoDePago.payedAmount}`);
        sql.push(` WHERE INVOICE_ID = ${detalleDeDocumentoDePago.invoiceId} AND DOC_ENTRY = ${detalleDeDocumentoDePago.docEntry}`);

        return sql.join("");
    }

    obtenerSecuenciaDeDocumentoDePago(callback: (secuenciaDeDocumento: any) => void, errorCallback: (resultado: Operacion) => void): void {
        let sql: Array<string> = [];
        sql.push(`SELECT SERIE, (CURRENT_DOC + 1) AS CURRENT_DOC, BRANCH_NAME, BRANCH_ADDRESS `);
        sql.push(` FROM DOCUMENT_SEQUENCE WHERE DOC_TYPE = '${SecuenciaDeDocumentoTipo.PagoDeFacturaVencida}'`);

        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            trans.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    if (results.rows.length > 0) {
                        let secuencia = {
                            serie: (results.rows.item(0) as any).SERIE
                            , numero: (results.rows.item(0) as any).CURRENT_DOC
                            , nombreSucursal: (results.rows.item(0) as any).BRANCH_NAME
                            , direccionSucursal: (results.rows.item(0) as any).BRANCH_ADDRESS
                        };
                        callback(secuencia);
                    } else {
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: `Operador no cuenta con secuencia de documentos de tipo ${SecuenciaDeDocumentoTipo
                                .PagoDeFacturaVencida}, por favor contacte a su administrador.`
                        } as Operacion);
                    }
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    errorCallback({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `Error al obtener la secuencia de documentos de tipo ${SecuenciaDeDocumentoTipo
                            .PagoDeFacturaVencida} debido a: ${error.message}`
                    } as Operacion);
                });
        }, (error: SqlError) => {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Error al obtener la secuencia de documentos de tipo ${SecuenciaDeDocumentoTipo
                    .PagoDeFacturaVencida} debido a: ${error.message}`
            } as Operacion);
        });
    }

    obtenerFormatoSqlDeInsercionDeTipoDePago(tipoDePago: TipoDePagoEnFacturaVencida): string {
        let sql: Array<string> = [];

        sql.push(`INSERT INTO OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL(`);
        sql.push(` [PAYMENT_TYPE],[FRONT_IMAGE]`);
        sql.push(` ,[BACK_IMAGE],[DOCUMENT_NUMBER],[BANK_ACCOUNT],[BANK_NAME]`);
        sql.push(` ,[AMOUNT],[DOC_SERIE],[DOC_NUM])`);
        sql.push(` VALUES(`);
        sql.push(` '${tipoDePago.paymentType}'`);
        sql.push(` ,'${tipoDePago.frontImage}'`);
        sql.push(` ,'${tipoDePago.backImage}'`);
        sql.push(` ,'${tipoDePago.documentNumber}'`);
        sql.push(` ,'${tipoDePago.bankAccount}'`);
        sql.push(` ,'${tipoDePago.bankName}'`);
        sql.push(` ,${tipoDePago.amount}`);
        sql.push(` ,'${tipoDePago.docSerie}'`);
        sql.push(` ,${tipoDePago.docNum}`);
        sql.push(` )`);

        return sql.join("");
    }

    obtenerDetalleDeTiposDePagoDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteadosEnElServidor:
        PagoDeFacturaVencidaEncabezado[],
        posicionActualDeDocumentoProcesado: number,
        callback: (documentosDePagoNoPosteadosEnElServidor: PagoDeFacturaVencidaEncabezado[]) => void
        , transaccionActual: SqlTransaction) {

        if (documentosDePagoNoPosteadosEnElServidor.length > posicionActualDeDocumentoProcesado) {

            let sql: Array<string> = [];

            sql.push(`SELECT`);
            sql.push(` [PAYMENT_TYPE],[FRONT_IMAGE]`);
            sql.push(` ,[BACK_IMAGE],[DOCUMENT_NUMBER],[BANK_ACCOUNT],[BANK_NAME]`);
            sql.push(` ,[AMOUNT],[DOC_SERIE],[DOC_NUM]`);
            sql.push(` FROM OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL`);
            sql.push(` WHERE DOC_SERIE = '${documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docSerie}'`);
            sql.push(` AND DOC_NUM = ${documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado].docNum}`);

            transaccionActual.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let detalleTemporal: any = results.rows.item(i);
                        let detalle: TipoDePagoEnFacturaVencida = new TipoDePagoEnFacturaVencida();

                        detalle.paymentType = detalleTemporal.PAYMENT_TYPE;
                        detalle.frontImage = detalleTemporal.FRONT_IMAGE;
                        detalle.backImage = detalleTemporal.BACK_IMAGE;
                        detalle.documentNumber = detalleTemporal.DOCUMENT_NUMBER;
                        detalle.bankAccount = detalleTemporal.BANK_ACCOUNT;
                        detalle.bankName = detalleTemporal.BANK_NAME;
                        detalle.amount = detalleTemporal.AMOUNT;
                        detalle.docSerie = detalleTemporal.DOC_SERIE;
                        detalle.docNum = detalleTemporal.DOC_NUM;


                        documentosDePagoNoPosteadosEnElServidor[posicionActualDeDocumentoProcesado]
                            .overdueInvoicePaymentTypeDetail.push(detalle);
                    }
                    this.obtenerDetalleDeTiposDePagoDeDocumentosDePagoNoPosteadosEnElServidor(documentosDePagoNoPosteadosEnElServidor, posicionActualDeDocumentoProcesado + 1, callback, transResult);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    console.log(`Error al obtener el detalle de los tipos de pago, para los documentos de pago de facturas vencidas no posteados debido a: '${error.message}'`);
                });

        } else {
            callback(documentosDePagoNoPosteadosEnElServidor);
        }
    }

    obtenerFormatoDeActualizacionDePosteoDeDetalleDeTipoDePagoDeDocumentoDePago(documentoPosteado: any): string {
        let sql: Array<string> = [];

        sql.push(`UPDATE OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL SET PAYMENT_HEADER_ID = ${documentoPosteado.PAYMENT_ID_BO} `);
        sql.push(` WHERE DOC_SERIE = '${documentoPosteado.DOC_SERIE}' AND DOC_NUM = ${documentoPosteado.DOC_NUM}`);

        return sql.join("");
    }

    obtenerEncabezadoDeDocumentosDePagoParaReporte(callback: (documentosDePago: PagoDeFacturaVencidaEncabezado[]) => void, errorCallbak: (resultado: Operacion) => void): void {
        let documentosDePago: PagoDeFacturaVencidaEncabezado[] = [];

        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sql: string[] = [];

            sql.push(`SELECT OIPH.CODE_CUSTOMER`);
            sql.push(` , OIPH.DOC_SERIE`);
            sql.push(` , OIPH.DOC_NUM`);
            sql.push(` , OIPH.PAYMENT_AMOUNT`);
            sql.push(` , OIPH.COMMENT`);
            sql.push(` , (SELECT T.RELATED_CLIENT_NAME FROM TASK AS T WHERE T.RELATED_CLIENT_CODE = OIPH.CODE_CUSTOMER AND T.TASK_TYPE IN('SALE','DELIVERY_SD') LIMIT 1) AS NAME_CUSTOMER`);
            sql.push(` FROM OVERDUE_INVOICE_PAYMENT_HEADER AS OIPH ORDER BY OIPH.DOC_NUM ASC`);

            trans.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let pagoTemp: any = results.rows.item(i);
                        let pago = new PagoDeFacturaVencidaEncabezado();

                        pago.docNum = pagoTemp.DOC_NUM;
                        pago.docSerie = pagoTemp.DOC_SERIE;
                        pago.codeCustomer = pagoTemp.CODE_CUSTOMER;
                        pago.nameCustomer = pagoTemp.NAME_CUSTOMER;
                        pago.paymentAmount = pagoTemp.PAYMENT_AMOUNT;
                        pago.paidComment = pagoTemp.COMMENT;

                        documentosDePago.push(pago);
                    }
                    this
                        .obtenerDetalleDeDocumentosDePagoParaReporte(documentosDePago,
                        0,
                        (documentosDePagoConDetalle: PagoDeFacturaVencidaEncabezado[], transaccion: SqlTransaction) => {
                            this.obtenerDetalleDeTiposDePagoDeDocumentosDePagoParaReporte(documentosDePagoConDetalle, 0, callback, errorCallbak, transaccion);
                        },
                        errorCallbak,
                        transResult);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    errorCallbak({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `Ha ocurrido un error al obtener los documentos de pago, por favor, vuelva a intentar.`
                    } as Operacion);
                });
        }, (error: SqlError) => {
            errorCallbak({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Ha ocurrido un error al obtener los documentos de pago, por favor, vuelva a intentar.`
            } as Operacion);
        });
    }

    obtenerDetalleDeDocumentosDePagoParaReporte(documentosDePago:
        PagoDeFacturaVencidaEncabezado[],
        posicionActualDeDocumentoProcesado: number,
        callback: (documentosDePago: PagoDeFacturaVencidaEncabezado[], transaccionSql: SqlTransaction) => void
        , errorCallback: (resultado: Operacion) => void
        , transaccionActual: SqlTransaction) {

        if (documentosDePago.length > posicionActualDeDocumentoProcesado) {

            let sql: Array<string> = [];

            sql.push("SELECT OIPD.INVOICE_ID");
            sql.push(` , OIPD.DOC_ENTRY`);
            sql.push(` , OIPD.DOC_SERIE`);
            sql.push(` , OIPD.DOC_NUM`);
            sql.push(` , OIPD.PAYED_AMOUNT`);
            sql.push(` , (SELECT datetime(OIC.CREATED_DATE)) as CREATED_DATE`);
            sql.push(` , (SELECT datetime(OIC.DUE_DATE)) as DUE_DATE`);
            sql.push(` , OIC.PENDING_TO_PAID`);
            sql.push(` FROM OVERDUE_INVOICE_PAYMENT_DETAIL OIPD`);
            sql.push(` INNER JOIN OVERDUE_INVOICE_BY_CUSTOMER OIC ON(OIC.INVOICE_ID = OIPD.INVOICE_ID AND OIC.DOC_ENTRY = OIPD.DOC_ENTRY)`);
            sql.push(` WHERE OIPD.DOC_SERIE = '${documentosDePago[posicionActualDeDocumentoProcesado].docSerie}'`);
            sql.push(` AND OIPD.DOC_NUM = ${documentosDePago[posicionActualDeDocumentoProcesado].docNum}`);

            transaccionActual.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let detalleTemporal: any = results.rows.item(i);
                        let detalle: PagoDeFacturaVencidaDetalle = new PagoDeFacturaVencidaDetalle();

                        detalle.invoiceId = detalleTemporal.INVOICE_ID;
                        detalle.docEntry = detalleTemporal.DOC_ENTRY;
                        detalle.docSerie = detalleTemporal.DOC_SERIE;
                        detalle.docNum = detalleTemporal.DOC_NUM;
                        detalle.payedAmount = detalleTemporal.PAYED_AMOUNT;
                        detalle.createdDate = detalleTemporal.CREATED_DATE;
                        detalle.dueDate = detalleTemporal.DUE_DATE;
                        detalle.pendingToPaid = detalleTemporal.PENDING_TO_PAID;

                        documentosDePago[posicionActualDeDocumentoProcesado]
                            .overdueInvoicePaymentDetail.push(detalle);
                    }
                    this.obtenerDetalleDeDocumentosDePagoParaReporte(documentosDePago, posicionActualDeDocumentoProcesado + 1, callback, errorCallback, transResult);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    console.log(`Error al obtener el detalle de los documentos de pago debido a: '${error.message}'`);
                    errorCallback(
                        {
                            codigo: error.code
                            , resultado: ResultadoOperacionTipo.Error
                            , mensaje: `Ha ocurrido un error al obtener el detalle de los documentos de pago, por favor, vuelva a intentar.`
                        } as Operacion
                    );
                });

        } else {
            callback(documentosDePago, transaccionActual);
        }
    }

    obtenerDetalleDeTiposDePagoDeDocumentosDePagoParaReporte(documentosDePago:
        PagoDeFacturaVencidaEncabezado[],
        posicionActualDeDocumentoProcesado: number,
        callback: (documentosDePago: PagoDeFacturaVencidaEncabezado[]) => void
        , errorCallback: (resultado: Operacion) => void
        , transaccionActual: SqlTransaction) {

        if (documentosDePago.length > posicionActualDeDocumentoProcesado) {

            let sql: Array<string> = [];

            sql.push(`SELECT`);
            sql.push(` [PAYMENT_TYPE],[FRONT_IMAGE]`);
            sql.push(` ,[BACK_IMAGE],[DOCUMENT_NUMBER],[BANK_ACCOUNT],[BANK_NAME]`);
            sql.push(` ,[AMOUNT],[DOC_SERIE],[DOC_NUM]`);
            sql.push(` FROM OVERDUE_INVOICE_PAYMENT_TYPE_DETAIL`);
            sql.push(` WHERE DOC_SERIE = '${documentosDePago[posicionActualDeDocumentoProcesado].docSerie}'`);
            sql.push(` AND DOC_NUM = ${documentosDePago[posicionActualDeDocumentoProcesado].docNum}`);

            transaccionActual.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let detalleTemporal: any = results.rows.item(i);
                        let detalle: TipoDePagoEnFacturaVencida = new TipoDePagoEnFacturaVencida();

                        detalle.paymentType = detalleTemporal.PAYMENT_TYPE;
                        detalle.frontImage = detalleTemporal.FRONT_IMAGE;
                        detalle.backImage = detalleTemporal.BACK_IMAGE;
                        detalle.documentNumber = detalleTemporal.DOCUMENT_NUMBER;
                        detalle.bankAccount = detalleTemporal.BANK_ACCOUNT;
                        detalle.bankName = detalleTemporal.BANK_NAME;
                        detalle.amount = detalleTemporal.AMOUNT;
                        detalle.docSerie = detalleTemporal.DOC_SERIE;
                        detalle.docNum = detalleTemporal.DOC_NUM;


                        documentosDePago[posicionActualDeDocumentoProcesado]
                            .overdueInvoicePaymentTypeDetail.push(detalle);
                    }
                    this.obtenerDetalleDeTiposDePagoDeDocumentosDePagoParaReporte(documentosDePago, posicionActualDeDocumentoProcesado + 1, callback, errorCallback, transResult);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    console.log(`Error al obtener el detalle de los documentos de pago debido a: '${error.message}'`);
                    errorCallback(
                        {
                            codigo: error.code
                            , resultado: ResultadoOperacionTipo.Error
                            , mensaje: `Ha ocurrido un error al obtener el detalle de los documentos de pago, por favor, vuelva a intentar.`
                        } as Operacion
                    );
                });

        } else {
            callback(documentosDePago);
        }
    }


    obtenerInformacionDeSecuenciaDeDocumentoDePago(callback: (secuenciaDeDocumento: any) => void, errorCallback: (resultado: Operacion) => void): void {
        let sql: Array<string> = [];
        sql.push(`SELECT SERIE, CURRENT_DOC, BRANCH_NAME, BRANCH_ADDRESS `);
        sql.push(` FROM DOCUMENT_SEQUENCE WHERE DOC_TYPE = '${SecuenciaDeDocumentoTipo.PagoDeFacturaVencida}'`);

        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            trans.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    if (results.rows.length > 0) {
                        let secuencia = {
                            serie: (results.rows.item(0) as any).SERIE
                            , numero: (results.rows.item(0) as any).CURRENT_DOC
                            , nombreSucursal: (results.rows.item(0) as any).BRANCH_NAME
                            , direccionSucursal: (results.rows.item(0) as any).BRANCH_ADDRESS
                        };
                        callback(secuencia);
                    } else {
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: `Operador no cuenta con secuencia de documentos de tipo ${SecuenciaDeDocumentoTipo
                                .PagoDeFacturaVencida}, por favor contacte a su administrador.`
                        } as Operacion);
                    }
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    errorCallback({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `Error al obtener la secuencia de documentos de tipo ${SecuenciaDeDocumentoTipo
                            .PagoDeFacturaVencida} debido a: ${error.message}`
                    } as Operacion);
                });
        }, (error: SqlError) => {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Error al obtener la secuencia de documentos de tipo ${SecuenciaDeDocumentoTipo
                    .PagoDeFacturaVencida} debido a: ${error.message}`
            } as Operacion);
        });
    }

    obtenerFormatoDeActualizacionDeBalanceDeCliente(pago: PagoDeFacturaVencidaEncabezado): string {
        var formato: string[] = [];

        formato.push(`UPDATE CUSTOMER_ACCOUNTING_INFORMATION SET OUTSTANDING_BALANCE = OUTSTANDING_BALANCE + ${pago.paymentAmount} `);
        formato.push(`WHERE CODE_CUSTOMER = '${pago.codeCustomer}'`);
        
        return formato.join("");
    }
}