var AsociarTelefonoAFacturaControlador = (function () {
    function AsociarTelefonoAFacturaControlador() {
        this.asociarTelefonoAFacturaServicio = new AsociarTelefonoAFacturaServicio();
    }
    AsociarTelefonoAFacturaControlador.prototype.delegarAsociacionDeTelefonoAFacturaControlador = function () {
        var _this_1 = this;
        var este = this;
        $("#UiPagetoAssociatePhoneNumerWithInvoice").on("pageshow", function () {
            ParametroServicio.ObtenerParametro("INVOICE", "TELEPHONE_NUMBER_LENGTH", function (parametro) {
                _this_1.parametroDeCantidadDeDigitosDeNumeroTelefonico = parametro;
                var uiTxtTelephoneNumber = $("#UiTxtTelephoneNumber");
                uiTxtTelephoneNumber.attr("maxlength", parseInt(parametro.Value));
                uiTxtTelephoneNumber.attr("pattern", "[0-9]{" + parseInt(parametro.Value) + "}");
                uiTxtTelephoneNumber.val("");
                uiTxtTelephoneNumber.focus();
                uiTxtTelephoneNumber = null;
            }, function (err) {
                notify("La acción no se puede completar debido a que no se encontró el parámetro necesario.");
            });
        });
        $("#UiBtnBackFromAssociateTelephoneNumber").on("click", function () {
            este.usuarioDeseaVolverAPantallaAnterior();
        });
        $("#UiBtnAssociateTelephoneNumber").on("click", function () {
            este.asociarTelefonoAFactura();
        });
    };
    AsociarTelefonoAFacturaControlador.prototype.usuarioDeseaVolverAPantallaAnterior = function () {
        switch ($.mobile.activePage[0].id) {
            case "UiPagetoAssociatePhoneNumerWithInvoice":
                navigator.notification.confirm("Está seguro de cancelar el proceso? \n", function (buttonIndex) {
                    if (buttonIndex === 2) {
                        ShowInvoiceListPage();
                    }
                }, "Sonda\u00AE SD " + SondaVersion, ["No", "Si"]);
                break;
        }
    };
    AsociarTelefonoAFacturaControlador.prototype.asociarTelefonoAFactura = function () {
        try {
            var uiTxtTelephoneNumber_1 = $("#UiTxtTelephoneNumber");
            if (uiTxtTelephoneNumber_1.val() === "") {
                notify("Por favor, proporcione el número de teléfono que desea asociar.");
                uiTxtTelephoneNumber_1.focus();
                uiTxtTelephoneNumber_1 = null;
                return;
            }
            else if (uiTxtTelephoneNumber_1.val().length <
                parseInt(this.parametroDeCantidadDeDigitosDeNumeroTelefonico.Value)) {
                notify("El n\u00FAmero de tel\u00E9fono a asociar debe ser de " + this.parametroDeCantidadDeDigitosDeNumeroTelefonico.Value + " caracteres.");
                uiTxtTelephoneNumber_1.focus();
                uiTxtTelephoneNumber_1 = null;
                return;
            }
            else {
                this.asociarTelefonoAFacturaServicio.asociarNumeroDeTelefonoAFactura(gInvoiceNUM, uiTxtTelephoneNumber_1.val(), function (resultado) {
                    if (resultado.resultado === ResultadoOperacionTipo.Exitoso) {
                        uiTxtTelephoneNumber_1 = null;
                        ToastThis("Número telefónico asociado exitosamente...");
                        EnviarFacturasConNumeroDeTelefonoAsociado(function () {
                        }, function () {
                        });
                        ShowInvoiceListPage();
                    }
                    else {
                        uiTxtTelephoneNumber_1 = null;
                        notify(resultado.mensaje);
                    }
                });
            }
        }
        catch (e) {
            notify("No se puede asociar el número telefónico a la factura debido a: " + e.message);
        }
    };
    return AsociarTelefonoAFacturaControlador;
}());
//# sourceMappingURL=AsociarTelefonoAFacturaControlador.js.map