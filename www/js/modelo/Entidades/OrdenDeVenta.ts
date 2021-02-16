﻿class OrdenDeVenta {
    salesOrderId: number;
    terms: string;
    postedDatetime: string;
    clientId: string;
    clientName: string;
    posTerminal: string;
    gpsUrl: string;
    totalAmount: number;
    status: string;
    image1: string;
    image2: string;
    image3: string;
    deviceBatteryFactor: number;
    gpsExpected: string;
    salesOrderIdBo: number;
    isPosted: number;
    deliveryDate: Date;
    taskId: number;
    isParent: boolean;
    referenceId: string;
    timesPrinted: number;
    docSerie: string;
    docNum: number;
    isPostedVoid: number;
    isVoid: boolean;
    salesOrderType: string;
    discount: number;
    postedBy: string;
    voidDatetime: string;
    voidReason: string;
    voidNotes: string;
    voided: string;
    closedRouteDatetime: string;
    datetime: string;
    isActiveRoute: number;
    sinc: number;
    discountApplied: number;
    totalAmountDisplay: number;
    isDraft: number;
    isUpdated: number;
    comment: string;
    taskIdBo: number = 0;
    paymentTimesPrinted: number;
    paidToDate: number;
    toBill: number;
    ordenDeVentaDetalle: OrdenDeVentaDetalle[];
    authorized: boolean;
    detailQty: number;
    isPostedValidated: number;
    isSalesByMultiple: boolean;
    multipleSaleQty: number;
    discountByGeneralAmountApplied: number;
    isPostedOffLine: number = 0;
    deviceNetworkType: string = "";
    goalHeaderId: number = 0;
    purchaseOrderNumber: string = "";
}