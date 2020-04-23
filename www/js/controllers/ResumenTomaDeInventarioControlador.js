var ResumenTomaDeInventarioControlador = (function () {
    function ResumenTomaDeInventarioControlador() {
        this.clienteServicio = new ClienteServicio();
        this.manejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
        this.tomaDeInventarioServicio = new TomaDeInventarioServicio();
        this.detalleTomaInventario = [];
    }
    ResumenTomaDeInventarioControlador.prototype.delegadoResumenTomaDeInventarioControlador = function () {
        var _this = this;
        document.addEventListener("backbutton", function () {
            _this.usuarioDeseaRegresarAPaginaDeTareas();
        }, true);
        $("#UiPageSummaryTakeInventory").on("pageshow", function () {
            _this.obtenerConfiguracionDeDecimales();
            _this.cargarResumen();
        });
    };
    ResumenTomaDeInventarioControlador.prototype.usuarioDeseaRegresarAPaginaDeTareas = function () {
        switch ($.mobile.activePage[0].id) {
            case "UiPageSummaryTakeInventory":
                $.mobile.changePage("#pickupplan_page", {
                    transition: "pop",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
                break;
        }
    };
    ResumenTomaDeInventarioControlador.prototype.cargarResumen = function () {
        var _this = this;
        this.limpiarCamposDeResumenDeInventario(function () {
            _this.obtenerTomaDeInventario(function () {
                _this.mostrarDatosCliente();
                _this.generarListaTomaDeInventario();
            }, function (resultado) {
                notify(resultado.mensaje);
            });
            var uiEtiquetaEstadoOrdenDeVenta = $('#UiEtiquetaEstadoOrdenDeVenta');
            uiEtiquetaEstadoOrdenDeVenta.text("Activa");
            uiEtiquetaEstadoOrdenDeVenta = null;
        });
    };
    ResumenTomaDeInventarioControlador.prototype.obtenerTomaDeInventario = function (callback, errCallBack) {
        var _this = this;
        try {
            this.tarea = new Tarea();
            this.tarea.taskId = gtaskid;
            this.tarea.taskType = gTaskType;
            this.tarea.taskStatus = TareaEstado.Completada;
            this.cliente = new Cliente();
            this.cliente.clientId = gClientID;
            this.clienteServicio.obtenerCliente(this.cliente, this.configuracionDecimales, function (clienteObtenido) {
                _this.cliente = clienteObtenido;
                _this.tomaDeInventarioServicio.obtenerTomaDeInventarioPorTarea(_this.tarea, _this.configuracionDecimales, function (tomaDeInventario) {
                    _this.mostarDatosDeTomaDeInventario(tomaDeInventario);
                    _this.detalleTomaInventario = [];
                    for (var i = 0; i < tomaDeInventario.tomaInventarioDetalle.length; i++) {
                        var detalleTomaDeInventario = tomaDeInventario.tomaInventarioDetalle[i];
                        var detalle = new TomaInventarioDetalle();
                        detalle.codeSku = detalleTomaDeInventario.codeSku;
                        detalle.skuName = detalleTomaDeInventario.skuName;
                        detalle.qty = trunc_number(detalleTomaDeInventario.qty, _this.configuracionDecimales.defaultCalculationsDecimals);
                        detalle.codePackUnit = detalleTomaDeInventario.codePackUnit;
                        detalle.lastQty = trunc_number(detalleTomaDeInventario.lastQty, _this.configuracionDecimales.defaultCalculationsDecimals);
                        _this.detalleTomaInventario.push(detalle);
                    }
                    callback();
                }, function (resultado) {
                    errCallBack(resultado);
                });
            }, function (operacion) {
                notify(operacion.mensaje);
            });
        }
        catch (err) {
            errCallBack({ codigo: -1, mensaje: "Error al obtener la orden de venta: " + err.message });
        }
    };
    ResumenTomaDeInventarioControlador.prototype.generarListaTomaDeInventario = function () {
        try {
            var uiListaTomaDeInventario = $('#UiListaRepTomaDeInventario');
            uiListaTomaDeInventario.children().remove('li');
            var uiTotalSkusInventareadosResumen = $("#uiTotalSkusInventareadosResumen");
            uiTotalSkusInventareadosResumen.text(0);
            for (var i = 0; i < this.detalleTomaInventario.length; i++) {
                var detalle = this.detalleTomaInventario[i];
                var li = "<li data-icon='false' class='ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'>";
                li += "<p><h4>" + detalle.codeSku + "/" + detalle.skuName + "</h4></p>";
                li += "<p>";
                li += "<b>Denominacion: </b><span>" + detalle.codePackUnit + " </span>";
                li += "<br/><b>Ult.Inventario: </b><span>" + detalle.lastQty + " </span>";
                li += "<span class='ui-li-count'>" + ToDecimal(detalle.qty) + "</span>";
                li += "</p>";
                uiListaTomaDeInventario.append(li);
                uiListaTomaDeInventario.listview('refresh');
                var loQueLleva = parseFloat(uiTotalSkusInventareadosResumen.text());
                var total = loQueLleva + parseFloat(detalle.qty.toString());
                uiTotalSkusInventareadosResumen.text(total.toString());
            }
            uiListaTomaDeInventario = null;
        }
        catch (err) {
            notify("Error al generar la lista de inventario tomado: " + err.message);
        }
    };
    ResumenTomaDeInventarioControlador.prototype.mostarDatosDeTomaDeInventario = function (tomaDeInventario) {
        var uiEtiquetaFechaTomaDeInventario = $('#UiEtiquetaFechaTomaDeInventario');
        uiEtiquetaFechaTomaDeInventario.text(tomaDeInventario.postedDataTime);
        uiEtiquetaFechaTomaDeInventario = null;
        var uiEtiquetaSerieDeDocumentoTomaDeInventario = $('#UiEtiquetaSerieDeDocumentoTomaDeInventario');
        uiEtiquetaSerieDeDocumentoTomaDeInventario.text(tomaDeInventario.docSerie);
        uiEtiquetaSerieDeDocumentoTomaDeInventario = null;
        var uiEtiquetaNumeroDeDocumentoTomaDeInventario = $('#UiEtiquetaNumeroDeDocumentoTomaDeInventario');
        uiEtiquetaNumeroDeDocumentoTomaDeInventario.text(tomaDeInventario.docNum);
        uiEtiquetaNumeroDeDocumentoTomaDeInventario = null;
        var uiEtiquetaEstadoTomaDeInventario = $('#UiEtiquetaEstadoTomaDeInventario');
        if (tomaDeInventario.isVoid) {
            uiEtiquetaEstadoTomaDeInventario.text("Anulada");
        }
        else {
            uiEtiquetaEstadoTomaDeInventario.text("Activa");
        }
        uiEtiquetaEstadoTomaDeInventario = null;
    };
    ResumenTomaDeInventarioControlador.prototype.mostrarDatosCliente = function () {
        try {
            var uiEtiquetaRepRanzonSocialTomaInventario = $('#UiEtiquetaRepRanzonSocialTomaInventario');
            uiEtiquetaRepRanzonSocialTomaInventario.text(this.cliente.clientName);
            uiEtiquetaRepRanzonSocialTomaInventario = null;
            var uiEtiquetaRepDireccionTomaInventario = $('#UiEtiquetaRepDireccionTomaDeInventario');
            uiEtiquetaRepDireccionTomaInventario.text(this.cliente.address);
            uiEtiquetaRepDireccionTomaInventario = null;
            var uiEtiquetaRepNoTelefonoTomaDeInventario = $('#UiEtiquetaRepNoTelefonoTomaDeInventario');
            uiEtiquetaRepNoTelefonoTomaDeInventario.text(this.cliente.phone);
            uiEtiquetaRepNoTelefonoTomaDeInventario = null;
            var uiEtiquetaRepContactoTomaDeInventario = $('#UiEtiquetaRepContactoTomaDeInventario');
            uiEtiquetaRepContactoTomaDeInventario.text(this.cliente.contactCustomer);
            uiEtiquetaRepContactoTomaDeInventario = null;
        }
        catch (err) {
            notify("Error al mostrar datos del cliente " + err.message);
        }
    };
    ResumenTomaDeInventarioControlador.prototype.limpiarCamposDeResumenDeInventario = function (callback) {
        var uiEtiquetaRepRanzonSocialTomaInventario = $('#UiEtiquetaRepRanzonSocialTomaInventario');
        uiEtiquetaRepRanzonSocialTomaInventario.text("...");
        uiEtiquetaRepRanzonSocialTomaInventario = null;
        var uiEtiquetaRepDireccionTomaInventario = $('#UiEtiquetaRepDireccionTomaDeInventario');
        uiEtiquetaRepDireccionTomaInventario.text("...");
        uiEtiquetaRepDireccionTomaInventario = null;
        var uiEtiquetaRepNoTelefonoTomaDeInventario = $('#UiEtiquetaRepNoTelefonoTomaDeInventario');
        uiEtiquetaRepNoTelefonoTomaDeInventario.text("...");
        uiEtiquetaRepNoTelefonoTomaDeInventario = null;
        var uiEtiquetaRepContactoTomaDeInventario = $('#UiEtiquetaRepContactoTomaDeInventario');
        uiEtiquetaRepContactoTomaDeInventario.text("...");
        uiEtiquetaRepContactoTomaDeInventario = null;
        var uiEtiquetaFechaTomaDeInventario = $('#UiEtiquetaFechaTomaDeInventario');
        uiEtiquetaFechaTomaDeInventario.text("...");
        uiEtiquetaFechaTomaDeInventario = null;
        var uiEtiquetaSerieDeDocumentoTomaDeInventario = $('#UiEtiquetaSerieDeDocumentoTomaDeInventario');
        uiEtiquetaSerieDeDocumentoTomaDeInventario.text("...");
        uiEtiquetaSerieDeDocumentoTomaDeInventario = null;
        var uiEtiquetaNumeroDeDocumentoTomaDeInventario = $('#UiEtiquetaNumeroDeDocumentoTomaDeInventario');
        uiEtiquetaNumeroDeDocumentoTomaDeInventario.text("...");
        uiEtiquetaNumeroDeDocumentoTomaDeInventario = null;
        var uiEtiquetaEstadoTomaDeInventario = $("#UiEtiquetaEstadoTomaDeInventario");
        uiEtiquetaEstadoTomaDeInventario.text("...");
        uiEtiquetaEstadoTomaDeInventario = null;
        callback();
    };
    ResumenTomaDeInventarioControlador.prototype.obtenerConfiguracionDeDecimales = function () {
        var _this = this;
        this.manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
            _this.configuracionDecimales = decimales;
        }, function (operacion) {
            notify(operacion.mensaje);
        });
    };
    return ResumenTomaDeInventarioControlador;
}());
//# sourceMappingURL=ResumenTomaDeInventarioControlador.js.map