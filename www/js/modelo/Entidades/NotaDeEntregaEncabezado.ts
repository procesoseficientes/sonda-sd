class NotaDeEntregaEncabezado {
    deliveryNoteId: number;
    docSerie: string;
    docNum: string;
    codeCustomer: string;
    deliveryNoteIdHh: number;
    totalAmount: number;
    isPosted: number;
    createdDateTime: Date;
    postedDateTime: Date;
    taskId: number;
    invoiceId: number;
    consignmentId: number;
    devolutionId: number;
    deliveryImage: string;
    relatedPickingDemandHeaderId: number;
    billedFromSonda: number;
    detalleNotaDeEntrega: NotaDeEntregaDetalle[] = [];
    isCanceled: number;
    reasonCancel: string;
    discount: number;
    deliveryImage2: string;
    deliveryImage3: string;
    deliveryImage4: string;
    deliverySignature: string;
}