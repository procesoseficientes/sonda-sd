class ResumenTomaDeInventarioControlador {


    clienteServicio= new ClienteServicio();
    manejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
    tomaDeInventarioServicio= new TomaDeInventarioServicio();


    configuracionDecimales: ManejoDeDecimales;
    tarea: Tarea;
    cliente: Cliente;
    detalleTomaInventario: TomaInventarioDetalle[] = [];

    delegadoResumenTomaDeInventarioControlador() {

        document.addEventListener("backbutton", () => {
            this.usuarioDeseaRegresarAPaginaDeTareas();
        }, true);

        $("#UiPageSummaryTakeInventory").on("pageshow", () => {
            this.obtenerConfiguracionDeDecimales();
            this.cargarResumen();
        });
        
    }

    usuarioDeseaRegresarAPaginaDeTareas() {
        switch ($.mobile.activePage[0].id) {
            case "UiPageSummaryTakeInventory":
                $.mobile.changePage("#pickupplan_page",
                    {
                        transition: "pop",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                break;
        }
    }

    cargarResumen() {
        this.limpiarCamposDeResumenDeInventario(() => {
            this.obtenerTomaDeInventario(() => {
                this.mostrarDatosCliente();
                this.generarListaTomaDeInventario();
            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
                var uiEtiquetaEstadoOrdenDeVenta = $('#UiEtiquetaEstadoOrdenDeVenta');
                uiEtiquetaEstadoOrdenDeVenta.text("Activa");
                uiEtiquetaEstadoOrdenDeVenta = null;
        });
    }

    obtenerTomaDeInventario(callback: () => void, errCallBack: (resultado: Operacion) => void) {
        try {
            this.tarea = new Tarea();
            this.tarea.taskId = gtaskid;
            this.tarea.taskType = gTaskType;
            this.tarea.taskStatus = TareaEstado.Completada;
            this.cliente = new Cliente();
            this.cliente.clientId = gClientID;
            this.clienteServicio.obtenerCliente(this.cliente, this.configuracionDecimales, (clienteObtenido) => {
                this.cliente = clienteObtenido;
            this.tomaDeInventarioServicio.obtenerTomaDeInventarioPorTarea(this.tarea, this.configuracionDecimales, (tomaDeInventario: TomaInventario) => {
                //this.cliente.deliveryDate = tomaDeInventario.deliveryDate;
                this.mostarDatosDeTomaDeInventario(tomaDeInventario);
                this.detalleTomaInventario = [];
                for (var i = 0; i < tomaDeInventario.tomaInventarioDetalle.length; i++) {
                    var detalleTomaDeInventario = tomaDeInventario.tomaInventarioDetalle[i];
                    var detalle = new TomaInventarioDetalle();
                    detalle.codeSku= detalleTomaDeInventario.codeSku;
                    detalle.skuName = detalleTomaDeInventario.skuName;
                    detalle.qty = trunc_number(detalleTomaDeInventario.qty, this.configuracionDecimales.defaultCalculationsDecimals);
                    detalle.codePackUnit = detalleTomaDeInventario.codePackUnit;
                    detalle.lastQty = trunc_number(detalleTomaDeInventario.lastQty, this.configuracionDecimales.defaultCalculationsDecimals);
                    this.detalleTomaInventario.push(detalle);
                }
                callback();
            }, (resultado: Operacion) => {
                errCallBack(resultado);
                    });
            }, (operacion: Operacion) => {
                notify(operacion.mensaje);
            });

        } catch (err) {
            errCallBack(<Operacion>{ codigo: -1, mensaje: "Error al obtener la orden de venta: " + err.message });
        }
    }

    generarListaTomaDeInventario() {
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
                //li += "<span class='ui-li-count' style='position:absolute; top:80%'>" + ToDecimal(detalle.cost) + "</span>";
                li += "</p>";

                uiListaTomaDeInventario.append(li);
                uiListaTomaDeInventario.listview('refresh');
                var loQueLleva: number = parseFloat(uiTotalSkusInventareadosResumen.text());
                var total: number = loQueLleva + parseFloat(detalle.qty.toString());
                uiTotalSkusInventareadosResumen.text(total.toString());
            }
            uiListaTomaDeInventario = null;
        } catch (err) {
            notify("Error al generar la lista de inventario tomado: " + err.message);
        }
    }

    mostarDatosDeTomaDeInventario(tomaDeInventario: TomaInventario) {

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
        } else {
            uiEtiquetaEstadoTomaDeInventario.text("Activa");
        }
        uiEtiquetaEstadoTomaDeInventario = null;
    }

    mostrarDatosCliente() {
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
                
        } catch (err) {
            notify("Error al mostrar datos del cliente " + err.message);
        }
    }

    limpiarCamposDeResumenDeInventario(callback: () => void) {
        var uiEtiquetaRepRanzonSocialTomaInventario = $('#UiEtiquetaRepRanzonSocialTomaInventario');
        uiEtiquetaRepRanzonSocialTomaInventario.text("...");
        uiEtiquetaRepRanzonSocialTomaInventario = null;
        var uiEtiquetaRepDireccionTomaInventario = $('#UiEtiquetaRepDireccionTomaDeInventario');
        uiEtiquetaRepDireccionTomaInventario.text("...");
        uiEtiquetaRepDireccionTomaInventario = null;
        var uiEtiquetaRepNoTelefonoTomaDeInventario = $('#UiEtiquetaRepNoTelefonoTomaDeInventario');
        uiEtiquetaRepNoTelefonoTomaDeInventario.text("...");
        uiEtiquetaRepNoTelefonoTomaDeInventario  = null;
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
    }


    obtenerConfiguracionDeDecimales() {
        this.manejoDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {
            this.configuracionDecimales = decimales;
        }, (operacion: Operacion) => {
            notify(operacion.mensaje);
        });
    }

}