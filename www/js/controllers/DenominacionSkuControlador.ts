class DenominacionSkuControlador {
    //----------Propiedades----------//
    sku: Sku = new Sku();
    paquetes: Paquete[] = [];
    cliente: Cliente = new Cliente();
    tarea: Tarea = new Tarea();
    configuracionDeDecimales: ManejoDeDecimales = new ManejoDeDecimales();
    paqueteSeleccionadoActual: Paquete = new Paquete();
    descuentoActual: DescuentoPorEscalaSku = new DescuentoPorEscalaSku();
    estaAgregandoSku: boolean = false;
    listaDeSku: Sku[] = [];
    listaDeSkuDeBonificacion: Sku[] = [];
    listaDeBonificaciones: Bono[] = [];
    usuarioPuedeModificarBonificacion: boolean = true;
    listaDeDescuento: DescuentoPorEscalaSku[] = [];
    usuarioPuedeModificarDescuentos: boolean = false;
    estaValidandoElDescuento: boolean = false;
    listaHistoricoDePromos: Promo[] = [];
    descuentoPorMontoGeneral: DescuentoPorMontoGeneral = new DescuentoPorMontoGeneral();
    usuarioEstaRegresandoAPantallaAnterior : boolean = false;
    descuentoPorMontoGeneralYFamilia: DescuentoPorMontoGeneralYFamilia = new DescuentoPorMontoGeneralYFamilia();
    descuentoPorFamiliaYTipoPago: DescuentoPorFamiliaYTipoPago = new DescuentoPorFamiliaYTipoPago();
    listaDeSkuOrdenDeVenta: Sku[] = [];

    //----------Fin Propiedades----------//

    //----------Servicios----------//
    paqueteServicio: PaqueteServicio = new PaqueteServicio();
    historicoDeArticuloServicio: HistoricoDeArticuloServicio = new HistoricoDeArticuloServicio();
    precioSkuServicio: PrecioSkuServicio = new PrecioSkuServicio();
    tareaServicio: TareaServcio = new TareaServcio();
    clienteServicio: ClienteServicio = new ClienteServicio();
    bonoServicio: BonoServicio = new BonoServicio();
    ventasPorMultiploServicio: VentasPorMultiploServicio = new VentasPorMultiploServicio();
    descuentoServicio: DescuentoServicio = new DescuentoServicio();
    promoServicio: PromoServicio = new PromoServicio();
    //----------Fin Servicios----------//

    //----------Constructor y Delegados----------//
    constructor(public mensajero: Messenger) {

    }



    delegarDenominacionSkuControlador() {
        let este: DenominacionSkuControlador = this;

        document.addEventListener("backbutton", () => {
            este.usuarioEstaRegresandoAPantallaAnterior = true;
            este.mostrarPantallaAnterior();
        }, true);

        $(document).on("pagebeforechange",
            (event, data) => {
                if (data.toPage === "skucant_page") {
                    este.cliente = data.options.data.cliente;
                    este.tarea = data.options.data.tarea; //data.options.data.tarea;
                    este.sku = data.options.data.sku;
                    este.estaAgregandoSku = data.options.data.estaAgregando;
                    este.configuracionDeDecimales = data.options.data.configuracionDecimales;
                    este.listaDeSku = <Array<Sku>>JSON.parse(JSON.stringify(data.options.data.listaSku));
                    este.listaDeSkuDeBonificacion = <Array<Sku>>JSON.parse(JSON.stringify(data.options.data.listaDeSkuParaBonificacion));
                    este.usuarioEstaRegresandoAPantallaAnterior = false; 
                    este.listaDeSkuOrdenDeVenta = data.options.data.listaDeSkuOrdenDeVenta
                    este.cargarPantalla();
                    $.mobile.changePage("#skucant_page");
                }
            });

        $("#skucant_page").on("pageshow",
            (e: JQueryEventObject) => {
                e.preventDefault();
                let textoCantidadSku = $("#UiTextoCantidadUnidadMedida");

                textoCantidadSku.focus();
                textoCantidadSku = null;
            });

        $("#UiBotonListadoDeUnidadesDeMedida").bind("touchstart", () => {
            este.usuarioSeleccionoPaquete();
        });

        $("#UiBotonAceptarCantidadSku").bind("touchstart", () => {
            BloquearPantalla();
            este.usuarioCambioCantidaDePaquete(() => {
                este.estaValidandoElDescuento = true;
                este.validarBonificacionesIngresadas(() => {
                    este.validarIngresoDeDescuento((resultado: Operacion) => {
                        notify(resultado.mensaje);
                        DesBloquearPantalla();
                        este.estaValidandoElDescuento = false;
                    }, () => {
                        este.estaValidandoElDescuento = false;
                        este.usuarioDeseaAceptarElSku();
                    });
                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                    DesBloquearPantalla();
                });
            });
        });

        $("#UiTextoCantidadUnidadMedida").on("focusout", () => {
            if (!este.usuarioEstaRegresandoAPantallaAnterior) {
                if (!este.estaValidandoElDescuento) {
                    este.usuarioCambioCantidaDePaquete(() => {
                        este.validarBonificacionesIngresadas(() => {
                            este.validarIngresoDeDescuento((resultado: Operacion) => {
                                notify(resultado.mensaje);
                            });
                        }, (resultado: Operacion) => {
                            notify(resultado.mensaje);
                        });
                    });
                }
            }
        });

        $("#skucant_page").bind("swiperight", () => {
            este.usuarioDeseaVerResumenDelSku();
        });

        $("#UiTextoDescuentoSku").on("focusout", () => {
            este.validarIngresoDeDescuento(() => {
                DesBloquearPantalla();
            });
        });

        $("#UiTextoCantidadUnidadMedida").on("keypress", e => {
            if (e.keyCode === 13) {

                e.preventDefault();

                let UiBotonAceptarCantidadSku = $("#UiBotonAceptarCantidadSku");
                UiBotonAceptarCantidadSku.focus();
                UiBotonAceptarCantidadSku.trigger("keyup");
                UiBotonAceptarCantidadSku = null;                
            }
        });
    }
    //----------Fin Constructor y Delegados----------//

    //----------Carga de Pantallas----------//
    cargarPantalla() {
        try {
            my_dialog("Espere", "Preparando información, por favor espere...", "open");
            let uiEtiquetaCodigoYNombreDeSku = $("#UiEtiquetaCodigoYNombreDeSku");
            uiEtiquetaCodigoYNombreDeSku.text(`${this.sku.sku}/${this.sku.skuDescription}`);
            uiEtiquetaCodigoYNombreDeSku = null;
            this.generarListadoDePaquetes(() => {
                this.obtenerHistoricodePromo(() => {
                    this.cargarBonificaciones(() => {
                        this.cargarDescuentos(() => {
                            if (this.estaAgregandoSku) {
                                this.seleccionarPrimerPaquete();
                                my_dialog("", "", "close");
                            } else {
                                this.cargarListaSkuAPaquetes(() => {
                                    this.procesarPaquetes(this.paquetes, (paquetes: Paquete[]) => {
                                        this.paquetes = paquetes;
                                        this.cargarListaDeSkuBonficadas(() => {
                                            this.obtenerBonificacionesDelPaqueteSeleccionado((listaBonificaciones: Bono[]) => {
                                                this.cargarControlesBonificaciones(listaBonificaciones, () => {
                                                    this.cargarControlesDeDescuento(() => {
                                                        this.obtenerTotalDePaquetesConDescuentoAplicados(false, (total: number) => {
                                                            this.tarea.salesOrderTotal -= total;
                                                            this.cargarDatosDelPaqueteSeleccionado(() => {
                                                                my_dialog("", "", "close");
                                                            });
                                                        }, (resultado: Operacion) => {
                                                            my_dialog("", "", "close");
                                                            notify(resultado.mensaje);
                                                        });
                                                    }, (resultado: Operacion) => {
                                                        my_dialog("", "", "close");
                                                        notify(resultado.mensaje);
                                                    });
                                                }, (resultado: Operacion) => {
                                                    notify(resultado.mensaje);
                                                });
                                            }, (resultado: Operacion) => {
                                                notify(resultado.mensaje);
                                            });
                                        }, (resultado: Operacion) => {
                                            my_dialog("", "", "close");
                                            notify(resultado.mensaje);
                                        });
                                    }, (resultado: Operacion) => {
                                        notify(resultado.mensaje);
                                    });
                                }, (resultado: Operacion) => {
                                    my_dialog("", "", "close");
                                    notify(resultado.mensaje);
                                });
                            }
                        }, (resultado: Operacion) => {
                            my_dialog("", "", "close");
                            notify(resultado.mensaje);
                        });
                    }, (resultado: Operacion) => {
                        my_dialog("", "", "close");
                        notify(resultado.mensaje);
                    });
                }, (resultado: Operacion) => {
                    my_dialog("", "", "close");
                    notify(resultado.mensaje);
                });
            }, (resultado: Operacion) => {
                my_dialog("", "", "close");
                notify(resultado.mensaje);
            });
        } catch (ex) {
            my_dialog("", "", "close");
            notify(`Error al cargar la pantalla: ${ex.message}`);
        }
    }

    generarListadoDePaquetes(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.paqueteServicio.obtenerDenominacionesPorSku(this.sku, this.configuracionDeDecimales, this.cliente, true, (paquetes: Paquete[]) => {
                this.historicoDeArticuloServicio.colocarSugerenciaDeVentaAPaquetes(TIpoDeDocumento.OrdenDeVenta, this.cliente, this.sku, paquetes, this.configuracionDeDecimales, (paquetesSugeridos: Paquete[]) => {
                    this.paquetes = paquetesSugeridos;
                    this.procesarPaquetes(this.paquetes, (paquetes: Paquete[]) => {
                        this.paquetes = paquetes.filter((paquete: Paquete) => {
                            return paquete.price !== -1;
                        });
                        this.limpiarControles(() => {
                            callback();
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });
                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al generar listado de paquetes: ${ex.message}` });
        }
    }

    procesarPaquetes(paquetes: Paquete[], callback: (paquete: Paquete[]) => void, errCallback: (resultado: Operacion) => void) {
        this.precioSkuServicio.obtenerPreciosDePaquetes(this.cliente, this.sku, this.paquetes, this.configuracionDeDecimales, (paquetes: Paquete[]) => {
            callback(paquetes);
        }, (resultado: Operacion) => {
            errCallback(<Operacion>{ codigo: -1, mensaje: resultado.mensaje });
        });
    }

    limpiarControles(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            //-----Total del Pedido-----//
            let uiTotalCantidadSkus = $("#UiTotalCantidadSkus");
            uiTotalCantidadSkus.text(DarFormatoAlMonto(format_number(0, this.configuracionDeDecimales.defaultDisplayDecimals)));
            uiTotalCantidadSkus = null;
            //-----Fin Total del Pedido-----//

            //-----Cantidad del Sku-----//
            let uiTextoCantidadUnidadMedida = $("#UiTextoCantidadUnidadMedida");
            uiTextoCantidadUnidadMedida.text("");
            uiTextoCantidadUnidadMedida = null;
            //-----Fin Cantidad del Sku-----//

            //-----Historico del Sku-----//
            let uiEtiquetaUltimoPedidoUnidadMedida = $("#UiEtiquetaUltimoPedidoUnidadMedida");
            uiEtiquetaUltimoPedidoUnidadMedida.text("Ult. Pedido: 0");
            uiEtiquetaUltimoPedidoUnidadMedida = null;

            let uiLiUltimoPedidoUnidadMedida = $("#UiLiUltimoPedidoUnidadMedida");
            uiLiUltimoPedidoUnidadMedida.hide();
            uiLiUltimoPedidoUnidadMedida = null;
            //-----Fin Historico del Sku-----//

            //-----Descuento del Sku-----//
            let uiEtiquetaDescuentoSkuMaximo = $("#UiEtiquetaDescuentoSkuMaximo");
            uiEtiquetaDescuentoSkuMaximo.text("Descuento 0%");
            uiEtiquetaDescuentoSkuMaximo = null;

            let uiTextoDescuentoSku = $("#UiTextoDescuentoSku");
            uiTextoDescuentoSku.text("");
            uiTextoDescuentoSku = null;

            let uiLiDescuentoSkuMaximo = $("#UiLiDescuentoSkuMaximo");
            uiLiDescuentoSkuMaximo.hide();
            uiLiDescuentoSkuMaximo = null;
            //-----Fin Descuento del Sku-----//

            //-----Totales del Sku-----//
            let uiEtiquetaPrecioUnidadMedida = $("#UiEtiquetaPrecioUnidadMedida");
            uiEtiquetaPrecioUnidadMedida.text(`Precio: ${DarFormatoAlMonto(format_number(0, this.configuracionDeDecimales.defaultDisplayDecimals))}`);
            uiEtiquetaPrecioUnidadMedida = null;

            let uiEtiquetaTotalUnidadMedida = $("#UiEtiquetaTotalUnidadMedida");
            uiEtiquetaTotalUnidadMedida.text(`Precio: ${DarFormatoAlMonto(format_number(0, this.configuracionDeDecimales.defaultDisplayDecimals))}`);
            uiEtiquetaTotalUnidadMedida = null;

            let uiEtiquetaTotalCdUnidadMedida = $("#UiEtiquetaTotalCDUnidadMedida");
            uiEtiquetaTotalCdUnidadMedida.text(`Total CD: ${DarFormatoAlMonto(format_number(0, this.configuracionDeDecimales.defaultDisplayDecimals))}`);
            uiEtiquetaTotalCdUnidadMedida.hide();
            uiEtiquetaTotalCdUnidadMedida = null;
            //-----Fin Totales del Sku-----//

            //-----Bonificaciones del Sku-----//
            let uiListaDeBonificacionesUnidadMedida = $('#UiListaDeBonificacionesUnidadMedida');
            uiListaDeBonificacionesUnidadMedida.children().remove('li');
            uiListaDeBonificacionesUnidadMedida = null;

            let uiAcordionDeBonificacionesUnidadMedida = $("#UiAcordionDeBonificacionesUnidadMedida");
            uiAcordionDeBonificacionesUnidadMedida.hide();
            uiAcordionDeBonificacionesUnidadMedida = null;
            //-----Fin Bonificaciones del Sku-----//

            //-----Vento por Multiplo-----//
            let uiEtiquetaUnidadesTotales = $("#UiEtiquetaCantidadesTotales");
            uiEtiquetaUnidadesTotales.text("Cantidad Total: 0");
            uiEtiquetaUnidadesTotales.css("display", "none");
            uiEtiquetaUnidadesTotales = null;
            //-----Fin Vento por Multiplo-----//
            callback();
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al limpiar los controles: ${ex.message}` });
        }
    }

    seleccionarPrimerPaquete() {
        try {
            if (this.paquetes) {
                this.establecerPaqueteSeleccionado(this.paquetes[this.paquetes.length - 1].codePackUnit, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                }, () => {
                    this.cargarDatosDelPaqueteSeleccionado();
                });
            }
        } catch (ex) {
            notify(`Error al seleccionar el primer paquete: ${ex.message}`);
        }
    }

    cargarListaSkuAPaquetes(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.paquetes.map((paquete: Paquete) => {
                let resultadoDeBusqueda = this.listaDeSku.filter((sku: Sku) => {
                    return sku.codePackUnit === paquete.codePackUnit;
                });
                if (resultadoDeBusqueda && resultadoDeBusqueda.length > 0) {
                    paquete.qty = resultadoDeBusqueda[0].qty;
                    paquete.appliedDiscount = resultadoDeBusqueda[0].appliedDiscount;
                    paquete.discountType = resultadoDeBusqueda[0].discountType;
                    if (paquete.codePackUnit === resultadoDeBusqueda[0].unidadMedidaSeleccionada) {
                        this.establecerPaqueteSeleccionado(resultadoDeBusqueda[0].unidadMedidaSeleccionada, (resultado: Operacion) => {
                            errCallback(resultado);
                        }, () => {
                            callback();
                        });
                    }
                }
                resultadoDeBusqueda = null;
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al cargar listado de sku a paquetes: ${ex.message}` });
        }
    }

    establecerPaqueteSeleccionado(codePackUnit: string, errCallback: (resultado: Operacion) => void, callback?: () => void) {
        try {
            this.sku.unidadMedidaSeleccionada = codePackUnit;
            this.paqueteSeleccionadoActual.packUnit = (codePackUnit === "") ? 0 : 1;
            this.paqueteSeleccionadoActual.codePackUnit = codePackUnit;
            this.paqueteSeleccionadoActual.isSaleByMultiple = false;
            this.ventasPorMultiploServicio.verificarVentasPorMultiploSkuUm(this.cliente, this.sku, (skuMultiplo: VentaPorMultiplo) => {
                if (skuMultiplo.apply) {


                    let promoParaValidar: Promo = new Promo();
                    promoParaValidar.promoId = skuMultiplo.promoId;
                    promoParaValidar.promoName = skuMultiplo.promoName;
                    promoParaValidar.frequency = skuMultiplo.frequency;

                    let resultadoDePromoHistorico = this.listaHistoricoDePromos.find((promo: Promo) => {
                        return promo.promoId === skuMultiplo.promoId;
                    });

                    if (resultadoDePromoHistorico) {
                        this.promoServicio.validarSiAplicaPromo(promoParaValidar, resultadoDePromoHistorico, (aplicaPromo) => {
                            if (aplicaPromo) {
                                this.paqueteSeleccionadoActual.isSaleByMultiple = true;
                                this.paqueteSeleccionadoActual.multiple = skuMultiplo.multiple;
                                promoParaValidar.apply = true;
                                this.paqueteSeleccionadoActual.promoVentaPorMultiplo = promoParaValidar;
                                promoParaValidar = null;
                            } else {
                                this.paqueteSeleccionadoActual.promoVentaPorMultiplo = new Promo();
                            }
                            if (callback) {
                                callback();
                            }
                        }, (resultado: Operacion) => {
                            notify(resultado.mensaje);
                        });
                    } else {
                        this.paqueteSeleccionadoActual.isSaleByMultiple = true;
                        this.paqueteSeleccionadoActual.multiple = skuMultiplo.multiple;
                        promoParaValidar.apply = true;
                        this.paqueteSeleccionadoActual.promoVentaPorMultiplo = promoParaValidar;

                        if (callback) {
                            callback();
                        }
                    }
                } else {
                    if (callback) {
                        callback();
                    }
                }


            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al establecer el paquete seleccionado: ${ex.message}` });
        }
    }

    //----------Fin Carga de Pantallas----------//

    //----------Seleecion de Paquetes----------//
    usuarioCambioCantidaDePaquete(callback?: () => void) {
        try {
            let uiTextoCantidadUnidadMedida = $("#UiTextoCantidadUnidadMedida");
            const cantidad = parseFloat((uiTextoCantidadUnidadMedida.val() === "" ? 0 : uiTextoCantidadUnidadMedida.val()));
            uiTextoCantidadUnidadMedida = null;
            if (cantidad > 0) {
                this.validarSiCambioLaCantidad((esIgualLaCantidad: boolean) => {
                    if (esIgualLaCantidad) {
                        if (callback) {
                            callback();
                        }
                    } else {
                        this.obtenerPaqueteSeleccionado((paquete: Paquete) => {
                            let uiTextoCantidadUnidadMedida = $("#UiTextoCantidadUnidadMedida");
                            const cantidad = parseFloat((uiTextoCantidadUnidadMedida.val() === ""
                                ? 0
                                : uiTextoCantidadUnidadMedida.val()));
                            uiTextoCantidadUnidadMedida = null;
                            paquete.qty = (cantidad *
                                ((this.paqueteSeleccionadoActual.isSaleByMultiple)
                                    ? this.paqueteSeleccionadoActual.multiple
                                    : 1));
                            paquete.promoVentaPorMultiplo = this.paqueteSeleccionadoActual
                                .promoVentaPorMultiplo;
                            this.validarSiCambioElPrecioDelPaquete(() => {
                                if (callback) {
                                    callback();
                                }
                            },
                                (resultado: Operacion) => {
                                    notify(resultado.mensaje);
                                    DesBloquearPantalla();
                                });
                        },
                            (resultado: Operacion) => {
                                notify(resultado.mensaje);
                                DesBloquearPantalla();
                            });
                    }
                },
                    (resultado: Operacion) => {
                        notify(resultado.mensaje);
                        DesBloquearPantalla();
                    });
            } else {
                notify(`La cantidad tiene que ser mayor a cero.`);
                DesBloquearPantalla();
            }
        } catch (ex) {
            notify(`Error al cambar cantidad de paquete: ${ex.messages}`);
            DesBloquearPantalla();
        }
    }

    validarSiCambioElPrecioDelPaquete(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.procesarPaquetes(this.paquetes, (paquetes: Paquete[]) => {
                this.paquetes = paquetes;
                
                    this.obtenerBonificacionesDelPaqueteSeleccionado((listaBonificaciones: Bono[]) => {
                        this.cargarControlesBonificaciones(listaBonificaciones, () => {
                            this.cargarControlesDeDescuento(() => {
                                this.validarIngresoDeDescuento((resultado: Operacion) => {
                                    notify(resultado.mensaje);
                                }, () => {
                                    this.cargarDatosDelPaqueteSeleccionado(() => {
                                        callback();
                                    });
                                });
                            }, (resultado: Operacion) => {
                                notify(resultado.mensaje);
                            });
                        }, (resultado: Operacion) => {
                            notify(resultado.mensaje);
                        });
                    }, (resultado: Operacion) => {
                        notify(resultado.mensaje);
                    });
                    
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al validar si cambio el precio del paquete: ${ex.message}` });
        }
    }

    usuarioSeleccionoPaquete() {
        try {
            if (!this.paquetes) {
                return;
            }

            let listaDeUnidadesDeMedida: Object[] = [];

            this.paquetes.map(p => listaDeUnidadesDeMedida.push({
                text: p.descriptionPackUnit,
                value: p.codePackUnit
            }));

            let configOptions = {
                title: "Listado de Unidades de Medida",
                items: listaDeUnidadesDeMedida,
                doneButtonLabel: "Ok",
                cancelButtonLabel: "Cancelar"
            };
            ShowListPicker(configOptions,
                item => {
                    this.validarBonificacionesIngresadas(() => {
                        this.validarIngresoDeDescuento((resultado: Operacion) => {
                            notify(resultado.mensaje);
                            DesBloquearPantalla();
                        }, () => {
                            this.establecerPaqueteSeleccionado(item, (resultado: Operacion) => {
                                notify(resultado.mensaje);
                            }, () => {
                                let uiTextoCantidadUnidadMedida = $("#UiTextoCantidadUnidadMedida");
                                uiTextoCantidadUnidadMedida.focus();
                                uiTextoCantidadUnidadMedida.trigger("keyup");
                                uiTextoCantidadUnidadMedida = null;
                                this.obtenerBonificacionesDelPaqueteSeleccionado((listaBonificaciones: Bono[]) => {
                                    this.cargarControlesBonificaciones(listaBonificaciones, () => {
                                        this.cargarControlesDeDescuento(() => {
                                            this.cargarDatosDelPaqueteSeleccionado();
                                        }, (resultado: Operacion) => {
                                            notify(resultado.mensaje);
                                            DesBloquearPantalla();
                                        });
                                    }, (resultado: Operacion) => {
                                        notify(resultado.mensaje);
                                    });
                                }, (resultado: Operacion) => {
                                    notify(resultado.mensaje);
                                });
                            });
                        });
                    }, (resultado: Operacion) => {
                        notify(resultado.mensaje);
                    });
                }
            );
            configOptions = null;
            listaDeUnidadesDeMedida = null;
        } catch (ex) {
            notify(`Error al seleccionar la unidad de medida: ${ex.message}`);
        }
    }

    cargarDatosDelPaqueteSeleccionado(callback?: () => void) {
        try {
            this.obtenerPaqueteSeleccionado((paquete: Paquete) => {
                let uiTextoCantidadUnidadMedida = $("#UiTextoCantidadUnidadMedida");
                let cantidad = ((this.paqueteSeleccionadoActual.isSaleByMultiple) ? (paquete.qty / this.paqueteSeleccionadoActual.multiple) : paquete.qty);
                uiTextoCantidadUnidadMedida.val((paquete.qty === 0) ? "" : format_number(cantidad, this.configuracionDeDecimales.defaultDisplayDecimals));
                uiTextoCantidadUnidadMedida = null;
                let uiEtiquetaUnidadDeMedida = $("#UiEtiquetaUnidadDeMedida");
                uiEtiquetaUnidadDeMedida.text(paquete.codePackUnit);
                uiEtiquetaUnidadDeMedida = null;

                let uiEtiquetaUnidadesTotales = $("#UiEtiquetaCantidadesTotales");

                if (this.paqueteSeleccionadoActual.isSaleByMultiple) {
                    uiEtiquetaUnidadesTotales.css("display", "block");
                    uiEtiquetaUnidadesTotales.text(`Cantidad Total: ${format_number((cantidad * this.paqueteSeleccionadoActual.multiple), this.configuracionDeDecimales.defaultDisplayDecimals)}`);
                } else {
                    uiEtiquetaUnidadesTotales.css("display", "none");
                }
                cantidad = null;
                uiEtiquetaUnidadesTotales = null;

                let uiEtiquetaPrecioUnidadMedida = $("#UiEtiquetaPrecioUnidadMedida");
                uiEtiquetaPrecioUnidadMedida.text(`Precio: ${DarFormatoAlMonto(format_number(paquete.price, this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                uiEtiquetaPrecioUnidadMedida = null;

                let uiEtiquetaTotalUnidadMedida = $("#UiEtiquetaTotalUnidadMedida");
                uiEtiquetaTotalUnidadMedida.text(`Total: ${DarFormatoAlMonto(format_number(paquete.price * paquete.qty, this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                uiEtiquetaTotalUnidadMedida = null;

                this.obtenerTotalDePaquetesConDescuentoAplicados(true, (total: number) => {                    
                    this.ObtenerTotalDeLaOrden((totalConDes: number)=>{
                    let uiTotalCantidadSkus = $("#UiTotalCantidadSkus");
                    let totalDeLaOrden = totalConDes + total;

                    if (totalDeLaOrden >= this.tarea.discountPerGeneralAmountLowLimit &&
                        this.tarea.discountPerGeneralAmountHighLimit >= totalDeLaOrden) {
                        uiTotalCantidadSkus.text(DarFormatoAlMonto(format_number((totalDeLaOrden - (totalDeLaOrden * (this.cliente.appliedDiscount / 100))), this.configuracionDeDecimales.defaultDisplayDecimals)));
                        if (callback) {
                            callback();
                        }
                    } else {
                        if (totalDeLaOrden > 0) {
                            this.obtenerDescuentoPorMontoGeneral(totalDeLaOrden,
                                () => {
                                    if (this.descuentoPorMontoGeneral.apply) {
                                        if (this
                                            .seAplicaElDescuentoModificado(this.cliente.discount,
                                                this.cliente.appliedDiscount,
                                                this.descuentoPorMontoGeneral.discount)) {
                                            uiTotalCantidadSkus
                                                .text(DarFormatoAlMonto(format_number((totalDeLaOrden -
                                                        (totalDeLaOrden * (this.cliente.appliedDiscount / 100))),
                                                    this.configuracionDeDecimales.defaultDisplayDecimals)));
                                        } else {
                                            uiTotalCantidadSkus
                                                .text(DarFormatoAlMonto(format_number((totalDeLaOrden -
                                                    (totalDeLaOrden * (this.descuentoPorMontoGeneral.discount / 100)
                                                    )),
                                                    this.configuracionDeDecimales.defaultDisplayDecimals)));
                                        }
                                        uiTotalCantidadSkus = null;
                                        if (callback) {
                                            callback();
                                        }
                                    } else {
                                        uiTotalCantidadSkus.text(DarFormatoAlMonto(format_number(totalDeLaOrden, this.configuracionDeDecimales.defaultDisplayDecimals)));
                                        uiTotalCantidadSkus = null;
                                        if (callback) {
                                            callback();
                                        }
                                    }
                                },
                                (resultado: Operacion) => {
                                    notify(resultado.mensaje);
                                });
                        } else {
                            uiTotalCantidadSkus.text(DarFormatoAlMonto(format_number(0, this.configuracionDeDecimales.defaultDisplayDecimals)));
                            uiTotalCantidadSkus = null;
                            if (callback) {
                                callback();
                            }
                        }
                    }
                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                });
                    }, (resultado: Operacion) => {
                     notify(resultado.mensaje);
                });
                    
            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        } catch (ex) {
            notify(`Error al cargar datos del paquete seleccionado: ${ex.message}`);
        }
    }

    obtenerPaqueteSeleccionado(callback: (paquete: Paquete) => void, errCallback: (resultado: Operacion) => void) {
        try {
            let resultadoDeBusqueda = this.paquetes.filter((paquete: Paquete) => {
                return paquete.codePackUnit === this.paqueteSeleccionadoActual.codePackUnit;
            });
            if (resultadoDeBusqueda && resultadoDeBusqueda.length > 0) {
                callback(resultadoDeBusqueda[0]);
            } else {
                callback(null);
            }
            resultadoDeBusqueda = null;
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al obtener el paquete seleccionado: ${ex.message}` });
        }
    }

    //----------Fin Seleecion de Paquetes----------//

    //----------Aceptar Paquetes----------//
    usuarioDeseaAceptarElSku() {
        try {
            this.validarElIngresoDeCantidadesDePaquetes(() => {
                this.obtenerPaqueteProcesadosEnSku((listaDeSku: Sku[]) => {
                    if (gIsOnline === EstaEnLinea.No) {
                        this.tareaServicio.obtenerRegla("AplicarReglasComerciales",
                            (listaDeReglasAplicarReglasComerciales: Regla[]) => {
                                if (listaDeReglasAplicarReglasComerciales.length > 0 &&
                                    (listaDeReglasAplicarReglasComerciales[0].enabled.toUpperCase() === "SI")) {
                                    this.clienteServicio.validarCuentaCorriente(this.cliente,
                                        listaDeSku,
                                        this.tarea.salesOrderType,
                                        this.configuracionDeDecimales, () => {
                                            this.publicarEntidades(listaDeSku, () => {
                                                DesBloquearPantalla();
                                                window.history.back();
                                            }, (resultado: Operacion) => {
                                                DesBloquearPantalla();
                                                notify(resultado.mensaje);
                                            });
                                        },
                                        (resultado: Operacion) => {
                                            DesBloquearPantalla();
                                            notify(resultado.mensaje);
                                        });
                                } else {
                                    this.publicarEntidades(listaDeSku, () => {
                                        DesBloquearPantalla();
                                        window.history.back();
                                    }, (resultado: Operacion) => {
                                        DesBloquearPantalla();
                                        notify(resultado.mensaje);
                                    });
                                }
                            },
                            (resultado: Operacion) => {
                                DesBloquearPantalla();
                                notify(resultado.mensaje);
                                my_dialog("", "", "closed");
                            });
                    } else {
                        this.publicarEntidades(listaDeSku, () => {
                            DesBloquearPantalla();
                            window.history.back();
                        }, (resultado: Operacion) => {
                            DesBloquearPantalla();
                            notify(resultado.mensaje);
                        });
                    }
                }, (resultado: Operacion) => {
                    notify(resultado.mensaje);
                });
            }, (resultado: Operacion) => {
                DesBloquearPantalla();
                notify(resultado.mensaje);
            });
        } catch (ex) {
            notify(ex.message);
        }
    }

    validarElIngresoDeCantidadesDePaquetes(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            let resultadoDeBusqueda = this.paquetes.filter((paquete: Paquete) => {
                return paquete.qty !== 0;
            });
            if (resultadoDeBusqueda && resultadoDeBusqueda.length > 0) {
                callback();
            } else {
                errCallback(<Operacion>{ codigo: -1, mensaje: "Debe ingresar la cantidad del SKU seleccionado..." });
            }
            resultadoDeBusqueda = null;
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al validar el ingreso de la cantidad: ${ex.message}` });
        }
    }

    obtenerPaqueteProcesadosEnSku(callback: (listaDeSku: Sku[]) => void, errCallback: (resultado: Operacion) => void) {
        try {
            let resultadoDeBusqueda = this.paquetes.filter((paquete: Paquete) => {
                return paquete.qty !== 0;
            });
            if (resultadoDeBusqueda && resultadoDeBusqueda.length > 0) {
                let listaDeSku: Sku[] = [];

                resultadoDeBusqueda.map((paquete: Paquete) => {
                    let sku = new Sku();
                    sku.sku = this.sku.sku;
                    sku.skuName = this.sku.skuName;
                    sku.skuDescription = this.sku.skuDescription;
                    sku.skuPrice = trunc_number(paquete.price, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.skuLink = this.sku.skuLink;
                    sku.requieresSerie = this.sku.requieresSerie;
                    sku.isKit = this.sku.isKit;
                    sku.onHand = trunc_number(this.sku.onHand, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.routeId = this.sku.routeId;
                    sku.isParent = this.sku.isParent;
                    sku.parentSku = this.sku.parentSku;
                    sku.exposure = this.sku.exposure;
                    sku.priority = this.sku.priority;
                    sku.qtyRelated = this.sku.qtyRelated;
                    sku.loadedLastUpdated = this.sku.loadedLastUpdated;
                    sku.skus = this.sku.skus;
                    sku.codeFamilySku = this.sku.codeFamilySku;
                    sku.descriptionFamilySku = this.sku.descriptionFamilySku;
                    sku.cost = trunc_number(paquete.price, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.isComited = trunc_number(this.sku.isComited, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.difference = trunc_number(this.sku.difference, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.lastQtySold = this.sku.lastQtySold;
                    sku.qty = trunc_number(paquete.qty, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.available = trunc_number(this.sku.available, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.codePackUnit = paquete.codePackUnit;
                    sku.total = trunc_number((paquete.qty * paquete.price), this.configuracionDeDecimales.defaultCalculationsDecimals);
                    sku.discount = paquete.appliedDiscount;
                    sku.appliedDiscount = paquete.appliedDiscount;
                    sku.handleDimension = this.sku.handleDimension;
                    sku.isSaleByMultiple = this.sku.isSaleByMultiple;
                    sku.multipleSaleQty = this.sku.multipleSaleQty;
                    sku.owner = this.sku.owner;
                    sku.ownerId = this.sku.ownerId;
                    sku.discountType = paquete.discountType;
                    if (this.paqueteTieneDescuentoAplicado(paquete)) {
                        sku.listPromo.push(paquete.promoDescuento);
                    }
                    if (paquete.promoVentaPorMultiplo.apply) {
                        sku.listPromo.push(paquete.promoVentaPorMultiplo);
                    }
                    listaDeSku.push(sku);
                });
                callback(listaDeSku);
                listaDeSku = null;
                resultadoDeBusqueda = null;
            } else {
                resultadoDeBusqueda = null;
                errCallback(<Operacion>{ codigo: -1, mensaje: "No se encontraron paquetes mayor a cero." });
            }
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al obtener paquetes procesados en sku: ${ex.message}` });
        }
    }

    paqueteTieneDescuentoAplicado(paquete: Paquete): boolean {
        return paquete.appliedDiscount !== 0;
    }

    validarSiCambioLaCantidad(callback: (esIgualLaCantidad: boolean) => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.obtenerPaqueteSeleccionado((paquete: Paquete) => {
                let uiTextoCantidadUnidadMedida = $("#UiTextoCantidadUnidadMedida");
                let cantidad = parseFloat((uiTextoCantidadUnidadMedida.val() === "" ? 0 : uiTextoCantidadUnidadMedida.val()));
                uiTextoCantidadUnidadMedida = null;
                cantidad = (cantidad * ((this.paqueteSeleccionadoActual.isSaleByMultiple) ? this.paqueteSeleccionadoActual.multiple : 1));
                if (cantidad === paquete.qty) {
                    callback(true);
                } else {
                    callback(false);
                }
            }, (resultado: Operacion) => {
                notify(resultado.mensaje);
            });

        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al obtener total de paquetes: ${ex.message}` });
        }
    }
    //----------Fin Aceptar Paquetes----------//

    //----------Obtener Totales----------//
    obtenerTotalDePaquetesSinDescuentoAplicados(callback: (total: number) => void, errCallback: (resultado: Operacion) => void) {
        try {
            let total = 0;
            this.paquetes.map((paquete: Paquete) => {
                if (paquete.qty !== 0) {
                    total += paquete.qty * paquete.price;
                }
            });
            callback(total);
            total = null;
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al obtener total de paquetes: ${ex.message}` });
        }
    }

    obtenerTotalDePaquetesConDescuentoAplicados(aplicarDescuentoPorMontoGeneralYFamiliaYTipoPago: boolean, callback: (total: number) => void, errCallback: (resultado: Operacion) => void) {
        try {
            let total = 0;
            this.paquetes.map((paquete: Paquete) => {
                if (paquete.qty !== 0) {
                    let totalPaquete: number = (paquete.price * paquete.qty);                    
                    switch (paquete.discountType) {
                        case TiposDeDescuento.Porcentaje.toString():
                            totalPaquete = (parseFloat(paquete.appliedDiscount.toString()) !== 0 ? (totalPaquete - ((parseFloat(paquete.appliedDiscount.toString()) * totalPaquete) / 100)) : totalPaquete);
                            break;
                        case TiposDeDescuento.Monetario.toString():
                            totalPaquete = (parseFloat(paquete.appliedDiscount.toString()) !== 0 ? (totalPaquete - (parseFloat(paquete.appliedDiscount.toString()))) : totalPaquete);
                            break;                        
                    }
                    //-----Validamos si aplicamos el descuento de familia y tipo
                    if(aplicarDescuentoPorMontoGeneralYFamiliaYTipoPago){
                        //-----Aplicamos el descuento por monto general y familia
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                            totalPaquete = (parseFloat(this.descuentoPorMontoGeneralYFamilia.discount.toString()) !== 0 ? (totalPaquete - ((parseFloat(this.descuentoPorMontoGeneralYFamilia.discount.toString()) * totalPaquete) / 100)) : totalPaquete);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                            totalPaquete  = (parseFloat(this.descuentoPorMontoGeneralYFamilia.discount.toString()) !== 0 ? (totalPaquete - (parseFloat(this.descuentoPorMontoGeneralYFamilia.discount.toString()))) : totalPaquete);
                                break;
                        }
                        //-----Aplicamos el descuento por familia y tipo pago
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalPaquete = (parseFloat(this.descuentoPorFamiliaYTipoPago.discount.toString()) !== 0 ? (totalPaquete - ((parseFloat(this.descuentoPorFamiliaYTipoPago.discount.toString()) * totalPaquete) / 100)) : totalPaquete);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalPaquete  = (parseFloat(this.descuentoPorFamiliaYTipoPago.discount.toString()) !== 0 ? (totalPaquete - (parseFloat(this.descuentoPorFamiliaYTipoPago.discount.toString()))) : totalPaquete);
                                break;
                        }
                    }                    
                    total += totalPaquete;
                    totalPaquete = null;
                }
            });
            callback(total);
            total = null;
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al obtener total de paquetes: ${ex.message}` });
        }
    }
    //----------Fin Obtener Totales----------//

    //----------Publicar Entidades----------//
    publicarEntidades(listaDeSku: Sku[], callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.publicarTarea(() => {
                this.publicarListaSku(listaDeSku, () => {
                    this.publicarAgregarOQuitarDeListaSkuMensaje(listaDeSku, () => {
                        callback();
                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al publicar entidades: ${ex.message}` });
        }
    }

    publicarTarea(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.obtenerTotalDePaquetesConDescuentoAplicados(true, (total: number) => {
                this.ObtenerTotalDeLaOrden((totalConDes: number)=>{
                    let msg = new TareaMensaje(this);
                    this.tarea.salesOrderTotal = totalConDes + total;
                    msg.tarea = this.tarea;
                    this.mensajero.publish(msg, getType(TareaMensaje));
                    callback();
                 }, (resultado: Operacion) => {
                    errCallback(<Operacion>{ codigo: -1, mensaje: resultado.mensaje });
                });                
            }, (resultado: Operacion) => {
                errCallback(<Operacion>{ codigo: -1, mensaje: resultado.mensaje });
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al publicar tarea: ${ex.message}` });
        }
    }

    publicarListaSku(listaSku: Sku[], callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.obtenerListaDeSkuDeBonificacionesParaPublicar((listadoDeSkuParaBonificar: Sku[]) => {
                let msg = new ListaSkuMensaje(this);
                msg.listaSku = listaSku;
                msg.listaDeSkuParaBonificacion = listadoDeSkuParaBonificar;
                this.mensajero.publish(msg, getType(ListaSkuMensaje));
                msg = null;
                callBack();
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al publicar listado de sku: ${ex.message}` });
        }

    }

    publicarAgregarOQuitarDeListaSkuMensaje(listaSku: Sku[], callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            let msg = new AgregarOQuitarDeListaSkuMensaje(this);
            msg.listaSku = listaSku;
            msg.quitarSku = this.estaAgregandoSku;
            msg.agregarSku = false;
            this.mensajero.publish(msg, getType(AgregarOQuitarDeListaSkuMensaje));
            msg = null;
            callBack();
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al publicar agregar o quitar de lista sku: ${ex.message}` });
        }
    }
    //----------Fin Publicar Entidades----------//

    //----------Regregar a la pantalla anterior----------//
    mostrarPantallaAnterior() {
        switch ($.mobile.activePage[0].id) {
            case "skucant_page":
                window.history.back();
                break;
        }
    }
    //----------Fin Regregar a la pantalla anterior----------//

    //----------Resumen del sku----------//
    usuarioDeseaVerResumenDelSku() {
        let myPanel = $.mobile.activePage.children('[id="UiPanelIzquierdoPaginaDenominacion"]') as any;
        myPanel.panel("toggle");
        myPanel = null;
        this.validarBonificacionesIngresadas(() => {
            this.validarIngresoDeDescuento((resultado: Operacion) => {
                notify(resultado.mensaje);
                DesBloquearPantalla();
            }, () => {
                this.cargarResumenDelSku();
            });
        }, (resultado: Operacion) => {
            notify(resultado.mensaje);
        });
    }

    cargarResumenDelSku() {
        try {

            if (!this.paquetes) {
                return;
            }

            let uiListaResumenUnidadMedida = $("#UiListaResumenUnidadMedida");
            uiListaResumenUnidadMedida.children().remove("li");            

            for (let paquete of this.paquetes) {
                if (paquete.qty !== 0) {

                    let total : number= (paquete.qty * paquete.price);     
                    let totalConDescuentoPorEscala : number = 0;
                    let totalConDescuentoPorFamilia : number = 0;
                    switch (paquete.discountType) {
                        case TiposDeDescuento.Porcentaje.toString():
                            total = trunc_number((total - ((paquete.appliedDiscount * total) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                            break;
                        case TiposDeDescuento.Monetario.toString():
                            total = (trunc_number(total, this.configuracionDeDecimales.defaultCalculationsDecimals) < paquete.appliedDiscount) ? 0 : trunc_number(total - paquete.appliedDiscount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                            break;
                    }
                    totalConDescuentoPorEscala = total;

                    //-----Validamos si aplica el descuento por monto general y familia
                    if(this.descuentoPorMontoGeneralYFamilia.discount > 0){
                        //-----Aplicamos el descuento por monto general y familia
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                total = trunc_number((total - ((this.descuentoPorMontoGeneralYFamilia.discount * total) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                total = (trunc_number(total, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorMontoGeneralYFamilia.discount) ? 0 : trunc_number(total - this.descuentoPorMontoGeneralYFamilia.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                    }
                    totalConDescuentoPorFamilia = total;

                    //-----Validamos si aplica el descuento por familia y tipo pago
                    if(this.descuentoPorFamiliaYTipoPago.discount > 0){
                        //-----Aplicamos el descuento por familia y tipo pago
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                total = trunc_number((total - ((this.descuentoPorFamiliaYTipoPago.discount * total) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                total = (trunc_number(total, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorFamiliaYTipoPago.discount) ? 0 : trunc_number(total - this.descuentoPorFamiliaYTipoPago.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                    }

                    let li = "<li class='ui-field - contain' data-theme='a' style='text- align: right'>";
                    li += "<a href='#' style='text-align: left; background-color: #666;' data-theme='b' class='ui-btn ui-btn-icon-top ui-nodisc-icon'>";
                    li += `<FONT color='#FFFFFF'>${paquete.descriptionPackUnit}</FONT>`;
                    li += "</a>";
                    li += "</li>";

                    uiListaResumenUnidadMedida.append(li);
                    uiListaResumenUnidadMedida.listview("refresh");

                    li = "<li class='ui-field-contain' data-theme='a' style='text-align: right'>";
                    li += `<span class='HeaderSmall'>Cantidad &emsp;&emsp; ${format_number(paquete.qty, this.configuracionDeDecimales.defaultDisplayDecimals)}</span><br>`;
                    li += `<span class='HeaderSmall'>Precio &emsp;&emsp; ${DarFormatoAlMonto(format_number(paquete.price, this.configuracionDeDecimales.defaultDisplayDecimals))}</span><hr>`;
                    li += `<span class='HeaderSmall'>Total &emsp;&emsp; ${DarFormatoAlMonto(format_number((paquete.qty * paquete.price), this.configuracionDeDecimales.defaultDisplayDecimals))}</span><br>`;

                    if (paquete.lastQtySold > 0 || paquete.appliedDiscount !== 0) {
                        if (paquete.lastQtySold > 0) {
                            li += `<span class='HeaderSmall'>Ult. Pedido &emsp;&emsp; ${paquete.lastQtySold}</span><br>`;
                        }
                        if (paquete.appliedDiscount && paquete.appliedDiscount !== 0) {
                            switch (paquete.discountType) {
                                case TiposDeDescuento.Porcentaje.toString():
                                    li += `<span class='HeaderSmall'>Descuento(${paquete.appliedDiscount}%) &emsp;&emsp; ${DarFormatoAlMonto(format_number((paquete.appliedDiscount / 100) * (paquete.qty * paquete.price), this.configuracionDeDecimales.defaultDisplayDecimals))}</span><hr>`;
                                    break;
                                case TiposDeDescuento.Monetario.toString():
                                    li += `<span class='HeaderSmall'>Descuento &emsp;&emsp; ${DarFormatoAlMonto(format_number(paquete.appliedDiscount, this.configuracionDeDecimales.defaultDisplayDecimals))}</span><hr>`;
                                    break;
                            }
                            //Validamos si hay un descuento por familia o tipo de pago
                            if(this.descuentoPorMontoGeneralYFamilia.discount <= 0 && this.descuentoPorFamiliaYTipoPago.discount <= 0){
                                li += `<span class='HeaderSmall'> Total CD: ${DarFormatoAlMonto(format_number((total), this.configuracionDeDecimales.defaultDisplayDecimals))}</span>`;
                            }                            
                        }
                    }
                    //Validamos si aplica el descuento por monto genera y familia
                    if(this.descuentoPorMontoGeneralYFamilia.discount > 0){
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                li += `<span class='HeaderSmall'>Descuento(${this.descuentoPorMontoGeneralYFamilia.discount}%) &emsp;&emsp; ${DarFormatoAlMonto(format_number((this.descuentoPorMontoGeneralYFamilia.discount / 100) * totalConDescuentoPorEscala, this.configuracionDeDecimales.defaultDisplayDecimals))}</span><hr>`;
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                li += `<span class='HeaderSmall'>Descuento &emsp;&emsp; ${DarFormatoAlMonto(format_number(this.descuentoPorMontoGeneralYFamilia.discount, this.configuracionDeDecimales.defaultDisplayDecimals))}</span><hr>`;
                                break;
                        }
                        if(this.descuentoPorFamiliaYTipoPago.discount <= 0){
                            li += `<span class='HeaderSmall'> Total CD: ${DarFormatoAlMonto(format_number((total), this.configuracionDeDecimales.defaultDisplayDecimals))}</span>`;                        
                        }                        
                    }
                    //Validamos si aplica el descuento por familia y tipo pago
                    if(this.descuentoPorFamiliaYTipoPago.discount > 0){
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                li += `<span class='HeaderSmall'>Descuento(${this.descuentoPorFamiliaYTipoPago.discount}%) &emsp;&emsp; ${DarFormatoAlMonto(format_number((this.descuentoPorFamiliaYTipoPago.discount / 100) * totalConDescuentoPorFamilia, this.configuracionDeDecimales.defaultDisplayDecimals))}</span><hr>`;
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                li += `<span class='HeaderSmall'>Descuento &emsp;&emsp; ${DarFormatoAlMonto(format_number(this.descuentoPorFamiliaYTipoPago.discount, this.configuracionDeDecimales.defaultDisplayDecimals))}</span><hr>`;
                                break;
                        }                        
                        li += `<span class='HeaderSmall'> Total CD: ${DarFormatoAlMonto(format_number((total), this.configuracionDeDecimales.defaultDisplayDecimals))}</span>`;                        
                                                
                    }

                    li += "</li>";
                    uiListaResumenUnidadMedida.append(li);
                    uiListaResumenUnidadMedida.listview("refresh");


                    let listadoDeBonificacionesFiltradas = this.listaDeBonificaciones.filter((bonificacion: Bono) => {
                        return (bonificacion.codePackUnit === paquete.codePackUnit && bonificacion.bonusQty > 0);
                    });

                    if (listadoDeBonificacionesFiltradas && listadoDeBonificacionesFiltradas.length > 0) {

                        li = "<li class='ui-field-contain' data-theme='a' style='text-align: right'>";
                        li += "<div data-role='collapsible' data-content-theme='a' data-inset='true' data-mini='true' data-theme='b' class='ui-nodisc-icon' data-collapsed-icon='carat-d' data-expanded-icon='carat-u' Width='100%'>";
                        li += "<h5 style='text- align:center'>Bonificaciones</h5>";
                        li += `<ul data-role='listview' data-inset='false' data-divider-theme='a' id='UiListaBonificacionResumenUnidadMedida${paquete.codePackUnit}' >`;
                        li += "</ul>";
                        li += "</div>";
                        li += "</li>";

                        uiListaResumenUnidadMedida.append(li);
                        uiListaResumenUnidadMedida.listview("refresh");
                        uiListaResumenUnidadMedida.trigger("create");

                        listadoDeBonificacionesFiltradas.map((bonificacion: Bono) => {
                            let uiListaBonificacionResumenUnidadMedida = $(`#UiListaBonificacionResumenUnidadMedida${paquete.codePackUnit}`);
                            let listaDeLi: string[] = [];
                            listaDeLi.push("<li class='ui-field - contain' data-theme='a' style='text- align: left'>");
                            listaDeLi.push(`<span class='medium'>${bonificacion.codeSkuBonus}</span><br/>`);
                            listaDeLi.push(`<span class='medium'>${bonificacion.descriptionSkuBonues}</span><br/>`);
                            listaDeLi.push(`<span class='medium'>UM.: ${bonificacion.codePackUnitBonues} Cant.: ${bonificacion.bonusQty}</span><br/>`);
                            listaDeLi.push("</li>");
                            uiListaBonificacionResumenUnidadMedida.append(listaDeLi.join(''));
                            uiListaBonificacionResumenUnidadMedida.listview("refresh");
                            uiListaBonificacionResumenUnidadMedida = null;
                            listaDeLi = null;
                        });
                    }

                    total = null;
                }
            }
            uiListaResumenUnidadMedida = null;

        } catch (ex) {
            notify(`Error al cargar la informacion: ${ex.message}`);
        }
    }
    //----------Fin Resumen del sku----------//

    //----------Bonificaciones----------//
    cargarBonificaciones(callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.obtenerSiElUsuarioPudeModificarBonificaciones(() => {
                this.bonoServicio.obtenerBonificacionPorEscalaPorCliente(this.cliente, this.sku, (listaDeBonificacionesPorEscala: Bono[]) => {
                    this.validarSiAplicaLaBonificaciones(listaDeBonificacionesPorEscala, 0, true, (listaDeBonificacionesPorEscalaParaAplicar: Bono[]) => {

                        this.listaDeBonificaciones = [];
                        listaDeBonificacionesPorEscalaParaAplicar.map((bonificacion) => {
                            let resultadoDeBonificacionDeBusqueda: Bono = this.listaDeBonificaciones.find((bonificacionExistente: Bono) => {
                                return (bonificacion.codePackUnit === bonificacionExistente.codePackUnit
                                    && bonificacion.codeSkuBonus === bonificacionExistente.codeSkuBonus
                                    && bonificacion.codePackUnitBonues === bonificacionExistente.codePackUnitBonues);
                            });
                            if (resultadoDeBonificacionDeBusqueda) {
                                const escalaDeBono = new EscalaDeBono();
                                escalaDeBono.lowLimit = bonificacion.lowLimitTemp;
                                escalaDeBono.highLimit = bonificacion.highLimitTemp;
                                escalaDeBono.bonusQty = bonificacion.bonusQtyTemp;
                                escalaDeBono.promoId = bonificacion.promoIdScale;
                                escalaDeBono.promoName = bonificacion.promoNameScale;
                                escalaDeBono.promoType = bonificacion.promoTypeScale;
                                escalaDeBono.frequency = bonificacion.frequencyScale;
                                resultadoDeBonificacionDeBusqueda.escalas.push(escalaDeBono);
                            } else {
                                const escalaDeBono = new EscalaDeBono();
                                escalaDeBono.lowLimit = bonificacion.lowLimitTemp;
                                escalaDeBono.highLimit = bonificacion.highLimitTemp;
                                escalaDeBono.bonusQty = bonificacion.bonusQtyTemp;
                                escalaDeBono.bonusQty = bonificacion.bonusQtyTemp;
                                escalaDeBono.promoId = bonificacion.promoIdScale;
                                escalaDeBono.promoName = bonificacion.promoNameScale;
                                escalaDeBono.promoType = bonificacion.promoTypeScale;
                                escalaDeBono.frequency = bonificacion.frequencyScale;
                                bonificacion.escalas.push(escalaDeBono);
                                bonificacion.lowLimitTemp = 0;
                                bonificacion.highLimitTemp = 0;
                                bonificacion.bonusQtyTemp = 0;
                                bonificacion.bonusQty = -1;
                                bonificacion.promoIdScale = 0;
                                bonificacion.promoNameScale = "";
                                bonificacion.promoTypeScale = "";
                                bonificacion.frequencyScale = "";
                                bonificacion.tipoDeBonificacion = TipoDeBonificacion.PorEscala;
                                this.listaDeBonificaciones.push(bonificacion);
                            }
                            resultadoDeBonificacionDeBusqueda = null;
                        });

                        this.bonoServicio.obtenerBonoPorMultiploPorCliente(this.cliente, this.sku, (listaDeBonosPorMultiplo: Bono[]) => {

                            this.validarSiAplicaLaBonificaciones(listaDeBonosPorMultiplo, 0, false, (listaDeBonosPorMultiploParaAplicar: Bono[]) => {
                                listaDeBonosPorMultiploParaAplicar.map((bonificacion: Bono) => {

                                    let resultadoDeBonificacionDeBusqueda: Bono = this.listaDeBonificaciones.find((bonificacionExistente: Bono) => {
                                        return (bonificacion.codePackUnit === bonificacionExistente.codePackUnit
                                            && bonificacion.codeSkuBonus === bonificacionExistente.codeSkuBonus
                                            && bonificacion.codePackUnitBonues === bonificacionExistente.codePackUnitBonues);
                                    });
                                    if (resultadoDeBonificacionDeBusqueda) {
                                        resultadoDeBonificacionDeBusqueda.tipoDeBonificacion = TipoDeBonificacion.Ambos;
                                        resultadoDeBonificacionDeBusqueda.multiplo = bonificacion.multiplo;
                                        resultadoDeBonificacionDeBusqueda.bonusQtyMultiplo = bonificacion.bonusQtyMultiplo;
                                        resultadoDeBonificacionDeBusqueda.promoIdMultiple = bonificacion.promoIdMultiple;
                                        resultadoDeBonificacionDeBusqueda.promoNameMultiple = bonificacion.promoNameMultiple;
                                        resultadoDeBonificacionDeBusqueda.promoTypeMultiple = bonificacion.promoTypeMultiple;
                                        resultadoDeBonificacionDeBusqueda.frequencyMultiple = bonificacion.frequencyMultiple;
                                    } else {
                                        bonificacion.lowLimitTemp = 0;
                                        bonificacion.highLimitTemp = 0;
                                        bonificacion.bonusQtyTemp = 0;
                                        bonificacion.bonusQty = -1;
                                        bonificacion.tipoDeBonificacion = TipoDeBonificacion.PorMultiplo;
                                        this.listaDeBonificaciones.push(bonificacion);
                                    }
                                    resultadoDeBonificacionDeBusqueda = null;
                                });
                                callBack();
                            }, (resultado: Operacion) => {
                                errCallback(resultado);
                            });
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });

                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{ codigo: -1, mensaje: `Error al cargar las bonificaciones: ${ex.message}` });
        }
    }

    obtenerSiElUsuarioPudeModificarBonificaciones(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.usuarioPuedeModificarBonificacion = false;
            this.tareaServicio.obtenerRegla("ModificacionBonificacionMovil",
                (listaDeReglas: Regla[]) => {
                    if (listaDeReglas.length >= 1) {
                        this.usuarioPuedeModificarBonificacion = (listaDeReglas[0].enabled.toUpperCase() === "SI");
                    }
                    callback();
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
        } catch (err) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al validar si modifica bonificacion: ${err.message}`
            });
        }
    }

    obtenerBonificacionesDelPaqueteSeleccionado(callBack: (listaBonificaciones: Bono[]) => void, errCallback: (resultado: Operacion) => void) {
        try {
            let resultadoDeBonificacionDeBusqueda = this.listaDeBonificaciones.filter((bonificacionExistente) => {
                return this.paqueteSeleccionadoActual.codePackUnit === bonificacionExistente.codePackUnit;
            });

            if (resultadoDeBonificacionDeBusqueda &&
                resultadoDeBonificacionDeBusqueda.length > 0) {
                callBack(resultadoDeBonificacionDeBusqueda);
            } else {
                callBack([]);
            }
            resultadoDeBonificacionDeBusqueda = null;
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al validar si el paquete tiene bonificaciones: ${ex.message}`
            });
        }
    }

    cargarControlesBonificaciones(listaBonificaciones: Bono[], callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            let uiAcordionDeBonificacionesUnidadMedida = $("#UiAcordionDeBonificacionesUnidadMedida");
            uiAcordionDeBonificacionesUnidadMedida.hide();
            uiAcordionDeBonificacionesUnidadMedida = null;

            let uiListaDeBonificacionesUnidadMedida = $('#UiListaDeBonificacionesUnidadMedida');
            uiListaDeBonificacionesUnidadMedida.children().remove('li');
            uiListaDeBonificacionesUnidadMedida = null;

            this.obtenerPaqueteSeleccionado((paquete: Paquete) => {
                listaBonificaciones.map((bonificacion: Bono) => {
                    bonificacion.bonusQtyTemp = 0;
                    if (this.tipoDeBonificacionEsPorMultiploOMultiploYEscala(bonificacion)) {
                        bonificacion.bonusQtyTemp = this.obtenerValorDeBonoMultiplo(bonificacion.multiplo, paquete.qty, bonificacion.bonusQtyMultiplo);
                        bonificacion.applyPromoByMultiple = (bonificacion.bonusQtyTemp !== 0);
                    }

                    bonificacion.promoIdScale = 0;
                    bonificacion.promoNameScale = "";
                    bonificacion.promoTypeScale = "";
                    bonificacion.frequencyScale = "";

                    let escalasFiltradas: EscalaDeBono = bonificacion.escalas.find((escala: EscalaDeBono) => {
                        return (escala.lowLimit <= paquete.qty && paquete.qty <= escala.highLimit);
                    });
                    if (escalasFiltradas) {
                        bonificacion.bonusQtyTemp += escalasFiltradas.bonusQty;
                        bonificacion.promoIdScale = escalasFiltradas.promoId;
                        bonificacion.promoNameScale = escalasFiltradas.promoName;
                        bonificacion.promoTypeScale = escalasFiltradas.promoType;
                        bonificacion.frequencyScale = escalasFiltradas.frequency;
                    }
                    escalasFiltradas = null;

                    if (bonificacion.bonusQtyTemp > 0) {

                        let uiAcordionDeBonificacionesUnidadMedida = $("#UiAcordionDeBonificacionesUnidadMedida");
                        uiAcordionDeBonificacionesUnidadMedida.show();
                        uiAcordionDeBonificacionesUnidadMedida = null;

                        let uiListaDeBonificacionesUnidadMedida = $('#UiListaDeBonificacionesUnidadMedida');

                        let liParaAgregar: string[] = [];
                        liParaAgregar.push("<li class='ui-field - contain' data-theme='a' style='text- align: left'>");
                        liParaAgregar.push(`<span class='medium'>${bonificacion.descriptionSkuBonues}</span><br/>`);
                        liParaAgregar.push(`<span class='medium'>${bonificacion.codeSkuBonus}</span><br/>`);
                        liParaAgregar.push(`<span class='medium' id='UiEtiquetaTextoBonificacion${bonificacion.codeSkuBonus}${bonificacion.codePackUnitBonues}'>UM.: ${bonificacion.codePackUnitBonues} Cant.: ${bonificacion.bonusQtyTemp}</span><br/>`);
                        if (this.usuarioPuedeModificarBonificacion) {
                            if (localStorage.getItem("USE_MAX_BONUS") === SiNo.Si.toString()) {
                                if (bonificacion.bonusQty === -1) {
                                    bonificacion.bonusQty = bonificacion.bonusQtyTemp;
                                }
                            }
                            liParaAgregar.push(`<input type='number' class='validarEnteros' id='UiTextoBonificacion${bonificacion.codeSkuBonus}${bonificacion.codePackUnitBonues}' data-clear-btn='true' placeholder='Cantidad' value='${(bonificacion.bonusQty <= 0) ? "" : bonificacion.bonusQty}' />`);
                        } else {
                            bonificacion.bonusQty = bonificacion.bonusQtyTemp;
                        }

                        liParaAgregar.push("</li>");
                        uiListaDeBonificacionesUnidadMedida.append(liParaAgregar.join(''));
                        uiListaDeBonificacionesUnidadMedida.listview("refresh");
                        uiListaDeBonificacionesUnidadMedida.trigger("create");
                        uiListaDeBonificacionesUnidadMedida = null;
                        liParaAgregar = null;
                    } else {
                        bonificacion.bonusQty = -1;
                    }
                });
                callBack();
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al establecer bonificaciones: ${ex.message}`
            });
        }
    }

    tipoDeBonificacionEsPorMultiploOMultiploYEscala(bonificacion: Bono): boolean {
        return (bonificacion.tipoDeBonificacion === TipoDeBonificacion.PorMultiplo ||
            bonificacion.tipoDeBonificacion === TipoDeBonificacion.Ambos);
    }

    validarBonificacionesIngresadas(callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            if (this.usuarioPuedeModificarBonificacion) {
                this.obtenerBonificacionesDelPaqueteSeleccionado((listaBonificaciones: Bono[]) => {
                    this.obtenerPaqueteSeleccionado((paquete: Paquete) => {
                        let hayIngresosQueSobrepesanLoMaximo = false;
                        listaBonificaciones.map((bonificacion: Bono) => {
                            let validarBonificacion = false;
                            if (bonificacion.tipoDeBonificacion === TipoDeBonificacion.PorMultiplo ||
                                bonificacion.tipoDeBonificacion === TipoDeBonificacion.Ambos) {
                                validarBonificacion = true;
                            }
                            let escalasFiltradas: EscalaDeBono = bonificacion.escalas.find((escala: EscalaDeBono) => {
                                return (escala.lowLimit <= paquete.qty && paquete.qty <= escala.highLimit);
                            });
                            if (escalasFiltradas || validarBonificacion) {
                                let uiEtiquetaTotalUnidadMedida = $(`#UiTextoBonificacion${bonificacion.codeSkuBonus}${bonificacion.codePackUnitBonues}`);
                                let cantidadDeBonificacion = (uiEtiquetaTotalUnidadMedida.val() === "") ? 0 : uiEtiquetaTotalUnidadMedida.val();
                                if (cantidadDeBonificacion > bonificacion.bonusQtyTemp) {
                                    hayIngresosQueSobrepesanLoMaximo = true;
                                } else {
                                    bonificacion.bonusQty = cantidadDeBonificacion;
                                }
                                cantidadDeBonificacion = null;
                                uiEtiquetaTotalUnidadMedida = null;
                            }
                            escalasFiltradas = null;
                        });
                        if (hayIngresosQueSobrepesanLoMaximo) {
                            errCallback(<Operacion>{
                                codigo: -1,
                                mensaje: "Hay bonificaciones que sobrepasan lo máximo establecido."
                            });
                        } else {
                            callBack();
                        }
                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            } else {
                callBack();
            }
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al validar bonificaciones ingresadas: ${ex.message}`
            });
        }
    }

    obtenerListaDeSkuDeBonificacionesParaPublicar(callBack: (listadoDeSkuParaBonificar: Sku[]) => void, errCallback: (resultado: Operacion) => void) {
        try {
            let listaFiltrada = this.listaDeBonificaciones.reduce((listaRecorrida: Sku[], bonificacion: Bono) => {
                if (bonificacion.bonusQty > 0) {
                    let skuParaBonificacion = new Sku();
                    skuParaBonificacion.sku = bonificacion.codeSkuBonus;
                    skuParaBonificacion.codePackUnit = bonificacion.codePackUnitBonues;
                    skuParaBonificacion.skuName = bonificacion.descriptionSkuBonues;
                    skuParaBonificacion.skuDescription = bonificacion.descriptionSkuBonues;
                    skuParaBonificacion.qty = bonificacion.bonusQty;
                    skuParaBonificacion.parentCodeSku = this.sku.sku;
                    skuParaBonificacion.parentCodePackUnit = bonificacion.codePackUnit;
                    skuParaBonificacion.lowLimit = 0;
                    skuParaBonificacion.highLimit = 0;
                    skuParaBonificacion.owner = bonificacion.owner;
                    skuParaBonificacion.ownerId = bonificacion.ownerId;
                    if (this.promoDeEscalaSeAgregaALaBonificacion(bonificacion)) {
                        let promo: Promo = new Promo();
                        promo.promoId = bonificacion.promoIdScale;
                        promo.promoName = bonificacion.promoNameScale;
                        promo.promoType = bonificacion.promoTypeScale;
                        promo.frequency = bonificacion.frequencyScale;
                        skuParaBonificacion.listPromo.push(promo);
                        promo = null;
                    }
                    if (bonificacion.applyPromoByMultiple) {
                        let promo: Promo = new Promo();
                        promo.promoId = bonificacion.promoIdMultiple;
                        promo.promoName = bonificacion.promoNameMultiple;
                        promo.promoType = bonificacion.promoTypeMultiple;
                        promo.frequency = bonificacion.frequencyMultiple;
                        skuParaBonificacion.listPromo.push(promo);
                        promo = null;
                    }
                    listaRecorrida.push(skuParaBonificacion);
                    skuParaBonificacion = null;
                }
                return listaRecorrida;
            }, []);
            callBack(listaFiltrada);
            listaFiltrada = null;
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al validar bonificaciones ingresadas: ${ex.message}`
            });
        }
    }

    promoDeEscalaSeAgregaALaBonificacion(bonificacion: Bono): boolean {
        return (bonificacion.promoIdScale !== 0);
    }

    cargarListaDeSkuBonficadas(callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.listaDeSkuDeBonificacion.map((skuBonificado: Sku) => {
                let resultadoBonificacion = this.listaDeBonificaciones.find((bonificacion: Bono) => {
                    return (bonificacion.codePackUnit === skuBonificado.parentCodePackUnit &&
                        bonificacion.codeSkuBonus === skuBonificado.sku &&
                        bonificacion.codePackUnitBonues === skuBonificado.codePackUnit);
                });
                if (resultadoBonificacion) {
                    resultadoBonificacion.bonusQty = skuBonificado.qty;
                }
                resultadoBonificacion = null;
            });
            callBack();
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al cargar lista de sku bonificadas: ${ex.message}`
            });
        }
    }

    obtenerValorDeBonoMultiplo(multiplo: number, cantidad: number, cantidadBono: number): number {
        if (multiplo === 1) {
            return cantidad * cantidadBono;
        }
        if (cantidad < multiplo) {
            return 0;
        }
        if (cantidad === multiplo) {
            return cantidadBono;
        }

        let encontroCantidad = false;
        let indice = 1;
        while (!encontroCantidad) {
            if ((multiplo * (indice)) <= cantidad && cantidad <= (multiplo * (indice + 1) - 1)) {
                encontroCantidad = true;
            } else {
                indice++;
            }
        }
        return cantidadBono * indice;
    }
    //----------Fin Bonificaciones----------//

    //----------Descuentos----------//

    obtenerSiElUsuarioPudeModificarDescuentos(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.usuarioPuedeModificarDescuentos = false;
            this.tareaServicio.obtenerRegla("ModificacionDescuentoMovil",
                (listaDeReglas: Regla[]) => {
                    if (listaDeReglas.length >= 1) {
                        this.usuarioPuedeModificarDescuentos = (listaDeReglas[0].enabled.toUpperCase() === "SI");
                    }
                    callback();
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
        } catch (err) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al validar si modifica bonificacion: ${err.message}`
            });
        }
    }

    cargarDescuentos(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.obtenerSiElUsuarioPudeModificarDescuentos(() => {
                this.descuentoServicio.obtenerDescuentosPorClienteSku(this.cliente, this.sku, (listaDeDescuento: DescuentoPorEscalaSku[]) => {
                    this.validarSiAplicaElDescuento(listaDeDescuento, 0, (listaDeDescuentoParaAplicar: DescuentoPorEscalaSku[]) => {
                        this.listaDeDescuento = listaDeDescuentoParaAplicar;
                        this.cargarDescuentosPorMontoGeneralYFamiliaYTipoPago(()=>{
                            callback();
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });                        
                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al obtener descuentos: ${ex.message}`
            });
        }
    }

    cargarDescuentosPorMontoGeneralYFamiliaYTipoPago(callback:()=>void, errCallback:(resultado: Operacion)=>void){
        try{
            this.obtenerTotalDePaquetesConDescuentoAplicados(false,(total: number) => {
                let totalDeLaOrden: number = 0;//this.tarea.salesOrderTotal + total;
                this.listaDeSkuOrdenDeVenta.forEach((sku:Sku)=>{                    
                    if(sku.sku != this.sku.sku && sku.codeFamilySku == this.sku.codeFamilySku){
                        if (sku.discount !== 0) {
                            switch (sku.discountType) {
                                case TiposDeDescuento.Porcentaje.toString():
                                    totalDeLaOrden += trunc_number((sku.total - ((sku.discount * sku.total) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                    break;
                                case TiposDeDescuento.Monetario.toString():
                                    totalDeLaOrden += trunc_number(sku.total - sku.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                    break;
                            }
                        }
                        else{
                            totalDeLaOrden += sku.total
                        }
                    }                
                })
                
                totalDeLaOrden += total;
                //-----Obtenemos descuento por monto general y familia
                this.descuentoServicio.obtenerDescuentoPorMontoGeneralYFamilia(this.cliente, this.sku, totalDeLaOrden, (descuentoPorMontoGeneralYFamilia: DescuentoPorMontoGeneralYFamilia)=>{                    
                    //-----Validamos si aplica el descuento por monto general y familia
                    this.validarSiAplicaElDescuentoPorMontoGeneralYFamilia(descuentoPorMontoGeneralYFamilia, 0, (descuentoPorMontoGeneralYFamilia: DescuentoPorMontoGeneralYFamilia)=>{
                        this.descuentoPorMontoGeneralYFamilia = descuentoPorMontoGeneralYFamilia;
                        //-----Obtenemos descuento por familia y tipo pago
                        this.descuentoServicio.obtenerUnDescuentoPorFamiliaYTipoPago(this.cliente, this.tarea, this.sku, (descuentoPorFamiliaYTipoPago: DescuentoPorFamiliaYTipoPago)=>{
                            //-----Validamos si aplica el descuento por familia y tipo pago
                            this.validarSiAplicaElDescuentoPorFamiliaYTipoPago(descuentoPorFamiliaYTipoPago, 0, (descuentoPorFamiliaYTipoPago: DescuentoPorFamiliaYTipoPago)=>{
                                this.descuentoPorFamiliaYTipoPago = descuentoPorFamiliaYTipoPago
                            
                                let descuentoPorFamilia: number = this.descuentoPorMontoGeneralYFamilia.discount;
                                let descuentoPorTipoPago: number = this.descuentoPorFamiliaYTipoPago.discount;
                                
                                //-----Ocultamos las etiquetas 
                                let uiLiDescuentoPorFamilia = $('#UiLiDescuentoPorFamilia');
                                uiLiDescuentoPorFamilia.css("display", "none");                                
                                uiLiDescuentoPorFamilia = null;

                                let uiEtiquetaDescuentoPorFamiliaMaximo = $('#UiEtiquetaDescuentoPorFamiliaMaximo');
                                uiEtiquetaDescuentoPorFamiliaMaximo.css("display", "none");
                                uiEtiquetaDescuentoPorFamiliaMaximo = null;

                                let uiEtiquetaDescuentoPorTipoPagoMaximo = $('#UiEtiquetaDescuentoPorTipoPagoMaximo');
                                uiEtiquetaDescuentoPorTipoPagoMaximo.css("display", "none");
                                uiEtiquetaDescuentoPorTipoPagoMaximo = null;

                                //-----Validamos si  aplica un descuento
                                if(descuentoPorFamilia > 0 || descuentoPorTipoPago > 0){
                                    let UiLiDescuentoPorFamilia = $('#UiLiDescuentoPorFamilia');
                                    UiLiDescuentoPorFamilia.css("display", "block");
                                    UiLiDescuentoPorFamilia = null;                                   
                                }
                                //----Validamos si aplica el descuento por monto general y familia
                                if(descuentoPorFamilia > 0){
                                    
                                    let uiEtiquetaDescuentoPorFamiliaMaximo = $('#UiEtiquetaDescuentoPorFamiliaMaximo');
                                    uiEtiquetaDescuentoPorFamiliaMaximo.css("display", "block");
                                    switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                                        case TiposDeDescuento.Porcentaje.toString():
                                            uiEtiquetaDescuentoPorFamiliaMaximo.text(`Descuento por monto general y familia: ${format_number(descuentoPorFamilia, this.configuracionDeDecimales.defaultDisplayDecimals)}%`);
                                            break;
                                        case TiposDeDescuento.Monetario.toString():
                                        uiEtiquetaDescuentoPorFamiliaMaximo.text(`Descuento por monto general y familia: ${DarFormatoAlMonto(format_number(descuentoPorFamilia, this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                                            break;
                                    }                                    
                                    uiEtiquetaDescuentoPorFamiliaMaximo = null;                                    
                                }
                                //----Validamos si aplica el descuento por familia y tipo pago
                                if(descuentoPorTipoPago > 0){                                    
                                    let uiEtiquetaDescuentoPorTipoPagoMaximo = $('#UiEtiquetaDescuentoPorTipoPagoMaximo');
                                    uiEtiquetaDescuentoPorTipoPagoMaximo.css("display", "block");
                                    switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                                        case TiposDeDescuento.Porcentaje.toString():
                                            uiEtiquetaDescuentoPorTipoPagoMaximo.text(`Descuento por familia y tipo pago: ${format_number(descuentoPorTipoPago, this.configuracionDeDecimales.defaultDisplayDecimals)}%`);
                                            break;
                                        case TiposDeDescuento.Monetario.toString():
                                            uiEtiquetaDescuentoPorTipoPagoMaximo.text(`Descuento por familia y tipo pago: ${DarFormatoAlMonto(format_number(descuentoPorTipoPago, this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                                            break;
                                    }                                    
                                    uiEtiquetaDescuentoPorTipoPagoMaximo = null;                                    
                                }

                                callback();
                            }, (resultado: Operacion) => {
                                errCallback(resultado);
                            });                                                 
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });                        
                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });                                        
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            }, (resultado: Operacion) => {
                my_dialog("", "", "close");
                notify(resultado.mensaje);
            });                
            //}, (resultado: Operacion) => {
                //errCallback(resultado);
            //});
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al obtener descuentos por familias: ${ex.message}`
            });
        }
    }

    validarIngresoDeDescuento(errCallback: (resultado: Operacion) => void, callBack?: () => void) {
        try {            
            this.cargarDescuentosPorMontoGeneralYFamiliaYTipoPago(()=>{
                this.obtenerPaqueteSeleccionado((paquete: Paquete) => {
                    paquete.appliedDiscount = 0;
                    paquete.promoDescuento = new Promo();
                    let elDescuentoIngresadoSobrepasaLoMaximo = false;
                    let resultadoDescuento: DescuentoPorEscalaSku = this.listaDeDescuento.find((descuento: DescuentoPorEscalaSku) => {
                        return (this.paqueteSeleccionadoActual.codePackUnit === descuento.codePackUnit) && (descuento.lowLimit <= paquete.qty && paquete.qty <= descuento.highLimit);
                    });
                    if (resultadoDescuento) {
    
                        if (this.usuarioPuedeModificarDescuentos) {
                            let uiTextoDescuentoSku = $("#UiTextoDescuentoSku");
                            let cantidadDeDescuento = (uiTextoDescuentoSku.val() === "") ? 0 : parseFloat(uiTextoDescuentoSku.val());
                            if (cantidadDeDescuento > resultadoDescuento.discount) {
                                elDescuentoIngresadoSobrepasaLoMaximo = true;
                                let uiListaSkuMedidas = $('#UiTextoDescuentoSku');
                                uiListaSkuMedidas.focus();
                                uiListaSkuMedidas = null;
                            } else {
                                resultadoDescuento.qty = cantidadDeDescuento;
                                paquete.appliedDiscount = cantidadDeDescuento;
                                paquete.discountType = resultadoDescuento.discountType;
                            }
                            cantidadDeDescuento = null;
                            uiTextoDescuentoSku = null;
                        } else {
                            paquete.appliedDiscount = resultadoDescuento.qty;
                            paquete.discountType = resultadoDescuento.discountType;
                        }
                        paquete.promoDescuento.promoId = resultadoDescuento.promoId;
                        paquete.promoDescuento.promoName = resultadoDescuento.promoName;
                        paquete.promoDescuento.promoType = resultadoDescuento.promoType;
                        paquete.promoDescuento.frequency = resultadoDescuento.frequency;
    
                        let totalDescuento: number = (paquete.qty * paquete.price);
                        let descuentoPorcentaje : number = 0;
                        let descuentoMonetario : number = 0;
                        
                        switch (paquete.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                descuentoPorcentaje = resultadoDescuento.qty;            
                                totalDescuento = trunc_number((totalDescuento - ((descuentoPorcentaje * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                descuentoMonetario = resultadoDescuento.qty;
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < descuentoMonetario) ? 0 : trunc_number(totalDescuento - descuentoMonetario, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                        //-----Aplicamos el descuento por monto general y familia
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                descuentoPorcentaje = this.descuentoPorMontoGeneralYFamilia.discount;
                                totalDescuento = trunc_number((totalDescuento - ((descuentoPorcentaje * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                            descuentoMonetario = this.descuentoPorMontoGeneralYFamilia.discount;
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < descuentoMonetario) ? 0 : trunc_number(totalDescuento - descuentoMonetario, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }                        
                        //-----Aplicamos el descuento por monto familia y tipo pago
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                descuentoPorcentaje = this.descuentoPorFamiliaYTipoPago.discount;
                                totalDescuento = trunc_number((totalDescuento - ((descuentoPorcentaje * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                descuentoMonetario = this.descuentoPorFamiliaYTipoPago.discount;
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < descuentoMonetario) ? 0 : trunc_number(totalDescuento - descuentoMonetario, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }  


                        let uiEtiquetaTotalCdUnidadMedida = $("#UiEtiquetaTotalCDUnidadMedida");
                        uiEtiquetaTotalCdUnidadMedida.text(`Total CD: ${DarFormatoAlMonto(format_number((totalDescuento), this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                        uiEtiquetaTotalCdUnidadMedida = null;                                                                                                 
                    }
                    else {  
                        //-----Aplicamos el descuento por monto general y familia                  
                        let totalDescuento = (paquete.qty * paquete.price);
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalDescuento = trunc_number((totalDescuento - ((this.descuentoPorMontoGeneralYFamilia.discount * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorMontoGeneralYFamilia.discount) ? 0 : trunc_number(totalDescuento - this.descuentoPorMontoGeneralYFamilia.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                        //-----Aplicamos el descuento por monto familia y tipo pago
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():                                
                                totalDescuento = trunc_number((totalDescuento - ((this.descuentoPorFamiliaYTipoPago.discount * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():                                
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorFamiliaYTipoPago.discount) ? 0 : trunc_number(totalDescuento - this.descuentoPorFamiliaYTipoPago.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }  
                        let uiEtiquetaTotalCdUnidadMedida = $("#UiEtiquetaTotalCDUnidadMedida");
                        uiEtiquetaTotalCdUnidadMedida.css("display", "block");
                        uiEtiquetaTotalCdUnidadMedida.css("display", "inline");
                        uiEtiquetaTotalCdUnidadMedida.text(`Total CD: ${DarFormatoAlMonto(format_number((totalDescuento), this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                        uiEtiquetaTotalCdUnidadMedida = null;
                        totalDescuento = null;
                    }
                    resultadoDescuento = null;
                    if (elDescuentoIngresadoSobrepasaLoMaximo) {
                        errCallback(<Operacion>{
                            codigo: -1,
                            mensaje: "El descuento sobrepasa lo máximo establecido."
                        });
                    } else {
                        if (callBack) {
                            callBack();
                        }
                    }
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            }, (resultado: Operacion) =>{
                errCallback(resultado);
            });   
                  
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al establecer bonificaciones: ${ex.message}`
            });
        }
    }

    cargarControlesDeDescuento(callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            let uiListViewDescuento = $('#UiLiDescuentoSkuMaximo');
            uiListViewDescuento.css("display", "none");
            uiListViewDescuento = null;

            let uiEtiquetaTotalCdUnidadMedida = $("#UiEtiquetaTotalCDUnidadMedida");
            uiEtiquetaTotalCdUnidadMedida.css("display", "none");
            uiEtiquetaTotalCdUnidadMedida = null;

            this.cargarDescuentosPorMontoGeneralYFamiliaYTipoPago(()=>{
                this.obtenerPaqueteSeleccionado((paquete: Paquete) => {

                    let resultadoDeDescuento:DescuentoPorEscalaSku = this.listaDeDescuento.find((descuento: DescuentoPorEscalaSku) => {
                        return (this.paqueteSeleccionadoActual.codePackUnit === descuento.codePackUnit) && (descuento.lowLimit <= paquete.qty && paquete.qty <= descuento.highLimit);
                    });
                    if (resultadoDeDescuento) {
    
                        let resultadoListaDeDescuento = this.listaDeDescuento.filter((descuento: DescuentoPorEscalaSku) => {
                            return (this.paqueteSeleccionadoActual.codePackUnit === descuento.codePackUnit) && (descuento.lowLimit !== resultadoDeDescuento.lowLimit && resultadoDeDescuento.highLimit !== descuento.highLimit);
                        });
    
                        if (resultadoListaDeDescuento && resultadoListaDeDescuento.length > 0) {
                            resultadoListaDeDescuento.map((descuento: DescuentoPorEscalaSku) => {
                                descuento.qty = -1;
                            });
                        }
                        resultadoListaDeDescuento = null;
    
                        let uiListViewDescuento = $('#UiLiDescuentoSkuMaximo');
                        uiListViewDescuento.css("display", "block");
                        uiListViewDescuento = null;
    
                        let textoAMostrar = "";
    
                        switch (resultadoDeDescuento.discountType.toString()) {
                            case TiposDeDescuento.Porcentaje.toString():
                                textoAMostrar = `Descuento: ${resultadoDeDescuento.discount}%`;
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                textoAMostrar = `Descuento: ${DarFormatoAlMonto(format_number(resultadoDeDescuento.discount, this.configuracionDeDecimales.defaultDisplayDecimals))}`;
                                break;
                        }
    
                        let uiEtiquetaDescuentoSkuMaximo = $('#UiEtiquetaDescuentoSkuMaximo');
                        uiEtiquetaDescuentoSkuMaximo.text(textoAMostrar);
                        uiEtiquetaDescuentoSkuMaximo = null;
    
    
                        let uiDivIngresoDescuentoSku = $('#UiDivIngresoDescuentoSku');
                        uiDivIngresoDescuentoSku.css("display", "none");
    
                        if (this.usuarioPuedeModificarDescuentos) {
                            uiDivIngresoDescuentoSku.css("display", "block");
                            if (localStorage.getItem("USE_MAX_DISCOUNT") === SiNo.Si.toString()) {
                                if (resultadoDeDescuento.qty === -1) {
                                    resultadoDeDescuento.qty = ((paquete.appliedDiscount > 0) ? paquete.appliedDiscount : resultadoDeDescuento.discount);
                                }
                            }
                            let uiTextoDescuentoSku = $('#UiTextoDescuentoSku');
                            uiTextoDescuentoSku.val((resultadoDeDescuento.qty > 0) ? resultadoDeDescuento.qty : "");
                            uiTextoDescuentoSku = null;
                        } else {
                            resultadoDeDescuento.qty = resultadoDeDescuento.discount;
                        }
    
                        let totalDescuento: number = (paquete.qty * paquete.price);
                        

                        switch (paquete.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():                                
                                totalDescuento = trunc_number((totalDescuento - ((resultadoDeDescuento.qty * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():                                
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < resultadoDeDescuento.qty) ? 0 : trunc_number(totalDescuento - resultadoDeDescuento.qty, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                        //-----Aplicamos el descuento por monto general y familia                        
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalDescuento = trunc_number((totalDescuento - ((this.descuentoPorMontoGeneralYFamilia.discount * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorMontoGeneralYFamilia.discount) ? 0 : trunc_number(totalDescuento - this.descuentoPorMontoGeneralYFamilia.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                        }
                        
                        /*//-----Aplicamos el descuento por monto general y familia                        
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalDescuento = trunc_number((totalDescuento - ((this.descuentoPorMontoGeneralYFamilia.discount * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorMontoGeneralYFamilia.discount) ? 0 : trunc_number(totalDescuento - this.descuentoPorMontoGeneralYFamilia.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                        }*/
                        
                        //-----Aplicamos el descuento por monto familia y tipo pago                        
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalDescuento = trunc_number((totalDescuento - ((this.descuentoPorFamiliaYTipoPago.discount * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorFamiliaYTipoPago.discount) ? 0 : trunc_number(totalDescuento - this.descuentoPorFamiliaYTipoPago.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                        }                        

                        let uiEtiquetaTotalCdUnidadMedida = $("#UiEtiquetaTotalCDUnidadMedida");
                        uiEtiquetaTotalCdUnidadMedida.css("display", "block");
                        uiEtiquetaTotalCdUnidadMedida.css("display", "inline");
                        uiEtiquetaTotalCdUnidadMedida.text(`Total CD: ${DarFormatoAlMonto(format_number((totalDescuento), this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                        uiEtiquetaTotalCdUnidadMedida = null;                         
    
                        uiDivIngresoDescuentoSku = null;
                    }
                    else {                    
                        let totalDescuento = (paquete.qty * paquete.price);
                        //-----Aplicamos el descuento por monto general y familia                        
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalDescuento = trunc_number((totalDescuento - ((this.descuentoPorMontoGeneralYFamilia.discount * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorMontoGeneralYFamilia.discount) ? 0 : trunc_number(totalDescuento - this.descuentoPorMontoGeneralYFamilia.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                        //-----Aplicamos el descuento por monto familia y tipo pago
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalDescuento = trunc_number((totalDescuento - ((this.descuentoPorFamiliaYTipoPago.discount * totalDescuento) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalDescuento = (trunc_number(totalDescuento, this.configuracionDeDecimales.defaultCalculationsDecimals) < this.descuentoPorFamiliaYTipoPago.discount) ? 0 : trunc_number(totalDescuento - this.descuentoPorFamiliaYTipoPago.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);                                
                                break;
                        }  

                        let uiEtiquetaTotalCdUnidadMedida = $("#UiEtiquetaTotalCDUnidadMedida");
                        uiEtiquetaTotalCdUnidadMedida.css("display", "block");
                        uiEtiquetaTotalCdUnidadMedida.css("display", "inline");
                        uiEtiquetaTotalCdUnidadMedida.text(`Total CD: ${DarFormatoAlMonto(format_number((totalDescuento), this.configuracionDeDecimales.defaultDisplayDecimals))}`);
                        uiEtiquetaTotalCdUnidadMedida = null;
                        totalDescuento = null;
                    }
                    resultadoDeDescuento = null;
                    callBack();
                }, (resultado: Operacion) => {
                    errCallback(resultado);
                });
            }, (resultado: Operacion)=>{
                errCallback(resultado);
            });            
        } catch (ex) {
            errCallback(<Operacion>{
                codigo: -1,
                mensaje: `Error al establecer bonificaciones: ${ex.message}`
            });
        }
    }


    obtenerDescuentoPorMontoGeneral(total: number, callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.descuentoServicio.obtenerDescuentoPorMontoGeneral(this.cliente, total, (descuentoPorMontoGeneral) => {
                let resultadoDePromoHistorico = this.listaHistoricoDePromos.find((promo: Promo) => {
                    return promo.promoId === descuentoPorMontoGeneral.promoId;
                });
                if (resultadoDePromoHistorico) {
                    let promoDeBonificacion: Promo = new Promo();
                    promoDeBonificacion.promoId = descuentoPorMontoGeneral.promoId;
                    promoDeBonificacion.promoName = descuentoPorMontoGeneral.promoName;
                    promoDeBonificacion.frequency = descuentoPorMontoGeneral.frequency;
                    this.promoServicio.validarSiAplicaPromo(promoDeBonificacion,
                        resultadoDePromoHistorico,
                        (aplicaPromo) => {
                            if (aplicaPromo) {
                                descuentoPorMontoGeneral.apply = true;
                                this.descuentoPorMontoGeneral = descuentoPorMontoGeneral;
                            } else {
                                this.descuentoPorMontoGeneral = new DescuentoPorMontoGeneral();
                            }
                            callback();
                        },
                        (resultado: Operacion) => {
                            errCallback(resultado);
                        });
                } else {
                    this.descuentoPorMontoGeneral = descuentoPorMontoGeneral;
                    callback();
                }
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al obtener el descuento por monto general: ${ex.message}`
            } as Operacion);
        }
    }

    seAplicaElDescuentoModificado(descuentoOriginalDeModificacion: number, descuentoModificado: number, descuentoNuevo: number): boolean {
        return (descuentoOriginalDeModificacion !== 0 && descuentoModificado <= descuentoNuevo);
    }

    //----------Fin Descuentos----------//

    //----------Inicio Promociones----------//

    obtenerHistoricodePromo(callBack: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.promoServicio.obtenerHistoricoDePromosParaCliente(this.cliente, (listaHistoricoDePromos: Promo[]) => {
                this.listaHistoricoDePromos = listaHistoricoDePromos;
                callBack();
            }, (resultado: Operacion) => {
                errCallback(resultado);
            });
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al obtener historico de promociones: ${ex.message}`
            } as Operacion);
        }
    }

    validarSiAplicaLaBonificaciones(listaDeBonificaciones: Bono[], indiceDeListaDeBonificaciones: number, esBonificacionPorEscala: boolean, callBack: (listaDeBonificaciones: Bono[]) => void, errCallback: (resultado: Operacion) => void) {
        try {
            if (this.listaHistoricoDePromos.length > 0) {
                if (this.listaDeBonificacionesTerminoDeIterar(listaDeBonificaciones, indiceDeListaDeBonificaciones)) {
                    let bonificacionAValidar: Bono = listaDeBonificaciones[indiceDeListaDeBonificaciones];
                    let resultadoDePromoHistorico = this.listaHistoricoDePromos.find((promo: Promo) => {
                        return promo.promoId === ((esBonificacionPorEscala) ? bonificacionAValidar.promoIdScale : bonificacionAValidar.promoIdMultiple);
                    });
                    if (resultadoDePromoHistorico) {
                        let promoDeBonificacion: Promo = new Promo();
                        promoDeBonificacion.promoId = ((esBonificacionPorEscala) ? bonificacionAValidar.promoIdScale : bonificacionAValidar.promoIdMultiple);
                        promoDeBonificacion.promoName = ((esBonificacionPorEscala) ? bonificacionAValidar.promoNameScale : bonificacionAValidar.promoNameMultiple);
                        promoDeBonificacion.frequency = ((esBonificacionPorEscala) ? bonificacionAValidar.frequencyScale : bonificacionAValidar.frequencyMultiple);
                        this.promoServicio.validarSiAplicaPromo(promoDeBonificacion, resultadoDePromoHistorico, (aplicaBonificacion: boolean) => {
                            if (!aplicaBonificacion) {
                                listaDeBonificaciones = listaDeBonificaciones.filter((bonificacion: Bono) => {
                                    return resultadoDePromoHistorico.promoId !== ((esBonificacionPorEscala) ? bonificacion.promoIdScale : bonificacion.promoIdMultiple);
                                });
                            }
                            this.validarSiAplicaLaBonificaciones(listaDeBonificaciones, indiceDeListaDeBonificaciones + (aplicaBonificacion ? 1 : 0), esBonificacionPorEscala, (listaDeBonificaciones: Bono[]) => {
                                callBack(listaDeBonificaciones);
                            }, (resultado: Operacion) => {
                                errCallback(resultado);
                            });
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });
                        promoDeBonificacion = null;
                    } else {
                        this.validarSiAplicaLaBonificaciones(listaDeBonificaciones, indiceDeListaDeBonificaciones + 1, esBonificacionPorEscala, (listaDeBonificaciones: Bono[]) => {
                            callBack(listaDeBonificaciones);
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });
                    }
                } else {
                    callBack(listaDeBonificaciones);
                }
            } else {
                callBack(listaDeBonificaciones);
            }
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al validar la si aplica la bonificación: ${ex.message}`
            } as Operacion);
        }
    }

    listaDeBonificacionesTerminoDeIterar(listaDeBonificaciones: Bono[], indiceDeListaDeBonificaciones: number): boolean {
        return (listaDeBonificaciones.length > 0 && listaDeBonificaciones.length > indiceDeListaDeBonificaciones);
    }

    validarSiAplicaElDescuento(listaDeDescuento: DescuentoPorEscalaSku[], indiceDeListaDeDescuento: number, callBack: (listaDeDescuento: DescuentoPorEscalaSku[]) => void, errCallback: (resultado: Operacion) => void) {
        try {
            if (this.listaHistoricoDePromos.length > 0) {
                if (this.listaDeDescuentoTerminoDeIterar(listaDeDescuento, indiceDeListaDeDescuento)) {
                    let descuentoAValidar: DescuentoPorEscalaSku = listaDeDescuento[indiceDeListaDeDescuento];
                    let resultadoDePromoHistorico = this.listaHistoricoDePromos.find((promo: Promo) => {
                        return promo.promoId === descuentoAValidar.promoId;
                    });
                    if (resultadoDePromoHistorico) {
                        let promoDeDescuento: Promo = new Promo();
                        promoDeDescuento.promoId = descuentoAValidar.promoId;
                        promoDeDescuento.promoName = descuentoAValidar.promoName;
                        promoDeDescuento.frequency = descuentoAValidar.frequency;
                        this.promoServicio.validarSiAplicaPromo(promoDeDescuento, resultadoDePromoHistorico, (aplicaDescuento: boolean) => {
                            if (!aplicaDescuento) {
                                listaDeDescuento = listaDeDescuento.filter((descuento: DescuentoPorEscalaSku) => {
                                    return resultadoDePromoHistorico.promoId !== descuento.promoId;
                                });
                            }
                            this.validarSiAplicaElDescuento(listaDeDescuento, indiceDeListaDeDescuento + (aplicaDescuento ? 1 : 0), (listaDeDescuento: DescuentoPorEscalaSku[]) => {
                                callBack(listaDeDescuento);
                            }, (resultado: Operacion) => {
                                errCallback(resultado);
                            });
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });
                        promoDeDescuento = null;
                    } else {
                        this.validarSiAplicaElDescuento(listaDeDescuento, indiceDeListaDeDescuento + 1, (listaDeDescuento: DescuentoPorEscalaSku[]) => {
                            callBack(listaDeDescuento);
                        }, (resultado: Operacion) => {
                            errCallback(resultado);
                        });
                    }
                } else {
                    callBack(listaDeDescuento);
                }
            } else {
                callBack(listaDeDescuento);
            }
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al validar la si aplica el descuento: ${ex.message}`
            } as Operacion);
        }
    }

    listaDeDescuentoTerminoDeIterar(listaDeDescuento: DescuentoPorEscalaSku[], indiceDeListaDeDescuento: number): boolean {
        return (listaDeDescuento.length > 0 && listaDeDescuento.length > indiceDeListaDeDescuento);
    }

    validarSiAplicaElDescuentoPorMontoGeneralYFamilia(descuentoAValidar: DescuentoPorMontoGeneralYFamilia, indiceDeListaDeDescuento: number, callBack: (descuento: DescuentoPorMontoGeneralYFamilia) => void, errCallback: (resultado: Operacion) => void) {
        try {
            if (this.listaHistoricoDePromos.length > 0) {
                let resultadoDePromoHistorico = this.listaHistoricoDePromos.find((promo: Promo) => {
                    return promo.promoId === descuentoAValidar.promoId;
                });
                if (resultadoDePromoHistorico) {
                    let promoDeDescuento: Promo = new Promo();
                    promoDeDescuento.promoId = descuentoAValidar.promoId;
                    promoDeDescuento.promoName = descuentoAValidar.promoName;
                    promoDeDescuento.frequency = descuentoAValidar.frequency;

                    this.promoServicio.validarSiAplicaPromo(promoDeDescuento, resultadoDePromoHistorico, (aplicaDescuento: boolean) => {
                        if (!aplicaDescuento) {
                            descuentoAValidar = new DescuentoPorMontoGeneralYFamilia();
                            
                        }
                        callBack(descuentoAValidar);
                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });
                }
                else{
                    callBack(descuentoAValidar);
                }                
            } else {
                callBack(descuentoAValidar);
            }
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al validar la si aplica el descuento por monto general y familia: ${ex.message}`
            } as Operacion);
        }
    }

    validarSiAplicaElDescuentoPorFamiliaYTipoPago(descuentoAValidar: DescuentoPorFamiliaYTipoPago, indiceDeListaDeDescuento: number, callBack: (descuento: DescuentoPorFamiliaYTipoPago) => void, errCallback: (resultado: Operacion) => void) {
        try {
            if (this.listaHistoricoDePromos.length > 0) {
                let resultadoDePromoHistorico = this.listaHistoricoDePromos.find((promo: Promo) => {
                    return promo.promoId === descuentoAValidar.promoId;
                });
                if (resultadoDePromoHistorico) {
                    let promoDeDescuento: Promo = new Promo();
                    promoDeDescuento.promoId = descuentoAValidar.promoId;
                    promoDeDescuento.promoName = descuentoAValidar.promoName;
                    promoDeDescuento.frequency = descuentoAValidar.frequency;

                    this.promoServicio.validarSiAplicaPromo(promoDeDescuento, resultadoDePromoHistorico, (aplicaDescuento: boolean) => {
                        if (!aplicaDescuento) {
                            descuentoAValidar = new DescuentoPorFamiliaYTipoPago();
                            
                        }
                        callBack(descuentoAValidar);
                    }, (resultado: Operacion) => {
                        errCallback(resultado);
                    });
                }
                else{
                    callBack(descuentoAValidar);
                }                
            } else {
                callBack(descuentoAValidar);
            }
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al validar la si aplica el descuento por familia y tipo pago: ${ex.message}`
            } as Operacion);
        }
    }
    
    ObtenerTotalDeLaOrden(callBack: (total: number) => void, errCallback: (resultado: Operacion) => void) {
        try {
            let totalOrden : number = this.tarea.salesOrderTotal;
            let total : number = 0;
            this.listaDeSkuOrdenDeVenta.forEach((sku:Sku)=>{                    
                if(sku.sku != this.sku.sku && sku.codeFamilySku == this.sku.codeFamilySku){
                    if (sku.discount !== 0) {
                        switch (sku.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                total += trunc_number((sku.total - ((sku.discount * sku.total) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                total += trunc_number(sku.total - sku.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;                            
                        }
                    }
                    else{
                        total += trunc_number(sku.total, this.configuracionDeDecimales.defaultCalculationsDecimals);
                    }
                }
            })
            totalOrden = totalOrden - total;            
            let totalConDescuento : number = 0;
            this.listaDeSkuOrdenDeVenta.forEach((sku:Sku)=>{
                if(sku.sku != this.sku.sku && sku.codeFamilySku == this.sku.codeFamilySku){
                    let totalPaquete : number = sku.total
                    if (sku.discount !== 0) {
                        switch (sku.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalPaquete = trunc_number((sku.total - ((sku.discount * sku.total) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalPaquete = trunc_number(sku.total - sku.discount, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                    }

                    let descuentoPorFamilia: number = this.descuentoPorMontoGeneralYFamilia.discount;
                    let descuentoPorTipoPago: number = this.descuentoPorFamiliaYTipoPago.discount;

                    if(descuentoPorFamilia > 0){
                        switch (this.descuentoPorMontoGeneralYFamilia.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalPaquete = trunc_number((totalPaquete - ((descuentoPorFamilia * totalPaquete) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalPaquete = trunc_number(totalPaquete - descuentoPorFamilia, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                    }

                    if(descuentoPorTipoPago > 0){
                        switch (this.descuentoPorFamiliaYTipoPago.discountType) {
                            case TiposDeDescuento.Porcentaje.toString():
                                totalPaquete = trunc_number((totalPaquete - ((descuentoPorTipoPago * totalPaquete) / 100)), this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                            case TiposDeDescuento.Monetario.toString():
                                totalPaquete = trunc_number(totalPaquete - descuentoPorTipoPago, this.configuracionDeDecimales.defaultCalculationsDecimals);
                                break;
                        }
                    }
                    totalConDescuento += totalPaquete;
                    //total += sku.total                        
                }
            })
            totalOrden = totalOrden + totalConDescuento;
            callBack(totalOrden)
        } catch (ex) {
            errCallback({
                codigo: -1,
                mensaje: `Error al obtener el total: ${ex.message}`
            } as Operacion);
        }
    }

    //----------Fin Promociones----------//
}  