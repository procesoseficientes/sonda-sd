class ListaSkuControlador {
    tokenCliente: SubscriptionToken;
    tokenTarea: SubscriptionToken;
    tokenCargarPorPrimeraVezListaSkuMensaje: SubscriptionToken;
    tokenAgregarOQuitarDeListaSkuMensaje: SubscriptionToken;

    skuServicio = new SkuServicio();
    decimalesServicio = new ManejoDeDecimalesServicio();
    descuentoServicio = new DescuentoServicio();
    tareaServicio = new TareaServcio();
    razonServicio = new RazonServicio();

    consultaDeInventarioPorZonaControlador = new ConsultaDeInventarioPorZonaControlador();

    listaSkuQueNoSeModifica: Sku[] = [];
    listaSkuOriginal: Sku[] = [];
    listaSku: Sku[] = [];

    configuracionDecimales: ManejoDeDecimales;
    cliente: Cliente;
    tarea: Tarea;
    descuentoPorMontoGeneral: DescuentoPorMontoGeneral;
    permiterRegregarPantallaAnterior: boolean = true;
    promoServicio: PromoServicio = new PromoServicio();

    pivotLimit = 25;  //cantidad de skus que se desean mostrar
    currentLimit = 0; // limite maximo que se extrae del arreglo de skus
    lastLowLimit = 0; // ultimo limite inferior en el que se posiciono
    esPrimeraVez = true;

    constructor(public mensajero: Messenger) {
        this.tokenAgregarOQuitarDeListaSkuMensaje = mensajero.subscribe<AgregarOQuitarDeListaSkuMensaje>(this.agregarOQuitarDeListaSkuMensajeEntregado, getType(AgregarOQuitarDeListaSkuMensaje), this);
    }

    delegadoListaSkuControlador() {
        const este = this;

        $(document).on("pagebeforechange",
            (event, data) => {
                if (data.toPage === "skus_list_page") {
                    este.cliente = data.options.data.cliente;
                    este.tarea = data.options.data.tarea;
                    este.configuracionDecimales = data.options.data.configuracionDecimales;
                    este.esPrimeraVez = data.options.data.esPrimeraVez;

                    if (este.esPrimeraVez) {
                        este.publicarEsPrimeraVez(este);
                    }

                    $.mobile.changePage("#skus_list_page");
                }
                if (data.toPage === "pos_skus_page") {
                    este.cliente = data.options.data.cliente;
                    este.tarea = data.options.data.tarea;
                    este.configuracionDecimales = data.options.data.configuracionDecimales;
                    //este.esPrimeraVez = data.options.data.esPrimeraVez;
                }
            });

        $("#skus_list_page").on("pageshow", () => {
            let criterioDeBusquedaSku = $("#uiTxtFilterListSkusPage");
            criterioDeBusquedaSku.val("");
            criterioDeBusquedaSku.trigger("click");
            criterioDeBusquedaSku.focus();
            criterioDeBusquedaSku = null;
            if (este.configuracionDecimales == undefined || este.configuracionDecimales == null || !este.configuracionDecimales) {
                this.decimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {
                    este.configuracionDecimales = decimales;
                    este.cargarPantalla(este);
                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                });
            } else {
                este.cargarPantalla(este);
            }
            
        });

        document.addEventListener("backbutton", () => {
            este.volverAPantallaAnterior();
            return false;
        }, true);

        $("#skus_list_page").on("click", "#skus_listview_panel li", (event) => {
            var id = (<any>event).currentTarget.attributes["id"].nodeValue;
            this.usuarioSeleccionoSku(id);
        });

        $("#UiBotonAgruparListaSku").bind("touchstart", () => {
            this.usuarioDeseaAgruparListaSku();
        });

        $("#uiBtnIrAPaginaAnteriorDeSkus").on("click",
            () => {
                if (this.lastLowLimit !== 0) {
                    this.cargarListaSku(this.listaSku.slice(this.lastLowLimit - this.pivotLimit, this.lastLowLimit), this.configuracionDecimales);
                    this.currentLimit = this.lastLowLimit;
                    this.lastLowLimit = this.lastLowLimit - this.pivotLimit;
                }
            });

        $("#uiBtnIrAPaginaSiguienteDeSkus").on("click",
            () => {
                if (this.currentLimit <= this.listaSku.length) {
                    this.cargarListaSku(this.listaSku.slice(this.currentLimit, this.currentLimit + this.pivotLimit), this.configuracionDecimales);
                    this.lastLowLimit = this.currentLimit;
                    this.currentLimit = this.currentLimit + this.pivotLimit;
                }
            });

        $("#uiBtnFilterListSkus").on("click",
            () => {
                var codigoSku = $("#uiTxtFilterListSkusPage");
                var skusFiltrados = este.listaSkuOriginal.filter(skuFiltered => {
                    const n = (skuFiltered.sku.toUpperCase() as any).includes(codigoSku.val().toUpperCase());
                    const m = (skuFiltered.skuDescription.toUpperCase() as any).includes(codigoSku.val().toUpperCase());

                    if (n || m) {
                        return true;
                    } else {
                        return false;
                    }
                });
                console.log(skusFiltrados.length);
                this.listaSku = skusFiltrados;
                this.cargarListaSku(skusFiltrados.slice(0, this.pivotLimit), this.configuracionDecimales);
                this.lastLowLimit = 0;
                this.currentLimit = this.pivotLimit;
            });

        $(document).on("click", "#form-search-skus .ui-input-clear", () => {
            this.listaSku = this.listaSkuOriginal;
            this.cargarListaSku(this.listaSku.slice(0, this.pivotLimit), this.configuracionDecimales);
            this.lastLowLimit = 0;
            this.currentLimit = this.pivotLimit;
        });

        $("#uiTxtFilterListSkusPage").on("keypress", e => {
            if (e.keyCode === 13 || e.keyCode === 9) {
                e.preventDefault();

                if ((<any>e.target).value === "") {
                    notify("Debe proporcionar un criterio de busqueda, por favor verifique y vuelva a intentar.");
                } else {
                    const skusFiltrados = this.listaSkuOriginal.filter(skuFiltered => {
                        const n = (skuFiltered.sku.toUpperCase() as any).includes((<any>e.target).value.toUpperCase());
                        const m = (skuFiltered.skuDescription.toUpperCase() as any).includes((<any>e.target).value.toUpperCase());

                        if (n || m) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    console.log(skusFiltrados.length);
                    this.listaSku = skusFiltrados;
                    this.cargarListaSku(skusFiltrados.slice(0, this.pivotLimit), this.configuracionDecimales);
                    this.lastLowLimit = 0;
                    this.currentLimit = this.pivotLimit;

                }
            } else {
                return true;
            }
        });

        $("#uiTxtFilterListSkusPage").on("keyup", e => {
            if (e.keyCode === 8 && (e.target as any).value === "") {
                e.preventDefault();

                this.listaSku = this.listaSkuOriginal;
                this.cargarListaSku(this.listaSku.slice(0, this.pivotLimit), this.configuracionDecimales);
                this.lastLowLimit = 0;
                this.currentLimit = this.pivotLimit;

            } else {
                return true;
            }
        });

        $("#UiBotonOrdenarLisadoDeSkus").on("click", () => {
            este.usuarioDeseaCambiarElOrdenDelListado();
        });
    }

    limpiarListaDeSku(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            let skulist = $("#skus_listview_panel");
            skulist.children().remove("li");
            skulist = null;
            //this.listaSku = null;
            //this.listaSkuOriginal = null;
            this.listaSkuQueNoSeModifica = null;

            callback();
        } catch (err) {
            errCallback(<Operacion>{ codigo: -1, mensaje: "Error al limpiar el listado de sku " + err.mensaje });

        }
    }

    usuarioDeseaAgruparListaSku() {
        this.skuServicio.obtenerFamiliaSku(familiaSku => {
            var listaDeFamiliaSku = [];
            listaDeFamiliaSku.push({
                text: "Todos",
                value: "ALL"
            });
            for (var i = 0; i < familiaSku.rows.length; i++) {
                listaDeFamiliaSku.push({
                    text: familiaSku.rows.item(i).DESCRIPTION_FAMILY_SKU,
                    value: familiaSku.rows.item(i).CODE_FAMILY_SKU
                });
            }

            var configoptions = {
                title: "Listado de productos",
                items: listaDeFamiliaSku,
                doneButtonLabel: "Ok",
                cancelButtonLabel: "Cancelar"
            };
            ShowListPicker(configoptions,
                item => {
                    var prevCodeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");
                    localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", item);
                    this.obtenerListaSku((operacion: Operacion) => {
                        if (operacion.resultado === ResultadoOperacionTipo.Error) {
                            notify(operacion.mensaje);
                            localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", prevCodeFamilySku);
                        }
                    });
                }
            );

        }, (resultado: Operacion) => {
            notify(resultado.mensaje);
        });
    }

    obtenerListaSku(callback: (operacion: Operacion) => void) {
        try {
            var sku = new Sku();
            if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
            }

            sku.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");

            this.decimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {

                if (this.tarea.taskType === TareaTipo.Venta) {
                    this.skuServicio.obtenerSkuParaVenta(this.cliente, sku, decimales, (listaSku: Sku[]) => {
                        this.cargarListaSku(listaSku, decimales);
                    }, callback);
                } else if (this.tarea.taskType === TareaTipo.Preventa) {
                    this.skuServicio.obtenerSkuParaPreVenta(this.cliente, sku, decimales, localStorage.getItem("SORT_BY"), localStorage.getItem("SORT_OPTION"), (listaSku: Sku[]) => {
                        this.cargarListaSku(listaSku, decimales);
                    }, callback);
                }
            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (err) {
            notify(err.mensaje);
        }
    }

    cargarListaSku(listaSku: Sku[], decimales: ManejoDeDecimales) {
        try {
            my_dialog('Sonda® ' + SondaVersion, "Cargando Sku...", "open");

            this.obtenerDescuentos(() => {
                var skulist = $("#skus_listview_panel");
                skulist.listview();
                skulist.children().remove("li");
                if (listaSku.length >= 1) {
                    let li = "";
                    for (let i = 0; i < listaSku.length; i++) {
                        const sku = listaSku[i];
                        li += this.obtnerLiParaListaSku(sku, decimales);
                    }
                    skulist.append(li);
                    skulist.listview("refresh");
                } else {
                    notify("No se encontraron Sku para preventa.");
                }
                skulist = null;
                my_dialog("", "", "close");
            });

        } catch (err) {
            notify(err.message);
        }
    }

    obtnerLiParaListaSku(sku: Sku, decimales: ManejoDeDecimales): string {
        let li: string;
        li = "<li data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'";
        li += ` id='lstSku${sku.sku.replace(" ", "_")}'>`;
        li += " <a href='#'";
        li += " <p>";
        li += " <span style='background-color: #005599; border-radius: 4px; color: #ffffff; padding: 3px; ";
        li += ` text-shadow: none; font-size:13px' > ${format_number(sku.onHand, decimales.defaultDisplayDecimals)}</span>&nbsp`;
        li += ` <span style='font-size:12px;'>${sku.sku}</span>`;
        li += ` </p><p> <span style='font-size:12px;'>${sku.skuName}</span>`;
        li += " </p>";
        li += " <p>";
        li += ` <span class='ui-li-count'> ${DarFormatoAlMonto(format_number(sku.cost, decimales.defaultDisplayDecimals))}</span>`;

        if (sku.codeFamilySku !== null && sku.codeFamilySku !== "") {
            li += `<span class='small-roboto'>Cod. Fam. SKU: ${sku.codeFamilySku}</span>`;
        }

        if (sku.discount !== 0) {
            li += `<span class='small-roboto'> Descuento: ${sku.discount}%</span>`;
        }

        if (this.tarea.taskType === TareaTipo.Preventa) {
            li += "</p>";
            li += "<p>";
            li += `<span class="small-roboto"> Reservados:${format_number(sku.isComited, decimales.defaultDisplayDecimals)}</span>`;
            li += `<span class="small-roboto"> Diferencia: ${format_number(sku.difference, decimales.defaultDisplayDecimals)}</span>`;
        }

        if (sku.lastQtySold > 0) {
            li += `<span class='small-roboto'> Ult. Pedido: ${format_number(sku.lastQtySold, decimales.defaultDisplayDecimals)}</span>`;
        }

        li += "</p>";
        li += "</a>";
        li += "</li>";

        return li;
    }

    publicarSku(sku: Sku) {
        const msg = new SkuMensaje(this);
        msg.sku = sku;
        this.mensajero.publish(msg, getType(SkuMensaje));
    }

    usuarioSeleccionoSku(idSku: string) {
        let _this = this;
        for (let i = 0; i < _this.listaSku.length; i++) {
            let sku = _this.listaSku[i];
            if (sku.sku === idSku.replace("_", " ").substr(6)) {
                sku.qty = 1;

                //this.limpiarListaDeSku(() => {
                    $.mobile.changePage("skucant_page", {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false,
                        data: {
                            "cliente": _this.cliente
                            , "tarea": _this.tarea
                            , "configuracionDecimales": _this.configuracionDecimales
                            , "sku": sku
                            , "estaAgregando": true
                            , "listaDeSkuParaBonificacion": new Array<Sku>()
                            , "listaSku": new Array<Sku>()
                        }
                    });
                //},
                //    (resultado: Operacion) => {
                //        notify(resultado.mensaje);
                //    });

                break;
            }
        }
    }

    cargarPorPrimeraVezListaSkuMensajeEntregado(subcriber: any, callBack: () => void, errorCallBack: (resultado: Operacion) => void): void {
        try {

            var sku = new Sku();
            if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
            }

            sku.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");

            if (subcriber.tarea.taskType === TareaTipo.Venta) {
                subcriber.skuServicio.obtenerSkuParaVenta(subcriber.cliente, sku, subcriber.configuracionDecimales, (listaSku: Sku[]) => {
                    subcriber.listaSku = listaSku;
                    subcriber.listaSkuOriginal = listaSku;
                    subcriber.listaSkuQueNoSeModifica = <Sku[]>JSON.parse(JSON.stringify(listaSku));
                    subcriber.cargarListaSku(listaSku.slice(0, subcriber.pivotLimit), subcriber.configuracionDecimales);
                    subcriber.lastLowLimit = 0;
                    subcriber.currentLimit = subcriber.pivotLimit;
                    callBack();
                }, (resultado: Operacion) => {
                    errorCallBack(resultado);
                });
            } else if (subcriber.tarea.taskType === TareaTipo.Preventa) {
                subcriber.skuServicio.obtenerSkuParaPreVenta(subcriber.cliente, sku, subcriber.configuracionDecimales, localStorage.getItem("SORT_BY"), localStorage.getItem("SORT_OPTION"), (listaSku: Sku[]) => {
                    subcriber.listaSku = listaSku;
                    subcriber.listaSkuOriginal = listaSku;
                    subcriber.listaSkuQueNoSeModifica = <Sku[]>JSON.parse(JSON.stringify(listaSku));
                    subcriber.cargarListaSku(listaSku.slice(0, subcriber.pivotLimit), subcriber.configuracionDecimales);
                    subcriber.lastLowLimit = 0;
                    subcriber.currentLimit = subcriber.pivotLimit;
                    callBack();
                }, (resultado: Operacion) => {
                    errorCallBack(resultado);
                });
            }
        } catch (ex) {
            errorCallBack(<Operacion>{ "codigo": -1, "resultado": ResultadoOperacionTipo.Error, "mensaje": ex.message });
        }
    }

    agregarOQuitarDeListaSkuMensajeEntregado(mensaje: AgregarOQuitarDeListaSkuMensaje, subcriber: any): void {
        if (!mensaje.agregarSku && !mensaje.quitarSku) { return; }

        let sku = new Sku();
        let entroSku = false;
        if (mensaje.agregarSku) {
            for (var i = 0; i < subcriber.listaSkuQueNoSeModifica.length; i++) {
                let skuTemp = subcriber.listaSkuQueNoSeModifica[i];
                if (skuTemp.sku === mensaje.listaSku[0].sku) {
                    sku = skuTemp;
                    entroSku = true;
                    break;
                }
            }
        } else {
            for (var i = 0; i < subcriber.listaSkuOriginal.length; i++) {
                let skuTemp = subcriber.listaSkuOriginal[i];
                if (skuTemp.sku === mensaje.listaSku[0].sku) {
                    sku = skuTemp;
                    entroSku = true;
                    break;
                }
            }
        }

        if (!entroSku) {return;}

        if (mensaje.agregarSku) {
            let skulist = $("#skus_listview_panel");
            let li = subcriber.obtnerLiParaListaSku(sku, subcriber.configuracionDecimales);
            subcriber.listaSkuOriginal.push(sku);

            skulist.append(li);
            skulist.listview("refresh");
        } else if (mensaje.quitarSku) {
            let uiTarea = $("#lstSku" + sku.sku.replace(" ", "_"));
            uiTarea.closest("li").remove();
            uiTarea = null;

            let indice = subcriber.listaSkuOriginal.indexOf(sku);
            subcriber.listaSkuOriginal.splice(indice, 1);
        }

        subcriber.cargarPorPrimeraVezListaSkuMensajeEntregado(subcriber, () => {

        },
            (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
    }

    obtenerDescuentos(callback: () => void) {
        this.descuentoServicio.obtenerDescuentosPorCliente(this.cliente, (listaDeDescuento: Array<Descuento>) => {
            for (let i = 0; i < this.listaSku.length; i++) {
                let sku = this.listaSku[i];
                for (let j = 0; j < listaDeDescuento.length; j++) {
                    let descuento = listaDeDescuento[j];
                    if (sku.sku === descuento.codeSku) {
                        sku.discount = descuento.discount;
                        break;
                    }
                }
            }
            callback();
        }, (resultado: Operacion) => {
            callback();
            notify("Error al obtener los descuentos: " + resultado.mensaje);
        });
    }

    obtenerDescuentoPorMontoGeneral(total: number, callback: () => void) {
        try {
            this.descuentoServicio.obtenerDescuentoPorMontoGeneral(this.cliente, total, (descuentoPorMontoGeneral) => {
                this.obtenerHistoricodePromo((listaHistoricoDePromos: Promo[]) => {
                    let resultadoDePromoHistorico = listaHistoricoDePromos.find((promo: Promo) => {
                        return promo.promoId === descuentoPorMontoGeneral.promoId;
                    });
                    if (resultadoDePromoHistorico) {
                        let promoDeBonificacion: Promo = new Promo();
                        promoDeBonificacion.promoId = descuentoPorMontoGeneral.promoId;
                        promoDeBonificacion.promoName = descuentoPorMontoGeneral.promoName;
                        promoDeBonificacion.frequency = descuentoPorMontoGeneral.frequency;
                        this.promoServicio.validarSiAplicaPromo(promoDeBonificacion,
                            resultadoDePromoHistorico,
                            (aplicaPromo) => {
                                if (aplicaPromo) {
                                    this.descuentoPorMontoGeneral = descuentoPorMontoGeneral;
                                } else {
                                    this.descuentoPorMontoGeneral = new DescuentoPorMontoGeneral();
                                }
                                callback();
                            },
                            (resultado: Operacion) => {
                                notify(resultado.mensaje);
                            });
                    } else {
                        this.descuentoPorMontoGeneral = descuentoPorMontoGeneral;
                        callback();
                    }
                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                });
                //this.descuentoPorMontoGeneral = descuentoPorMontoGeneral;
                //callback();
            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (ex) {
            notify(`Error al obtener el descuento por monto general: ${ex.message}`);
        } 
    }

    volverAPantallaAnterior() {
        switch ($.mobile.activePage[0].id) {
            case "skus_list_page":
                this.limpiarListaDeSku(() => {
                    $.mobile.changePage("pos_skus_page", {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false,
                        data: {
                            "cliente": this.cliente
                            , "tarea": this.tarea
                            , "configuracionDecimales": this.configuracionDecimales
                            , "esPrimeraVez": this.esPrimeraVez
                        }
                    });
                    },
                    (resultado: Operacion) => {
                        notify(resultado.mensaje);
                    });
                break;
        }
    }

    validarReglaDeTomarFotoAlInicio(callback: (fotografia: string, validarFotografia: boolean) => void) {
        try {
            if (this.cliente.fotoDeInicioDeVisita === undefined || this.cliente.fotoDeInicioDeVisita === "") {
                this.tareaServicio.obtenerRegla("TomarFotoAlInicio", (listaDeReglas: Regla[]) => {
                    if (listaDeReglas.length > 0 && listaDeReglas[0].enabled.toUpperCase() === 'SI') {
                        TomarFoto((fotografia) => {
                            callback(fotografia, true);
                        }, (resultado: Operacion) => {
                            callback("", true);
                        });
                    } else {
                        callback("", false);
                    }
                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                    my_dialog("", "", "closed");
                });
            } else {
                callback("", false);
            }
        } catch (ex) {
            notify("Error al validar la regla tomar foto al inicio: " + ex.message);
        }
    }

    establecerFotoInicio(fotografia: string) {
        this.cliente.fotoDeInicioDeVisita = fotografia;
    }

    finalizarTareaSinGestion(errorCallback: () => void) {
        try {
            navigator.notification.confirm("Desea finalizar la tarea sin gestion?", (buttonIndex) => {
                if (buttonIndex === 2) {
                    my_dialog("", "", "close");
                    var tipoDeRazon: string = "";

                    switch (this.tarea.taskType) {
                        case TipoTarea.Preventa.toString():
                            tipoDeRazon = TipoDeRazon.OrdenDeVenta.toString();
                            break;
                    }

                    this.razonServicio.obtenerRazones(tipoDeRazon, (razones: Razon[]) => {
                        var listadoDeRazones = [];
                        for (var i = 0; i < razones.length; i++) {
                            listadoDeRazones.push({
                                text: razones[i].reasonValue,
                                value: razones[i].reasonValue
                            });
                        }

                        var config = {
                            title: "Razones",
                            items: listadoDeRazones,
                            doneButtonLabel: "Ok",
                            cancelButtonLabel: "Cancelar"
                        };

                        ListPicker(config,
                            item => {
                                ObtenerPosicionGPS(() => {
                                    this.tarea.completedSuccessfully = false;
                                    this.tarea.reason = item;
                                    this.tarea.taskStatus = TareaEstado.Completada;
                                    this.tareaServicio.actualizarTareaEstado(this.tarea, () => {
                                        actualizarListadoDeTareas(this.tarea.taskId, this.tarea.taskType, TareaEstado.Completada, this.cliente.clientId, this.cliente.clientName, this.cliente.address, 0, TareaEstado.Aceptada, this.cliente.rgaCode);

                                        $.mobile.changePage("#pickupplan_page", {
                                            transition: "flow",
                                            reverse: true,
                                            changeHash: false,
                                            showLoadMsg: false
                                        });

                                        EnviarData();

                                    }, (resultado: Operacion) => {
                                        notify("Error al actualizar la tarea: " + resultado.mensaje);
                                    });
                                });
                            }, () => {
                                errorCallback();
                            });

                    }, (resultado: Operacion) => {
                        notify("Error al obtener las razones: " + resultado.mensaje);
                    });

                } else {
                    errorCallback();
                }
            }, "Sonda® " + SondaVersion,
                <any>'No,Si');
        } catch (err) {
            notify("Error al obtener razones: " + err.message);
        }
    }

    validarFotoYTareaSinGestion() {
        this.validarReglaDeTomarFotoAlInicio((fotografia: string, validarFotografia: boolean) => {
            if (validarFotografia) {
                this.permiterRegregarPantallaAnterior = false;
                if (fotografia === "") {
                    this.finalizarTareaSinGestion(
                        () => {
                            this.validarFotoYTareaSinGestion();
                        });
                    return;
                } else {
                    this.establecerFotoInicio(fotografia);
                }
            } else {
                this.permiterRegregarPantallaAnterior = true;
            }
        });
    }

    usuarioDeseaCambiarElOrdenDelListado() {
        let listaDeOpcionesDeOrdenamiento = [];
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.CodigoDeProducto.toString(),
            value: OpcionDeOrdenDelListadoDeSku.CodigoDeProducto.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.NombreDeProducto.toString(),
            value: OpcionDeOrdenDelListadoDeSku.NombreDeProducto.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.UltimaCompra.toString(),
            value: OpcionDeOrdenDelListadoDeSku.UltimaCompra.toString()
        });
        listaDeOpcionesDeOrdenamiento.push({
            text: DescripcionOpcionDeOrdenDelListadoDeSku.Precio.toString(),
            value: OpcionDeOrdenDelListadoDeSku.Precio.toString()
        });

        let configuracionDeOpcionesDeOrdenamiento = {
            title: "Ordenar por",
            items: listaDeOpcionesDeOrdenamiento,
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };

        ShowListPicker(configuracionDeOpcionesDeOrdenamiento,
            item => {
                this.preguntarTipoDeOrden(item.toString());
            }
        );
    }

    preguntarTipoDeOrden(opcionDeOrdenamiento: string) {
        let listaDeTipoDeOrdenamiento = [];
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Ascendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Ascendente.toString()
        });
        listaDeTipoDeOrdenamiento.push({
            text: DescripcionDeTipoDeOrdenDelListadoDeSku.Descendente.toString(),
            value: TipoDeOrdenDelListadoDeSku.Descendente.toString()
        });

        let configuracionDeOpcionesDeOrdenamiento = {
            title: "Tipo de Orden",
            items: listaDeTipoDeOrdenamiento,
            doneButtonLabel: "Ok",
            cancelButtonLabel: "Cancelar"
        };

        ShowListPicker(configuracionDeOpcionesDeOrdenamiento,
            item => {
                this.recargarListaDeSkuPorOrden(opcionDeOrdenamiento, item.toString());
            }
        );
    }

    recargarListaDeSkuPorOrden(opcionDeOrdenamiento: string, tipoDeOrdenamiento: string) {
        try {
            let sku = new Sku();
            if (localStorage.getItem("LISTA_TIPO_FAMILIA_SKU") === null) {
                localStorage.setItem("LISTA_TIPO_FAMILIA_SKU", "ALL");
            }
            sku.codeFamilySku = localStorage.getItem("LISTA_TIPO_FAMILIA_SKU");

            this.skuServicio.obtenerSkuParaPreVenta(this.cliente, sku, this.configuracionDecimales, opcionDeOrdenamiento, tipoDeOrdenamiento, (listaSku: Sku[]) => {
                this.listaSku = listaSku;
                this.listaSkuOriginal = listaSku;
                this.listaSkuQueNoSeModifica = <Sku[]>JSON.parse(JSON.stringify(listaSku));
                this.cargarListaSku(listaSku.slice(0, this.pivotLimit), this.configuracionDecimales);
                this.lastLowLimit = 0;
                this.currentLimit = this.pivotLimit;

                localStorage.setItem('SORT_BY', opcionDeOrdenamiento);
                localStorage.setItem('SORT_OPTION', tipoDeOrdenamiento);

            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (e) {
            notify("Error al regarcar el listado de productos: " + e.mensaje);
        }
    }

    cargarPantalla(_this: any) {
        if (!_this.cliente.fotoDeInicioDeVisita || _this.cliente.fotoDeInicioDeVisita === undefined || _this.cliente.fotoDeInicioDeVisita === "" || _this.cliente.fotoDeInicioDeVisita === null) {
            _this.validarFotoYTareaSinGestion();
        }

        let lblTotal = $("#UiTotalListadoSkus");
        if (_this.tarea.salesOrderTotal > 0) {
            if (_this.tarea.salesOrderTotal >= _this.tarea.discountPerGeneralAmountLowLimit &&
                _this.tarea.discountPerGeneralAmountHighLimit >= _this.tarea.salesOrderTotal) {
                lblTotal
                    .text(DarFormatoAlMonto(format_number((_this.tarea.salesOrderTotal -
                            (_this.tarea.salesOrderTotal * (_this.cliente.appliedDiscount / 100))),
                        _this.configuracionDecimales.defaultDisplayDecimals)));
            } else {
                _this.obtenerDescuentoPorMontoGeneral(_this.tarea.salesOrderTotal,
                    () => {
                        if (_this.descuentoPorMontoGeneral.apply) {
                            if (_this.seAplicaElDescuentoModificado(_this.cliente.discount,
                                _this.cliente.appliedDiscount,
                                _this.descuentoPorMontoGeneral.discount)) {
                                lblTotal
                                    .text(DarFormatoAlMonto(format_number((_this.tarea.salesOrderTotal -
                                            (_this.tarea.salesOrderTotal * (_this.cliente.appliedDiscount / 100))),
                                        _this.configuracionDecimales.defaultDisplayDecimals)));
                            } else {
                                lblTotal
                                    .text(DarFormatoAlMonto(format_number((_this.tarea.salesOrderTotal -
                                        (_this.tarea
                                            .salesOrderTotal *
                                            (_this.descuentoPorMontoGeneral.discount / 100))),
                                        _this.configuracionDecimales.defaultDisplayDecimals)));
                            }
                            lblTotal = null;

                        } else {
                            lblTotal
                                .text(DarFormatoAlMonto(format_number(_this.tarea.salesOrderTotal,_this.configuracionDecimales.defaultDisplayDecimals)));
                        }
                    });
            }
        } else {
            lblTotal.text(DarFormatoAlMonto(format_number(0, _this.configuracionDecimales.defaultDisplayDecimals)));
            lblTotal = null;
        }


        this.cargarPorPrimeraVezListaSkuMensajeEntregado(this,
            () => {
                my_dialog("", "", "close");
            },
            (resultado) => {
                notify(resultado.mensaje);
            });
    }

    publicarEsPrimeraVez(_this: ListaSkuControlador) {
        try {
            var msg = new ListaSkuMensaje(this);
            msg.listaSku = [];
            _this.mensajero.publish(msg, getType(ListaSkuMensaje));
            _this.esPrimeraVez = false;
        } catch (e) {
            _this.esPrimeraVez = true;
            notify("Error al limpiar listado: " + e.message);
        } 
        
    }

    obtenerHistoricodePromo(callBack: (listaHistoricoDePromos: Promo[]) => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.promoServicio.obtenerHistoricoDePromosParaCliente(this.cliente, (listaHistoricoDePromos: Promo[]) => {
                callBack(listaHistoricoDePromos);
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al obtener historico de promociones: ${ex.message}`
            } as Operacion);
        }
    }

    seAplicaElDescuentoModificado(descuentoOriginalDeModificacion: number, descuentoModificado: number, descuentoNuevo: number): boolean {
        return (descuentoOriginalDeModificacion !== 0 && descuentoModificado <= descuentoNuevo);
    }
}