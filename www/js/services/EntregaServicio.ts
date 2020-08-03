class EntregaServicio implements IEntregaServicio {
    realizarLlamadaTelefonica(tarea: Tarea, callback: () => void, errCallback: (resultado: Operacion) => void): void {
        try {
            if (!tarea.phoneCustomer || tarea.phoneCustomer == "0") {
                throw new Error("El número de teléfono del cliente no es correcto");
            }
            plugins.CallNumber.callNumber(callback,
                (error: any) => {
                    errCallback({ codigo: -1, mensaje: error.message } as Operacion);
                }, tarea.phoneCustomer);

        } catch (e) {
            errCallback({ codigo: -1, mensaje: e.message } as Operacion);
        }
    }

    tomarFotografiaEntrega(callback: (fotografia) => void, errCallback: (resultado: Operacion) => void): void {
        try {
            DispositivoServicio.TomarFoto((foto) => {
                callback(foto);
            }, (resultado) => {
                errCallback(resultado);
            });
        } catch (e) {
            errCallback(<Operacion>{ codigo: -1, mensaje: e.message });
        }
    }

    navegarHaciaCliente(cliente: Cliente, callback: () => void, errCallback: (resultado: Operacion) => void): void {
        try {
            TaskNavigateTo(cliente.gps, cliente.clientName);
            callback();
        }
        catch (e) {
            errCallback(<Operacion>{ codigo: -1, mensaje: e.message });
        }
    }

    obtenerDocumentosParaEntrega(tarea: Tarea, callback: (documentosAEntregar: DemandaDeDespachoEncabezado[]) => void,
        errorCallback: (error: Operacion) => void) {
        try {
            this.obtenerEncabezadosDeDocumentosDeDemandaDeDespacho(tarea, callback, errorCallback);
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    obtenerEncabezadosDeDocumentosDeDemandaDeDespacho(tarea: Tarea, callback: (encabezadosDeDocumentos: DemandaDeDespachoEncabezado[]) => void, errorCallback: (error: Operacion) => void) {
        try {
            let documentos: DemandaDeDespachoEncabezado[] = [];

            SONDA_DB_Session.readTransaction((readTrans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push("SELECT PICKING_DEMAND_HEADER_ID, DOC_NUM, CLIENT_CODE, CODE_ROUTE");
                sql.push(" ,CODE_SELLER, TOTAL_AMOUNT, SERIAL_NUMBER, DOC_NUM_SEQUENCE, EXTERNAL_SOURCE_ID");
                sql.push(" ,IS_FROM_ERP, IS_FROM_SONDA, LAST_UPDATE, LAST_UPDATE_BY, IS_COMPLETED");
                sql.push(" ,WAVE_PICKING_ID , CODE_WAREHOUSE, IS_AUTHORIZED, ATTEMPTED_WITH_ERROR");
                sql.push(" ,IS_POSTED_ERP, POSTED_ERP, POSTED_RESPONSE, ERP_REFERENCE, CLIENT_NAME");
                sql.push(" ,CREATED_DATE, ERP_REFERENCE_DOC_NUM, DOC_ENTRY, IS_CONSOLIDATED, PRIORITY");
                sql.push(" ,HAS_MASTERPACK, POSTED_STATUS, OWNER, CLIENT_OWNER, MASTER_ID_SELLER");
                sql.push(" ,SELLER_OWNER, SOURCE_TYPE, INNER_SALE_STATUS, INNER_SALE_RESPONSE");
                sql.push(" ,DEMAND_TYPE, TRANSFER_REQUEST_ID, ADDRESS_CUSTOMER, STATE_CODE, PROCESS_STATUS, DISCOUNT");
                sql.push(` FROM NEXT_PICKING_DEMAND_HEADER WHERE CLIENT_CODE = '${tarea.relatedClientCode}' AND ADDRESS_CUSTOMER = ${tarea.taskAddress ? `'${tarea.taskAddress}'` : null} `);


                readTrans.executeSql(sql.join(""), [], (readTransResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let encabezadoDeDemandaTemp: any = <any>results.rows.item(i);
                        let encabezadoDeDemanda: DemandaDeDespachoEncabezado = new DemandaDeDespachoEncabezado();

                        encabezadoDeDemanda.pickingDemandHeaderId = encabezadoDeDemandaTemp.PICKING_DEMAND_HEADER_ID;
                        encabezadoDeDemanda.docNum = encabezadoDeDemandaTemp.DOC_NUM;
                        encabezadoDeDemanda.clientCode = encabezadoDeDemandaTemp.CLIENT_CODE;
                        encabezadoDeDemanda.codeRoute = encabezadoDeDemandaTemp.CODE_ROUTE;
                        encabezadoDeDemanda.codeSeller = encabezadoDeDemandaTemp.CODE_SELLER;
                        encabezadoDeDemanda.totalAmount = encabezadoDeDemandaTemp.TOTAL_AMOUNT;
                        encabezadoDeDemanda.serialNumber = encabezadoDeDemandaTemp.SERIAL_NUMBER;
                        encabezadoDeDemanda.docNumSequence = encabezadoDeDemandaTemp.DOC_NUM_SEQUENCE;
                        encabezadoDeDemanda.externalSourceId = encabezadoDeDemandaTemp.EXTERNAL_SOURCE_ID;
                        encabezadoDeDemanda.isFromErp = encabezadoDeDemandaTemp.IS_FROM_ERP;
                        encabezadoDeDemanda.isFromSonda = encabezadoDeDemandaTemp.IS_FROM_SONDA;
                        encabezadoDeDemanda.lastUpdate = encabezadoDeDemandaTemp.LAST_UPDATE;
                        encabezadoDeDemanda.lastUpdateBy = encabezadoDeDemandaTemp.LAST_UPDATE_BY;
                        encabezadoDeDemanda.isCompleted = encabezadoDeDemandaTemp.IS_COMPLETED;
                        encabezadoDeDemanda.wavePickingId = encabezadoDeDemandaTemp.WAVE_PICKING_ID;
                        encabezadoDeDemanda.codeWarehouse = encabezadoDeDemandaTemp.CODE_WAREHOUSE;
                        encabezadoDeDemanda.isAuthorized = encabezadoDeDemandaTemp.IS_AUTHORIZED;
                        encabezadoDeDemanda.attemptedWithError = encabezadoDeDemandaTemp.ATTEMPTED_WITH_ERROR;
                        encabezadoDeDemanda.isPostedErp = encabezadoDeDemandaTemp.IS_POSTED_ERP;
                        encabezadoDeDemanda.postedErp = encabezadoDeDemandaTemp.POSTED_ERP;
                        encabezadoDeDemanda.postedResponse = encabezadoDeDemandaTemp.POSTED_RESPONSE;
                        encabezadoDeDemanda.erpReference = encabezadoDeDemandaTemp.ERP_REFERENCE;
                        encabezadoDeDemanda.clientName = encabezadoDeDemandaTemp.CLIENT_NAME;
                        encabezadoDeDemanda.createdDate = encabezadoDeDemandaTemp.CREATED_DATE;
                        encabezadoDeDemanda.erpReferenceDocNum = encabezadoDeDemandaTemp.ERP_REFERENCE_DOC_NUM;
                        encabezadoDeDemanda.docEntry = encabezadoDeDemandaTemp.DOC_ENTRY;
                        encabezadoDeDemanda.isConsolidated = encabezadoDeDemandaTemp.IS_CONSOLIDATED;
                        encabezadoDeDemanda.priority = encabezadoDeDemandaTemp.PRIORITY;
                        encabezadoDeDemanda.hasMasterPack = encabezadoDeDemandaTemp.HAS_MASTERPACK;
                        encabezadoDeDemanda.postedStatus = encabezadoDeDemandaTemp.POSTED_STATUS;
                        encabezadoDeDemanda.owner = encabezadoDeDemandaTemp.OWNER;
                        encabezadoDeDemanda.clientOwner = encabezadoDeDemandaTemp.CLIENT_OWNER;
                        encabezadoDeDemanda.masterIdSeller = encabezadoDeDemandaTemp.MASTER_ID_SELLER;
                        encabezadoDeDemanda.sellerOwner = encabezadoDeDemandaTemp.SELLER_OWNER;
                        encabezadoDeDemanda.sourceType = encabezadoDeDemandaTemp.SOURCE_TYPE;
                        encabezadoDeDemanda.innerSaleStatus = encabezadoDeDemandaTemp.INNER_SALE_STATUS;
                        encabezadoDeDemanda.innerSaleResponse = encabezadoDeDemandaTemp.INNER_SALE_RESPONSE;
                        encabezadoDeDemanda.demandType = encabezadoDeDemandaTemp.DEMAND_TYPE;
                        encabezadoDeDemanda.transferRequestId = encabezadoDeDemandaTemp.TRANSFER_REQUEST_ID;
                        encabezadoDeDemanda.addressCustomer = encabezadoDeDemandaTemp.ADDRESS_CUSTOMER;
                        encabezadoDeDemanda.stateCode = encabezadoDeDemandaTemp.STATE_CODE;
                        encabezadoDeDemanda.processStatus = encabezadoDeDemandaTemp.PROCESS_STATUS;
                        encabezadoDeDemanda.discount = encabezadoDeDemandaTemp.DISCOUNT;
                        encabezadoDeDemanda.detalleDeDemandaDeDespacho = [];

                        documentos.push(encabezadoDeDemanda);
                    }

                    this.obtenerDetalleDeDocumentosDeDemandaDeDespacho(documentos, callback, errorCallback, 0, readTransResult);

                }, (_readTransResult: SqlTransaction, error: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                });
            }, (errorTrans: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: errorTrans.message } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    obtenerDetalleDeDocumentosDeDemandaDeDespacho(documentos: DemandaDeDespachoEncabezado[],
        callback: (documentosCompletos: DemandaDeDespachoEncabezado[]) => void,
        errorCallback: (error: Operacion) => void,
        indice: number,
        transaccion: SqlTransaction) {
        try {

            if (this.esUltimoRegistro(indice, documentos.length)) {
                let documentoActual = documentos[indice];

                let sql: string[] = [];

                sql.push("SELECT PICKING_DEMAND_DETAIL_ID,PICKING_DEMAND_HEADER_ID,MATERIAL_ID, MATERIAL_DESCRIPTION, REQUERIES_SEERIE");
                sql.push(" ,QTY,LINE_NUM,ERP_OBJECT_TYPE,PRICE,WAS_IMPLODED,QTY_IMPLODED");
                sql.push(" ,MASTER_ID_MATERIAL,MATERIAL_OWNER,ATTEMPTED_WITH_ERROR,IS_POSTED_ERP");
                sql.push(" ,POSTED_ERP,ERP_REFERENCE,POSTED_STATUS,POSTED_RESPONSE");
                sql.push(" ,INNER_SALE_STATUS,INNER_SALE_RESPONSE,TONE,CALIBER, IS_BONUS, DISCOUNT, CODE_PACK_UNIT_STOCK, SALES_PACK_UNIT, CONVERSION_FACTOR ");
                sql.push(` FROM NEXT_PICKING_DEMAND_DETAIL WHERE PICKING_DEMAND_HEADER_ID = ${documentoActual.pickingDemandHeaderId}`);

                transaccion.executeSql(sql.join(""),
                    [],
                    (transReturn: SqlTransaction, results: SqlResultSet) => {
                        for (let i = 0; i < results.rows.length; i++) {
                            let detalleDemandaTemp = <any>results.rows.item(i);
                            let detalleDemanda: DemandaDeDespachoDetalle = new DemandaDeDespachoDetalle();

                            detalleDemanda.pickingDemandDetailId = detalleDemandaTemp.PICKING_DEMAND_DETAIL_ID;
                            detalleDemanda.pickingDemandHeaderId = detalleDemandaTemp.PICKING_DEMAND_HEADER_ID;
                            detalleDemanda.materialId = detalleDemandaTemp.MATERIAL_ID;
                            detalleDemanda.materialDescription = detalleDemandaTemp.MATERIAL_DESCRIPTION;
                            detalleDemanda.requeriesSerie = detalleDemandaTemp.REQUERIES_SEERIE;
                            detalleDemanda.qty = detalleDemandaTemp.QTY;
                            detalleDemanda.lineNum = detalleDemandaTemp.LINE_NUM;
                            detalleDemanda.erpObjectType = detalleDemandaTemp.ERP_OBJECT_TYPE;
                            detalleDemanda.price = detalleDemandaTemp.PRICE;
                            detalleDemanda.wasImploded = detalleDemandaTemp.WAS_IMPLODED;
                            detalleDemanda.qtyImploded = detalleDemandaTemp.QTY_IMPLODED;
                            detalleDemanda.masterIdMaterial = detalleDemandaTemp.MASTER_ID_MATERIAL;
                            detalleDemanda.materialOwner = detalleDemandaTemp.MATERIAL_OWNER;
                            detalleDemanda.attemptedWithError = detalleDemandaTemp.ATTEMPTED_WITH_ERROR;
                            detalleDemanda.isPostedErp = detalleDemandaTemp.IS_POSTED_ERP;
                            detalleDemanda.postedErp = detalleDemandaTemp.POSTED_ERP;
                            detalleDemanda.erpReference = detalleDemandaTemp.ERP_REFERENCE;
                            detalleDemanda.postedStatus = detalleDemandaTemp.POSTED_STATUS;
                            detalleDemanda.postedResponse = detalleDemandaTemp.POSTED_RESPONSE;
                            detalleDemanda.innerSaleStatus = detalleDemandaTemp.INNER_SALE_STATUS;
                            detalleDemanda.innerSaleResponse = detalleDemandaTemp.INNER_SALE_RESPONSE;
                            detalleDemanda.tone = detalleDemandaTemp.TONE;
                            detalleDemanda.caliber = detalleDemandaTemp.CALIBER;
                            detalleDemanda.isBonus = detalleDemandaTemp.IS_BONUS;
                            detalleDemanda.discount = detalleDemandaTemp.DISCOUNT;
                            detalleDemanda.codePackUnitStock = detalleDemandaTemp.CODE_PACK_UNIT_STOCK;
                            detalleDemanda.salesPackUnit = detalleDemandaTemp.SALES_PACK_UNIT;
                            detalleDemanda.conversionFactor = detalleDemandaTemp.CONVERSION_FACTOR;

                            documentoActual.detalleDeDemandaDeDespacho.push(detalleDemanda);
                        }
                        documentos[indice] = documentoActual;
                        this.obtenerDetalleDeDocumentosDeDemandaDeDespacho(documentos, callback, errorCallback, indice + 1, transReturn);
                    },
                    (_transReturn: SqlTransaction, error: SqlError) => {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
                    });
            } else {
                callback(documentos);
            }

        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    esUltimoRegistro(indiceDeDocumento, cantidadDeDocumentos) {
        return indiceDeDocumento < cantidadDeDocumentos;
    }

    agregarDetalleCompletoDeDemandaDeDespachoAFacturacion(detalleDeDemandaDeDespacho: DemandaDeDespachoDetalle[], callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {
            this.borrarDetalleDeFacturaTemporal(() => {
                detalleDeDemandaDeDespacho.map((detalle, i) => {
                    this.agregarProductoDeDemandaDeDespachoAFacturacion(detalle, i, (error) => {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.mensaje } as Operacion);
                    });
                });
                callback();
            }, (resultado: Operacion) => {
                errorCallback(resultado);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    agregarProductoDeDemandaDeDespachoAFacturacion(producto: DemandaDeDespachoDetalle, indice: number, errorCallback: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sql: string[] = [];

            sql.push(`INSERT INTO INVOICE_DETAIL(INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT, TOTAL_LINE`);
            sql.push(`, REQUERIES_SERIE, SERIE, SERIE_2, LINE_SEQ, IS_ACTIVE, COMBO_REFERENCE`);
            sql.push(`, PARENT_SEQ, EXPOSURE, PHONE, TAX_CODE, ON_HAND, IS_BONUS, PACK_UNIT, CODE_PACK_UNIT_STOCK, CONVERSION_FACTOR) VALUES(`);
            sql.push(`-9999, '${producto.materialId}', '${producto.materialDescription}', ${producto.qty}`);
            sql.push(`, ${producto.isBonus && producto.isBonus > 0 ? 0 : producto.price}, ${producto.discount && producto.discount > 0 ? producto.discount : 0}, ${producto.isBonus && producto.isBonus > 0 ? 0 : this.obtenerTotalDeLineaDeProducto(producto)}`);
            sql.push(`, ${0}, '0','0',${indice == 0 ? 0 : indice + 1},3, '${producto.materialId}', ${indice == 0 ? 0 : indice}`);
            sql.push(`,1,'',NULL, ${producto.qty}, ${producto.isBonus && producto.isBonus > 0 ? producto.isBonus : 0},`);
            sql.push(`'${producto.codePackUnitStock}', `);
            sql.push(`'${producto.salesPackUnit}', `);
            sql.push(`${producto.conversionFactor}`);
            sql.push(`)`);

            trans.executeSql(sql.join(""));

        }, (error: SqlError) => {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as Operacion);
        });
    }

    obtenerTotalDeLineaDeProducto(producto: DemandaDeDespachoDetalle) {
        return (producto.discount && producto.discount > 0)
            ? ((100 - producto.discount) / 100) * (producto.qty * producto.price) : (producto.qty * producto.price);
    }

    cambiarEstadoDeDocumentoEntrega(demandHeaderId: number, estado: string, callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {

            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string[] = [];

                sql.push(` UPDATE NEXT_PICKING_DEMAND_HEADER SET `);
                sql.push(` PROCESS_STATUS = '${estado}'`);
                sql.push(` WHERE PICKING_DEMAND_HEADER_ID = ${demandHeaderId}`);

                trans.executeSql(sql.join(""));

                sql = [];

                sql.push(" UPDATE PICKING_DEMAND_BY_TASK SET ");
                sql.push(` PICKING_DEMAND_STATUS = CASE `);
                sql.push(` WHEN PICKING_DEMAND_STATUS = 'PARTIAL' THEN PICKING_DEMAND_STATUS `);
                sql.push(` ELSE '${estado}' `);
                sql.push(` END `);
                sql.push(` ,IS_POSTED = 0 `);
                sql.push(` WHERE PICKING_DEMAND_HEADER_ID = ${demandHeaderId}`);

                trans.executeSql(sql.join(""));

                callback();
            }, (error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al cambiar el estado del documento de entrega ${demandHeaderId} debido a: ${error.message}` } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al cambiar el estado del documento de entrega debido a: " + e.message } as Operacion);
        }
    }

    agregarSkuAInvnetarioCancelado(listaDeEntregaCancelado: DemandaDeDespachoDetalle[], callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {
            this.obtenerSkuDeInventario((listaSku: Sku[]) => {
                this.actualizarOInsertarInventarioCancelado(listaDeEntregaCancelado, listaSku, 0, callback, errorCallback);
            }, (resultado: Operacion) => {
                errorCallback(resultado);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al agregar sku a inventario: ${e.message}` } as Operacion);
        }
    }

    actualizarOInsertarInventarioCancelado(listaDeEntregaCancelado: DemandaDeDespachoDetalle[], listaSku: Sku[], indice: number, callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {
            if (listaDeEntregaCancelado.length > indice) {
                SONDA_DB_Session.transaction((trans: SqlTransaction) => {

                    let demandaDeDespachoDetalle: DemandaDeDespachoDetalle = listaDeEntregaCancelado[indice];

                    let sku: Sku = (listaSku as any).find((sku: Sku) => {
                        return sku.sku === demandaDeDespachoDetalle.materialId;
                    });

                    let sql: string[] = [];

                    if (sku) {
                        sql.push(` UPDATE SKUS SET `);
                        sql.push(` ON_HAND =  ON_HAND + ${demandaDeDespachoDetalle.qty}`);
                        sql.push(` WHERE SKU = '${sku.sku}'`);
                    } else {
                        sql.push(` INSERT INTO SKUS(`);
                        sql.push(` SKU `);
                        sql.push(` ,SKU_NAME `);
                        sql.push(` ,SKU_PRICE `);
                        sql.push(` ,SKU_LINK `);
                        sql.push(` ,REQUERIES_SERIE `);
                        sql.push(` ,IS_KIT `);
                        sql.push(` ,ON_HAND `);
                        sql.push(` ,ROUTE_ID `);
                        sql.push(` ,IS_PARENT `);
                        sql.push(` ,PARENT_SKU `);
                        sql.push(` ,EXPOSURE `);
                        sql.push(` ,PRIORITY `);
                        sql.push(` ,IS_PARENT `);
                        sql.push(` ,QTY_RELATED `);
                        sql.push(` ,LOADED_LAST_UPDATED `);
                        sql.push(` ,TAX_CODE `);
                        sql.push(` )VALUES(`);
                        sql.push(` '${demandaDeDespachoDetalle.materialId}'`);
                        sql.push(` , '${demandaDeDespachoDetalle.materialDescription}'`);
                        sql.push(` , 0`);
                        sql.push(` , '...'`);
                        sql.push(` , 0`);
                        sql.push(` , 0`);
                        sql.push(` , ${demandaDeDespachoDetalle.qty}`);
                        sql.push(` , '${gDefaultWhs}'`);
                        sql.push(` , 0`);
                        sql.push(` , '${demandaDeDespachoDetalle.materialId}'`);
                        sql.push(` , 1`);
                        sql.push(` , 0`);
                        sql.push(` , 0`);
                        sql.push(` , 0`);
                        sql.push(` , '${new Date().toLocaleString()}'`);
                        sql.push(` , 'E'`);
                        sql.push(` )`);
                    }

                    trans.executeSql(sql.join(""));
                    sql = null;
                    this.actualizarOInsertarInventarioCancelado(listaDeEntregaCancelado,
                        listaSku,
                        indice + 1,
                        callback,
                        errorCallback);
                },
                    (error: SqlError) => {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al actualizar o insertar inventario: ${error.message}` } as Operacion);
                    });
            } else {
                callback();
            }
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al actualizar o insertar inventario: ${e.message}` } as Operacion);
        }
    }

    obtenerSkuDeInventario(callback: (listaSku: Sku[]) => void, errorCallback: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.readTransaction((readTrans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push(" SELECT SKU, SKU_NAME ");
                sql.push(` FROM SKUS`);

                readTrans.executeSql(sql.join(""), [], (readTransResult: SqlTransaction, results: SqlResultSet) => {
                    let listaSku: Sku[] = [];
                    for (let i = 0; i < results.rows.length; i++) {
                        let skuSql: any = <any>results.rows.item(i);
                        let sku: Sku = new Sku();

                        sku.sku = skuSql.SKU;
                        sku.skuName = skuSql.SKU_NAME;
                        listaSku.push(sku);
                        sku = null;
                    }
                    callback(listaSku);
                    listaSku = null;
                }, (readTransResult: SqlTransaction, error: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener el inventario: ${error.message}` } as Operacion);
                });
                sql = null;
            }, (errorTrans: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener el inventario: ${errorTrans.message}` } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener el inventario: ${e.message}` } as Operacion);
        }
    }

    obtenerEntregasCanceladasParaSincronizacion(callback: (documentosASincronizar: EntregaCancelada[]) => void,
        errorCallback: (error: Operacion) => void) {
        try {
            this.obtenerEntregasCanceladasParaSincronizar(callback, errorCallback);
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    obtenerEntregasCanceladasParaSincronizar(callback: (encabezadosDeDocumentos: EntregaCancelada[]) => void, errorCallback: (error: Operacion) => void) {
        try {
            let documentos: EntregaCancelada[] = [];

            SONDA_DB_Session.readTransaction((readTrans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push("SELECT");
                sql.push(" DELIVERY_CANCELED_ID");
                sql.push(" ,PICKING_DEMAND_HEADER_ID");
                sql.push(" ,DOC_NUM_DELIVERY");
                sql.push(" ,DOC_ENTRY");
                sql.push(" ,DOC_NUM");
                sql.push(" ,DOC_SERIE");
                sql.push(" ,REASON_CANCEL");
                sql.push(" FROM DELIVERY_CANCELED WHERE IS_POSTED IN(0,1)");

                readTrans.executeSql(sql.join(""), [], (readTransResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let entregaCanceladaTemp: any = <any>results.rows.item(i);
                        let entregaCancelada: EntregaCancelada = new EntregaCancelada();

                        entregaCancelada.deliveryCanceledId = entregaCanceladaTemp.DELIVERY_CANCELED_ID;
                        entregaCancelada.pickingDemandHeaderId = entregaCanceladaTemp.PICKING_DEMAND_HEADER_ID;
                        entregaCancelada.docNumDelivery = entregaCanceladaTemp.DOC_NUM_DELIVERY;
                        entregaCancelada.docEntry = entregaCanceladaTemp.DOC_ENTRY;
                        entregaCancelada.docNum = entregaCanceladaTemp.DOC_NUM;
                        entregaCancelada.docSerie = entregaCanceladaTemp.DOC_SERIE;
                        entregaCancelada.reasonCancel = entregaCanceladaTemp.REASON_CANCEL;
                        documentos.push(entregaCancelada);
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

    marcarEntregaCanceladaComoPosteadasEnElServidor(entregasCanceladasDevueltasPorElServidor: any) {
        try {
            this.actualizarEntregasCanceladasComoPosteadas(entregasCanceladasDevueltasPorElServidor, 0, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (e) {
            notify(e.message);
        }
    }

    actualizarEntregasCanceladasComoPosteadas(entregasCanceladasDevueltasPorElServidor: any, indice: number, errorCallback: (resultado: Operacion) => void, callback?: () => void) {
        try {
            if (entregasCanceladasDevueltasPorElServidor.length > indice) {
                SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                    let entregaCancelada = entregasCanceladasDevueltasPorElServidor[indice];
                    let sql: string = "";
                    sql = `UPDATE DELIVERY_CANCELED SET IS_POSTED = ${entregaCancelada.IS_POSTED}, POSTED_DATETIME = '${entregaCancelada.POSTED_DATETIME}' WHERE DOC_SERIE = '${entregaCancelada.DOC_SERIE}' AND DOC_NUM = ${entregaCancelada.DOC_NUM} `;
                    trans.executeSql(sql);
                    this.actualizarEntregasCanceladasComoPosteadas(entregasCanceladasDevueltasPorElServidor, indice + 1, (resultado: Operacion) => {
                        errorCallback(resultado);
                    }, () => {
                        if (callback) {
                            callback();
                        }
                    });
                }, (error: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `No se pudieron actualizar las entregas canceladas posteadas en el servidor debido a: ${error.message}` } as Operacion);
                });
            } else {
                if (callback) {
                    callback();
                }
            }
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `No se pudieron actualizar las entregas canceladas posteadas en el servidor debido a: ${e.message}` } as Operacion);
        }
    }

    insertarEntregaCancelada(demandaDeDespachoEncabezado: DemandaDeDespachoEncabezado, docSerie: string, docNum: number, callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string[] = [];
                // ReSharper disable once UsageOfPossiblyUnassignedValue
                sql.push("INSERT INTO DELIVERY_CANCELED(");
                sql.push("DELIVERY_CANCELED_ID");
                sql.push(",PICKING_DEMAND_HEADER_ID");
                sql.push(",DOC_NUM_DELIVERY");
                sql.push(",DOC_ENTRY");
                sql.push(",DOC_NUM");
                sql.push(",DOC_SERIE");
                sql.push(",IS_POSTED");
                sql.push(",REASON_CANCEL");
                sql.push(") VALUES(");
                sql.push(`${docNum * -1}`);
                sql.push(`,${demandaDeDespachoEncabezado.pickingDemandHeaderId}`);
                sql.push(`,'${demandaDeDespachoEncabezado.erpReferenceDocNum}'`);
                sql.push(`,'${demandaDeDespachoEncabezado.erpReference}'`);
                sql.push(`,${docNum}`);
                sql.push(`,'${docSerie}'`);
                sql.push(`,0`);
                sql.push(`, '${demandaDeDespachoEncabezado.reasonCancel}'`);
                sql.push(`)`);

                trans.executeSql(sql.join(""));
                callback();
            }, (error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al insertar la entrega cancelada: ${error.message}` } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al insertar la entrega cancelada: ${e.message}` } as Operacion);
        }
    }

    borrarDetalleDeFacturaTemporal(callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push("DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999");
                trans.executeSql(sql.join(""));
                callback();
            }, (error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al borrar el detalle temporal: ${error.message}` } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al borrar el detalle temporal: ${e.message}` } as Operacion);
        }
    }

    borrarDetalleConCantidadCeroDeFacturaTemporal(callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push("DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND QTY <=0");
                trans.executeSql(sql.join(""));
                callback();
            }, (error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al borrar el detalle temporal: ${error.message}` } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al borrar el detalle temporal: ${e.message}` } as Operacion);
        }
    }

    obtenerSkuModificados(entregaServicio: EntregaServicio, invoiceNum: number, callback: (listaSkuModificados: Sku[], entregaServicio: EntregaServicio) => void, errorCallback: (error: Operacion) => void) {
        try {
            let listaSkuModificados: Sku[] = [];

            SONDA_DB_Session.readTransaction((readTrans: SqlTransaction) => {
                let sql: string[] = [];
                sql.push("SELECT");
                sql.push(" SKU, QTY, PRICE, DISCOUNT, TOTAL_LINE, IS_BONUS");
                sql.push(" FROM INVOICE_DETAIL WHERE INVOICE_NUM = " + invoiceNum + "  AND QTY <> ON_HAND");

                readTrans.executeSql(sql.join(""), [], (readTransResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let skuTemp: any = <any>results.rows.item(i);
                        let sku: Sku = new Sku();

                        sku.sku = skuTemp.SKU;
                        sku.qty = skuTemp.QTY;
                        sku.price = skuTemp.PRICE;
                        sku.discount = skuTemp.DISCOUNT;
                        sku.totalLine = skuTemp.TOTAL_LINE;
                        sku.isBonus = skuTemp.IS_BONUS;

                        listaSkuModificados.push(sku);
                    }
                    callback(listaSkuModificados, entregaServicio);
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

    agregarSkusDeFacturaCanceladaAInventario(listaDeDetalleDeFacturaCancelada: any) {
        try {

            this.obtenerSkuDeInventario((listaSku: Sku[]) => {

                let listaDeDetalleDeDemandaDeDespachoAProcesar: DemandaDeDespachoDetalle[] = [];

                for (let i = 0; i < listaDeDetalleDeFacturaCancelada.rows.length; i++) {
                    let detalleFactura = listaDeDetalleDeFacturaCancelada.rows.item(i);
                    let demandaDespachoDetalle = new DemandaDeDespachoDetalle();

                    demandaDespachoDetalle.materialId = detalleFactura.SKU;
                    demandaDespachoDetalle.materialDescription = detalleFactura.SKU_NAME;
                    demandaDespachoDetalle.qty = detalleFactura.QTY;

                    listaDeDetalleDeDemandaDeDespachoAProcesar.push(demandaDespachoDetalle);
                }

                this.actualizarOInsertarInventarioCancelado(listaDeDetalleDeDemandaDeDespachoAProcesar, listaSku, 0, () => {

                }, (resultado: Operacion) => {
                    notify(`No se ha podido insertar/actualizar el detalle de inventario de la factura cancelada debido a: ${resultado.mensaje}`);
                });
            }, (resultado: Operacion) => {
                notify(`No se ha podido insertar/actualizar el detalle de inventario de la factura cancelada debido a: ${resultado.mensaje}`);
            });
        } catch (e) {
            notify(`No se ha podido insertar/actualizar el detalle de inventario de la factura cancelada debido a: ${e.mensaje}`);
        }
    }

    obtenerRazonesDeNoEntrega(callback: (clasificacionesADevolver: Clasificacion[]) => void, errorCallback: (resultado: Operacion) => void) {
        try {
            let clasificacionesADevolver: Clasificacion[] = [];
            SONDA_DB_Session.readTransaction((trans: SqlTransaction) => {
                let sql: string[] = [];


                sql.push(`SELECT GROUP_CLASSIFICATION, NAME_CLASSIFICATION, PRIORITY_CLASSIFICATION, VALUE_TEXT_CLASSIFICATION`);
                sql.push(` FROM CLASSIFICATION WHERE GROUP_CLASSIFICATION = '${TipoDeClasificacion.NoEntrega}'`);

                trans.executeSql(sql.join(""),
                    [],
                    (transReturn: SqlTransaction, results: SqlResultSet) => {

                        for (let i = 0; i < results.rows.length; i++) {
                            let clasificacion = new Clasificacion();
                            let clasificacionTemp = <any>results.rows.item(i);

                            clasificacion.groupClassification = clasificacionTemp.GROUP_CLASSIFICATION;
                            clasificacion.nameClassification = clasificacionTemp.NAME_CLASSIFICATION;
                            clasificacion.priorityClassification = clasificacionTemp.PRIORITY_CLASSIFICATION;
                            clasificacion.valueTextClassification = clasificacionTemp.VALUE_TEXT_CLASSIFICATION;
                            clasificacionesADevolver.push(clasificacion);
                        }
                        callback(clasificacionesADevolver);
                    },
                    (transReturn: SqlTransaction, error: SqlError) => {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las razones de no entrega debido a: ${error.message}` } as Operacion);
                    });

            }, (error: SqlError) => {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las razones de no entrega debido a: ${error.message}` } as Operacion);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `Error al obtener las razones de no entrega debido a: ${e.message}` } as Operacion);
        }
    }

    obtenerInformacionDeCanastas(documentId: number, callBack: (demandaDeDespachoConCanastas: DemandaDeDespachoEncabezado) => void, errorCallBack: (error: Operacion) => void) {
        try {
            var demandaDeDespachoConCanastas = new DemandaDeDespachoEncabezado;
            SONDA_DB_Session.readTransaction((trans: SqlTransaction) => {
                var sql = [];
                sql.push(" SELECT ");
                sql.push(" B.MANIFEST_HEADER_ID ");
                sql.push(" ,B.PICKING_DEMAND_HEADER_ID ");
                sql.push(" ,B.BARCODE ");
                sql.push(" ,B.DOC_NUM ");
                sql.push(" ,B.ERP_REFERENCE_DOC_NUM ");
                sql.push(" FROM BASKET_BY_MANIFEST B ");
                sql.push(` WHERE B.DOC_NUM = '${documentId}' `);

                trans.executeSql(sql.join(""),
                    [],
                    (transResult: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var canastasTemp = <any>results.rows.item(i);
                                var canasta = new Canasta();
                                canasta.docNum = canastasTemp.DOC_NUM;
                                canasta.pickingDemandHeaderId = canastasTemp.PICKING_DEMAND_HEADER_ID;
                                canasta.manifestHeaderId = canastasTemp.MANIFEST_HEADER_ID;
                                canasta.barcode = canastasTemp.BARCODE;
                                canasta.erpReferenceDocNum = canastasTemp.ERP_REFERENCE_DOC_NUM;
                                demandaDeDespachoConCanastas.canastas.push(canasta);
                                demandaDeDespachoConCanastas.pickingDemandHeaderId = canastasTemp.PICKING_DEMAND_HEADER_ID;
                                demandaDeDespachoConCanastas.docNum = canastasTemp.DOC_NUM;
                                demandaDeDespachoConCanastas.erpReferenceDocNum = canastasTemp.ERP_REFERENCE_DOC_NUM;
                            }
                            callBack(demandaDeDespachoConCanastas);
                        } else {
                            callBack(demandaDeDespachoConCanastas);
                        }
                    },
                    (transResult, error) => {
                        errorCallBack({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener canastas: " + error.message } as Operacion);
                    });
            },
                (error: SqlError) => {
                    errorCallBack({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener canastas: " + error.message } as Operacion);
                });
        } catch (e) {
            errorCallBack({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener canastas: " + e.message } as Operacion);
        }
    }

    obtenerDemandasDeDespachoPorTareaParaSincronizacion(callback: (documentosASincronizar: DemandaDeDespachoPorTarea[]) => void,
        errorCallback: (error: Operacion) => void) {
        try {
            this.obtenerDemandasDeDespachoPorTareaParaSincronizar(callback, errorCallback);
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
        }
    }

    obtenerDemandasDeDespachoPorTareaParaSincronizar(callback: (demandasDeDespachoPorTarea: DemandaDeDespachoPorTarea[]) => void, errorCallback: (error: Operacion) => void) {
        try {
            let documentos: DemandaDeDespachoPorTarea[] = [];

            SONDA_DB_Session.readTransaction((readTrans: SqlTransaction) => {
                let sql: string[] = [];

                sql.push("SELECT");
                sql.push(" PICKING_DEMAND_HEADER_ID");
                sql.push(" ,TASK_ID");
                sql.push(" ,IS_POSTED");
                sql.push(" ,PICKING_DEMAND_STATUS");
                sql.push(" FROM PICKING_DEMAND_BY_TASK WHERE IS_POSTED IN(0,1)");

                readTrans.executeSql(sql.join(""), [], (readTransResult: SqlTransaction, results: SqlResultSet) => {
                    for (let i = 0; i < results.rows.length; i++) {
                        let documentoTemp: any = <any>results.rows.item(i);
                        let demandasDeDespachoPorTarea: DemandaDeDespachoPorTarea = new DemandaDeDespachoPorTarea();

                        demandasDeDespachoPorTarea.taskId = documentoTemp.TASK_ID;
                        demandasDeDespachoPorTarea.pickingDemandHeaderId = documentoTemp.PICKING_DEMAND_HEADER_ID;
                        demandasDeDespachoPorTarea.isPosted = documentoTemp.IS_POSTED;
                        demandasDeDespachoPorTarea.pickingDemandStatus = documentoTemp.PICKING_DEMAND_STATUS;

                        documentos.push(demandasDeDespachoPorTarea);
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

    marcarDemandasDeDespachoPorTareaComoPosteadasEnElServidor(demandasDeDespachoPorTareaDevueltasPorElServidor: any) {
        try {
            this.actualizarDemandasDeDespachoPorTareaComoPosteadas(demandasDeDespachoPorTareaDevueltasPorElServidor, 0, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (e) {
            notify(e.message);
        }
    }

    actualizarDemandasDeDespachoPorTareaComoPosteadas(demandasDeDespachoPorTareaDevueltasPorElServidor: any, indice: number, errorCallback: (resultado: Operacion) => void, callback?: () => void) {
        try {
            if (demandasDeDespachoPorTareaDevueltasPorElServidor.length > indice) {
                SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                    let demandaDeDespachoPorTarea = demandasDeDespachoPorTareaDevueltasPorElServidor[indice];
                    let sql: string = `UPDATE PICKING_DEMAND_BY_TASK SET IS_POSTED = ${demandaDeDespachoPorTarea.IS_POSTED} WHERE PICKING_DEMAND_HEADER_ID = ${demandaDeDespachoPorTarea.PICKING_DEMAND_HEADER_ID} `;
                    trans.executeSql(sql);
                    this.actualizarDemandasDeDespachoPorTareaComoPosteadas(demandasDeDespachoPorTareaDevueltasPorElServidor, indice + 1, (resultado: Operacion) => {
                        errorCallback(resultado);
                    }, () => {
                        if (callback) {
                            callback();
                        }
                    });
                }, (error: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `No se ha podido actualizar la demanda de despacho por tarea posteada en el servidor debido a: ${error.message}` } as Operacion);
                });
            } else {
                if (callback) {
                    callback();
                }
            }
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `No se pudieron actualizar las demandas por tarea posteadas en el servidor debido a: ${e.message}` } as Operacion);
        }
    }

    obtenerDatosDeDemandaDeDespachoAsociadaAEntregaAnulada(usuarioFacturaEnRuta: boolean,
        entregaAnulada: DemandaDeDespachoEncabezado,
        callback: (demandaAProcesar: DemandaDeDespachoEncabezado) => void,
        errorCallback: (resultado: Operacion) => void) {
        try {
            let demandaDeDespachoADevolver: DemandaDeDespachoEncabezado = new DemandaDeDespachoEncabezado();
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string[] = [];
                sql
                    .push(`SELECT PDBT.PICKING_DEMAND_HEADER_ID, PDBT.TASK_ID, PDBT.IS_POSTED, PDBT.PICKING_DEMAND_STATUS `);
                sql.push(`FROM PICKING_DEMAND_BY_TASK AS PDBT `);
                sql.push(`INNER JOIN NEXT_PICKING_DEMAND_HEADER AS PDH `);
                sql.push(`ON (PDH.PICKING_DEMAND_HEADER_ID = PDBT.PICKING_DEMAND_HEADER_ID) `);
                sql.push(`WHERE PDH.DOC_NUM = ${entregaAnulada.pickingDemandHeaderId}`);

                trans.executeSql(sql.join(""),
                    [],
                    (transReturn: SqlTransaction, recordsets: SqlResultSet) => {
                        if (recordsets.rows.length > 0) {
                            let demandaTemp: any = recordsets.rows.item(0);

                            demandaDeDespachoADevolver.pickingDemandHeaderId = demandaTemp.PICKING_DEMAND_HEADER_ID;
                            demandaDeDespachoADevolver.taskId = demandaTemp.TASK_ID;
                            demandaDeDespachoADevolver.docNum = entregaAnulada.docNum;
                            demandaDeDespachoADevolver.isCanceled = entregaAnulada.isCanceled;
                            demandaDeDespachoADevolver.reasonCancel = entregaAnulada.reasonCancel;

                            callback(demandaDeDespachoADevolver);

                        } else {
                            errorCallback({
                                codigo: -1,
                                resultado: ResultadoOperacionTipo.Error,
                                mensaje:
                                    `No se ha podido encontrar la información necesaria del documento de despacho asociado a la entrega.`
                            } as Operacion);
                        }
                    },
                    (transReturn: SqlTransaction, error: SqlError) => {
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: `Error al obtener el documento de despacho asociado a la entrega debido a: ${
                                error
                                    .message}`
                        } as Operacion);
                    });

            },
                (error: SqlError) => {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `Error al obtener el documento de despacho asociado a la entrega debido a: ${error
                            .message}`
                    } as Operacion);
                });
        } catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Error al intentar obtener el documento de despacho asociado a la entrega debido a: ${e
                    .message}`
            } as Operacion);
        }
    }

    obtenerDetalleDeDemandaDeDespachoPorEntregaAnulada(transaccion: SqlTransaction,
        demandaDeDespachoAProcesar: DemandaDeDespachoEncabezado,
        callback: (demandaCompleta: DemandaDeDespachoEncabezado) => void,
        errorCallback: (resultado: Operacion) => void) {

        let sql: string[] = [];

        sql
            .push("SELECT PICKING_DEMAND_DETAIL_ID,PICKING_DEMAND_HEADER_ID,MATERIAL_ID, MATERIAL_DESCRIPTION, REQUERIES_SEERIE");
        sql.push(" ,QTY,LINE_NUM,ERP_OBJECT_TYPE,PRICE,WAS_IMPLODED,QTY_IMPLODED");
        sql.push(" ,MASTER_ID_MATERIAL,MATERIAL_OWNER,ATTEMPTED_WITH_ERROR,IS_POSTED_ERP");
        sql.push(" ,POSTED_ERP,ERP_REFERENCE,POSTED_STATUS,POSTED_RESPONSE");
        sql.push(" ,INNER_SALE_STATUS,INNER_SALE_RESPONSE,TONE,CALIBER, IS_BONUS, DISCOUNT ");
        sql.push(` FROM NEXT_PICKING_DEMAND_DETAIL WHERE PICKING_DEMAND_HEADER_ID = ${demandaDeDespachoAProcesar
            .pickingDemandHeaderId}`);

        transaccion.executeSql(sql.join(""),
            [],
            (transReturn: SqlTransaction, results: SqlResultSet) => {
                for (let i = 0; i < results.rows.length; i++) {
                    let detalleDemandaTemp = <any>results.rows.item(i);
                    let detalleDemanda: DemandaDeDespachoDetalle = new DemandaDeDespachoDetalle();

                    detalleDemanda.pickingDemandDetailId = detalleDemandaTemp.PICKING_DEMAND_DETAIL_ID;
                    detalleDemanda.pickingDemandHeaderId = detalleDemandaTemp.PICKING_DEMAND_HEADER_ID;
                    detalleDemanda.materialId = detalleDemandaTemp.MATERIAL_ID;
                    detalleDemanda.materialDescription = detalleDemandaTemp.MATERIAL_DESCRIPTION;
                    detalleDemanda.requeriesSerie = detalleDemandaTemp.REQUERIES_SEERIE;
                    detalleDemanda.qty = detalleDemandaTemp.QTY;
                    detalleDemanda.lineNum = detalleDemandaTemp.LINE_NUM;
                    detalleDemanda.erpObjectType = detalleDemandaTemp.ERP_OBJECT_TYPE;
                    detalleDemanda.price = detalleDemandaTemp.PRICE;
                    detalleDemanda.wasImploded = detalleDemandaTemp.WAS_IMPLODED;
                    detalleDemanda.qtyImploded = detalleDemandaTemp.QTY_IMPLODED;
                    detalleDemanda.masterIdMaterial = detalleDemandaTemp.MASTER_ID_MATERIAL;
                    detalleDemanda.materialOwner = detalleDemandaTemp.MATERIAL_OWNER;
                    detalleDemanda.attemptedWithError = detalleDemandaTemp.ATTEMPTED_WITH_ERROR;
                    detalleDemanda.isPostedErp = detalleDemandaTemp.IS_POSTED_ERP;
                    detalleDemanda.postedErp = detalleDemandaTemp.POSTED_ERP;
                    detalleDemanda.erpReference = detalleDemandaTemp.ERP_REFERENCE;
                    detalleDemanda.postedStatus = detalleDemandaTemp.POSTED_STATUS;
                    detalleDemanda.postedResponse = detalleDemandaTemp.POSTED_RESPONSE;
                    detalleDemanda.innerSaleStatus = detalleDemandaTemp.INNER_SALE_STATUS;
                    detalleDemanda.innerSaleResponse = detalleDemandaTemp.INNER_SALE_RESPONSE;
                    detalleDemanda.tone = detalleDemandaTemp.TONE;
                    detalleDemanda.caliber = detalleDemandaTemp.CALIBER;
                    detalleDemanda.isBonus = detalleDemandaTemp.IS_BONUS;
                    detalleDemanda.discount = detalleDemandaTemp.DISCOUNT;

                    demandaDeDespachoAProcesar.detalleDeDemandaDeDespacho.push(detalleDemanda);
                }

                callback(demandaDeDespachoAProcesar);
            },
            (transReturn: SqlTransaction, error: SqlError) => {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje:
                        `Error al obtener el detalle del documento de despacho asociado a la entrega debido a: ${
                        error.message}`
                } as Operacion);
            });
    }

    ejecutarProcesoDeAnulacionDeEntrega(usuarioFacturaEnRuta: boolean, demandaDeDespachoAProcesar: DemandaDeDespachoEncabezado, callback: () => void, errorCallback: (resultado: Operacion) => void) {
        try {
            let sql: string = "";
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {

                sql = `UPDATE PICKING_DEMAND_BY_TASK SET 
                    IS_POSTED = ${SiNo.No}
                    , PICKING_DEMAND_STATUS = '${EstadoEntrega.Pendiente}' 
                    WHERE PICKING_DEMAND_HEADER_ID IN(SELECT DND.PICKING_DEMAND_HEADER_ID FROM SONDA_DELIVERY_NOTE_DETAIL AS DND 
                    INNER JOIN SONDA_DELIVERY_NOTE_HEADER AS DNH ON(DND.DELIVERY_NOTE_ID = DNH.DELIVERY_NOTE_ID) WHERE DNH.DOC_NUM = ${demandaDeDespachoAProcesar.docNum})`;
                trans.executeSql(sql);

                sql = `UPDATE TASK SET IS_POSTED = 2
                    , TASK_STATUS = '${TareaEstado.Asignada}'
                    , POSTED_GPS = NULL, ACCEPTED_STAMP = NULL, COMPLETED_STAMP = NULL WHERE TASK_ID = ${
                    demandaDeDespachoAProcesar.taskId}`;
                trans.executeSql(sql);

                sql = `UPDATE NEXT_PICKING_DEMAND_HEADER SET PROCESS_STATUS = '${EstadoEntrega.Pendiente}' 
                        WHERE PICKING_DEMAND_HEADER_ID IN(SELECT DND.PICKING_DEMAND_HEADER_ID FROM SONDA_DELIVERY_NOTE_DETAIL AS DND INNER JOIN SONDA_DELIVERY_NOTE_HEADER AS DNH ON(DND.DELIVERY_NOTE_ID = DNH.DELIVERY_NOTE_ID) WHERE DNH.DOC_NUM = ${demandaDeDespachoAProcesar.docNum})`;
                trans.executeSql(sql);


                sql = `UPDATE SONDA_DELIVERY_NOTE_HEADER SET IS_CANCELED = ${demandaDeDespachoAProcesar
                    .isCanceled}, REASON_CANCEL = '${demandaDeDespachoAProcesar.reasonCancel}', IS_POSTED = ${EstadoDePosteoDeNotaDeEntrega.AnuladaSinPostear}
                        WHERE DOC_NUM = ${demandaDeDespachoAProcesar.docNum}                        
                        `;
                trans.executeSql(sql);

                if (usuarioFacturaEnRuta) {
                    demandaDeDespachoAProcesar.detalleDeDemandaDeDespacho
                        .map((detalle: DemandaDeDespachoDetalle) => {
                            sql = `UPDATE SKUS SET ON_HAND = ON_HAND - ${detalle.qty} WHERE SKU = '${detalle.materialId}'`;
                            trans.executeSql(sql);
                        });
                }
            },
                (error: SqlError) => {
                    errorCallback({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `Error al ejecutar la anulación de la entrega debido a: ${error.message}`
                    } as Operacion);
                },
                () => {
                    callback();
                    TareaServicio.recalcularSecuenciaDeTareas(() => {
                        EnviarData();
                    });
                });
        } catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Error al ejecutar la anulación de la entrega debido a: ${e.message}`
            } as Operacion);
        }
    }

}