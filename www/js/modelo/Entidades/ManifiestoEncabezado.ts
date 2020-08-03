class ManifiestoEncabezado {
    manifestHeaderId: number = 0;
    driver: number = 0;
    vehicle: number = 0;
    distributionCenter: string = "";
    createdDate: Date = new Date();
    status: string = "";
    lastUpdate: Date = new Date();
    lastUpdateBy: string = "";
    manifestType: string = "";
    transferRequestId: number = 0;
    manifestDetail: ManifiestoDetalle[];
    pendingDocsQty: number;
}