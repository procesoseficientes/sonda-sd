function ObtenerSkuDevolucion(callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT *  ";
             sql += " FROM SKUS ";
             sql += " WHERE ON_HAND > 0";
             sql += " ORDER BY SKU";
    
             tx.executeSql(sql, [],
                 function (tx, results) {
                     callback(results);
                 },
                 function (tx, err) {
                     if (err.code !== 0)
                         errCallBack(err);
                 }
             );
         },
         function (err) {
             errCallBack(err);
         }
    );
}

function EnviarDevolucionSku(listaSku, callback, errCallBack) {
    try {
        var data = {
            'routeid': gCurrentRoute
            ,'batt': gBatteryLevel
            ,'dbuser': gdbuser
            , 'dbuserpass': gdbuserpass
            ,'codeWarehouse': gDefaultWhs
            , 'FromWarehouse': ""
            ,'loginid': gLastLogin
            , 'Detalle': listaSku
            , 'codeWarehouseReturn': gRouteReturnWarehouse
            , 'CardCode': ""
            , 'status': "IN_PROGRESS"
            , 'DocEntry': 0
        };
        SocketControlador.socketIo.emit("SendReturnSku", data);
        callback();
        
    } catch (e) {
        errCallBack(e);
    } 
}

function ValidarDevolucionSku(idRouteReturnHeader, status, callback, errCallBack) {
    try {
        var data = {
            'routeid': gCurrentRoute
            , 'batt': gBatteryLevel
            , 'dbuser': gdbuser
            , 'dbuserpass': gdbuserpass
            , 'default_warehouse': gDefaultWhs
            , 'loginid': gLastLogin
            , 'route_return_warehouse': gRouteReturnWarehouse
            , 'idRouteReturnHeader': idRouteReturnHeader
            , 'status': status
        };
        SocketControlador.socketIo.emit("ValidateReturnSku", data);
        callback();
    } catch (e) {
        errCallBack(e);
    }
}

function UpdateInventoriSkuDevolucion(callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "UPDATE  SKUS SET";
             sql += " ON_HAND = 0";

             tx.executeSql(sql, [],
                 function (tx, results) {
                     callback();
                 },
                 function (tx, err) {
                     if (err.code !== 0)
                         errCallBack(err);
                 }
             );
         },
         function (err) {
             errCallBack(err);
         }
    );
}

function ImprimirDevolucion(lskSku, callback, errCallback) {
    try {

        ConectarImpresora(localStorage.getItem('PRINTER_ADDRESS'), function () {
            ObtenerFormatoImpresionDevolucion(lskSku, function (formato) {
                Imprimir(formato, function() {
                        callback();
                    }
                    , function (e) { errCallback(e); });
            }, function (e) {
                errCallback(e);
            });
        }, function () {
            errCallback(
            {
                code: -1,
                message: "Imposible Imprimir"
            });
        });

    } catch (e) {
        errCallback(e);
    }
}