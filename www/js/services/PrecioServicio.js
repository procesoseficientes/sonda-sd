
function ObtenerListaDePreciosDeCliente(customerId, callBack, errCalback) {
    var pSql = null;
    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                pSql = "SELECT CODE_PRICE_LIST FROM TASK WHERE RELATED_CLIENT_CODE = '" + customerId + "'";
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

function ObtenerSkusPorListaDePrecios(priceListId, callBack, errCalback) {
    var productos = Array();

    try {
        var configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
        configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (configuracionDecimales) {
            SONDA_DB_Session.transaction(
                function (tx) {

                    var sql = [];

                    sql.push("SELECT");
                    sql.push("	A.SKU");
                    sql.push("	, A.SKU_NAME");
                    sql.push("	, 0 AS IS_KIT");
                    sql.push("	, A.ON_HAND");
                    sql.push("	, A.REQUERIES_SERIE");
                    sql.push("	, PLS.CODE_PACK_UNIT");
                    sql.push("	, PUS.DESCRIPTION_CODE_PACK_UNIT");
                    sql.push("  , A.SALES_PACK_UNIT");
                    sql.push("  , A.CODE_PACK_UNIT_STOCK");
                    sql.push("  ,(SELECT ((UPPER(A.SALES_PACK_UNIT) != UPPER(PLS.CODE_PACK_UNIT)) OR (UPPER(A.CODE_PACK_UNIT_STOCK) != UPPER(PLS.CODE_PACK_UNIT)))) AS REDUCE_TO_STOCK_UNIT");
                    sql.push(" FROM SKUS A ");
                    sql.push(" INNER JOIN PRICE_LIST_BY_SKU_PACK_SCALE PLS ON( PLS.CODE_SKU = A.SKU)");
                    sql.push(" INNER JOIN PACK_UNIT_BY_SKU PUS ON( PUS.CODE_PACK_UNIT = PLS.CODE_PACK_UNIT ) ");
                    sql.push(" INNER JOIN PACK_CONVERSION PC ON( PC.CODE_SKU = A.SKU AND UPPER(PC.CODE_PACK_UNIT_TO) = UPPER(A.SALES_PACK_UNIT) AND UPPER(PC.CODE_PACK_UNIT_FROM) = UPPER(A.CODE_PACK_UNIT_STOCK)) ");
                    sql.push(" WHERE PLS.CODE_PRICE_LIST ='" + priceListId + "'");
                    sql.push(" AND A.SKU NOT IN(SELECT IV.SKU FROM INVOICE_DETAIL AS IV WHERE INVOICE_NUM = -9999)");
                    sql.push(" AND PLS.LOW_LIMIT = 1");
                    sql.push(" ORDER BY A.SKU_NAME");

                    console.log(sql.join(""));

                    tx.executeSql(sql.join(""),
                        [],
                        function (tx, results) {
                            if (results.rows.length > 0) {

                                for (var i = 0; i < results.rows.length; i++) {
                                    if (parseFloat(format_number(results.rows.item(i).ON_HAND, 2)) > 0) {
                                        var detalleProducto = {
                                            SKU: results.rows.item(i).SKU,
                                            SKU_NAME: results.rows.item(i).SKU_NAME,
                                            IS_KIT: results.rows.item(i).IS_KIT,
                                            ON_HAND: trunc_number(results.rows.item(i).ON_HAND, configuracionDecimales.defaultDisplayDecimalsForSkuQty),
                                            REQUERIES_SERIE: results.rows.item(i).REQUERIES_SERIE,
                                            CODE_PACK_UNIT: results.rows.item(i).CODE_PACK_UNIT,
                                            DESCRIPTION_CODE_PACK_UNIT: results.rows.item(i).DESCRIPTION_CODE_PACK_UNIT,
                                            SALES_PACK_UNIT: results.rows.item(i).SALES_PACK_UNIT,
                                            CODE_PACK_UNIT_STOCK: results.rows.item(i).CODE_PACK_UNIT_STOCK,
                                            REDUCE_TO_STOCK_UNIT: results.rows.item(i).REDUCE_TO_STOCK_UNIT,
                                            SKU_PRICE: 0,
                                            MEASURE_UNITS: []
                                        };
                                        productos.push(detalleProducto);
                                    }
                                }
                                if (productos.length === 0) {
                                    errCalback({
                                        message:
                                            "No se encontraron SKU's, por favor, verifique el inventario y vuelva a intentar."
                                    });
                                } else {

                                    ObtenerUnidadesDeMedidaDeProductosPorListaDePrecios(tx,
                                        productos,
                                        0,
                                        priceListId,
                                        function (listaDeProductosCompletos) {
                                            console.dir(listaDeProductosCompletos);
                                            callBack(listaDeProductosCompletos, configuracionDecimales);
                                        },
                                        errCalback);
                                }
                            } else {
                                errCalback({
                                    message: "No se encontraron SKUs para la lista de precios: " + priceListId
                                });
                            }
                        },
                        function (err) {
                            if (err.code !== 0) {
                                errCalback(err); //"No se pudo ejecutar la sentencia debido al siguiente error: " +
                            }
                        }
                    );
                },
                function (err) {
                    if (err.code !== 0) {
                        errCalback(err); //"No se pudo ejecutar la transaccion debido al siguiente error: " +
                    }
                }
            );
        });

    } catch (e) {
        errCalback(e);//"No se pudo obtener la lista de SKUs de la Lista de Precios proporcionada, debido al siguiente error: " +
    }
}

function ObtenerUnidadesDeMedidaDeProductosPorListaDePrecios(transaccionActual, listadoDeProductos, indiceDeProductoActual, codigoDeListaDePrecios, callback, errorCallback) {

    try {
        if (indiceDeProductoActual < listadoDeProductos.length) {
            var sql = [];
            var productoActual = listadoDeProductos[indiceDeProductoActual];

            sql.push("SELECT PLS.CODE_PACK_UNIT, PLS.PRIORITY, PLS.LOW_LIMIT, PLS.HIGH_LIMIT, PLS.PRICE, PC.CONVERSION_FACTOR , PC.[ORDER]");
            sql.push(" FROM PRICE_LIST_BY_SKU_PACK_SCALE PLS");
            sql.push(" INNER JOIN PACK_CONVERSION PC ON(PC.CODE_SKU = PLS.CODE_SKU AND PC.CODE_PACK_UNIT_TO = PLS.CODE_PACK_UNIT)");
            sql.push(" WHERE PLS.CODE_PRICE_LIST = '" + codigoDeListaDePrecios + "'");
            sql.push(" AND PLS.CODE_SKU = '" + productoActual.SKU + "'");

            transaccionActual.executeSql(sql.join(""),
                [],
                function (transResult, results) {
                    sql.length = 0;
                    if (results.rows.length > 0) {
                        for (var i = 0; i < results.rows.length; i++) {
                            productoActual.MEASURE_UNITS.push(results.rows.item(i));
                        }
                        listadoDeProductos[indiceDeProductoActual] = productoActual;
                    }
                    ObtenerUnidadesDeMedidaDeProductosPorListaDePrecios(transResult,
                        listadoDeProductos,
                        (indiceDeProductoActual + 1),
                        codigoDeListaDePrecios,
                        callback,
                        errorCallback);
                },
                function (transResult, error) {
                    console.log("Error al intentar obtener los precios de los productos => " + error.message);
                    errorCallback({
                        message: "Error al intentar obtener los precios de los productos."
                    });
                });

        } else {
            callback(listadoDeProductos);
        }
    } catch (e) {
        console.log("Error al intentar obtener los precios de los productos => " + e.message);
        errorCallback({
            message: "Error al intentar obtener los precios de los productos."
        });
    }
}

function ObtenerSkuPorListaDePrecios(priceListId, codeSku, callBack, errorCallBack, indice) {
    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                var pSql = "";
                pSql = "SELECT A.SKU";
                pSql += ", A.SKU_NAME";
                pSql += ", 0 AS IS_KIT";
                pSql += ", IFNULL(PLS.COST,0) AS SKU_PRICE";
                pSql += ", A.ON_HAND";
                pSql += ", A.REQUERIES_SERIE";
                pSql += " FROM SKUS A";
                pSql += " INNER JOIN PRICE_LIST_BY_SKU PLS ON(PLS.CODE_SKU = A.SKU )";
                pSql += " WHERE PLS.CODE_PRICE_LIST ='" + priceListId + "' AND PLS.CODE_SKU='" + codeSku.SKU + "' ";
                pSql += " ORDER BY SKU_NAME";
                tx.executeSql(pSql, [],
                    function (tx, results) {
                        if (results.rows.length > 0) {
                            callBack(results.rows.item(0), indice, codeSku);
                        } else {
                            errorCallBack("No se encontraro el SKU en la lista de precios: " + priceListId + " por favor, verifique y vuelva a intentar.");
                        }
                    },
                    function (err) {
                        if (err.code !== 0) {
                            errorCallBack("No se pudo ejecutar la sentencia debido al siguiente error: " + err.message);
                        }
                    }
                );
            },
            function (err) {
                if (err.code !== 0) {
                    errorCallBack("No se pudo ejecutar la sentencia debido al siguiente error: " + err.message);
                }
            }
        );
    } catch (e) {
        errorCallBack("No se ha podido obtener el precio para el sku seleccionado debido a: " + e.message);
    }
}