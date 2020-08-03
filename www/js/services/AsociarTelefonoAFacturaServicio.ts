class AsociarTelefonoAFacturaServicio implements IAsociarTelefonoAFacturaServicio {
    asociarNumeroDeTelefonoAFactura(numeroDeFactura: number,
        numeroTelefonico: string,
        callback: (resultado: Operacion) => void): void {
        try {
            SONDA_DB_Session.transaction((tx: SqlTransaction) => {
                let sql: string = `UPDATE INVOICE_HEADER SET TELEPHONE_NUMBER = '${numeroTelefonico}' WHERE INVOICE_NUM = ${numeroDeFactura}`;
                tx.executeSql(sql);
            },(err: SqlError) => {
                callback({
                    codigo: -1
                    , resultado: ResultadoOperacionTipo.Error
                    , mensaje: err.message
                } as Operacion);
            },() => {
                callback({
                    codigo: 0
                    , resultado: ResultadoOperacionTipo.Exitoso
                    , mensaje: "SUCCESS"
                } as Operacion);
            });
        } catch (e) {
            callback({
                codigo: -1
                , resultado: ResultadoOperacionTipo.Error
                , mensaje: e.message
            } as Operacion);
        } 
    }
}