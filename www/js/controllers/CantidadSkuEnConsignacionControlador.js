var CantidadSkuEnConsignacionControlador = {
    delegarIngresoDeCantidadSkuEnConsignacionControlador: function () {
        $("#UiInsertQtySkuConsignmnetPage").on("pageshow", function () {
            var listaSeries = $("#UiSeiresListForSku");
            var textCantidad = $("#UiTxtQtyConsignedForProcess");
            var cantidadConsignada = $("#UiLblQtyAvailableSkuconsigned");
          
            document.getElementById("lblSkuId").innerText = (CantidadSkuEnConsignacionControlador.CodeSku + " " + CantidadSkuEnConsignacionControlador.SkuName);
            if (CantidadSkuEnConsignacionControlador.handleSerial === 1) {
                textCantidad.css("display", "none");
                cantidadConsignada.css("display", "none");
                listaSeries.css("display", "block");
                PagoConsignacionesServicio.ObtenerSeriesPorSkuEnconsignacion(
                    CantidadSkuEnConsignacionControlador.CodeSku,
                    CantidadSkuEnConsignacionControlador.ConsignacionId,
                    function(series) {
                        if (series.length === 0) {
                            notify("No hay series disponibles...");
                        } else {
                            CantidadSkuEnConsignacionControlador.MostrarListadoDeSeriesPorSkuConsignado(
                                series, function () {
                                    CantidadSkuEnConsignacionControlador.ActualizarCantidadDeSeriesSeleccionadas();
                                    $("#UiContainerInfoSkuConsigned").listview("refresh");
                                }, function(error) {
                                    notify(error);
                                });
                        }
                    }, function(error) {
                        notify(error);
                    });
            } else {
                textCantidad.css("display", "block");
                cantidadConsignada.css("display", "block");
                listaSeries.css("display", "none");
                document.getElementById("lblQtySkuConsignment").innerText = CantidadSkuEnConsignacionControlador.SkuQty;
                document.getElementById("txtSkuQty").value = CantidadSkuEnConsignacionControlador.SkuQty;
                document.getElementById("txtSkuQty").focus();
            }

            textCantidad = null;
            cantidadConsignada = null;
            listaSeries = null;
        });
        $("#UiBtnCancelarSkuQty").on("click", function () {
            CantidadSkuEnConsignacionControlador.VolverAPantallaAnterior();
            CantidadSkuEnConsignacionControlador.LimpiarVariablesLocales();
        });

        $("#UiBtnAceptarSkuQty").on("click", function () {
            CantidadSkuEnConsignacionControlador.ValidarCantidadIngresada();
        });

        $("#UiInsertQtySkuConsignmnetPage").on("click", "#UiListaSeriesParaSku a", function (e) {
            try {
                var serie = e.currentTarget.attributes["id"].nodeValue;
                var objetoSerie = $("#" + serie);
                if (objetoSerie.attr("STATUS") === undefined) {
                    return; 
                }
                if (objetoSerie.attr("STATUS") === "0" || objetoSerie.attr("STATUS") === 0) {
                    objetoSerie.attr("STATUS",1);
                    objetoSerie.css("background-color", "greenyellow");
                    CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas++;
                } else {
                    objetoSerie.attr("STATUS",0);
                    objetoSerie.css("background-color", "azure");
                    CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas--;
                }
                CantidadSkuEnConsignacionControlador.ActualizarCantidadDeSeriesSeleccionadas();
                objetoSerie = null;
            } catch (ex) {
                notify(ex.message);
            } 
        });

        $("#UiBotonSeleccionarTodoReconsignar").on("click", function () {
            CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas = 0;
            $('#UiListaSeriesParaSku a').each(function (e, object, res) {
                
                var objetoSerie = $("#" + object.id);
                objetoSerie.attr("STATUS", 1);
                objetoSerie.css("background-color", "greenyellow");
                CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas++;
            });
            
            CantidadSkuEnConsignacionControlador.ActualizarCantidadDeSeriesSeleccionadas();
        });

        $("#UiBotonLimpiarSeleccionReconsignar").on("click", function () {
            $("#UiListaSeriesParaSku a").each(function (e, object, res) {
                var objetoSerie = $("#" + object.id);
                    objetoSerie.attr("STATUS", 0);
                    objetoSerie.css("background-color", "azure");
            });
            CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas = 0;
            CantidadSkuEnConsignacionControlador.ActualizarCantidadDeSeriesSeleccionadas();
        });
    }
    ,
    MostrarPantallaDeIngresoDeCantidadDeSku:function() {
        $.mobile.changePage("#UiInsertQtySkuConsignmnetPage", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
    ,
    ValidarCantidadIngresada: function() {
        if (CantidadSkuEnConsignacionControlador.handleSerial === 0) {
            var cantidadAReconsignar = document.getElementById("txtSkuQty").value;

            if (cantidadAReconsignar === "") {
                notify("Lo sentimos, la cantidad no puede estar vacía");
                document.getElementById("txtSkuQty").focus();
            } else if (parseFloat(cantidadAReconsignar) > parseFloat(CantidadSkuEnConsignacionControlador.SkuQty)) {
                notify("La cantidad ingresada supera la disponible en consignacion, por favor verifique y vuelva a intentar.");
                document.getElementById("txtSkuQty").focus();
            } else if (parseFloat(cantidadAReconsignar) < 0 || parseFloat(cantidadAReconsignar) === 0) {
                notify("Por favor, ingrese una cantidad mayor a Cero.");
                document.getElementById("txtSkuQty").focus();
            } else {

                switch (CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada) {
                case ConsignmentPaymentOptions.Pagado:
                    PagoConsignacionesServicio.MarcarLineaDeConsignacion(
                        PagoConsignacionesControlador.ConsignacionId,
                        CantidadSkuEnConsignacionControlador.CodeSku,
                        parseInt(cantidadAReconsignar),
                        CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada,
                        CantidadSkuEnConsignacionControlador.handleSerial,
                        "0",
                        function() {
                            CantidadSkuEnConsignacionControlador.VolverAPantallaAnterior();
                            CantidadSkuEnConsignacionControlador.LimpiarVariablesLocales();
                            PagoConsignacionesControlador.CalcularPagoCash();
                        },
                        function(error) {
                            notify(error);
                        });
                    break;
                case ConsignmentPaymentOptions.ReConsignar:
                    PagoConsignacionesServicio.MarcarLineaDeConsignacion(
                        PagoConsignacionesControlador.ConsignacionId,
                        CantidadSkuEnConsignacionControlador.CodeSku,
                        parseInt(cantidadAReconsignar),
                        CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada,
                        CantidadSkuEnConsignacionControlador.handleSerial,
                        "0",
                        function() {
                            CantidadSkuEnConsignacionControlador.VolverAPantallaAnterior();
                            CantidadSkuEnConsignacionControlador.LimpiarVariablesLocales();
                            PagoConsignacionesControlador.CalcularPagoCash();
                        },
                        function(error) {
                            notify(error);
                        });
                    break;
                }
            }
        } else {
            if (CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas === 0) {
                notify("Debe seleccionar, por lo menos, una serie...");
            } else {
                var listaSeries = [];
                $("#UiListaSeriesParaSku a").each(function(ev, ob, res) {
                    if (ob.attributes["STATUS"].nodeValue === "1" || ob.attributes["STATUS"].nodeValue === 1) {
                        listaSeries.push(ob.attributes["id"].nodeValue);
                    }
                });
                var j;
                switch (CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada) {
                case ConsignmentPaymentOptions.Pagado:
                    for (j = 0; j < listaSeries.length; j++) {
                        PagoConsignacionesServicio.MarcarLineaDeConsignacion(
                            PagoConsignacionesControlador.ConsignacionId,
                            CantidadSkuEnConsignacionControlador.CodeSku,
                            parseInt(1),
                            CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada,
                            CantidadSkuEnConsignacionControlador.handleSerial,
                            listaSeries[j],
                            function (indice) {
                                if (indice === listaSeries.length - 1) {
                                    CantidadSkuEnConsignacionControlador.VolverAPantallaAnterior();
                                    CantidadSkuEnConsignacionControlador.LimpiarVariablesLocales();
                                    PagoConsignacionesControlador.CalcularPagoCash();
                                }
                            },
                            function(error) {
                                notify(error);
                            }, j);
                    }


                    break;
                case ConsignmentPaymentOptions.ReConsignar:
                    for (j = 0; j < listaSeries.length; j++) {
                        PagoConsignacionesServicio.MarcarLineaDeConsignacion(
                            PagoConsignacionesControlador.ConsignacionId,
                            CantidadSkuEnConsignacionControlador.CodeSku,
                            parseInt(1),
                            CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada,
                            CantidadSkuEnConsignacionControlador.handleSerial,
                            listaSeries[j],
                            function (indice) {
                                if (indice === listaSeries.length - 1) {
                                    CantidadSkuEnConsignacionControlador.VolverAPantallaAnterior();
                                    CantidadSkuEnConsignacionControlador.LimpiarVariablesLocales();
                                    PagoConsignacionesControlador.CalcularPagoCash();
                                }
                                
                            },
                            function (error) {
                                notify(error);
                            },j);
                    }
                }
            }
        }
    },
    VolverAPantallaAnterior: function (){
        try {
            $.mobile.changePage("#UiPageConsignmentPayment", {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        } catch (e) {
            notify(e.message);
        }        
    }
    ,
    LimpiarVariablesLocales: function () {
        CantidadSkuEnConsignacionControlador.CodeSku = "";
        CantidadSkuEnConsignacionControlador.SkuName = "";
        CantidadSkuEnConsignacionControlador.SkuQty = 0;
        CantidadSkuEnConsignacionControlador.handleSerial = 0;
        CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas = 0;
        CantidadSkuEnConsignacionControlador.ConsignacionId = 0;
        CantidadSkuEnConsignacionControlador.OpcionDePagoSeleccionada = "";
        CantidadSkuEnConsignacionControlador.SkuPriceForReconsign = null;
    }
    ,
    MostrarListadoDeSeriesPorSkuConsignado: function(series,callBack, errorCallBack) {
        try {
            var objetoLista = $("#UiListaSeriesParaSku");
            objetoLista.children().remove("li");
            for (var i = 0; i < series.length; i++) {
                var li = "";
                li = "<li>";
                li += "<a href=" + "#" + " id='" + series[i].SERIAL_NUMBER + "' STATUS='0'>";
                li += "<p>";
                li += "<span class=" + "small-roboto" + "><strong>Serie: </strong>" + series[i].SERIAL_NUMBER + "";
                li += "</p>";
                li += "</a>";
                li += "</li>";
                objetoLista.append(li);
                objetoLista.listview("refresh");
            }
            callBack();
        } catch (e) {
            errorCallBack(e.message);
        } 
    }
    ,
    CodeSku: ""
    ,
    SkuName: ""
    ,
    SkuQty: 0
    ,
    SkuPriceForReconsign: null
    ,
    OpcionDePagoSeleccionada: ""
    ,
    handleSerial: 0
    ,
    ConsignacionId: 0
    ,
    cantidadSeriesSeleccionadas: 0
    ,
    ActualizarCantidadDeSeriesSeleccionadas: function() {
        var objetoCantidad = $("#UiQtySelectedSeries");
        objetoCantidad.text(CantidadSkuEnConsignacionControlador.cantidadSeriesSeleccionadas);
        objetoCantidad = null;
    }
}