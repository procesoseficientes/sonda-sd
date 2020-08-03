
declare function getType(sender: any): string;

class SubscriberChangeMessage {
    constructor(public sender: any, public messageType: string, public subscriberCount: number) { }

}

class SubscriptionToken {
    public guid: string;
    private dependentObjects: any[];

    constructor(id: string, public disposeMeCallback: () => void, public deliveryCallBack: (message: any, subscriber: any) => void) {
        this.guid = id;
    }

    public dispose(): void {
        this.disposeMeCallback();
    }

}


interface IMessenger {
    subscribe<TMessage>(deliveryCallback: (message: TMessage) => void, messageType: string, subscriber: any): SubscriptionToken;
    unsubscribe<TMessage>(subscriptionId: string, messageType: string): void;
    publish<TMessage>(message: TMessage, messageType: string): void;
}

class Messenger implements IMessenger {
    private subscriptions: collections.Dictionary<string, collections.Dictionary<string, Subscription<any>>>;

    constructor() {
        this.subscriptions = new collections.Dictionary<string, collections.Dictionary<string, Subscription<any>>>();
    }

    subscribe<TMessage>(deliveryCallback: (message: TMessage, subscriber: any) => void, messageType: string, subscriber: any): SubscriptionToken {
        return this.subscribeInternal(deliveryCallback, messageType, subscriber);
    }

    unsubscribe<TMessage>(subscriptionId: string, messageType: string): void {
        this.internalUnsubscribe<TMessage>(subscriptionId, messageType);
    }

    publish<TMessage>(message: TMessage, messageType: string): void {
        this.internalPublish(message, messageType);
    }

    private internalPublish<TMessage>(message: TMessage, messageType: string): void {
        if (message == null) {
            throw new Error("Argument null Exception");
        }
        var toNotify: Subscription<TMessage>[] = null;
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


    }

    private subscribeInternal<TMessage>(deliveryCallback: (message: TMessage, subscriber: any) => void, messageType: string, subscriber: any): SubscriptionToken {
        if (deliveryCallback == null) {
            throw new Error("Not Delivery Callback");
        }
        var subscription = new Subscription<TMessage>(null, deliveryCallback, subscriber);

        var messageSubscriptions: collections.Dictionary<string, Subscription<TMessage>>;
        if (!this.subscriptions.containsKey(messageType)) {
            messageSubscriptions = new collections.Dictionary<string, Subscription<TMessage>>();
            this.subscriptions.setValue(messageType, messageSubscriptions);
        } else {
            messageSubscriptions = this.subscriptions.getValue(messageType);
        }

        messageSubscriptions.setValue(subscription.id, subscription);
        this.publishSubscriberChangeMessage<TMessage>(messageSubscriptions, messageType);

        return new SubscriptionToken(subscription.id, () => this.internalUnsubscribe(subscription.id, messageType), deliveryCallback);


    }

    private internalUnsubscribe<TMessage>(subscriptionId: string, messageType: string) {
        var messageSubscriptions: collections.Dictionary<string, Subscription<TMessage>>;
        if (this.subscriptions.containsKey(messageType)) {
            messageSubscriptions = this.subscriptions.getValue(messageType);
            if (messageSubscriptions.containsKey(subscriptionId)) {
                messageSubscriptions.remove(subscriptionId);
            }
            this.publishSubscriberChangeMessage<TMessage>(messageSubscriptions, messageType);
        }
    }

    private publishSubscriberChangeMessage<TMessage>(messageSubscriptions: collections.Dictionary<string, Subscription<TMessage>>, messageType: string) {
        var newCount = messageSubscriptions.size();
        var msg = new SubscriberChangeMessage(this, messageType, newCount);
        this.publish(msg, getType(SubscriberChangeMessage));
    }

}




