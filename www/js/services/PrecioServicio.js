
function ObtenerListaDePreciosDeCliente(customerId, callBack, errCalback) {
    var pSql = null;
    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                pSql = "SELECT CODE_PRICE_LIST FROM PRICE_LIST_BY_CUSTOMER WHERE CODE_CUSTOMER = '" + customerId + "'";
                tx.executeSql(pSql, [],
                    function (tx, results) {
                        if (results.rows.length > 0 && results.rows.item(0).CODE_PRICE_LIST !== null) {
                            callBack(results.rows.item(0).CODE_PRICE_LIST);
                            pSql = null;
                        } else {
                            callBack(localStorage.getItem("gDefaultPriceList"));
                            pSql = null;
                        }
                    },
                    function (err) {
                        pSql = null;
                        if (err.code !== 0) {
                            errCalback(err);//"No se pudo ejecutar la sentencia debido al siguiente error: " +
                        }
                    }
                );
            },
            function (err) {
                pSql = null;
                if (err.code !== 0) {
                    errCalback(err);//"No se pudo ejecutar la transaccion debido al siguiente error: " +
                }
            }
        );

    } catch (e) {
        pSql = null;
        errCalback(e);//"No se pudo obtener la lista de precios del cliente, debido al siguiente error: "
    }
}

function ObtenerSkusPorListaDePrecios(priceListId,tareaTipo,tipoFamiliaSku, callBack, errCalback) {
    var productos = Array();

    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                var pSql = "";

                if (tareaTipo === TareaTipo.Venta) {
                    pSql = " SELECT DISTINCT A.SKU";
                    pSql += ",A.SKU_NAME ";
                    pSql += ",0 AS IS_KIT ";
                    pSql += ",IFNULL(PLS.COST,0) AS COST ";
                    pSql += ",A.ON_HAND ";
                    pSql += ",0 AS REQUERIES_SERIE ";
                    pSql += ",A.CODE_FAMILY_SKU ";
                    pSql += ",FS.DESCRIPTION_FAMILY_SKU ";
                    pSql += ",IFNULL(IH.QTY,0) AS LAST_QTY_SOLD ";
                    pSql += "FROM SKUS A ";
                    pSql += "LEFT JOIN FAMILY_SKU FS ON(FS.CODE_FAMILY_SKU = A.CODE_FAMILY_SKU ) ";
                    pSql += "INNER JOIN PRICE_LIST_BY_SKU PLS ON(PLS.CODE_SKU = A.SKU ) ";
                    pSql += "LEFT JOIN ITEM_HISTORY IH ON(IH.CODE_SKU = A.SKU AND IH.CODE_CUSTOMER = '" +
                       gClientID + "') ";
                    pSql += "WHERE (PLS.CODE_PRICE_LIST ='" + priceListId + "' OR PLS.CODE_PRICE_LIST = '" + priceListId + "') ";
                    if (tipoFamiliaSku !== "ALL") {
                        pSql += "AND A.CODE_FAMILY_SKU = '" + tipoFamiliaSku + "' ";
                    }
                    pSql += "ORDER BY A.SKU_NAME ";
                } else if(tareaTipo === TareaTipo.Preventa){
                    pSql = " SELECT DISTINCT SP.SKU";
                    pSql += ", SP.SKU_NAME";
                    pSql += ", SP.ON_HAND";
                    pSql += ", SP.IS_COMITED";
                    pSql += ", SP.DIFFERENCE";
                    pSql += ", IFNULL(PLS.COST,0) AS COST";
                    pSql += ", SP.CODE_FAMILY_SKU";
                    pSql += ", FS.DESCRIPTION_FAMILY_SKU";
                    pSql += ", IFNULL(IH.QTY,0) AS LAST_QTY_SOLD";
                    pSql += " FROM SKU_PRESALE SP";
                    pSql += " LEFT JOIN FAMILY_SKU FS ON (FS.CODE_FAMILY_SKU = SP.CODE_FAMILY_SKU)";
                    pSql += " LEFT JOIN PRICE_LIST_BY_SKU PLS ON(PLS.CODE_SKU = SP.SKU)";
                    pSql += " LEFT JOIN ITEM_HISTORY IH ON(IH.CODE_SKU = SP.SKU AND IH.CODE_CUSTOMER = '" +
                       gClientID + "') ";
                    pSql += " WHERE SKU NOT IN (SELECT DISTINCT SKU FROM SALES_ORDER_DETAIL WHERE  SALES_ORDER_ID = -9999) ";
                    if (tipoFamiliaSku !== "ALL") {
                        pSql += " AND SP.CODE_FAMILY_SKU = '" + tipoFamiliaSku + "'";
                    }
                    pSql += " AND (PLS.CODE_PRICE_LIST = '" + priceListId + "' OR PLS.CODE_PRICE_LIST = '" + priceListId + "') ";
                    pSql += " ORDER BY SKU_NAME";
                }

                tx.executeSql(pSql, [],
                    function (tx, results) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                if (results.rows.item(i).ON_HAND > 0 && results.rows.item(i).COST > 0) {
                                    var detalleProducto = {
                                        SKU: results.rows.item(i).SKU,
                                        SKU_NAME: results.rows.item(i).SKU_NAME,
                                        ON_HAND: results.rows.item(i).ON_HAND,
                                        IS_COMITED: results.rows.item(i).IS_COMITED,
                                        DIFFERENCE: results.rows.item(i).DIFFERENCE,
                                        COST: results.rows.item(i).COST,
                                        CODE_FAMILY_SKU: results.rows.item(i).CODE_FAMILY_SKU,
                                        LAST_QTY_SOLD: results.rows.item(i).LAST_QTY_SOLD
                                    };
                                    productos.push(detalleProducto);
                                }
                            }
                            callBack(productos, tareaTipo);
                            
                        } else {
                            errCalback({ message: "No se encontraron SKUs para la lista de precios: " + priceListId });
                            
                        }
                    },
                    function (err) {
                       
                        if (err.code !== 0) {
                            errCalback(err);//"No se pudo ejecutar la sentencia debido al siguiente error: " +
                        }
                    }
                );
            },
            function (err) {
                
                if (err.code !== 0) {
                    errCalback(err);//"No se pudo ejecutar la transaccion debido al siguiente error: " +
                }
            }
        );

    } catch (e) {
        
        errCalback(e);//"No se pudo obtener la lista de SKUs de la Lista de Precios proporcionada, debido al siguiente error: " +
    }
}
