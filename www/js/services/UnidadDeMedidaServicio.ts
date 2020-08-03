

class UnidadDeMedidaServicio  implements IUnidadDeMedidaServicio {
    
    agregarUnidadDeMedida(data: any) {
        SONDA_DB_Session.transaction(
            (trans: SqlTransaction) => {
                let sql: Array<string> = [];
                sql.push(`INSERT INTO PACK_UNIT_BY_SKU(`);
                sql.push(`PACK_UNIT, CODE_PACK_UNIT, DESCRIPTION_CODE_PACK_UNIT, UM_ENTRY)`);
                sql.push(`VALUES(`);
                sql.push(`${data.PACK_UNIT}`);
                sql.push(`,'${data.CODE_PACK_UNIT}'`);
                sql.push(`,'${data.DESCRIPTION_PACK_UNIT}'`);
                sql.push(`,'${data.UM_ENTRY}'`);
                sql.push(`)`);

                trans.executeSql(sql.join(""));

                sql = null;
            },
            (error: SqlError) => {
                notify(
                    `No se ha podido agregar la unidad de medida debido a: ${
                    error.message
                    }`
                );
            });
    }

      
    agregarPaqueteDeConversion(data: any) {
        SONDA_DB_Session.transaction(
            (trans: SqlTransaction) => {
                let sql: Array<string> = [];

                sql.push("DELETE FROM PACK_CONVERSION WHERE PACK_CONVERSION = " + data.PACK_CONVERSION + " ");
                sql.push(" AND [CODE_SKU] = '" + data.CODE_SKU + "'");
                sql.push(" AND [CODE_PACK_UNIT_FROM] = '" + data.CODE_PACK_UNIT_FROM + "'");
                sql.push(" AND [CODE_PACK_UNIT_TO] ='" + data.CODE_PACK_UNIT_TO + "'");
                sql.push(" AND [CONVERSION_FACTOR] = "+ data.CONVERSION_FACTOR+ " ");
                sql.push(" AND [ORDER] = "+ data.ORDER+ " ");
                trans.executeSql(sql.join(""));
    
                sql.length = 0;    

                sql.push(`INSERT INTO PACK_CONVERSION(`);
                sql.push(` PACK_CONVERSION,CODE_SKU,CODE_PACK_UNIT_FROM,CODE_PACK_UNIT_TO,CONVERSION_FACTOR,[ORDER])`);
                sql.push(` VALUES(`);
                sql.push(` ${data.PACK_CONVERSION}`);
                sql.push(` ,'${data.CODE_SKU}'`);
                sql.push(` ,'${data.CODE_PACK_UNIT_FROM}'`);
                sql.push(` ,'${data.CODE_PACK_UNIT_TO}'`);
                sql.push(` ,${data.CONVERSION_FACTOR}`);
                sql.push(` ,${data.ORDER}`);
                sql.push(`)`);

                trans.executeSql(sql.join(""));

                sql = null;
            },
            (error: SqlError) => {
                notify(
                    `No se ha podido agregar el paquete de conversi�n debido a: ${
                    error.message
                    }`
                );
            });
    }
}