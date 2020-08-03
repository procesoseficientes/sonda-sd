var DocumentosDeDevolucionControlador = {
    DelegarDocumentosDeDevolucionControlador: function() {
        $("#UiBtnViewDevolutiontList").on("click", function() {
            DocumentosDeDevolucionControlador.MostrarPantallaDeDocumentosDeDevolucion();
        });

        $("#UiDevolutionDocumentsPage").on("pageshow", function () {
            document.getElementById("navBarHeader").style.display = "block";
            document.getElementById("navBarDetail").style.display = "none";
            document.getElementById("DivUiListaDocumentosDevolucion").style.display = "block";
            document.getElementById("DivUiListaDetalleDeDocumentoDeDevolucion").style.display = "none";

            RecogerProductoEnConsignacionServicio.ObtenerListadoDeDocumentosDeDevolucion(function(documentosDevolucion) {
                if (documentosDevolucion.length > 0) {
                    DocumentosDeDevolucionControlador.ListadoDeDocumentos = documentosDevolucion;
                }
                DocumentosDeDevolucionControlador.MostrarListadoDeDocumentosDeDevolucion(documentosDevolucion);
            }, function(error) {
                notify(error);
            });
        });

        $("#UiDevolutionDocumentsPage").on("click", "#UiListaDocumentosDevolucion a", function (e) {
            var id = e.currentTarget.attributes["id"].nodeValue;
            var skuCollectedId = e.currentTarget.attributes["SKU_COLLECTED_ID"].nodeValue;

            if (id.toString().indexOf("_") > -1) {
                var idSplit = id.toString().split("_");
                switch (idSplit[0]) {
                    case "DD":
                        document.getElementById("navBarHeader").style.display = "none";
                        document.getElementById("navBarDetail").style.display = "block";
                        document.getElementById("DivUiListaDocumentosDevolucion").style.display = "none";
                        document.getElementById("DivUiListaDetalleDeDocumentoDeDevolucion").style.display = "block";
                        for (var i = 0; i < DocumentosDeDevolucionControlador.ListadoDeDocumentos.length; i++) {
                            var documento = DocumentosDeDevolucionControlador.ListadoDeDocumentos[i];
                            if (parseInt(documento.DOC_NUM) === parseInt(parseInt(idSplit[1]))) {
                                CantidadSkuARecogerProductoEnConsignacionControlador.UltimoDocumentoDeRecoleccion = parseInt(idSplit[1]);
                                DocumentosDeDevolucionControlador.MostrarDetalleDeDocumentosDeDevolucion(parseInt(skuCollectedId));
                                DocumentosDeDevolucionControlador.EstaEnDetalle = true;
                                break;
                            }
                        }
                        break;
                }
            }
        });

        $("#UiBtnVolverDevolution").on("click", function() {
            DocumentosDeDevolucionControlador.VolverAMenu();
        });

        $("#UiBtnRefreshDevolution").on("click", function () {
            RecogerProductoEnConsignacionServicio.ObtenerListadoDeDocumentosDeDevolucion(function (documentosDevolucion) {
                if (documentosDevolucion.length > 0) {
                    DocumentosDeDevolucionControlador.ListadoDeDocumentos = documentosDevolucion;
                }
                DocumentosDeDevolucionControlador.MostrarListadoDeDocumentosDeDevolucion(documentosDevolucion);
            }, function (error) {
                notify(error);
            });
        });

        $("#UiBtnVolverDevolutionDetail").on("click", function () {
            document.getElementById("navBarHeader").style.display = "block";
            document.getElementById("navBarDetail").style.display = "none";

            document.getElementById("DivUiListaDocumentosDevolucion").style.display = "block";
            document.getElementById("DivUiListaDetalleDeDocumentoDeDevolucion").style.display = "none";
            DocumentosDeDevolucionControlador.EstaEnDetalle = false;
        });

        $("#UiBtnPrintDevolutionComplete").on("click", function() {
            RecogerProductoEnConsignacionServicio.ImprimirComprobanteDeDevolucionDesdeConsignacion();
        });
    }
    ,
    VolverAMenu: function() {
        $.mobile.changePage("#menu_page", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
    ,
    MostrarPantallaDeDocumentosDeDevolucion: function() {
        $.mobile.changePage("#UiDevolutionDocumentsPage", {
            transition: "pop",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });
    }
    ,
    MostrarListadoDeDocumentosDeDevolucion: function(documentosDevolucion) {
        var listaDevoluciones = $("#UiListaDocumentosDevolucion");
        listaDevoluciones.children().remove("li");

        for (var i = 0; i < documentosDevolucion.length; i++) {
            var documentoDevolucion = documentosDevolucion[i];
            var li;
            li = "";
            li = "<li data-mini='true' class='ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-arrow-r'>";
            li += "<a id='DH_" + documentoDevolucion.DOC_NUM + "' SKU_COLLECTED_ID='" + documentoDevolucion.SKU_COLLECTED_ID + "'>"; //DONDE DH SIGNIFICA DOCUMENT HEADER
            li += "<span>#" + documentoDevolucion.SKU_COLLECTED_ID + " </span>";
            li += "<p><b> Creado el: </b>" + documentoDevolucion.LAST_UPDATE + " </p>";
            li += "<span class='ui-li-count'><strong>" + currencySymbol + ". " + format_number(documentoDevolucion.TOTAL_AMOUNT, 2) + "</strong> </span>";
            li += "</a>";
            li += "<a href='#' id='DD_" + documentoDevolucion.DOC_NUM + "' SKU_COLLECTED_ID='" + documentoDevolucion.SKU_COLLECTED_ID + "'></a>"; //DONDE DD SIGNIFICA DOCUMENT DETAIL
            li += "</li>";

            listaDevoluciones.append(li);
            listaDevoluciones.listview("refresh");
            documentoDevolucion = null;
        }
    }
    ,
    MostrarDetalleDeDocumentosDeDevolucion: function (documentoId) {
        var document = {
            SKU_COLLECTED_ID: parseInt(documentoId),
            DEVOLUTION_DETAIL: new Array()
        }
        RecogerProductoEnConsignacionServicio.ObtenerDetalleDeDocumentoDeDevolucion(document,null
            , function (documentoCompleto, indice) {
                console.log(indice);
                var objetoLista = $("#ListaDetalleDeDocumentoDeDevolucion");
                objetoLista.children().remove("li");
                for (var i = 0; i < documentoCompleto.DEVOLUTION_DETAIL.length; i++) {
                    var skuDetalle = documentoCompleto.DEVOLUTION_DETAIL[i];
                    var status;
                    if (parseInt(skuDetalle.IS_GOOD_STATE) === 1) {
                        status = "Buen Estado";
                    } else {
                        status = "Mal Estado";
                    }
                    var li = "";
                    li += "<li>";
                    li += '<a href="#" id="' + skuDetalle.CODE_SKU +
                        '" SKU_NAME="' + skuDetalle.SKU_NAME + '>';
                    li += "<span>" + skuDetalle.CODE_SKU + "</span>";
                    li += '<p style="white-space : normal; width: 80%">' + skuDetalle.SKU_NAME + "</p>";
                    if (skuDetalle.HANDLE_SERIAL === 1 || skuDetalle.HANDLE_SERIAL === "1") {
                        li += "<p><b>Serie: </b>" + skuDetalle.SERIAL_NUMBER + "</p>";
                    }
                    li += "<p><b>Cantidad: </b>" + skuDetalle.QTY_SKU + " <b>Estado: </b>" + status + "</p>";
                    li += "<span class='ui-li-count'><strong>" + currencySymbol + ". " + format_number(skuDetalle.TOTAL_AMOUNT, 2) + "</strong> </span>";
                    li += "</a>";
                    li += "</li>";
                    objetoLista.append(li);
                    objetoLista.listview("refresh");
                }
            }
            , function(error) {
                notify(error);
            });
    }
    ,
    EstaEnDetalle: false
    ,
    ListadoDeDocumentos: new Array()
}