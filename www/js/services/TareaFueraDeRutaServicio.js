function obtenerClientesFueraDeRutaBD(ruta, filtro) {
    if (gIsOnline == EstaEnLinea.Si) {
        var data =
        {
            'dbuser': gdbuser
            , 'dbuserpass': gdbuserpass
            , 'routeid': ruta,
            'filter': filtro
        };
        SocketControlador.socketIo.emit("GetClientsForTaskOutsideTheRoutePlan", data);
        console.log("GetClientsForTaskOutsideTheRoutePlan");
    } else {
        notify("No se puede establecer comunicación con el servidor. Por favor intente más tarde.");
        $.mobile.changePage("#menu_page", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
}

function crearTareaFueraDeRuta(ruta, cliente, tipo) {
    if (gIsOnline === EstaEnLinea.Si) {
        var data =
        {
            'dbuser': gdbuser
            , 'dbuserpass': gdbuserpass
            , 'routeid': ruta
            , 'customer': cliente
            , 'type': tipo
        };

        SocketControlador.socketIo.emit("CreateTaskOutsideTheRoutePlan", data);
        console.log("CreateTaskOutsideTheRoutePlan");
    } else {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify("No se puede establecer comunicación con el servidor. Por favor intente más tarde.");
        $.mobile.changePage("#menu_page", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
}

function insertarTareaFueraDeRuta(data, callBack) {
    var pSql = "";
    SONDA_DB_Session.transaction(
        function (tx) {
            var tarea = data.data.tarea;
            pSql = "DELETE FROM TASK WHERE TASK_ID = " + tarea.TASK_ID;
            tx.executeSql(pSql);

            pSql = " INSERT INTO TASK(";
            pSql += "TASK_ID";
            pSql += ", TASK_TYPE";
            pSql += ", TASK_DATE";
            pSql += ", SCHEDULE_FOR";
            pSql += ", CREATED_STAMP";
            pSql += ", ASSIGEND_TO";
            pSql += ", ASSIGNED_BY";
            pSql += ", ACCEPTED_STAMP";
            pSql += ", COMPLETED_STAMP";
            pSql += ", EXPECTED_GPS";
            pSql += ", POSTED_GPS";
            pSql += ", TASK_COMMENTS";
            pSql += ", TASK_SEQ";
            pSql += ", TASK_ADDRESS";
            pSql += ", RELATED_CLIENT_CODE";
            pSql += ", RELATED_CLIENT_NAME";
            pSql += ", TASK_STATUS";
            pSql += ", IS_POSTED";
            pSql += ", TASK_BO_ID";
            pSql += ", NIT";
            pSql += ", CODE_PRICE_LIST";
            pSql += " ) VALUES (";
            pSql += tarea.TASK_ID;
            pSql += ",'" + tarea.TASK_TYPE + "'";
            pSql += ",'" + tarea.TASK_DATE + "'";
            pSql += ",'" + tarea.SCHEDULE_FOR + "'";
            pSql += ",'" + tarea.TASK_DATE + "'";
            pSql += ",'" + tarea.ASSIGEND_TO + "'";
            pSql += ",'" + tarea.ASSIGNED_BY + "'";
            pSql += ",NULL";
            pSql += ",NULL";
            pSql += ",'" + tarea.EXPECTED_GPS + "'";
            pSql += ",NULL";
            pSql += ",'" + tarea.TASK_COMMENTS + "'";
            pSql += "," + tarea.TASK_SEQ;
            pSql += ",'" + tarea.TASK_ADDRESS + "'";
            pSql += ",'" + tarea.RELATED_CLIENT_CODE + "'";
            pSql += ",'" + tarea.RELATED_CLIENT_NAME + "'";
            pSql += ",'" + tarea.TASK_STATUS + "'";
            pSql += ",2";
            pSql += "," + tarea.TASK_ID;
            pSql += ",'" + tarea.NIT + "'";
            pSql += ",'" + tarea.CODE_PRICE_LIST + "'";
            pSql += ")";

            console.log(pSql);
            tx.executeSql(pSql);
        },
        function (err) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("A2T.CATCH:" + err.message);
        },
        function () {
            callBack(data);
        });
}

function insertarListaDePreciosPorClienteFueraDeRuta(data, clientCode, callBack) {
    try {
        var pSql = null;
        SONDA_DB_Session.transaction(
            function (tx) {
                pSql = "UPDATE TASK SET CODE_PRICE_LIST = '" + data.data.tarea.CODE_PRICE_LIST + "' WHERE TASK_ID = " + data.data.tarea.TASK_ID;
                tx.executeSql(pSql);
            },
            function (err) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify(err.message);
            },
            function () {
                callBack(data);
            }
        );
    } catch (e) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify(e.message);
    }
}

function insertarListaDePreciosPorSkuFueraDeRuta(data, callBack) {
    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                var lista = data.data.lista;
                tx.executeSql("DELETE FROM PRICE_LIST_BY_SKU_PACK_SCALE WHERE CODE_PRICE_LIST = '" +
                    data.data.tarea.CODE_PRICE_LIST +
                    "'");
                for (var j = 0; j < lista.length; j++) {
                    addPriceListBySckuPackScale(lista[j]);
                }
            },
            function (err) {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify(err.message);
            },
            function () {
                callBack(data);
            }
        );
    } catch (e) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify(e.message);
    }

}

function insertarConsignaciones(data, encabezados, detalles, callBack) {
    try {
        for (var i = 0; i < encabezados.length; i++) {
            InsertarConsignacionEncabezado(encabezados[i], null);
        }

        for (var j = 0; j < detalles.length; j++) {
            InsertarConsignacionDetalle(detalles[j].idConsignacion,
                detalles[j],
                detalles[j].numeroLinea,
                1, null);
        }

        callBack(data);
    } catch (e) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify(e.message);
    }
}

function agregarInformacionDeFacturasVencidas(data, callbak) {
    try {
        if (data.facturasVencidas) {
            var cuentaCorrienteServicio = new CuentaCorrienteServicio();
            for (var i = 0; i < data.facturasVencidas.length; i++) {
                var facturaVencida = data.facturasVencidas[i];
                cuentaCorrienteServicio.agregarFacturaVencidaDeCliente(facturaVencida);
            }
            cuentaCorrienteServicio = null;
        }

        callbak(data);

    } catch (e) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        console.log("No se han podido almacenar las facturas vencidas del cliente debido a: " + e.message);
        notify("Error al intentar almacenar las facturas vencidas del cliente.");
    }
}

function agregarInformacionDeCuentaCorriente(data, callback) {
    try {
        if (data.cuentaCorriente) {
            var cuentaCorrienteServicio = new CuentaCorrienteServicio();
            cuentaCorrienteServicio.agregarCuentaCorrienteDeCliente(data.cuentaCorriente);
            cuentaCorrienteServicio = null;
        }

        callback();

    } catch (e) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        console.log("No se ha podido almacenar la información de cuenta corriente debido a: " + e.message);
        notify("Error al intentar almacenar la información de cuenta corriente del cliente.");
    }
}