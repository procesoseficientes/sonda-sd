var SerieServicio = (function() {
    function SerieServicio()
    {
        
    }

    SerieServicio.prototype.ObtenerSeriesPorSku = function(sku, callBack, errorCallBack) {
        try {
            var sql = "";
            var series = new Array();
            SONDA_DB_Session.transaction(
                function(trans) {
                    sql = "SELECT S.SKU" +
                        ", S.IMEI" +
                        ", S.SERIE" +
                        ", S.PHONE" +
                        ", S.ICC" +
                        ", S.STATUS" +
                        ", S.LOADED_LAST_UPDATED";
                    sql += " FROM SKU_SERIES AS S";
                    sql += " WHERE S.SKU = '" + sku + "'  AND S.STATUS = 0";
                    console.log(sql);
                    trans.executeSql(sql, []
                        , function(transResult, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                series.push(results.rows.item(i));
                            }
                            callBack(series);
                        }, function(transResult, error) {
                            if (error.code !== 0) {
                                console.log("Error al intentar obtener las series por sku debido a: " + error.message);
                                errorCallBack(error.message);
                            }
                        });
                }
                , function(error) {
                    if (error.code !== 0) {
                        console.log("Error al intentar obtener las series por sku debido a: " + error.message);
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            console.log("Error al intentar obtener las series por sku debido a: " + e.message);
            errorCallBack(e.message);
        } 
    };

    SerieServicio.prototype.ActualizarEstadoDeSerie = function (sku, series, status, callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    for (var i = 0; i < series.length; i++) {
                        var serie = series[i];
                        sql = "UPDATE SKU_SERIES SET STATUS = " + parseInt(status) + " WHERE SKU = '" + sku + "' AND SERIE = '" + serie + "'";
                        console.log(sql);
                        trans.executeSql(sql);
                    }
                    callBack();
                }
                , function (error) {
                    if (error.code !== 0) {
                        console.log("Error al intentar obtener las series por sku debido a: " + error.message);
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            console.log("Error al intentar obtener las series por sku debido a: " + e.message);
            errorCallBack(e.message);
        }
    };

    SerieServicio.prototype.AgregarSkusAlDetalleDeFactura = function (sku, skuName ,qtySku, skuPrice, series, callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {

                    for (var i = 0; i < series.length; i++) {
                        var serie = series[i];
                        sql = "INSERT INTO INVOICE_DETAIL(" +
                            "INVOICE_NUM, " +
                            "SKU, " +
                            "SKU_NAME, " +
                            "QTY, " +
                            "PRICE, " +
                            "DISCOUNT, " +
                            "TOTAL_LINE, " +
                            "REQUERIES_SERIE, " +
                            "SERIE, " +
                            "SERIE_2, " +
                            "IS_ACTIVE, " +
                            "COMBO_REFERENCE, " +
                            "LINE_SEQ) ";
                        sql += " VALUES(" +
                            "-9999" +
                            ",'" + sku + "'" +
                            ",'" + skuName + "'" +
                            ", " + 1 +
                            ", " + parseFloat(skuPrice) +
                            ", 0" +
                            ", " + parseFloat(skuPrice) + "" +
                            ", 1" +
                            ", '" + serie + "'" +
                            ", 0" + 
                            "," + 1 +
                            ", '" + sku + "' "+
                            ","+ i +")";

                        console.log(sql);
                        trans.executeSql(sql);
                    }

                    callBack(sku);

                    }, function(error) {
                        if (error.code !== 0) {
                            console.log("Error al intentar obtener las series por sku debido a: " + error.message);
                            errorCallBack(error.message);
                        }
                    });
        } catch (e) {
            console.log("Error al intentar obtener las series por sku debido a: " + e.message);
            errorCallBack(e.message);
        }
    };

    return SerieServicio;
}());