class UnidadesDeMedidaTomaDeInventarioControlador {

    tokenCliente: SubscriptionToken;
    tokenSku: SubscriptionToken;
    tokenEstablecerOpcion: SubscriptionToken;
    
    skuServicio = new SkuServicio();
    paquetesServicio = new PaqueteServicio();
    decimalesServicio = new ManejoDeDecimalesServicio();

    skuDesdeLista: string;
    sku: Sku= new Sku();
    listaSku: Sku[] = [];
    confirugacionDecimales: ManejoDeDecimales;
    cliente = new Cliente();
    listaPaquetes: Paquete[];

    listaDetalleInventario: TomaInventarioDetalle[] = [];
    socketIo: SocketIOClient.Socket;

constructor(public mensajero: Messenger) {
    this.decimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {
        this.confirugacionDecimales = decimales;
        }, (operacion: Operacion) => {
            notify(operacion.mensaje);
        });
    
    this.tokenCliente = mensajero.subscribe<ClienteMensaje>(this.clienteMensajeEntregado, getType(ClienteMensaje), this);
    this.tokenSku = mensajero.subscribe<SkuMensaje>(this.skuMensajeEntregado, getType(SkuMensaje), this);
    this.tokenEstablecerOpcion = mensajero.subscribe<EstablecerOpcionMensaje>(this.establecerOpcionEntregado, getType(EstablecerOpcionMensaje), this);
}

    clienteMensajeEntregado(message: ClienteMensaje, subscriber: any) {
        subscriber.cliente = message.cliente;
    };

    skuMensajeEntregado(message: SkuMensaje, subscriber: any) {
        subscriber.sku = message.sku;
    }

    establecerOpcionEntregado(mensaje: EstablecerOpcionMensaje, subcriber: any): void {
        subcriber.skuDesdeLista = mensaje.skuDesdeLista;
    }

    delegarUnidadesDeMedidaTomaDeInventarioControlador() {
        var este = this;

        document.addEventListener("backbutton", () => {
            this.usuarioDeseaRegresarATomaDeInventario();
        }, true);

        

        swipe("#UiUnitPackPageTakeInventory", direccion => {
            if (direccion === "right") {
                este.usuarioDeseaRegresarATomaDeInventario();
            } 
        });
        //$("#UiUnitPackPageTakeInventory").on("swiperight", () => {
        //    this.usuarioDeseaRegresarATomaDeInventario();`
        //});

        $("#UiBtnSearchSku").on("click", () => {
            
            var uiInputSkuCode = $("#UiInputSkuCode");
            if(uiInputSkuCode.val().length>3)
                this.buscarSkuServidor();
            else 
                notify("Debe de ingresar por lo menos 4 caracteres.");
        });
        $("#UiBtnAceptarUnitPackTakeInventory").on("click", () => {
            this.guardarDetalleTomaDeInventario();
        });
        $("#UiBtnCancelarUnitPackTakeInventory").on("click", () => {
            this.usuarioDeseaRegresarATomaDeInventario();
        });

        $("#UiUnitPackPageTakeInventory").on("pageshow", () => {
            var descripcionSku = $("#descriptionSkuTomaDeInventarioUnidadDeMedida");
            var uiInputSkuCode = $("#UiInputSkuCode");
            
            descripcionSku.text("");
            
            var formBusquedaSkus = $("#uiFormBusquedaSkus");

            if (this.skuDesdeLista==="SI") {
                this.listaSku = [];
                this.mostrarInformacionDeSkuSeleccionado(this.sku.sku);
                descripcionSku.text(this.sku.skuName);
                formBusquedaSkus.css("display", "none");
                
            } else {
                var uiListaSkuMedidas = $("#UiPackUnitList");
                uiListaSkuMedidas.children().remove("li");
                //descripcionSku.text("");
                formBusquedaSkus.css("display", "initial");
            }
            uiInputSkuCode.focus();
            formBusquedaSkus = null;
            descripcionSku = null;
            uiInputSkuCode = null;

        });
    }

    delegarSockets(socketIo: SocketIOClient.Socket) {
        this.socketIo = socketIo;
        socketIo.on("GetSkuByFilterForTakeInventory", (data) => {
            switch (data.option) {
                case "get_sku_by_filter_received":
                    this.listaSku.length = 0;
                    break;
                case "get_sku_by_filter_not_found":
                    notify("Sku no encontrado.");
                    break;
                case "get_sku_by_filter_error":
                    notify("Error al buscar el sku.");
                    break;
                case "add_sku_by_filter_for_take_inventory":
                    this.agregarSku(data.row);
                    break;
                case "get_sku_by_filter_completed":
                    if (this.listaSku.length > 1) {
                        this.mostrarListaSkusEncontrados();
                    }
                    else if (this.listaSku.length === 1) {
                        this.mostrarInformacionDeSkuSeleccionado(this.listaSku[0].sku);
                    }
                    else if (this.listaSku.length < 1) {
                        navigator.notification.confirm(
                            "El SKU proporcionado no existe.\nDesea guardarlo?",
                            (buttonIndex) => {
                                if (buttonIndex === 2) {
                                    this.usuarioDeseaGuardarSkuInexistente();
                                }
                            }, "Sonda®  " + SondaVersion, <any>"No,Si"
                        );
                    }
                    break;
                default:
            }
        });
    }

    usuarioDeseaRegresarATomaDeInventario() {
        switch ($.mobile.activePage[0].id) {
            case "UiUnitPackPageTakeInventory":
                $.mobile.changePage("#UiPageTakeInventory",
                    {
                        transition: "pop",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                break;
        }
    }
    
    publicarDetalleDeInventario(listaDetalleTomaInventario: TomaInventarioDetalle[]) {
        var msg = new DetalleInventarioMensaje(this);
        msg.detalleAComparar = listaDetalleTomaInventario;
        this.mensajero.publish(msg, getType(DetalleInventarioMensaje));
    }

    usuarioDeseaGuardarSkuInexistente() {
        this.mostrarTodasLasUnidadesDeMedida();
    }

    buscarSkuServidor() {
        var skuABuscar = $("#UiInputSkuCode");

        if (skuABuscar.val() === "") {
            notify("Por favor, proporcione el codigo de Sku");
        } else  {
            if (gIsOnline === EstaEnLinea.Si) {
                this.skuServicio.obtenerSkuDesdeServidor(skuABuscar.val(), () => {});
            } else {
                navigator.notification.confirm(
                    "Debe tener coneccion al servidor.\nDesea guardar el SKU para su posterior verificacion?", // message
                    (buttonIndex) => {
                        if (buttonIndex === 2) {
                            this.usuarioDeseaGuardarSkuInexistente();
                        }
                    }, "Sonda®  " + SondaVersion, <any>"No,Si"
                ); 
            }
        }
        skuABuscar = null;
    }

    agregarSku(data: any) {
        var sku = new Sku();
        sku.sku = data.CODE_SKU;
        sku.skuDescription = data.DESCRIPTION_SKU;
        sku.codeFamilySku = data.CODE_FAMILY_SKU;
        sku.descriptionFamilySku = data.DESCRIPTION_FAMILY_SKU;
        this.listaSku.push(sku);
    }

    mostrarListaSkusEncontrados() {
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
            ShowListPicker(configoptions,
                item => {
                    this.mostrarInformacionDeSkuSeleccionado(item);
                }
            );
        } catch (e) {

        }
    }

    mostrarInformacionDeSkuSeleccionado(codeSku: string) {
        var skutemp = new Sku();
        
        skutemp.sku = codeSku;
        
        this.cliente.clientId = gClientID;
        
        if (this.skuDesdeLista === "NO") {
            this.obtenerDescripcionSku(codeSku);
        }
        this.paquetesServicio.obtenerDenominacionesPorSku(skutemp, this.confirugacionDecimales, this.cliente, true, (paquetes: Paquete[]) => {
            this.listaPaquetes = paquetes;
            this.cargarListaPaquetes();
        }, (operacion: Operacion) => {
            notify(operacion.mensaje);
            var uiListaSkuMedidas = $("#UiPackUnitList");
            uiListaSkuMedidas.children().remove("li");
        });
    }

    obtenerDescripcionSku(codeSku:string){
        for (var i = 0; i < this.listaSku.length; i++) {
            var skuTemp = this.listaSku[i];
            if (skuTemp.sku===codeSku) {
                var descripcionSku = $("#descriptionSkuTomaDeInventarioUnidadDeMedida");
                descripcionSku.text(skuTemp.skuDescription);
                this.sku = skuTemp;
                descripcionSku = null;
            }
        }
        
    };

    cargarListaPaquetes() {
        var uiListaSkuMedidas = $("#UiPackUnitList");
        uiListaSkuMedidas.children().remove("li");
        
        for (var i = 0; i < this.listaPaquetes.length; i++) {
            var li: string = "";
            var paquete = this.listaPaquetes[i];
            
                li += "<li class='ui-field-contain'>";
                li += `<span class='medium'>${paquete.descriptionPackUnit}</span> `;

                li += `<br/><span class='title' id='UiDescripcionPaquete${paquete.codePackUnit}'></span>`;

                li += `<input type='number' id='UiTextoCantidad${paquete.codePackUnit}' data-clear-btn='true' placeholder='Cantidad'>`;
                if (paquete.lastQtySold > 0) {
                    li += `<span class='small-roboto' >Ult. Inventario: ${paquete.lastQtySold}</span>`;
                }
                li += "</li>";

            uiListaSkuMedidas.append(li);
            uiListaSkuMedidas.listview("refresh");
            uiListaSkuMedidas.trigger("create");
        }
        uiListaSkuMedidas = null;
    }

     guardarDetalleTomaDeInventario() {
        if(this.listaPaquetes!==undefined)
            if (this.listaPaquetes.length > 0) {
                var listaDetalleInventarioTemp: TomaInventarioDetalle[] = [];
                
                for (var i = 0; i < this.listaPaquetes.length; i++) {
                    var detalleInventarioTemp = new TomaInventarioDetalle();
                    var txtCantidad = $("#UiTextoCantidad" + this.listaPaquetes[i].codePackUnit);

                if (txtCantidad.val() !== "" && !isNaN(txtCantidad.val()) && txtCantidad.val()>0 ) {
                    
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
    }

    mostrarTodasLasUnidadesDeMedida() {
        var descripcionSku = $("#descriptionSkuTomaDeInventarioUnidadDeMedida");
        descripcionSku.text("SKU PENDIENTE DE VALIDAR");
        var codigoSku = $("#UiInputSkuCode");
        this.sku.sku = codigoSku.val();
        this.paquetesServicio.obtenerTodasLasUnidadesDeMedida((paquetes: Paquete[]) => {
            this.listaPaquetes = paquetes;
            this.cargarListaPaquetes();
        }, (operacion: Operacion) => {
            notify(operacion.mensaje);
            var uiListaSkuMedidas = $("#UiPackUnitList");
            uiListaSkuMedidas.children().remove("li");
        });
    }
}