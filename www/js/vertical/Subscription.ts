class Subscription<TMessage> {

    public id: string;

    constructor(public tag: string, public actionCallback: (message: TMessage, subscriber: any) => void, public subcriber: any) {
        this.id = this.newGuid();
        this.tag = "--";
    }

    invoke(message: TMessage): boolean {
        this.actionCallback(message, this.subcriber);
        return true;
    }

    newGuid(): string {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
            s4() + "-" + s4() + s4() + s4();
    }
}