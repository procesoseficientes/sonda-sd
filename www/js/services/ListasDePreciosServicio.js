//------ Almacena los skus con su precio por escala -------------//

function addPriceListBySckuPackScale(data) {
    try {
        SONDA_DB_Session.transaction(function(trans) {
            var sql = [];
            
            sql.push("DELETE FROM PRICE_LIST_BY_SKU_PACK_SCALE WHERE CODE_PRICE_LIST = '" + data.CODE_PRICE_LIST + "' ");
            sql.push(" AND [CODE_SKU] = '" + data.CODE_SKU + "'");
            sql.push(" AND [CODE_PACK_UNIT] ='" + data.CODE_PACK_UNIT + "'");
            sql.push(" AND [PRIORITY] = "+ data.PRIORITY+ " ");
            sql.push(" AND [LOW_LIMIT] = "+ data.LOW_LIMIT+ " ");
            sql.push(" AND [HIGH_LIMIT] = "+ data.HIGH_LIMIT+ " ");
            sql.push(" AND [PRICE] = "+ data.PRICE+ " ");
            trans.executeSql(sql.join(""));
            sql.length = 0;
            
            sql.push("INSERT INTO PRICE_LIST_BY_SKU_PACK_SCALE(");
            sql.push(" [CODE_PRICE_LIST],[CODE_SKU]");
            sql.push(" ,[CODE_PACK_UNIT],[PRIORITY]");
            sql.push(" ,[LOW_LIMIT],[HIGH_LIMIT],[PRICE]");
            sql.push(" ) VALUES(");
            sql.push(" '" + data.CODE_PRICE_LIST + "'");
            sql.push(" ,'" + data.CODE_SKU + "'");
            sql.push(" ,'" + data.CODE_PACK_UNIT + "'");
            sql.push(" ," + data.PRIORITY);
            sql.push(" ," + data.LOW_LIMIT);
            sql.push(" ," + data.HIGH_LIMIT);
            sql.push(" ," + data.PRICE);
            sql.push(" )");

            trans.executeSql(sql.join(""));
        }, function(error) {
            console.log("Ha ocurrido un error al intentar almacenar los productos con su precio por escala: " + error.message);
            notify("Ha ocurrido un error al intentar almacenar los productos con su precio por escala.");
        });
    } catch (e) {
        console.log("Ha ocurrido un error al intentar almacenar los productos con su precio por escala: " + e.message);
        notify("Ha ocurrido un error al intentar almacenar los productos con su precio por escala.");
    } 
}


//----------Inicio de Lista de Precios por Defecto---------//
function PriceListDefaultReceived() {
    ToastThis("Recibiendo Lista de Precios por Defecto");
}

function PriceListDefaultNotFound(data) {
    ToastThis("No se enconto Lista de Precios por Defecto para la Ruta: " + data.routeid);
}

function AddPriceListDefault(data) {
    try {
        if (data.row.CODE_PRICE_LIST !== null && data.row.CODE_PRICE_LIST !== '') {
            localStorage.setItem("gDefaultPriceList", data.row.CODE_PRICE_LIST);
        } else {
            notify("No Existe Lista de Precios Default");
        }
    } catch (e) {
        notify(e.message);
    }
}

function PriceListDefaultCompleted() {
    ToastThis("Listas de Precios por Defecto Cargada Exitosamente.");
}

//----------Fin de Lista de Precios por Defecto---------//