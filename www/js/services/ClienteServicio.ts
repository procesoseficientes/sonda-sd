class ClienteServicio implements IClienteServicio{
    cambiarEstadoAClientesParaReenviar(clientes, callback: () => void, errorCallback: (resultado: Operacion) => void):
        void {
        try {
            let sql: string = "";
            SONDA_DB_Session.transaction((tx: SqlTransaction) => {
                    clientes.map(cliente => {
                        sql =
                            `UPDATE CLIENT
                            SET IS_POSTED = ${(cliente.EXISTS === EstadoEnvioDoc.NoEnviado ? EstadoEnvioDoc.NoEnviado : EstadoEnvioDoc.EnviadoConAcuseDeRecibido)},
                            IS_POSTED_VALIDATED = ${(cliente.EXISTS === EstadoEnvioDoc.NoEnviado ? EstadoEnvioDoc.NoEnviado : EstadoEnvioDoc.EnviadoConAcuseDeRecibido)}
                            WHERE
                             CLIENT_ID = '${cliente.CODE_CUSTOMER}'
                             AND DOC_SERIE = '${cliente.DOC_SERIE}'
                             AND DOC_NUM = ${cliente.DOC_NUM}`;

                        tx.executeSql(sql);

                    });
                },
                (err: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message } as
                        Operacion);
                    return;
                },() => {
                    callback();
                });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
            return;
        } 
    }

    obtenerClientesParaValidacionEnBo(obtenerTodosLosClientes: boolean,callback: (clientes: Cliente[]) => void,
        errorCallback: (resultado: Operacion) => void): void {
        try {
            let sql: string = "";
            let clientsToVerify: Cliente[] = new Array<Cliente>();

            SONDA_DB_Session.transaction((tx: SqlTransaction) => {
                    sql =
                        `SELECT CLIENT_ID, DOC_SERIE, DOC_NUM, POSTED_DATETIME, TAGS_QTY, SYNC_ID 
                         FROM CLIENT
                         WHERE IS_POSTED = ${EstadoEnvioDoc.EnviadoConAcuseDeRecibido}
                         ${(!obtenerTodosLosClientes ? " AND IFNULL(IS_POSTED_VALIDATED, 0) = 0" : "")} `;

                    tx.executeSql(sql,
                        [],
                        (txReturn: SqlTransaction, results: SqlResultSet) => {
                            if (results.rows.length > 0) {
                                for (let i = 0; i < results.rows.length; i++) {
                                    let clientTemp: any = results.rows.item(i);
                                    let clientResult: Cliente = <Cliente>{
                                        clientId: clientTemp.CLIENT_ID,
                                        docSerie: clientTemp.DOC_SERIE,
                                        docNum: clientTemp.DOC_NUM,
                                        postedDatetime: clientTemp.POSTED_DATETIME,
                                        tagsQty: clientTemp.TAGS_QTY,
                                        syncId: clientTemp.SYNC_ID
                                    }
                                    clientsToVerify.push(clientResult);
                                }
                                callback(clientsToVerify);
                            } else {
                                callback(clientsToVerify);
                            }
                        },
                        (txReturn: SqlTransaction, error: SqlError) => {
                            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error.message } as
                                Operacion);
                            return;
                        });
                },
                (err: SqlError) => {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message } as
                        Operacion);
                    return;
                });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message } as Operacion);
            return;
        } 
    }

    guardarScouting(scouting: Cliente, callbak: (scouting: Cliente) => void, errCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction((tx: SqlTransaction) => {
                let formatoDeInsercionDeClienteNuevo = this.obtenerFormatoDeInsercionDeClienteNuevo(scouting);
                tx.executeSql(formatoDeInsercionDeClienteNuevo);

                scouting.tags.map(etiqueta => {
                    let formatoDeInsercionDeEtiquetaDeCliente = this
                        .obtenerFormatoDeInsercionDeEtiquetaDeClienteNuevo(scouting, etiqueta);
                    tx.executeSql(formatoDeInsercionDeEtiquetaDeCliente);
                });
            },
            (err: SqlError) => {
                errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message } as Operacion);
            },
            () => {
                PagoConsignacionesServicio
                    .ActualizarSecuenciaDeDocumentos(SecuenciaDeDocumentoTipo.Scouting,
                        scouting.docNum,
                        () => {
                            callbak(scouting);
                        },
                        (error) => {
                            errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error } as
                                Operacion);
                        });
            });
    }

    obtenerClientesConEtiquetasNoSincronizados(callback: (clientes: Cliente[]) => void, errCallback: (resultado: Operacion) => void): void {
        let sql: string = "";
        let clientsReturn: Cliente[] = new Array<Cliente>();
        SONDA_DB_Session.transaction((tx: SqlTransaction) => {
            sql = `SELECT CLIENT_ID, 
                CLIENT_NAME,
                CLIENT_TAX_ID,
                ADDRESS,
                PHONE,
                CLIENT_HH_ID_OLD,
                CONTACT_CUSTOMER,
                CONTACT_CUSTOMER_PHONE,
                PHOTO,
                PHOTO_2,
                PHOTO_3,
                STATUS,
                GPS,
                CREATED_FROM,
                INVOICE_NAME,
                INVOICE_ADDRESS,
                DOC_SERIE,
                DOC_NUM,
                POSTED_DATETIME,
                TAGS_QTY,
                SYNC_ID
                FROM CLIENT 
                WHERE IS_POSTED = 0`;

            tx.executeSql(sql,[],(txResult: SqlTransaction, results: SqlResultSet) => {
                if (results.rows.length > 0) {
                    for (let i = 0; i < results.rows.length; i++) {
                        let clientTemp: any =  results.rows.item(i);
                        let clientResult: Cliente = <Cliente>{
                            clientId: clientTemp.CLIENT_ID,
                            clientName: clientTemp.CLIENT_NAME,
                            clientTaxId: clientTemp.CLIENT_TAX_ID,
                            address: clientTemp.ADDRESS,
                            phone: clientTemp.PHONE,
                            clientHhIdOld: clientTemp.CLIENT_HH_ID_OLD,
                            contactCustomer: clientTemp.CONTACT_CUSTOMER,
                            contactPhone: clientTemp.CONTACT_CUSTOMER_PHONE,
                            photo1: clientTemp.PHOTO,
                            photo2: clientTemp.PHOTO_2,
                            photo3: clientTemp.PHOTO_3,
                            status: clientTemp.STATUS,
                            isNew: 1,
                            gps: clientTemp.GPS,
                            latitude: clientTemp.GPS.split(",")[0],
                            longitude: clientTemp.GPS.split(",")[1],
                            tags: new Array<Etiqueta>(),
                            createdFrom: clientTemp.CREATED_FROM,
                            billingName: clientTemp.INVOICE_NAME,
                            billingAddress: clientTemp.INVOICE_ADDRESS,
                            docSerie: clientTemp.DOC_SERIE,
                            docNum: clientTemp.DOC_NUM,
                            postedDatetime: clientTemp.POSTED_DATETIME,
                            tagsQty: clientTemp.TAGS_QTY,
                            syncId: clientTemp.SYNC_ID
                        }

                        this.obtenerEtiquetasPorCliente(txResult, clientResult, i, (clientComplete, index) => {
                            clientsReturn.push(clientComplete);
                            if (index === results.rows.length - 1) {
                                callback(clientsReturn);
                            }
                        },(resultado) => {
                            errCallback(resultado);
                        });
                    }
                } else {
                    callback(clientsReturn);
                }
            },(txResult: SqlTransaction,
                err: SqlError) => {
                errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message } as Operacion);
            });
        },(err: SqlError) => {
            errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message } as Operacion);
        });
    }

    obtenerEtiquetasPorCliente(txResult: SqlTransaction, cliente: Cliente, indice: number, callback: (cliente: Cliente, indice: number) => void, errCallback: (resultado: Operacion) => void): void {
        let sql = `SELECT T.TAG_COLOR, 
                    T.TAG_VALUE_TEXT,
                    T.TAG_PRIORITY,
                    T.TAG_COMMENTS,
                    TC.DOC_SERIE_CLIENT, 
                    TC.DOC_NUM_CLIENT
                    FROM TAG AS T
                    INNER JOIN TAG_X_CUSTOMER AS TC
                    ON(TC.TAG_COLOR = T.TAG_COLOR)
                    WHERE TC.DOC_SERIE_CLIENT = '${cliente.docSerie}' AND TC.DOC_NUM_CLIENT = ${cliente.docNum}`;
        txResult.executeSql(sql,
            [],
            (txTagsResult: SqlTransaction, resultsTags) => {
                for (let j = 0; j < resultsTags.rows.length; j++) {
                    let tagTemp:any = resultsTags.rows.item(j);
                    let tagResult: Etiqueta = <Etiqueta>{
                        tagColor: tagTemp.TAG_COLOR,
                        tagValueText: tagTemp.TAG_VALUE_TEXT,
                        tagPriority: tagTemp.TAG_PRIORITY,
                        tagComments: tagTemp.TAG_COMMENTS,
                        docSerieClient: tagTemp.DOC_SERIE_CLIENT,
                        docNumClient: tagTemp.DOC_NUM_CLIENT
                    }
                    cliente.tags.push(tagResult);
                }
                callback(cliente, indice);
            },
            (txTagsResult: SqlTransaction, errorTags: SqlError) => {
                errCallback({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: errorTags.message
                } as Operacion);
            });
    }
    
    marcarClienteComoSincronizado(clientes, callback: () => void, errCallback: (resultado: Operacion) => void): void {
        let sql: string = "";
        SONDA_DB_Session.transaction((tx: SqlTransaction) => {
            clientes.map(cliente => {
                if (cliente.IS_SUCCESSFUL) {
                    sql = `UPDATE CLIENT 
                        SET IS_POSTED = 2,
                        CLIENT_ID = '${cliente.CLIENT_ID_BO}'  
                        WHERE CLIENT_HH_ID_OLD = '${cliente.CLIENT_ID_HH}'
                        AND DOC_SERIE = '${cliente.DOC_SERIE}'
                        AND DOC_NUM = ${cliente.DOC_NUM}`;
                    tx.executeSql(sql);

                    sql = `UPDATE TAG_X_CUSTOMER 
                        SET CLIENT_ID = '${cliente.CLIENT_ID_BO}' 
                        WHERE CLIENT_ID = '${cliente.CLIENT_ID_HH}'
                        AND DOC_SERIE_CLIENT = '${cliente.DOC_SERIE}'
                        AND DOC_NUM_CLIENT = ${cliente.DOC_NUM}`;
                    tx.executeSql(sql);
                } else {
                    ToastThis(`Cliente ${cliente.CLIENT_ID_HH} ${cliente.MESSAGE}`);
                }
            });
            sql = null;
        }, (err: SqlError) => {
            errCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message } as Operacion);
        },() => {
            callback();
        });
    }

    obtenerFormatoDeInsercionDeClienteNuevo(cliente: Cliente): string {
        let formatoDeInsercionDeCliente: string = "";

        formatoDeInsercionDeCliente = "INSERT INTO CLIENT(";
        formatoDeInsercionDeCliente += "CLIENT_ID, ";
        formatoDeInsercionDeCliente += "CLIENT_NAME,";
        formatoDeInsercionDeCliente += "CLIENT_TAX_ID,";
        formatoDeInsercionDeCliente += "ADDRESS,";
        formatoDeInsercionDeCliente += "CLIENT_HH_ID_OLD,";
        formatoDeInsercionDeCliente += "CONTACT_CUSTOMER,";
        formatoDeInsercionDeCliente += "CONTACT_CUSTOMER_PHONE,";
        formatoDeInsercionDeCliente += "PHOTO,";
        formatoDeInsercionDeCliente += "PHOTO_2,";
        formatoDeInsercionDeCliente += "PHOTO_3,";
        formatoDeInsercionDeCliente += "STATUS,";
        formatoDeInsercionDeCliente += "NEW,";
        formatoDeInsercionDeCliente += "GPS,";
        formatoDeInsercionDeCliente += "CREATED_FROM,";
        formatoDeInsercionDeCliente += "INVOICE_NAME,";
        formatoDeInsercionDeCliente += "INVOICE_ADDRESS,";
        formatoDeInsercionDeCliente += "IS_POSTED,";
        formatoDeInsercionDeCliente += "DOC_SERIE,";
        formatoDeInsercionDeCliente += "DOC_NUM,";
        formatoDeInsercionDeCliente += "POSTED_DATETIME,";
        formatoDeInsercionDeCliente += "TAGS_QTY,";
        formatoDeInsercionDeCliente += "IS_POSTED_VALIDATED,";
        formatoDeInsercionDeCliente += "SYNC_ID)";
        formatoDeInsercionDeCliente += "VALUES(";
        formatoDeInsercionDeCliente += "'" + cliente.clientId + "' ";
        formatoDeInsercionDeCliente += ", '" + cliente.clientName + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.clientTaxId + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.address + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.clientHhIdOld + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.contactCustomer + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.contactPhone + "'";

        if (cliente.photo1 === null || cliente.photo1 === undefined || cliente.photo1 === "") {
            formatoDeInsercionDeCliente += "," + null;
        } else {
            formatoDeInsercionDeCliente += ", '" + cliente.photo1 + "'";
        }
        if (cliente.photo2 === null || cliente.photo2 === undefined || cliente.photo2 === "") {
            formatoDeInsercionDeCliente += "," + null;
        } else {
            formatoDeInsercionDeCliente += ", '" + cliente.photo2 + "'";
        }
        if (cliente.photo3 === null || cliente.photo3 === undefined || cliente.photo3 === "") {
            formatoDeInsercionDeCliente += "," + null;
        } else {
            formatoDeInsercionDeCliente += ", '" + cliente.photo3 + "'";
        }

        formatoDeInsercionDeCliente += ", '" + cliente.status + "'";
        formatoDeInsercionDeCliente += ", " + cliente.isNew;
        formatoDeInsercionDeCliente += ", '" + cliente.gps + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.createdFrom + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.billingName + "'";
        formatoDeInsercionDeCliente += ", '" + cliente.billingAddress + "'";
        formatoDeInsercionDeCliente += ", 0";
        formatoDeInsercionDeCliente += ", '" + cliente.docSerie + "'";
        formatoDeInsercionDeCliente += ", " + cliente.docNum;
        formatoDeInsercionDeCliente += `, '${getDateTime()}'`;
        formatoDeInsercionDeCliente += ", " + cliente.tags.length;
        formatoDeInsercionDeCliente += ", 0";
        formatoDeInsercionDeCliente += `, '${gCurrentRoute + "|" + gLastLogin + "|" + getDateTime() + "|" + cliente.clientId}'`;
        formatoDeInsercionDeCliente += ")";


        return formatoDeInsercionDeCliente;
    }

    obtenerFormatoDeInsercionDeEtiquetaDeClienteNuevo(cliente: Cliente, etiqueta: Etiqueta): string {
        let formatoDeInsercionDeEtiqueta: string = "";

        formatoDeInsercionDeEtiqueta = "INSERT INTO TAG_X_CUSTOMER(";
        formatoDeInsercionDeEtiqueta += "TAG_COLOR,";
        formatoDeInsercionDeEtiqueta += "CLIENT_ID,";
        formatoDeInsercionDeEtiqueta += "DOC_SERIE_CLIENT,";
        formatoDeInsercionDeEtiqueta += "DOC_NUM_CLIENT";
        formatoDeInsercionDeEtiqueta += ") VALUES(";
        formatoDeInsercionDeEtiqueta += "'" + etiqueta.tagColor + "'";
        formatoDeInsercionDeEtiqueta += ",'" + cliente.clientId + "'";
        formatoDeInsercionDeEtiqueta += ",'" + cliente.docSerie + "'";
        formatoDeInsercionDeEtiqueta += "," + cliente.docNum;
        formatoDeInsercionDeEtiqueta += ")";
        
        return formatoDeInsercionDeEtiqueta;
    }

    obtenerUltimoComentarioDeFactura(callback: (comentario: string) => void) {
        
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string =
                    "SELECT IFNULL(COMMENT,'N/A') AS COMMENT FROM INVOICE_HEADER WHERE COMMENT IS NOT NULL ORDER BY INVOICE_NUM DESC LIMIT 1";
                    trans.executeSql(sql,
                        [],
                        (transReturn: SqlTransaction, results: SqlResultSet) => {
                            if (results.rows.length > 0) {
                                let comment = (results.rows.item(0) as any).COMMENT;
                                callback(comment);
                                comment = null;
                            } else {
                                callback("N/A");
                            }
                        },
                        (transReturn: SqlTransaction, error: SqlError) => {
                            callback("N/A");
                        });
                },
                (error: SqlError) => {
                    callback("N/A");
                });
        } catch (e) {
            callback("N/A");
        }
    }

}