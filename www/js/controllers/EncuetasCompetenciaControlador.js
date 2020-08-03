var EncuestaCompetenciaControlador = (function () {
    function EncuestaCompetenciaControlador() {
        
    }

    var cantidadDeCompetidores = 5;
    var listadoDeComentarios = new Array();
    var uiListaDeEncuestaDeCompraDeCompetencia;
    var li;
    var uiEtiquetaDeComentario;
    var comentarios;
    var encuestas;
    var uiEtiquetaCompetidor;
    var uiCantidadDeCompetidor;
    var encuesta;
    var configoptions;

    EncuestaCompetenciaControlador.prototype.delegarEncuestaCompetenciaControlador = function () {
        var _this = this;

        $("#businnes_rival_poll").on("pageshow", function () {
            ClasificacionesServicio.ObtenerClasificaciones("BUSINESS_RIVAL", function (clasificacionesDeCompetencia) {
                if (clasificacionesDeCompetencia.length > 0) {
                    ClasificacionesServicio.ObtenerClasificaciones("BUSINESS_RIVAL_COMMENT", function (clasificacionesDeComentarios) {
                        if (clasificacionesDeComentarios.length > 0) {
                            listadoDeComentarios = new Array();
                            listadoDeComentarios = clasificacionesDeComentarios;
                            _this.GenerarEncuestas(clasificacionesDeCompetencia);
                        } else {
                            notify("No tiene comentarios registradors");
                            $.mobile.changePage("#confirmation_page", {
                                transition: "none",
                                reverse: true,
                                changeHash: true,
                                showLoadMsg: false
                            });
                        }
                    }, function (err) {
                        notify(err);
                    });
                } else {
                    notify("No tiene competidores registrados");
                    $.mobile.changePage("#confirmation_page", {
                        transition: "none",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                }
            }, function(err) {
                notify(err);
            });
        });

        $("#UiBotonCancelarEncuestaDeCompraDeCompetencia").on("click", function () {
            navigator.notification.confirm(
                "Esta seguro que desea cancelar la encuesta?",
                function(buttonIndex) {
                    if (buttonIndex === 2) {
                        $.mobile.changePage("#confirmation_page", {
                            transition: "none",
                            reverse: true,
                            changeHash: true,
                            showLoadMsg: false
                        });
                    }
                },
                'Sonda®  ' + SondaVersion,
                'No,Si'
            );
        });

        $("#UiBotonFinalizarEncuestaDeCompraDeCompetencia").on("click", function () {
            navigator.notification.confirm(
                "Esta seguro que desea finalizar la encuesta?",
                function (buttonIndex) {
                    if (buttonIndex === 2) {
                        _this.UsuarioDeseaFinalizarEncuesta();
                    }
                },
                'Sonda®  ' + SondaVersion,
                'No,Si'
            );
        });
    }

    EncuestaCompetenciaControlador.prototype.GenerarEncuestas = function (listadoDeCompetidores) {
        try {
            uiListaDeEncuestaDeCompraDeCompetencia = $('#UiListaDeEncuestaDeCompraDeCompetencia');
            uiListaDeEncuestaDeCompraDeCompetencia.children().remove('li');

            cantidadDeCompetidores = 5;
            if (listadoDeCompetidores.length < 5) {
                cantidadDeCompetidores = listadoDeCompetidores.length;
            }

            li = "";
            for (var i = 0; i < cantidadDeCompetidores; i++) {
                li = "";
                li += '<li style="width: 90%;">';
                li += '<b><span id="UiEtiquetaCompetidor' + i + '">' + listadoDeCompetidores[i].VALUE_TEXT_CLASSIFICATION + '</span></b>';
                li += "<table style='width: 100%;'>";
                li += '<tr>';
                li += '<td style="width: 20%;">';
                li += '<b><span class="HeaderSmall">Monto:</span></b>';
                li += '</td>';
                li += '<td style="width: 80%;">';
                li += '<input type="number" id="UiCantidadDeCompetidor' + i + '" data-clear-btn="true"">';
                li += '</td>';
                li += '</tr>';
                li += '<tr>';
                li += '<td colspan="2">';
                li += '<a onclick="UsuarioSeleccionoOpcionDeComentarioEnEncuestaDeCompetencia(' + i + ')" data-role="button" data-theme="b" class="ui-btn ui-corner-all ui-icon-bars ui-btn-icon-left">Comentario</a>';
                li += '</td>';
                li += '</tr>';
                li += '<tr>';
                li += '<td colspan="2">';
                li += '<p><span id="UiEtiquetaDeComentario' + i + '" class="HeaderSmall"></span></p>';
                li += '</td>';
                li += '</tr>';
                li += '</table>';
                li += '</li>';
                uiListaDeEncuestaDeCompraDeCompetencia.append(li);
            }

            uiListaDeEncuestaDeCompraDeCompetencia.listview("refresh");
            uiListaDeEncuestaDeCompraDeCompetencia.trigger('create');
            uiListaDeEncuestaDeCompraDeCompetencia = null;
        } catch (e) {
            notify("No se pudo generar la encusta, ERROR: " + e.message);
        }
    }

    EncuestaCompetenciaControlador.prototype.UsuarioSeleccionoOpcionDeComentario = function(indice) {
        console.log("selecciono: " + indice);

        comentarios = [];
        for (var i = 0; i < listadoDeComentarios.length; i++) {
            comentarios.push({
                text: listadoDeComentarios[i].VALUE_TEXT_CLASSIFICATION,
                value: listadoDeComentarios[i].VALUE_TEXT_CLASSIFICATION
            });
        }

        configoptions = {
            title: "Comentarios",
            items: comentarios,
            doneButtonLabel: "Aceptar",
            cancelButtonLabel: "Cancelar"
        };

        window.plugins.listpicker.showPicker(configoptions,
            function (item) {
                uiEtiquetaDeComentario = $('#UiEtiquetaDeComentario' + indice);
                uiEtiquetaDeComentario.text(item);
                uiEtiquetaDeComentario = null;
            }
        );

        configoptions = null;
        comentarios = null;
    }

    EncuestaCompetenciaControlador.prototype.UsuarioDeseaFinalizarEncuesta = function() {
        try {
            encuestas = new Array();
            for (var i = 0; i < cantidadDeCompetidores; i++) {
                uiCantidadDeCompetidor = $('#UiCantidadDeCompetidor' + i);

                if (uiCantidadDeCompetidor.val().trim() !== "" && parseFloat(uiCantidadDeCompetidor.val().trim()) > 0) {
                    uiEtiquetaCompetidor = $('#UiEtiquetaCompetidor' + i);
                    uiEtiquetaDeComentario = $('#UiEtiquetaDeComentario' + i);

                    encuesta = {
                        invoiceResolution: pCurrentSAT_Resolution
                        ,invoiceSerie: pCurrentSAT_Res_Serie
                        ,invoiceNum: localStorage.getItem('POS_CURRENT_INVOICE_ID')
                        ,codeCustomer: gClientCode
                        ,bussinessRivalName: uiEtiquetaCompetidor.text()
                        ,bussinessRivalTotalAmount: parseFloat(uiCantidadDeCompetidor.val().trim())
                        ,customerTotalAmount: gInvocingTotal
                        ,comment: uiEtiquetaDeComentario.text()
                        ,codeRoute: gCurrentRoute
                        ,postedDatetime: getDateTime()
                        ,isPosted: 0
                    }

                    encuestas.push(encuesta);

                    uiEtiquetaCompetidor = null;
                    uiEtiquetaDeComentario = null;
                    encuesta = null;
                }

                uiCantidadDeCompetidor = null;
            }

            if (encuestas.length > 0) {
                EncuestaServicio.GuardarEncuestasDeCompraDeCompetencia(encuestas, function() {
                    ConfirmedInvoice();

                    /*$.mobile.changePage("#confirmation_page", {
                        transition: "none",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });*/
                }, function(err) {
                    notify("2-Error al guardar la encuesta: " + err.message);
                });
            } else {
                notify("Debe de ingresar por lo menos un monto en algun competidor");
            }

        } catch (e) {
            notify("1-Error al guardar la encuesta: " + e.message);
        }
    }

    return EncuestaCompetenciaControlador;
}());

function UsuarioSeleccionoOpcionDeComentarioEnEncuestaDeCompetencia(indice) {
    var controlador = new EncuestaCompetenciaControlador();
    controlador.UsuarioSeleccionoOpcionDeComentario(indice);
    controlador = null;
}
