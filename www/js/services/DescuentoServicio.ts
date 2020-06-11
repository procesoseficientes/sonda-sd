class DescuentoServicio implements IDescuentoServicio {

    obtenerDescuentosPorCliente(cliente: Cliente, callback: (listaDeDescuentos: Array<Descuento>) => void, callbackError: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = "SELECT";
                sql += " DLS.DISCOUNT_LIST_ID";
                sql += " ,DLS.CODE_SKU";
                sql += " ,DLS.DISCOUNT";
                sql += " FROM DISCOUNT_LIST_BY_SKU DLS";
                sql += " WHERE DLS.DISCOUNT_LIST_ID = " + cliente.discountListId;
                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        let listaDeDescuentos = new Array<Descuento>();
                        for (var i = 0; i < results.rows.length; i++) {
                            let descuentoSql: any = results.rows.item(i);
                            let descuento = new Descuento();
                            descuento.discountListId = descuentoSql.DISCOUNT_LIST_ID;
                            descuento.codeSku = descuentoSql.CODE_SKU;
                            descuento.discount = descuentoSql.DISCOUNT;                           
                            listaDeDescuentos.push(descuento);
                        }
                        callback(listaDeDescuentos);
                    }
                );

            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener los descuentos: " + err.message });
            }
        );
    }

    obtenerDescuentosPorClienteSku(cliente: Cliente, sku: Sku, callback: (listaDeDescuentos: Array<DescuentoPorEscalaSku>) => void, callbackError: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                let listaDeEjecucion: string[] = [];
                listaDeEjecucion.push("SELECT");
                listaDeEjecucion.push(" DLS.DISCOUNT_LIST_ID");
                listaDeEjecucion.push(" ,DLS.CODE_SKU");
                listaDeEjecucion.push(" ,DLS.PACK_UNIT");
                listaDeEjecucion.push(" ,DLS.LOW_LIMIT");
                listaDeEjecucion.push(" ,DLS.HIGH_LIMIT");
                listaDeEjecucion.push(" ,DLS.DISCOUNT");
                listaDeEjecucion.push(" ,PU.CODE_PACK_UNIT");
                listaDeEjecucion.push(" ,DLS.DISCOUNT_TYPE");
                listaDeEjecucion.push(" ,DLS.PROMO_ID");
                listaDeEjecucion.push(" ,DLS.PROMO_NAME");
                listaDeEjecucion.push(" ,DLS.PROMO_TYPE");
                listaDeEjecucion.push(" ,DLS.FREQUENCY");
                listaDeEjecucion.push(" FROM DISCOUNT_LIST_BY_SKU DLS");
                listaDeEjecucion.push(" INNER JOIN PACK_UNIT PU ON DLS.PACK_UNIT = PU.PACK_UNIT");
                listaDeEjecucion.push(` WHERE DLS.DISCOUNT_LIST_ID = ${cliente.discountListId}`);
                listaDeEjecucion.push(` AND DLS.CODE_SKU = '${sku.sku}'`);

                tx.executeSql(listaDeEjecucion.join(''), [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        let listaDeDescuentos = new Array<DescuentoPorEscalaSku>();
                        for (let i = 0; i < results.rows.length; i++) {
                            let descuentoSql: any = results.rows.item(i);
                            let descuento = new DescuentoPorEscalaSku();

                            descuento.discountListId = descuentoSql.DISCOUNT_LIST_ID;
                            descuento.codeSku = descuentoSql.CODE_SKU;
                            descuento.codePackUnit = descuentoSql.CODE_PACK_UNIT;
                            descuento.packUnit = descuentoSql.PACK_UNIT;    
                            descuento.lowLimit = descuentoSql.LOW_LIMIT;  
                            descuento.highLimit = descuentoSql.HIGH_LIMIT;  
                            descuento.discount = descuentoSql.DISCOUNT;
                            descuento.discountType = descuentoSql.DISCOUNT_TYPE;
                            descuento.promoId = descuentoSql.PROMO_ID;
                            descuento.promoName = descuentoSql.PROMO_NAME;
                            descuento.promoType = descuentoSql.PROMO_TYPE;
                            descuento.frequency = descuentoSql.FREQUENCY;
                            listaDeDescuentos.push(descuento);
                            descuento = null;
                            descuentoSql = null;
                        }
                        callback(listaDeDescuentos);
                        listaDeDescuentos = null;
                    }
                );
                listaDeEjecucion = null;
            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: -1, mensaje: `Error al obtener los descuentos: ${err.message}` });
            }
        );
    }

    obtenerDescuentoPorMontoGeneral(cliente: Cliente, total: number,callback: (descuentoPorMontoGeneral: DescuentoPorMontoGeneral) => void, callbackError: (resultado: Operacion) => void) {
        SONDA_DB_Session.transaction(
            (tx) => {
                var sql = "SELECT";
                sql += " DLGA.DISCOUNT_LIST_ID";
                sql += " ,DLGA.LOW_AMOUNT";
                sql += " ,DLGA.HIGH_AMOUNT";
                sql += " ,DLGA.DISCOUNT";
                sql += " ,DLGA.PROMO_ID";
                sql += " ,DLGA.PROMO_NAME";
                sql += " ,DLGA.PROMO_TYPE";
                sql += " ,DLGA.FREQUENCY";
                sql += " FROM DISCOUNT_LIST_BY_GENERAL_AMOUNT DLGA";
                sql += " WHERE DLGA.DISCOUNT_LIST_ID = " + cliente.discountListId;
                sql += " AND " + total + " BETWEEN DLGA.LOW_AMOUNT AND DLGA.HIGH_AMOUNT";

                tx.executeSql(sql, [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        let descuentoPorMontoGeneral = new DescuentoPorMontoGeneral();
                        for (var i = 0; i < results.rows.length; i++) {
                            let descuentoSql: any = results.rows.item(i);
                            let descuento = new DescuentoPorMontoGeneral();

                            descuento.discountListId = descuentoSql.DISCOUNT_LIST_ID;
                            descuento.lowAmount = descuentoSql.LOW_AMOUNT;
                            descuento.highAmount = descuentoSql.HIGH_AMOUNT;
                            descuento.discount = descuentoSql.DISCOUNT;
                            descuento.promoId = descuentoSql.PROMO_ID;
                            descuento.promoName = descuentoSql.PROMO_NAME;
                            descuento.promoType = descuentoSql.PROMO_TYPE;
                            descuento.frequency = descuentoSql.FREQUENCY;
                            descuento.apply = true;

                            descuentoPorMontoGeneral = descuento;
                        }
                        callback(descuentoPorMontoGeneral);
                    }
                );

            }, (err: SqlError) => {
                callbackError(<Operacion>{ codigo: -1, mensaje: "Error al obtener los descuentos por monto general: " + err.message });
            }
        );
    }
}