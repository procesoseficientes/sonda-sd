var _callbackCustomer;
var _etiquetas;
var _borraEtiqueta = false;
var _codeCustomer;
var _clienteDesdeResumen = false;
var _scoutingNuevo = true;

function DelegateCustomerController() {
    $("#uiMostrarEtiquetas").bind("click", function () { UsuarioDeseaMostrarEtiquetas(); });
    $("#uiMostrarClientes").bind("touchstart", function () { UsuarioDeseaMostrarClientes(); });

    $("#uiNuevoClienteGeneralesTab").click( function () {
        $("#uiNuevoClienteGenerales").css('display', 'block');
        $("#uiDatosFacturacion").css('display', 'none');
        $("#uiNuevoClienteFrecuencia").css('display', 'none');
    });

    $("#uiDatosFacturacionTab").click(function() {
        $("#uiNuevoClienteGenerales").css('display', 'none');
        $("#uiDatosFacturacion").css('display', 'block');
        $("#uiNuevoClienteFrecuencia").css('display', 'none');
    });

    $("#uiNuevoClienteFrecuenciaTab").click(function () {
        $("#uiNuevoClienteGenerales").css('display', 'none');
        $("#uiDatosFacturacion").css('display', 'none');
        $("#uiNuevoClienteFrecuencia").css('display', 'block');
    });

    $(document).on("pageshow", "#page_new_client", function () {
        $("#uiNuevoClienteGeneralesTab").addClass("ui-btn-active");
        $("#uiNuevoClienteGenerales").css('display', 'block');
        $("#uiDatosFacturacion").css('display', 'none');
        $("#uiNuevoClienteFrecuencia").css('display', 'none');
        if (_clienteDesdeResumen === true) {
            _scoutingNuevo = false;
            UsuarioSeleccionoCliente(_codeCustomer);
        } else {
            console.log("metodo vacio...");
        }
    });


    $(document).on('pagecontainerbeforeshow', function () {
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage");
        $('[data-role="tabs"] a:first', activePage).each(function () {
            $(this).click();
        });
    });

    $("#linknew_client").bind("touchstart", function () {
        EstaGpsDesavilitado(function () {
            MostrarPagina();
        });
    });



    //$("#page_new_client").on("swipeleft", "#UiListaEtiquetas li", BorrarEtiqueta);

    //$("#UiListaEtiquetas li").swipe({
    //    swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
    //        if (fingerCount === 1 && direction === "left") {
    //            BorrarEtiqueta(event);
    //        }
    //    }
    //});

    //$(document).swipe("#UiListaEtiquetas li", {
    //    swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
    //        if (fingerCount === 1 && direction === "left") {
    //            BorrarEtiqueta(event);
    //        }
    //    }
    //});


    $("#page_new_client").swipe({
        swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
            if (fingerCount === 1 && direction === "left") {
                UsuarioDeseaMostrarClientes();
            }
            if (fingerCount === 1 && direction === "right") {
                UsuarioDeseaMostrarEtiquetas();
            }
        }
    });

    $("#guardarFirmaFoto").bind("touchstart", function () {
        UsuarioDeseaAdicionarFotoYFirmaANuevoCliente();
    });

    $("#page_report_client").swipe({
        swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
            if (fingerCount === 1 && direction === "right") {
                var myPanel = $("#scouting_report_panel");
                myPanel.panel("open");
                myPanel = null;
            }
        }
    });

    $("#UiBtnModificarScouting").bind("touchstart", function () {
        _clienteDesdeResumen = true;
        $.mobile.changePage("#page_new_client", {
            transition: "flow",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
        });

    });

    $("#RazonSocialClienteNuevo").bind("keyup", function (event) {
        $("#NombrePuntoVenta").val($("#RazonSocialClienteNuevo").val());
        $("#NombreFacturacion").val($("#RazonSocialClienteNuevo").val());
    });

    $("#DireccionClienteNuevo").bind("keyup", function (event) {
        $("#DireccionFacturacion").val($("#DireccionClienteNuevo").val());
    });

};

function UsuarioDeseaAdicionarFotoYFirmaANuevoCliente() {
    var razonSocial = $("#RazonSocialClienteNuevo").val();
    var lunes = 0;
    var martes = 0;
    var miercoles = 0;
    var jueves = 0;
    var viernes = 0;
    var sabado = 0;
    var domingo = 0;


    if ($("#checkboxLunes")[0].checked) {
        lunes = 1;
    }
    if ($("#checkboxMartes")[0].checked) {
        martes = 1;
    }
    if ($("#checkboxMiercoles")[0].checked) {
        miercoles = 1;
    }
    if ($("#checkboxJueves")[0].checked) {
        jueves = 1;
    }
    if ($("#checkboxViernes")[0].checked) {
        viernes = 1;
    }
    if ($("#checkboxSabado")[0].checked) {
        sabado = 1;
    }
    if ($("#checkboxDomingo")[0].checked) {
        domingo = 1;
    }
    if (razonSocial == "" || (!lunes && !martes && !miercoles && !jueves && !viernes && !sabado && !domingo)) {
        notify("Faltan ingresar datos");
    } else {
        validarCantidadDeEtiquetas(function () {
            EstaGpsDesavilitado(function () {
                MostrarListaEmpresas(function(ownerId) {
                    navigator.notification.confirm("Desea ingresar/modificar el cliente?",
                    function (respuesta) {
                        if (respuesta === 2) {
                            my_dialog("", "", "close");
                            MostrarCapturaDeFirmaYFoto(OpcionFirmaYFotoTipo.Ninguno, function (firma, foto) {
                                UsuarioDeseaGuardarClienteNuevo(firma, foto, ownerId);
                                RegresarAPaginaAnterior("page_new_client");
                            });
                        } else {
                            my_dialog("", "", "close");
                        }
                    }, "Sonda® " + SondaVersion,
                "No,Si");
                }, function(err) {
                    notify(err.message);
                });
            });
        }, function (err) {
            notify(err.message);
        });


    }
}

function UsuarioDeseaMostrarEtiquetas() {
    //OcultarTeclado();
    var myPanel = $.mobile.activePage.children('[id="new_client_panel"]');
    myPanel.panel("toggle");
}

function ColocarValorPorDefecto(tipo, campo) {
    if (campo == "") {
        switch (tipo) {
            case CampoTipo.Texto:
                return "...";
                //break;
            case CampoTipo.Numero:
                return 0;
                //break;

            default:
                return campo;
        }
    } else {
        return campo;
    }
}

function UsuarioDeseaGuardarClienteNuevo(firma, foto, ownerId) {
    var razonSocial = $("#RazonSocialClienteNuevo").val();
    var direccion = ColocarValorPorDefecto(CampoTipo.Texto, $("#DireccionClienteNuevo").val());
    var telefono = ColocarValorPorDefecto(CampoTipo.Numero, $("#TelefonoClienteNuevo").val());
    var contacto = ColocarValorPorDefecto(CampoTipo.Texto, $("#ContactoClienteNuevo").val());
    var referencia = ColocarValorPorDefecto(CampoTipo.Texto, $("#ReferenciaClienteNuevo").val());
    var nombrePuntoVenta = ColocarValorPorDefecto(CampoTipo.Texto, $("#NombrePuntoVenta").val());
    var nombreFacturacion = ColocarValorPorDefecto(CampoTipo.Texto, $("#NombreFacturacion").val());
    var direccionFacturacion = ColocarValorPorDefecto(CampoTipo.Texto, $("#DireccionFacturacion").val());
    var contactoIdentificacion = ColocarValorPorDefecto(CampoTipo.Texto, $("#ContactoIdentificacion").val());
    var nit = ColocarValorPorDefecto(CampoTipo.Texto, $("#Nit").val());
    if (nit == "...") {
        nit = "CF";
    }
    var frecuencia = 0;
    switch ($("#FrecuenciaClienteNuevo").val()) {
        case "oneWeek":
            frecuencia = 1;
            break;
        case "twoWeeks":
            frecuencia = 2;
            break;
        case "threeWeeks":
            frecuencia = 3;
            break;
        case "fourWeeks":
            frecuencia = 4;
            break;
    }
    var lunes = 0;
    var martes = 0;
    var miercoles = 0;
    var jueves = 0;
    var viernes = 0;
    var sabado = 0;
    var domingo = 0;


    if ($("#checkboxLunes")[0].checked) {
        lunes = 1;
    }
    if ($("#checkboxMartes")[0].checked) {
        martes = 1;
    }
    if ($("#checkboxMiercoles")[0].checked) {
        miercoles = 1;
    }
    if ($("#checkboxJueves")[0].checked) {
        jueves = 1;
    }
    if ($("#checkboxViernes")[0].checked) {
        viernes = 1;
    }
    if ($("#checkboxSabado")[0].checked) {
        sabado = 1;
    }
    if ($("#checkboxDomingo")[0].checked) {
        domingo = 1;
    }
    var diasVisita = {
        'lunes': lunes,
        'martes': martes,
        'miercoles': miercoles,
        'jueves': jueves,
        'viernes': viernes,
        'sabado': sabado,
        'domingo': domingo
    }

    GetNexSequence("CUSTOMER", function (codigoCliente) {

        validarCantidadDeFotografias(function () {
            var codigoHH;
            var pNew;
            if (_codeCustomer === "") {
                codigoHH = parseInt(codigoCliente);
                pNew = 1;
            } else {
                codigoHH = _codeCustomer;
                pNew = 0;
            }
            var clienteNuevo = {
                'loginid': gLoggedUser
                , 'dbuser': gdbuser
                , 'dbuserpass': gdbuserpass
                , 'Codigo': null
                , 'CodigoHH': codigoHH //,parseInt(codigoCliente)
                , 'Nombre': razonSocial
                , 'Direccion': direccion
                , 'Telefono': telefono
                , 'Frecuencia': frecuencia
                , 'DiasVisita': diasVisita
                , 'Ruta': gCurrentRoute
                , 'Seller_code': gLoggedUser
                , 'Contacto': contacto
                , 'Firma': firma
                , 'Foto': foto
                , 'Status': 'NEW'
                , 'New': pNew
                , 'Referencia': referencia
                , 'NombrePuntoVenta': nombrePuntoVenta
                , 'NombreFacturacion': nombreFacturacion
                , 'DireccionFacturacion': direccionFacturacion
                , 'Nit': nit
                , 'ContactoIdentificacion': contactoIdentificacion
                , 'Tags': _etiquetas
                , 'SyncId': null
                , "rgaCode": null
                , "DiscountListId": null
                , "BonusListId": null
                , "ownerId": ownerId
            };

            if (_scoutingNuevo === true) {
                GuardarClienteNuevoHandHeld(clienteNuevo, function (clienteNuevo) {
                    UsuarioDeseaLimpiarData();
                    notify("Cliente " + clienteNuevo.Nombre + " ingresado correctamente");
                    //CrearTarea(clienteNuevo,TareaTipo.Scoutiong, function (clienteNuevoN2) {
                    ObtenerReglas("agregarCliente", function (pReglas) {
                        my_dialog("", "", "close");
                        $.mobile.changePage("#menu_page", {
                            transition: "flow",
                            reverse: true,
                            changeHash: true,
                            showLoadMsg: false
                        });


                        ReglaPosteriorCrearCliente(pReglas, 0, clienteNuevo, function () {
                            EnviarData();
                        }, function (err) {
                            my_dialog("", "", "close");
                            notify(err.message);
                        });
                    }, function (err) {
                        my_dialog("", "", "close");
                        //notify(err.message);
                    });
                    //}, function (err) {
                    //    my_dialog("", "", "close");
                    //    notify(err.message);
                    //});
                });
            }
            else {
                GuardarClienteNuevoHandHeld(clienteNuevo, function (clienteModificado) {
                    UsuarioDeseaLimpiarData();
                    notify("Cliente " + clienteModificado.Nombre + " modificado correctamente");
                    my_dialog("", "", "close");
                    var tareaServicio = new TareaServcio();
                    var cliente = new Cliente();
                    cliente.clientId = clienteModificado.CodigoHH;
                    tareaServicio.obtenerTareasDeCliente(cliente, function (listaDeTarea) {
                        for (var i = 0; i < listaDeTarea.length; i++) {
                            var tarea = listaDeTarea[i];
                            tareaServicio.actualizarClienteTarea(tarea.taskId, clienteModificado.CodigoHH, clienteModificado.Nombre, clienteModificado.Direccion, function (tareaid) {
                                actualizarDatosDeTareaDom(tareaid, clienteModificado.CodigoHH, clienteModificado.Nombre, clienteModificado.Direccion);
                            }, function (reultado) {
                                my_dialog("", "", "closed");
                                notify(resultado.mensaje);
                            });
                        }
                    }, function (resultado) {
                        my_dialog("", "", "closed");
                        notify(resultado.mensaje);
                    });

                    ObtenerReglas("agregarCliente", function (pReglas) {
                        my_dialog("", "", "close");
                        $.mobile.changePage("#menu_page", {
                            transition: "flow",
                            reverse: true,
                            changeHash: true,
                            showLoadMsg: false
                        });


                        ReglaPosteriorCrearCliente(pReglas, 0, clienteNuevo, function () {
                            ReinicarVariables();
                            EnviarData();
                        }, function (err) {
                            my_dialog("", "", "close");
                            notify(err.message);
                        });
                    }, function (err) {
                        my_dialog("", "", "close");
                        //notify(err.message);
                    });

                    $.mobile.changePage("#menu_page", {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                    });
                });
            }
        }, function (err) {
            notify(err.message);
        });


    }, function (err) { notify(err.message) });
};

function UsuarioDeseaCancelarClienteNuevo() {
    navigator.notification.confirm("¿Desea cancelar el ingreso de nuevo cliente?",
             function (respuesta) {
                 if (respuesta == 2) {
                     my_dialog("", "", "close");
                     UsuarioDeseaLimpiarData();
                     $.mobile.changePage("#menu_page", {
                         transition: "flow",
                         reverse: true,
                         changeHash: true,
                         showLoadMsg: false
                     });
                 } else {
                     my_dialog("", "", "close");
                 }
             }, "Sonda® " + SondaVersion,
             "No,Si");
}

function UsuarioDeseaLimpiarData() {
    try {
        _codeCustomer = "";
        $("#RazonSocialClienteNuevo").val(null);
        $("#DireccionClienteNuevo").val(null);
        $("#TelefonoClienteNuevo").val(null);
        $("#ContactoClienteNuevo").val(null);
        $("#ReferenciaClienteNuevo").val(null);
        $("#NombrePuntoVenta").val(null);
        $("#NombreFacturacion").val(null);
        $("#DireccionFacturacion").val(null);
        $("#Nit").val(null);
        $("#ContactoIdentificacion").val(null);

        $("#checkboxDomingo")[0].checked = false;
        $("#checkboxDomingo").checkboxradio("refresh");
        $("#checkboxLunes")[0].checked = false;
        $("#checkboxLunes").checkboxradio("refresh");
        $("#checkboxMartes")[0].checked = false;
        $("#checkboxMartes").checkboxradio("refresh");
        $("#checkboxMiercoles")[0].checked = false;
        $("#checkboxMiercoles").checkboxradio("refresh");
        $("#checkboxJueves")[0].checked = false;
        $("#checkboxJueves").checkboxradio("refresh");
        $("#checkboxViernes")[0].checked = false;
        $("#checkboxViernes").checkboxradio("refresh");
        $("#checkboxSabado")[0].checked = false;
        $("#checkboxSabado").checkboxradio("refresh");

        $("#collapseCheckDias").collapsible("option", "collapsed", true);
        $("#listaDatosGenerales").collapsible("option", "collapsed", false);
        $('#UiListaEtiquetas').children().remove('li');
        ObtenerEtiquetas(function (etiquetas) {
            CrearObjetoEtiqueta(etiquetas, function (etiquetas) {
                GenerarPanelEtiqueta(etiquetas, function () {
                    _etiquetas = etiquetas;
                }, function (err) {
                    notify(err);
                });
            }, function (err) {
                notify(err);
            });
        }, function (err) {
            notify(err);
        });
    } catch (e) {
        alert(e.message);
    }
}

function MostrarPagina() {

    try {
        ObtenerEtiquetas(function (etiquetas) {
            CrearObjetoEtiqueta(etiquetas, function (etiquetas) {
                _codeCustomer = "";
                $('#UiListaEtiquetas').children().remove('li');
                $.mobile.changePage("#page_new_client", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
                GenerarPanelEtiqueta(etiquetas, function () {
                    _etiquetas = etiquetas;
                }, function (err) {
                    notify(err);
                });
            }, function (err) {
                notify(err);
            });
        }, function (err) {
            notify(err);
        });
    } catch (e) {
        notify(e.message);
    }
}

function CrearObjetoEtiqueta(pEtiquetas, callback, errCallBack) {
    try {
        var etiquetas = Array();

        for (var i = 0; i < pEtiquetas.rows.length; i++) {
            var item = {
                TAG_COLOR: pEtiquetas.rows.item(i).TAG_COLOR
                , TAG_VALUE_TEXT: pEtiquetas.rows.item(i).TAG_VALUE_TEXT
                , TAG_PRIORITY: pEtiquetas.rows.item(i).TAG_PRIORITY
                , TAG_COMMENTS: pEtiquetas.rows.item(i).TAG_COMMENTS
                , ASIGNADO: 0
            };
            etiquetas.push(item);
        }

        callback(etiquetas);
    } catch (e) {
        errCallBack(e.message);
    }
}

function GenerarPanelEtiqueta(pEtiquetas, callback, errCallBack) {
    try {
        $('#UiListaEtiquetasCliente').children().remove('li');
        for (var i = 0; i < pEtiquetas.length; i++) {
            var etiqueta = pEtiquetas[i];
            if (etiqueta.ASIGNADO === 0) {
                var vLi = " <li>";
                var eventoAgregar = "AgragarEtiqueta('" + etiqueta.TAG_COLOR.substring(1, etiqueta.TAG_COLOR.length).toString() + "');";

                vLi = vLi + '<a href="#" onclick=" ' + eventoAgregar + '" class="menupanel ui-nodisc-icon ui-btn ui-btn-icon-left" style="background-color:' + etiqueta.TAG_COLOR + ';border-radius: 75px; border-top-right-radius: 200px 200px">';
                vLi = vLi + "<span class='menupanel'>";

                //----
                var colorSugerido = "";

                //Obtener color de contraste para el texto
                var hex = etiqueta.TAG_COLOR;
                var percent = 100;

                hex = hex.replace(/^\s*#|\s*$/g, '');

                // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
                if (hex.length == 3) {
                    hex = hex.replace(/(.)/g, '$1$1');
                }

                var r = parseInt(hex.substr(0, 2), 16),
                    g = parseInt(hex.substr(2, 2), 16),
                    b = parseInt(hex.substr(4, 2), 16);

                var y = 2.99 * r + 5.87 * g + 1.14 * b;
                if (y >= 1275) {
                    colorSugerido = '#000000';
                } else {
                    colorSugerido = '#FFFFFF';
                }
                //--Fin
                vLi = vLi + "<FONT color='" + colorSugerido + "'>";
                vLi = vLi + etiqueta.TAG_VALUE_TEXT;
                vLi = vLi + "</FONT></span></a></li>";

                $("#UiListaEtiquetasCliente").append(vLi);
                $("#UiListaEtiquetasCliente").listview('refresh');
            }
        }
        callback(pEtiquetas);
    } catch (e) {
        errCallBack(e.message);
    }
}

function AgragarEtiqueta(pTagColor) {
    try {
        var tagColor = "#" + pTagColor;
        for (var i = 0; i < _etiquetas.length; i++) {
            if (_etiquetas[i].TAG_COLOR === tagColor) {
                _etiquetas[i].ASIGNADO = 1;
                break;
            }
        }
        GenerarListaEtiquetas(_etiquetas, function (etiquetas) {
            GenerarPanelEtiqueta(etiquetas, function () {

            }, function (err) {
                notify(err);
            });
        }, function (err) {
            notify(err);
        });
    } catch (err) {
        notify(err);
    }
}

function GenerarListaEtiquetas(pEtiquetas, callback, errCallBack) {
    try {
        $('#UiListaEtiquetas').children().remove('li');
        var vLi = "";
        for (var i = 0; i < pEtiquetas.length; i++) {
            var etiqueta = pEtiquetas[i];
            if (etiqueta.ASIGNADO === 1) {
                vLi += " <li id='" + etiqueta.TAG_COLOR.substring(1, etiqueta.TAG_COLOR.length).toString() + "' data-icon='false; class='ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check'>";
                vLi += "<a href='#' style='background-color:" + etiqueta.TAG_COLOR + ";'>";
                var colorSugerido = "";

                //Obtener color de contraste para el texto
                var hex = etiqueta.TAG_COLOR;
                var percent = 100;

                hex = hex.replace(/^\s*#|\s*$/g, '');

                // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
                if (hex.length == 3) {
                    hex = hex.replace(/(.)/g, '$1$1');
                }

                var r = parseInt(hex.substr(0, 2), 16),
                    g = parseInt(hex.substr(2, 2), 16),
                    b = parseInt(hex.substr(4, 2), 16);

                var y = 2.99 * r + 5.87 * g + 1.14 * b;
                if (y >= 1275) {
                    colorSugerido = '#000000';
                } else {
                    colorSugerido = '#FFFFFF';
                }
                //--Fin
                vLi = vLi + "<FONT color='" + colorSugerido + "'>";
                vLi = vLi + etiqueta.TAG_VALUE_TEXT;
                vLi = vLi + "</FONT>";
                vLi += "</a>";
                vLi += '<a href="#" data-role="button" data-theme="b" data-icon="delete" class="ui-nodisc-icon" data-mini="true" onclick="BorrarEtiqueta(\''+ etiqueta.TAG_COLOR +'\');"></a>';
                vLi += "</li>";
            }
        }
        if (vLi !== "") {
            $("#UiListaEtiquetas").append(vLi);
            $("#UiListaEtiquetas").listview('refresh');
            //$("#UiListaEtiquetas").trigger('create');
            callback(pEtiquetas);
        } else {
            callback(pEtiquetas);
        }
        
    } catch (e) {
        errCallBack(e.message);
    }
}

function UsuarioDeseaMostrarClientes() {
    if (_borraEtiqueta === false) {
        OcultarTeclado();

        if ($("#RazonSocialClienteNuevo").val().length >= 5) {
            ObtenerClientes($("#RazonSocialClienteNuevo").val(), function (clientes) {
                GenerarPanelCliente(clientes, function () {
                    var myPanel = $.mobile.activePage.children('[id="client_panel"]');
                    myPanel.panel("toggle");
                }, function (err) {
                    notify(err.message);
                });
            }, function (err) {
                notify(err.message);
            });
        } else {
            notify("Minimo de caracteres 5, para filtrar los clientes");
        }

    }
    _borraEtiqueta = false;
}

function BorrarEtiqueta(tagColor) {
    //if (event.type === "swipeleft") {
    //    event.preventDefault();
    //    var tagColor = "#" + $(this).attr('id');
        for (var i = 0; i < _etiquetas.length; i++) {
            if (_etiquetas[i].TAG_COLOR === tagColor) {
                _etiquetas[i].ASIGNADO = 0;
                break;
            }
        }
        GenerarListaEtiquetas(_etiquetas, function (etiquetas) {
            GenerarPanelEtiqueta(etiquetas, function () {

            }, function (err) {
                notify(err);
            });
        }, function (err) {
            notify(err);
        });
        _borraEtiqueta = true;
    //}
}

//----------Cliente----------//

function GenerarPanelCliente(pClientes, callback, errCallBack) {
    try {
        $('#UiListaCliente').children().remove('li');
        for (var i = 0; i < pClientes.rows.length; i++) {
            var cliente = pClientes.rows.item(i);
            var vLi = " <li>";
            var eventoSelecionar = "UsuarioSeleccionoCliente('" + cliente.CLIENT_ID + "');";
            vLi = vLi + '<a href="#" onclick=" ' + eventoSelecionar + '" class="menupanel ui-nodisc-icon ui-btn ui-btn-icon-left" style="border-radius: 75px; border-top-right-radius: 200px 200px">';
            vLi = vLi + "<span class='menupanel'>";
            vLi = vLi + cliente.CLIENT_NAME + "<br>";
            vLi += cliente.ADDRESS;
            vLi = vLi + "</span></a></li>";
            $("#UiListaCliente").append(vLi);
            $("#UiListaCliente").listview('refresh');

        }
        callback(pClientes);
    } catch (e) {
        errCallBack(e.message);
    }
}

function UsuarioSeleccionoCliente(codeCustomer) {
    try {
        _scoutingNuevo = false;
        if (!_clienteDesdeResumen) {
            var myPanel = $.mobile.activePage.children('[id="client_panel"]');
            myPanel.panel("toggle");
        }

        UsuarioDeseaLimpiarData();
        _codeCustomer = codeCustomer;
        ObtenerCliente(codeCustomer, function (pCliente) {
            var cliente = pCliente.rows.item(0);
            $("#RazonSocialClienteNuevo").val(cliente.CLIENT_NAME);
            $("#DireccionClienteNuevo").val(cliente.ADDRESS);
            $("#TelefonoClienteNuevo").val(cliente.PHONE);
            $("#ContactoClienteNuevo").val(cliente.CONTACT_CUSTOMER);
            $("#NombrePuntoVenta").val(cliente.POS_SALE_NAME);
            $("#NombreFacturacion").val(cliente.INVOICE_NAME);
            $("#DireccionFacturacion").val(cliente.INVOICE_ADDRESS);
            $("#Nit").val(cliente.CLIENT_TAX_ID);
            $("#ContactoIdentificacion").val(cliente.CONTACT_ID);
            $("#ReferenciaClienteNuevo").val(cliente.REFERENCE);

            ObtenerFrecuenciasCliente(cliente.CLIENT_ID, function (pCustomerFrequency, pCodeCustomer) {
                LlenarFrecuencia(pCustomerFrequency, pCodeCustomer, function (pCodeCustomer) {
                    ObtenerEtiquetasCliente(pCodeCustomer, function (pEtiquetasCliente) {
                        for (var i = 0; i < pEtiquetasCliente.rows.length; i++) {
                            var etiquetaCliente = pEtiquetasCliente.rows.item(i);
                            for (var j = 0; j < _etiquetas.length; j++) {
                                if (_etiquetas[j].TAG_COLOR === etiquetaCliente.TAG_COLOR) {
                                    _etiquetas[j].ASIGNADO = 1;
                                    break;
                                }
                            }
                        }
                        GenerarListaEtiquetas(_etiquetas, function (etiquetas) {
                            GenerarPanelEtiqueta(etiquetas, function () {

                            }, function (err) {
                                notify(err);
                            });
                        }, function (err) {
                            notify(err);
                        });
                    }, function (err) {
                        notify(err);
                    });
                }, function (err) {
                    notify(err);
                });
            }, function (err) {
                notify(err);
            });
        }, function (err) {
            notify(err);
        });
    } catch (e) {
        notify(e.message);
    }
}

function LlenarFrecuencia(pCustomerFrequency, pCodeCustomer, callback, errCallBack) {
    try {
        if (pCustomerFrequency.rows.length > 0) {

            var customerFrequency = pCustomerFrequency.rows.item(0);
            var frecuencia = "";

            switch (customerFrequency.FREQUENCY_WEEKS) {
                case "1":
                    frecuencia = "oneWeek";
                    break;
                case "2":
                    frecuencia = "twoWeeks";
                    break;
                case "3":
                    frecuencia = "threeWeeks";
                    break;
            }
            $("#FrecuenciaClienteNuevo").val(frecuencia);
            $("#FrecuenciaClienteNuevo").selectmenu('refresh');

            if (customerFrequency.SUNDAY === "1") {
                $("#checkboxDomingo")[0].checked = true;
                $("#checkboxDomingo").checkboxradio("refresh");
            }

            if (customerFrequency.MONDAY === "1") {
                $("#checkboxLunes")[0].checked = true;
                $("#checkboxLunes").checkboxradio("refresh");
            }

            if (customerFrequency.TUESDAY === "1") {
                $("#checkboxMartes")[0].checked = true;
                $("#checkboxMartes").checkboxradio("refresh");
            }

            if (customerFrequency.WEDNESDAY === "1") {
                $("#checkboxMiercoles")[0].checked = true;
                $("#checkboxMiercoles").checkboxradio("refresh");
            }

            if (customerFrequency.THURSDAY === "1") {
                $("#checkboxJueves")[0].checked = true;
                $("#checkboxJueves").checkboxradio("refresh");
            }

            if (customerFrequency.FRIDAY === "1") {
                $("#checkboxViernes")[0].checked = true;
                $("#checkboxViernes").checkboxradio("refresh");
            }

            if (customerFrequency.SATURDAY === "1") {
                $("#checkboxSabado")[0].checked = true;
                $("#checkboxSabado").checkboxradio("refresh");
            }
        }
        callback(pCodeCustomer);
    } catch (e) {
        errCallBack(e.message);
    }
}

//----------Fin Cliente----------//


//----------Reporte Cliente----------//

function LimpiarControlesClienteReporte() {
    $("#lblRazonSocial").text("...");
    $("#lblMDireccion").text("...");
    $("#lblNoTelefono").text("...");
    $("#lblContacto").text("...");
    $("#lblFrecuencia").text("...");
    $("#lblDias").text("...");
    $('#UiListaEtiquetasRecp').children().remove('li');
    $("#imgClientPicture").attr('src', "");
}

function MostrarPaginaReporte(codeCustomer) {
    try {

        ObtenerCliente(codeCustomer, function (pCliente) {
            $.mobile.changePage("#page_report_client", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
            LimpiarControlesClienteReporte();
            var cliente = pCliente.rows.item(0);
            $("#lblRazonSocial").text(cliente.CLIENT_NAME);
            $("#lblMDireccion").text(cliente.ADDRESS);
            $("#lblNoTelefono").text(cliente.PHONE);
            $("#lblContacto").text(cliente.CONTACT_CUSTOMER);
            $("#imgClientPicture").attr('src', "data:image/jpeg;base64," + cliente.PHOTO);
            $("#divClientPicture").css("visibility", "visible");

            ObtenerFrecuenciasCliente(cliente.CLIENT_ID, function (pCustomerFrequency, pCodeCustomer) {
                LlenarFrecuenciaRep(pCustomerFrequency, pCodeCustomer, function (pCodeCustomer) {
                    ObtenerEtiquetasCliente(pCodeCustomer, function (pEtiquetasCliente) {
                        GenerarListaEtiquetasRep(pEtiquetasCliente, function () {

                            _codeCustomer = codeCustomer;

                        }, function (err) {
                            notify(err);
                        });
                    }, function (err) {
                        notify(err);
                    });
                }, function (err) {
                    notify(err);
                });
            }, function (err) {
                notify(err);
            });
        }, function (err) {
            notify(err);
        });
    } catch (e) {
        notify(e.message);
    }
}


function LlenarFrecuenciaRep(pCustomerFrequency, pCodeCustomer, callback, errCallBack) {
    try {
        if (pCustomerFrequency.rows.length > 0) {
            var customerFrequency = pCustomerFrequency.rows.item(0);
            switch (customerFrequency.FREQUENCY_WEEKS) {
                case "1":
                    $("#lblFrecuencia").text("1 Semana");
                    break;
                case "2":
                    $("#lblFrecuencia").text("2 Semanas");
                    break;
                case "3":
                    $("#lblFrecuencia").text("3 Semanas");
                    break;
            }

            var dias = "";
            var dias2 = "";
            var cantidad = 0;
            if (customerFrequency.SUNDAY === "1") {
                dias += "Domingo";
                cantidad += 1;
            }

            if (customerFrequency.MONDAY === "1") {
                if (dias !== "") {
                    dias += ", ";
                }
                dias += "Lunes";
                cantidad += 1;
            }

            if (customerFrequency.TUESDAY === "1") {
                if (dias !== "") {
                    dias += ", ";
                }
                dias += "Martes";
                cantidad += 1;
            }

            if (customerFrequency.WEDNESDAY === "1") {
                if (cantidad === 3) {
                    if (dias2 !== "") {
                        dias2 += ", ";
                    }
                    dias2 += "Miercoles";
                } else {
                    if (dias !== "") {
                        dias += ", ";
                    }
                    dias += "Miercoles";
                    cantidad += 1;
                }
            }

            if (customerFrequency.THURSDAY === "1") {
                if (cantidad === 3) {
                    if (dias2 !== "") {
                        dias2 += ", ";
                    }
                    dias2 += "Jueves";
                } else {
                    if (dias !== "") {
                        dias += ", ";
                    }
                    dias += "Jueves";
                    cantidad += 1;
                }
            }

            if (customerFrequency.FRIDAY === "1") {
                if (cantidad === 3) {
                    if (dias2 !== "") {
                        dias2 += ", ";
                    }
                    dias2 += "Viernes";
                } else {
                    if (dias !== "") {
                        dias += ", ";
                    }
                    dias += "Viernes";
                    cantidad += 1;
                }

            }

            if (customerFrequency.SATURDAY === "1") {
                if (cantidad === 3) {
                    if (dias2 !== "") {
                        dias2 += ", ";
                    }
                    dias2 += "Sabado";
                } else {
                    if (dias !== "") {
                        dias += ", ";
                    }
                    dias += "Sabado";
                }
            }
            $("#lblDias").text(dias);
            $("#lblDias2").text(dias2);
        }
        callback(pCodeCustomer);
    } catch (e) {
        errCallBack(e.message);
    }
}

function GenerarListaEtiquetasRep(pEtiquetasCliente, callback, errCallBack) {
    try {
        $('#UiListaEtiquetasRecp').children().remove('li');
        for (var i = 0; i < pEtiquetasCliente.rows.length; i++) {
            var etiqueta = pEtiquetasCliente.rows.item(i);
            var vLi = " <li id='" + etiqueta.TAG_COLOR.substring(1, etiqueta.TAG_COLOR.length).toString() + "' data-icon='false; class='ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check' style='background-color:" + etiqueta.TAG_COLOR + ";' >";
            var colorSugerido = "";

            //Obtener color de contraste para el texto
            var hex = etiqueta.TAG_COLOR;
            var percent = 100;

            hex = hex.replace(/^\s*#|\s*$/g, '');

            // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
            if (hex.length == 3) {
                hex = hex.replace(/(.)/g, '$1$1');
            }
            var r = parseInt(hex.substr(0, 2), 16),
                g = parseInt(hex.substr(2, 2), 16),
                b = parseInt(hex.substr(4, 2), 16);

            var y = 2.99 * r + 5.87 * g + 1.14 * b;
            if (y >= 1275) {
                colorSugerido = '#000000';
            } else {
                colorSugerido = '#FFFFFF';
            }
            //--Fin
            vLi = vLi + "<FONT color='" + colorSugerido + "'>";
            vLi = vLi + etiqueta.TAG_VALUE_TEXT;
            vLi = vLi + "</FONT></li>";
            $("#UiListaEtiquetasRecp").append(vLi);
            $("#UiListaEtiquetasRecp").listview('refresh');
        }
        callback();
    } catch (e) {
        errCallBack(e.message);
    }
}

function ReinicarVariables() {
    _clienteDesdeResumen = false;
    _scoutingNuevo = true;
}

//----------Fin Reporte Cliente----------//

function validarCantidadDeEtiquetas(callback, errCallback) {
    ObtenerReglas("manejoEtiquetas", function (reglas) {
        if (reglas.rows.length > 0) {
            var tieneEtiqueta = false;
            for (var j = 0; j < reglas.rows.length; j++) {
                var regla = reglas.rows.item(j);

                if (regla.TYPE_ACTION === 'etiquetaNecesaria') {
                    if (regla.ENABLED === 'Si' || regla.ENABLED === 'SI') {
                        if (_etiquetas.length > 0) {
                            for (var i = 0; i < _etiquetas.length; i++) {
                                if (_etiquetas[i].ASIGNADO === 1) {
                                    tieneEtiqueta = true;
                                    callback();
                                    break;
                                }
                            }

                            if (tieneEtiqueta === false) {
                                errCallback({ code: -1, message: "Debe de asignar por lo menos una etiqueta" });
                                break;
                            }
                        } else {
                            callback();
                        }
                    } else {
                        callback();
                    }
                }
            }
        } else {
            callback();
        }
    }, function (err) {
        errCallback(err);
    });


}


function validarCantidadDeFotografias(callback, errCallback) {
    ObtenerReglas("agregarCliente", function (reglas) {
        if (reglas.rows.length > 0) {
            for (var j = 0; j < reglas.rows.length; j++) {
                var regla = reglas.rows.item(j);

                if (regla.TYPE_ACTION === 'FotografiaObligatoria') {
                    if (regla.ENABLED === 'Si' || regla.ENABLED === 'SI') {
                        if (_fotostomadas > 0) {
                            callback();
                            break;
                        } else {
                            errCallback({ code: -1, message: "Debe de tomar por lo menos una fotografía." });
                            break;
                        }
                    } else {
                        callback();
                        break;
                    }
                } else {
                    if (j === reglas.rows.length - 1) {
                        callback();
                    }
                }
            }
        } else {
            callback();
        }
    }, function (err) {
        errCallback(err);
    });


}

function ObtenerListaDeDescuentosYBonificacionesParaScouting(clienteNuevo, callBack) {
    try {
        ObtenerReglas("agregarCliente", function (reglas) {
            if (reglas.rows.length > 0) {
                for (var j = 0; j < reglas.rows.length; j++) {
                    var regla = reglas.rows.item(j);

                    if (regla.TYPE_ACTION === 'AsignarAcuerdoComercial') {
                        if (regla.ENABLED === 'Si' || regla.ENABLED === 'SI') {
                            var bonusListId = localStorage.getItem("DEFAULT_BONUS_LIST_ID");
                            var discountListId = localStorage.getItem("DEFAULT_DISCOUNT_LIST_ID");
                            var saleByMultipleListId = localStorage.getItem("DEFAULT_SALE_BY_MULTIPLE_LIST_ID");
                            bonusListId = (bonusListId === "null" ||
                                    bonusListId === "NULL" ||
                                    bonusListId === undefined ||
                                    bonusListId === null)
                                ? null
                                : parseInt(bonusListId);
                            discountListId = (discountListId === "null" ||
                                    discountListId === "NULL" ||
                                    discountListId === undefined ||
                                    discountListId === null)
                                ? null
                                : parseInt(discountListId);
                            saleByMultipleListId = (saleByMultipleListId === "null" ||
                                    saleByMultipleListId === "NULL" ||
                                    saleByMultipleListId === undefined ||
                                    saleByMultipleListId === null)
                                ? null
                                : parseInt(saleByMultipleListId);

                            clienteNuevo.DiscountListId = discountListId;
                            clienteNuevo.BonusListId = bonusListId;
                            clienteNuevo.saleByMultipleListId = saleByMultipleListId;
                            callBack(clienteNuevo);
                            break;
                        } else {
                            clienteNuevo.DiscountListId = null;
                            clienteNuevo.BonusListId = null;
                            callBack(clienteNuevo);
                            break;
                        }
                    } else {
                        if (j === reglas.rows.length - 1) {
                            clienteNuevo.DiscountListId = null;
                            clienteNuevo.BonusListId = null;
                            callBack(clienteNuevo);
                        }
                    }
                }
            } else {
                clienteNuevo.DiscountListId = null;
                clienteNuevo.BonusListId = null;
                callBack(clienteNuevo);
            }
        }, function (err) {
            ToastThis("error al obtener acuerdo comercial para el cliente: " + err.message);
            clienteNuevo.DiscountListId = null;
            clienteNuevo.BonusListId = null;
            callBack(clienteNuevo);
        });
    } catch (e) {
        ToastThis("error al obtener acuerdo comercial para el cliente: " + err.message);
        clienteNuevo.DiscountListId = null;
        clienteNuevo.BonusListId = null;
        callBack(clienteNuevo);
    }
}

function MostrarListaEmpresas(callback, errCallback) {
    const ownerId = localStorage.getItem('SELLER_OWNER_ID');
    if (ownerId == null) {
        GetCompanies(function(lista) {
            var configuracionDeOpcionesDeOrdenamiento = {
                title: "Empresa Propietaria",
                items: lista,
                doneButtonLabel: "Ok",
                cancelButtonLabel: "Cancelar"
            };
            ShowListPicker(configuracionDeOpcionesDeOrdenamiento, function (item) {
                callback(item);
            });
        }, function(err) {
            errCallback(err);
        });
    }else {
        callback(ownerId);
    }
}