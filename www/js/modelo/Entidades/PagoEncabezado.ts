class PagoEncabezado {
    paymentNum: number;
    clientId: string;
    clientName: string;
    totalAmount: number;
    postedDatetime: string;
    posTerminal: string;
    gps: string;
    docDate: string;
    depositToDate: Date;
    isPosted: number;
    status: string;
    paymentBoNum: number;
    docSerie: string;
    docNum: number;

    pagoDetalle: PagoDetalle[];
}