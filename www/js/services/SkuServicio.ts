class SkuServicio implements ISkuServicio {

    obtenerFamiliaSku(callback: (results: any) => void, callbackError: (reultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            tx => {
                var sql = "SELECT FAMILY_SKU ";
                sql += " ,CODE_FAMILY_SKU";
                sql += " ,DESCRIPTION_FAMILY_SKU";
                sql += " ,ORDER_SKU";
                sql += " FROM FAMILY_SKU";

                tx.executeSql(sql, [],
                    (tx1, results) => {
                        callback(results);
                    },
                    (tx2, err) => {
                        if (err.code !== 0) {
                            callbackError(<Operacion>{ codigo: err.code, mensaje: `Error al obtener familias de skus: ${err.message}` });
                        }
                    }
                );
            },
            (err: SqlError) => {
                callbackError(<Operacion>{ codigo: err.code, mensaje: `Error al obtener familias de skus: ${err.message}` });
            }
        );
    }

    obtenerSkuParaVenta(cliente: Cliente, sku: Sku, configuracionDecimales: ManejoDeDecimales, callback: (listaSkus: Sku[]) => void, callbackError: (reultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = " SELECT DISTINCT ";
                sql += " A.SKU";
                sql += " ,A.SKU_NAME ";
                sql += " ,0 AS IS_KIT ";
                sql += " ,IFNULL(PLS.PRICE,0) AS COST ";
                sql += " ,A.ON_HAND ";
                sql += " ,0 AS REQUERIES_SERIE ";
                sql += " ,A.CODE_FAMILY_SKU ";
                sql += " ,FS.DESCRIPTION_FAMILY_SKU ";
                sql += " ,IH.QTY";
                sql += " ,A.HANDLE_DIMENSION";
                sql += " ,A.OWNER";
                sql += " ,A.OWNER_ID";
                sql += " FROM SKUS A ";
                sql += " LEFT JOIN FAMILY_SKU FS ON (FS.CODE_FAMILY_SKU = A.CODE_FAMILY_SKU)";
                sql += " INNER JOIN PRICE_LIST_BY_SKU_PACK_SCALE PLS ON (PLS.CODE_SKU = A.SKU)";
                sql += " INNER JOIN PACK_CONVERSION PC ON (PC.CODE_SKU = PLS.CODE_SKU )";
                sql += " INNER JOIN ITEM_HISTORY IH ON (IH.CODE_SKU = PLS.CODE_SKU AND IH.CODE_PACK_UNIT = PLS.CODE_PACK_UNIT)";
                sql += ` WHERE (PLS.CODE_PRICE_LIST = '${cliente.priceListId}' OR PLS.CODE_PRICE_LIST = '${cliente.priceListId}')`;
                sql += " AND PLS.PRIORITY = 0 AND LOW_LIMIT = 1 AND PC.ORDER = 1";
                if (cliente.skus !== "") {
                    sql += " AND A.SKU NOT IN (" + cliente.skus + ") ";
                }
                if (sku.codeFamilySku !== "ALL") {
                    sql += `AND A.CODE_FAMILY_SKU = ${sku.codeFamilySku}`;
                }
                sql += "ORDER BY A.SKU_NAME ";
                tx.executeSql(sql, [],
                    (tx1: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length >= 1) {
                            var listaSkusTemp: Sku[] = [];
                            for (var i = 0; i < results.rows.length; i++) {
                                var skuTemp: any = results.rows.item(i);
                                var sku = new Sku();
                                sku.sku = skuTemp.SKU;
                                sku.skuName = skuTemp.SKU_NAME;
                                sku.isKit = skuTemp.IS_KIT;
                                sku.cost = trunc_number(skuTemp.COST, configuracionDecimales.defaultCalculationsDecimals);
                                sku.onHand = trunc_number(skuTemp.ON_HAND, configuracionDecimales.defaultCalculationsDecimals);
                                sku.requieresSerie = skuTemp.REQUERIES_SERIE;
                                sku.codeFamilySku = skuTemp.CODE_FAMILY_SKU;
                                sku.descriptionFamilySku = skuTemp.DESCRIPTION_FAMILY_SKU;
                                sku.lastQtySold = skuTemp.QTY;
                                sku.handleDimension = skuTemp.HANDLE_DIMENSION;
                                sku.owner = skuTemp.OWNER;
                                sku.ownerId = skuTemp.OWNER_ID;

                                listaSkusTemp.push(sku);
                            }
                            callback(listaSkusTemp);
                        } else {
                            var operacion = new Operacion();
                            operacion.resultado = ResultadoOperacionTipo.Error;
                            operacion.codigo = 0;
                            operacion.mensaje = "No se encontraron sku para venta.";
                            callbackError(operacion);
                        }
                    }
                );
            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener sku para venta: " + err.message });
            }
        );
    }

    obtenerSkuParaPreVenta(cliente: Cliente, sku: Sku, configuracionDecimales: ManejoDeDecimales,opcionDeOrdenamiento: string, tipoDeOrdenamiento: string, callback: (listaSkus: Sku[]) => void, callbackError: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = " SELECT DISTINCT";
                sql += " SP.SKU";
                sql += " ,SP.SKU_NAME";
                sql += " ,SP.ON_HAND";
                sql += " ,SP.IS_COMITED";
                sql += " ,SP.DIFFERENCE";
                sql += " ,IFNULL(PLS.PRICE,0) AS COST";
                sql += " ,SP.CODE_FAMILY_SKU";
                sql += " ,FS.DESCRIPTION_FAMILY_SKU";
                sql += " ,IFNULL(IH.QTY,0) AS LAST_QTY_SOLD";
                sql += " ,SP.ON_HAND - SP.IS_COMITED AVAILABLE";
                sql += " ,SP.HANDLE_DIMENSION";
                sql += " ,SP.OWNER";
                sql += " ,SP.OWNER_ID";
                sql += " FROM SKU_PRESALE SP";
                sql += " LEFT JOIN FAMILY_SKU FS ON (FS.CODE_FAMILY_SKU = SP.CODE_FAMILY_SKU)";
                sql += " INNER JOIN PRICE_LIST_BY_SKU_PACK_SCALE PLS ON (PLS.CODE_SKU = SP.SKU)";
                sql += " INNER JOIN PACK_CONVERSION PC ON (PC.CODE_SKU = PLS.CODE_SKU AND PC.CODE_PACK_UNIT_FROM = PLS.CODE_PACK_UNIT)";
                sql += ` LEFT JOIN ITEM_HISTORY IH ON(IH.CODE_SKU = SP.SKU AND IH.CODE_CUSTOMER = '${cliente.clientId}' AND DOC_TYPE = '` + TIpoDeDocumento.PreVenta + `' )`;
                sql += ` WHERE PLS.CODE_PRICE_LIST = '${cliente.priceListId}'`;
                sql += ` AND SP.WAREHOUSE = '${localStorage.getItem("PRESALE_WHS")}'`;
                sql += " AND PLS.PRIORITY = 0 AND LOW_LIMIT = 1 AND PC.[ORDER] = 1";

                if (cliente.skus !== "") {
                    sql += ` AND SP.SKU NOT IN (${cliente.skus}) `;
                }

                if (sku.codeFamilySku !== "ALL") {
                    sql += ` AND SP.CODE_FAMILY_SKU = '${sku.codeFamilySku}'`;
                }

                sql += " ORDER BY " + opcionDeOrdenamiento + " " + tipoDeOrdenamiento;
                console.log(sql);

                tx.executeSql(sql, [],
                    (tx1: SqlTransaction, results: SqlResultSet) => {
                        var listaSkusTemp: Sku[] = [];
                        for (var i = 0; i < results.rows.length; i++) {
                            var skuTemp: any = results.rows.item(i);
                            var isku = new Sku();

                            isku.sku = skuTemp.SKU;
                            isku.skuName = skuTemp.SKU_NAME;
                            isku.skuDescription = skuTemp.SKU_NAME;
                            isku.onHand = trunc_number(skuTemp.ON_HAND, configuracionDecimales.defaultCalculationsDecimals);
                            isku.isComited = trunc_number(skuTemp.IS_COMITED, configuracionDecimales.defaultCalculationsDecimals);
                            isku.difference = trunc_number(skuTemp.DIFFERENCE, configuracionDecimales.defaultCalculationsDecimals);
                            isku.cost = trunc_number(skuTemp.COST, configuracionDecimales.defaultCalculationsDecimals);
                            isku.codeFamilySku = skuTemp.CODE_FAMILY_SKU;
                            isku.descriptionFamilySku = skuTemp.DESCRIPTION_FAMILY_SKU;
                            isku.lastQtySold = trunc_number(skuTemp.LAST_QTY_SOLD, configuracionDecimales.defaultCalculationsDecimals);
                            isku.qty = 0;
                            isku.total = 0;
                            isku.available = trunc_number(skuTemp.AVAILABLE, configuracionDecimales.defaultCalculationsDecimals);
                            isku.handleDimension = skuTemp.HANDLE_DIMENSION;
                            isku.owner = skuTemp.OWNER;
                            isku.ownerId = skuTemp.OWNER_ID;

                            listaSkusTemp.push(isku);
                        }
                        callback(listaSkusTemp);
                    }
                );
            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: err.code, mensaje: `Error al obtener sku para preventa: ${err.message}` });
            }
        );
    }

    obtenerSkuParaTomaInventario(codeFamilySku: string, callback: (listaSkus: Sku[]) => void, callbackError: (reultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            tx => {
                var sql = "SELECT DISTINCT";
                sql += " SP.SKU";
                sql += " ,SP.SKU_NAME ";
                sql += " ,SP.CODE_FAMILY_SKU";
                sql += " ,FS.DESCRIPTION_FAMILY_SKU";
                sql += " FROM SKU_PRESALE SP";
                sql += " LEFT JOIN FAMILY_SKU FS";
                sql += " ON (FS.CODE_FAMILY_SKU= SP.CODE_FAMILY_SKU)";
                sql += " LEFT JOIN";
                sql += " (SELECT DISTINCT";
                sql += " A.SKU";
                sql += " ,A.SKU_NAME";
                sql += " ,A.CODE_FAMILY_SKU";
                sql += " ,FS.DESCRIPTION_FAMILY_SKU";
                sql += " FROM SKUS A";
                sql += " LEFT JOIN FAMILY_SKU FS";
                sql += " ON (FS.CODE_FAMILY_SKU = A.CODE_FAMILY_SKU)";
                sql += " )AS B ON (SP.SKU= B.SKU)";
                if (codeFamilySku !== "ALL") {
                    sql += ` WHERE SP.CODE_FAMILY_SKU = '${codeFamilySku}'`;
                    sql += ` OR B.CODE_FAMILY_SKU = '${codeFamilySku}'`;
                }
                tx.executeSql(sql, [],
                    (tx1, results) => {
                        var listaSkuTemp: Sku[] = [];
                        for (var i = 0; i < results.rows.length; i++) {
                            var skuTemp: any = results.rows.item(i);
                            var sku = new Sku();
                            sku.sku = skuTemp.SKU;
                            sku.skuName = skuTemp.SKU_NAME;
                            sku.codeFamilySku = skuTemp.CODE_FAMILY_SKU;
                            sku.descriptionFamilySku = skuTemp.DESCRIPTION_FAMILY_SKU;
                            listaSkuTemp.push(sku);
                        }

                        callback(listaSkuTemp);
                    },
                    (tx2, err) => {
                        if (err.code !== 0) {
                            callbackError(<Operacion>{ codigo: err.code, mensaje: `Error al obtener familias de skus: ${err.message}` });
                        }
                    }
                );
            },
            (err: SqlError) => {
                callbackError(<Operacion>{ codigo: err.code, mensaje: `Error al obtener familias de skus: ${err.message}` });
            }
        );
    }

    obtenerSkuDesdeServidor(sku: string, callbackError: (reultado: Operacion) => void) {
        try {
            var data = {
                'sku': sku,
                'dbuser': gdbuser,
                'dbuserpass': gdbuserpass,
                'routeid': gCurrentRoute
            };
            if (gIsOnline === EstaEnLinea.Si) {
                socket.emit("GetSkuByFilterForTakeInventory", data);
            } else {
                var option = new Operacion();
                option.codigo = -1;
                option.mensaje = "Debe estar en linea para buscar el SKU en el Servidor.";
                callbackError(option);
            }
        } catch (e) {
            var exception = new Operacion();
            exception.codigo = -1;
            exception.mensaje = e.message;
            callbackError(exception);
        }
    }

    obtenerSkuPorUnidad(sku: Sku, callback: (listaSkus: Sku[]) => void, callbackError: (reultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            tx => {
                var sql = " SELECT DISTINCT ";
                sql += " SP.SKU";
                sql += ", SP.SKU_NAME";
                sql += ", SP.ON_HAND";
                sql += ", SP.IS_COMITED";
                sql += ", SP.DIFFERENCE";
                sql += ", SP.CODE_FAMILY_SKU";
                sql += " FROM SKU_PRESALE SP";
            },
            (err: SqlError) => {
                callbackError(<Operacion>{ codigo: err.code, mensaje: `Error al obtener sku por unidad: ${err.message}` });
            }
        );
    }

    verificarCantidadDeSkusDisponiblesParaCliente(cliente: Cliente, callBack: (cantidadSkus: number, clienteRespuesta: Cliente) => void, errorCallBack: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            tx => {
                var sql = " SELECT SKUPS.SKU ";
                sql += " FROM CLIENTS C ";
                sql += " INNER JOIN PRICE_LIST_BY_SKU_PACK_SCALE PLSKU ON PLSKU.CODE_PRICE_LIST = CAST(C.PRICE_LIST_ID as text)";
                sql += " INNER JOIN SKU_PRESALE SKUPS ON SKUPS.SKU = PLSKU.CODE_SKU";                               
                sql += ` WHERE C.CLIENT_ID = '${cliente.clientId}'`;
                tx.executeSql(sql, [],
                    (tx1, results) => {
                        var clienteResp: Cliente = cliente;
                        callBack(results.rows.length, clienteResp);
                    },
                    (tx2, err) => {
                        if (err.code !== 0) {
                            errorCallBack(<Operacion>{ codigo: err.code, mensaje: `Error al verificar cantidad de sku disponibles para cliente : ${err.message}` });
                        }
                    }
                );


            },
            (err: SqlError) => {
                errorCallBack(<Operacion>{ codigo: err.code, mensaje: `Error al verificar cantidad de sku disponibles para cliente: ${err.message}` });
            }
        );
    }
}