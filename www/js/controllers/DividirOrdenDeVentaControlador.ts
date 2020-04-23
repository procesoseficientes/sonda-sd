class DividirOrdenDeVentaControlador {

    tokenCliente: SubscriptionToken;
    tokenListaSku: SubscriptionToken;
    tokenTarea: SubscriptionToken;
    tokenListaReglas: SubscriptionToken;

    configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
    paqueteServicio = new PaqueteServicio();

    cliente: Cliente;
    listaSku: Sku[] = [];
    listaReglas: Regla[] = [];
    tarea: Tarea;
    indiceDeReglaActual: number = 0;
    configuracionDecimales: ManejoDeDecimales;
    precioMinimoDeOrdenDeVenta: number = 0;
    listaSkuOrdenDeVentaPrincipal: Sku[] = [];
    listaSkuOrdenDeVentaRestante: Sku[] = [];
    listaDeOrdnesDeVEntaCf: (Sku[])[] = [];
    precioMinimoParaOrdenPricipal: number = 0;
    

    constructor(public mensajero: Messenger) {
        /*this.obtenerConfiguracionDeDecimales();
        this.tokenCliente = mensajero.subscribe<ClienteMensaje>(this.clienteEntregado, getType(ClienteMensaje), this);
        this.tokenListaSku = mensajero.subscribe<ListaSkuMensaje>(this.listaSkuEntregado, getType(ListaSkuMensaje), this);
        this.tokenTarea = mensajero.subscribe<TareaMensaje>(this.tareaEntregada, getType(TareaMensaje), this);
        this.tokenListaReglas = mensajero.subscribe<ReglaMensaje>(this.listaReglasEntregado, getType(ReglaMensaje), this);*/
    }

    delegadoDividirOrdenDeVentaControlador() {
        $("#UiPagePreventa").on("pageshow", () => {
            my_dialog("Preparando Sku", "Espere...", "open");
            this.cargarDatos();
            this.cargarUnidadDeMedidaMinima(0);
        });

        $("#UiBotonCalcularPrenVenta").bind("touchstart", () => {
            this.usuarioDeseDividirOrdenDeVenta();
        });

        //$("#UiTotalPreVenta").focusout(() => {
        //    this.usuarioDeseDividirOrdenDeVenta();
        //});

        $("#UiPagePreventa").on("click", "#UiListaPreVentaPrincipal li", (event) => {
            if (this.validarSiEsUltimoSku()) {
                var id = (<any>event).currentTarget.attributes["id"].nodeValue;
                if (id.split("-")[1] === "Restar") {
                    this.quitarSkuDeOrdenDeVentaPrincipal(id.split("-")[2], id.split("-")[3]);
                    this.establerTotalesDeOrdenDeVenta();
                }
            }
        });

        $("#UiPagePreventa").on("click", "#UiListaPreVentaRestante li", (event) => {
            var id = (<any>event).currentTarget.attributes["id"].nodeValue;
            if (id.split("-")[1] === "Restar") {
                this.quitarSkuDeOrdenDeVentaRestante(id.split("-")[2], id.split("-")[3]);
                this.establerTotalesDeOrdenDeVenta();
            }
        });

        $("#UiBotonAceptarPrenVenta").bind("touchstart", () => {
            this.usuarioDeseaAceptarOrdenDeVenta();
        });
    }

    clienteEntregado(mensaje: ClienteMensaje, subcriber: any): void {
        subcriber.cliente = mensaje.cliente;
    }

    listaSkuEntregado(mensaje: ListaSkuMensaje, subcriber: any): void {
        subcriber.listaSku = mensaje.listaSku;
    }

    tareaEntregada(mensaje: TareaMensaje, subcriber: any): void {
        subcriber.tarea = mensaje.tarea;
    }

    listaReglasEntregado(mensaje: ReglaMensaje, subscriber: any): void {
        subscriber.listaReglas = mensaje.listaDeReglas;
        subscriber.indiceDeReglaActual = mensaje.indiceDeReglaActual;
    }

    obtenerConfiguracionDeDecimales() {
        this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales((decimales: ManejoDeDecimales) => {
            this.configuracionDecimales = decimales;
        }, (operacion: Operacion) => {
            notify(operacion.mensaje);
        });
    }

    cargarDatos() {
                var uiValorDeOrdenPrincipal = $('#UiValorDeOrdenPrincipal');
                uiValorDeOrdenPrincipal.text("Valor de Orden Principal (Total : " + format_number(this.cliente.totalAmout, this.configuracionDecimales.defaultDisplayDecimals) + ")");
                uiValorDeOrdenPrincipal = null;
                var uiTotalPreVenta = $("#UiTotalPreVenta");
                uiTotalPreVenta.val("");
                uiTotalPreVenta.attr("placeholder", "Total");
                uiTotalPreVenta.focus();
                uiTotalPreVenta = null;
                this.listaSkuOrdenDeVentaPrincipal = [];
                this.listaSkuOrdenDeVentaRestante = [];
                var uiListaPreVentaPrincipal = $('#UiListaPreVentaPrincipal');
                uiListaPreVentaPrincipal.children().remove('li');
                uiListaPreVentaPrincipal = null;
                var uiListaPreVentaRestante = $('#UiListaPreVentaRestante');
                uiListaPreVentaRestante.children().remove('li');
                uiListaPreVentaRestante = null;
                this.establerTotalesDeOrdenDeVenta();
                this.precioMinimoParaOrdenPricipal = 0;
        }

    cargarUnidadDeMedidaMinima(indiceDeListaSku: number): void {
        try {
            this.paqueteServicio.obtenerDenominacionPorSku(this.listaSku[indiceDeListaSku], indiceDeListaSku, (listaPaquete: Paquete[], indiceDeListaSku: number) => {
                listaPaquete.reverse();
                for (var i = 0; i < listaPaquete.length; i++) {
                    if (this.listaSku[indiceDeListaSku].codePackUnit === listaPaquete[i].codePackUnit) {
                        listaPaquete.splice(i + 1, listaPaquete.length);
                        listaPaquete[i].qty = this.listaSku[indiceDeListaSku].qty;
                        break;
                    } else {
                        listaPaquete[i].qty = 0;
                    }
                }
                listaPaquete.reverse();
                if (listaPaquete.length === 1) {
                    var sku = <Sku>JSON.parse(JSON.stringify(this.listaSku[indiceDeListaSku]));
                    sku.skuUnidadMinima = new Sku();
                    this.listaSku[indiceDeListaSku].skuUnidadMinima = sku;

                    if ((indiceDeListaSku + 1) === this.listaSku.length) {
                        my_dialog("", "", "close");
                        this.listaSku.sort((obj1: Sku, obj2: Sku) => {
                            return obj1.skuUnidadMinima.cost - obj2.skuUnidadMinima.cost;
                        });

                    } else {
                        this.cargarUnidadDeMedidaMinima(indiceDeListaSku + 1);
                    }
                } else {
                    this.obtenerMenorDenominacion(listaPaquete, 1, indiceDeListaSku, (sku: Sku, indiceDeListaSku: number) => {
                        this.listaSku[indiceDeListaSku].skuUnidadMinima = sku;
                        if ((indiceDeListaSku + 1) === this.listaSku.length) {
                            my_dialog("", "", "close");
                            this.listaSku.sort((obj1, obj2) => {
                                return obj1.skuUnidadMinima.cost - obj2.skuUnidadMinima.cost;
                            });
                        } else {
                            this.cargarUnidadDeMedidaMinima(indiceDeListaSku + 1);
                        }
                    });
                }


            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });

        } catch (ex) {
            notify("Error al obtener unidad de medida minima: " + ex.message);
        }
    }

    obtenerMenorDenominacion(listaPaquete: Paquete[], indiceListaPaquetes: number, indiceDeListaSku: number, callback?: (sku: Sku, indiceDeListaSku: number) => void) {
        try {
            this.paqueteServicio.obtenerConversionDePaquete(this.listaSku[indiceDeListaSku], listaPaquete, indiceListaPaquetes, this.configuracionDecimales, (conversionDePaquete: PaqueteConversion, paquetesN1: Paquete[], indiceListaPaquetes: number) => {

                if (conversionDePaquete.conversionFactor >= 1) {
                    paquetesN1[indiceListaPaquetes].qty = paquetesN1[indiceListaPaquetes].qty + (paquetesN1[indiceListaPaquetes - 1].qty * conversionDePaquete.conversionFactor);
                } else {
                    paquetesN1[indiceListaPaquetes].qty = paquetesN1[indiceListaPaquetes].qty + (paquetesN1[indiceListaPaquetes - 1].qty * (1 / conversionDePaquete.conversionFactor));
                }
                if (indiceListaPaquetes === (paquetesN1.length - 1)) {
                    var sku = new Sku();
                    sku.sku = this.listaSku[indiceDeListaSku].sku;
                    sku.skuName = this.listaSku[indiceDeListaSku].skuName;
                    sku.qty = paquetesN1[indiceListaPaquetes].qty;
                    sku.codePackUnit = paquetesN1[indiceListaPaquetes].codePackUnit;
                    sku.cost = (this.listaSku[indiceDeListaSku].total / paquetesN1[indiceListaPaquetes].qty);
                    sku.total = this.listaSku[indiceDeListaSku].total;
                    callback(sku, indiceDeListaSku);
                } else {
                    this.obtenerMenorDenominacion(paquetesN1, indiceListaPaquetes + 1, indiceDeListaSku);
                }

            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (err) {
            notify("Error al obtener menor denominacion: " + err.message);
        }
    }

    usuarioDeseDividirOrdenDeVenta() {
        try {
            var uiTotalPreVenta = $("#UiTotalPreVenta");

            if (uiTotalPreVenta !== undefined && uiTotalPreVenta !== null && uiTotalPreVenta.val() !== "") {
                var totalOrdenDeVentaPrincipal: number = parseFloat(uiTotalPreVenta.val());
                my_dialog("Dividiendo Orden de Venta", "Espere...", "open");
                this.dividirOrdenDeVenta(totalOrdenDeVentaPrincipal, <Sku[]>JSON.parse(JSON.stringify(this.listaSku)), () => {
                    this.generarListasOrdenDeVenta(() => {
                        this.establerTotalesDeOrdenDeVenta();
                        my_dialog("", "", "close");
                    });
                });
            } else {
                if (uiTotalPreVenta !== undefined && uiTotalPreVenta !== null) {
                    notify("Ingrese el total de la orden de venta");
                    uiTotalPreVenta.focus();
                }
            }
            uiTotalPreVenta = null;
        } catch (ex) {
            my_dialog("", "", "close");
            notify("Error al dividir la preventa: " + ex.message);
        }
    }

    dividirOrdenDeVenta(totalOrdenDeVentaPrincipal: number, listaSku: Sku[], callback: () => void) {
        try {
            this.listaSkuOrdenDeVentaPrincipal = [];
            this.listaSkuOrdenDeVentaRestante = [];

            var totalTomandoDeOrdenDeVentaPrincipal = 0;

            var sku = new Sku(), skuOrdenDeVentaPrincipal: Sku = new Sku(), skuTotales = new Sku();
            //// Todo: Obtener precios mayores a CF
            var i, j, l = 0;
            for (i = 0; i < listaSku.length; i++) {
                sku = listaSku[i];
                if (sku.skuUnidadMinima.cost > MaximoCF) {
                    totalTomandoDeOrdenDeVentaPrincipal += sku.skuUnidadMinima.total;
                    this.listaSkuOrdenDeVentaPrincipal.push(sku);
                    listaSku.splice(i, 1);
                    i--;
                }
            }

            //// Todo: Validar que el total tomado sea menor al total de la orden de venta priciapl
            if (totalTomandoDeOrdenDeVentaPrincipal < totalOrdenDeVentaPrincipal) {
                for (i = 0; i < listaSku.length; i++) {
                    sku = listaSku[i];
                    //// Todo: Recorrer la cantidad del sku
                    var cantidad = sku.skuUnidadMinima.qty;
                    for (var k = 0; k < cantidad; k++) {
                        //// Todo: Validar que el total no se haya pasado para agregarlo
                        if ((sku.skuUnidadMinima.cost + totalTomandoDeOrdenDeVentaPrincipal) <= (totalOrdenDeVentaPrincipal +0.1)) {
                            //// Todo: Buscar si existe el sku en la orden de venta principal
                            var existeSku: boolean = false;
                            for (j = 0; j < this.listaSkuOrdenDeVentaPrincipal.length; j++) {
                                skuOrdenDeVentaPrincipal = this.listaSkuOrdenDeVentaPrincipal[j];
                                if (skuOrdenDeVentaPrincipal.sku === sku.sku && skuOrdenDeVentaPrincipal.codePackUnit === sku.codePackUnit) {
                                    //// Todo: Se suma uno para la orden de venta principal
                                    existeSku = true;
                                    skuOrdenDeVentaPrincipal.skuUnidadMinima.qty += 1;
                                    skuOrdenDeVentaPrincipal.skuUnidadMinima.total = (skuOrdenDeVentaPrincipal.skuUnidadMinima.cost * skuOrdenDeVentaPrincipal.skuUnidadMinima.qty);
                                    sku.skuUnidadMinima.qty -= 1;
                                    sku.skuUnidadMinima.total = sku.skuUnidadMinima.cost * sku.skuUnidadMinima.qty;
                                    totalTomandoDeOrdenDeVentaPrincipal += sku.skuUnidadMinima.cost;
                                    break;
                                }
                            }
                            //// Todo: No se encontro el sku, se agrega el sku a la orden de venta
                            if (!existeSku) {
                                var skuParaAgregar = <Sku>JSON.parse(JSON.stringify(sku));//this.clone(sku);//this.clone(sku);
                                skuParaAgregar.skuUnidadMinima.qty = 1;
                                skuParaAgregar.skuUnidadMinima.total = skuParaAgregar.skuUnidadMinima.cost;
                                this.listaSkuOrdenDeVentaPrincipal.push(skuParaAgregar);
                                sku.skuUnidadMinima.qty -= 1;
                                sku.skuUnidadMinima.total = sku.skuUnidadMinima.cost * sku.skuUnidadMinima.qty;
                                totalTomandoDeOrdenDeVentaPrincipal += skuParaAgregar.skuUnidadMinima.cost;

                            }
                        } else {
                            this.listaSkuOrdenDeVentaRestante.push(sku);
                            break;
                        }
                        //// Todo: Borrar de la lista sku
                    }
                    listaSku.splice(i, 1);
                    i--;

                }
            } else {
                for (i = 0; i < listaSku.length; i++) {
                    this.listaSkuOrdenDeVentaRestante.push(listaSku[i]);
                }
            }
            callback();

        } catch (ex) {
            my_dialog("", "", "close");
            notify("Error al dividir la preventa: " + ex.message);
        }
    }

    generarListasOrdenDeVenta(callback: () => void) {
        try {
            var uiListaPreVentaPrincipal = $('#UiListaPreVentaPrincipal');
            uiListaPreVentaPrincipal.children().remove('li');
            var uiListaPreVentaRestante = $('#UiListaPreVentaRestante');
            uiListaPreVentaRestante.children().remove('li');

            var li: string = "", sku = new Sku(), i = 0;

            //// Todo: Generar lista de orden de venta principal
            for (i = 0; i < this.listaSkuOrdenDeVentaPrincipal.length; i++) {
                sku = this.listaSkuOrdenDeVentaPrincipal[i];
                if (sku.skuUnidadMinima.qty > 0) {
                    var nombreDelLi: string = "";

                    if (sku.skuUnidadMinima.cost <= MaximoCF) {
                        nombreDelLi = "UiLiDividirOrdenDeVentaLineaPrincipal-Restar-" + sku.sku + "-" + sku.codePackUnit;
                        li = "<li data-icon='minus' id='" + nombreDelLi + "'>";
                    } else {
                        nombreDelLi = "UiLiDividirOrdenDeVentaLineaPrincipal-NoRestar-" + sku.sku + "-" + sku.codePackUnit;
                        li = "<li data-icon='forbidden' id='" + nombreDelLi + "'>";
                    }
                    //li = "<li data-icon='minus' id='" + nombreDelLi + "'>";
                    li += "<a href='#'>";
                    li += "<p><b>" + sku.skuUnidadMinima.sku + "/" + sku.skuUnidadMinima.skuName + "</b></p>";
                    li += "<p><b>" + sku.codePackUnit + "/" + sku.skuUnidadMinima.codePackUnit + "</b></p>";
                    li += "<p>";
                    li += "<b>Cant: </b><span id='UiSpanDividirOrdenDeVentaCantidadPrincipal-" + sku.sku + "-" + sku.codePackUnit + "'>" + sku.skuUnidadMinima.qty + " </span>";
                    li += "<b>P/U: </b><span>" + format_number(sku.skuUnidadMinima.cost, this.configuracionDecimales.defaultDisplayDecimals) + " </span>";
                    li += "<span class='ui-li-count' style='position:absolute; top:70%' id='UiSpanDividirOrdenDeVentaTotalPrincipal-" + sku.sku + "-" + sku.codePackUnit + "'>Q" + format_number(sku.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals) + "</span>";
                    li += "</p>";
                    li += "</a>";

                    li += "</li>";
                    uiListaPreVentaPrincipal.append(li);
                    uiListaPreVentaPrincipal.listview('refresh');
                }
            }
            //// Todo: Generar lista de orden de venta restante
            for (i = 0; i < this.listaSkuOrdenDeVentaRestante.length; i++) {
                sku = this.listaSkuOrdenDeVentaRestante[i];
                if (sku.skuUnidadMinima.qty > 0) {
                    li = "<li data-icon='minus' id='UiLiDividirOrdenDeVentaLineaRestante-Restar-" + sku.sku + "-" + sku.codePackUnit + "'>";
                    li += "<a href='#'>";
                    li += "<p><b>" + sku.skuUnidadMinima.sku + "/" + sku.skuUnidadMinima.skuName + "</b></p>";
                    li += "<p><b>" + sku.codePackUnit + "/" + sku.skuUnidadMinima.codePackUnit + "</b></p>";
                    li += "<p>";
                    li += "<b>Cant: </b><span id='UiSpanDividirOrdenDeVentaCantidadRestante-" + sku.sku + "-" + sku.codePackUnit + "'>" + sku.skuUnidadMinima.qty + " </span>";
                    li += "<b>P/U: </b><span>" + format_number(sku.skuUnidadMinima.cost, this.configuracionDecimales.defaultDisplayDecimals) + " </span>";
                    li += "<span class='ui-li-count' style='position:absolute; top:70%' id='UiSpanDividirOrdenDeVentaTotalRestante-" + sku.sku + "-" + sku.codePackUnit + "'>Q" + format_number(sku.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals) + "</span>";
                    li += "</p>";
                    li += "</a>";


                    li += "</li>";
                    uiListaPreVentaRestante.append(li);
                    uiListaPreVentaRestante.listview('refresh');
                }
            }

            uiListaPreVentaRestante = null;
            uiListaPreVentaPrincipal = null;
            callback();
        } catch (ex) {
            my_dialog("", "", "close");
            notify("Error al dividir la preventa: " + ex.message);
        }
    }

    establerTotalesDeOrdenDeVenta() {
        try {
            var total: number = 0, sku = new Sku();

            //// Todo: Obtener total de orden de venta principal
            for (var i = 0; i < this.listaSkuOrdenDeVentaPrincipal.length; i++) {
                sku = this.listaSkuOrdenDeVentaPrincipal[i];
                total += sku.skuUnidadMinima.total;
            }

            var uiTotalDeOrdenPrincipal = $('#UiTotalDeOrdenPrincipal');
            uiTotalDeOrdenPrincipal.text("Orden (Total : " + format_number(total, this.configuracionDecimales.defaultDisplayDecimals) + ")");
            uiTotalDeOrdenPrincipal = null;

            total = 0;
            for (var i = 0; i < this.listaSkuOrdenDeVentaRestante.length; i++) {
                sku = this.listaSkuOrdenDeVentaRestante[i];
                total += sku.skuUnidadMinima.total;
            }

            var uiTotalDeOrdenRestante = $('#UiTotalDeOrdenRestante');
            uiTotalDeOrdenRestante.text("Restante (Total : " + format_number(total, this.configuracionDecimales.defaultDisplayDecimals) + ")");
            uiTotalDeOrdenRestante = null;

        } catch (ex) {
            notify("Error al dividir la preventa: " + ex.message);
        }
    }

    quitarSkuDeOrdenDeVentaPrincipal(codigoSku: string, codigoPaquete: string) {
        try {
            for (var i = 0; i < this.listaSkuOrdenDeVentaPrincipal.length; i++) {
                var skuOrdenPrincipal = this.listaSkuOrdenDeVentaPrincipal[i];
                if (skuOrdenPrincipal.sku === codigoSku && skuOrdenPrincipal.codePackUnit === codigoPaquete) {
                    skuOrdenPrincipal.skuUnidadMinima.qty -= 1;
                    skuOrdenPrincipal.skuUnidadMinima.total = (skuOrdenPrincipal.skuUnidadMinima.cost * skuOrdenPrincipal.skuUnidadMinima.qty);


                    var existeSkuEnOrdenRestante = false;
                    for (var j = 0; j < this.listaSkuOrdenDeVentaRestante.length; j++) {
                        var skuOrdenRestante = this.listaSkuOrdenDeVentaRestante[j];
                        if (skuOrdenRestante.sku === codigoSku && skuOrdenRestante.codePackUnit === codigoPaquete) {
                            skuOrdenRestante.skuUnidadMinima.qty += 1;
                            skuOrdenRestante.skuUnidadMinima.total = (skuOrdenRestante.skuUnidadMinima.cost * skuOrdenRestante.skuUnidadMinima.qty);
                            existeSkuEnOrdenRestante = true;

                            //// Todo: Se actualiza la cantidad de la lista UI.
                            var uiSpanDividirOrdenDeVentaCantidadRestante = $("#UiSpanDividirOrdenDeVentaCantidadRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                            uiSpanDividirOrdenDeVentaCantidadRestante.text(skuOrdenRestante.skuUnidadMinima.qty);
                            uiSpanDividirOrdenDeVentaCantidadRestante = null;
                            //// Todo: Se actualiza el total de la lista UI.
                            var uiSpanDividirOrdenDeVentaTotalRestante = $("#UiSpanDividirOrdenDeVentaTotalRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                            uiSpanDividirOrdenDeVentaTotalRestante.text("Q" + format_number(skuOrdenRestante.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                            uiSpanDividirOrdenDeVentaTotalRestante = null;
                            break;
                        }
                    }

                    if (!existeSkuEnOrdenRestante) {
                        var skuParaAgregar = <Sku>JSON.parse(JSON.stringify(skuOrdenPrincipal));
                        skuParaAgregar.skuUnidadMinima.qty = 1;
                        skuParaAgregar.skuUnidadMinima.total = skuParaAgregar.skuUnidadMinima.cost;
                        this.listaSkuOrdenDeVentaRestante.push(skuParaAgregar);
                        //// Todo: Se agrega una nueva fila a la lista
                        var uiListaPreVentaRestante = $("#UiListaPreVentaRestante");
                        var li = "";
                        li = "<li data-icon='minus' id='UiLiDividirOrdenDeVentaLineaRestante-Restar-" + skuParaAgregar.sku + "-" + skuParaAgregar.codePackUnit + "'>";
                        li += "<a href='#'>";
                        li += "<p><b>" + skuParaAgregar.skuUnidadMinima.sku + "/" + skuParaAgregar.skuUnidadMinima.skuName + "</b></p>";
                        li += "<p><b>" + skuParaAgregar.codePackUnit + "/" + skuParaAgregar.skuUnidadMinima.codePackUnit + "</b></p>";
                        li += "<p>";
                        li += "<b>Cant: </b><span id='UiSpanDividirOrdenDeVentaCantidadRestante-" + skuParaAgregar.sku + "-" + skuParaAgregar.codePackUnit + "'>" + skuParaAgregar.skuUnidadMinima.qty + " </span>";
                        li += "<b>P/U: </b><span>" + format_number(skuParaAgregar.skuUnidadMinima.cost, this.configuracionDecimales.defaultDisplayDecimals) + " </span>";
                        li += "<span class='ui-li-count' style='position:absolute; top:70%' id='UiSpanDividirOrdenDeVentaTotalRestante-" + skuParaAgregar.sku + "-" + skuParaAgregar.codePackUnit + "'>Q" + format_number(skuParaAgregar.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals) + "</span>";
                        li += "</p>";
                        li += "</a>";
                        uiListaPreVentaRestante.append(li);
                        uiListaPreVentaRestante.listview('refresh');
                        uiListaPreVentaRestante = null;
                    }

                    if (skuOrdenPrincipal.skuUnidadMinima.qty === 0) {
                        var uiLiDividirOrdenDeVentaLinea = $("#UiLiDividirOrdenDeVentaLineaPrincipal-Restar-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                        uiLiDividirOrdenDeVentaLinea.closest("li").remove();
                        uiLiDividirOrdenDeVentaLinea = null;
                        this.listaSkuOrdenDeVentaPrincipal.splice(i, 1);
                    } else {
                        //// Todo: Se actualiza la cantidad de la lista UI.
                        var uiSpanDividirOrdenDeVentaCantidad = $("#UiSpanDividirOrdenDeVentaCantidadPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                        uiSpanDividirOrdenDeVentaCantidad.text(skuOrdenPrincipal.skuUnidadMinima.qty);
                        uiSpanDividirOrdenDeVentaCantidad = null;
                        //// Todo: Se actualiza el total de la lista UI.
                        var uiSpanDividirOrdenDeVentaTotalPrincipal = $("#UiSpanDividirOrdenDeVentaTotalPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                        uiSpanDividirOrdenDeVentaTotalPrincipal.text("Q" + format_number(skuOrdenPrincipal.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                        uiSpanDividirOrdenDeVentaTotalPrincipal = null;
                    }
                    break;
                }
            }
        } catch (ex) {
            notify("Quitar sku orde principal: " + ex.message);
        }
    }

    quitarSkuDeOrdenDeVentaRestante(codigoSku: string, codigoPaquete: string) {
        try {
            for (var i = 0; i < this.listaSkuOrdenDeVentaRestante.length; i++) {
                var skuOrdenRestante = this.listaSkuOrdenDeVentaRestante[i];
                if (skuOrdenRestante.sku === codigoSku && skuOrdenRestante.codePackUnit === codigoPaquete) {
                    skuOrdenRestante.skuUnidadMinima.qty -= 1;
                    skuOrdenRestante.skuUnidadMinima.total = (skuOrdenRestante.skuUnidadMinima.cost * skuOrdenRestante.skuUnidadMinima.qty);

                    var existeSkuEnOrdenPrincipal = false;
                    for (var j = 0; j < this.listaSkuOrdenDeVentaPrincipal.length; j++) {
                        var skuOrdenPrincipal = this.listaSkuOrdenDeVentaPrincipal[j];
                        if (skuOrdenPrincipal.sku === codigoSku && skuOrdenPrincipal.codePackUnit === codigoPaquete) {
                            skuOrdenPrincipal.skuUnidadMinima.qty += 1;
                            skuOrdenPrincipal.skuUnidadMinima.total = (skuOrdenPrincipal.skuUnidadMinima.cost * skuOrdenPrincipal.skuUnidadMinima.qty);
                            existeSkuEnOrdenPrincipal = true;

                            //// Todo: Se actualiza la cantidad de la lista UI.
                            var uiSpanDividirOrdenDeVentaCantidadPrincipal = $("#UiSpanDividirOrdenDeVentaCantidadPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                            uiSpanDividirOrdenDeVentaCantidadPrincipal.text(skuOrdenPrincipal.skuUnidadMinima.qty);
                            uiSpanDividirOrdenDeVentaCantidadPrincipal = null;
                            //// Todo: Se actualiza el total de la lista UI.
                            var uiSpanDividirOrdenDeVentaTotalPrincipal = $("#UiSpanDividirOrdenDeVentaTotalPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                            uiSpanDividirOrdenDeVentaTotalPrincipal.text("Q" + format_number(skuOrdenPrincipal.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                            uiSpanDividirOrdenDeVentaTotalPrincipal = null;
                            break;
                        }
                    }

                    if (!existeSkuEnOrdenPrincipal) {
                        var skuParaAgregar = <Sku>JSON.parse(JSON.stringify(skuOrdenRestante));
                        skuParaAgregar.skuUnidadMinima.qty = 1;
                        skuParaAgregar.skuUnidadMinima.total = skuParaAgregar.skuUnidadMinima.cost;
                        this.listaSkuOrdenDeVentaPrincipal.push(skuParaAgregar);
                        //// Todo: Se agrega una nueva fila a la lista
                        var uiListaPreVentaPrincipal = $("#UiListaPreVentaPrincipal");
                        var li = "";
                        li = "<li data-icon='minus' id='UiLiDividirOrdenDeVentaLineaPrincipal-Restar-" + skuParaAgregar.sku + "-" + skuParaAgregar.codePackUnit + "'>";
                        li += "<a href='#'>";
                        li += "<p><b>" + skuParaAgregar.skuUnidadMinima.sku + "/" + skuParaAgregar.skuUnidadMinima.skuName + "</b></p>";
                        li += "<p><b>" + skuParaAgregar.codePackUnit + "/" + skuParaAgregar.skuUnidadMinima.codePackUnit + "</b></p>";
                        li += "<p>";
                        li += "<b>Cant: </b><span id='UiSpanDividirOrdenDeVentaCantidadPrincipal-" + skuParaAgregar.sku + "-" + skuParaAgregar.codePackUnit + "'>" + skuParaAgregar.skuUnidadMinima.qty + " </span>";
                        li += "<b>P/U: </b><span>" + format_number(skuParaAgregar.skuUnidadMinima.cost, this.configuracionDecimales.defaultDisplayDecimals) + " </span>";
                        li += "<span class='ui-li-count' style='position:absolute; top:70%' id='UiSpanDividirOrdenDeVentaTotalPrincipal-" + skuParaAgregar.sku + "-" + skuParaAgregar.codePackUnit + "'>Q" + format_number(skuParaAgregar.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals) + "</span>";
                        li += "</p>";
                        li += "</a>";
                        uiListaPreVentaPrincipal.append(li);
                        uiListaPreVentaPrincipal.listview('refresh');
                        uiListaPreVentaPrincipal = null;
                    }

                    if (skuOrdenRestante.skuUnidadMinima.qty === 0) {
                        var uiLiDividirOrdenDeVentaLinea = $("#UiLiDividirOrdenDeVentaLineaRestante-Restar-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                        uiLiDividirOrdenDeVentaLinea.closest("li").remove();
                        uiLiDividirOrdenDeVentaLinea = null;
                        this.listaSkuOrdenDeVentaRestante.splice(i, 1);
                    } else {
                        //// Todo: Se actualiza la cantidad de la lista UI.
                        var uiSpanDividirOrdenDeVentaCantidadRestante = $("#UiSpanDividirOrdenDeVentaCantidadRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                        uiSpanDividirOrdenDeVentaCantidadRestante.text(skuOrdenRestante.skuUnidadMinima.qty);
                        uiSpanDividirOrdenDeVentaCantidadRestante = null;
                        //// Todo: Se actualiza el total de la lista UI.
                        var uiSpanDividirOrdenDeVentaTotalRestante = $("#UiSpanDividirOrdenDeVentaTotalRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                        uiSpanDividirOrdenDeVentaTotalRestante.text("Q" + format_number(skuOrdenRestante.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                        uiSpanDividirOrdenDeVentaTotalRestante = null;
                    }
                    break;
                }
            }
        } catch (ex) {
            notify("Quitar sku orde restante: " + ex.message);
        }
    }

    validarSiEsUltimoSku(): boolean {
        try {
            if (this.listaSkuOrdenDeVentaPrincipal.length === 1) {
                if (this.listaSkuOrdenDeVentaPrincipal[0].skuUnidadMinima.qty === 1) {
                    notify("La orden de venta principal no puede quedar vacia.");
                    return false;
                }
            }
            return true;
        } catch (ex) {
            notify("Error al validar si es ultimo sku: " + ex.message);
            return false;
        }
    }

    usuarioDeseaAceptarOrdenDeVenta() {
                try {
                        if (this.listaSkuOrdenDeVentaPrincipal.length >= 1) {
                                navigator.notification.confirm("Desea finalizar el documento?", (buttonIndex) => {
                                        if (buttonIndex === 2) {
                                                my_dialog("Creando orden de venta", "Espere...", "open");
                                                this.prepararOrdenDeVenta(this.listaSkuOrdenDeVentaPrincipal, 0, 0, (indiceListaCf: number) => {
                                                        if (this.listaSkuOrdenDeVentaRestante.length >= 1) {
                                                                this.separandoOrdenesDeVenta(() => {
                                                                        this.recorrerOrdenesCfParaConvertirloAUnidadMayor(0, () => {
                                                                                this.seguirConlaOrdenDeVentaAceptada();
                                                                        });
                                                                });
                                                        } else {
                                                                this.seguirConlaOrdenDeVentaAceptada();
                                                        }
                                                });
                                        }
                                }, "Sonda® " + SondaVersion, <any>'No,Si');
                        } else {
                                notify("La orden de venta principal esta vacia.");
                                var uiTotalPreVenta = $("#UiTotalPreVenta");
                                uiTotalPreVenta.focus();
                                uiTotalPreVenta = null;
                        }
                } catch (ex) {
                        notify("Error al aceptar la orden de venta: " + ex.message);
                }
        }

    seguirConlaOrdenDeVentaAceptada() {
        try {
            ObtenerCantidadDeSecuenciasDisponibles("SALES_ORDER", (docType: string, docFrom: number, docTo: number, serie: string, currentDoc: number, available: number) => {
                var cantidadDeSecuenciasNecesarias = 1;
                cantidadDeSecuenciasNecesarias += this.listaDeOrdnesDeVEntaCf.length;
                if (cantidadDeSecuenciasNecesarias <= available) {
                    this.publicarOrdenesDeVentaPorDivision(this.listaSkuOrdenDeVentaPrincipal, this.listaDeOrdnesDeVEntaCf);
                    my_dialog("", "", "close");
                    $.mobile.changePage("#UiPageRepPreSale", {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                } else {
                    notify("Secuencias insuficientes. " + "(Necesarias : " + cantidadDeSecuenciasNecesarias + ") (Disponibles: " + available + ")");
                }
            }, (errorMensaje: string) => {
                notify(errorMensaje);
            });
        } catch (ex) {
            notify("Error al seguir la orden de venta aceptada: " + ex.message);
        } 
    }

    prepararOrdenDeVenta(listaSku: Sku[], indiceDeListaSku: number, indiceListaCf: number, callback: (indiceListaCf: number)=> void ) {
        try {
            if ((listaSku.length) > indiceDeListaSku) {
                this.paqueteServicio.obtenerDenominacionPorSku(listaSku[indiceDeListaSku], indiceDeListaSku, (listaPaquete: Paquete[], indiceDeListaSku: number) => {
                    listaPaquete.reverse();
                    var i = 0;
                    for (i = 0; i < listaPaquete.length; i++) {
                        if (listaSku[indiceDeListaSku].codePackUnit === listaPaquete[i].codePackUnit) {
                            listaPaquete.splice(i + 1, listaPaquete.length);
                            listaPaquete[i].qty = 0;
                            break;
                        } else {
                            listaPaquete[i].qty = 0;
                        }
                    }

                    for (i = 0; i < listaPaquete.length; i++) {
                        if (listaSku[indiceDeListaSku].skuUnidadMinima.codePackUnit === listaPaquete[i].codePackUnit) {
                            listaPaquete[i].qty = listaSku[indiceDeListaSku].skuUnidadMinima.qty;
                            break;
                        }
                    }
                    this.calcularDenominacion(0, listaPaquete, listaSku, indiceDeListaSku, (paquetes: Paquete[], indiceDeListaSku: number) => {
                        listaSku[indiceDeListaSku].qty = paquetes[paquetes.length - 1].qty;
                        listaSku[indiceDeListaSku].total = listaSku[indiceDeListaSku].skuUnidadMinima.total;
                        this.prepararOrdenDeVenta(listaSku, indiceDeListaSku + 1, indiceListaCf,() => {
                            callback(indiceListaCf);
                        });
                    });

                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                });
            } else {
                callback(indiceListaCf);
            }

        } catch (ex) {
            notify("Error al preparar las ordenes de venta: " + ex.message);
        }
    }

    obtenerCocienteYResiduo(cantidad: number, paqueteConversion: PaqueteConversion, paquetes: Paquete[], index: number, callback: (cociente: number, residuo: number, paqueteConversion: PaqueteConversion, paquetes: Paquete[], index: number) => void, callbackError: (resultado: Operacion) => void) {
        try {
            var residuo: number = 0;
            var cociente: number = 0;
            if (paqueteConversion.conversionFactor >= 1) {
                //residuo = cantidad % paqueteConversion.conversionFactor;
                cociente = (cantidad) / paqueteConversion.conversionFactor;
            } else {
                //residuo = cantidad % (1 / paqueteConversion.conversionFactor);
                cociente = (cantidad) / (1 / paqueteConversion.conversionFactor);
            }

            callback(cociente, residuo, paqueteConversion, paquetes, index);
        } catch (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        }
    }

    calcularDenominacion(indicePaquetes: number, paquetes: Paquete[], listaSku: Sku[], indiceDeListaSku: number, callback?: (paquetes: Paquete[], indiceDeListaSku: number)=>void) {
        if (indicePaquetes < (paquetes.length - 1)) {
            this.paqueteServicio.obtenerConversionDePaquete(listaSku[indiceDeListaSku], paquetes, indicePaquetes, this.configuracionDecimales, (conversionDePaquete: PaqueteConversion, paquetesN1: Paquete[], index: number) => {

                this.obtenerCocienteYResiduo(paquetesN1[index].qty, conversionDePaquete, paquetesN1, index, (cociente: number, residuo: number, paqueteConversion: PaqueteConversion, paquetesN2: Paquete[], indexN1: number) => {

                    paquetesN2[indexN1].qty = residuo;
                    paquetesN2[indexN1 + 1].qty += cociente;

                    this.calcularDenominacion(indexN1 + 1, paquetesN2, listaSku, indiceDeListaSku, () => {
                        callback(paquetes, indiceDeListaSku);
                    });
                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                });

            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            }
            );
        } else {
            callback(paquetes, indiceDeListaSku);
        }
    }

    separandoOrdenesDeVenta(callback: () =>void){
        try {
            this.listaDeOrdnesDeVEntaCf = [];
            var sku = new Sku();
            var total: number = 0;
            var lista: Sku[] = [];
            for (var i = 0; i < this.listaSkuOrdenDeVentaRestante.length; i++) {
                sku = <Sku>JSON.parse(JSON.stringify(this.listaSkuOrdenDeVentaRestante[i]));
                if ((total + sku.skuUnidadMinima.total) <= MaximoCF ) {
                    lista.push(sku);
                    total += sku.skuUnidadMinima.total;
                } else {
                    var skuAgregar = new Sku();
                    skuAgregar.qty = 0;
                    for (var j = 0; j < sku.skuUnidadMinima.qty; j++) {
                        if ((total + sku.skuUnidadMinima.cost) <= MaximoCF) {
                            if (j === 0) {
                                skuAgregar = <Sku>JSON.parse(JSON.stringify(sku));
                                skuAgregar.skuUnidadMinima.qty = 1;
                                skuAgregar.skuUnidadMinima.total = sku.skuUnidadMinima.cost;
                            } else {
                                skuAgregar.skuUnidadMinima.qty += 1;
                                skuAgregar.skuUnidadMinima.total = (sku.skuUnidadMinima.cost * skuAgregar.skuUnidadMinima.qty);
                            }
                        } else {
                            if (skuAgregar.qty !== 0) {
                                lista.push(<Sku>JSON.parse(JSON.stringify(skuAgregar)));
                                this.listaDeOrdnesDeVEntaCf.push(<Sku[]>JSON.parse(JSON.stringify(lista)));
                            }
                            skuAgregar = <Sku>JSON.parse(JSON.stringify(sku));
                            skuAgregar.skuUnidadMinima.qty = 1;
                            skuAgregar.skuUnidadMinima.total = sku.skuUnidadMinima.cost;
                            lista = [];
                            total = 0;
                        }
                        total += sku.skuUnidadMinima.cost;
                    }
                    if (skuAgregar.qty !== 0) {
                        lista.push(<Sku>JSON.parse(JSON.stringify(skuAgregar)));
                        //this.listaDeOrdnesDeVEntaCf.push(<Sku[]>JSON.parse(JSON.stringify(lista)));
                    }
                } 
            }
            this.listaDeOrdnesDeVEntaCf.push(<Sku[]>JSON.parse(JSON.stringify(lista)));
            callback();
        } catch (ex) {
            notify("Error al separa la orden de venta: " + ex.message);
        }
    }

    recorrerOrdenesCfParaConvertirloAUnidadMayor(indiceOrdenesCf: number, callback: () => void) {
        if (indiceOrdenesCf <= (this.listaDeOrdnesDeVEntaCf.length - 1)) {
            this.prepararOrdenDeVenta(this.listaDeOrdnesDeVEntaCf[indiceOrdenesCf], 0, indiceOrdenesCf, (indiceOrdenesCf: number) => {
                this.recorrerOrdenesCfParaConvertirloAUnidadMayor(indiceOrdenesCf + 1, () => {
                    callback();
                });
            });
        } else {
            callback();
        }
    }

    publicarOrdenesDeVentaPorDivision(listaPrincipal : Sku[], listaCf: (Sku[])[]) {
        var msg = new OrdenesDeVentaDevidosMensaje(this);
        msg.listaSkuOrdenDeVentaPrincipal = listaPrincipal;
        msg.listaDeOrdnesDeVEntaCf = listaCf;
        this.mensajero.publish(msg, getType(OrdenesDeVentaDevidosMensaje));
    }

    //obtenerPrecioMinimoParaOrdenPrincipal() {
    //    try {
    //        this.precioMinimoParaOrdenPricipal = 0;
    //        var precioMayor: number = 0;
    //        var precioMenor: number = 0;
    //        for (var i = 0; i < this.listaSku.length; i++) {
    //            var sku = this.listaSku[i];
    //            if (precioMayor < sku.skuUnidadMinima.cost) {
    //                precioMayor = sku.skuUnidadMinima.cost;
    //            }

    //            if (precioMenor === 0) {
    //                precioMenor = sku.skuUnidadMinima.cost;
    //            } else {
    //                if (precioMenor > sku.skuUnidadMinima.cost) {
    //                    precioMenor = sku.skuUnidadMinima.cost;
    //                }
    //            }
    //        }

    //        if (precioMayor > MaximoCF) {
    //            this.precioMinimoParaOrdenPricipal = precioMayor;
    //        }


    //    } catch (ex) {
    //        notify("Error al preparar las ordenes de venta: " + ex.message);
    //    } 
    //}
}

