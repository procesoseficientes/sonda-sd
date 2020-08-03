class AsociarTelefonoAFacturaControlador {

    asociarTelefonoAFacturaServicio: AsociarTelefonoAFacturaServicio = new AsociarTelefonoAFacturaServicio();
    parametroDeCantidadDeDigitosDeNumeroTelefonico: any;
    este: AsociarTelefonoAFacturaControlador;

    delegarAsociacionDeTelefonoAFacturaControlador() {
        const este: AsociarTelefonoAFacturaControlador = this;

        $("#UiPagetoAssociatePhoneNumerWithInvoice").on("pageshow",
            () => {
                ParametroServicio.ObtenerParametro("INVOICE",
                    "TELEPHONE_NUMBER_LENGTH",
                    (parametro) => {
                        this.parametroDeCantidadDeDigitosDeNumeroTelefonico = parametro;
                        let uiTxtTelephoneNumber = $("#UiTxtTelephoneNumber");
                        uiTxtTelephoneNumber.attr("maxlength", parseInt(parametro.Value));
                        uiTxtTelephoneNumber.attr("pattern", `[0-9]{${parseInt(parametro.Value)}}`);
                        uiTxtTelephoneNumber.val("");
                        uiTxtTelephoneNumber.focus();
                        uiTxtTelephoneNumber = null;
                    },
                    (err) => {
                        notify("La acción no se puede completar debido a que no se encontró el parámetro necesario.");
                    });
            });

        $("#UiBtnBackFromAssociateTelephoneNumber").on("click",
            () => {
                este.usuarioDeseaVolverAPantallaAnterior();
            });

        $("#UiBtnAssociateTelephoneNumber").on("click",
            () => {
                este.asociarTelefonoAFactura();
            });

    }

    usuarioDeseaVolverAPantallaAnterior() {
        switch ($.mobile.activePage[0].id) {
            case "UiPagetoAssociatePhoneNumerWithInvoice":
                navigator.notification.confirm(
                    "Está seguro de cancelar el proceso? \n",
                    (buttonIndex) => {
                        if (buttonIndex === 2) {
                            ShowInvoiceListPage();
                        }
                    },
                    `Sonda® SD ${SondaVersion}`,
                    ["No", "Si"]
                );
                break;
        }
    }

    asociarTelefonoAFactura() {
        try {
            let uiTxtTelephoneNumber = $("#UiTxtTelephoneNumber");

            if (uiTxtTelephoneNumber.val() === "") {
                notify("Por favor, proporcione el número de teléfono que desea asociar.");
                uiTxtTelephoneNumber.focus();
                uiTxtTelephoneNumber = null;
                return;
            } else if (uiTxtTelephoneNumber.val().length <
                parseInt(this.parametroDeCantidadDeDigitosDeNumeroTelefonico.Value)) {
                notify(`El número de teléfono a asociar debe ser de ${this.parametroDeCantidadDeDigitosDeNumeroTelefonico.Value} caracteres.`);
                uiTxtTelephoneNumber.focus();
                uiTxtTelephoneNumber = null;
                return;
            } else {
                this.asociarTelefonoAFacturaServicio.asociarNumeroDeTelefonoAFactura(gInvoiceNUM,
                    uiTxtTelephoneNumber.val(),
                    (resultado) => {
                        if (resultado.resultado === ResultadoOperacionTipo.Exitoso) {
                            uiTxtTelephoneNumber = null;
                            ToastThis("Número telefónico asociado exitosamente...");
                            EnviarFacturasConNumeroDeTelefonoAsociado(() => {
                                //Facturas con telefono asociado enviadas
                            }, () => {
                                //No se pudieron enviar las facturas con telefono asociado
                            });
                            ShowInvoiceListPage();
                        } else {
                            uiTxtTelephoneNumber = null;
                            notify(resultado.mensaje);
                        }
                    });
            }
        } catch (e) {
            notify("No se puede asociar el número telefónico a la factura debido a: " + e.message);
        }
    }
}