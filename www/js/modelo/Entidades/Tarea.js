var Tarea = (function () {
    function Tarea() {
        this.taskId = 0;
        this.taskType = "";
        this.taskDate = new Date();
        this.scheduleFor = new Date();
        this.createdStamp = new Date();
        this.assignedTo = "";
        this.assignedBy = "";
        this.acceptedStamp = new Date();
        this.completedStamp = new Date();
        this.expectedGps = "0,0";
        this.postedGps = "0,0";
        this.taskComments = "";
        this.taskSeq = 0;
        this.taskAddress = "";
        this.relatedClientCode = "";
        this.relatedClientName = "";
        this.taskStatus = "";
        this.isPosted = 0;
        this.taskBoId = 0;
        this.completedSuccessfully = 0;
        this.reason = "";
        this.rgaCode = "";
        this.nit = "";
        this.phoneCustomer = "";
        this.deliveryPicture = "";
    }
    return Tarea;
}());
//# sourceMappingURL=Tarea.js.map