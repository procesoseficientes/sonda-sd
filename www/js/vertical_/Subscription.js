var Subscription = (function () {
    function Subscription(tag, actionCallback, subcriber) {
        this.tag = tag;
        this.actionCallback = actionCallback;
        this.subcriber = subcriber;
        this.id = this.newGuid();
        this.tag = "--";
    }
    Subscription.prototype.invoke = function (message) {
        this.actionCallback(message, this.subcriber);
        return true;
    };
    Subscription.prototype.newGuid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
            s4() + "-" + s4() + s4() + s4();
    };
    return Subscription;
}());
//# sourceMappingURL=subscription.js.map