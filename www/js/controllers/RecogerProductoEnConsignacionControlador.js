
var CantidadSkuARecogerProductoEnConsignacionControlador = {
    delegarIngresoDeCantidadSkuARecogerControlador: function () {
        $("#UiPageCollectQtySkuFromConsignment").on("pageshow", function () {
            var txtCantidadARecoger = $("#UiTxtQtySkuForReCollect");
            var liSeriesParaRecoger = $("#UiSeriesListForSkuToReCollect");

            document.getElementById("lblSkuCollectId").innerText = (CantidadSkuARecogerProductoEnConsignacionControlador.CodeSku + " " + CantidadSkuARecogerProductoEnConsignacionControlador.SkuName);
            if (CantidadSkuARecogerProductoEnConsignacionControlador.handleSerial === 1) {
                txtCantidadARecoger.css("display", "none");
                liSeriesParaRecoger.css("display", "block");

                PagoConsignacionesServicio.ObtenerSeriesPorSkuEnconsignacion(
                    CantidadSkuARecogerProductoEnConsignacionControlador.CodeSku,
                    CantidadSkuARecogerProductoEnConsignacionControlador.ConsignmentId,
                    function(series) {
                        if (series.leng === 0) {
                            notify("No hay series disponibles...");
                        } else {
                            CantidadSkuARecogerProductoEnConsignacionControlador.MostrarListadoDeSeriesDisponiblesParaRecoger(
                                series, function() {
                                    CantidadSkuARecogerProductoEnConsignacionControlador.ActualizarCantidadDeSeriesARecogerSeleccionadas();
                                }, function(error) {
                                    notify(error);
                                });
                        }
                    }, function(error) {
                        notify(error);
                    });
            } else {
                txtCantidadARecoger.css("display", "block");
                liSeriesParaRecoger.css("display", "none");

                document.getElementById("txtSkuQtyCollect").value = (CantidadSkuARecogerProductoEnConsignacionControlador.SkuQty);
                document.getElementById("txtSkuQtyCollect").focus();
            }
        });
        $("#UiBtnCancelarSkuQtyCollect").on("click", function () {
            CantidadSkuARecogerProductoEnConsignacionControlador.VolverAPantallaAnterior();
        });

        $("#UiBtnAceptarSkuQtyCollect").on("click", function () {
            CantidadSkuARecogerProductoEnConsignacionControlador.ValidarCantidadIngresada();
        });

        $("#btnTakePicCollect").on("click", function () {
            CantidadSkuARecogerProductoEnConsignacionControlador.TomarFoto();
        });

        $("#UiBtnAceptarDevolucion").on("click", function() {
            EnviarData();
            CantidadSkuARecogerProductoEnConsignacionControlador.MostrarPantallaDeMenuPrincipal();
        });

        $("#UiBtnImprimirDocumentoDeDevolucion").on("click", function () {
            RecogerProductoEnConsignacionServicio.ImprimirComprobanteDeDevolucionDesdeConsignacion();
        });

        $("#UiPageCollectQtySkuFromConsignment").on("click", "#UiListaSeriesParaSkuARecoger a", function(e) {
            try {
                var serieARecoger = e.currentTarget.attributes["id"].nodeValue.split("_")[1];
                var objetoSerie = $("#RE_" + serieARecoger);

                if (objetoSerie.attr("STATUS") === undefined) {
                    return;
                }
                if (objetoSerie.attr("STATUS") === "0" || objetoSerie.attr("STATUS") === 0) {
                    objetoSerie.attr("STATUS", 1);
                    objetoSerie.css("background-color", "greenyellow");
                    CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas++;
                } else {
                    objetoSerie.attr("STATUS", 0);
                    objetoSerie.css("background-color", "azure");
                    CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas--;
                }

                CantidadSkuARecogerProductoEnConsignacionControlador.ActualizarCantidadDeSeriesARecogerSeleccionadas();
            } catch (ex) {
                notify(ex.message);
            } 
        });

        $("#UiBotonSeleccionarTodoParaRecoger").on("click", function() {
            CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas = 0;

            $("#UiListaSeriesParaSkuARecoger a").each(function (e, object, res) {
                var objetoSerie = $("#" + object.id);
                objetoSerie.attr("STATUS", 1);
                objetoSerie.css("background-color", "greenyellow");
                CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas++;
            });

            CantidadSkuARecogerProductoEnConsignacionControlador.ActualizarCantidadDeSeriesARecogerSeleccionadas();
        });

        $("#UiBotonLimpiarSeleccionParaRecoger").on("click", function () {
            $("#UiListaSeriesParaSkuARecoger a").each(function (e, object, res) {
                var objetoSerie = $("#" + object.id);
                objetoSerie.attr("STATUS", 0);
                objetoSerie.css("background-color", "azure");
            });
            CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas = 0;
            CantidadSkuARecogerProductoEnConsignacionControlador.ActualizarCantidadDeSeriesARecogerSeleccionadas();
        });
    }
    ,
    MostrarPantallaDeMenuPrincipal: function() {
        $.mobile.changePage("#menu_page", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
    ,
    MostrarPantallaParaRecogerSkuEnConsignacion: function() {
        $.mobile.changePage("#UiPageCollectQtySkuFromConsignment", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
    ,
    TomarFoto: function () {
        try {
            if (CantidadSkuARecogerProductoEnConsignacionControlador.NumeroDeFoto > 3) {
                notify("Llego al maximo de fotos que puede tomar");
            }
            else
            navigator.camera.getPicture
            (
                function (imageURI) {

                    switch (CantidadSkuARecogerProductoEnConsignacionControlador.NumeroDeFoto) {
                        case 1:
                            document.getElementById("picture1Collect").value = "data:image/jpeg;base64," + imageURI;
                            break;
                        case 2:
                            document.getElementById("picture2Collect").value = "data:image/jpeg;base64," + imageURI;
                            break;
                        case 3:
                            document.getElementById("picture3Collect").value = "data:image/jpeg;base64," + imageURI;
                            break;
                    };

                    CantidadSkuARecogerProductoEnConsignacionControlador.NumeroDeFoto = CantidadSkuARecogerProductoEnConsignacionControlador.NumeroDeFoto + 1;
                    if (CantidadSkuARecogerProductoEnConsignacionControlador.NumeroDeFoto === 4) {
                        $("#btnTakePicCollect").text("Tomar Foto");
                    }
                    else {
                        $("#btnTakePicCollect").text("Tomar Foto " + CantidadSkuARecogerProductoEnConsignacionControlador.NumeroDeFoto.toString());
                    }   
                },
                function (message) {
                    //notify("ERROR," + message);
                },
                {
                    quality: 90,
                    targetWidth: 350,
                    targetHeight: 350,
                    saveToPhotoAlbum: false,
                    sourceType: navigator.camera.PictureSourceType.CAMERA,
                    correctOrientation: true,
                    destinationType: Camera.DestinationType.DATA_URL
                }
            );
        } catch (e) { notify("take_picture: " + e.message); }

    }
    ,
    ValidarCantidadIngresada: function () {
        if (CantidadSkuARecogerProductoEnConsignacionControlador.handleSerial === 1) {

            if (CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas === 0) {
                notify("Debe sellecionar, por lo menos, una serie...");
            } else {
                var listaSeriesARecoger = [];
                $("#UiListaSeriesParaSkuARecoger a").each(function(ev,ob,res) {
                    if (ob.attributes["STATUS"].nodeValue === "1" || ob.attributes["STATUS"].nodeValue === 1) {
                        listaSeriesARecoger.push(ob.attributes["id"].nodeValue.split("_")[1]);
                    }
                });
                var statusSku = document.getElementById("UiSelectStatusSku").value;
                statusSku = parseInt(statusSku);
                CantidadSkuARecogerProductoEnConsignacionControlador.EstadoSku = statusSku;
                statusSku = null;
                for (var i = 0; i < listaSeriesARecoger.length; i++) {
                    PagoConsignacionesServicio.MarcarLineaDeConsignacion(
                        CantidadSkuARecogerProductoEnConsignacionControlador.ConsignmentId
                        , CantidadSkuARecogerProductoEnConsignacionControlador.CodeSku
                        , parseInt(1)
                        , CantidadSkuARecogerProductoEnConsignacionControlador.OpcionDePagoSeleccionada
                        , CantidadSkuARecogerProductoEnConsignacionControlador.handleSerial,
                        listaSeriesARecoger[i], function(indice) {
                            if (indice === listaSeriesARecoger.length -1) {
                                CantidadSkuARecogerProductoEnConsignacionControlador.VolverAPantallaAnterior();
                                CantidadSkuARecogerProductoEnConsignacionControlador.LimpiarDatos();
                                PagoConsignacionesControlador.CalcularPagoCash();
                            }
                        }, function(error) {
                            notify(error);
                        }, i);
                }
            }

        } else {
            
            var cantidadARecoger = document.getElementById("txtSkuQtyCollect").value;

            if (cantidadARecoger === "") {
                notify("Lo sentimos, la cantidad a Recoger no puede estar vacía");
                cantidadARecoger.focus();
            } else if (parseFloat(cantidadARecoger) > parseFloat(CantidadSkuARecogerProductoEnConsignacionControlador.SkuQty)) {
                notify("La cantidad ingresada supera la cantidad consignada, por favor verifique y vuelva a intentar.");
                cantidadARecoger.focus();
            } else if (parseFloat(cantidadARecoger) < 0 || parseFloat(cantidadARecoger) === 0) {
                notify("Por favor, ingrese una cantidad mayor a Cero.");
                cantidadARecoger.focus();
            } else {
                var status = document.getElementById("UiSelectStatusSku").value;
                status = parseInt(status);
                CantidadSkuARecogerProductoEnConsignacionControlador.EstadoSku = status;
                status = null;

                PagoConsignacionesServicio.MarcarLineaDeConsignacion(
                    CantidadSkuARecogerProductoEnConsignacionControlador.ConsignmentId
                    , CantidadSkuARecogerProductoEnConsignacionControlador.CodeSku
                    , parseInt(cantidadARecoger)
                    , CantidadSkuARecogerProductoEnConsignacionControlador.OpcionDePagoSeleccionada
                    , CantidadSkuARecogerProductoEnConsignacionControlador.handleSerial
                    , "0"
                    , function () {
                        CantidadSkuARecogerProductoEnConsignacionControlador.VolverAPantallaAnterior();
                        PagoConsignacionesControlador.CalcularPagoCash();
                    }
                    , function (error) {
                        notify(error);
                    });
            }
        }
    }
    ,
    VolverAPantallaAnterior: function () {
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
    LimpiarDatos: function () {
        CantidadSkuARecogerProductoEnConsignacionControlador.NumeroDeFoto = 1;
        CantidadSkuARecogerProductoEnConsignacionControlador.SkuQty = 0;
        CantidadSkuARecogerProductoEnConsignacionControlador.CodeSku = "";
        CantidadSkuARecogerProductoEnConsignacionControlador.SkuName = "";
        CantidadSkuARecogerProductoEnConsignacionControlador.ConsignmentId = null;
        CantidadSkuARecogerProductoEnConsignacionControlador.EstadoSku = 1;
        CantidadSkuARecogerProductoEnConsignacionControlador.SkuPrice = 0;
        CantidadSkuARecogerProductoEnConsignacionControlador.handleSerial = 0;
        CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas = 0;
    }
    ,
    MostrarListadoDeSeriesDisponiblesParaRecoger: function(series,callBack,errorCallBack) {
        try {
            var objetoLista = $("#UiListaSeriesParaSkuARecoger");
            objetoLista.children().remove("li");

            for (var i = 0; i < series.length; i++) {
                var li = "";
                li = "<li>";
                li += "<a href=" + "#" + " id='" + "RE_"+series[i].SERIAL_NUMBER + "' STATUS='0'>";
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
    },
    NumeroDeFoto: 1
    ,
    SkuQty: 0
    ,
    CodeSku: ""
    ,
    SkuName: ""
    ,
    ConsignmentId: null
    ,
    OpcionDePagoSeleccionada: ""
    ,
    EstadoSku: 1
    ,
    SkuPrice: 0
    ,
    UltimoDocumentoDeRecoleccion: null
    ,
    EsReimpresion: 0
    ,
    handleSerial: 0
    ,
    cantidadSeriesARecogerSeleccionadas: 0
    ,
    ActualizarCantidadDeSeriesARecogerSeleccionadas: function() {
        var objetoCantidadDeSeriesARecoger = $("#UiQtySelectedSeriesForRecollect");
        objetoCantidadDeSeriesARecoger.text(CantidadSkuARecogerProductoEnConsignacionControlador.cantidadSeriesARecogerSeleccionadas);
        objetoCantidadDeSeriesARecoger = null;
    }
}