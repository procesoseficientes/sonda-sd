/// <reference path="../../../typings/tsd.d.ts" />
// ReSharper disable once InconsistentNaming
declare function ToastThis(pMessage: string): void;


declare var SONDA_DB_Session: Database;
//declare var SONDA_DB_Session: Database;


class DemoServicio {

    constructor(public socket: SocketIOClient.Socket) {

        this.socket.on("welcome_to_sonda", this.socketOnDemo);
    }
    emptyDemo(): string {
        return "";
    }

    socketOnDemo(data: any) {
        var d = data; 
    }

    socketEmmitDemo() {
        var userId = "RUDI@FERCO";
        var pinCode = "123";
        this.socket.emit("validatecredentials", { 'loginid': userId, 'pin': pinCode });
        
    }

    llamadaExternaDemo() {
        ToastThis("Esta es una llama externa");   
    }

    queryDemo() {
        SONDA_DB_Session.transaction(
             (tx)=> {
                var sql = "SELECT * FROM SKUS";
                tx.executeSql(sql, [],
                    (tx:SqlTransaction, results:SqlResultSet) => {
                        if (results.rows.length >= 1) {
                            var sku: any = results.rows.item(0);
                            ToastThis(sku.SKU_DESCRIPTION);
                        }

                    }
                );

            }
            ,(err: SqlError) => {
                ToastThis(err.message);
            }
            );
    }


}