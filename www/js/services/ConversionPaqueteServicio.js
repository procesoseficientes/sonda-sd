var residuoUnidad = 0;

function ObtenerDescripcionDeUnidadMasPequeña(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function(tx) {
            var sql = "SELECT P.DESCRIPTION_PACK_UNIT";
            sql += " FROM PACK_UNIT P";
            sql += " ORDER BY P.PRIORITY";

            tx.executeSql(sql, [],
                function(tx, results) {
                    callback(results.rows.item(0).DESCRIPTION_PACK_UNIT);
                }, function(tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
        function(err) {
            errCallBack(err);
        });
}

function ValidarSkuEnConversionDePaquetes(codeSku, cantidad, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT C.CODE_SKU";
            sql += " FROM PACK_CONVERSION C";
            sql += " WHERE C.CODE_SKU = '" + codeSku + "'";

            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length > 0) {
                        callback(1, codeSku, cantidad);
                    } else {
                        callback(0, codeSku, cantidad);
                    }
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
        function (err) {
            errCallBack(err);
        });
}

function ObtenerSelectDeConversionDePaquetes(codeSku, callback) {
    var sql = "SELECT";
    sql += " C.CODE_SKU";
    sql += " ,C.CODE_PACK_UNIT_FROM";
    sql += " ,U1.DESCRIPTION_PACK_UNIT DESCRIPTION_PACK_UNIT_FROM";
    sql += " ,C.CODE_PACK_UNIT_TO";
    sql += " ,U2.DESCRIPTION_PACK_UNIT DESCRIPTION_PACK_UNIT_TO";
    sql += " ,U1.PRIORITY";
    sql += " ,C.CONVERSION_FACTOR";
    sql += " FROM PACK_CONVERSION C";
    sql += " INNER JOIN PACK_UNIT U1 ON (C.CODE_PACK_UNIT_FROM = U1.CODE_PACK_UNIT)";
    sql += " INNER JOIN PACK_UNIT U2 ON (C.CODE_PACK_UNIT_TO = U2.CODE_PACK_UNIT)";
    sql += " WHERE C.CODE_SKU = '" + codeSku + "'";
    sql += " AND U1.PRIORITY > U2.PRIORITY";
    sql += " ORDER BY U1.PRIORITY";

    callback(sql);
}

function ObtenerConversionDePaquetes(conversionesDePaquetes, codeSku, callback, errCallback) {
    try {
        SONDA_DB_Session.transaction(
        function (tx) {
            ObtenerSelectDeConversionDePaquetes(codeSku, function(sql) {
                tx.executeSql(sql, [],
                    function(tx, results) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var conversion = {
                                CodeSku: results.rows.item(i).CODE_SKU,
                                CodePackUnitFrom: results.rows.item(i).CODE_PACK_UNIT_FROM,
                                DescriptionPackUnitFrom: results.rows.item(i).DESCRIPTION_PACK_UNIT_FROM,
                                CodePackUnitTo: results.rows.item(i).CODE_PACK_UNIT_TO,
                                DescriptionPackUnitTo: results.rows.item(i).DESCRIPTION_PACK_UNIT_TO,
                                Priority: results.rows.item(i).PRIORITY,
                                ConversionFactor: results.rows.item(i).CONVERSION_FACTOR,
                                Qty: 0
                            };
                            conversionesDePaquetes.push(conversion);
                        }
                        callback(conversionesDePaquetes);
                    }, function(tx, err) {
                        if (err.code !== 0)
                            errCallback(err);
                    }
                );
            });
        },
       function (err) {
           errCallback(err);
       });
    } catch (e) {
        errCallback({ code: 0, message: e.message });
    }
}

function ObtenerCocienteYResiduo(cantidad, factorDeConversion, callback, errCallback) {
    try {
        var residuo = cantidad % factorDeConversion;
        var cociente = (cantidad - residuo) / factorDeConversion;

        callback(cociente, residuo);
    } catch (e) {
        errCallback(e);
    } 
}

function ObtenerCantidadDeDenominacion(conversionesDePaquetes, cantidad, index, callback, errCallback) {
    if (conversionesDePaquetes.length > index) {
        ObtenerCocienteYResiduo(cantidad, conversionesDePaquetes[index].ConversionFactor, function (cociente, residuo) {
            if (index === 0) {
                residuoUnidad = residuo;
            } else {
                conversionesDePaquetes[index - 1].Qty = residuo;
            }
            conversionesDePaquetes[index].Qty = cociente;
            ObtenerCantidadDeDenominacion(conversionesDePaquetes, cociente, index + 1, function() {
                callback(conversionesDePaquetes);
            }, function(err) {
                errCallback(err);
            });
        }, function (err) {
            errCallback(err);
        });
    } else {
        callback(conversionesDePaquetes);
    }
}

function ObtenerDeMayorAMenorDenominacion(codeSku, cantidad, callback, errCallback) {
    var conversionesDePaquetes = Array();

    ObtenerConversionDePaquetes(conversionesDePaquetes, codeSku, function (conversionesDePaquetesN1) {
        conversionesDePaquetes[0].Qty = cantidad;
        ObtenerCantidadDeDenominacion(conversionesDePaquetesN1, cantidad, 0, function (conversionesDePaquetes) {
            ObtenerDescripcionDeUnidadMasPequeña(function (descripcion) {
                callback(conversionesDePaquetes, residuoUnidad, descripcion);
            }, function(err) {
                errCallback(err);
            });
        }, function (err) {
            errCallback(err);
        });
    }, function (err) {
        errCallback(err);
    });
}