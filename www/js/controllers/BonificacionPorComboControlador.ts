/// <reference path="../vertical/messenger.ts" />
/// <reference path="../vertical/mensaje.ts" />

class BonificacionPorComboControlador {

    tokenCombo: SubscriptionToken;

    bonoServicio = new BonoServicio();

    listaDeSkuBonificacionPorCombo: BonoPorCombo;
    indice: number;
    usuarioPuedeModificarBonificacionDeCombo: boolean = false;

    constructor(public mensajero: Messenger) {
        this.tokenCombo = mensajero.subscribe<BonoPorComboMensaje>(this.bonificacionPorCombo, getType(BonoPorComboMensaje), this);
    }

    delegarBonificacionPorComboControlador() {

        var este: BonificacionPorComboControlador = this;

        document.addEventListener("backbutton", () => {
            este.usuarioDeseaVerPantallaAnterior();
        }, true);

        $(document).on("pagebeforechange",
            (event, data) => {
                if (data.toPage === "UiPageBonusByCombo") {
                    este.listaDeSkuBonificacionPorCombo = data.options.data.listaDeSkuBonificacionPorCombo;
                    este.indice = data.options.data.indice;

                    este.cargarPantalla();
                    $.mobile.changePage("#UiPageBonusByCombo");
                }
            });

        $("#uiBtnAceptarBonificacionDeCombo").on("click", () => {
            este.validarSkusBonificacion(() => {
                este.publicarBonoPorCombo(este.listaDeSkuBonificacionPorCombo, este.indice, () => {
                    este.usuarioDeseaVerPantallaAnterior();
                });
            },(resultado: Operacion) => {
                notify(resultado.mensaje);
            });
        });

        $("#uiBtnCancelarBonificacionDeCombo").on("click", () => {
            este.usuarioDeseaRetornarAListadoDeVenta();
        });

    }

    cargarSkusBonificacionPorCombo() {
        try {

            my_dialog("Cargando...", "Cargando lista de SKUs bonificados, por favor, espere...", "open");
            let objetoListaDeSkuBonificados = $("#uiListaSkuBonificacionCombo");
            objetoListaDeSkuBonificados.children().remove("li");

            let esElPrimero = !(this.listaDeSkuBonificacionPorCombo.isConfig);

            let lblTitulo = $("#UiLblComboBonificacion");
            let etiquetaPrincipalCombos = $("#etiquetaPrincipalCombos");
            if (this.listaDeSkuBonificacionPorCombo.bonusSubType === SubTipoDeBonificacionPorCombo.Multiple.toString()) {
                lblTitulo.html(`${this.listaDeSkuBonificacionPorCombo.nameCombo} <br>${DescripcionSubTipoDeBonificacionPorCombo.Multiple.toString()}`);
                etiquetaPrincipalCombos.html('Debe de escoger por lo menos una bonificación');
                esElPrimero = false;
            } else {
                etiquetaPrincipalCombos.html("Solo puede escoger una bonificación");
                lblTitulo.html(this.listaDeSkuBonificacionPorCombo.nameCombo + "<br>Bonificación " + DescripcionSubTipoDeBonificacionPorCombo.Unica.toString());
            }

            let li = '<li data-icon="false">';
            li += '<table name="' + this.listaDeSkuBonificacionPorCombo.comboId + '" id= "' + this.listaDeSkuBonificacionPorCombo.comboId + '" data-role="table" data-mode="reflow" class="ui-responsive table-stroke">';

            let indice: number = 0;
            for (let skuBonificado of this.listaDeSkuBonificacionPorCombo.skusDeBonoPorCombo) {
                li += "<tr>";

                li += '<td style="width: 15%">';
                li += '<input type="';
                li += (this.listaDeSkuBonificacionPorCombo.bonusSubType === SubTipoDeBonificacionPorCombo.Multiple.toString()) ? 'checkbox' : 'radio';
                li += `" class="configuracionBonificacionPorCombo" name="eleccionDeBonificacionPorCombo" id="e${skuBonificado.codeSku}|${skuBonificado.codePackUnit}" value="${skuBonificado.codeSku}|${skuBonificado.codePackUnit}|${skuBonificado.qty}|${indice}" `;
                //li += ' onclick="seleccionoOpcionEnBonificacionPorCombo(\'cant' + skuBonificado.codeSku + skuBonificado.codePackUnit + '\')"';
                li += (esElPrimero || skuBonificado.isCheacked || (!this.usuarioPuedeModificarBonificacionDeCombo && this.listaDeSkuBonificacionPorCombo.bonusSubType === SubTipoDeBonificacionPorCombo.Multiple.toString()) ? 'checked="checked" ' : "");
                li += (!this.usuarioPuedeModificarBonificacionDeCombo && this.listaDeSkuBonificacionPorCombo.bonusSubType === SubTipoDeBonificacionPorCombo.Multiple.toString()) ? "disabled />" : "/>";
                li += "</td>";

                li += '<td style="width: 90%;word-wrap: break-word;word-break: break-all;">';
                li += "<p>" + skuBonificado.codeSku + "</p>" +
                    "<p>" + skuBonificado.descriptionSku + "</p>" +
                    "<p>" + skuBonificado.descriptionPackUnit + "</p>";
                    if (this.usuarioPuedeModificarBonificacionDeCombo === false) {
                        li += `<p class='small-roboto id='cant${skuBonificado.codeSku}|${skuBonificado.codePackUnit}'>${skuBonificado.qty}</p>`;
                    } else {
                        let cantidadParaBonificar = (localStorage.getItem("USE_MAX_BONUS") === "1" ? skuBonificado.qty : "");
                        cantidadParaBonificar = (skuBonificado.isCheacked ? skuBonificado.selectedQty : cantidadParaBonificar);
                        li += `<input class='configuracionBonificacionPorComboCantidad ui-input-text ui-body-inherit ui-corner-all ui-shadow-inset' type='number' pattern='[0-9]*' id='cant${skuBonificado.codeSku}${skuBonificado.codePackUnit}' value='${cantidadParaBonificar
                            }' placeholder='Bonificacion Maxima ${skuBonificado.qty}'/>`;
                    }
                li += "</td>";

                li += "</tr>";
                if (esElPrimero) {
                    esElPrimero = false;
                }
                indice++;
            }

            if (this.usuarioPuedeModificarBonificacionDeCombo && this.listaDeSkuBonificacionPorCombo.bonusSubType === SubTipoDeBonificacionPorCombo.Unica.toString()) {
                li += "<tr>";
                li += '<td style="width: 15%">';
                li += '<input type="radio" class="configuracionBonificacionPorCombo" name="eleccionDeBonificacionPorCombo" id="none" value="none" ' + ((this.listaDeSkuBonificacionPorCombo.isConfig && this.listaDeSkuBonificacionPorCombo.isEmpty) ? 'checked="checked" ' : "") + '/>';
                li += "</td>";
                li += '<td style="width: 60%">';
                li += "<span>Ninguno</span>";
                li += "</td>";
                li += "</tr>";
            }

            li += "</table></li>";
            //console.log(li);
            objetoListaDeSkuBonificados.append(li);
            objetoListaDeSkuBonificados.listview("refresh");

            li = null;
            lblTitulo = null;
            objetoListaDeSkuBonificados = null;
            
            my_dialog("", "", "close");
        } catch (e) {
            my_dialog("", "", "close");
            notify(`No se ha podido cargar la lista de SKUs a bonificar debido a: ${e.message}`);
        } 
    }

    usuarioDeseaVerPantallaAnterior() {
        switch ($.mobile.activePage[0].id) {
            case "UiPageBonusByCombo":
                this.usuarioDeseaRetornarAListadoDeVenta();
                break;
        }
    }

    usuarioDeseaRetornarAListadoDeVenta() {
        window.history.back();
    }

    bonificacionPorCombo(mensaje: BonoPorComboMensaje, subcriber: any): void {
        subcriber.listaDeSkuBonificacionPorCombo = mensaje.bonoPorCombo;
        subcriber.indice = mensaje.indice;
    }

    publicarBonoPorCombo(bonoPorCombo: BonoPorCombo, index: number, callback: () => void) {
        var msg = new BonoPorComboMensaje(this);
        msg.bonoPorCombo = bonoPorCombo;
        msg.indice = index;
        this.mensajero.publish(msg, getType(BonoPorComboMensaje));
        callback();
    }

    validarSkusBonificacion(callback: () => void, errCallback: (resultado: Operacion) => void) {
        try {
            this.colocarComoNoSelecionado(() => {
                let bonificacionesPorCombo: SkuDeBonoPorCombo[] = [];
                let sku: Array<string>;
                let skuSeleccionado;
                let valorDeObjeto = "";
                let sinErrores: boolean = true;

                if (this.listaDeSkuBonificacionPorCombo.bonusSubType ===
                    SubTipoDeBonificacionPorCombo.Multiple.toString()) {
                    $('input[type="checkbox"]').filter('.configuracionBonificacionPorCombo')
                        .map((index: number, element: any) => {
                            let control = element;

                            if (control.checked) {
                                let datosDeBono = control.value.split("|");
                                let cantidad = parseInt(datosDeBono[ComboBonoParser.CantidadMaxima]);

                                skuSeleccionado = this.listaDeSkuBonificacionPorCombo.skusDeBonoPorCombo[datosDeBono[ComboBonoParser.Indice]];

                                if (this.usuarioPuedeModificarBonificacionDeCombo) {
                                    valorDeObjeto = obtenerValorDeObjeto("cant" + datosDeBono[ComboBonoParser.CodigoDeSku] + datosDeBono[ComboBonoParser.UnidadDeMedida]);
                                    cantidad = (valorDeObjeto === '' ? 0 : parseInt(valorDeObjeto));
                                }

                                if (cantidad > 0 && cantidad <= parseInt(datosDeBono[ComboBonoParser.CantidadMaxima])) {
                                    skuSeleccionado.selectedQty = cantidad;
                                    skuSeleccionado.isCheacked = true;
                                    bonificacionesPorCombo.push(skuSeleccionado);

                                    datosDeBono.length = 0;
                                    skuSeleccionado = null;
                                    this.listaDeSkuBonificacionPorCombo.isEmpty = false;
                                } else {
                                    if (cantidad !== 0) {
                                        sinErrores = false;
                                        errCallback(<Operacion>{ codigo: -1, mensaje: "Error: La cantidad ingresada debe ser entre 1 y " + datosDeBono[ComboBonoParser.CantidadMaxima] });
                                        return;
                                    }
                                }
                            }
                            control = null;
                        });
                } else {
                    let control = $('input[name=eleccionDeBonificacionPorCombo]:checked');

                    if (control.val() === "none") {
                        this.listaDeSkuBonificacionPorCombo.isEmpty = true;
                    } else {
                        let datosDeBono = control.val().split("|");
                        let cantidad = parseInt(datosDeBono[ComboBonoParser.CantidadMaxima]);

                        skuSeleccionado = this.listaDeSkuBonificacionPorCombo.skusDeBonoPorCombo[datosDeBono[ComboBonoParser.Indice]];

                        if (this.usuarioPuedeModificarBonificacionDeCombo) {
                            valorDeObjeto = obtenerValorDeObjeto("cant" + datosDeBono[ComboBonoParser.CodigoDeSku] + datosDeBono[ComboBonoParser.UnidadDeMedida]);
                            cantidad = (valorDeObjeto === '' ? 0 : parseInt(valorDeObjeto));
                        }

                        if (cantidad > 0 && cantidad <= parseInt(datosDeBono[ComboBonoParser.CantidadMaxima])) {
                            skuSeleccionado.selectedQty = cantidad;
                            skuSeleccionado.isCheacked = true;
                            bonificacionesPorCombo.push(skuSeleccionado);

                            datosDeBono.length = 0;
                            skuSeleccionado = null;
                            this.listaDeSkuBonificacionPorCombo.isEmpty = false;
                        } else {
                            errCallback(<Operacion>{ codigo: -1, mensaje: "Error: La cantidad ingresada debe de estar entre 1 y " + datosDeBono[ComboBonoParser.CantidadMaxima] });
                            sinErrores = false;
                            return false;
                        }
                    }
                    control = null;
                }

                if (sinErrores) {
                    if (bonificacionesPorCombo.length > 0) {
                        this.listaDeSkuBonificacionPorCombo.skusDeBonoPorComboAsociados = bonificacionesPorCombo;
                    } else {
                        this.listaDeSkuBonificacionPorCombo.isEmpty = true;
                    }
                    this.listaDeSkuBonificacionPorCombo.isConfig = true;

                    callback();
                }
            });
        } catch (e) {
            errCallback(<Operacion>{ codigo: -1, mensaje: "Error al validar configuracion: " + e.message });
        }
    }

    colocarComoNoSelecionado(callback: () => void) {
        this.listaDeSkuBonificacionPorCombo.skusDeBonoPorCombo.map((skuBonificado) => {
            skuBonificado.isCheacked = false;
        });
        callback();
    }

    cargarPantalla() {
        this.bonoServicio.validarSiModificaBonificacionPorCombo((puedeModificar: boolean) => {
            this.usuarioPuedeModificarBonificacionDeCombo = puedeModificar;
            this.cargarSkusBonificacionPorCombo();
        },
            (resultado: Operacion) => {
                this.usuarioPuedeModificarBonificacionDeCombo = false;
                notify("Error al validar si puede modificar la bonificacion por combo: " + resultado.mensaje);
            });
    }
}
