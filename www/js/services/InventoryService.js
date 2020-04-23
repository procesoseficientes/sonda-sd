function UpdateInventory(pCombo, pSku, pQty, tx) {
    try {
        var pSql = "UPDATE SKUS SET ON_HAND = ON_HAND - " + pQty + " WHERE PARENT_SKU = '" + pCombo + "' AND EXPOSURE = 1 AND SKU = '" + pSku + "'";
        console.log(pSql);
        tx.executeSql(pSQL);
    } catch (e) { notify("UpdateInventory: " + e.message); }

}

function ActualizarInventarioPreVenta(inventario) {

    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "UPDATE  SKU_PRESALE ";
            sql += " SET IS_COMITED = " + inventario.is_committed;
            sql += ", ON_HAND =" + inventario.on_hand;
            sql += ", DIFFERENCE=" + (inventario.on_hand - inventario.is_committed);
            sql += " WHERE WAREHOUSE = '" + inventario.warehouse + "'";
            sql += " AND SKU ='" + inventario.sku + "'";
            tx.executeSql(sql);
        },function(err) {
            my_dialog("", "", "close");
            notify(err.message);
        },
        function() {}
    );
      

    
}
