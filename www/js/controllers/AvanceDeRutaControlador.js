var AvanceDeRutaControlador = (function () {
    function AvanceDeRutaControlador() {
        this.ordenDeVentaServicio = new OrdenDeVentaServicio();
        this.configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
    }
    AvanceDeRutaControlador.prototype.delegarAvanceDeRutaControlador = function () {
        var este = this;
        document.addEventListener("backbutton", function () {
            este.mostrarPantallaAnterior();
        }, true);
        $("#UiBotonConsultarAvanceDeRuta").bind("touchstart", function () {
            este.usuarioDeseaVerConsultaDeAvanceDeRuta();
        });
        $(document).on("pagebeforechange", function (event, data) {
            if (data.toPage === "UiPaginaAvanceDeRuta") {
                este.cargarPantalla();
                $.mobile.changePage("#UiPaginaAvanceDeRuta");
            }
        });
    };
    AvanceDeRutaControlador.prototype.mostrarPantallaAnterior = function () {
        switch ($.mobile.activePage[0].id) {
            case "UiPaginaAvanceDeRuta":
                window.history.back();
                break;
        }
    };
    AvanceDeRutaControlador.prototype.usuarioDeseaVerConsultaDeAvanceDeRuta = function () {
        try {
            var _this = this;
            $.mobile.changePage("UiPaginaAvanceDeRuta", {
                transition: "flow",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        }
        catch (err) {
            notify("Error al mostrar la consulta avance de ruta: " + err.message);
            my_dialog("", "", "closed");
        }
    };
    AvanceDeRutaControlador.prototype.cargarPantalla = function () {
        var _this = this;
        try {
            this.configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function (decimales) {
                _this.configuracionDecimales = decimales;
                _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerCantidadDeTotalDeOrdenDeVenta(), function (total) {
                    var uiEtiquetaDeTituloTotalDePedidos = $('#UiEtiquetaDeTituloTotalDePedidos');
                    uiEtiquetaDeTituloTotalDePedidos.text('Total CD(' + total + ')');
                    uiEtiquetaDeTituloTotalDePedidos = null;
                    _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerTotalDeOrdenDeVenta(), function (total) {
                        var uiEtiquetaARTotalDePedidos = $('#UiEtiquetaARTotalDePedidos');
                        uiEtiquetaARTotalDePedidos.text(format_number(total, _this.configuracionDecimales.defaultDisplayDecimals));
                        uiEtiquetaARTotalDePedidos = null;
                        _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerTotalDeClientesAVisitar(), function (total) {
                            var totalClientesAVisitar = total;
                            _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerTotalDeClientesConVisitados(), function (total) {
                                var uiEtiquetaARTotalClientesVisitados = $('#UiEtiquetaARTotalClientesVisitados');
                                uiEtiquetaARTotalClientesVisitados.text(total + '/' + totalClientesAVisitar);
                                uiEtiquetaARTotalClientesVisitados = null;
                                _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerTotalDeTareasSinGestion(), function (total) {
                                    var uiEtiquetaARTotalTareasSinGestion = $('#UiEtiquetaARTotalTareasSinGestion');
                                    uiEtiquetaARTotalTareasSinGestion.text(total);
                                    uiEtiquetaARTotalTareasSinGestion = null;
                                    _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerTotalDeTareasFueraPlanDeRuta(), function (total) {
                                        var uiEtiquetaARTotalDeTareasFueraPlanDeRuta = $('#UiEtiquetaARTotalDeTareasFueraPlanDeRuta');
                                        uiEtiquetaARTotalDeTareasFueraPlanDeRuta.text(total);
                                        uiEtiquetaARTotalDeTareasFueraPlanDeRuta = null;
                                        _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerTotalClientesNuevos(), function (total) {
                                            var uiEtiquetaARTotalClientesNuevos = $('#UiEtiquetaARTotalClientesNuevos');
                                            uiEtiquetaARTotalClientesNuevos.text(total);
                                            uiEtiquetaARTotalClientesNuevos = null;
                                            _this.ordenDeVentaServicio.ObtenerTotalesParaEstadoDeRuta(_this.ordenDeVentaServicio.ObtenerTotalSinDescuentoDeOrdenDeVenta(), function (total) {
                                                var uiEtiquetaARTotalDePedidosSinDescuento = $('#UiEtiquetaARTotalDePedidosSinDescuento');
                                                uiEtiquetaARTotalDePedidosSinDescuento.text(format_number(total, _this.configuracionDecimales.defaultDisplayDecimals));
                                                uiEtiquetaARTotalDePedidosSinDescuento = null;
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
            }, function (operacion) {
                notify(operacion.mensaje);
            });
        }
        catch (err) {
            notify("Error al cargar la pantalla: " + err.message);
            my_dialog("", "", "closed");
        }
    };
    return AvanceDeRutaControlador;
}());
//# sourceMappingURL=AvanceDeRutaControlador.js.map