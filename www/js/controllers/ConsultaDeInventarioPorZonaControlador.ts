var socketConsultaInventario: SocketIOClient.Socket;

class ConsultaDeInventarioPorZonaControlador {

    

    consultaDeInventarioPorZonaServicio = new ConsultaDeInventarioPorZonaServicio();
    listaSkusPorZona: Sku[];
    vieneDeListadoDeSkus = false;
    

    delegarConsultaDeInventarioControlador() {
        const este = this;
        document.addEventListener("backbutton", () => {
            este.salirDeConsultaDeInventarioPorZona();
        }, true);

        $("#UiBtnConsultarInventarioPorZona").on("click", () => {
            this.vieneDeListadoDeSkus = false;
            this.mostrarPantallaDeConsultaDeInventarioPorZona();
        });

        $("#UiPageQueryInventoryByZone").on("pageshow", () => {
            my_dialog("", "", "close");
            let labelFecha = $("#uiLblUltimaConsulta");
            labelFecha.text(localStorage.getItem("ULTIMA_CONSULTA_DE_INVENTARIO"));
            labelFecha = null;

            let txtFiltro = $("#uiTxtFiltroInventarioSkuPorZona");
            txtFiltro.val("");
            txtFiltro.focus();
            txtFiltro = null;
        });

        $("#uiTxtFiltroInventarioSkuPorZona").on("keypress", (e) => {
            if (e.keyCode === 13) {
                this.usuarioDeseaConsultarInventarioDeSkusPorZona();
                return false;
            }
        });

        $("#uiBtnConsultarInventarioDeSkuPorZona").on("click", () => {
            this.usuarioDeseaConsultarInventarioDeSkusPorZona();
        });

        $("#uiBtnLimpiarFiltroDeConsultaDeInventarioPorZona").on("click", () => {
            let txtFiltro = $("#uiTxtFiltroInventarioSkuPorZona");
            txtFiltro.val("");
            txtFiltro.focus();
            txtFiltro = null;
        });

        $("#uiBtnSalirDeConsultaDeInventarioPorZona").on("click", () => {
            this.salirDeConsultaDeInventarioPorZona();
        });

        $("#UiBtnConsultarInventarioPorZonaDesdeListadoDeSkus").on("click", () => {
            this.vieneDeListadoDeSkus = true;
            this.mostrarPantallaDeConsultaDeInventarioPorZona();
        });
    }

    delegarSockets(socketIo: SocketIOClient.Socket) {
        try {
            socketIo.on("GetInventoryForSkuByZoneResponse",
                (data) => {
                    switch (data.option) {
                    case "inventory_for_sku_by_zone_found":
                        my_dialog("", "", "close");
                        this.actualizarFechaYHoraDeUltimaConsulta();
                        this.mostrarListadoDeSkusDeInventarioPorZona(data.recordSet);
                        break;
                    case "inventory_for_sku_by_zone_not_found":
                        my_dialog("", "", "close");
                        let skus = [];
                        this.actualizarFechaYHoraDeUltimaConsulta();
                        this.mostrarListadoDeSkusDeInventarioPorZona(skus);
                        skus = null;
                        break;
                    case "inventory_for_sku_by_zone_error":
                        my_dialog("", "", "close");
                        this.actualizarFechaYHoraDeUltimaConsulta();
                        notify(data.Message);
                        break;
                    }
                });
                socketConsultaInventario = socketIo;
        } catch (e) {
            notify(`Error al delegar Sockets debido a: ${e.message}`);
        } 
    }

    actualizarFechaYHoraDeUltimaConsulta() {
        try {
            localStorage.setItem("ULTIMA_CONSULTA_DE_INVENTARIO", getDateTime());
            let labelFecha = $("#uiLblUltimaConsulta");
            labelFecha.text(localStorage.getItem("ULTIMA_CONSULTA_DE_INVENTARIO"));
            labelFecha = null;
        } catch (e) {
            notify(e.message);
        } 
    }

    salirDeConsultaDeInventarioPorZona() {
        try {
            switch ($.mobile.activePage[0].id) {
            case "UiPageQueryInventoryByZone":
                const pantalla = this.vieneDeListadoDeSkus ? "skus_list_page" : "menu_page";
                $.mobile.changePage(`#${pantalla}`, {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
                break;
            }
        } catch (e) {
            notify(e.message);
        }
    }

    mostrarPantallaDeConsultaDeInventarioPorZona() {
        try {
            my_dialog("Por favor, espere", "", "open");
            this.limpiarListaDeSkusConsultados(() => {
                $.mobile.changePage("#UiPageQueryInventoryByZone", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            });
        } catch (e) {
            notify(e.message);
        }
    }

    limpiarListaDeSkusConsultados(callBack: any) {
        try {
            let uiListaSkus = $("#uiListaSkusDeInventarioPorZona");
            uiListaSkus.children().remove("li");
            uiListaSkus = null;
            callBack();
        } catch (e) {
            notify(e.message);
        }
    }

    usuarioDeseaConsultarInventarioDeSkusPorZona() {
        try {
            my_dialog("Espere", "Consultando información, por favor, espere...", "open");
            if (gIsOnline === EstaEnLinea.Si) {
                const skuAConsultar = $("#uiTxtFiltroInventarioSkuPorZona");

                if (skuAConsultar.val() === "") {
                    my_dialog("", "", "close");
                    notify("El campo de filtro no debe estar vacío, por favor, verifique y vuelva a intentar.");
                    skuAConsultar.focus();
                } else {
                    this.consultaDeInventarioPorZonaServicio.consultarInventarioDeSkuPorZona(socketConsultaInventario,
                        skuAConsultar.val(), (resultado) => {
                            my_dialog("", "", "close");
                            notify(resultado.mensaje);
                        });
                }
            } else {
                my_dialog("", "", "close");
                notify("Debe tener conexión al servidor para poder consultar los datos, por favor verifique y vuelva a intentar...");
            }
        } catch (e) {
            my_dialog("", "", "close");
            notify(e.message);
        }
    }

    mostrarListadoDeSkusDeInventarioPorZona(skus: any) {
        try {
            let li: string;
            const objetoListaSkus = $("#uiListaSkusDeInventarioPorZona");
            objetoListaSkus.children().remove("li");
            if (skus.length === 0) {
                li = "<li>";
                li += "<p>";
                li += "No se encontraron coincidencias para el Sku proporcionado...";
                li += "<p>";
                li += "</li>";
                objetoListaSkus.append(li);
                objetoListaSkus.listview("refresh");
            } else {
                li = "<li>";
                li += `<span style='width: 95%; text-align: center;'>${skus[0].DESCRIPTION_SKU}</span>`;
                li += "<table style='width: 100%;' data-role='table' data-mode='reflow' class='ui-responsive table-stroke'>";
                //cabeceras
                li += "<tr>";
                li += "<td style='width: 50%; text-align: left;'>";
                li += "<span>" + "<b>" + "BODEGA" + "</b></span>";
                li += "</td>";
                li += "<td style='width: 50%;text-align: right;'>";
                li += "<span>" + "<b>" + "DISPONIBLE" + "</b></span>";
                li += "</td>";
                li += "</tr>";
                for (let sku of skus) {
                    li += "<tr>";
                    li += "<td style='width: 50%; text-align: left;'>";
                    li += `<span>${sku.WAREHOUSE}</span>`;
                    li += "</td>";
                    li += "<td style='width: 50%; text-align: right;'>";
                    li += `<span>${sku.ON_HAND}</span>`;
                    li += "</td>";
                    li += "</tr>";

                    //li += `<span class='ui-content'><b>BODEGA: </b></span>&nbsp;<b>DISPONIBLE: </b> ${sku.ON_HAND}`;
                    //li += "<p>";
                }
                li += "</table>";
                li += "</li>";
                objetoListaSkus.append(li);
                objetoListaSkus.listview("refresh");
            }
        } catch (e) {
            notify(e.message);
        }
    }
}