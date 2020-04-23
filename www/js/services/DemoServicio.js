var DemoServicio = (function () {
    function DemoServicio(socket) {
        this.socket = socket;
        this.socket.on("welcome_to_sonda", this.socketOnDemo);
    }
    DemoServicio.prototype.emptyDemo = function () {
        return "";
    };
    DemoServicio.prototype.socketOnDemo = function (data) {
        var d = data;
    };
    DemoServicio.prototype.socketEmmitDemo = function () {
        var userId = "RUDI@FERCO";
        var pinCode = "123";
        this.socket.emit("validatecredentials", { 'loginid': userId, 'pin': pinCode });
    };
    DemoServicio.prototype.llamadaExternaDemo = function () {
        ToastThis("Esta es una llama externa");
    };
    DemoServicio.prototype.queryDemo = function () {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT * FROM SKUS";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.length >= 1) {
                    var sku = results.rows.item(0);
                    ToastThis(sku.SKU_DESCRIPTION);
                }
            });
        }, function (err) {
            ToastThis(err.message);
        });
    };
    return DemoServicio;
}());
//# sourceMappingURL=DemoServicio.js.map