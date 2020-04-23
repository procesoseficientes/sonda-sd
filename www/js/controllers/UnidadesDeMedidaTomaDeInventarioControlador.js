var UnidadesDeMedidaTomaDeInventarioControlador = (function () {
    function UnidadesDeMedidaTomaDeInventarioControlador(mensajero) {
        var _this = this;
        this.mensajero = mensajero;
        this.skuServicio = new SkuServicio();
        this.paquetesServicio = new PaqueteServicio();
        this.decimalesServicio = new ManejoDeDecimalesServicio();
        this.sku = new Sku();
        this.listaSku = [];
        this.cliente = new Cliente();
        this.listaDetalleInventario = [];
        this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
            _this.confirugacionDecimales = decimales;
        }, function (operacion) {
            notify(operacion.mensaje);
        });
        this.tokenCliente = mensajero.subscribe(this.clienteMensajeEntregado, getType(ClienteMensaje), this);
        this.tokenSku = mensajero.subscribe(this.skuMensajeEntregado, getType(SkuMensaje), this);
        this.tokenEstablecerOpcion = mensajero.subscribe(this.establecerOpcionEntregado, getType(EstablecerOpcionMensaje), this);
    }
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.clienteMensajeEntregado = function (message, subscriber) {
        subscriber.cliente = message.cliente;
    };
    ;
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.skuMensajeEntregado = function (message, subscriber) {
        subscriber.sku = message.sku;
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.establecerOpcionEntregado = function (mensaje, subcriber) {
        subcriber.skuDesdeLista = mensaje.skuDesdeLista;
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.delegarUnidadesDeMedidaTomaDeInventarioControlador = function () {
        var _this = this;
        var este = this;
        document.addEventListener("backbutton", function () {
            _this.usuarioDeseaRegresarATomaDeInventario();
        }, true);
        swipe("#UiUnitPackPageTakeInventory", function (direccion) {
            if (direccion === "right") {
                este.usuarioDeseaRegresarATomaDeInventario();
            }
        });
        $("#UiBtnSearchSku").on("click", function () {
            var uiInputSkuCode = $("#UiInputSkuCode");
            if (uiInputSkuCode.val().length > 3)
                _this.buscarSkuServidor();
            else
                notify("Debe de ingresar por lo menos 4 caracteres.");
        });
        $("#UiBtnAceptarUnitPackTakeInventory").on("click", function () {
            _this.guardarDetalleTomaDeInventario();
        });
        $("#UiBtnCancelarUnitPackTakeInventory").on("click", function () {
            _this.usuarioDeseaRegresarATomaDeInventario();
        });
        $("#UiUnitPackPageTakeInventory").on("pageshow", function () {
            var descripcionSku = $("#descriptionSkuTomaDeInventarioUnidadDeMedida");
            var uiInputSkuCode = $("#UiInputSkuCode");
            descripcionSku.text("");
            var formBusquedaSkus = $("#uiFormBusquedaSkus");
            if (_this.skuDesdeLista === "SI") {
                _this.listaSku = [];
                _this.mostrarInformacionDeSkuSeleccionado(_this.sku.sku);
                descripcionSku.text(_this.sku.skuName);
                formBusquedaSkus.css("display", "none");
            }
            else {
                var uiListaSkuMedidas = $("#UiPackUnitList");
                uiListaSkuMedidas.children().remove("li");
                formBusquedaSkus.css("display", "initial");
            }
            uiInputSkuCode.focus();
            formBusquedaSkus = null;
            descripcionSku = null;
            uiInputSkuCode = null;
        });
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.delegarSockets = function (socketIo) {
        var _this = this;
        this.socketIo = socketIo;
        socketIo.on("GetSkuByFilterForTakeInventory", function (data) {
            switch (data.option) {
                case "get_sku_by_filter_received":
                    _this.listaSku.length = 0;
                    break;
                case "get_sku_by_filter_not_found":
                    notify("Sku no encontrado.");
                    break;
                case "get_sku_by_filter_error":
                    notify("Error al buscar el sku.");
                    break;
                case "add_sku_by_filter_for_take_inventory":
                    _this.agregarSku(data.row);
                    break;
                case "get_sku_by_filter_completed":
                    if (_this.listaSku.length > 1) {
                        _this.mostrarListaSkusEncontrados();
                    }
                    else if (_this.listaSku.length === 1) {
                        _this.mostrarInformacionDeSkuSeleccionado(_this.listaSku[0].sku);
                    }
                    else if (_this.listaSku.length < 1) {
                        navigator.notification.confirm("El SKU proporcionado no existe.\nDesea guardarlo?", function (buttonIndex) {
                            if (buttonIndex === 2) {
                                _this.usuarioDeseaGuardarSkuInexistente();
                            }
                        }, "Sonda®  " + SondaVersion, "No,Si");
                    }
                    break;
                default:
            }
        });
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.usuarioDeseaRegresarATomaDeInventario = function () {
        switch ($.mobile.activePage[0].id) {
            case "UiUnitPackPageTakeInventory":
                $.mobile.changePage("#UiPageTakeInventory", {
                    transition: "pop",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
                break;
        }
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.publicarDetalleDeInventario = function (listaDetalleTomaInventario) {
        var msg = new DetalleInventarioMensaje(this);
        msg.detalleAComparar = listaDetalleTomaInventario;
        this.mensajero.publish(msg, getType(DetalleInventarioMensaje));
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.usuarioDeseaGuardarSkuInexistente = function () {
        this.mostrarTodasLasUnidadesDeMedida();
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.buscarSkuServidor = function () {
        var _this = this;
        var skuABuscar = $("#UiInputSkuCode");
        if (skuABuscar.val() === "") {
            notify("Por favor, proporcione el codigo de Sku");
        }
        else {
            if (gIsOnline === EstaEnLinea.Si) {
                this.skuServicio.obtenerSkuDesdeServidor(skuABuscar.val(), function () { });
            }
            else {
                navigator.notification.confirm("Debe tener coneccion al servidor.\nDesea guardar el SKU para su posterior verificacion?", function (buttonIndex) {
                    if (buttonIndex === 2) {
                        _this.usuarioDeseaGuardarSkuInexistente();
                    }
                }, "Sonda®  " + SondaVersion, "No,Si");
            }
        }
        skuABuscar = null;
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.agregarSku = function (data) {
        var sku = new Sku();
        sku.sku = data.CODE_SKU;
        sku.skuDescription = data.DESCRIPTION_SKU;
        sku.codeFamilySku = data.CODE_FAMILY_SKU;
        sku.descriptionFamilySku = data.DESCRIPTION_FAMILY_SKU;
        this.listaSku.push(sku);
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.mostrarListaSkusEncontrados = function () {
        var _this = this;
        try {
            var listaSkusEncontrados = [];
            for (var i = 0; i < this.listaSku.length; i++) {
                var skuTemp = this.listaSku[i];
                listaSkusEncontrados.push({
                    text: skuTemp.sku,
                    value: skuTemp.sku
                });
            }
            var configoptions = {
                title: "Listado de productos",
                items: listaSkusEncontrados,
                doneButtonLabel: "Ok",
                cancelButtonLabel: "Cancelar"
            };
            ShowListPicker(configoptions, function (item) {
                _this.mostrarInformacionDeSkuSeleccionado(item);
            });
        }
        catch (e) {
        }
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.mostrarInformacionDeSkuSeleccionado = function (codeSku) {
        var _this = this;
        var skutemp = new Sku();
        skutemp.sku = codeSku;
        this.cliente.clientId = gClientID;
        if (this.skuDesdeLista === "NO") {
            this.obtenerDescripcionSku(codeSku);
        }
        this.paquetesServicio.obtenerDenominacionesPorSku(skutemp, this.confirugacionDecimales, this.cliente, true, function (paquetes) {
            _this.listaPaquetes = paquetes;
            _this.cargarListaPaquetes();
        }, function (operacion) {
            notify(operacion.mensaje);
            var uiListaSkuMedidas = $("#UiPackUnitList");
            uiListaSkuMedidas.children().remove("li");
        });
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.obtenerDescripcionSku = function (codeSku) {
        for (var i = 0; i < this.listaSku.length; i++) {
            var skuTemp = this.listaSku[i];
            if (skuTemp.sku === codeSku) {
                var descripcionSku = $("#descriptionSkuTomaDeInventarioUnidadDeMedida");
                descripcionSku.text(skuTemp.skuDescription);
                this.sku = skuTemp;
                descripcionSku = null;
            }
        }
    };
    ;
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.cargarListaPaquetes = function () {
        var uiListaSkuMedidas = $("#UiPackUnitList");
        uiListaSkuMedidas.children().remove("li");
        for (var i = 0; i < this.listaPaquetes.length; i++) {
            var li = "";
            var paquete = this.listaPaquetes[i];
            li += "<li class='ui-field-contain'>";
            li += "<span class='medium'>" + paquete.descriptionPackUnit + "</span> ";
            li += "<br/><span class='title' id='UiDescripcionPaquete" + paquete.codePackUnit + "'></span>";
            li += "<input type='number' id='UiTextoCantidad" + paquete.codePackUnit + "' data-clear-btn='true' placeholder='Cantidad'>";
            if (paquete.lastQtySold > 0) {
                li += "<span class='small-roboto' >Ult. Inventario: " + paquete.lastQtySold + "</span>";
            }
            li += "</li>";
            uiListaSkuMedidas.append(li);
            uiListaSkuMedidas.listview("refresh");
            uiListaSkuMedidas.trigger("create");
        }
        uiListaSkuMedidas = null;
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.guardarDetalleTomaDeInventario = function () {
        if (this.listaPaquetes !== undefined)
            if (this.listaPaquetes.length > 0) {
                var listaDetalleInventarioTemp = [];
                for (var i = 0; i < this.listaPaquetes.length; i++) {
                    var detalleInventarioTemp = new TomaInventarioDetalle();
                    var txtCantidad = $("#UiTextoCantidad" + this.listaPaquetes[i].codePackUnit);
                    if (txtCantidad.val() !== "" && !isNaN(txtCantidad.val()) && txtCantidad.val() > 0) {
                        detalleInventarioTemp.codeSku = this.sku.sku;
                        detalleInventarioTemp.qty = txtCantidad.val();
                        detalleInventarioTemp.codePackUnit = this.listaPaquetes[i].codePackUnit;
                        detalleInventarioTemp.lastQty = 0;
                        if (this.listaPaquetes[i].lastQtySold > 0) {
                            detalleInventarioTemp.lastQty = this.listaPaquetes[i].lastQtySold;
                        }
                        listaDetalleInventarioTemp.push(detalleInventarioTemp);
                    }
                }
                this.publicarDetalleDeInventario(listaDetalleInventarioTemp);
                this.usuarioDeseaRegresarATomaDeInventario();
            }
    };
    UnidadesDeMedidaTomaDeInventarioControlador.prototype.mostrarTodasLasUnidadesDeMedida = function () {
        var _this = this;
        var descripcionSku = $("#descriptionSkuTomaDeInventarioUnidadDeMedida");
        descripcionSku.text("SKU PENDIENTE DE VALIDAR");
        var codigoSku = $("#UiInputSkuCode");
        this.sku.sku = codigoSku.val();
        this.paquetesServicio.obtenerTodasLasUnidadesDeMedida(function (paquetes) {
            _this.listaPaquetes = paquetes;
            _this.cargarListaPaquetes();
        }, function (operacion) {
            notify(operacion.mensaje);
            var uiListaSkuMedidas = $("#UiPackUnitList");
            uiListaSkuMedidas.children().remove("li");
        });
    };
    return UnidadesDeMedidaTomaDeInventarioControlador;
}());
//# sourceMappingURL=UnidadesDeMedidaTomaDeInventarioControlador.js.map