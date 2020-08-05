var SubscriberChangeMessage = (function () {
    function SubscriberChangeMessage(sender, messageType, subscriberCount) {
        this.sender = sender;
        this.messageType = messageType;
        this.subscriberCount = subscriberCount;
    }
    return SubscriberChangeMessage;
}());
var SubscriptionToken = (function () {
    function SubscriptionToken(id, disposeMeCallback, deliveryCallBack) {
        this.disposeMeCallback = disposeMeCallback;
        this.deliveryCallBack = deliveryCallBack;
        this.guid = id;
    }
    SubscriptionToken.prototype.dispose = function () {
        this.disposeMeCallback();
    };
    return SubscriptionToken;
}());
var Messenger = (function () {
    function Messenger() {
        this.subscriptions = new collections.Dictionary();
    }
    Messenger.prototype.subscribe = function (deliveryCallback, messageType, subscriber) {
        return this.subscribeInternal(deliveryCallback, messageType, subscriber);
    };
    Messenger.prototype.unsubscribe = function (subscriptionId, messageType) {
        this.internalUnsubscribe(subscriptionId, messageType);
    };
    Messenger.prototype.publish = function (message, messageType) {
        this.internalPublish(message, messageType);
    };
    Messenger.prototype.internalPublish = function (message, messageType) {
        if (message == null) {
            throw new Error("Argument null Exception");
        }
        var toNotify = null;
        if (this.subscriptions.containsKey(messageType)) {
            toNotify = this.subscriptions.getValue(messageType).values();
        }
        if (toNotify == null || toNotify.length === 0) {
            return;
        }
        var allSucceeded = true;
        for (var i = 0; i < toNotify.length; i++) {
            allSucceeded = toNotify[i].invoke(message) && allSucceeded;
        }
    };
    Messenger.prototype.subscribeInternal = function (deliveryCallback, messageType, subscriber) {
        var _this = this;
        if (deliveryCallback == null) {
            throw new Error("Not Delivery Callback");
        }
        var subscription = new Subscription(null, deliveryCallback, subscriber);
        var messageSubscriptions;
        if (!this.subscriptions.containsKey(messageType)) {
            messageSubscriptions = new collections.Dictionary();
            this.subscriptions.setValue(messageType, messageSubscriptions);
        }
        else {
            messageSubscriptions = this.subscriptions.getValue(messageType);
        }
        messageSubscriptions.setValue(subscription.id, subscription);
        this.publishSubscriberChangeMessage(messageSubscriptions, messageType);
        return new SubscriptionToken(subscription.id, function () { return _this.internalUnsubscribe(subscription.id, messageType); }, deliveryCallback);
    };
    Messenger.prototype.internalUnsubscribe = function (subscriptionId, messageType) {
        var messageSubscriptions;
        if (this.subscriptions.containsKey(messageType)) {
            messageSubscriptions = this.subscriptions.getValue(messageType);
            if (messageSubscriptions.containsKey(subscriptionId)) {
                messageSubscriptions.remove(subscriptionId);
            }
            this.publishSubscriberChangeMessage(messageSubscriptions, messageType);
        }
    };
    Messenger.prototype.publishSubscriberChangeMessage = function (messageSubscriptions, messageType) {
        var newCount = messageSubscriptions.size();
        var msg = new SubscriberChangeMessage(this, messageType, newCount);
        this.publish(msg, getType(SubscriberChangeMessage));
    };
    return Messenger;
}());
//# sourceMappingURL=Messenger.js.map