var EntregaServicio = (function () {
    function EntregaServicio() {
    }
    EntregaServicio.prototype.realizarLlamadaTelefonica = function (tarea, callback, errCallback) {
        try {
            if (!tarea.phoneCustomer || tarea.phoneCustomer == "0") {
                throw new Error("El número de teléfono del cliente no es correcto");
            }
            plugins.CallNumber.callNumber(callback, function (error) {
                throw new Error(error.message);
            }, tarea.phoneCustomer);
        }
        catch (e) {
            errCallback({ codigo: -1, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.tomarFotografiaEntrega = function (callback, errCallback) {
        try {
            DispositivoServicio.TomarFoto(function (foto) {
                callback(foto);
            }, function (resultado) {
                errCallback(resultado);
            });
        }
        catch (e) {
            errCallback({ codigo: -1, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.navegarHaciaCliente = function (cliente, callback, errCallback) {
        try {
            TaskNavigateTo(cliente.gps, cliente.clientName);
            callback();
        }
        catch (e) {
            errCallback({ codigo: -1, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.obtenerDocumentosParaEntrega = function (codigoDeCliente, callback, errorCallback) {
        try {
            this.obtenerEncabezadosDeDocumentosDeDemandaDeDespacho(codigoDeCliente, callback, errorCallback);
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.obtenerEncabezadosDeDocumentosDeDemandaDeDespacho = function (codigoDeCliente, callback, errorCallback) {
        var _this = this;
        try {
            var documentos_1 = [];
            SONDA_DB_Session.readTransaction(function (readTrans) {
                var sql = [];
                sql.push("SELECT PICKING_DEMAND_HEADER_ID, DOC_NUM, CLIENT_CODE, CODE_ROUTE");
                sql.push(" ,CODE_SELLER, TOTAL_AMOUNT, SERIAL_NUMBER, DOC_NUM_SEQUENCE, EXTERNAL_SOURCE_ID");
                sql.push(" ,IS_FROM_ERP, IS_FROM_SONDA, LAST_UPDATE, LAST_UPDATE_BY, IS_COMPLETED");
                sql.push(" ,WAVE_PICKING_ID , CODE_WAREHOUSE, IS_AUTHORIZED, ATTEMPTED_WITH_ERROR");
                sql.push(" ,IS_POSTED_ERP, POSTED_ERP, POSTED_RESPONSE, ERP_REFERENCE, CLIENT_NAME");
                sql.push(" ,CREATED_DATE, ERP_REFERENCE_DOC_NUM, DOC_ENTRY, IS_CONSOLIDATED, PRIORITY");
                sql.push(" ,HAS_MASTERPACK, POSTED_STATUS, OWNER, CLIENT_OWNER, MASTER_ID_SELLER");
                sql.push(" ,SELLER_OWNER, SOURCE_TYPE, INNER_SALE_STATUS, INNER_SALE_RESPONSE");
                sql.push(" ,DEMAND_TYPE, TRANSFER_REQUEST_ID, ADDRESS_CUSTOMER, STATE_CODE, PROCESS_STATUS, DISCOUNT");
                sql.push(" FROM NEXT_PICKING_DEMAND_HEADER WHERE CLIENT_CODE = '" + codigoDeCliente + "' ");
                readTrans.executeSql(sql.join(""), [], function (readTransResult, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var encabezadoDeDemandaTemp = results.rows.item(i);
                        var encabezadoDeDemanda = new DemandaDeDespachoEncabezado();
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
                        documentos_1.push(encabezadoDeDemanda);
                    }
                    _this.obtenerDetalleDeDocumentosDeDemandaDeDespacho(documentos_1, callback, errorCallback, 0, readTransResult);
                }, function (readTransResult, error) {
                    throw new Error(error.message);
                });
            }, function (errorTrans) {
                throw new Error(errorTrans.message);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.obtenerDetalleDeDocumentosDeDemandaDeDespacho = function (documentos, callback, errorCallback, indice, transaccion) {
        var _this = this;
        try {
            if (this.esUltimoRegistro(indice, documentos.length)) {
                var documentoActual_1 = documentos[indice];
                var sql = [];
                sql.push("SELECT PICKING_DEMAND_DETAIL_ID,PICKING_DEMAND_HEADER_ID,MATERIAL_ID, MATERIAL_DESCRIPTION, REQUERIES_SEERIE");
                sql.push(" ,QTY,LINE_NUM,ERP_OBJECT_TYPE,PRICE,WAS_IMPLODED,QTY_IMPLODED");
                sql.push(" ,MASTER_ID_MATERIAL,MATERIAL_OWNER,ATTEMPTED_WITH_ERROR,IS_POSTED_ERP");
                sql.push(" ,POSTED_ERP,ERP_REFERENCE,POSTED_STATUS,POSTED_RESPONSE");
                sql.push(" ,INNER_SALE_STATUS,INNER_SALE_RESPONSE,TONE,CALIBER, IS_BONUS, DISCOUNT ");
                sql.push(" FROM NEXT_PICKING_DEMAND_DETAIL WHERE PICKING_DEMAND_HEADER_ID = " + documentoActual_1.pickingDemandHeaderId);
                transaccion.executeSql(sql.join(""), [], function (transReturn, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var detalleDemandaTemp = results.rows.item(i);
                        var detalleDemanda = new DemandaDeDespachoDetalle();
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
                        documentoActual_1.detalleDeDemandaDeDespacho.push(detalleDemanda);
                    }
                    documentos[indice] = documentoActual_1;
                    _this.obtenerDetalleDeDocumentosDeDemandaDeDespacho(documentos, callback, errorCallback, indice + 1, transReturn);
                }, function (transReturn, error) {
                    throw new Error(error.message);
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
    EntregaServicio.prototype.esUltimoRegistro = function (indiceDeDocumento, cantidadDeDocumentos) {
        return indiceDeDocumento < cantidadDeDocumentos;
    };
    EntregaServicio.prototype.agregarDetalleCompletoDeDemandaDeDespachoAFacturacion = function (detalleDeDemandaDeDespacho, callback, errorCallback) {
        var _this = this;
        try {
            this.borrarDetalleDeFacturaTemporal(function () {
                detalleDeDemandaDeDespacho.map(function (detalle, i) {
                    _this.agregarProductoDeDemandaDeDespachoAFacturacion(detalle, i, function (error) {
                        throw new Error(error.mensaje);
                    });
                });
                callback();
            }, function (resultado) {
                errorCallback(resultado);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.agregarProductoDeDemandaDeDespachoAFacturacion = function (producto, indice, errorCallback) {
        var _this = this;
        SONDA_DB_Session.transaction(function (trans) {
            var sql = [];
            sql.push("INSERT INTO INVOICE_DETAIL(INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT, TOTAL_LINE");
            sql.push(", REQUERIES_SERIE, SERIE, SERIE_2, LINE_SEQ, IS_ACTIVE, COMBO_REFERENCE");
            sql.push(", PARENT_SEQ, EXPOSURE, PHONE, TAX_CODE, ON_HAND, IS_BONUS) VALUES(");
            sql.push("-9999, '" + producto.materialId + "', '" + producto.materialDescription + "', " + producto.qty);
            sql.push(", " + (producto.isBonus && producto.isBonus > 0 ? 0 : producto.price) + ", " + (producto.discount && producto.discount > 0 ? producto.discount : 0) + ", " + (producto.isBonus && producto.isBonus > 0 ? 0 : _this.obtenerTotalDeLineaDeProducto(producto)));
            sql.push(", " + 0 + ", '0','0'," + (indice == 0 ? 0 : indice + 1) + ",3, '" + producto.materialId + "', " + (indice == 0 ? 0 : indice));
            sql.push(",1,'',NULL, " + producto.qty + ", " + (producto.isBonus && producto.isBonus > 0 ? producto.isBonus : 0));
            sql.push(")");
            trans.executeSql(sql.join(""));
        }, function (error) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message });
        });
    };
    EntregaServicio.prototype.obtenerTotalDeLineaDeProducto = function (producto) {
        return (producto.discount && producto.discount > 0)
            ? ((100 - producto.discount) / 100) * (producto.qty * producto.price) : (producto.qty * producto.price);
    };
    EntregaServicio.prototype.cambiarEstadoDeDocumentoEntrega = function (demandHeaderId, estado, callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql.push(" UPDATE NEXT_PICKING_DEMAND_HEADER SET ");
                sql.push(" PROCESS_STATUS = '" + estado + "'");
                sql.push(" WHERE PICKING_DEMAND_HEADER_ID = " + demandHeaderId);
                trans.executeSql(sql.join(""));
                sql = [];
                sql.push(" UPDATE PICKING_DEMAND_BY_TASK SET ");
                sql.push(" PICKING_DEMAND_STATUS = CASE ");
                sql.push(" WHEN PICKING_DEMAND_STATUS = 'PARTIAL' THEN PICKING_DEMAND_STATUS ");
                sql.push(" ELSE '" + estado + "' ");
                sql.push(" END ");
                sql.push(" ,IS_POSTED = 0 ");
                sql.push(" WHERE PICKING_DEMAND_HEADER_ID = " + demandHeaderId);
                trans.executeSql(sql.join(""));
                callback();
            }, function (error) {
                throw new Error(error.message);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al cambiar el estado a un documento de entrega" + e.message });
        }
    };
    EntregaServicio.prototype.cambiarEstadoDeDocumentoDeDemandaDeDespacho = function (idDeDemandaDeDespacho, estado, callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql("UPDATE ");
            }, function (error) {
                throw new Error(error.message);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.agregarSkuAInvnetarioCancelado = function (listaDeEntregaCancelado, callback, errorCallback) {
        var _this = this;
        try {
            this.obtenerSkuDeInventario(function (listaSku) {
                _this.actualizarOInsertarInventarioCancelado(listaDeEntregaCancelado, listaSku, 0, callback, errorCallback);
            }, function (resultado) {
                errorCallback(resultado);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al agregar sku a inventario: " + e.message });
        }
    };
    EntregaServicio.prototype.actualizarOInsertarInventarioCancelado = function (listaDeEntregaCancelado, listaSku, indice, callback, errorCallback) {
        var _this = this;
        try {
            if (listaDeEntregaCancelado.length > indice) {
                SONDA_DB_Session.transaction(function (trans) {
                    var demandaDeDespachoDetalle = listaDeEntregaCancelado[indice];
                    var sku = listaSku.find(function (sku) {
                        return sku.sku === demandaDeDespachoDetalle.materialId;
                    });
                    var sql = [];
                    if (sku) {
                        sql.push(" UPDATE SKUS SET ");
                        sql.push(" ON_HAND =  ON_HAND + " + demandaDeDespachoDetalle.qty);
                        sql.push(" WHERE SKU = '" + sku.sku + "'");
                    }
                    else {
                        sql.push(" INSERT INTO SKUS(");
                        sql.push(" SKU ");
                        sql.push(" ,SKU_NAME ");
                        sql.push(" ,SKU_PRICE ");
                        sql.push(" ,SKU_LINK ");
                        sql.push(" ,REQUERIES_SERIE ");
                        sql.push(" ,IS_KIT ");
                        sql.push(" ,ON_HAND ");
                        sql.push(" ,ROUTE_ID ");
                        sql.push(" ,IS_PARENT ");
                        sql.push(" ,PARENT_SKU ");
                        sql.push(" ,EXPOSURE ");
                        sql.push(" ,PRIORITY ");
                        sql.push(" ,IS_PARENT ");
                        sql.push(" ,QTY_RELATED ");
                        sql.push(" ,LOADED_LAST_UPDATED ");
                        sql.push(" ,TAX_CODE ");
                        sql.push(" )VALUES(");
                        sql.push(" '" + demandaDeDespachoDetalle.materialId + "'");
                        sql.push(" , '" + demandaDeDespachoDetalle.materialDescription + "'");
                        sql.push(" , 0");
                        sql.push(" , '...'");
                        sql.push(" , 0");
                        sql.push(" , 0");
                        sql.push(" , " + demandaDeDespachoDetalle.qty);
                        sql.push(" , '" + gDefaultWhs + "'");
                        sql.push(" , 0");
                        sql.push(" , '" + demandaDeDespachoDetalle.materialId + "'");
                        sql.push(" , 1");
                        sql.push(" , 0");
                        sql.push(" , 0");
                        sql.push(" , 0");
                        sql.push(" , '" + (new Date).toLocaleString() + "'");
                        sql.push(" , 'E'");
                        sql.push(" )");
                    }
                    trans.executeSql(sql.join(""));
                    sql = null;
                    _this.actualizarOInsertarInventarioCancelado(listaDeEntregaCancelado, listaSku, indice + 1, callback, errorCallback);
                }, function (error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al actualizar o insertar inventario: " + error.message });
                });
            }
            else {
                callback();
            }
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al actualizar o insertar inventario: " + e.message });
        }
    };
    EntregaServicio.prototype.obtenerSkuDeInventario = function (callback, errorCallback) {
        try {
            SONDA_DB_Session.readTransaction(function (readTrans) {
                var sql = [];
                sql.push(" SELECT SKU, SKU_NAME ");
                sql.push(" FROM SKUS");
                readTrans.executeSql(sql.join(""), [], function (readTransResult, results) {
                    var listaSku = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        var skuSql = results.rows.item(i);
                        var sku = new Sku();
                        sku.sku = skuSql.SKU;
                        sku.skuName = skuSql.SKU_NAME;
                        listaSku.push(sku);
                        sku = null;
                    }
                    callback(listaSku);
                    listaSku = null;
                }, function (readTransResult, error) {
                    throw new Error(error.message);
                });
                sql = null;
            }, function (errorTrans) {
                throw new Error(errorTrans.message);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener el inventario: " + e.message });
        }
    };
    EntregaServicio.prototype.obtenerEntregasCanceladasParaSincronizacion = function (callback, errorCallback) {
        try {
            this.obtenerEntregasCanceladasParaSincronizar(callback, errorCallback);
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.obtenerEntregasCanceladasParaSincronizar = function (callback, errorCallback) {
        try {
            var documentos_2 = [];
            SONDA_DB_Session.readTransaction(function (readTrans) {
                var sql = [];
                sql.push("SELECT");
                sql.push(" DELIVERY_CANCELED_ID");
                sql.push(" ,PICKING_DEMAND_HEADER_ID");
                sql.push(" ,DOC_NUM_DELIVERY");
                sql.push(" ,DOC_ENTRY");
                sql.push(" ,DOC_NUM");
                sql.push(" ,DOC_SERIE");
                sql.push(" ,REASON_CANCEL");
                sql.push(" FROM DELIVERY_CANCELED WHERE IS_POSTED IN(0,1)");
                readTrans.executeSql(sql.join(""), [], function (readTransResult, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var entregaCanceladaTemp = results.rows.item(i);
                        var entregaCancelada = new EntregaCancelada();
                        entregaCancelada.deliveryCanceledId = entregaCanceladaTemp.DELIVERY_CANCELED_ID;
                        entregaCancelada.pickingDemandHeaderId = entregaCanceladaTemp.PICKING_DEMAND_HEADER_ID;
                        entregaCancelada.docNumDelivery = entregaCanceladaTemp.DOC_NUM_DELIVERY;
                        entregaCancelada.docEntry = entregaCanceladaTemp.DOC_ENTRY;
                        entregaCancelada.docNum = entregaCanceladaTemp.DOC_NUM;
                        entregaCancelada.docSerie = entregaCanceladaTemp.DOC_SERIE;
                        entregaCancelada.reasonCancel = entregaCanceladaTemp.REASON_CANCEL;
                        documentos_2.push(entregaCancelada);
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
    EntregaServicio.prototype.marcarEntregaCanceladaComoPosteadasEnElServidor = function (entregasCanceladasDevueltasPorElServidor) {
        try {
            this.actualizarEntregasCanceladasComoPosteadas(entregasCanceladasDevueltasPorElServidor, 0, function (resultado) {
                throw new Error(resultado.mensaje);
            });
        }
        catch (e) {
            notify(e.message);
        }
    };
    EntregaServicio.prototype.actualizarEntregasCanceladasComoPosteadas = function (entregasCanceladasDevueltasPorElServidor, indice, errorCallback, callback) {
        var _this = this;
        try {
            if (entregasCanceladasDevueltasPorElServidor.length > indice) {
                SONDA_DB_Session.transaction(function (trans) {
                    var entregaCancelada = entregasCanceladasDevueltasPorElServidor[indice];
                    var sql = "";
                    sql = "UPDATE DELIVERY_CANCELED SET IS_POSTED = " + entregaCancelada.IS_POSTED + ", POSTED_DATETIME = '" + entregaCancelada.POSTED_DATETIME + "' WHERE DOC_SERIE = '" + entregaCancelada.DOC_SERIE + "' AND DOC_NUM = " + entregaCancelada.DOC_NUM + " ";
                    trans.executeSql(sql);
                    _this.actualizarEntregasCanceladasComoPosteadas(entregasCanceladasDevueltasPorElServidor, indice + 1, function (resultado) {
                        errorCallback(resultado);
                    }, function () {
                        if (callback) {
                            callback();
                        }
                    });
                }, function (error) {
                    throw new Error(error.message);
                });
            }
            else {
                if (callback) {
                    callback();
                }
            }
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "No se pudieron actualizar las entregas canceladas posteadas en el servidor debido a: " + e.message });
        }
    };
    EntregaServicio.prototype.insertarEntregaCancelada = function (demandaDeDespachoEncabezado, docSerie, docNum, callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
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
                sql.push("" + docNum * -1);
                sql.push("," + demandaDeDespachoEncabezado.pickingDemandHeaderId);
                sql.push(",'" + demandaDeDespachoEncabezado.erpReferenceDocNum + "'");
                sql.push(",'" + demandaDeDespachoEncabezado.erpReference + "'");
                sql.push("," + docNum);
                sql.push(",'" + docSerie + "'");
                sql.push(",0");
                sql.push(", '" + demandaDeDespachoEncabezado.reasonCancel + "'");
                sql.push(")");
                console.log(sql.join(""));
                trans.executeSql(sql.join(""));
                callback();
            }, function (error) {
                throw new Error(error.message);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al insertar la entrega cancelada: " + e.message });
        }
    };
    EntregaServicio.prototype.borrarDetalleDeFacturaTemporal = function (callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql.push("DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999");
                console.log(sql.join(""));
                trans.executeSql(sql.join(""));
                callback();
            }, function (error) {
                throw new Error(error.message);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al borrar el detalle temporal: " + e.message });
        }
    };
    EntregaServicio.prototype.borrarDetalleConCantidadCeroDeFacturaTemporal = function (callback, errorCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql.push("DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND QTY <=0");
                console.log(sql.join(""));
                trans.executeSql(sql.join(""));
                callback();
            }, function (error) {
                throw new Error(error.message);
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al borrar el detalle temporal: " + e.message });
        }
    };
    EntregaServicio.prototype.obtenerSkuModificados = function (entregaServicio, invoiceNum, callback, errorCallback) {
        try {
            var listaSkuModificados_1 = [];
            SONDA_DB_Session.readTransaction(function (readTrans) {
                var sql = [];
                sql.push("SELECT");
                sql.push(" SKU, QTY, PRICE, DISCOUNT, TOTAL_LINE, IS_BONUS");
                sql.push(" FROM INVOICE_DETAIL WHERE INVOICE_NUM = " + invoiceNum + "  AND QTY <> ON_HAND");
                readTrans.executeSql(sql.join(""), [], function (readTransResult, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var skuTemp = results.rows.item(i);
                        var sku = new Sku();
                        sku.sku = skuTemp.SKU;
                        sku.qty = skuTemp.QTY;
                        sku.price = skuTemp.PRICE;
                        sku.discount = skuTemp.DISCOUNT;
                        sku.totalLine = skuTemp.TOTAL_LINE;
                        sku.isBonus = skuTemp.IS_BONUS;
                        listaSkuModificados_1.push(sku);
                    }
                    callback(listaSkuModificados_1, entregaServicio);
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
    EntregaServicio.prototype.agregarSkusDeFacturaCanceladaAInventario = function (listaDeDetalleDeFacturaCancelada) {
        var _this = this;
        try {
            this.obtenerSkuDeInventario(function (listaSku) {
                var listaDeDetalleDeDemandaDeDespachoAProcesar = [];
                for (var i = 0; i < listaDeDetalleDeFacturaCancelada.rows.length; i++) {
                    var detalleFactura = listaDeDetalleDeFacturaCancelada.rows.item(i);
                    var demandaDespachoDetalle = new DemandaDeDespachoDetalle();
                    demandaDespachoDetalle.materialId = detalleFactura.SKU;
                    demandaDespachoDetalle.materialDescription = detalleFactura.SKU_NAME;
                    demandaDespachoDetalle.qty = detalleFactura.QTY;
                    listaDeDetalleDeDemandaDeDespachoAProcesar.push(demandaDespachoDetalle);
                }
                _this.actualizarOInsertarInventarioCancelado(listaDeDetalleDeDemandaDeDespachoAProcesar, listaSku, 0, function () {
                }, function (resultado) {
                    notify("No se ha podido insertar/actualizar el detalle de inventario de la factura cancelada debido a: " + resultado.mensaje);
                });
            }, function (resultado) {
                notify("No se ha podido insertar/actualizar el detalle de inventario de la factura cancelada debido a: " + resultado.mensaje);
            });
        }
        catch (e) {
            notify("No se ha podido insertar/actualizar el detalle de inventario de la factura cancelada debido a: " + e.mensaje);
        }
    };
    EntregaServicio.prototype.obtenerRazonesDeNoEntrega = function (callback, errorCallback) {
        try {
            var clasificacionesADevolver_1 = [];
            SONDA_DB_Session.readTransaction(function (trans) {
                var sql = [];
                sql.push("SELECT GROUP_CLASSIFICATION, NAME_CLASSIFICATION, PRIORITY_CLASSIFICATION, VALUE_TEXT_CLASSIFICATION");
                sql.push(" FROM CLASSIFICATION WHERE GROUP_CLASSIFICATION = '" + TipoDeClasificacion.NoEntrega + "'");
                trans.executeSql(sql.join(""), [], function (transReturn, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var clasificacion = new Clasificacion();
                        var clasificacionTemp = results.rows.item(i);
                        clasificacion.groupClassification = clasificacionTemp.GROUP_CLASSIFICATION;
                        clasificacion.nameClassification = clasificacionTemp.NAME_CLASSIFICATION;
                        clasificacion.priorityClassification = clasificacionTemp.PRIORITY_CLASSIFICATION;
                        clasificacion.valueTextClassification = clasificacionTemp.VALUE_TEXT_CLASSIFICATION;
                        clasificacionesADevolver_1.push(clasificacion);
                    }
                    callback(clasificacionesADevolver_1);
                }, function (transReturn, error) {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las razones de no entrega debido a: " + error.message });
                });
            }, function (error) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las razones de no entrega debido a: " + error.message });
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener las razones de no entrega debido a: " + e.message });
        }
    };
    EntregaServicio.prototype.obtenerInformacionDeCanastas = function (documentId, callBack, errorCallBack) {
        try {
            var demandaDeDespachoConCanastas = new DemandaDeDespachoEncabezado;
            SONDA_DB_Session.readTransaction(function (trans) {
                var sql = [];
                sql.push(" SELECT ");
                sql.push(" B.MANIFEST_HEADER_ID ");
                sql.push(" ,B.PICKING_DEMAND_HEADER_ID ");
                sql.push(" ,B.BARCODE ");
                sql.push(" ,B.DOC_NUM ");
                sql.push(" ,B.ERP_REFERENCE_DOC_NUM ");
                sql.push(" FROM BASKET_BY_MANIFEST B ");
                sql.push(" WHERE B.DOC_NUM = '" + documentId + "' ");
                trans.executeSql(sql.join(""), [], function (transResult, results) {
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var canastasTemp = results.rows.item(i);
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
                    }
                    else {
                        callBack(demandaDeDespachoConCanastas);
                    }
                }, function (transResult, error) {
                    errorCallBack({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener canastas: " + error.message });
                });
            }, function (error) {
                errorCallBack({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener canastas: " + error.message });
            });
        }
        catch (e) {
            errorCallBack({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Error al obtener canastas: " + e.message });
        }
    };
    EntregaServicio.prototype.obtenerDemandasDeDespachoPorTareaParaSincronizacion = function (callback, errorCallback) {
        try {
            this.obtenerDemandasDeDespachoPorTareaParaSincronizar(callback, errorCallback);
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    EntregaServicio.prototype.obtenerDemandasDeDespachoPorTareaParaSincronizar = function (callback, errorCallback) {
        try {
            var documentos_3 = [];
            SONDA_DB_Session.readTransaction(function (readTrans) {
                var sql = [];
                sql.push("SELECT");
                sql.push(" PICKING_DEMAND_HEADER_ID");
                sql.push(" ,TASK_ID");
                sql.push(" ,IS_POSTED");
                sql.push(" ,PICKING_DEMAND_STATUS");
                sql.push(" FROM PICKING_DEMAND_BY_TASK WHERE IS_POSTED IN(0,1)");
                readTrans.executeSql(sql.join(""), [], function (readTransResult, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var documentoTemp = results.rows.item(i);
                        var demandasDeDespachoPorTarea = new DemandaDeDespachoPorTarea();
                        demandasDeDespachoPorTarea.taskId = documentoTemp.TASK_ID;
                        demandasDeDespachoPorTarea.pickingDemandHeaderId = documentoTemp.PICKING_DEMAND_HEADER_ID;
                        demandasDeDespachoPorTarea.isPosted = documentoTemp.IS_POSTED;
                        demandasDeDespachoPorTarea.pickingDemandStatus = documentoTemp.PICKING_DEMAND_STATUS;
                        documentos_3.push(demandasDeDespachoPorTarea);
                    }
                    callback(documentos_3);
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
    EntregaServicio.prototype.marcarDemandasDeDespachoPorTareaComoPosteadasEnElServidor = function (demandasDeDespachoPorTareaDevueltasPorElServidor) {
        try {
            this.actualizarDemandasDeDespachoPorTareaComoPosteadas(demandasDeDespachoPorTareaDevueltasPorElServidor, 0, function (resultado) {
                throw new Error(resultado.mensaje);
            });
        }
        catch (e) {
            notify(e.message);
        }
    };
    EntregaServicio.prototype.actualizarDemandasDeDespachoPorTareaComoPosteadas = function (demandasDeDespachoPorTareaDevueltasPorElServidor, indice, errorCallback, callback) {
        var _this = this;
        try {
            if (demandasDeDespachoPorTareaDevueltasPorElServidor.length > indice) {
                SONDA_DB_Session.transaction(function (trans) {
                    var demandaDeDespachoPorTarea = demandasDeDespachoPorTareaDevueltasPorElServidor[indice];
                    var sql = "UPDATE PICKING_DEMAND_BY_TASK SET IS_POSTED = " + demandaDeDespachoPorTarea.IS_POSTED + " WHERE PICKING_DEMAND_HEADER_ID = " + demandaDeDespachoPorTarea.PICKING_DEMAND_HEADER_ID + " ";
                    trans.executeSql(sql);
                    _this.actualizarDemandasDeDespachoPorTareaComoPosteadas(demandasDeDespachoPorTareaDevueltasPorElServidor, indice + 1, function (resultado) {
                        errorCallback(resultado);
                    }, function () {
                        if (callback) {
                            callback();
                        }
                    });
                }, function (error) {
                    throw new Error(error.message);
                });
            }
            else {
                if (callback) {
                    callback();
                }
            }
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "No se pudieron actualizar las demandas por tarea posteadas en el servidor debido a: " + e.message });
        }
    };
    EntregaServicio.prototype.obtenerDatosDeDemandaDeDespachoAsociadaAEntregaAnulada = function (usuarioFacturaEnRuta, entregaAnulada, callback, errorCallback) {
        try {
            var demandaDeDespachoADevolver_1 = new DemandaDeDespachoEncabezado();
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql
                    .push("SELECT PDBT.PICKING_DEMAND_HEADER_ID, PDBT.TASK_ID, PDBT.IS_POSTED, PDBT.PICKING_DEMAND_STATUS ");
                sql.push("FROM PICKING_DEMAND_BY_TASK AS PDBT ");
                sql.push("INNER JOIN NEXT_PICKING_DEMAND_HEADER AS PDH ");
                sql.push("ON (PDH.PICKING_DEMAND_HEADER_ID = PDBT.PICKING_DEMAND_HEADER_ID) ");
                sql.push("WHERE PDH.DOC_NUM = " + entregaAnulada.pickingDemandHeaderId);
                trans.executeSql(sql.join(""), [], function (transReturn, recordsets) {
                    if (recordsets.rows.length > 0) {
                        var demandaTemp = recordsets.rows.item(0);
                        demandaDeDespachoADevolver_1.pickingDemandHeaderId = demandaTemp.PICKING_DEMAND_HEADER_ID;
                        demandaDeDespachoADevolver_1.taskId = demandaTemp.TASK_ID;
                        demandaDeDespachoADevolver_1.docNum = entregaAnulada.docNum;
                        demandaDeDespachoADevolver_1.isCanceled = entregaAnulada.isCanceled;
                        demandaDeDespachoADevolver_1.reasonCancel = entregaAnulada.reasonCancel;
                        callback(demandaDeDespachoADevolver_1);
                    }
                    else {
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: "No se ha podido encontrar la informaci\u00F3n necesaria del documento de despacho asociado a la entrega."
                        });
                    }
                }, function (transReturn, error) {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Error al obtener el documento de despacho asociado a la entrega debido a: " + error
                            .message
                    });
                });
            }, function (error) {
                errorCallback({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al obtener el documento de despacho asociado a la entrega debido a: " + error
                        .message
                });
            });
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al intentar obtener el documento de despacho asociado a la entrega debido a: " + e
                    .message
            });
        }
    };
    EntregaServicio.prototype.obtenerDetalleDeDemandaDeDespachoPorEntregaAnulada = function (transaccion, demandaDeDespachoAProcesar, callback, errorCallback) {
        var sql = [];
        sql
            .push("SELECT PICKING_DEMAND_DETAIL_ID,PICKING_DEMAND_HEADER_ID,MATERIAL_ID, MATERIAL_DESCRIPTION, REQUERIES_SEERIE");
        sql.push(" ,QTY,LINE_NUM,ERP_OBJECT_TYPE,PRICE,WAS_IMPLODED,QTY_IMPLODED");
        sql.push(" ,MASTER_ID_MATERIAL,MATERIAL_OWNER,ATTEMPTED_WITH_ERROR,IS_POSTED_ERP");
        sql.push(" ,POSTED_ERP,ERP_REFERENCE,POSTED_STATUS,POSTED_RESPONSE");
        sql.push(" ,INNER_SALE_STATUS,INNER_SALE_RESPONSE,TONE,CALIBER, IS_BONUS, DISCOUNT ");
        sql.push(" FROM NEXT_PICKING_DEMAND_DETAIL WHERE PICKING_DEMAND_HEADER_ID = " + demandaDeDespachoAProcesar
            .pickingDemandHeaderId);
        transaccion.executeSql(sql.join(""), [], function (transReturn, results) {
            for (var i = 0; i < results.rows.length; i++) {
                var detalleDemandaTemp = results.rows.item(i);
                var detalleDemanda = new DemandaDeDespachoDetalle();
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
        }, function (transReturn, error) {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al obtener el detalle del documento de despacho asociado a la entrega debido a: " + error.message
            });
        });
    };
    EntregaServicio.prototype.ejecutarProcesoDeAnulacionDeEntrega = function (usuarioFacturaEnRuta, demandaDeDespachoAProcesar, callback, errorCallback) {
        try {
            var sql_1 = "";
            SONDA_DB_Session.transaction(function (trans) {
                sql_1 = "UPDATE PICKING_DEMAND_BY_TASK SET \n                    IS_POSTED = " + SiNo.No + "\n                    , PICKING_DEMAND_STATUS = '" + EstadoEntrega.Pendiente + "' \n                    WHERE PICKING_DEMAND_HEADER_ID IN(SELECT DND.PICKING_DEMAND_HEADER_ID FROM SONDA_DELIVERY_NOTE_DETAIL AS DND \n                    INNER JOIN SONDA_DELIVERY_NOTE_HEADER AS DNH ON(DND.DELIVERY_NOTE_ID = DNH.DELIVERY_NOTE_ID) WHERE DNH.DOC_NUM = " + demandaDeDespachoAProcesar.docNum + ")";
                trans.executeSql(sql_1);
                sql_1 = "UPDATE TASK SET IS_POSTED = 2\n                    , TASK_STATUS = '" + TareaEstado.Asignada + "'\n                    , POSTED_GPS = NULL, ACCEPTED_STAMP = NULL, COMPLETED_STAMP = NULL WHERE TASK_ID = " + demandaDeDespachoAProcesar.taskId;
                trans.executeSql(sql_1);
                sql_1 = "UPDATE NEXT_PICKING_DEMAND_HEADER SET PROCESS_STATUS = '" + EstadoEntrega.Pendiente + "' \n                        WHERE PICKING_DEMAND_HEADER_ID IN(SELECT DND.PICKING_DEMAND_HEADER_ID FROM SONDA_DELIVERY_NOTE_DETAIL AS DND INNER JOIN SONDA_DELIVERY_NOTE_HEADER AS DNH ON(DND.DELIVERY_NOTE_ID = DNH.DELIVERY_NOTE_ID) WHERE DNH.DOC_NUM = " + demandaDeDespachoAProcesar.docNum + ")";
                trans.executeSql(sql_1);
                sql_1 = "UPDATE SONDA_DELIVERY_NOTE_HEADER SET IS_CANCELED = " + demandaDeDespachoAProcesar
                    .isCanceled + ", REASON_CANCEL = '" + demandaDeDespachoAProcesar.reasonCancel + "', IS_POSTED = " + EstadoDePosteoDeNotaDeEntrega.AnuladaSinPostear + "\n                        WHERE DOC_NUM = " + demandaDeDespachoAProcesar.docNum + "                        \n                        ";
                trans.executeSql(sql_1);
                if (usuarioFacturaEnRuta) {
                    demandaDeDespachoAProcesar.detalleDeDemandaDeDespacho
                        .map(function (detalle) {
                        sql_1 = "UPDATE SKUS SET ON_HAND = ON_HAND - " + detalle.qty + " WHERE SKU = '" + detalle.materialId + "'";
                        trans.executeSql(sql_1);
                    });
                }
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al ejecutar la anulaci\u00F3n de la entrega debido a: " + error.message
                });
            }, function () {
                callback();
                TareaServicio.recalcularSecuenciaDeTareas(function () {
                    EnviarData();
                });
            });
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al ejecutar la anulaci\u00F3n de la entrega debido a: " + e.message
            });
        }
    };
    return EntregaServicio;
}());
//# sourceMappingURL=EntregaServicio.js.map