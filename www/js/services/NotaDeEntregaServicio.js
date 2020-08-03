var NotaDeEntregaServicio = (function () {
    function NotaDeEntregaServicio() {
    }
    NotaDeEntregaServicio.prototype.obtenerDocumentosParaSincronizacion = function (callback, errorCallback) {
        try {
            this.obtenerEncabezadosDeNotaDeEntregaParaSincronizar(callback, errorCallback);
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    NotaDeEntregaServicio.prototype.obtenerEncabezadosDeNotaDeEntregaParaSincronizar = function (callback, errorCallback) {
        var _this_1 = this;
        try {
            var documentos_1 = [];
            SONDA_DB_Session.readTransaction(function (readTrans) {
                var sql = [];
                sql.push("SELECT DELIVERY_NOTE_ID, DOC_SERIE, DOC_NUM, CODE_CUSTOMER");
                sql.push(", DELIVERY_NOTE_ID_HH, TOTAL_AMOUNT, IS_POSTED, CREATED_DATETIME");
                sql.push(", POSTED_DATETIME, TASK_ID, INVOICE_ID, CONSIGNMENT_ID, DEVOLUTION_ID");
                sql.push(", DELIVERY_IMAGE, BILLED_FROM_SONDA, IS_CANCELED, REASON_CANCEL, DISCOUNT");
                sql.push(", DELIVERY_IMAGE_2, DELIVERY_IMAGE_3, DELIVERY_IMAGE_4, DELIVERY_SIGNATURE");
                sql.push(" FROM SONDA_DELIVERY_NOTE_HEADER WHERE IS_POSTED IN(0,1,3)");
                readTrans.executeSql(sql.join(""), [], function (readTransResult, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var encabezadoNotaEntregaTemp = results.rows.item(i);
                        var encabezadoNotaDeEntrega = new NotaDeEntregaEncabezado();
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
                        documentos_1.push(encabezadoNotaDeEntrega);
                    }
                    _this_1.obtenerDetalleDeNotasDeEntrega(documentos_1, callback, errorCallback, 0, readTransResult);
                }, function (readTransResult, error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
                });
            }, function (errorTrans) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: errorTrans.message });
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    NotaDeEntregaServicio.prototype.obtenerDetalleDeNotasDeEntrega = function (documentos, callback, errorCallback, indice, transaccion) {
        var _this_1 = this;
        try {
            if (this.seProcesaRegistro(indice, documentos.length)) {
                var documentoActual_1 = documentos[indice];
                var sql = [];
                sql.push("SELECT DELIVERY_NOTE_DETAIL_ID, DELIVERY_NOTE_ID, CODE_SKU, QTY, PRICE ");
                sql.push(", TOTAL_LINE, IS_BONUS, APPLIED_DISCOUNT, CREATED_DATETIME, POSTED_DATETIME");
                sql.push(", PICKING_DEMAND_HEADER_ID");
                sql.push(" FROM SONDA_DELIVERY_NOTE_DETAIL WHERE DELIVERY_NOTE_ID = " + documentoActual_1.deliveryNoteIdHh);
                transaccion.executeSql(sql.join(""), [], function (transReturn, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var detalleNotaEntregaTemp = results.rows.item(i);
                        var detalleNotaEntrega = new NotaDeEntregaDetalle();
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
                        documentoActual_1.detalleNotaDeEntrega.push(detalleNotaEntrega);
                    }
                    documentos[indice] = documentoActual_1;
                    _this_1.obtenerDetalleDeNotasDeEntrega(documentos, callback, errorCallback, indice + 1, transReturn);
                }, function (transReturn, error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
                });
            }
            else {
                callback(documentos);
            }
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    NotaDeEntregaServicio.prototype.marcarNotasDeEntregaComoPosteadasEnElServidor = function (notasDeEntregaDevueltasPorElServidor) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = "";
                notasDeEntregaDevueltasPorElServidor.map(function (notaDeEntrega) {
                    if (notaDeEntrega.DELIVERY_NOTE_ID) {
                        sql = "UPDATE SONDA_DELIVERY_NOTE_HEADER SET IS_POSTED = " + notaDeEntrega.IS_POSTED + ", DELIVERY_NOTE_ID = " + notaDeEntrega.DELIVERY_NOTE_ID + " WHERE DOC_SERIE = '" + notaDeEntrega.DELIVERY_NOTE_DOC_SERIE + "' AND DOC_NUM = " + notaDeEntrega.DELIVERY_NOTE_DOC_NUM;
                        trans.executeSql(sql);
                        sql = "UPDATE SONDA_DELIVERY_NOTE_DETAIL SET DELIVERY_NOTE_ID = " + notaDeEntrega.DELIVERY_NOTE_ID + " WHERE DELIVERY_NOTE_ID = (SELECT DELIVERY_NOTE_ID_HH FROM SONDA_DELIVERY_NOTE_HEADER WHERE  DOC_SERIE = '" + notaDeEntrega.DELIVERY_NOTE_DOC_SERIE + "' AND DOC_NUM = " + notaDeEntrega.DELIVERY_NOTE_DOC_NUM + ")";
                        trans.executeSql(sql);
                    }
                });
            }, function (error) {
                notify("No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: " + error.message);
            });
        }
        catch (e) {
            notify("No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: " + e.message);
        }
    };
    NotaDeEntregaServicio.prototype.seProcesaRegistro = function (indiceDeDocumento, cantidadDeDocumentos) {
        return indiceDeDocumento < cantidadDeDocumentos;
    };
    NotaDeEntregaServicio.prototype.insertarNotaDeEntrega = function (notaDeEntrega, callback, errorCallback) {
        var _this_1 = this;
        try {
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(_this_1.obtenerFormatoDeInsercionDeEncabezadoDeNotaDeEntrega(notaDeEntrega));
                notaDeEntrega.detalleNotaDeEntrega.map(function (detalle) {
                    trans.executeSql(_this_1.obtenerFormatoDeInsercionDeDetalleDeNotaDeEntrega(detalle));
                });
                if (!esEntregaConsolidada) {
                    trans
                        .executeSql("UPDATE NEXT_PICKING_DEMAND_HEADER SET PROCESS_STATUS = '" + EstadoEntrega
                        .Entregado + "' WHERE PICKING_DEMAND_HEADER_ID = " + notaDeEntrega
                        .relatedPickingDemandHeaderId);
                    trans
                        .executeSql("UPDATE PICKING_DEMAND_BY_TASK SET PICKING_DEMAND_STATUS = CASE WHEN PICKING_DEMAND_STATUS = 'PARTIAL' THEN PICKING_DEMAND_STATUS ELSE '" + EstadoEntrega
                        .Entregado + "' END, IS_POSTED = 0 WHERE PICKING_DEMAND_HEADER_ID = " + notaDeEntrega
                        .relatedPickingDemandHeaderId);
                }
                else {
                    listaDeDemandasDeDespachoEnProcesoDeEntrega.map(function (encabezadoDeDemandaEnProceso) {
                        trans
                            .executeSql("UPDATE NEXT_PICKING_DEMAND_HEADER SET PROCESS_STATUS = '" + EstadoEntrega
                            .Entregado + "' WHERE PICKING_DEMAND_HEADER_ID = " + encabezadoDeDemandaEnProceso.pickingDemandHeaderId);
                        trans
                            .executeSql("UPDATE PICKING_DEMAND_BY_TASK SET PICKING_DEMAND_STATUS = CASE WHEN PICKING_DEMAND_STATUS = 'PARTIAL' THEN PICKING_DEMAND_STATUS ELSE '" + EstadoEntrega
                            .Entregado + "' END, IS_POSTED = 0 WHERE PICKING_DEMAND_HEADER_ID = " + encabezadoDeDemandaEnProceso.pickingDemandHeaderId);
                    });
                }
                if (_this_1.estaNotaDeEntregaGeneroFactura(notaDeEntrega)) {
                    trans.executeSql("UPDATE INVOICE_HEADER SET IS_FROM_DELIVERY_NOTE = 1 WHERE INVOICE_NUM = " + notaDeEntrega.invoiceId);
                }
                _this_1.actualizarEstadoDeManifiestos();
                if (_this_1.estaNotaDeEntregaNoEsPagadaDesdeSonda(notaDeEntrega)) {
                    gTotalInvoiced += notaDeEntrega.totalAmount;
                    localStorage.setItem('POS_TOTAL_INVOICED', gTotalInvoiced.toString());
                }
                gDiscount = 0;
            }, function (error) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
            }, function () {
                callback(notaDeEntrega);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    NotaDeEntregaServicio.prototype.estaNotaDeEntregaNoEsPagadaDesdeSonda = function (notaDeEntrega) {
        return notaDeEntrega.billedFromSonda == SiNo.No;
    };
    NotaDeEntregaServicio.prototype.obtenerFormatoDeInsercionDeEncabezadoDeNotaDeEntrega = function (notaDeEntregaEncabezado) {
        var sqlEncabezado = [];
        sqlEncabezado.push("INSERT INTO SONDA_DELIVERY_NOTE_HEADER(");
        sqlEncabezado.push("DELIVERY_NOTE_ID, DOC_SERIE, DOC_NUM");
        sqlEncabezado.push(", CODE_CUSTOMER, DELIVERY_NOTE_ID_HH, TOTAL_AMOUNT");
        sqlEncabezado.push(", IS_POSTED, CREATED_DATETIME, POSTED_DATETIME, TASK_ID");
        sqlEncabezado.push(", INVOICE_ID, CONSIGNMENT_ID, DEVOLUTION_ID, DELIVERY_IMAGE");
        sqlEncabezado.push(", BILLED_FROM_SONDA, DISCOUNT, DELIVERY_IMAGE_2, DELIVERY_IMAGE_3, DELIVERY_IMAGE_4, DELIVERY_SIGNATURE");
        sqlEncabezado.push(") VALUES(");
        sqlEncabezado.push("" + notaDeEntregaEncabezado.deliveryNoteId);
        sqlEncabezado.push(",'" + notaDeEntregaEncabezado.docSerie + "'");
        sqlEncabezado.push("," + notaDeEntregaEncabezado.docNum);
        sqlEncabezado.push(",'" + notaDeEntregaEncabezado.codeCustomer + "'");
        sqlEncabezado.push("," + notaDeEntregaEncabezado.deliveryNoteIdHh);
        sqlEncabezado.push("," + notaDeEntregaEncabezado.totalAmount);
        sqlEncabezado.push("," + notaDeEntregaEncabezado.isPosted);
        sqlEncabezado.push(",'" + notaDeEntregaEncabezado.createdDateTime + "'");
        sqlEncabezado.push("," + (notaDeEntregaEncabezado.postedDateTime ? "'" + notaDeEntregaEncabezado.postedDateTime + "'" : null));
        sqlEncabezado.push("," + notaDeEntregaEncabezado.taskId);
        sqlEncabezado.push("," + (notaDeEntregaEncabezado.invoiceId ? notaDeEntregaEncabezado.invoiceId : null));
        sqlEncabezado.push("," + (notaDeEntregaEncabezado.consignmentId ? notaDeEntregaEncabezado.consignmentId : null));
        sqlEncabezado.push("," + (notaDeEntregaEncabezado.devolutionId ? notaDeEntregaEncabezado.devolutionId : null));
        sqlEncabezado.push(",'" + notaDeEntregaEncabezado.deliveryImage + "'");
        sqlEncabezado.push("," + notaDeEntregaEncabezado.billedFromSonda);
        sqlEncabezado.push("," + gDiscount);
        sqlEncabezado.push(notaDeEntregaEncabezado.deliveryImage2 && notaDeEntregaEncabezado.deliveryImage2.length > 0 ? ",'" + notaDeEntregaEncabezado.deliveryImage2 + "'" : ',NULL');
        sqlEncabezado.push(notaDeEntregaEncabezado.deliveryImage3 && notaDeEntregaEncabezado.deliveryImage3.length > 0 ? ",'" + notaDeEntregaEncabezado.deliveryImage3 + "'" : ',NULL');
        sqlEncabezado.push(notaDeEntregaEncabezado.deliveryImage4 && notaDeEntregaEncabezado.deliveryImage4.length > 0 ? ",'" + notaDeEntregaEncabezado.deliveryImage4 + "'" : ',NULL');
        sqlEncabezado.push(notaDeEntregaEncabezado.deliverySignature && notaDeEntregaEncabezado.deliverySignature.length > 0 ? ",'" + notaDeEntregaEncabezado.deliverySignature + "'" : ',NULL');
        sqlEncabezado.push(")");
        return sqlEncabezado.join("");
    };
    NotaDeEntregaServicio.prototype.obtenerFormatoDeInsercionDeDetalleDeNotaDeEntrega = function (notaDeEntregaDetalle) {
        var sqlDetalle = [];
        sqlDetalle.push("INSERT INTO SONDA_DELIVERY_NOTE_DETAIL(");
        sqlDetalle.push("DELIVERY_NOTE_DETAIL_ID, DELIVERY_NOTE_ID");
        sqlDetalle.push(", CODE_SKU, QTY, PRICE, TOTAL_LINE, IS_BONUS");
        sqlDetalle.push(", APPLIED_DISCOUNT, CREATED_DATETIME, POSTED_DATETIME");
        sqlDetalle.push(", PICKING_DEMAND_HEADER_ID");
        sqlDetalle.push(") VALUES(");
        sqlDetalle.push("" + (notaDeEntregaDetalle.deliveryNoteDetailId ? notaDeEntregaDetalle.deliveryNoteDetailId : null));
        sqlDetalle.push("," + notaDeEntregaDetalle.deliveryNoteId);
        sqlDetalle.push(",'" + notaDeEntregaDetalle.codeSku + "'");
        sqlDetalle.push("," + notaDeEntregaDetalle.qty);
        sqlDetalle.push("," + notaDeEntregaDetalle.price);
        sqlDetalle.push("," + notaDeEntregaDetalle.totalLine);
        sqlDetalle.push("," + notaDeEntregaDetalle.isBonus);
        sqlDetalle.push("," + (notaDeEntregaDetalle.appliedDiscount ? notaDeEntregaDetalle.appliedDiscount : null));
        sqlDetalle.push("," + (notaDeEntregaDetalle.createdDateTime ? "'" + notaDeEntregaDetalle.createdDateTime + "'" : null));
        sqlDetalle.push("," + (notaDeEntregaDetalle.postedDateTime ? "'" + notaDeEntregaDetalle.postedDateTime + "'" : null));
        sqlDetalle.push("," + (notaDeEntregaDetalle.relatedPickingDemandHeaderId ? notaDeEntregaDetalle.relatedPickingDemandHeaderId : null));
        sqlDetalle.push(")");
        return sqlDetalle.join("");
    };
    NotaDeEntregaServicio.prototype.estaNotaDeEntregaGeneroFactura = function (notaDeEntrega) {
        return notaDeEntrega.invoiceId ? true : false;
    };
    NotaDeEntregaServicio.prototype.obtenerDocumentoDeNotaDeEntregaConDetalleParaGuardar = function (notaDeEntregaEncabezado, callback, errorCallback) {
        var _this_1 = this;
        var entregaServicio = new EntregaServicio();
        try {
            if (esEntregaConsolidada) {
                notaDeEntregaEncabezado.relatedPickingDemandHeaderId = null;
                listaDeDetalleDeDemandaDeDespachoParaProcesoDeEntrega.map(function (detalle) {
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
            }
            else if (esEntregaParcial) {
                entregaServicio.obtenerSkuModificados(entregaServicio, -9999, function (skusModificadosEnEntregaParcial, entregaServicio) {
                    notaDeEntregaEncabezado.relatedPickingDemandHeaderId = demandaDeDespachoEnProcesoDeEntrega
                        .pickingDemandHeaderId;
                    if (_this_1.modificoProductoParaEntregaParcial(skusModificadosEnEntregaParcial)) {
                        demandaDeDespachoEnProcesoDeEntrega.detalleDeDemandaDeDespacho.map(function (detalleDeDemanda) {
                            var detalleNotaEntrega = new NotaDeEntregaDetalle();
                            var skuModificado = skusModificadosEnEntregaParcial.find(function (sku) {
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
                            }
                            else if (!skuModificado) {
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
                    }
                    else {
                        demandaDeDespachoEnProcesoDeEntrega.detalleDeDemandaDeDespacho.map(function (detalleDeDemanda) {
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
                }, function (error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.mensaje });
                });
            }
            else if (esEntregaPorDocumento) {
                notaDeEntregaEncabezado.relatedPickingDemandHeaderId = demandaDeDespachoEnProcesoDeEntrega
                    .pickingDemandHeaderId;
                demandaDeDespachoEnProcesoDeEntrega.detalleDeDemandaDeDespacho.map(function (detalleDeDemanda) {
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
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
        finally {
            entregaServicio = null;
        }
    };
    NotaDeEntregaServicio.prototype.modificoProductoParaEntregaParcial = function (skusModificadosEnEntregaParcial) { return skusModificadosEnEntregaParcial.length > 0; };
    NotaDeEntregaServicio.prototype.actualizarEstadoDeManifiestos = function () {
        var _this_1 = this;
        try {
            this.obtenerIdentificadoresDeDemandaDeDespacho(function (identificadores, transaccionActual) {
                identificadores.map(function (manifiesto) {
                    if (_this_1.manifiestoNoTieneDocumentosPendientes(manifiesto)) {
                        var sql = [];
                        sql.push("UPDATE MANIFEST_HEADER SET STATUS = '" + EstadoDeManifiesto.Completado.toString() + "' ");
                        sql.push(", IS_POSTED = 0 ");
                        sql.push("WHERE MANIFEST_HEADER_ID = " + manifiesto.manifestHeaderId);
                        transaccionActual.executeSql(sql.join(""));
                    }
                });
            }, function (resultado) {
                notify("Error al actualizar el estado del manifiesto debido a: " + resultado.mensaje);
            });
        }
        catch (e) {
            notify(e.message);
        }
    };
    NotaDeEntregaServicio.prototype.obtenerIdentificadoresDeDemandaDeDespacho = function (callback, errorCallback) {
        var manifiestosAActualizar = [];
        SONDA_DB_Session.transaction(function (trans) {
            var sql = [];
            sql.push("SELECT PDH.MANIFEST_HEADER_ID, COUNT(PDH2.PICKING_DEMAND_HEADER_ID) AS PENDING_DOCS_QTY ");
            sql.push("FROM NEXT_PICKING_DEMAND_HEADER PDH ");
            sql.push("LEFT JOIN NEXT_PICKING_DEMAND_HEADER AS PDH2 ");
            sql.push("ON(PDH2.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID AND PDH2.PROCESS_STATUS = 'PENDING') ");
            sql.push("GROUP BY PDH.MANIFEST_HEADER_ID");
            trans.executeSql(sql.join(""), [], function (transResult, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    var manifiestoTemp = results.rows.item(i);
                    var manifiesto = new ManifiestoEncabezado();
                    manifiesto.manifestHeaderId = manifiestoTemp.MANIFEST_HEADER_ID;
                    manifiesto.pendingDocsQty = manifiestoTemp.PENDING_DOCS_QTY;
                    manifiestosAActualizar.push(manifiesto);
                }
                callback(manifiestosAActualizar, transResult);
            }, function (transResult, error) {
                errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
            });
        }, function (error) {
            errorCallback({ codigo: error.code, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
        });
    };
    NotaDeEntregaServicio.prototype.manifiestoNoTieneDocumentosPendientes = function (manifiesto) {
        return manifiesto.pendingDocsQty == SiNo.No;
    };
    NotaDeEntregaServicio.prototype.obtenerNotasDeEntregaAnuladasParaSincronizacion = function (callback, errorCallback) {
        try {
            var documentos_2 = [];
            SONDA_DB_Session.readTransaction(function (readTrans) {
                var sql = [];
                sql.push("SELECT DOC_SERIE, DOC_NUM");
                sql.push(", IS_CANCELED, REASON_CANCEL");
                sql.push(" FROM SONDA_DELIVERY_NOTE_HEADER WHERE IS_POSTED = 3");
                readTrans.executeSql(sql.join(""), [], function (readTransResult, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var encabezadoNotaEntregaTemp = results.rows.item(i);
                        var encabezadoNotaDeEntrega = new NotaDeEntregaEncabezado();
                        encabezadoNotaDeEntrega.docSerie = encabezadoNotaEntregaTemp.DOC_SERIE;
                        encabezadoNotaDeEntrega.docNum = encabezadoNotaEntregaTemp.DOC_NUM;
                        encabezadoNotaDeEntrega.isCanceled = encabezadoNotaEntregaTemp.IS_CANCELED;
                        encabezadoNotaDeEntrega.reasonCancel = encabezadoNotaEntregaTemp.REASON_CANCEL;
                        documentos_2.push(encabezadoNotaDeEntrega);
                    }
                    callback(documentos_2);
                }, function (readTransResult, error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
                });
            }, function (errorTrans) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: errorTrans.message });
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    NotaDeEntregaServicio.prototype.marcarNotasDeEntregaAnuladaComoPosteadasEnElServidor = function (notasDeEntregaDevueltasPorElServidor) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = "";
                notasDeEntregaDevueltasPorElServidor.map(function (notaDeEntrega) {
                    sql = "UPDATE SONDA_DELIVERY_NOTE_HEADER SET IS_POSTED = " + EstadoDePosteoDeNotaDeEntrega.AnuladaPosteadaEnElServidor + " WHERE DOC_NUM = " + notaDeEntrega.docNum;
                    trans.executeSql(sql);
                });
            }, function (error) {
                notify("No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: " + error.message);
            });
        }
        catch (e) {
            notify("No se pudieron actualizar las notas de entrega posteadas en el servidor debido a: " + e.message);
        }
    };
    return NotaDeEntregaServicio;
}());
//# sourceMappingURL=NotaDeEntregaServicio.js.map