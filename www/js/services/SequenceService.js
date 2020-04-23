function GetNexSequence(sequenceName,callback, errCallback) {
    SONDA_DB_Session.transaction(function (tx) {
        var sql = "SELECT COUNT(SEQUENCE_NAME) CNT FROM SWIFT_SEQUENCES WHERE SEQUENCE_NAME = '" + sequenceName + "'";
        tx.executeSql( sql, [], function(tx, results) {
             if (results.rows.item(0).CNT===0) {
                 sql = "INSERT INTO SWIFT_SEQUENCES(SEQUENCE_NAME,CURRENT_NUMBER) VALUES ('" + sequenceName + "',1) ";
                 tx.executeSql(sql);
             }
             sql = "SELECT (CURRENT_NUMBER+1) NEXT_NUMBER FROM SWIFT_SEQUENCES WHERE SEQUENCE_NAME='" + sequenceName + "'";
            tx.executeSql(sql, [], function(tx, results) {
                sql = "UPDATE SWIFT_SEQUENCES SET CURRENT_NUMBER=" + results.rows.item(0).NEXT_NUMBER;
                sql += " WHERE SEQUENCE_NAME='" + sequenceName + "'";
                tx.executeSql(sql);
                callback(new Number(results.rows.item(0).NEXT_NUMBER)*-1);
            }, function(tx, err) {
                if (err.code !== 0) {
                    errCallback(err);
                }
            });
        }, function(tx, err) {
            if (err.code != 0) {
                errCallback(err);
            }
        });

    }, function(err) {errCallback(err)});
}

function GetNextInvoiceID(callback,errCallback) {
    try {
        var pInvoiceUntil = new Number(parseInt(localStorage.getItem('POS_SAT_RES_DOC_FINISH')));
        var pInvId = new Number(parseInt(localStorage.getItem('POS_CURRENT_INVOICE_ID')) + 1);

        if (pInvId <= pInvoiceUntil) {
            //check if user needs to be alerted about % of left invoices
            callback(pInvId);
        } else {
            callback(-1);
        }
    } catch (e) {
        errCallback({ code: e.code, message: e.message });
    }

}
