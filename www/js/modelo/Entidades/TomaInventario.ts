class TomaInventario {
    takeInventoryId: number;
    postedDataTime: string;
    clientId: string;
    clientName: string;
    codeRoute: string;
    gpsUrl: string;
    postedBy: string;
    deviceBatteryFactor: number;
    isActiveRoute: number;
    gpsExpected: string;
    takeInventoryIdBo: number;
    docSerie: string;
    docNum: number;
    isVoid: boolean;
    taskId: number;
    isPosted: number;
    isPostedOffLine: number = 0;
    deviceNetworkType: string = "";
   
    tomaInventarioDetalle: TomaInventarioDetalle[];
}