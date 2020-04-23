class TomaDeInventarioControlador {

    tokenDetalleInventario: SubscriptionToken;
    tokenTarea: SubscriptionToken;
    tokenCliente: SubscriptionToken;

    skuServicio = new SkuServicio();
    tomaInventarioServicio = new TomaDeInventarioServicio();
    tareaServicio = new TareaServcio();
    configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
    clienteServicio = new ClienteServicio();

    tomaDeInventario = new TomaInventario();
    detalleInventario: TomaInventarioDetalle[] = [];
    detalleAcomparar: TomaInventarioDetalle[] = [];
    tarea: Tarea;
    configuracionDecimales: ManejoDeDecimales;


    constructor(public mensajero: Messenger) {
        this.tokenDetalleInventario = mensajero.subscribe<DetalleInventarioMensaje>(this.detalleInventarioMensajeEntregado, getType(DetalleInventarioMensaje), this);
        this.tokenTarea = mensajero.subscribe<TareaMensaje>(this.tareaEntregado, getType(TareaMensaje), this);
        this.tokenCliente = mensajero.subscribe<ClienteMensaje>(this.clienteEntregado, getType(ClienteMensaje), this);
    }



    detalleInventarioMensajeEntregado(message: DetalleInventarioMensaje, subscriber: any) {
        subscriber.detalleAcomparar = message.detalleAComparar;
    };

    tareaEntregado(message: TareaMensaje, subscriber: any) {
        subscriber.tarea = message.tarea;
    };

    clienteEntregado(message: ClienteMensaje, subscriber: any) {
        subscriber.cliente = message.cliente;
    };

    delegarTomaDeInventarioControlador() {
        var este = this;

        document.addEventListener("backbutton", () => {
            this.usuarioDeseaCancelarTomaDeInventario();
        }, true);

        $("#UiPageTakeInventory").on("pageshow", () => {
            this.cargarDetalleInventario();
        });

        swipe("#UiPageTakeInventory", direccion => {
            if (direccion === "right") {
                este.usuarioDeseaVerLIstaSkus();
            } else if (direccion === "left") {
                this.publicarEstablecerOpcionMensaje("NO");
                this.usuarioDeseaInicarBusquedaSkus();
            }
        });

        //$("#UiPageTakeInventory").on("swiperight", () => {
        //    this.usuarioDeseaVerLIstaSkus();
        //});
        //$("#UiPageTakeInventory").on("swipeleft", () => {
        //    this.publicarEstablecerOpcionMensaje("NO");
        //    this.usuarioDeseaInicarBusquedaSkus();
        //});

        $("#uiBtnAceptarTomaDeInventario").bind("touchstart", () => {
            if (this.detalleInventario.length > 0) {
                this.usuarioDeseaGuardarTomaDeInventario();
            } else {
                notify("Debe de ingresar por lo menos un sku al detalle");
            }

        });
        $("#uiBtnCancelarTomadeInventario").bind("touchstart", () => {
            this.usuarioDeseaCancelarTomaDeInventario();
        });

        $("#UiPageTakeInventory").on("swipeleft", "#uiListaSkusInventareados li", (event) => {
            if ((<any>event).type === "swipeleft") {
                var id = (<any>event).currentTarget.attributes["id"].nodeValue;
                var paquete = (<any>event).currentTarget.attributes["packUnit"].nodeValue;
                this.usuarioDeseaEliminarSku(id.substring(3), paquete);
            }
        });

    }

    usuarioDeseaEliminarSku(idSku: string, packUnit: string) {
        try {
            navigator.notification.confirm(
                "Confirma remover de la lista al SKU " + idSku + "?", // message
                (buttonIndex) => {
                    if (buttonIndex === 2) {
                        this.eliminarSku(idSku, packUnit);
                    }
                }, // callback to invoke with index of button pressed
                "Sonda® " + SondaVersion, // title
                <any>"No,Si" // buttonLabels
            );
        } catch (err) {
            notify("Error al eliminar sku: " + err.mensaje);
        }
    }

    eliminarSku(idSku: string, packUnit: string) {
        try {
            for (let i = 0; i < this.detalleInventario.length; i++) {
                const sku = this.detalleInventario[i];
                if (sku.codeSku === idSku && sku.codePackUnit === packUnit) {
                    this.detalleInventario.splice(i, 1);
                }
            }
            this.cargarDetalleInventario();
        } catch (err) {
            notify("Error al eliminar sku: " + err.mensaje);
        }
    }

    usuarioDeseaVerLIstaSkus() {
        $.mobile.changePage("#UiSkusListPageForTakeInventory",
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
    }
    usuarioDeseaInicarBusquedaSkus() {
        $.mobile.changePage("#UiUnitPackPageTakeInventory",
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
    }
    usuarioDeseaRegresarAlMenuPrincipal() {
        $.mobile.changePage("#menu_page",
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
    }

    publicarListaDeSkusParaTomaDeInventario(listaSku: Sku[]) {
        var msg = new ListaSkuMensaje(this);
        msg.listaSku = listaSku;
        this.mensajero.publish(msg, getType(ListaSkuMensaje));
    }

    publicarSku(sku: Sku) {
        var msg = new SkuMensaje(this);
        msg.sku = sku;
        this.mensajero.publish(msg, getType(SkuMensaje));
    }

    publicarEstablecerOpcionMensaje(skuDesdeLista: string) {
        var msg = new EstablecerOpcionMensaje(this);
        msg.skuDesdeLista = skuDesdeLista;
        this.mensajero.publish(msg, getType(EstablecerOpcionMensaje));
    }


    generarListaDeSku() {
        var codeFamilySku = "";
        if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
            localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
        }

        codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");

        this.skuServicio.obtenerSkuParaTomaInventario(codeFamilySku, (listaSku: Sku[]) => {
            if (listaSku.length > 0) {
                this.publicarListaDeSkusParaTomaDeInventario(listaSku);
                this.usuarioDeseaVerLIstaSkus();
            } else {
                notify("No se encontraron Skus para la toma de inventario.");
            }
        }, (operacion: Operacion) => {
            notify(operacion.mensaje);
        });
    }

    usuarioDeseaGuardarTomaDeInventario() {
        this.prepararTomaDeInventarioParaInsertar((tomaDeInventario) => {
            this.tomaInventarioServicio.insertarTomaDeInventario(tomaDeInventario, () => {
                
                this.tarea.taskStatus = TareaEstado.Completada;
                this.tareaServicio.actualizarTareaEstado(this.tarea, () => {
                    this.obtenerConfiguracionDeDecimales((configuracionDecimales: ManejoDeDecimales) => {
                        var cliente = new Cliente();
                        cliente.clientId = gClientID;
                        this.clienteServicio.obtenerCliente(cliente, configuracionDecimales, (cliente: Cliente) => {
                            actualizarListadoDeTareas(this.tarea.taskId, this.tarea.taskType, this.tarea.taskStatus, cliente.clientId, cliente.clientName, cliente.address, 0, TareaEstado.Aceptada, cliente.rgaCode);

                            
                            this.detalleInventario.length = 0;
                            this.detalleAcomparar.length = 0;
                            this.usuarioDeseaRegresarAlMenuPrincipal();
                            EnviarData();
                            notify("Inventario guardado exitosamente.");
                        }, (resultado: Operacion) => {
                            my_dialog("", "", "closed");
                            notify(resultado.mensaje);
                        });
                    });
                }, (operacion) => {
                    notify(operacion.mensaje);
                });

            }, (operacion: Operacion) => {
                notify(operacion.mensaje);
            });
        });
    }

    obtenerSecuenciaDeDocumentos(controlador: any, callback: (sequence: string, serie: string, numeroDeDocumento: number, controlador: any) => void) {
        try {
            GetNexSequence("TAKE_INVENTORY", (sequence) => {
                ObtenerSecuenciaSiguiente(TipoDocumento.TomaDeInventario, (serie, numeroDeDocumento) => {
                    callback(sequence, serie, numeroDeDocumento, controlador);
                }, (err) => {
                    notify("Error al obtener sequencia de documento: " + err.message);
                });
            }, (err) => {
                notify("Error al obtener sequencia de documento: " + err.message);
            });
        } catch (err) {
            notify("Error al obtener secuencia de documento: " + err.message);
        }
    }

    obtenerConfiguracionDeDecimales(callback: (configuracionDecimales: ManejoDeDecimales) => void) {
        this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {
            callback(decimales);
        }, (operacion: Operacion) => {
            notify(operacion.mensaje);
        });
    }

    prepararTomaDeInventarioParaInsertar(callback: (tomaDeInventario: TomaInventario) => void) {
        try {

            this.obtenerSecuenciaDeDocumentos(this, (sequence: string, serie: string, numeroDeDocumento: number, controlador: any) => {
                this.obtenerConfiguracionDeDecimales((configuracionDecimales: ManejoDeDecimales) => {

                    var clienteId = new Cliente;
                    clienteId.clientId = gClientID;
                    this.clienteServicio.obtenerCliente(clienteId, configuracionDecimales, (cliente) => {

                        var tomaDeInventario = new TomaInventario();

                        tomaDeInventario.takeInventoryId = parseInt(sequence);
                        tomaDeInventario.takeInventoryIdBo = 0;
                        tomaDeInventario.tomaInventarioDetalle = this.detalleInventario;
                        for (var i = 0; i < tomaDeInventario.tomaInventarioDetalle.length; i++) {
                            tomaDeInventario.tomaInventarioDetalle[i].takeInventoryId = tomaDeInventario.takeInventoryId;
                        }
                        tomaDeInventario.clientId = cliente.clientId;
                        tomaDeInventario.codeRoute = localStorage.getItem("POS_CURRENT_ROUTE");
                        tomaDeInventario.deviceBatteryFactor = gBatteryLevel;
                        tomaDeInventario.docNum = numeroDeDocumento;
                        tomaDeInventario.docSerie = serie;
                        tomaDeInventario.gpsExpected = cliente.gps;
                        tomaDeInventario.gpsUrl = gCurrentGPS;
                        tomaDeInventario.isActiveRoute = 1;
                        tomaDeInventario.isPosted = 0;
                        tomaDeInventario.isVoid = false;
                        tomaDeInventario.postedDataTime = getDateTime();
                        tomaDeInventario.taskId = controlador.tarea.taskId;
                        tomaDeInventario.postedBy = localStorage.getItem("LAST_LOGIN_ID");

                        callback(tomaDeInventario);

                    }, (operacion) => {
                        notify(operacion.mensaje);
                    });


                });

            });
        } catch (err) {
            notify("Error al preparar ordenDeVenta: " + err.message);
        }
    }


    usuarioDeseaCancelarTomaDeInventario() {
        switch ($.mobile.activePage[0].id) {
            case "UiPageTakeInventory":
                navigator.notification.confirm("Confirma que desea cancelar toma de inventario? ", // message
                    (buttonIndex) => {
                        if (buttonIndex === 2) {
                            this.detalleInventario.length = 0;
                            this.usuarioDeseaRegresarAlMenuPrincipal();
                        }
                    }, "Sonda® " + SondaVersion, <any>"No,Si"
                );
                break;
        }
    }

    cargarDetalleInventario() {
        try {
            this.limpiarRepetidosLIstaDetalle((detalleDeInventario) => {
                this.detalleInventario = detalleDeInventario;
                var uiListaDetalleInventario = $("#uiListaSkusInventareados");
                var uiTotalSkusInventareados = $("#uiTotalSkusInventareados");
                uiTotalSkusInventareados.text(0);
                uiListaDetalleInventario.children().remove("li");
                for (var i = 0; i < this.detalleInventario.length; i++) {
                    var li = "";
                    var detalle = this.detalleInventario[i];
                    li += "<li packUnit='" + detalle.codePackUnit + "' data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'";
                    li += " id='TDI" + detalle.codeSku + "'>";
                    li += " <a href='#'";
                    li += " <p>";
                    li += ` <span style='font-size:12px;'>SKU:${detalle.codeSku}     UM:${detalle.codePackUnit}</span>`;
                    li += " </p>";
                    li += ` <p class='small-roboto'>Inventario: ${detalle.qty} `;
                    if (detalle.lastQty > 0) {
                        li += `<span>Ult. Inventario: ${detalle.lastQty}</span>`;
                    }
                    li += "</p>";
                    li += "</a>";
                    li += "</li>";
                    uiListaDetalleInventario.append(li);
                    uiListaDetalleInventario.listview("refresh");
                    var loQueLleva: number = parseFloat(uiTotalSkusInventareados.text());
                    var total: number = loQueLleva + parseFloat(detalle.qty.toString());
                    uiTotalSkusInventareados.text(total.toString());
                }
                uiListaDetalleInventario = null;
            });
        } catch (err) {
            notify(err.message);
        }
    }

    limpiarRepetidosLIstaDetalle(callback: (detalleInventarioArreglado: TomaInventarioDetalle[]) => void) {
        if (this.detalleInventario.length > 0) {
            var inventarioLength = this.detalleInventario.length;

            for (var i = 0; i < this.detalleAcomparar.length; i++) {
                var repetido = false;
                for (var j = 0; j < inventarioLength; j++) {
                    if (this.detalleInventario[j].codePackUnit === this.detalleAcomparar[i].codePackUnit && this.detalleInventario[j].codeSku === this.detalleAcomparar[i].codeSku) {
                        this.detalleInventario[j] = this.detalleAcomparar[i];
                        repetido = true;
                    }
                }
                if (!repetido)
                    this.detalleInventario.push(this.detalleAcomparar[i]);
            }
            //this.detalleInventario = detalleArreglado;
            this.detalleAcomparar.length = 0;
            callback(this.detalleInventario);
        } else {
            this.detalleInventario = this.detalleAcomparar;
            callback(this.detalleInventario);
        }
    }
}