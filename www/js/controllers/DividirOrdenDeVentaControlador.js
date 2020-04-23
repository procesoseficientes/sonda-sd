var DividirOrdenDeVentaControlador = (function () {
    function DividirOrdenDeVentaControlador(mensajero) {
        this.mensajero = mensajero;
        this.configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
        this.paqueteServicio = new PaqueteServicio();
        this.listaSku = [];
        this.listaReglas = [];
        this.indiceDeReglaActual = 0;
        this.precioMinimoDeOrdenDeVenta = 0;
        this.listaSkuOrdenDeVentaPrincipal = [];
        this.listaSkuOrdenDeVentaRestante = [];
        this.listaDeOrdnesDeVEntaCf = [];
        this.precioMinimoParaOrdenPricipal = 0;
    }
    DividirOrdenDeVentaControlador.prototype.delegadoDividirOrdenDeVentaControlador = function () {
        var _this = this;
        $("#UiPagePreventa").on("pageshow", function () {
            my_dialog("Preparando Sku", "Espere...", "open");
            _this.cargarDatos();
            _this.cargarUnidadDeMedidaMinima(0);
        });
        $("#UiBotonCalcularPrenVenta").bind("touchstart", function () {
            _this.usuarioDeseDividirOrdenDeVenta();
        });
        $("#UiPagePreventa").on("click", "#UiListaPreVentaPrincipal li", function (event) {
            if (_this.validarSiEsUltimoSku()) {
                var id = event.currentTarget.attributes["id"].nodeValue;
                if (id.split("-")[1] === "Restar") {
                    _this.quitarSkuDeOrdenDeVentaPrincipal(id.split("-")[2], id.split("-")[3]);
                    _this.establerTotalesDeOrdenDeVenta();
                }
            }
        });
        $("#UiPagePreventa").on("click", "#UiListaPreVentaRestante li", function (event) {
            var id = event.currentTarget.attributes["id"].nodeValue;
            if (id.split("-")[1] === "Restar") {
                _this.quitarSkuDeOrdenDeVentaRestante(id.split("-")[2], id.split("-")[3]);
                _this.establerTotalesDeOrdenDeVenta();
            }
        });
        $("#UiBotonAceptarPrenVenta").bind("touchstart", function () {
            _this.usuarioDeseaAceptarOrdenDeVenta();
        });
    };
    DividirOrdenDeVentaControlador.prototype.clienteEntregado = function (mensaje, subcriber) {
        subcriber.cliente = mensaje.cliente;
    };
    DividirOrdenDeVentaControlador.prototype.listaSkuEntregado = function (mensaje, subcriber) {
        subcriber.listaSku = mensaje.listaSku;
    };
    DividirOrdenDeVentaControlador.prototype.tareaEntregada = function (mensaje, subcriber) {
        subcriber.tarea = mensaje.tarea;
    };
    DividirOrdenDeVentaControlador.prototype.listaReglasEntregado = function (mensaje, subscriber) {
        subscriber.listaReglas = mensaje.listaDeReglas;
        subscriber.indiceDeReglaActual = mensaje.indiceDeReglaActual;
    };
    DividirOrdenDeVentaControlador.prototype.obtenerConfiguracionDeDecimales = function () {
        var _this = this;
        this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
            _this.configuracionDecimales = decimales;
        }, function (operacion) {
            notify(operacion.mensaje);
        });
    };
    DividirOrdenDeVentaControlador.prototype.cargarDatos = function () {
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
    };
    DividirOrdenDeVentaControlador.prototype.cargarUnidadDeMedidaMinima = function (indiceDeListaSku) {
        var _this = this;
        try {
            this.paqueteServicio.obtenerDenominacionPorSku(this.listaSku[indiceDeListaSku], indiceDeListaSku, function (listaPaquete, indiceDeListaSku) {
                listaPaquete.reverse();
                for (var i = 0; i < listaPaquete.length; i++) {
                    if (_this.listaSku[indiceDeListaSku].codePackUnit === listaPaquete[i].codePackUnit) {
                        listaPaquete.splice(i + 1, listaPaquete.length);
                        listaPaquete[i].qty = _this.listaSku[indiceDeListaSku].qty;
                        break;
                    }
                    else {
                        listaPaquete[i].qty = 0;
                    }
                }
                listaPaquete.reverse();
                if (listaPaquete.length === 1) {
                    var sku = JSON.parse(JSON.stringify(_this.listaSku[indiceDeListaSku]));
                    sku.skuUnidadMinima = new Sku();
                    _this.listaSku[indiceDeListaSku].skuUnidadMinima = sku;
                    if ((indiceDeListaSku + 1) === _this.listaSku.length) {
                        my_dialog("", "", "close");
                        _this.listaSku.sort(function (obj1, obj2) {
                            return obj1.skuUnidadMinima.cost - obj2.skuUnidadMinima.cost;
                        });
                    }
                    else {
                        _this.cargarUnidadDeMedidaMinima(indiceDeListaSku + 1);
                    }
                }
                else {
                    _this.obtenerMenorDenominacion(listaPaquete, 1, indiceDeListaSku, function (sku, indiceDeListaSku) {
                        _this.listaSku[indiceDeListaSku].skuUnidadMinima = sku;
                        if ((indiceDeListaSku + 1) === _this.listaSku.length) {
                            my_dialog("", "", "close");
                            _this.listaSku.sort(function (obj1, obj2) {
                                return obj1.skuUnidadMinima.cost - obj2.skuUnidadMinima.cost;
                            });
                        }
                        else {
                            _this.cargarUnidadDeMedidaMinima(indiceDeListaSku + 1);
                        }
                    });
                }
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        catch (ex) {
            notify("Error al obtener unidad de medida minima: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.obtenerMenorDenominacion = function (listaPaquete, indiceListaPaquetes, indiceDeListaSku, callback) {
        var _this = this;
        try {
            this.paqueteServicio.obtenerConversionDePaquete(this.listaSku[indiceDeListaSku], listaPaquete, indiceListaPaquetes, this.configuracionDecimales, function (conversionDePaquete, paquetesN1, indiceListaPaquetes) {
                if (conversionDePaquete.conversionFactor >= 1) {
                    paquetesN1[indiceListaPaquetes].qty = paquetesN1[indiceListaPaquetes].qty + (paquetesN1[indiceListaPaquetes - 1].qty * conversionDePaquete.conversionFactor);
                }
                else {
                    paquetesN1[indiceListaPaquetes].qty = paquetesN1[indiceListaPaquetes].qty + (paquetesN1[indiceListaPaquetes - 1].qty * (1 / conversionDePaquete.conversionFactor));
                }
                if (indiceListaPaquetes === (paquetesN1.length - 1)) {
                    var sku = new Sku();
                    sku.sku = _this.listaSku[indiceDeListaSku].sku;
                    sku.skuName = _this.listaSku[indiceDeListaSku].skuName;
                    sku.qty = paquetesN1[indiceListaPaquetes].qty;
                    sku.codePackUnit = paquetesN1[indiceListaPaquetes].codePackUnit;
                    sku.cost = (_this.listaSku[indiceDeListaSku].total / paquetesN1[indiceListaPaquetes].qty);
                    sku.total = _this.listaSku[indiceDeListaSku].total;
                    callback(sku, indiceDeListaSku);
                }
                else {
                    _this.obtenerMenorDenominacion(paquetesN1, indiceListaPaquetes + 1, indiceDeListaSku);
                }
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        catch (err) {
            notify("Error al obtener menor denominacion: " + err.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.usuarioDeseDividirOrdenDeVenta = function () {
        var _this = this;
        try {
            var uiTotalPreVenta = $("#UiTotalPreVenta");
            if (uiTotalPreVenta !== undefined && uiTotalPreVenta !== null && uiTotalPreVenta.val() !== "") {
                var totalOrdenDeVentaPrincipal = parseFloat(uiTotalPreVenta.val());
                my_dialog("Dividiendo Orden de Venta", "Espere...", "open");
                this.dividirOrdenDeVenta(totalOrdenDeVentaPrincipal, JSON.parse(JSON.stringify(this.listaSku)), function () {
                    _this.generarListasOrdenDeVenta(function () {
                        _this.establerTotalesDeOrdenDeVenta();
                        my_dialog("", "", "close");
                    });
                });
            }
            else {
                if (uiTotalPreVenta !== undefined && uiTotalPreVenta !== null) {
                    notify("Ingrese el total de la orden de venta");
                    uiTotalPreVenta.focus();
                }
            }
            uiTotalPreVenta = null;
        }
        catch (ex) {
            my_dialog("", "", "close");
            notify("Error al dividir la preventa: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.dividirOrdenDeVenta = function (totalOrdenDeVentaPrincipal, listaSku, callback) {
        try {
            this.listaSkuOrdenDeVentaPrincipal = [];
            this.listaSkuOrdenDeVentaRestante = [];
            var totalTomandoDeOrdenDeVentaPrincipal = 0;
            var sku = new Sku(), skuOrdenDeVentaPrincipal = new Sku(), skuTotales = new Sku();
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
            if (totalTomandoDeOrdenDeVentaPrincipal < totalOrdenDeVentaPrincipal) {
                for (i = 0; i < listaSku.length; i++) {
                    sku = listaSku[i];
                    var cantidad = sku.skuUnidadMinima.qty;
                    for (var k = 0; k < cantidad; k++) {
                        if ((sku.skuUnidadMinima.cost + totalTomandoDeOrdenDeVentaPrincipal) <= (totalOrdenDeVentaPrincipal + 0.1)) {
                            var existeSku = false;
                            for (j = 0; j < this.listaSkuOrdenDeVentaPrincipal.length; j++) {
                                skuOrdenDeVentaPrincipal = this.listaSkuOrdenDeVentaPrincipal[j];
                                if (skuOrdenDeVentaPrincipal.sku === sku.sku && skuOrdenDeVentaPrincipal.codePackUnit === sku.codePackUnit) {
                                    existeSku = true;
                                    skuOrdenDeVentaPrincipal.skuUnidadMinima.qty += 1;
                                    skuOrdenDeVentaPrincipal.skuUnidadMinima.total = (skuOrdenDeVentaPrincipal.skuUnidadMinima.cost * skuOrdenDeVentaPrincipal.skuUnidadMinima.qty);
                                    sku.skuUnidadMinima.qty -= 1;
                                    sku.skuUnidadMinima.total = sku.skuUnidadMinima.cost * sku.skuUnidadMinima.qty;
                                    totalTomandoDeOrdenDeVentaPrincipal += sku.skuUnidadMinima.cost;
                                    break;
                                }
                            }
                            if (!existeSku) {
                                var skuParaAgregar = JSON.parse(JSON.stringify(sku));
                                skuParaAgregar.skuUnidadMinima.qty = 1;
                                skuParaAgregar.skuUnidadMinima.total = skuParaAgregar.skuUnidadMinima.cost;
                                this.listaSkuOrdenDeVentaPrincipal.push(skuParaAgregar);
                                sku.skuUnidadMinima.qty -= 1;
                                sku.skuUnidadMinima.total = sku.skuUnidadMinima.cost * sku.skuUnidadMinima.qty;
                                totalTomandoDeOrdenDeVentaPrincipal += skuParaAgregar.skuUnidadMinima.cost;
                            }
                        }
                        else {
                            this.listaSkuOrdenDeVentaRestante.push(sku);
                            break;
                        }
                    }
                    listaSku.splice(i, 1);
                    i--;
                }
            }
            else {
                for (i = 0; i < listaSku.length; i++) {
                    this.listaSkuOrdenDeVentaRestante.push(listaSku[i]);
                }
            }
            callback();
        }
        catch (ex) {
            my_dialog("", "", "close");
            notify("Error al dividir la preventa: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.generarListasOrdenDeVenta = function (callback) {
        try {
            var uiListaPreVentaPrincipal = $('#UiListaPreVentaPrincipal');
            uiListaPreVentaPrincipal.children().remove('li');
            var uiListaPreVentaRestante = $('#UiListaPreVentaRestante');
            uiListaPreVentaRestante.children().remove('li');
            var li = "", sku = new Sku(), i = 0;
            for (i = 0; i < this.listaSkuOrdenDeVentaPrincipal.length; i++) {
                sku = this.listaSkuOrdenDeVentaPrincipal[i];
                if (sku.skuUnidadMinima.qty > 0) {
                    var nombreDelLi = "";
                    if (sku.skuUnidadMinima.cost <= MaximoCF) {
                        nombreDelLi = "UiLiDividirOrdenDeVentaLineaPrincipal-Restar-" + sku.sku + "-" + sku.codePackUnit;
                        li = "<li data-icon='minus' id='" + nombreDelLi + "'>";
                    }
                    else {
                        nombreDelLi = "UiLiDividirOrdenDeVentaLineaPrincipal-NoRestar-" + sku.sku + "-" + sku.codePackUnit;
                        li = "<li data-icon='forbidden' id='" + nombreDelLi + "'>";
                    }
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
        }
        catch (ex) {
            my_dialog("", "", "close");
            notify("Error al dividir la preventa: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.establerTotalesDeOrdenDeVenta = function () {
        try {
            var total = 0, sku = new Sku();
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
        }
        catch (ex) {
            notify("Error al dividir la preventa: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.quitarSkuDeOrdenDeVentaPrincipal = function (codigoSku, codigoPaquete) {
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
                            var uiSpanDividirOrdenDeVentaCantidadRestante = $("#UiSpanDividirOrdenDeVentaCantidadRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                            uiSpanDividirOrdenDeVentaCantidadRestante.text(skuOrdenRestante.skuUnidadMinima.qty);
                            uiSpanDividirOrdenDeVentaCantidadRestante = null;
                            var uiSpanDividirOrdenDeVentaTotalRestante = $("#UiSpanDividirOrdenDeVentaTotalRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                            uiSpanDividirOrdenDeVentaTotalRestante.text("Q" + format_number(skuOrdenRestante.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                            uiSpanDividirOrdenDeVentaTotalRestante = null;
                            break;
                        }
                    }
                    if (!existeSkuEnOrdenRestante) {
                        var skuParaAgregar = JSON.parse(JSON.stringify(skuOrdenPrincipal));
                        skuParaAgregar.skuUnidadMinima.qty = 1;
                        skuParaAgregar.skuUnidadMinima.total = skuParaAgregar.skuUnidadMinima.cost;
                        this.listaSkuOrdenDeVentaRestante.push(skuParaAgregar);
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
                    }
                    else {
                        var uiSpanDividirOrdenDeVentaCantidad = $("#UiSpanDividirOrdenDeVentaCantidadPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                        uiSpanDividirOrdenDeVentaCantidad.text(skuOrdenPrincipal.skuUnidadMinima.qty);
                        uiSpanDividirOrdenDeVentaCantidad = null;
                        var uiSpanDividirOrdenDeVentaTotalPrincipal = $("#UiSpanDividirOrdenDeVentaTotalPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                        uiSpanDividirOrdenDeVentaTotalPrincipal.text("Q" + format_number(skuOrdenPrincipal.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                        uiSpanDividirOrdenDeVentaTotalPrincipal = null;
                    }
                    break;
                }
            }
        }
        catch (ex) {
            notify("Quitar sku orde principal: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.quitarSkuDeOrdenDeVentaRestante = function (codigoSku, codigoPaquete) {
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
                            var uiSpanDividirOrdenDeVentaCantidadPrincipal = $("#UiSpanDividirOrdenDeVentaCantidadPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                            uiSpanDividirOrdenDeVentaCantidadPrincipal.text(skuOrdenPrincipal.skuUnidadMinima.qty);
                            uiSpanDividirOrdenDeVentaCantidadPrincipal = null;
                            var uiSpanDividirOrdenDeVentaTotalPrincipal = $("#UiSpanDividirOrdenDeVentaTotalPrincipal-" + skuOrdenPrincipal.sku + "-" + skuOrdenPrincipal.codePackUnit);
                            uiSpanDividirOrdenDeVentaTotalPrincipal.text("Q" + format_number(skuOrdenPrincipal.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                            uiSpanDividirOrdenDeVentaTotalPrincipal = null;
                            break;
                        }
                    }
                    if (!existeSkuEnOrdenPrincipal) {
                        var skuParaAgregar = JSON.parse(JSON.stringify(skuOrdenRestante));
                        skuParaAgregar.skuUnidadMinima.qty = 1;
                        skuParaAgregar.skuUnidadMinima.total = skuParaAgregar.skuUnidadMinima.cost;
                        this.listaSkuOrdenDeVentaPrincipal.push(skuParaAgregar);
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
                    }
                    else {
                        var uiSpanDividirOrdenDeVentaCantidadRestante = $("#UiSpanDividirOrdenDeVentaCantidadRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                        uiSpanDividirOrdenDeVentaCantidadRestante.text(skuOrdenRestante.skuUnidadMinima.qty);
                        uiSpanDividirOrdenDeVentaCantidadRestante = null;
                        var uiSpanDividirOrdenDeVentaTotalRestante = $("#UiSpanDividirOrdenDeVentaTotalRestante-" + skuOrdenRestante.sku + "-" + skuOrdenRestante.codePackUnit);
                        uiSpanDividirOrdenDeVentaTotalRestante.text("Q" + format_number(skuOrdenRestante.skuUnidadMinima.total, this.configuracionDecimales.defaultDisplayDecimals));
                        uiSpanDividirOrdenDeVentaTotalRestante = null;
                    }
                    break;
                }
            }
        }
        catch (ex) {
            notify("Quitar sku orde restante: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.validarSiEsUltimoSku = function () {
        try {
            if (this.listaSkuOrdenDeVentaPrincipal.length === 1) {
                if (this.listaSkuOrdenDeVentaPrincipal[0].skuUnidadMinima.qty === 1) {
                    notify("La orden de venta principal no puede quedar vacia.");
                    return false;
                }
            }
            return true;
        }
        catch (ex) {
            notify("Error al validar si es ultimo sku: " + ex.message);
            return false;
        }
    };
    DividirOrdenDeVentaControlador.prototype.usuarioDeseaAceptarOrdenDeVenta = function () {
        var _this = this;
        try {
            if (this.listaSkuOrdenDeVentaPrincipal.length >= 1) {
                navigator.notification.confirm("Desea finalizar el documento?", function (buttonIndex) {
                    if (buttonIndex === 2) {
                        my_dialog("Creando orden de venta", "Espere...", "open");
                        _this.prepararOrdenDeVenta(_this.listaSkuOrdenDeVentaPrincipal, 0, 0, function (indiceListaCf) {
                            if (_this.listaSkuOrdenDeVentaRestante.length >= 1) {
                                _this.separandoOrdenesDeVenta(function () {
                                    _this.recorrerOrdenesCfParaConvertirloAUnidadMayor(0, function () {
                                        _this.seguirConlaOrdenDeVentaAceptada();
                                    });
                                });
                            }
                            else {
                                _this.seguirConlaOrdenDeVentaAceptada();
                            }
                        });
                    }
                }, "Sonda® " + SondaVersion, 'No,Si');
            }
            else {
                notify("La orden de venta principal esta vacia.");
                var uiTotalPreVenta = $("#UiTotalPreVenta");
                uiTotalPreVenta.focus();
                uiTotalPreVenta = null;
            }
        }
        catch (ex) {
            notify("Error al aceptar la orden de venta: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.seguirConlaOrdenDeVentaAceptada = function () {
        var _this = this;
        try {
            ObtenerCantidadDeSecuenciasDisponibles("SALES_ORDER", function (docType, docFrom, docTo, serie, currentDoc, available) {
                var cantidadDeSecuenciasNecesarias = 1;
                cantidadDeSecuenciasNecesarias += _this.listaDeOrdnesDeVEntaCf.length;
                if (cantidadDeSecuenciasNecesarias <= available) {
                    _this.publicarOrdenesDeVentaPorDivision(_this.listaSkuOrdenDeVentaPrincipal, _this.listaDeOrdnesDeVEntaCf);
                    my_dialog("", "", "close");
                    $.mobile.changePage("#UiPageRepPreSale", {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                }
                else {
                    notify("Secuencias insuficientes. " + "(Necesarias : " + cantidadDeSecuenciasNecesarias + ") (Disponibles: " + available + ")");
                }
            }, function (errorMensaje) {
                notify(errorMensaje);
            });
        }
        catch (ex) {
            notify("Error al seguir la orden de venta aceptada: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.prepararOrdenDeVenta = function (listaSku, indiceDeListaSku, indiceListaCf, callback) {
        var _this = this;
        try {
            if ((listaSku.length) > indiceDeListaSku) {
                this.paqueteServicio.obtenerDenominacionPorSku(listaSku[indiceDeListaSku], indiceDeListaSku, function (listaPaquete, indiceDeListaSku) {
                    listaPaquete.reverse();
                    var i = 0;
                    for (i = 0; i < listaPaquete.length; i++) {
                        if (listaSku[indiceDeListaSku].codePackUnit === listaPaquete[i].codePackUnit) {
                            listaPaquete.splice(i + 1, listaPaquete.length);
                            listaPaquete[i].qty = 0;
                            break;
                        }
                        else {
                            listaPaquete[i].qty = 0;
                        }
                    }
                    for (i = 0; i < listaPaquete.length; i++) {
                        if (listaSku[indiceDeListaSku].skuUnidadMinima.codePackUnit === listaPaquete[i].codePackUnit) {
                            listaPaquete[i].qty = listaSku[indiceDeListaSku].skuUnidadMinima.qty;
                            break;
                        }
                    }
                    _this.calcularDenominacion(0, listaPaquete, listaSku, indiceDeListaSku, function (paquetes, indiceDeListaSku) {
                        listaSku[indiceDeListaSku].qty = paquetes[paquetes.length - 1].qty;
                        listaSku[indiceDeListaSku].total = listaSku[indiceDeListaSku].skuUnidadMinima.total;
                        _this.prepararOrdenDeVenta(listaSku, indiceDeListaSku + 1, indiceListaCf, function () {
                            callback(indiceListaCf);
                        });
                    });
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }
            else {
                callback(indiceListaCf);
            }
        }
        catch (ex) {
            notify("Error al preparar las ordenes de venta: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.obtenerCocienteYResiduo = function (cantidad, paqueteConversion, paquetes, index, callback, callbackError) {
        try {
            var residuo = 0;
            var cociente = 0;
            if (paqueteConversion.conversionFactor >= 1) {
                cociente = (cantidad) / paqueteConversion.conversionFactor;
            }
            else {
                cociente = (cantidad) / (1 / paqueteConversion.conversionFactor);
            }
            callback(cociente, residuo, paqueteConversion, paquetes, index);
        }
        catch (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        }
    };
    DividirOrdenDeVentaControlador.prototype.calcularDenominacion = function (indicePaquetes, paquetes, listaSku, indiceDeListaSku, callback) {
        var _this = this;
        if (indicePaquetes < (paquetes.length - 1)) {
            this.paqueteServicio.obtenerConversionDePaquete(listaSku[indiceDeListaSku], paquetes, indicePaquetes, this.configuracionDecimales, function (conversionDePaquete, paquetesN1, index) {
                _this.obtenerCocienteYResiduo(paquetesN1[index].qty, conversionDePaquete, paquetesN1, index, function (cociente, residuo, paqueteConversion, paquetesN2, indexN1) {
                    paquetesN2[indexN1].qty = residuo;
                    paquetesN2[indexN1 + 1].qty += cociente;
                    _this.calcularDenominacion(indexN1 + 1, paquetesN2, listaSku, indiceDeListaSku, function () {
                        callback(paquetes, indiceDeListaSku);
                    });
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }
        else {
            callback(paquetes, indiceDeListaSku);
        }
    };
    DividirOrdenDeVentaControlador.prototype.separandoOrdenesDeVenta = function (callback) {
        try {
            this.listaDeOrdnesDeVEntaCf = [];
            var sku = new Sku();
            var total = 0;
            var lista = [];
            for (var i = 0; i < this.listaSkuOrdenDeVentaRestante.length; i++) {
                sku = JSON.parse(JSON.stringify(this.listaSkuOrdenDeVentaRestante[i]));
                if ((total + sku.skuUnidadMinima.total) <= MaximoCF) {
                    lista.push(sku);
                    total += sku.skuUnidadMinima.total;
                }
                else {
                    var skuAgregar = new Sku();
                    skuAgregar.qty = 0;
                    for (var j = 0; j < sku.skuUnidadMinima.qty; j++) {
                        if ((total + sku.skuUnidadMinima.cost) <= MaximoCF) {
                            if (j === 0) {
                                skuAgregar = JSON.parse(JSON.stringify(sku));
                                skuAgregar.skuUnidadMinima.qty = 1;
                                skuAgregar.skuUnidadMinima.total = sku.skuUnidadMinima.cost;
                            }
                            else {
                                skuAgregar.skuUnidadMinima.qty += 1;
                                skuAgregar.skuUnidadMinima.total = (sku.skuUnidadMinima.cost * skuAgregar.skuUnidadMinima.qty);
                            }
                        }
                        else {
                            if (skuAgregar.qty !== 0) {
                                lista.push(JSON.parse(JSON.stringify(skuAgregar)));
                                this.listaDeOrdnesDeVEntaCf.push(JSON.parse(JSON.stringify(lista)));
                            }
                            skuAgregar = JSON.parse(JSON.stringify(sku));
                            skuAgregar.skuUnidadMinima.qty = 1;
                            skuAgregar.skuUnidadMinima.total = sku.skuUnidadMinima.cost;
                            lista = [];
                            total = 0;
                        }
                        total += sku.skuUnidadMinima.cost;
                    }
                    if (skuAgregar.qty !== 0) {
                        lista.push(JSON.parse(JSON.stringify(skuAgregar)));
                    }
                }
            }
            this.listaDeOrdnesDeVEntaCf.push(JSON.parse(JSON.stringify(lista)));
            callback();
        }
        catch (ex) {
            notify("Error al separa la orden de venta: " + ex.message);
        }
    };
    DividirOrdenDeVentaControlador.prototype.recorrerOrdenesCfParaConvertirloAUnidadMayor = function (indiceOrdenesCf, callback) {
        var _this = this;
        if (indiceOrdenesCf <= (this.listaDeOrdnesDeVEntaCf.length - 1)) {
            this.prepararOrdenDeVenta(this.listaDeOrdnesDeVEntaCf[indiceOrdenesCf], 0, indiceOrdenesCf, function (indiceOrdenesCf) {
                _this.recorrerOrdenesCfParaConvertirloAUnidadMayor(indiceOrdenesCf + 1, function () {
                    callback();
                });
            });
        }
        else {
            callback();
        }
    };
    DividirOrdenDeVentaControlador.prototype.publicarOrdenesDeVentaPorDivision = function (listaPrincipal, listaCf) {
        var msg = new OrdenesDeVentaDevidosMensaje(this);
        msg.listaSkuOrdenDeVentaPrincipal = listaPrincipal;
        msg.listaDeOrdnesDeVEntaCf = listaCf;
        this.mensajero.publish(msg, getType(OrdenesDeVentaDevidosMensaje));
    };
    return DividirOrdenDeVentaControlador;
}());
//# sourceMappingURL=DividirOrdenDeVentaControlador.js.map