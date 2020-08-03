var ResumenDeTareaControlador = (function () {
    function ResumenDeTareaControlador(mensajero) {
        this.mensajero = mensajero;
        this.manejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
        this.resumenDeTareaServicio = new ResumenDeTareaServicio();
        this.controlDeSecuenciaServicio = new ControlDeSecuenciaServicio();
    }
    ResumenDeTareaControlador.prototype.delegarResumenDeTareaControlador = function () {
        var _this_1 = this;
        $("#UiTaskResumePage").on("pageshow", function (e) {
            e.preventDefault();
            InteraccionConUsuarioServicio.bloquearPantalla();
            _this_1.cargarPantalla();
        });
        $("#UiBtnGoBackFromTaskResume").on("click", function (e) {
            e.preventDefault();
            window.history.back();
        });
        $("#UiBtnCreateNewTask").on("click", function (e) {
            e.preventDefault();
            _this_1.crearNuevaTarea();
        });
    };
    ResumenDeTareaControlador.prototype.cargarDatosDeTareaSeleccionada = function () {
        try {
            var factureExist = this.facturaProcesada ? true : false;
            var uiLblTaskId = $("#UiLblTaskId");
            var uiLblInvoiceId = $("#UiLblInvoiceId");
            var uiLblCustomerCode = $("#UiLblCustomerCode");
            var uiLblCustomerName = $("#UiLblCustomerName");
            var uiLblCustomerAddress = $("#UiLblCustomerAddress");
            var uiLblInvoiceIdHeader = $("#UiLblInvoiceIdHeader");
            var uiLblTotalAmountDocument = $("#UiLblTotalAmountDocument");
            var uiTxtAreaInvoiceComment = $("#UiTxtAreaInvoiceComment");
            var uiImgPostingStatusIndicator = $("#UiImgPostingStatusIndicator");
            uiLblTaskId.text(this.tareaProcesada.taskId || "N/A");
            uiLblInvoiceId.text(factureExist
                ? this.facturaProcesada.invoiceNum
                : this.tareaProcesada.reason);
            uiLblInvoiceIdHeader.text(factureExist ? "No. Factura" : "Razón de no venta");
            uiLblTotalAmountDocument.text(this.configuracionDeDecimales.currencySymbol + ". " + format_number(factureExist ? this.facturaProcesada.totalAmount : 0, this.configuracionDeDecimales.defaultDisplayDecimals));
            uiTxtAreaInvoiceComment.text(factureExist ? this.facturaProcesada.comment : "...");
            uiLblCustomerCode.text(this.tareaProcesada.relatedClientCode || "...");
            uiLblCustomerName.text(this.tareaProcesada.relatedClientName || "...");
            uiLblCustomerAddress.text(this.tareaProcesada.taskAddress || "...");
            var confirmed = "img/confirmed.jpg", unconfirmed = "img/unconfirmed.png";
            var srcOfImage = (factureExist
                ? !this.facturaProcesada.idBo ||
                    this.facturaProcesada.isPostedValidated !== 2
                : !this.tareaProcesada.taskBoId)
                ? unconfirmed
                : confirmed;
            uiImgPostingStatusIndicator.attr("src", srcOfImage);
            uiLblCustomerCode = null;
            uiLblCustomerName = null;
            uiLblCustomerAddress = null;
            uiLblTotalAmountDocument = null;
            uiTxtAreaInvoiceComment = null;
            uiImgPostingStatusIndicator = null;
            uiLblTaskId = null;
            uiLblInvoiceId = null;
            InteraccionConUsuarioServicio.desbloquearPantalla();
        }
        catch (error) {
            notify(error.message);
        }
    };
    ResumenDeTareaControlador.prototype.obtenerTarea = function () {
        var _this_1 = this;
        TareaServicio.obtenerTareaPorCodigoYTipo(gTaskId, "SALE", function (tarea) {
            _this_1.tareaProcesada = tarea;
            _this_1.cargarFacturaDeTarea();
        }, function (resultado) {
            notify(resultado);
        });
    };
    ResumenDeTareaControlador.prototype.cargarFacturaDeTarea = function () {
        var _this_1 = this;
        this.resumenDeTareaServicio.obtenerFacturaPorIdentificadorDeTarea(gTaskId, function (factura) {
            _this_1.facturaProcesada = factura;
            _this_1.cargarDatosDeTareaSeleccionada();
        }, function (resultado) {
            _this_1.facturaProcesada = null;
            _this_1.cargarDatosDeTareaSeleccionada();
        });
    };
    ResumenDeTareaControlador.prototype.limpiarDatosDePantalla = function (callback) {
        var uiLblTaskId = $("#UiLblTaskId");
        var uiLblInvoiceId = $("#UiLblInvoiceId");
        var uiLblCustomerCode = $("#UiLblCustomerCode");
        var uiLblCustomerName = $("#UiLblCustomerName");
        var uiLblCustomerAddress = $("#UiLblCustomerAddress");
        var uiLblTotalAmountDocument = $("#UiLblTotalAmountDocument");
        uiLblTaskId.text("");
        uiLblInvoiceId.text("");
        uiLblCustomerCode.text("");
        uiLblCustomerName.text("");
        uiLblCustomerAddress.text("");
        uiLblTotalAmountDocument.text(this.configuracionDeDecimales.currencySymbol + ". " + format_number(0, this.configuracionDeDecimales.defaultDisplayDecimals));
        uiLblCustomerCode = null;
        uiLblCustomerName = null;
        uiLblCustomerAddress = null;
        uiLblTotalAmountDocument = null;
        uiLblTaskId = null;
        uiLblInvoiceId = null;
        callback();
    };
    ResumenDeTareaControlador.prototype.cargarPantalla = function () {
        var _this_1 = this;
        this.manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (configuracionDecimales) {
            _this_1.configuracionDeDecimales = configuracionDecimales;
            _this_1.limpiarDatosDePantalla(function () {
                _this_1.obtenerTarea();
            });
        });
    };
    ResumenDeTareaControlador.prototype.crearNuevaTarea = function () {
        var _this_1 = this;
        try {
            this.manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (configuracionDecimales) {
                _this_1.configuracionDeDecimales = configuracionDecimales;
                _this_1.obtenerTarea();
            });
            var to_1 = setTimeout(function () {
                clearTimeout(to_1);
                if (_this_1.tareaProcesada === null || _this_1.tareaProcesada === undefined) {
                    return notify("Lo sentimos, no se pudo encontrar la tarea base.");
                }
                InteraccionConUsuarioServicio.bloquearPantalla();
                var nuevaTarea = Object.assign(new Tarea(), _this_1.tareaProcesada);
                nuevaTarea.taskStatus = "ASSIGNED";
                nuevaTarea.taskType = "SALE";
                nuevaTarea.taskComments = "Nueva tarea generada para el cliente " + _this_1.tareaProcesada.relatedClientName;
                nuevaTarea.isPosted = -1;
                nuevaTarea.acceptedStamp = null;
                nuevaTarea.postedGps = null;
                nuevaTarea.createdStamp = getDateTime();
                nuevaTarea.taskDate = getDateTime();
                nuevaTarea.scheduleFor = getDateTime();
                nuevaTarea.inPlanRoute = _this_1.tareaProcesada.inPlanRoute || 0;
                nuevaTarea.department = _this_1.tareaProcesada.department;
                nuevaTarea.municipality = _this_1.tareaProcesada.municipality;
                _this_1.controlDeSecuenciaServicio.obtenerSiguienteNumeroDeSecuenciaDeControl(TiposDeSecuenciaAControlar.NuevaTarea, function (controlDeSecuencia) {
                    nuevaTarea.taskId = controlDeSecuencia.NEXT_VALUE;
                    nuevaTarea.taskBoId = controlDeSecuencia.NEXT_VALUE;
                    _this_1.resumenDeTareaServicio.crearNuevaTarea(nuevaTarea, function () {
                        _this_1.controlDeSecuenciaServicio.actualizarSecuenciaDeControl(controlDeSecuencia, function () {
                            InvoiceThisTask(nuevaTarea.taskId, nuevaTarea.relatedClientCode, nuevaTarea.relatedClientName, nuevaTarea.nit, nuevaTarea.taskType, nuevaTarea.taskStatus);
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                        }, function (resultado) {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            notify(resultado.mensaje);
                        });
                    }, function (resultado) {
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify(resultado.mensaje);
                    });
                }, function (resultado) {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify(resultado.mensaje);
                });
            }, 300);
        }
        catch (err) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("No se ha podido crear la tarea debido a: " + err.message);
        }
    };
    return ResumenDeTareaControlador;
}());
//# sourceMappingURL=ResumenDeTareaControlador.js.map