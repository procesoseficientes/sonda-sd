var VentasPorMultiploServicio = (function () {
    function VentasPorMultiploServicio() {
    }
    VentasPorMultiploServicio.prototype.verificarVentasPorMultiploSkuUm = function (cliente, sku, callBack, errorCallBack) {
        var op = new Operacion();
        var ventaPorMultiplo = new VentaPorMultiplo();
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var listaDeLi = [];
                listaDeLi.push("SELECT");
                listaDeLi.push(" M.SALES_BY_MULTIPLE_LIST_ID");
                listaDeLi.push(" ,M.CODE_SKU");
                listaDeLi.push(" ,M.CODE_PACK_UNIT");
                listaDeLi.push(" ,M.MULTIPLE");
                listaDeLi.push(" ,M.PROMO_ID");
                listaDeLi.push(" ,M.PROMO_NAME");
                listaDeLi.push(" ,M.PROMO_TYPE");
                listaDeLi.push(" ,M.FREQUENCY");
                listaDeLi.push(" FROM SKU_SALES_BY_MULTIPLE_LIST_BY_SKU AS M");
                listaDeLi.push(" INNER JOIN CLIENTS AS C ON(C.SALES_BY_MULTIPLE_LIST_ID = M.SALES_BY_MULTIPLE_LIST_ID)");
                listaDeLi.push(" WHERE M.CODE_SKU = '" + sku.sku + "' ");
                listaDeLi.push(" AND M.CODE_PACK_UNIT = '" + sku.unidadMedidaSeleccionada + "'");
                listaDeLi.push(" AND C.CLIENT_ID = '" + cliente.clientId + "'");
                tx.executeSql(listaDeLi.join(''), [], function (txRes, results) {
                    if (results.rows.length > 0) {
                        var ventaMultiploSql = results.rows.item(0);
                        ventaPorMultiplo.codeSku = ventaMultiploSql.CODE_SKU;
                        ventaPorMultiplo.codePackUnit = ventaMultiploSql.CODE_PACK_UNIT;
                        ventaPorMultiplo.multiple = parseInt(ventaMultiploSql.MULTIPLE);
                        ventaPorMultiplo.promoId = ventaMultiploSql.PROMO_ID;
                        ventaPorMultiplo.promoName = ventaMultiploSql.PROMO_NAME;
                        ventaPorMultiplo.promoType = ventaMultiploSql.PROMO_TYPE;
                        ventaPorMultiplo.frequency = ventaMultiploSql.FREQUENCY;
                        ventaPorMultiplo.apply = true;
                        callBack(ventaPorMultiplo);
                    }
                    else {
                        ventaPorMultiplo.codeSku = sku.sku;
                        ventaPorMultiplo.codePackUnit = sku.codePackUnit;
                        ventaPorMultiplo.multiple = 0;
                        ventaPorMultiplo.apply = false;
                        callBack(ventaPorMultiplo);
                    }
                }, function (txRes, error) {
                    op.codigo = error.code;
                    op.mensaje = error.message;
                    op.resultado = ResultadoOperacionTipo.Error;
                    errorCallBack(op);
                });
            }, function (error) {
                op.codigo = -1;
                op.mensaje = error.message;
                op.resultado = ResultadoOperacionTipo.Error;
                errorCallBack(op);
            });
        }
        catch (e) {
            op.codigo = -1;
            op.mensaje = e.message;
            op.resultado = ResultadoOperacionTipo.Error;
            errorCallBack(op);
        }
    };
    VentasPorMultiploServicio.prototype.validarSiTieneVentaPorMultiplo = function (cliente, sku, paquete, control, callback, errCallback) {
        try {
            if (paquete === null || paquete === undefined) {
                callback(false, paquete, control);
            }
            else {
                SONDA_DB_Session.transaction(function (trans) {
                    var listaDeLi = [];
                    listaDeLi.push("SELECT SM.SALES_BY_MULTIPLE_LIST_ID");
                    listaDeLi.push(" FROM SKU_SALES_BY_MULTIPLE_LIST_BY_SKU SM");
                    listaDeLi.push(" WHERE SM.SALES_BY_MULTIPLE_LIST_ID = " + cliente.salesByMultipleListId);
                    listaDeLi.push(" AND SM.CODE_SKU = '" + sku.sku + "'");
                    listaDeLi.push(" AND SM.CODE_PACK_UNIT = '" + paquete.codePackUnit + "'");
                    trans.executeSql(listaDeLi.join(''), [], function (tx, results) {
                        if (results.rows.length > 0) {
                            callback(true, paquete, control);
                        }
                        else {
                            callback(false, paquete, control);
                        }
                    });
                }, function (error) {
                    var operacion = new Operacion();
                    operacion.codigo = -1;
                    operacion.mensaje = error.message;
                    console.log(operacion);
                    errCallback(operacion);
                });
            }
        }
        catch (e) {
            var operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = "Error al obtneer si usa multiplo: " + e.message;
            console.log(operacion.mensaje);
            errCallback(operacion);
        }
    };
    VentasPorMultiploServicio.prototype.obtenerVentaPorMultiploDeSkuConUnidadDeMedida = function (cliente, sku, unidadDeMedida, control, callback, errCallback) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                var listaDeLi = [];
                listaDeLi.push("SELECT SM.MULTIPLE");
                listaDeLi.push(" FROM SKU_SALES_BY_MULTIPLE_LIST_BY_SKU SM");
                listaDeLi.push(" WHERE SM.SALES_BY_MULTIPLE_LIST_ID = " + cliente.salesByMultipleListId);
                listaDeLi.push(" AND SM.CODE_SKU = '" + sku + "'");
                listaDeLi.push(" AND SM.CODE_PACK_UNIT = '" + unidadDeMedida + "'");
                trans.executeSql(listaDeLi.join(''), [], function (tx, results) {
                    if (results.rows.length > 0) {
                        var ventaPorMultiplo = results.rows.item(0);
                        callback(ventaPorMultiplo.MULTIPLE, control);
                    }
                    else {
                        callback(1, control);
                    }
                });
            }, function (error) {
                var operacion = new Operacion();
                operacion.codigo = -1;
                operacion.mensaje = error.message;
                console.log(operacion);
                errCallback(operacion);
            });
        }
        catch (e) {
            var operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = "Error al obtener el mutilplo: " + e.message;
            console.log(operacion.mensaje);
            errCallback(operacion);
        }
    };
    return VentasPorMultiploServicio;
}());
//# sourceMappingURL=VentasPorMultiploServicio.js.map