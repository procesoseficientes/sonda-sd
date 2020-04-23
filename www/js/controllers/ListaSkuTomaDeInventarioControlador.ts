class ListaSkuTomaDeInventarioControlador {

    tokenCliente: SubscriptionToken;
    
    skuServicio = new SkuServicio(); 
    decimalesServicio = new ManejoDeDecimalesServicio();
    tarea: Tarea;
    listaSku: Sku[];
    cliente: Cliente;
    

    constructor(public mensajero: Messenger) {
        this.tokenCliente = mensajero.subscribe<ClienteMensaje>(this.clienteEntregado, getType(ClienteMensaje), this);

    }


    delegadoListaSkuTomaDeInventarioControlador() {

        document.addEventListener("backbutton", () => {
            this.usuarioDeseaRegresarATomaDeInventario();
        }, true);



        $("#UiSkusListPageForTakeInventory").on("pageshow", () => {
            
            var uiSkuListViewForTakeInventory = $("#UiSkuListViewForTakeInventory");

            this.obtenerListaSku((operacion: Operacion) => {
                if (operacion.resultado === ResultadoOperacionTipo.Error) {
                    notify(operacion.mensaje);
                }
                uiSkuListViewForTakeInventory.focus();
            });
        });
        $("#UiSkusListPageForTakeInventory").on("click", "#UiSkuListViewForTakeInventory li", (event) => {
            var id = (<any>event).currentTarget.attributes["id"].nodeValue;
            this.usuarioSeleccionoSku(id);
        });

        $("#UiBotonFiltrarListaSkuInventario").bind("touchstart", () => {
            this.usuarioDeseaAgruparListaSku();
        });

    }

    clienteEntregado(mensaje: ClienteMensaje, subcriber: any): void {
        subcriber.cliente = mensaje.cliente;
    }

    usuarioDeseaRegresarATomaDeInventario() {
        switch ($.mobile.activePage[0].id) {
            case "UiSkusListPageForTakeInventory":
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


                this.skuServicio.obtenerSkuParaTomaInventario(sku.codeFamilySku.toString(), (listaSku: Sku[]) => {
                    this.cargarListaSku(listaSku);
                }, callback);

            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (err) {
            notify(err.mensaje);
        }
    }

    cargarListaSku(listaSku: Sku[]) {
        try {
            this.listaSku = listaSku;

            var skulist = $("#UiSkuListViewForTakeInventory");
            skulist.children().remove("li");

            for (var i = 0; i < listaSku.length; i++) {
                var li = "";
                var sku = listaSku[i];
                li += "<li data-icon='false' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'";
                li += ` id='idlstSku${sku.sku.replace(" ", "_")}'>`;
                li += " <a href='#'";
                li += " <p>";
                li += ` <span style='font-size:12px;'>${sku.sku} ${sku.skuName}</span>`;
                li += " </p>";
                li += " <p>";
                if (sku.codeFamilySku !== null && sku.codeFamilySku !== "") {
                    li += `<span class='small-roboto'>Cod. Fam. SKU: ${sku.codeFamilySku}</span>`;
                }
                li += "</p>";
                li += "</a>";
                li += "</li>";
                skulist.append(li);
                skulist.listview("refresh");
            }
            skulist = null;
        } catch (err) {
            notify(err.message);
        }
    }

    publicarSku(sku: Sku) {
        var msg = new SkuMensaje(this);
        msg.sku = sku;
        this.mensajero.publish(msg, getType(SkuMensaje));
    }

    publicarEstablecerOpcionMensaje(skuDesdeLista:string) {
        var msg = new EstablecerOpcionMensaje(this);
        msg.skuDesdeLista = skuDesdeLista;
        this.mensajero.publish(msg, getType(EstablecerOpcionMensaje));
    }

    usuarioSeleccionoSku(idSku: string) {
        for (var i = 0; i < this.listaSku.length; i++) {
            var sku = this.listaSku[i];
            if (sku.sku === idSku.replace("_", " ").substr(8)) {
                sku.qty = 1;
                this.publicarSku(sku);
                this.publicarEstablecerOpcionMensaje("SI");
                $.mobile.changePage("#UiUnitPackPageTakeInventory", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
                break;
            }
        }
    }
    
}