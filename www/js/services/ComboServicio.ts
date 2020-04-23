
class ComboServicio implements IComboServicio {
    obtenerSkusDeCombo(bonoPorCombo: BonoPorCombo, callback: (bonoPorComboConSkusDeCombo: BonoPorCombo) => void, callbackError: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = "SELECT DISTINCT";
                sql += " SC.COMBO_ID";
                sql += " ,SC.CODE_SKU";
                sql += " ,SC.CODE_PACK_UNIT";
                sql += " ,P.DESCRIPTION_PACK_UNIT";
                sql += " ,SC.QTY";
                sql += " FROM SKU_BY_COMBO SC";
                sql += " INNER JOIN PACK_UNIT P";
                sql += " ON (SC.CODE_PACK_UNIT = P.CODE_PACK_UNIT)";
                sql += " WHERE SC.COMBO_ID = " + bonoPorCombo.comboId;
                sql += " ORDER BY SC.COMBO_ID";
                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        let skusPorCombo = new Array<SkuPorCombo>();
                        for (var i = 0; i < results.rows.length; i++) {
                            let skusPorComboSql: any = results.rows.item(i);
                            let skuPorCombo = new SkuPorCombo();

                            skuPorCombo.comboId = skusPorComboSql.COMBO_ID;
                            skuPorCombo.codeSku = skusPorComboSql.CODE_SKU;
                            skuPorCombo.codePackUnit = skusPorComboSql.CODE_PACK_UNIT;
                            skuPorCombo.descriptionPackUnit = skusPorComboSql.DESCRIPTION_PACK_UNIT;
                            skuPorCombo.qty = skusPorComboSql.QTY;

                            skusPorCombo.push(skuPorCombo);
                        }

                        bonoPorCombo.skusPorCombo = skusPorCombo;
                        callback(bonoPorCombo);
                    }
                );
            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener los sku del combo: " + err.message });
            }
        );
    }

    obtenerSkusDeComboParaBonificar(bonoPorCombo: BonoPorCombo, callback: (bonoPorComboConSkusDeBonificacion: BonoPorCombo) => void, callbackError: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = "SELECT DISTINCT";
                sql += " BLCS.BONUS_LIST_ID";
                sql += " ,BLCS.COMBO_ID";
                sql += " ,BLCS.CODE_SKU";
                sql += " ,S.SKU_NAME DESCRIPTION_SKU";
                sql += " ,BLCS.CODE_PACK_UNIT";
                sql += " ,P.DESCRIPTION_PACK_UNIT";
                sql += " ,BLCS.QTY";
                sql += " ,BLCS.IS_MULTIPLE";
                sql += " ,S.OWNER";
                sql += " ,S.OWNER_ID";
                sql += " FROM BONUS_LIST_BY_COMBO_SKU BLCS";
                sql += " INNER JOIN SKU_PRESALE S";
                sql += " ON (BLCS.CODE_SKU = S.SKU)";
                sql += " INNER JOIN PACK_UNIT P";
                sql += " ON (BLCS.CODE_PACK_UNIT = P.CODE_PACK_UNIT)";
                sql += " WHERE BLCS.BONUS_LIST_ID = " + bonoPorCombo.bonusListId;
                sql += " AND BLCS.COMBO_ID = " + bonoPorCombo.comboId;
                sql += " ORDER BY BLCS.BONUS_LIST_ID,BLCS.COMBO_ID";
                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        let skusDeBonoPorCombo = new Array<SkuDeBonoPorCombo>();
                        for (var i = 0; i < results.rows.length; i++) {
                            let skusDeBonoPorComboSql: any = results.rows.item(i);
                            let skuDeBonoPorCombo = new SkuDeBonoPorCombo();

                            skuDeBonoPorCombo.bonusListId = skusDeBonoPorComboSql.BONUS_LIST_ID;
                            skuDeBonoPorCombo.comboId = skusDeBonoPorComboSql.COMBO_ID;
                            skuDeBonoPorCombo.codeSku = skusDeBonoPorComboSql.CODE_SKU;
                            skuDeBonoPorCombo.descriptionSku = skusDeBonoPorComboSql.DESCRIPTION_SKU;
                            skuDeBonoPorCombo.codePackUnit = skusDeBonoPorComboSql.CODE_PACK_UNIT;
                            skuDeBonoPorCombo.descriptionPackUnit = skusDeBonoPorComboSql.DESCRIPTION_PACK_UNIT;
                            skuDeBonoPorCombo.qty = skusDeBonoPorComboSql.QTY;
                            skuDeBonoPorCombo.isCheacked = false;
                            skuDeBonoPorCombo.selectedQty = 0;
                            skuDeBonoPorCombo.isMultiple = (skusDeBonoPorComboSql.IS_MULTIPLE === 1);
                            skuDeBonoPorCombo.originalQty = skusDeBonoPorComboSql.QTY;
                            skuDeBonoPorCombo.owner = skusDeBonoPorComboSql.OWNER;
                            skuDeBonoPorCombo.ownerId = skusDeBonoPorComboSql.OWNER_ID;

                            skusDeBonoPorCombo.push(skuDeBonoPorCombo);
                        }

                        bonoPorCombo.skusDeBonoPorCombo = skusDeBonoPorCombo;
                        callback(bonoPorCombo);
                    }
                );
            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener el bonificaciones del combo: " + err.message });
            }
        );
    }

    obtenerReglasDeBonificacionDeCombosPorCliente(cliente: Cliente, callback: (clienteConCombos: Cliente) => void, callbackError: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction(
            (tx) => {
                let listaParaEjecucion: string [] = [];
                listaParaEjecucion.push("SELECT DISTINCT");
                listaParaEjecucion.push(" BLC.BONUS_LIST_ID");
                listaParaEjecucion.push(" ,BLC.COMBO_ID");
                listaParaEjecucion.push(" ,BLC.BONUS_TYPE");
                listaParaEjecucion.push(" ,BLC.BONUS_SUB_TYPE");
                listaParaEjecucion.push(" ,BLC.IS_BONUS_BY_LOW_PURCHASE");
                listaParaEjecucion.push(" ,BLC.IS_BONUS_BY_COMBO");
                listaParaEjecucion.push(" ,BLC.LOW_QTY");
                listaParaEjecucion.push(" ,C.NAME_COMBO");
                listaParaEjecucion.push(" ,C.DESCRIPTION_COMBO");
                listaParaEjecucion.push(" ,BLC.PROMO_ID");
                listaParaEjecucion.push(" ,BLC.PROMO_NAME");
                listaParaEjecucion.push(" ,BLC.PROMO_TYPE");
                listaParaEjecucion.push(" ,BLC.FREQUENCY");
                listaParaEjecucion.push(" FROM BONUS_LIST_BY_COMBO BLC");
                listaParaEjecucion.push(" INNER JOIN COMBO C ");
                listaParaEjecucion.push(" ON (C.COMBO_ID = BLC.COMBO_ID)");
                listaParaEjecucion.push(` WHERE BLC.BONUS_LIST_ID = ${cliente.bonusListId}`);
                listaParaEjecucion.push(" ORDER BY BLC.COMBO_ID");
                tx.executeSql(listaParaEjecucion.join(''), [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        let listaDeBonos = new Array<BonoPorCombo>();
                        for (var i = 0; i < results.rows.length; i++) {
                            let bonoPorComboSql: any = results.rows.item(i);
                            let bonoPorCombo = new BonoPorCombo();

                            bonoPorCombo.bonusListId = bonoPorComboSql.BONUS_LIST_ID;
                            bonoPorCombo.comboId = bonoPorComboSql.COMBO_ID;
                            bonoPorCombo.bonusType = bonoPorComboSql.BONUS_TYPE;
                            bonoPorCombo.bonusSubType = bonoPorComboSql.BONUS_SUB_TYPE;
                            bonoPorCombo.isBonusByLowPurchase = bonoPorComboSql.IS_BONUS_BY_LOW_PURCHASE;
                            bonoPorCombo.isBonusByCombo = bonoPorComboSql.IS_BONUS_BY_COMBO;
                            bonoPorCombo.lowQty = bonoPorComboSql.LOW_QTY;
                            bonoPorCombo.nameCombo = bonoPorComboSql.NAME_COMBO;
                            bonoPorCombo.descriptionCombo = bonoPorComboSql.DESCRIPTION_COMBO;
                            bonoPorCombo.isConfig = false;
                            bonoPorCombo.isEmpty = (bonoPorCombo.bonusSubType === SubTipoDeBonificacionPorCombo.Unica.toString());
                            bonoPorCombo.promoId = bonoPorComboSql.PROMO_ID;
                            bonoPorCombo.promoName = bonoPorComboSql.PROMO_NAME;
                            bonoPorCombo.promoType = bonoPorComboSql.PROMO_TYPE;
                            bonoPorCombo.frequency = bonoPorComboSql.FREQUENCY;
                            bonoPorCombo.skusPorCombo = [];
                            bonoPorCombo.skusDeBonoPorCombo = [];
                            bonoPorCombo.skusDeBonoPorComboAsociados = [];
                           
                            listaDeBonos.push(bonoPorCombo);
                        }

                        cliente.bonoPorCombos = listaDeBonos;
                        callback(cliente);
                    }
                );
                listaParaEjecucion = null;
            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener el bonificaciones por combo del cliente: " + err.message });
            }
        );
    }

    formarBonificacionPorCombo(cliente: Cliente, index: number, callback: (clienteConCombos: Cliente) => void, callbackError: (resultado: Operacion) => void): void {
        try {
            if (index < cliente.bonoPorCombos.length) {
                this.obtenerSkusDeCombo(cliente.bonoPorCombos[index], (bonoPorComboConSkusDeCombo: BonoPorCombo) => {
                    this.obtenerSkusDeComboParaBonificar(bonoPorComboConSkusDeCombo, (bonoPorComboConSkusDeBonificacion: BonoPorCombo) => {
                        cliente.bonoPorCombos[index] = bonoPorComboConSkusDeBonificacion;

                        this.formarBonificacionPorCombo(cliente, index + 1, (clienteConCombos: Cliente) => {
                            callback(clienteConCombos);
                        }, (resultado: Operacion) => {
                            callbackError(resultado);
                        });

                    }, (resultado: Operacion) => {
                        callbackError(resultado);
                    });
                }, (resultado: Operacion) => {
                    callbackError(resultado);
                });
            } else {
                callback(cliente);
            }
        }
        catch (e) {
            var operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = e.message;
            console.log(operacion.mensaje);
            callbackError(operacion);
        }
    }

    obtenerCombosPorCliente(cliente: Cliente, callback: (clienteConCombos: Cliente) => void, callbackError: (resultado: Operacion) => void): void {
        try {
            this.obtenerReglasDeBonificacionDeCombosPorCliente(cliente, (clienteConCombos: Cliente) => {
                this.formarBonificacionPorCombo(clienteConCombos, 0, (clienteConCombosFormados: Cliente) => {
                    callback(clienteConCombosFormados);
                }, (resultado: Operacion) => {
                    callbackError(resultado);
                });
            }, (resultado: Operacion) => {
                callbackError(resultado);
            });
        }
        catch (e){
            var operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = e.message;
            console.log(operacion.mensaje);
            callbackError(operacion);
        }
        
    }
}