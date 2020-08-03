class EtiquetaServicio implements IEtiquetaServicio {
    obtenerEtiquetas(callback: (estiquetas: Etiqueta[]) => void, errCallback: (resultado: Operacion) => void): void {
        try {
            SONDA_DB_Session.transaction(
                (tx) => {
                    let sql = "SELECT";
                    sql += " T.TAG_COLOR";
                    sql += " ,T.TAG_VALUE_TEXT";
                    sql += " ,T.TAG_PRIORITY";
                    sql += " ,T.TAG_COMMENTS";
                    sql += " FROM TAG T";
                    sql += " ORDER BY T.TAG_PRIORITY";
                    tx.executeSql(sql, [],
                        (tx: SqlTransaction, results: SqlResultSet) => {
                            if (results.rows.length >= 1) {
                                let etiquetas: Etiqueta[] = [];
                                for (let i = 0; i < results.rows.length; i++) {
                                    let etiquetaTemp: any = results.rows.item(i);
                                    let etiqueta: Etiqueta = <Etiqueta>{
                                        tagColor: etiquetaTemp.TAG_COLOR,
                                        tagValueText: etiquetaTemp.TAG_VALUE_TEXT,
                                        tagPriority: etiquetaTemp.TAG_PRIORITY,
                                        tagComments: etiquetaTemp.TAG_COMMENTS
                                    }
                                    etiquetas.push(etiqueta);
                                }
                                callback(etiquetas);
                            } else {
                                errCallback(<Operacion>{ codigo: -1, mensaje: "No hay etiquetas disponibles" });
                            }
                        }
                    );
                }, (err: SqlError) => {
                    errCallback(<Operacion>{ codigo: -1, mensaje: "2-Error al obtener las etiquetas: " + err.message });
                }
            );    
        } catch (e) {
            errCallback(<Operacion>{ codigo: -1, mensaje: "1-Error al obtener las etiquetas: " + e.message });
        }
    }

    guardarEtiquetasDeCliente(cliente: Cliente,callback: (cliente: Cliente) => void,errCallback: (resultado: Operacion) => void): void {
        try {
            SONDA_DB_Session.transaction(
                (tx) => {
                    let sql: string = "";
                    cliente.tags.map((etiqueta, index, array) => {
                        let sql = "INSERT INTO TAG_X_CUSTOMER (";
                        sql += " TAG_COLOR";
                        sql += " ,CLIENT_ID)";
                        sql += " VALUES (";
                        sql += `'${etiqueta.tagColor}'`;
                        sql += ` ,'${cliente.clientId}'`;
                        sql += ");";
                        tx.executeSql(sql);
                    });
                    callback(cliente);
                }, (err: SqlError) => {
                    errCallback(<Operacion>{ codigo: -1, mensaje: "2-Error al obtener las etiquetas: " + err.message });
                }
            );
        } catch (e) {
            errCallback(<Operacion>{ codigo: -1, mensaje: "1-Error al guardar las etiquetas: " + e.message });
        } 
    }

    agregarEtiqueta(etiqueta): void {
        SONDA_DB_Session.transaction((tx: SqlTransaction) => {
            let sql = `INSERT INTO TAG(TAG_COLOR, 
                TAG_VALUE_TEXT, 
                TAG_PRIORITY, 
                TAG_COMMENTS) 
                VALUES(
                '${etiqueta.TAG_COLOR}'
                ,'${etiqueta.TAG_VALUE_TEXT}'
                ,${etiqueta.TAG_PRIORITY}
                ,'${etiqueta.TAG_COMMENTS}'
                )`;
            tx.executeSql(sql);
        },(error: SqlError) => {
            
        });
    }
}