class NotaDeEntregaServicio implements INotaDeEntregaServicio {

    obtenerDocumentosParaSincronizacion(callback: (documentosASincronizar: NotaDeEntregaEncabezado[]) => void,
        errorCallback: (error: Operacion) => void) {
        try {
            this.obtenerEncabezadosDeNotaDeEntregaParaSincronizar(callback, errorCallback);
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    obtenerEncabezadosDeNotaDeEntregaParaSincronizar(callback: (encabezadosDeDocumentos: NotaDeEntregaEncabezado[]) => void, errorCallback: (error: Operacion) => void) {
        try {
            let documentos: NotaDeEntregaEncabezado[] = [];

            SONDA_DB_Session.readTransaction((readTrans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push("SELECT DELIVERY_NOTE_ID, DOC_SERIE, DOC_NUM, CODE_CUSTOMER");
                sql.push(", DELIVERY_NOTE_ID_HH, TOTAL_AMOUNT, IS_POSTED, CREATED_DATETIME");
                sql.push(", POSTED_DATETIME, TASK_ID, INVOICE_ID, CONSIGNMENT_ID, DEVOLUTION_ID");
                sql.push(", DELIVERY_IMAGE, BILLED_FROM_SONDA, IS_CANCELED, REASON_CANCEL, DISCOUNT");
                sql.push(", DELIVERY_IMAGE_2, DELIVERY_IMAGE_3, DELIVERY_IMAGE_4, DELIVERY_SIGNATURE");
                sql.push(" FROM SONDA_DELIVERY_NOTE_HEADER WHERE IS_POSTED IN(0,1,3)");

                readTrans.executeSql(sql.join(""), [], (readTransResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let encabezadoNotaEntregaTemp: any = <any>results.rows.item(i);
                        let encabezadoNotaDeEntrega: NotaDeEntregaEncabezado = new NotaDeEntregaEncabezado();

                        encabezadoNotaDeEntrega.deliveryNoteId = encabezadoNotaEntregaTemp.DELIVERY_NOTE_ID;
                        encabezadoNotaDeEntrega.docSerie = encabezadoNotaEntregaTemp.DOC_SERIE;
                        encabezadoNotaDeEntrega.docNum = encabezadoNotaEntregaTemp.DOC_NUM;
                        encabezadoNotaDeEntrega.codeCustomer = encabezadoNotaEntregaTemp.CODE_CUSTOMER;
                        encabezadoNotaDeEntrega.deliveryNoteIdHh = encabezadoNotaEntregaTemp.DELIVERY_NOTE_ID_HH;
                        encabezadoNotaDeEntrega.totalAmount = encabezadoNotaEntregaTemp.TOTAL_AMOUNT;
                        encabezadoNotaDeEntrega.isPosted = encabezadoNotaEntregaTemp.IS_POSTED;
                        encabezadoNotaDeEntrega.createdDateTime = encabezadoNotaEntregaTemp.CREATED_DATETIME;
                        encabezadoNotaDeEntrega.postedDateTime = encabezadoNotaEntregaTemp.POSTED_DATETIME;
                        encabezadoNotaDeEntrega.taskId = encabezadoNotaEntregaTemp.TASK_ID;
                        encabezadoNotaDeEntrega.invoiceId = encabezadoNotaEntregaTemp.INVOICE_ID;
                        encabezadoNotaDeEntrega.consignmentId = encabezadoNotaEntregaTemp.CONSIGNMENT_ID;
                        encabezadoNotaDeEntrega.devolutionId = encabezadoNotaEntregaTemp.DEVOLUTION_ID;
                        encabezadoNotaDeEntrega.deliveryImage = encabezadoNotaEntregaTemp.DELIVERY_IMAGE;
                        encabezadoNotaDeEntrega.billedFromSonda = encabezadoNotaEntregaTemp.BILLED_FROM_SONDA;
                        encabezadoNotaDeEntrega.isCanceled = encabezadoNotaEntregaTemp.IS_CANCELED;
                        encabezadoNotaDeEntrega.reasonCancel = encabezadoNotaEntregaTemp.REASON_CANCEL;
                        encabezadoNotaDeEntrega.discount = encabezadoNotaEntregaTemp.DISCOUNT;
                        encabezadoNotaDeEntrega.deliveryImage2 = encabezadoNotaEntregaTemp.DELIVERY_IMAGE_2;
                        encabezadoNotaDeEntrega.deliveryImage3 = encabezadoNotaEntregaTemp.DELIVERY_IMAGE_3;
                        encabezadoNotaDeEntrega.deliveryImage4 = encabezadoNotaEntregaTemp.DELIVERY_IMAGE_4;
                        encabezadoNotaDeEntrega.deliverySignature = encabezadoNotaEntregaTemp.DELIVERY_SIGNATURE;

                        documentos.push(encabezadoNotaDeEntrega);
                    }

                    this.obtenerDetalleDeNotasDeEntrega(documentos, callback, errorCallback, 0, readTransResult);

                }, (readTransResult: SqlTransaction, error: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                });
            }, (errorTrans: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: errorTrans.message } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    obtenerDetalleDeNotasDeEntrega(documentos: NotaDeEntregaEncabezado[],
        callback: (documentosCompletos: NotaDeEntregaEncabezado[]) => void,
        errorCallback: (error: Operacion) => void,
        indice: number,
        transaccion: SqlTransaction) {
        try {

            if (this.seProcesaRegistro(indice, documentos.length)) {
                let documentoActual = documentos[indice];

                let sql: string[] = [];

                sql.push("SELECT DELIVERY_NOTE_DETAIL_ID, DELIVERY_NOTE_ID, CODE_SKU, QTY, PRICE ");
                sql.push(", TOTAL_LINE, IS_BONUS, APPLIED_DISCOUNT, CREATED_DATETIME, POSTED_DATETIME");
                sql.push(", PICKING_DEMAND_HEADER_ID");
                sql.push(` FROM SONDA_DELIVERY_NOTE_DETAIL WHERE DELIVERY_NOTE_ID = ${documentoActual.deliveryNoteIdHh}`);

                transaccion.executeSql(sql.join(""),
                    [],
                    (transReturn: SqlTransaction, results: SqlResultSet) => {
                        for (let i = 0; i < results.rows.length; i++) {
                            let detalleNotaEntregaTemp = <any>results.rows.item(i);
                            let detalleNotaEntrega: NotaDeEntregaDetalle = new NotaDeEntregaDetalle();

                            detalleNotaEntrega.relatedPickingDemandHeaderId = detalleNotaEntregaTemp.PICKING_DEMAND_HEADER_ID;
                            detalleNotaEntrega.deliveryNoteDetailId = detalleNotaEntregaTemp.DELIVERY_NOTE_DETAIL_ID;
                            detalleNotaEntrega.deliveryNoteId = detalleNotaEntregaTemp.DELIVERY_NOTE_ID;
                            detalleNotaEntrega.codeSku = detalleNotaEntregaTemp.CODE_SKU;
                            detalleNotaEntrega.qty = detalleNotaEntregaTemp.QTY;
                            detalleNotaEntrega.price = detalleNotaEntregaTemp.PRICE;
                            detalleNotaEntrega.totalLine = detalleNotaEntregaTemp.TOTAL_LINE;
                            detalleNotaEntrega.isBonus = detalleNotaEntregaTemp.IS_BONUS;
                            detalleNotaEntrega.appliedDiscount = detalleNotaEntregaTemp.APPLIED_DISCOUNT;
                            detalleNotaEntrega.createdDateTime = detalleNotaEntregaTemp.CREATED_DATETIME;
                            detalleNotaEntrega.postedDateTime = detalleNotaEntregaTemp.POSTED_DATETIME;

                            documentoActual.detalleNotaDeEntrega.push(detalleNotaEntrega);
                        }
                        documentos[indice] = documentoActual;
                        this.obtenerDetalleDeNotasDeEntrega(documentos, callback, errorCallback, indice + 1, transReturn);
                    },
                    (transReturn: SqlTransaction, error: SqlError) => {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                    });

            } else {
                callback(documentos);
            }

        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    marcarNotasDeEntregaComoPosteadasEnElServidor(notasDeEntregaDevueltasPorElServidor: any) {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string = "";

                notasDeEntregaDevueltasPorElServidor.map((notaDeEntrega) => {

                    if (notaDeEntrega.DELIVERY_NOTE_ID) {

                        sql = `UPDATE SONDA_DELIVERY_NOTE_HEADER SET IS_POSTED = ${notaDeEntrega.IS_POSTED}, DELIVERY_NOTE_ID = ${notaDeEntrega.DELIVERY_NOTE_ID} WHERE DOC_SERIE = '${notaDeEntrega.DELIVERY_NOTE_DOC_SERIE}' AND DOC_NUM = ${notaDeEntrega.DELIVERY_NOTE_DOC_NUM}`;
                        trans.executeSql(sql);

                        sql = `UPDATE SONDA_DELIVERY_NOTE_DETAIL SET DELIVERY_NOTE_ID = ${notaDeEntrega.DELIVERY_NOTE_ID} WHERE DELIVERY_NOTE_ID = (SELECT DELIVERY_NOTE_ID_HH FROM SONDA_DELIVERY_NOTE_HEADER WHERE  DOC_SERIE = '${notaDeEntrega.DELIVERY_NOTE_DOC_SERIE}' AND DOC_NUM = ${notaDeEntrega.DELIVERY_NOTE_DOC_NUM})`;
                        trans.executeSql(sql);

                    }

                });
            }, (error: SqlError) => {
                notify(`No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: ${error.message}`);
            });
        } catch (e) {
            notify(`No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: ${e.message}`);
        }
    }

    seProcesaRegistro(indiceDeDocumento, cantidadDeDocumentos) {
        return indiceDeDocumento < cantidadDeDocumentos;
    }

    insertarNotaDeEntrega(notaDeEntrega: NotaDeEntregaEncabezado, callback: (notaDeEntregaInsertada) => void, errorCallback: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {

                trans.executeSql(this.obtenerFormatoDeInsercionDeEncabezadoDeNotaDeEntrega(notaDeEntrega));

                notaDeEntrega.detalleNotaDeEntrega.map((detalle) => {
                    trans.executeSql(this.obtenerFormatoDeInsercionDeDetalleDeNotaDeEntrega(detalle));
                });

                if (!esEntregaConsolidada) {
                    trans
                        .executeSql(`UPDATE NEXT_PICKING_DEMAND_HEADER SET PROCESS_STATUS = '${EstadoEntrega
                            .Entregado}' WHERE PICKING_DEMAND_HEADER_ID = ${notaDeEntrega
                                .relatedPickingDemandHeaderId}`);

                    trans
                        .executeSql(`UPDATE PICKING_DEMAND_BY_TASK SET PICKING_DEMAND_STATUS = CASE WHEN PICKING_DEMAND_STATUS = 'PARTIAL' THEN PICKING_DEMAND_STATUS ELSE '${EstadoEntrega
                            .Entregado}' END, IS_POSTED = 0 WHERE PICKING_DEMAND_HEADER_ID = ${notaDeEntrega
                                .relatedPickingDemandHeaderId}`);

                } else {
                    listaDeDemandasDeDespachoEnProcesoDeEntrega.map((encabezadoDeDemandaEnProceso) => {
                        trans
                            .executeSql(`UPDATE NEXT_PICKING_DEMAND_HEADER SET PROCESS_STATUS = '${EstadoEntrega
                                .Entregado}' WHERE PICKING_DEMAND_HEADER_ID = ${encabezadoDeDemandaEnProceso.pickingDemandHeaderId}`);
                        trans
                            .executeSql(`UPDATE PICKING_DEMAND_BY_TASK SET PICKING_DEMAND_STATUS = CASE WHEN PICKING_DEMAND_STATUS = 'PARTIAL' THEN PICKING_DEMAND_STATUS ELSE '${EstadoEntrega
                                .Entregado}' END, IS_POSTED = 0 WHERE PICKING_DEMAND_HEADER_ID = ${encabezadoDeDemandaEnProceso.pickingDemandHeaderId}`);
                    });
                }

                if (this.estaNotaDeEntregaGeneroFactura(notaDeEntrega)) {
                    trans.executeSql(`UPDATE INVOICE_HEADER SET IS_FROM_DELIVERY_NOTE = 1 WHERE INVOICE_NUM = ${notaDeEntrega.invoiceId}`);
                }

                this.actualizarEstadoDeManifiestos();

                if (this.estaNotaDeEntregaNoEsPagadaDesdeSonda(notaDeEntrega)) {
                    gTotalInvoiced += notaDeEntrega.totalAmount;
                    localStorage.setItem('POS_TOTAL_INVOICED', gTotalInvoiced.toString());
                }
                gDiscount = 0;
            }, (error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
            }, () => {
                callback(notaDeEntrega);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    estaNotaDeEntregaNoEsPagadaDesdeSonda(notaDeEntrega: NotaDeEntregaEncabezado) {
        return notaDeEntrega.billedFromSonda == SiNo.No;
    }

    obtenerFormatoDeInsercionDeEncabezadoDeNotaDeEntrega(notaDeEntregaEncabezado: NotaDeEntregaEncabezado) {
        let sqlEncabezado: string[] = [];
        sqlEncabezado.push(`INSERT INTO SONDA_DELIVERY_NOTE_HEADER(`);
        sqlEncabezado.push(`DELIVERY_NOTE_ID, DOC_SERIE, DOC_NUM`);
        sqlEncabezado.push(`, CODE_CUSTOMER, DELIVERY_NOTE_ID_HH, TOTAL_AMOUNT`);
        sqlEncabezado.push(`, IS_POSTED, CREATED_DATETIME, POSTED_DATETIME, TASK_ID`);
        sqlEncabezado.push(`, INVOICE_ID, CONSIGNMENT_ID, DEVOLUTION_ID, DELIVERY_IMAGE`);
        sqlEncabezado.push(`, BILLED_FROM_SONDA, DISCOUNT, DELIVERY_IMAGE_2, DELIVERY_IMAGE_3, DELIVERY_IMAGE_4, DELIVERY_SIGNATURE`)
        sqlEncabezado.push(`) VALUES(`);
        sqlEncabezado.push(`${notaDeEntregaEncabezado.deliveryNoteId}`);
        sqlEncabezado.push(`,'${notaDeEntregaEncabezado.docSerie}'`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.docNum}`);
        sqlEncabezado.push(`,'${notaDeEntregaEncabezado.codeCustomer}'`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.deliveryNoteIdHh}`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.totalAmount}`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.isPosted}`);
        sqlEncabezado.push(`,'${notaDeEntregaEncabezado.createdDateTime}'`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.postedDateTime ? "'" + notaDeEntregaEncabezado.postedDateTime + "'" : null}`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.taskId}`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.invoiceId ? notaDeEntregaEncabezado.invoiceId : null}`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.consignmentId ? notaDeEntregaEncabezado.consignmentId : null}`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.devolutionId ? notaDeEntregaEncabezado.devolutionId : null}`);
        sqlEncabezado.push(`,'${notaDeEntregaEncabezado.deliveryImage}'`);
        sqlEncabezado.push(`,${notaDeEntregaEncabezado.billedFromSonda}`);
        sqlEncabezado.push(`,${gDiscount}`);
        sqlEncabezado.push(notaDeEntregaEncabezado.deliveryImage2 && notaDeEntregaEncabezado.deliveryImage2.length > 0 ? `,'${notaDeEntregaEncabezado.deliveryImage2}'` : ',NULL');
        sqlEncabezado.push(notaDeEntregaEncabezado.deliveryImage3 && notaDeEntregaEncabezado.deliveryImage3.length > 0 ? `,'${notaDeEntregaEncabezado.deliveryImage3}'` : ',NULL');
        sqlEncabezado.push(notaDeEntregaEncabezado.deliveryImage4 && notaDeEntregaEncabezado.deliveryImage4.length > 0 ? `,'${notaDeEntregaEncabezado.deliveryImage4}'` : ',NULL');
        sqlEncabezado.push(notaDeEntregaEncabezado.deliverySignature && notaDeEntregaEncabezado.deliverySignature.length > 0 ? `,'${notaDeEntregaEncabezado.deliverySignature}'` : ',NULL');
        sqlEncabezado.push(`)`);

        return sqlEncabezado.join("");
    }

    obtenerFormatoDeInsercionDeDetalleDeNotaDeEntrega(notaDeEntregaDetalle: NotaDeEntregaDetalle) {
        let sqlDetalle: string[] = [];

        sqlDetalle.push(`INSERT INTO SONDA_DELIVERY_NOTE_DETAIL(`);
        sqlDetalle.push(`DELIVERY_NOTE_DETAIL_ID, DELIVERY_NOTE_ID`);
        sqlDetalle.push(`, CODE_SKU, QTY, PRICE, TOTAL_LINE, IS_BONUS`);
        sqlDetalle.push(`, APPLIED_DISCOUNT, CREATED_DATETIME, POSTED_DATETIME`);
        sqlDetalle.push(`, PICKING_DEMAND_HEADER_ID`);
        sqlDetalle.push(`) VALUES(`);
        sqlDetalle.push(`${notaDeEntregaDetalle.deliveryNoteDetailId ? notaDeEntregaDetalle.deliveryNoteDetailId : null}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.deliveryNoteId}`);
        sqlDetalle.push(`,'${notaDeEntregaDetalle.codeSku}'`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.qty}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.price}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.totalLine}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.isBonus}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.appliedDiscount ? notaDeEntregaDetalle.appliedDiscount : null}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.createdDateTime ? "'" + notaDeEntregaDetalle.createdDateTime + "'" : null}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.postedDateTime ? "'" + notaDeEntregaDetalle.postedDateTime + "'" : null}`);
        sqlDetalle.push(`,${notaDeEntregaDetalle.relatedPickingDemandHeaderId ? notaDeEntregaDetalle.relatedPickingDemandHeaderId : null}`);
        sqlDetalle.push(`)`);

        return sqlDetalle.join("");
    }

    estaNotaDeEntregaGeneroFactura(notaDeEntrega: NotaDeEntregaEncabezado) {
        return notaDeEntrega.invoiceId ? true : false;
    }

    obtenerDocumentoDeNotaDeEntregaConDetalleParaGuardar(notaDeEntregaEncabezado: NotaDeEntregaEncabezado,
        callback: (notaDeEntregaParaGuardar: NotaDeEntregaEncabezado) => void,
        errorCallback: (resultado: Operacion) => void) {
        let entregaServicio = new EntregaServicio();
        try {

            if (esEntregaConsolidada) {

                notaDeEntregaEncabezado.relatedPickingDemandHeaderId = null;

                listaDeDetalleDeDemandaDeDespachoParaProcesoDeEntrega.map((detalle: DemandaDeDespachoDetalle) => {
                    var detalleNotaEntrega = new NotaDeEntregaDetalle();

                    detalleNotaEntrega.relatedPickingDemandHeaderId = detalle.pickingDemandHeaderId;
                    detalleNotaEntrega.deliveryNoteId = notaDeEntregaEncabezado.deliveryNoteId;
                    detalleNotaEntrega.codeSku = detalle.materialId;
                    detalleNotaEntrega.qty = detalle.qty;
                    detalleNotaEntrega.price = detalle.price;
                    detalleNotaEntrega.appliedDiscount = detalle.discount;
                    detalleNotaEntrega.totalLine = (detalle.isBonus && detalle.isBonus > 0) ? 0 : entregaServicio.obtenerTotalDeLineaDeProducto(detalle);
                    detalleNotaEntrega.isBonus = detalle.isBonus;
                    detalleNotaEntrega.createdDateTime = notaDeEntregaEncabezado.createdDateTime;

                    notaDeEntregaEncabezado.detalleNotaDeEntrega.push(detalleNotaEntrega);
                });
            } else if (esEntregaParcial) {

                entregaServicio.obtenerSkuModificados(entregaServicio, -9999, (skusModificadosEnEntregaParcial, entregaServicio) => {

                    notaDeEntregaEncabezado.relatedPickingDemandHeaderId = demandaDeDespachoEnProcesoDeEntrega
                        .pickingDemandHeaderId;

                    if (this.modificoProductoParaEntregaParcial(skusModificadosEnEntregaParcial)) {
                        demandaDeDespachoEnProcesoDeEntrega.detalleDeDemandaDeDespacho.map((detalleDeDemanda) => {
                            var detalleNotaEntrega = new NotaDeEntregaDetalle();

                            let skuModificado: Sku =
                                (skusModificadosEnEntregaParcial as any).find((sku: Sku) => {
                                    return detalleDeDemanda.materialId === sku.sku;
                                });

                            if (skuModificado && skuModificado.qty > 0) {

                                detalleNotaEntrega.relatedPickingDemandHeaderId = detalleDeDemanda.pickingDemandHeaderId;
                                detalleNotaEntrega.deliveryNoteId = notaDeEntregaEncabezado.deliveryNoteId;
                                detalleNotaEntrega.codeSku = detalleDeDemanda.materialId;
                                detalleNotaEntrega.qty = skuModificado.qty;
                                detalleNotaEntrega.price = detalleDeDemanda.price;
                                detalleNotaEntrega.appliedDiscount = detalleDeDemanda.discount;
                                detalleNotaEntrega.totalLine = (skuModificado.qty * skuModificado.price);
                                detalleNotaEntrega.isBonus = detalleDeDemanda.isBonus;
                                detalleNotaEntrega.createdDateTime = notaDeEntregaEncabezado.createdDateTime;

                                notaDeEntregaEncabezado.detalleNotaDeEntrega.push(detalleNotaEntrega);

                            } else if (!skuModificado) {

                                detalleNotaEntrega.relatedPickingDemandHeaderId = detalleDeDemanda.pickingDemandHeaderId;
                                detalleNotaEntrega.deliveryNoteId = notaDeEntregaEncabezado.deliveryNoteId;
                                detalleNotaEntrega.codeSku = detalleDeDemanda.materialId;
                                detalleNotaEntrega.qty = detalleDeDemanda.qty;
                                detalleNotaEntrega.price = detalleDeDemanda.price;
                                detalleNotaEntrega.appliedDiscount = detalleDeDemanda.discount;
                                detalleNotaEntrega.totalLine = (detalleDeDemanda.isBonus && detalleDeDemanda.isBonus > 0) ? 0 : entregaServicio.obtenerTotalDeLineaDeProducto(detalleDeDemanda);
                                detalleNotaEntrega.isBonus = detalleDeDemanda.isBonus;
                                detalleNotaEntrega.createdDateTime = notaDeEntregaEncabezado.createdDateTime;

                                notaDeEntregaEncabezado.detalleNotaDeEntrega.push(detalleNotaEntrega);
                            }
                        });

                    } else {
                        demandaDeDespachoEnProcesoDeEntrega.detalleDeDemandaDeDespacho.map((detalleDeDemanda) => {
                            var detalleNotaEntrega = new NotaDeEntregaDetalle();

                            detalleNotaEntrega.relatedPickingDemandHeaderId = detalleDeDemanda.pickingDemandHeaderId;
                            detalleNotaEntrega.deliveryNoteId = notaDeEntregaEncabezado.deliveryNoteId;
                            detalleNotaEntrega.codeSku = detalleDeDemanda.materialId;
                            detalleNotaEntrega.qty = detalleDeDemanda.qty;
                            detalleNotaEntrega.price = detalleDeDemanda.price;
                            detalleNotaEntrega.appliedDiscount = detalleDeDemanda.discount;
                            detalleNotaEntrega.totalLine = (detalleDeDemanda.isBonus && detalleDeDemanda.isBonus > 0) ? 0 : entregaServicio.obtenerTotalDeLineaDeProducto(detalleDeDemanda);
                            detalleNotaEntrega.isBonus = detalleDeDemanda.isBonus;
                            detalleNotaEntrega.createdDateTime = notaDeEntregaEncabezado.createdDateTime;

                            notaDeEntregaEncabezado.detalleNotaDeEntrega.push(detalleNotaEntrega);

                        });
                    }
                },
                    (error) => {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.mensaje } as
                            Operacion);
                    });
            } else if (esEntregaPorDocumento) {

                notaDeEntregaEncabezado.relatedPickingDemandHeaderId = demandaDeDespachoEnProcesoDeEntrega
                    .pickingDemandHeaderId;

                demandaDeDespachoEnProcesoDeEntrega.detalleDeDemandaDeDespacho.map((detalleDeDemanda) => {
                    var detalleNotaEntrega = new NotaDeEntregaDetalle();

                    detalleNotaEntrega.relatedPickingDemandHeaderId = detalleDeDemanda.pickingDemandHeaderId;
                    detalleNotaEntrega.deliveryNoteId = notaDeEntregaEncabezado.deliveryNoteId;
                    detalleNotaEntrega.codeSku = detalleDeDemanda.materialId;
                    detalleNotaEntrega.qty = detalleDeDemanda.qty;
                    detalleNotaEntrega.price = detalleDeDemanda.price;
                    detalleNotaEntrega.appliedDiscount = detalleDeDemanda.discount;
                    detalleNotaEntrega.totalLine = (detalleDeDemanda.isBonus && detalleDeDemanda.isBonus > 0) ? 0 : entregaServicio.obtenerTotalDeLineaDeProducto(detalleDeDemanda);
                    detalleNotaEntrega.isBonus = detalleDeDemanda.isBonus;
                    detalleNotaEntrega.createdDateTime = notaDeEntregaEncabezado.createdDateTime;

                    notaDeEntregaEncabezado.detalleNotaDeEntrega.push(detalleNotaEntrega);

                });
            }

            callback(notaDeEntregaEncabezado);

        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        } finally {
            entregaServicio = null;
        }
    }

    modificoProductoParaEntregaParcial(skusModificadosEnEntregaParcial: Sku[]) { return skusModificadosEnEntregaParcial.length > 0 }

    actualizarEstadoDeManifiestos() {
        try {
            this.obtenerIdentificadoresDeDemandaDeDespacho((identificadores: ManifiestoEncabezado[],
                transaccionActual: SqlTransaction) => {
                identificadores.map((manifiesto: ManifiestoEncabezado) => {
                    if (this.manifiestoNoTieneDocumentosPendientes(manifiesto)) {
                        let sql: string[] = [];
                        sql.push(`UPDATE MANIFEST_HEADER SET STATUS = '${EstadoDeManifiesto.Completado.toString()}' `);
                        sql.push(`, IS_POSTED = 0 `)
                        sql.push(`WHERE MANIFEST_HEADER_ID = ${manifiesto.manifestHeaderId}`);

                        transaccionActual.executeSql(sql.join(""));
                    }
                });
            },
                (resultado: Operacion) => {
                    notify(`Error al actualizar el estado del manifiesto debido a: ${resultado.mensaje}`);
                });
        } catch (e) {
            notify(e.message);
        }
    }

    obtenerIdentificadoresDeDemandaDeDespacho(callback: (identificadoresDeManifiestos: ManifiestoEncabezado[], transaccionActual: SqlTransaction) =>
        void,
        errorCallback: (resultado: Operacion) => void) {

        let manifiestosAActualizar: ManifiestoEncabezado[] = [];

        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sql: string[] = [];

            sql.push(`SELECT PDH.MANIFEST_HEADER_ID, COUNT(PDH2.PICKING_DEMAND_HEADER_ID) AS PENDING_DOCS_QTY `);
            sql.push(`FROM NEXT_PICKING_DEMAND_HEADER PDH `);
            sql.push(`LEFT JOIN NEXT_PICKING_DEMAND_HEADER AS PDH2 `);
            sql.push(`ON(PDH2.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID AND PDH2.PROCESS_STATUS = 'PENDING') `);
            sql.push(`GROUP BY PDH.MANIFEST_HEADER_ID`);

            trans.executeSql(sql.join(""),
                [],
                (transResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let manifiestoTemp = <any>results.rows.item(i);
                        let manifiesto: ManifiestoEncabezado = new ManifiestoEncabezado();

                        manifiesto.manifestHeaderId = manifiestoTemp.MANIFEST_HEADER_ID;
                        manifiesto.pendingDocsQty = manifiestoTemp.PENDING_DOCS_QTY;

                        manifiestosAActualizar.push(manifiesto);
                    }
                    callback(manifiestosAActualizar, transResult);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                });

        }, (error: SqlError) => {
            errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
        });
    }

    manifiestoNoTieneDocumentosPendientes(manifiesto: ManifiestoEncabezado) {
        return manifiesto.pendingDocsQty == SiNo.No;
    }

    obtenerNotasDeEntregaAnuladasParaSincronizacion(callback: (notasDeEntrega: NotaDeEntregaEncabezado[]) => void,
        errorCallback: (resultado: Operacion) => void) {
        try {
            let documentos: NotaDeEntregaEncabezado[] = [];

            SONDA_DB_Session.readTransaction((readTrans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push("SELECT DOC_SERIE, DOC_NUM");
                sql.push(", IS_CANCELED, REASON_CANCEL");
                sql.push(" FROM SONDA_DELIVERY_NOTE_HEADER WHERE IS_POSTED = 3");

                readTrans.executeSql(sql.join(""), [], (readTransResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let encabezadoNotaEntregaTemp: any = <any>results.rows.item(i);
                        let encabezadoNotaDeEntrega: NotaDeEntregaEncabezado = new NotaDeEntregaEncabezado();

                        encabezadoNotaDeEntrega.docSerie = encabezadoNotaEntregaTemp.DOC_SERIE;
                        encabezadoNotaDeEntrega.docNum = encabezadoNotaEntregaTemp.DOC_NUM;
                        encabezadoNotaDeEntrega.isCanceled = encabezadoNotaEntregaTemp.IS_CANCELED;
                        encabezadoNotaDeEntrega.reasonCancel = encabezadoNotaEntregaTemp.REASON_CANCEL;

                        documentos.push(encabezadoNotaDeEntrega);
                    }

                    callback(documentos);

                }, (readTransResult: SqlTransaction, error: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                });
            }, (errorTrans: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: errorTrans.message } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    marcarNotasDeEntregaAnuladaComoPosteadasEnElServidor(notasDeEntregaDevueltasPorElServidor: any) {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string = "";

                notasDeEntregaDevueltasPorElServidor.map((notaDeEntrega) => {
                    sql = `UPDATE SONDA_DELIVERY_NOTE_HEADER SET IS_POSTED = ${EstadoDePosteoDeNotaDeEntrega.AnuladaPosteadaEnElServidor} WHERE DOC_NUM = ${notaDeEntrega.docNum}`;
                    trans.executeSql(sql);
                });
            }, (error: SqlError) => {
                notify(`No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: ${error.message}`);
            });
        } catch (e) {
            notify(`No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: ${e.message}`);
        }
    }

}