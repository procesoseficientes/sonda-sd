class Tarea {
    taskId: number = 0;
    taskType: string = "";
    taskDate: Date = new Date();
    scheduleFor: Date = new Date();
    createdStamp: Date = new Date();
    assignedTo: string = "";
    assignedBy: string = "";
    acceptedStamp: Date = new Date();
    completedStamp: Date = new Date();
    expectedGps: string = "0,0";
    postedGps: string = "0,0";
    taskComments: string = "";
    taskSeq: number = 0;
    taskAddress: string = "";
    relatedClientCode: string = "";
    relatedClientName: string = "";
    taskStatus: string = "";
    isPosted: number = 0;
    taskBoId: number = 0;
    completedSuccessfully: number = 0;
    reason: string = "";
    rgaCode: string = "";
    nit: string = "";
    phoneCustomer: string = "";
    deliveryPicture: string = "";
}