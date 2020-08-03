class FacturaVencidaDeCliente {
    id: number;
    invoiceId: number;
    docEntry: number;
    codeCustomer: string;
    createdDate: Date;
    dueDate: Date;
    totalAmount: number;
    pendingToPaid: number;
    payedAmount: number;
    isExpired: number;
}