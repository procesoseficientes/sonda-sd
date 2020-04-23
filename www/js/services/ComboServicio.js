var ComboServicio = (function () {
    function ComboServicio() {
    }
    ComboServicio.prototype.obtenerSkusDeCombo = function (bonoPorCombo, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
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
            tx.executeSql(sql, [], function (tx, results) {
                var skusPorCombo = new Array();
                for (var i = 0; i < results.rows.length; i++) {
                    var skusPorComboSql = results.rows.item(i);
                    var skuPorCombo = new SkuPorCombo();
                    skuPorCombo.comboId = skusPorComboSql.COMBO_ID;
                    skuPorCombo.codeSku = skusPorComboSql.CODE_SKU;
                    skuPorCombo.codePackUnit = skusPorComboSql.CODE_PACK_UNIT;
                    skuPorCombo.descriptionPackUnit = skusPorComboSql.DESCRIPTION_PACK_UNIT;
                    skuPorCombo.qty = skusPorComboSql.QTY;
                    skusPorCombo.push(skuPorCombo);
                }
                bonoPorCombo.skusPorCombo = skusPorCombo;
                callback(bonoPorCombo);
            });
        }, function (err) {
            callbackError({ codigo: -1, mensaje: "Error al obtener los sku del combo: " + err.message });
        });
    };
    ComboServicio.prototype.obtenerSkusDeComboParaBonificar = function (bonoPorCombo, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
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
            tx.executeSql(sql, [], function (tx, results) {
                var skusDeBonoPorCombo = new Array();
                for (var i = 0; i < results.rows.length; i++) {
                    var skusDeBonoPorComboSql = results.rows.item(i);
                    var skuDeBonoPorCombo = new SkuDeBonoPorCombo();
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
            });
        }, function (err) {
            callbackError({ codigo: -1, mensaje: "Error al obtener el bonificaciones del combo: " + err.message });
        });
    };
    ComboServicio.prototype.obtenerReglasDeBonificacionDeCombosPorCliente = function (cliente, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var listaParaEjecucion = [];
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
            listaParaEjecucion.push(" WHERE BLC.BONUS_LIST_ID = " + cliente.bonusListId);
            listaParaEjecucion.push(" ORDER BY BLC.COMBO_ID");
            tx.executeSql(listaParaEjecucion.join(''), [], function (tx, results) {
                var listaDeBonos = new Array();
                for (var i = 0; i < results.rows.length; i++) {
                    var bonoPorComboSql = results.rows.item(i);
                    var bonoPorCombo = new BonoPorCombo();
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
            });
            listaParaEjecucion = null;
        }, function (err) {
            callbackError({ codigo: -1, mensaje: "Error al obtener el bonificaciones por combo del cliente: " + err.message });
        });
    };
    ComboServicio.prototype.formarBonificacionPorCombo = function (cliente, index, callback, callbackError) {
        var _this = this;
        try {
            if (index < cliente.bonoPorCombos.length) {
                this.obtenerSkusDeCombo(cliente.bonoPorCombos[index], function (bonoPorComboConSkusDeCombo) {
                    _this.obtenerSkusDeComboParaBonificar(bonoPorComboConSkusDeCombo, function (bonoPorComboConSkusDeBonificacion) {
                        cliente.bonoPorCombos[index] = bonoPorComboConSkusDeBonificacion;
                        _this.formarBonificacionPorCombo(cliente, index + 1, function (clienteConCombos) {
                            callback(clienteConCombos);
                        }, function (resultado) {
                            callbackError(resultado);
                        });
                    }, function (resultado) {
                        callbackError(resultado);
                    });
                }, function (resultado) {
                    callbackError(resultado);
                });
            }
            else {
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
    };
    ComboServicio.prototype.obtenerCombosPorCliente = function (cliente, callback, callbackError) {
        var _this = this;
        try {
            this.obtenerReglasDeBonificacionDeCombosPorCliente(cliente, function (clienteConCombos) {
                _this.formarBonificacionPorCombo(clienteConCombos, 0, function (clienteConCombosFormados) {
                    callback(clienteConCombosFormados);
                }, function (resultado) {
                    callbackError(resultado);
                });
            }, function (resultado) {
                callbackError(resultado);
            });
        }
        catch (e) {
            var operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = e.message;
            console.log(operacion.mensaje);
            callbackError(operacion);
        }
    };
    return ComboServicio;
}());
//# sourceMappingURL=ComboServicio.js.map