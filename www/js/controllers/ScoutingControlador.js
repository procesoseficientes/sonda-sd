var ScoutingControlador = (function () {
    function ScoutingControlador(mensajero) {
        this.mensajero = mensajero;
        this.cliente = new Cliente();
        this.clienteServicio = new ClienteServicio();
        this.reglaServicio = new ReglaServicio();
        this.etiquetaServicio = new EtiquetaServicio();
    }
    ScoutingControlador.prototype.delegarScoutingControlador = function () {
        var este = this;
        $("#UiScoutingPage").on("pageshow", function () {
            este.cliente = new Cliente();
            my_dialog("Espere", "Por favor, espere...", "open");
            $('input[data-type="search"]').val("");
            este.limpiarCamposDeScouting(function () {
                este.reglaServicio.obtenerRegla(ReglaTipo.Scouting.toString(), function (reglasDeScouting) {
                    este.reglasDeScouting = reglasDeScouting;
                    este.cargarEtiquetasParaNuevoCliente(function () {
                        DispositivoServicio.obtenerUbicacion(function () {
                            my_dialog("", "", "close");
                        });
                    }, function (resultado) {
                        my_dialog("", "", "close");
                        notify(resultado.mensaje);
                    });
                }, function (error) {
                    my_dialog("", "", "close");
                    notify(error);
                });
            });
        });
        $("#UiBtnBackFromScoutingPage").on("click", function () {
            este.usuarioDeseaVolverAPantallaAnterior();
        });
        $("#UiBtnTituloDeScouting").on("click", function () {
            notify("Ingreso de prospecto de cliente");
        });
        $("#UiBtnSaveScouting").on("click", function () {
            este.recogerDatosDeNuevoClienteYGuardarlo(este);
        });
        $("#UiBtnShowScoutingPage").on("click", function () {
            $.mobile.changePage("#UiScoutingPage", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        });
        $("#UiBtnTakePicture1Scouting").on("click", function () {
            DispositivoServicio.TomarFoto(function (imgUrl) {
                var imgOneScouting = $("#UiImg1Scouting");
                este.cliente.photo1 = "data:image/jpeg;base64," + imgUrl;
                imgOneScouting.attr("src", "data:image/jpeg;base64," + imgUrl);
                imgOneScouting.css("display", "block");
                imgOneScouting = null;
            }, function (err) {
                notify(err);
            });
        });
        $("#UiBtnClearPicture1Scouting").on("click", function () {
            var imgOneScouting = $("#UiImg1Scouting");
            imgOneScouting.attr("src", "");
            imgOneScouting.css("display", "none");
            imgOneScouting = null;
            este.cliente.photo1 = "";
        });
        $("#UiBtnTakePicture2Scouting").on("click", function () {
            DispositivoServicio.TomarFoto(function (imgUrl) {
                var imgTwoScouting = $("#UiImg2Scouting");
                este.cliente.photo2 = "data:image/jpeg;base64," + imgUrl;
                imgTwoScouting.attr("src", "data:image/jpeg;base64," + imgUrl);
                imgTwoScouting.css("display", "block");
                imgTwoScouting = null;
            }, function (err) {
                notify(err);
            });
        });
        $("#UiBtnClearPicture2Scouting").on("click", function () {
            var imgTwoScouting = $("#UiImg2Scouting");
            imgTwoScouting.attr("src", "");
            imgTwoScouting.css("display", "none");
            imgTwoScouting = null;
            este.cliente.photo2 = "";
        });
        $("#UiBtnTakePicture3Scouting").on("click", function () {
            DispositivoServicio.TomarFoto(function (imgUrl) {
                var imgThreeScouting = $("#UiImg3Scouting");
                este.cliente.photo3 = "data:image/jpeg;base64," + imgUrl;
                imgThreeScouting.attr("src", "data:image/jpeg;base64," + imgUrl);
                imgThreeScouting.css("display", "block");
                imgThreeScouting = null;
            }, function (err) {
                notify(err);
            });
        });
        $("#UiBtnClearPicture3Scouting").on("click", function () {
            var imgThreeScouting = $("#UiImg3Scouting");
            imgThreeScouting.attr("src", "");
            imgThreeScouting.css("display", "none");
            imgThreeScouting = null;
            este.cliente.photo3 = "";
        });
        $("#UiTxtNameScouting").on("paste keyup", function () {
            $("#UiTxtNameContactScouting").val($("#UiTxtNameScouting").val());
            $("#UiTxtTaxInviceName").val($("#UiTxtNameScouting").val());
        });
        $("#UiTxtDirectionScouting").on("paste keyup", function () {
            $("#UiTxtTaxAddress").val($("#UiTxtDirectionScouting").val());
        });
    };
    ScoutingControlador.prototype.limpiarCamposDeScouting = function (callback) {
        var nameScouting = $("#UiTxtNameScouting");
        var taxidScouting = $("#UiTxtTaxIdScouting");
        var directionScouting = $("#UiTxtDirectionScouting");
        var nameContactScouting = $("#UiTxtNameContactScouting");
        var telephoneContactScouting = $("#UiTxtTelephoneContactScouting");
        var invoiceNameScouting = $("#UiTxtTaxInviceName");
        var invoiceAddressScouting = $("#UiTxtTaxAddress");
        var imgOneScouting = $("#UiImg1Scouting");
        var imgTwoScouting = $("#UiImg2Scouting");
        var imgThreeScouting = $("#UiImg3Scouting");
        var uiLabelTaxId = $("#UiLabelTaxId");
        var etiquetaDeImpuesto = localStorage.getItem("TAX_ID");
        nameScouting.val("");
        taxidScouting.val("C/F");
        taxidScouting.attr("placeholder", etiquetaDeImpuesto);
        uiLabelTaxId.text(etiquetaDeImpuesto);
        directionScouting.val("");
        nameContactScouting.val("");
        telephoneContactScouting.val("");
        invoiceNameScouting.val("");
        invoiceAddressScouting.val("");
        invoiceAddressScouting.val("");
        imgOneScouting.attr("src", "");
        imgOneScouting.css("display", "none");
        imgTwoScouting.attr("src", "");
        imgTwoScouting.css("display", "none");
        imgThreeScouting.attr("src", "");
        imgThreeScouting.css("display", "none");
        nameScouting.focus();
        nameScouting = null;
        taxidScouting = null;
        directionScouting = null;
        nameContactScouting = null;
        telephoneContactScouting = null;
        invoiceNameScouting = null;
        invoiceAddressScouting = null;
        imgOneScouting = null;
        imgTwoScouting = null;
        imgThreeScouting = null;
        uiLabelTaxId = null;
        callback();
    };
    ScoutingControlador.prototype.usuarioDeseaVolverAPantallaAnterior = function () {
        var este = this;
        switch ($.mobile.activePage[0].id) {
            case "UiScoutingPage":
                navigator.notification.confirm("Esta seguro de cancelar el scouting? \n", function (buttonIndex) {
                    if (buttonIndex === 2) {
                        este.limpiarCamposDeScouting(function () {
                            $.mobile.changePage("#menu_page", {
                                transition: "flow",
                                reverse: true,
                                changeHash: true,
                                showLoadMsg: false
                            });
                        });
                    }
                }, "Sonda\u00AE SD " + SondaVersion, ["No", "Si"]);
                break;
        }
    };
    ScoutingControlador.prototype.recolectarInformacionBasicaDeNuevoCliente = function (callback, errorCallback) {
        var _this = this;
        try {
            PagoConsignacionesServicio
                .ValidarSequenciaDeDocumentos(SecuenciaDeDocumentoTipo.Scouting, function (isValidSequence) {
                if (isValidSequence) {
                    PagoConsignacionesServicio
                        .ObtenerSiguienteSecuenciaDeDocumento(SecuenciaDeDocumentoTipo.Scouting, function (docSerie, docNum) {
                        GetNexSequence("SCOUTING", function (seq) {
                            var nameClient = $("#UiTxtNameScouting");
                            var taxIdClient = $("#UiTxtTaxIdScouting");
                            var addressClient = $("#UiTxtDirectionScouting");
                            var contactNameClient = $("#UiTxtNameContactScouting");
                            var telephoneContactNameClient = $("#UiTxtTelephoneContactScouting");
                            var invoiceNameClient = $("#UiTxtTaxInviceName");
                            var invoiceAddressClient = $("#UiTxtTaxAddress");
                            var imgOneClient = $("#UiImg1Scouting");
                            var imgTwoClient = $("#UiImg2Scouting");
                            var imgThreeClient = $("#UiImg3Scouting");
                            _this.cliente.clientId = seq;
                            _this.cliente.clientHhIdOld = seq;
                            _this.cliente.docSerie = docSerie;
                            _this.cliente.docNum = docNum;
                            _this.cliente.gps = gCurrentGPS;
                            if (nameClient.val() === "") {
                                $("#UiTxtNameScouting").focus();
                                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "Debe proporcionar el nombre del cliente." });
                                return;
                            }
                            else {
                                _this.cliente.clientName = nameClient.val();
                            }
                            _this.cliente.clientTaxId = taxIdClient.val();
                            _this.cliente.address = addressClient.val() === "" ? "..." : addressClient.val();
                            _this.cliente.contactCustomer = contactNameClient.val() === "" ? "..." : contactNameClient.val();
                            _this.cliente.contactPhone = telephoneContactNameClient.val() === "" ? "..." : telephoneContactNameClient.val();
                            _this.cliente.billingName = invoiceNameClient.val();
                            _this.cliente.billingAddress = invoiceAddressClient.val();
                            _this.cliente.photo1 = imgOneClient.attr("src");
                            _this.cliente.photo2 = imgTwoClient.attr("src");
                            _this.cliente.photo3 = imgThreeClient.attr("src");
                            nameClient = null;
                            taxIdClient = null;
                            addressClient = null;
                            contactNameClient = null;
                            telephoneContactNameClient = null;
                            invoiceNameClient = null;
                            invoiceAddressClient = null;
                            imgOneClient = null;
                            imgTwoClient = null;
                            imgThreeClient = null;
                            callback(_this.cliente);
                        }, function (err) {
                            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: err.message });
                            return;
                        });
                    }, function (error) {
                        errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error });
                        return;
                    });
                }
                else {
                    errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: "No tiene una secuencia valida para crear el nuevo cliente, por favor, comuníquese con su Administrador." });
                    return;
                }
            }, function (error) {
                errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: error });
                return;
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
            return;
        }
    };
    ScoutingControlador.prototype.recolectarInformacionDeEtiquetasDeNuevoCliente = function (cliente, callback, errorCallback) {
        try {
            var contenedorDeEtiquetas = $('input[type=checkbox]:checked');
            var etiquetasDeCliente = new Array();
            if (contenedorDeEtiquetas) {
                etiquetasDeCliente = contenedorDeEtiquetas.map(function (index, element) {
                    var control = element;
                    return { tagColor: $(control).attr("id"), docSerieClient: cliente.docSerie, docNumClient: cliente.docNum };
                }).get();
                cliente.tags = etiquetasDeCliente;
                callback(cliente);
                contenedorDeEtiquetas = null;
            }
            else {
                cliente.tags = etiquetasDeCliente;
                callback(cliente);
            }
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
            return;
        }
    };
    ScoutingControlador.prototype.recogerDatosDeNuevoClienteYGuardarlo = function (este) {
        este.recolectarInformacionBasicaDeNuevoCliente(function (clienteTemp) {
            este.recolectarInformacionDeEtiquetasDeNuevoCliente(clienteTemp, function (clienteCompleto) {
                este.validarReglasDeScouting(clienteCompleto, este.reglasDeScouting, 0, function (clienteRetornado) {
                    este.clienteServicio.guardarScouting(clienteRetornado, function (clienteCompletoRegresado) {
                        este.limpiarCamposDeScouting(function () {
                            ToastThis("Cliente guardado exitosamente...");
                            EnviarData();
                            $.mobile.changePage("#menu_page", {
                                transition: "flow",
                                reverse: true,
                                changeHash: true,
                                showLoadMsg: false
                            });
                        });
                    }, function (resultado) {
                        notify(resultado.mensaje);
                    });
                }, function (resultado) {
                    notify(resultado.mensaje);
                });
            }, function (resultado) {
                notify(resultado.mensaje);
            });
        }, function (resultado) {
            notify(resultado.mensaje);
        });
    };
    ScoutingControlador.prototype.validarReglasDeScouting = function (cliente, reglasDeScouting, indiceDeReglaActual, callback, errorCallback) {
        var este = this;
        try {
            if (reglasDeScouting == null) {
                callback(cliente);
                return;
            }
            if (indiceDeReglaActual < reglasDeScouting.rows.length) {
                var reglaAct = reglasDeScouting.rows.item(indiceDeReglaActual);
                switch (reglaAct.TYPE_ACTION) {
                    case "FotografiaObligatoria":
                        if (reglaAct.ENABLED.toUpperCase() === "SI") {
                            if (cliente.photo1 === "" && cliente.photo2 === "" && cliente.photo3 === "") {
                                throw new Error("Debe tomar como mínimo dos fotografías");
                            }
                            else if (cliente.photo1 === "" && cliente.photo2 === "") {
                                throw new Error("Debe tomar como mínimo dos fotografías");
                            }
                            else if (cliente.photo2 === "" && cliente.photo3 === "") {
                                throw new Error("Debe tomar como mínimo dos fotografías");
                            }
                            else if (cliente.photo1 === "" && cliente.photo3 === "") {
                                throw new Error("Debe tomar como mínimo dos fotografías");
                            }
                            else {
                                callback(cliente);
                            }
                        }
                        else {
                            callback(cliente);
                        }
                        break;
                    default:
                        este.validarReglasDeScouting(cliente, reglasDeScouting, indiceDeReglaActual + 1, function (clienteReturn) {
                            callback(clienteReturn);
                        }, function (resultado) {
                            errorCallback(resultado);
                        });
                        break;
                }
            }
            else {
                callback(cliente);
            }
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
            return;
        }
    };
    ScoutingControlador.prototype.cargarEtiquetasParaNuevoCliente = function (callback, errorCallback) {
        var este = this;
        try {
            este.etiquetaServicio.obtenerEtiquetas(function (etiquetas) {
                var li = "";
                var contenedorEtiquetas = $("#UiListTagsForScouting");
                contenedorEtiquetas.children().remove("li");
                etiquetas.map(function (etiqueta) {
                    li += "<li>";
                    li += "<label for=\"" + etiqueta.tagColor + "\">" + etiqueta.tagValueText + "</label>";
                    li += "<input type=\"checkbox\" id=\"" + etiqueta.tagColor + "\">";
                    li += "</li>";
                });
                if (li !== "") {
                    contenedorEtiquetas.append(li);
                    contenedorEtiquetas.listview("refresh");
                    contenedorEtiquetas.trigger("create");
                    contenedorEtiquetas = null;
                    callback();
                }
                else {
                    contenedorEtiquetas = null;
                    callback();
                }
            }, function (resultado) {
                errorCallback(resultado);
                return;
            });
        }
        catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    return ScoutingControlador;
}());
//# sourceMappingURL=ScoutingControlador.js.map