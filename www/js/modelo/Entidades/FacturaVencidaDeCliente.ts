class FacturaVencidaDeCliente {
    id: number;
    invoiceId: string;
    docEntry: string;
    codeCustomer: string;
    createdDate: Date;
    dueDate: Date;
    totalAmount: number;
    pendingToPaid: number;
    payedAmount: number;
    isExpired: number;
    amountToDate: number = 0;
}