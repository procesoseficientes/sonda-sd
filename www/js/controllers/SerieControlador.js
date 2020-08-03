var SerieControlador = (function() {
    function SerieControlador() {
        this.serieServicio = new SerieServicio();
        this.sku = "";
        this.skuName = "";
        this.precioSku = 0;
        this.series = new Array();
    }

    SerieControlador.prototype.delegarSerieControlador = function() {

        var _this = this;

        $("#series_page").on("pageshow", function() {
            my_dialog("Espere", "Procesando Series...", "open");
            $("#UiBtnSeleccionarTodasLasSeries").prop("checked", false).checkboxradio("refresh");
            var labelSku = $("#UiLblSkuSerie");
            SerieControlador.sku = labelSku.attr("SKU");
            SerieControlador.skuName = labelSku.attr("SKU_NAME");
            SerieControlador.precioSku = parseFloat(labelSku.attr("SKU_PRICE"));

            labelSku.text(SerieControlador.sku + " " + SerieControlador.skuName);
            labelSku = null;
            
            _this.CargarSeries(SerieControlador.sku);
            my_dialog("", "", "close");
        });

        $("#UiBtnLimpiarSeleccionDeSeries").on("click", function() {
            my_dialog("Espere", "Restableciendo Series...", "open");
            $("#UiBtnSeleccionarTodasLasSeries").prop("checked", false).checkboxradio("refresh");
            var este = SerieControlador;
            var serieControlador = new SerieControlador();
            serieControlador.UsuarioDeseaSeleccionarTodasLasSeries(este.series, SerieUtilizada.No);
            serieControlador = null;
            my_dialog("", "", "close");
        });

        $("#UiBtnAceptarSeleccionDeSeries").on("click", function () {
            my_dialog("Espere", "Procesando Series...", "open");
                _this.UsuarioDeseaAceptarCantidadDeSeries();
        });

        $("#UiBtnCancelarSeleccionDeSeries").on("click", function () {
            _this.UsuarioDeseaCancelarIngresoDeSeries();
        });

        $("#UiBtnSeleccionarTodasLasSeries").on("change", function (e) {
            var este = SerieControlador;
            var serieControlador = new SerieControlador();
            var status = e.target.checked ? SerieUtilizada.Si : SerieUtilizada.No;
            serieControlador.UsuarioDeseaSeleccionarTodasLasSeries(este.series, status);
            status = null;
            serieControlador = null;
            este = null;
        });

        $("#series_page").on("click", "#series_listview_panel a", function (e) {
            var serie = e.currentTarget.attributes["id"].nodeValue.split("_")[1];
            var objetoSerie = $("#IN_" + serie);

            if (objetoSerie.attr("STATUS") === "0" || objetoSerie.attr("STATUS") === 0) {
                objetoSerie.attr("STATUS", 1);
                objetoSerie.css("background-color", "greenyellow");
            } else {
                objetoSerie.attr("STATUS", 0);
                objetoSerie.css("background-color", "azure");
            }
            _this.UsuarioSeleccionoSerie(serie);
            objetoSerie = null;
        });
    };

    SerieControlador.prototype.CrearListadoDeSeriesPorSku = function (sku) {
        var _this = this;
        try {
            _this.serieServicio.ObtenerSeriesPorSku(sku, function (series) {
                SerieControlador.series = series;
                var objetoListaSeries = $("#series_listview_panel");
                objetoListaSeries.children().remove("li");
                for (var i = 0; i < series.length; i++) {
                    var serie = series[i];
                    var li = "";
                    li = "<li>";
                    li += "<a href=" + "#" + " id='" + "IN_" + series[i].SERIE + "' STATUS='0'>";
                    li += "<p>";
                    li += "<span class=" + "small-roboto" + "><strong>" + series[i].SERIE + "</strong><br>";
                    li += "<span style='color:blue; width: 80%' class='small-roboto'>IMEI: " + ((serie.ICC === null || serie.ICC === undefined || serie.ICC === "") ? "..." : serie.icc) +
                        " </span> &nbsp; <span style='color:blue; width: 80%' class='small-roboto'>CELULAR: " + ((serie.PHONE === null || serie.PHONE === undefined || serie.PHONE === "") ? "..." : serie.PHONE) + " </span>";
                    li += "</p>";
                    li += "</a>";
                    li += "</li>";
                    objetoListaSeries.append(li);
                    objetoListaSeries.listview("refresh");
                }
                my_dialog("", "", "close");
                objetoListaSeries = null;
                _this.ActualizarCantidadDeSeriesSeleccionadas();
                }, function(error) {
                my_dialog("", "", "close");
                notify(error);
            });
        } catch (e) {
            my_dialog("", "", "close");
            notify(e.message);
        } 
    };

    SerieControlador.prototype.CargarSeries = function (sku) {
        var _this = this;
        _this.CrearListadoDeSeriesPorSku(sku);
    };

    SerieControlador.prototype.UsuarioSeleccionoSerie = function (serie) {
        var _this = this;
        try {
            for (var i = 0; i < SerieControlador.series.length; i++) {
                if (SerieControlador.series[i].SERIE === serie) {
                    if (SerieControlador.series[i].STATUS === SerieUtilizada.Si) {
                        SerieControlador.series[i].STATUS = SerieUtilizada.No;
                    } else if (SerieControlador.series[i].STATUS === SerieUtilizada.No) {
                        SerieControlador.series[i].STATUS = SerieUtilizada.Si;
                    }
                    break;
                }
            }
            _this.ActualizarCantidadDeSeriesSeleccionadas();
        } catch (e) {
            console.log("Error al actualizar el estado de la serie seleccionada debido a: " + e.message);
            notify(e.message);
        } 
    };

    SerieControlador.prototype.UsuarioDeseaAceptarCantidadDeSeries = function () {
        var _this = this;
        var serieControlador = SerieControlador;
        try {
            var listaSeries = [];
            $("#series_listview_panel a").each(function (ev, ob, set) {
                if (ob.attributes["STATUS"].nodeValue === "1" || ob.attributes["STATUS"].nodeValue === 1) {
                    listaSeries.push(ob.attributes["id"].nodeValue.split("_")[1]);
                }
            });

            if (listaSeries.length > 0) {
                _this.serieServicio.AgregarSkusAlDetalleDeFactura(
                    serieControlador.sku, serieControlador.skuName, listaSeries.length, serieControlador.precioSku, listaSeries, function(skuReturn) {
                        _this.serieServicio.ActualizarEstadoDeSerie(
                            skuReturn, listaSeries, SerieUtilizada.Si, function () {
                                my_dialog("", "", "close");
                                window.vieneDeIngresoCantidad = false;
                                _this.MostrarPantallaAnterior("#pos_skus_page");
                            }, function (error) {
                                my_dialog("", "", "close");
                                notify(error);
                            });
                    }, function (error) {
                        my_dialog("", "", "close");
                        notify(error);
                    });
            } else {
                my_dialog("", "", "close");
                notify("Debe seleccionar al menos una serie...");
            }
        } catch (e) {
            my_dialog("", "", "close");
            console.log("No se pudieron procesar las series del sku debido a: " + e.message);
            notify(e.messgae);
        } 
    };

    SerieControlador.prototype.MostrarPantallaAnterior = function (pantalla) {
        $.mobile.changePage(pantalla, {
            transition: "flow",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };

    SerieControlador.prototype.UsuarioDeseaCancelarIngresoDeSeries = function() {
        var _this = this;
        navigator.notification.confirm("Desea Cancelar el Ingreso de Series?",
            function(opcion) {
                if (opcion === 2) {
                    _this.MostrarPantallaAnterior("#skus_list_page");
                }
            }, "Sonda® SD " + SondaVersion, ["No", "Si"]);
    };

    SerieControlador.prototype.ActualizarCantidadDeSeriesSeleccionadas = function() {
        var _this = SerieControlador;
        var seriesSeleccionadas = 0;
        var labelSeriesQty = $("#UiLblSeriesQty");
        for (var i = 0; i < _this.series.length; i++) {
            if (_this.series[i].STATUS === SerieUtilizada.Si) {
                seriesSeleccionadas++;
            }
        }
        labelSeriesQty.text(seriesSeleccionadas);
        seriesSeleccionadas = null;
        labelSeriesQty = null;
    };

    SerieControlador.prototype.MostrarPantallaDeSeries = function () {
        $.mobile.changePage("#series_page", {
            transition: "flow",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    };

    SerieControlador.prototype.UsuarioDeseaSeleccionarTodasLasSeries = function(series, estado) {
        var _this = this;
        try {
            var status = estado === SerieUtilizada.Si ? 1 : 0;
            for (var i = 0; i < series.length; i++) {
                var serie = series[i];
                var objetoInputSerie = $("#IN_" + serie.SERIE);
                objetoInputSerie.attr('STATUS', status);

                if (status === 1) {
                    objetoInputSerie.css("background-color", "greenyellow");
                } else if (status === 0) {
                    objetoInputSerie.css("background-color", "azure");
                }

                SerieControlador.series[i].STATUS = estado;
                objetoInputSerie = null;
            }
            _this.ActualizarCantidadDeSeriesSeleccionadas();
            my_dialog("", "", "close");
        } catch (e) {
            notify(e.message);
        } 
    }
    
    return SerieControlador;
}());