class VentasPorMultiploServicio implements IVentasPorMultiploServicio {
    verificarVentasPorMultiploSkuUm(cliente: Cliente,
        sku: Sku,
        callBack: (skuMultiplo: VentaPorMultiplo) => void,
        errorCallBack: (operacion: Operacion) => void): void {
        const op = new Operacion();
        const ventaPorMultiplo = new VentaPorMultiplo();
        try {

            SONDA_DB_Session.transaction(
                (tx: SqlTransaction) => {
                    let listaDeLi: string[] = [];
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
                    listaDeLi.push(` WHERE M.CODE_SKU = '${sku.sku}' `);
                    listaDeLi.push(` AND M.CODE_PACK_UNIT = '${sku.unidadMedidaSeleccionada}'`);
                    listaDeLi.push(` AND C.CLIENT_ID = '${cliente.clientId}'`);

                    tx.executeSql(listaDeLi.join(''), [], (txRes: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length > 0) {
                            const ventaMultiploSql: any = results.rows.item(0);

                            ventaPorMultiplo.codeSku = ventaMultiploSql.CODE_SKU;
                            ventaPorMultiplo.codePackUnit = ventaMultiploSql.CODE_PACK_UNIT;
                            ventaPorMultiplo.multiple = parseInt(ventaMultiploSql.MULTIPLE);
                            ventaPorMultiplo.promoId = ventaMultiploSql.PROMO_ID;
                            ventaPorMultiplo.promoName = ventaMultiploSql.PROMO_NAME;
                            ventaPorMultiplo.promoType = ventaMultiploSql.PROMO_TYPE;
                            ventaPorMultiplo.frequency = ventaMultiploSql.FREQUENCY;
                            ventaPorMultiplo.apply = true;
                            callBack(ventaPorMultiplo);
                        } else {
                            ventaPorMultiplo.codeSku = sku.sku;
                            ventaPorMultiplo.codePackUnit = sku.codePackUnit;
                            ventaPorMultiplo.multiple = 0;
                            ventaPorMultiplo.apply = false;
                            callBack(ventaPorMultiplo);
                        }
                    }, (txRes: SqlTransaction,error: SqlError) => {
                        op.codigo = error.code;
                        op.mensaje = error.message;
                        op.resultado = ResultadoOperacionTipo.Error;

                        errorCallBack(op);
                    });


                }, (error: SqlError) => {
                    op.codigo = -1;
                    op.mensaje = error.message;
                    op.resultado = ResultadoOperacionTipo.Error;

                    errorCallBack(op);
                });

        } catch (e) {
            op.codigo = -1;
            op.mensaje = e.message;
            op.resultado = ResultadoOperacionTipo.Error;

            errorCallBack(op);
        } 
    }


    validarSiTieneVentaPorMultiplo(cliente: Cliente, sku: Sku, paquete: Paquete, control: any, callback: (tiene: boolean, paqueteN1: Paquete, controlN1: any) => void, errCallback: (resultado: Operacion) => void) {
        try {
            if (paquete === null || paquete === undefined) {
                callback(false, paquete, control);
            } else {
                SONDA_DB_Session.transaction((trans) => {
                    let listaDeLi: string[] = [];
                    listaDeLi.push("SELECT SM.SALES_BY_MULTIPLE_LIST_ID");
                    listaDeLi.push(" FROM SKU_SALES_BY_MULTIPLE_LIST_BY_SKU SM");
                    listaDeLi.push(` WHERE SM.SALES_BY_MULTIPLE_LIST_ID = ${cliente.salesByMultipleListId}`);
                    listaDeLi.push(` AND SM.CODE_SKU = '${sku.sku}'`);
                    listaDeLi.push(` AND SM.CODE_PACK_UNIT = '${paquete.codePackUnit}'`);

                    trans.executeSql(listaDeLi.join(''),
                            [],
                            (tx: SqlTransaction, results: SqlResultSet) => {
                                if (results.rows.length > 0) {
                                    callback(true, paquete, control);
                                } else {
                                    callback(false, paquete, control);
                                }
                            }
                        );
                    },
                    (error: SqlError) => {
                        let operacion = new Operacion();
                        operacion.codigo = -1;
                        operacion.mensaje = error.message;
                        console.log(operacion);
                        errCallback(operacion);
                    });
            }
        } catch (e) {
            let operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = "Error al obtneer si usa multiplo: " + e.message;
            console.log(operacion.mensaje);

            errCallback(operacion);
        }
    }

    obtenerVentaPorMultiploDeSkuConUnidadDeMedida(cliente: Cliente, sku: string, unidadDeMedida: string, control: any, callback: (multiplo: number, controlN1: any) => void, errCallback: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction((trans) => {
                let listaDeLi: string[] = [];
                listaDeLi.push("SELECT SM.MULTIPLE");
                listaDeLi.push(" FROM SKU_SALES_BY_MULTIPLE_LIST_BY_SKU SM");
                listaDeLi.push(" WHERE SM.SALES_BY_MULTIPLE_LIST_ID = " + cliente.salesByMultipleListId);
                listaDeLi.push(` AND SM.CODE_SKU = '${sku}'`);
                listaDeLi.push(` AND SM.CODE_PACK_UNIT = '${unidadDeMedida}'`);

                trans.executeSql(listaDeLi.join(''),
                    [],
                    (tx: SqlTransaction, results: SqlResultSet) => {
                        if (results.rows.length > 0) {
                            let ventaPorMultiplo: any = results.rows.item(0);
                            callback(ventaPorMultiplo.MULTIPLE, control);
                        } else {
                            callback(1, control);
                        }
                    }
                );
            },
                (error: SqlError) => {
                    let operacion = new Operacion();
                    operacion.codigo = -1;
                    operacion.mensaje = error.message;
                    console.log(operacion);
                    errCallback(operacion);
                });
        } catch (e) {
            let operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = `Error al obtener el mutilplo: ${e.message}`;
            console.log(operacion.mensaje);

            errCallback(operacion);
        }
    }
}