var AperturaDeCajaServicio = {
    
    LimpiarTablaDeSecuenciaDeDocumentos: function() {
        try {
            SONDA_DB_Session.transaction(function(tx) {
                var sql = "DELETE FROM DOCUMENT_SEQUENCE";
                tx.executeSql(sql);
            }, function(err) {
                if (err.code !== 0) {
                    notify("Error al limpiar la tabla de Secuencia de Documentos debido a: " + err.message);
                }
            });
        } catch (e) {
            notify("Error al intentar limpiar la tabla de Secuencia de Documentos debido a: " + e.message);
        } 
    }
    ,
    AgregarSecuenciaDeDocumento: function(secuencia) {
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql =
                    "INSERT INTO DOCUMENT_SEQUENCE(DOC_TYPE, DOC_FROM, DOC_TO, SERIE, CURRENT_DOC, BRANCH_NAME, BRANCH_ADDRESS) " +
                        "VALUES('" +
                        secuencia.DOC_TYPE +
                        "'," +
                        secuencia.DOC_FROM +
                        "," +
                        secuencia.DOC_TO +
                        ",'" +
                        secuencia.SERIE +
                        "'," +
                        secuencia.CURRENT_DOC +
                        ", '" +
                        secuencia.BRANCH_NAME +
                        "', '" +
                        secuencia.BRANCH_ADDRESS +
                        "')";
                tx.executeSql(sql);
            }, function (err) {
                if (err.code !== 0) {
                    notify("Error al agregar la Secuencia de Documentos debido a: " + err.message);
                }
            });
        } catch (e) {
            notify("Error al intentar agregar la Secuencia de Documentos debido a: " + e.message);
        }
    }
}