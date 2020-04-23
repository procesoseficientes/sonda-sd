var PrecioEspecialServicio = (function () {
    function PrecioEspecialServicio() {
    }
    PrecioEspecialServicio.prototype.obtenerHistoricoDePromosParaCliente = function (cliente, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var listaParaEjecucion = [];
            listaParaEjecucion.push("SELECT");
            listaParaEjecucion.push(" MAX([HP].[HISTORY_DATETIME]) HISTORY_DATETIME");
            listaParaEjecucion.push(" , [HP].[PROMO_ID]");
            listaParaEjecucion.push(" , [HP].[FREQUENCY]");
            listaParaEjecucion.push(" FROM HISTORY_BY_PROMO HP");
            listaParaEjecucion.push(" WHERE CODE_CUSTOMER = '" + cliente.clientId + "'");
            listaParaEjecucion.push(" GROUP BY [HP].[PROMO_ID], [HP].[FREQUENCY]");
            tx.executeSql(listaParaEjecucion.join(""), [], function (tx, results) {
                var listaHistoricaDePromos = [];
                for (var i = 0; i < results.rows.length; i++) {
                    var registroPorComboSql = results.rows.item(i);
                    var historicoDePromo = new Promo();
                    var fecha = void 0;
                    fecha = new Date(registroPorComboSql.HISTORY_DATETIME);
                    fecha.setHours(0);
                    fecha.setMinutes(0);
                    fecha.setSeconds(0);
                    fecha.setMilliseconds(0);
                    historicoDePromo.historyDateTime = fecha;
                    fecha = null;
                    historicoDePromo.promoId = registroPorComboSql.PROMO_ID;
                    historicoDePromo.frequency = registroPorComboSql.FREQUENCY;
                    listaHistoricaDePromos.push(historicoDePromo);
                    historicoDePromo = null;
                    registroPorComboSql = null;
                }
                callback(listaHistoricaDePromos);
                listaHistoricaDePromos = null;
            });
            listaParaEjecucion = null;
        }, function (err) {
            callbackError({
                codigo: -1,
                mensaje: "Error al obtener el historico de promos: " + err.message
            });
        });
    };
    PrecioEspecialServicio.prototype.validarSiAplicaElPrecioEspecial = function (lista, indiceDeListaDeDescuento, listaHistoricoDePromos, callBack, errCallback) {
        var _this = this;
        try {
            if (listaHistoricoDePromos.length > 0) {
                if (this.listaDePreciosEspecialesTerminoDeIterar(lista, indiceDeListaDeDescuento)) {
                    var descuentoAValidar_1 = lista[indiceDeListaDeDescuento];
                    var resultadoDePromoHistorico_1 = listaHistoricoDePromos.find(function (promo) {
                        return promo.promoId === descuentoAValidar_1.promoId;
                    });
                    if (resultadoDePromoHistorico_1) {
                        var promoDeDescuento = new Promo();
                        promoDeDescuento.promoId = descuentoAValidar_1.promoId;
                        promoDeDescuento.promoName = descuentoAValidar_1.promoName;
                        promoDeDescuento.frequency = descuentoAValidar_1.frequency;
                        this.validarSiAplicaPromo(promoDeDescuento, resultadoDePromoHistorico_1, function (aplicaDescuento) {
                            if (!aplicaDescuento) {
                                lista = lista.filter(function (descuento) {
                                    return (resultadoDePromoHistorico_1.promoId !== descuento.promoId);
                                });
                            }
                            _this.validarSiAplicaElPrecioEspecial(lista, indiceDeListaDeDescuento + (aplicaDescuento ? 1 : 0), listaHistoricoDePromos, function (lista) {
                                callBack(lista);
                            }, function (resultado) {
                                errCallback(resultado);
                            });
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                        promoDeDescuento = null;
                    }
                    else {
                        this.validarSiAplicaElPrecioEspecial(lista, indiceDeListaDeDescuento + 1, listaHistoricoDePromos, function (lista) {
                            callBack(lista);
                        }, function (resultado) {
                            errCallback(resultado);
                        });
                    }
                }
                else {
                    callBack(lista);
                }
            }
            else {
                callBack(lista);
            }
        }
        catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: "Error al validar si aplica el descuento por familia y tipo pago: " + ex.message
            });
        }
    };
    PrecioEspecialServicio.prototype.listaDePreciosEspecialesTerminoDeIterar = function (lista, indiceDeLista) {
        return lista.length > 0 && lista.length > indiceDeLista;
    };
    PrecioEspecialServicio.prototype.validarSiAplicaPromo = function (promo, promoHistorico, callback, callbackError) {
        try {
            promoHistorico.historyDateTime.setHours(0);
            promoHistorico.historyDateTime.setMinutes(0);
            promoHistorico.historyDateTime.setSeconds(0);
            promoHistorico.historyDateTime.setMilliseconds(0);
            var cantidadDeDias = 0;
            switch (promo.frequency) {
                case TipoPeriodicidadDePromo.Siempre.toString():
                    callback(true);
                    break;
                case TipoPeriodicidadDePromo.Unica.toString():
                    callback(false);
                    break;
                case TipoPeriodicidadDePromo.PorDia.toString():
                    var fechaActual = new Date();
                    fechaActual.setHours(0);
                    fechaActual.setMinutes(0);
                    fechaActual.setSeconds(0);
                    fechaActual.setMilliseconds(0);
                    if (promoHistorico.historyDateTime < fechaActual) {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                    fechaActual = null;
                    break;
                case TipoPeriodicidadDePromo.PorSemana.toString():
                    cantidadDeDias = 7;
                    break;
                case TipoPeriodicidadDePromo.PorMes.toString():
                    cantidadDeDias = 30;
                    break;
            }
            if (cantidadDeDias > 0) {
                this.obtenerFechaParaCompararLaPromo(cantidadDeDias, function (fecha) {
                    if (promoHistorico.historyDateTime <= fecha) {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                }, function (resultado) {
                    callbackError(resultado);
                });
            }
        }
        catch (ex) {
            callbackError({
                codigo: -1,
                mensaje: "Error al validar si aplica promo: " + ex.message
            });
        }
    };
    PrecioEspecialServicio.prototype.obtenerFechaParaCompararLaPromo = function (diasARestar, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var listaParaEjecucion = [];
            listaParaEjecucion.push("SELECT DateTime('Now', 'LocalTime', '-" + diasARestar + " Day') AS DATE_PROMO");
            tx.executeSql(listaParaEjecucion.join(""), [], function (tx, results) {
                if (results.rows.length > 0) {
                    var registroPorComboSql = results.rows.item(0);
                    var fecha = void 0;
                    fecha = new Date(registroPorComboSql.DATE_PROMO);
                    fecha.setHours(0);
                    fecha.setMinutes(0);
                    fecha.setSeconds(0);
                    fecha.setMilliseconds(0);
                    callback(fecha);
                    fecha = null;
                    registroPorComboSql = null;
                }
                else {
                    callbackError({
                        codigo: -1,
                        mensaje: "No se pudo obtener la fecha para la comparaci\u00F3n."
                    });
                }
            });
            listaParaEjecucion = null;
        }, function (err) {
            callbackError({
                codigo: -1,
                mensaje: "Error al obtener fecha para compara la p de promo: " + err.message
            });
        });
    };
    PrecioEspecialServicio.prototype.obtenerPreciosEspecialesPorCliente = function (qty, cliente, sku, callback, callbackError) {
        var _this = this;
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT";
            sql += " PLS.SPECIAL_PRICE_LIST_ID";
            sql += " ,PLS.CODE_SKU";
            sql += " ,PU.CODE_PACK_UNIT";
            sql += " ,PLS.LOW_LIMIT";
            sql += " ,PLS.HIGH_LIMIT";
            sql += " ,PLS.SPECIAL_PRICE";
            sql += " ,PLS.PROMO_ID";
            sql += " ,PLS.PROMO_NAME";
            sql += " ,PLS.PROMO_TYPE";
            sql += " ,PLS.FREQUENCY";
            sql += " ,PLS.APPLY_DISCOUNT";
            sql += " FROM SPECIAL_PRICE_LIST_BY_SCALE PLS";
            sql += " INNER JOIN PACK_UNIT PU";
            sql += " ON(PLS.PACK_UNIT = PU.PACK_UNIT)";
            sql +=
                " WHERE PLS.SPECIAL_PRICE_LIST_ID = " + cliente.spcialPriceListId;
            if (qty > 0) {
                sql += " AND " + qty + " BETWEEN PLS.LOW_LIMIT AND PLS.HIGH_LIMIT";
            }
            if (sku.sku !== "") {
                sql += " AND PLS.CODE_SKU = '" + sku.sku + "'";
            }
            if (sku.codePackUnit !== "") {
                sql += " AND PU.CODE_PACK_UNIT = '" + sku.codePackUnit + "'";
            }
            tx.executeSql(sql, [], function (tx, results) {
                var listaDePreciosEspeciales = new Array();
                for (var i = 0; i < results.rows.length; i++) {
                    var pricioEspecialSql = results.rows.item(i);
                    var pricioEspecial = new PrecioEspecial();
                    pricioEspecial.spcialPriceListId =
                        pricioEspecialSql.SPECIAL_PRICE_LIST_ID;
                    pricioEspecial.codeSku = pricioEspecialSql.CODE_SKU;
                    pricioEspecial.codePackUnit = pricioEspecialSql.CODE_PACK_UNIT;
                    pricioEspecial.lowLimit = pricioEspecialSql.LOW_LIMIT;
                    pricioEspecial.highLimit = pricioEspecialSql.HIGH_LIMIT;
                    pricioEspecial.specialPrice = pricioEspecialSql.SPECIAL_PRICE;
                    pricioEspecial.promoId = pricioEspecialSql.PROMO_ID;
                    pricioEspecial.promoName = pricioEspecialSql.PROMO_NAME;
                    pricioEspecial.promoType = pricioEspecialSql.PROMO_TYPE;
                    pricioEspecial.frequency = pricioEspecialSql.FREQUENCY;
                    pricioEspecial.applyDiscount =
                        pricioEspecialSql.APPLY_DISCOUNT === 1;
                    listaDePreciosEspeciales.push(pricioEspecial);
                }
                _this.obtenerHistoricoDePromosParaCliente(cliente, function (listaHistoricoDePromos) {
                    _this.validarSiAplicaElPrecioEspecial(listaDePreciosEspeciales, 0, listaHistoricoDePromos, function (listaDePreciosEspecialesResultado) {
                        callback(listaDePreciosEspecialesResultado);
                    }, function (resultado) {
                        callbackError(resultado);
                    });
                }, function (resultado) {
                    callbackError(resultado);
                });
            });
        }, function (err) {
            callbackError({
                codigo: -1,
                mensaje: "Error al obtener los precios especiales: " + err.message
            });
        });
    };
    return PrecioEspecialServicio;
}());
//# sourceMappingURL=PrecioEspecialServicio.js.map