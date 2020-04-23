var SeleccionDeImpresoraControlador = (function () {
    function SeleccionDeImpresoraControlador(mensajero) {
        this.mensajero = mensajero;
        this.isImpresoraZebra = (localStorage.getItem("isPrinterZebra") === "1");
    }
    SeleccionDeImpresoraControlador.prototype.delegarSeleccionDeImpresoraControlador = function () {
        var _this = this;
        var este = this;
        $("#UiPaginaSeleccionDeImpresora").on("pageshow", function () {
            este.llenarListadoDeImpresoras();
        });
        $("#UiBotonRefrescarListado").on("click", function () {
            este.llenarListadoDeImpresoras();
        });
        $("#UiBotonProbarImpresora").on("click", function () {
            var printMacAddress = $("input[name=itemSeleccionDeImpresora]:checked").val();
            if (printMacAddress !== undefined && printMacAddress !== "" && printMacAddress !== null) {
                printMacAddress = null;
                este.probarImpresion();
            }
            else {
                notify("No tiene asociada una impresora");
                printMacAddress = null;
            }
        });
        $("#UiBotonGuardarImpresora").on("click", function () {
            _this.guardarImpresora();
        });
        document.addEventListener("backbutton", function () {
            este.usuarioDeseaRegresarAPaginaAnterior();
        }, true);
    };
    SeleccionDeImpresoraControlador.prototype.usuarioDeseaRegresarAPaginaAnterior = function () {
        switch ($.mobile.activePage[0].id) {
            case "UiPaginaSeleccionDeImpresora":
                window.history.back();
                break;
        }
    };
    SeleccionDeImpresoraControlador.prototype.llenarListadoDeImpresoras = function () {
        var _this = this;
        try {
            $("#UiListaDeImpresorasDisponibles").children().remove("li");
            this.mostrarImagenDeCargar(true);
            window.linkOsPlugin.onPrinterFound = function (discoveredPrinter) {
                var uiListaDeImpresorasDisponibles = $("#UiListaDeImpresorasDisponibles");
                var cadena = "<li>";
                console.log(discoveredPrinter);
                if (discoveredPrinter.address === gPrintAddress) {
                    cadena = cadena + "<input type='radio' name='itemSeleccionDeImpresora' id='item-" + discoveredPrinter.friendlyName + "' value='" + discoveredPrinter.address + "' checked='checked'>";
                }
                else {
                    cadena = cadena + "<input type='radio' name='itemSeleccionDeImpresora' id='item-" + discoveredPrinter.friendlyName + "' value='" + discoveredPrinter.address + "'>";
                }
                cadena = cadena + "<label class='medium' for='item-" + discoveredPrinter.friendlyName + "'>" + discoveredPrinter.friendlyName + "</label>";
                cadena += "</li>";
                uiListaDeImpresorasDisponibles.append(cadena);
                uiListaDeImpresorasDisponibles.listview("refresh");
                uiListaDeImpresorasDisponibles.trigger("create");
                $("#item-" + discoveredPrinter.friendlyName).checkboxradio().checkboxradio("refresh");
                uiListaDeImpresorasDisponibles = null;
            };
            window.linkOsPlugin.findPrinters().then(function (result) {
                _this.mostrarImagenDeCargar(false);
                console.log(result);
            }, function (error) {
                _this.mostrarImagenDeCargar(false);
                console.log(error);
            });
        }
        catch (ex) {
            notify(ex.message);
        }
    };
    SeleccionDeImpresoraControlador.prototype.mostrarImagenDeCargar = function (mostrar) {
        $.mobile.loading((mostrar) ? "show" : "hide", {
            text: "Buscando Impresoras...",
            textVisible: true,
            theme: "z",
            html: ""
        });
    };
    SeleccionDeImpresoraControlador.prototype.probarImpresion = function () {
        var _this = this;
        try {
            my_dialog("", "", "close");
            my_dialog("Espere...", "validando impresora", "open");
            var macAddress = $("input[name=itemSeleccionDeImpresora]:checked").val();
            var impresionServicio = new ImpresionServicio();
            impresionServicio.impresionDePrueba(this.isImpresoraZebra, macAddress, function (resultado) {
                my_dialog("", "", "close");
                if (resultado.resultado === ResultadoOperacionTipo.Error) {
                    if (!_this.isImpresoraZebra) {
                        notify(resultado.mensaje);
                    }
                }
            });
        }
        catch (ex) {
            notify(ex.message);
        }
    };
    SeleccionDeImpresoraControlador.prototype.guardarImpresora = function () {
        try {
            var macAddress = $("input[name=itemSeleccionDeImpresora]:checked").val();
            if (macAddress !== "" && macAddress !== undefined && macAddress !== null) {
                gPrintAddress = macAddress;
                localStorage.setItem('PRINTER_ADDRESS', gPrintAddress);
                this.usuarioDeseaRegresarAPaginaAnterior();
            }
            else {
                this.usuarioDeseaRegresarAPaginaAnterior();
            }
        }
        catch (ex) {
            notify(ex.message);
        }
    };
    return SeleccionDeImpresoraControlador;
}());
//# sourceMappingURL=SeleccionDeImpresoraControlador.js.map