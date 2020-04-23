class SeleccionDeImpresoraControlador {

    isImpresoraZebra = (localStorage.getItem("isPrinterZebra") === "1");

    constructor(public mensajero: Messenger) {

    }

    delegarSeleccionDeImpresoraControlador() {

        const este = this;

        $("#UiPaginaSeleccionDeImpresora").on("pageshow", () => {
            este.llenarListadoDeImpresoras();
        });

        $("#UiBotonRefrescarListado").on("click", () => {
            este.llenarListadoDeImpresoras();
        });

        $("#UiBotonProbarImpresora").on("click", () => {
            var printMacAddress = $("input[name=itemSeleccionDeImpresora]:checked").val();
            if (printMacAddress !== undefined && printMacAddress !== "" && printMacAddress !== null) {
                printMacAddress = null;
                este.probarImpresion();
            } else {
                notify("No tiene asociada una impresora");
                printMacAddress = null;
            }

            
        });

        $("#UiBotonGuardarImpresora").on("click", () => {
            this.guardarImpresora();
        });

        document.addEventListener("backbutton", () => {
            este.usuarioDeseaRegresarAPaginaAnterior();
        }, true);
    }


    usuarioDeseaRegresarAPaginaAnterior() {
        switch ($.mobile.activePage[0].id) {
            case "UiPaginaSeleccionDeImpresora":
                window.history.back();
                break;
        }
    }
   

    llenarListadoDeImpresoras() {
        try {
            $("#UiListaDeImpresorasDisponibles").children().remove("li");
            this.mostrarImagenDeCargar(true);
            // ReSharper disable TsNotResolved
            window.linkOsPlugin.onPrinterFound = (discoveredPrinter) => {
                // ReSharper restore TsNotResolved
                let uiListaDeImpresorasDisponibles = $("#UiListaDeImpresorasDisponibles");
                let cadena: string = "<li>";
                console.log(discoveredPrinter); //{friendlyName: "XXXXJ141900406", address: "AC:3F:A4:19:C9:7E"}
                //ToastThis("I found the next printer " + discoveredPrinter.address);
                if (discoveredPrinter.address === gPrintAddress) {
                    cadena = cadena + "<input type='radio' name='itemSeleccionDeImpresora' id='item-" + discoveredPrinter.friendlyName + "' value='" + discoveredPrinter.address + "' checked='checked'>";
                } else {
                    cadena = cadena + "<input type='radio' name='itemSeleccionDeImpresora' id='item-" + discoveredPrinter.friendlyName + "' value='" + discoveredPrinter.address + "'>";
                }

                cadena = cadena + "<label class='medium' for='item-" + discoveredPrinter.friendlyName + "'>" + discoveredPrinter.friendlyName + "</label>";
                cadena += "</li>";
                uiListaDeImpresorasDisponibles.append(cadena);
                uiListaDeImpresorasDisponibles.listview("refresh");
                uiListaDeImpresorasDisponibles.trigger("create");

                $("#item-" + discoveredPrinter.friendlyName).checkboxradio().checkboxradio("refresh");
                uiListaDeImpresorasDisponibles = null;
            }

            //buscar impresoras 
            // ReSharper disable TsNotResolved
            window.linkOsPlugin.findPrinters().then((result) => {
                // ReSharper restore TsNotResolved
                //termina la busqueda   
                this.mostrarImagenDeCargar(false);
                console.log(result);
            }, (error) => {
                //error al tratar de buscar
                this.mostrarImagenDeCargar(false);
                console.log(error);
            });
        } catch (ex) {
            notify(ex.message);
        }
    }

    mostrarImagenDeCargar(mostrar: boolean) {
        $.mobile.loading((mostrar) ? "show": "hide", {
            text: "Buscando Impresoras...",
            textVisible: true,
            theme: "z",
            html: ""
        });
    }

    probarImpresion() {
        try {
            my_dialog("", "", "close");
            my_dialog("Espere...", "validando impresora", "open");
            const macAddress: string = $("input[name=itemSeleccionDeImpresora]:checked").val();
            const impresionServicio = new ImpresionServicio();
            impresionServicio.impresionDePrueba(this.isImpresoraZebra, macAddress, (resultado: Operacion) => {
                my_dialog("", "", "close");
                if (resultado.resultado === ResultadoOperacionTipo.Error) {
                    if (!this.isImpresoraZebra) {
                        notify(resultado.mensaje);
                    }
                }
            });

        } catch (ex) {
            notify(ex.message);
        } 
    }

    guardarImpresora() {
        try {
            const macAddress = $("input[name=itemSeleccionDeImpresora]:checked").val();

            if (macAddress !== "" && macAddress !== undefined && macAddress !== null) {
                gPrintAddress = macAddress;
                localStorage.setItem('PRINTER_ADDRESS', gPrintAddress);
                this.usuarioDeseaRegresarAPaginaAnterior();
            } else {
                this.usuarioDeseaRegresarAPaginaAnterior();
            }
        } catch (ex) {
            notify(ex.message);
        } 
    }


}