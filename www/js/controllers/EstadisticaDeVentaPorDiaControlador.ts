declare var _this: EstadisticaDeVentaPorDiaControlador;
class EstadisticaDeVentaPorDiaControlador {
  estadisticaDeVentaServicio: EstadisticaDeVentaServicio = new EstadisticaDeVentaServicio();
  estadisticaDeVentaPorCliente = new Array<EstadisticaDeVentaPorCliente>();
  funcionDeRetornoAProcesoPrincipal: Function = null;

  delegarEstadisticaDeVentaPorDiaControlador(): void {
    _this = this;
    $("#UiSaleStatisticPage").on("pageshow", e => {
      e.preventDefault();

      let diaSemana = $("#lblDiaSemana");
      diaSemana.html(estadisticaDeVentaPorDiaControlador.obtenerDiaActual());
      diaSemana = null;

      let tablaEstadistica = $("#TableEstadistica");
      tablaEstadistica.floatThead({
        scrollContainer: tabla => {
          return tabla.closest(".product-list-table");
        }
      });

      tablaEstadistica = null;
    });

    $("#SelectAllProducts").on("click", () => {
      let botonPrincipal: JQuery = $("#SelectAllProducts");

      $(".selection")
        .prop("checked", botonPrincipal.prop("checked"))
        .checkboxradio("refresh");
      botonPrincipal = null;
    });

    $(".selection").on("click", () => {
      if ($(".selection").length === $(".selection:checked").length) {
        $("#SelectAllProducts")
          .prop("checked", true)
          .checkboxradio("refresh");
      } else {
        $("#SelectAllProducts")
          .prop("checked", false)
          .checkboxradio("refresh");
      }
    });

    $("#UiBtnContinuarVenta").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      navigator.notification.confirm(
        "¿Desea continuar al proceso de venta?",
        buttonIndex => {
          if (buttonIndex === 2) {
            this.funcionDeRetornoAProcesoPrincipal();
          }
        },
        "Sonda® SD " + SondaVersion,
        ["No", "Si"]
      );
    });

    $("#UiBtnCrearVenta").on("click", (e: JQueryEventObject) => {
      e.preventDefault();
      let productosSeleccionados = [];

      if ($("input[class=selection]:checked").length > 0) {
        navigator.notification.confirm(
          "¿Desea crear una venta sugerida con los productos seleccionados?",
          buttonIndex => {
            if (buttonIndex === 2) {
              $("input[class=selection]:checked").each(function(
                _idx,
                productoSeleccionado
              ) {
                let codeSku = (productoSeleccionado as any).attributes["id"]
                  .nodeValue;
                let producto = (_this.estadisticaDeVentaPorCliente as any).find(
                  (estadisticaDeVenta: EstadisticaDeVentaPorCliente) => {
                    return estadisticaDeVenta.codeSku === codeSku;
                  }
                );

                if (producto) {
                  productosSeleccionados.push(producto);
                }
              });

              for (let i = 0; i < productosSeleccionados.length; i++) {
                let producto = productosSeleccionados[i];

                InsertInvoiceDetail(
                  producto.codeSku,
                  producto.price,
                  producto.qty <= producto.onHand
                    ? producto.qty
                    : producto.onHand,
                  () => {},
                  producto.salePackUnit,
                  producto.codePackUnitStock,
                  producto.conversionFactor || 1
                );
              }

              this.funcionDeRetornoAProcesoPrincipal();
            }
          },
          "Sonda® SD " + SondaVersion,
          ["No", "Si"]
        );
      } else {
        notify("Debe seleccionar al menos un registro");
      }
    });
  }

  regresarPantallaAutorizacion(): void {
    window.history.back();
  }

  construirVisualizacionDeEstadisticaDeCliente(
    estadisticas: Array<EstadisticaDeVentaPorCliente>,
    callback: () => void
  ): void {
    let registro: String[] = [];
    _this.estadisticaDeVentaPorCliente = estadisticas;

    let tablaEstadistica = $("#TableEstadistica tbody");
    tablaEstadistica.children().remove("tr");
    tablaEstadistica = null;
    estadisticas.forEach(
      (
        estadisticaDeVentaPorCliente: EstadisticaDeVentaPorCliente,
        iteracion: number
      ) => {
        let onHand = estadisticaDeVentaPorCliente.onHand;
        let qty = estadisticaDeVentaPorCliente.qty;
        let price = estadisticaDeVentaPorCliente.price;
        if (onHand == 0 || price == 0) {
          registro.push('<tr class="check  table-row-disabled">');
          registro.push('<td class="ui-checkbox ui-state-disabled" >');
          registro.push('<div class="ui-checkbox ui-state-disabled ">');
          registro.push(
            '<label class="ui-btn ui-corner-all ui-btn-inherit ui-btn-icon-left ui-checkbox-off" style="border: none;margin: 0; font-size: 12px; padding-bottom: 0; padding-top: 0; padding-right:0;">'
          );
        } else {
          registro.push('<tr class="check">');
          registro.push("<td>");
          registro.push('<div class="ui-checkbox ">');
          registro.push(
            '<label class="ui-btn ui-corner-all ui-btn-inherit ui-btn-icon-left ui-checkbox-off" style="border: none;margin: 0; font-size: 12px; padding-bottom: 0; padding-top: 0; padding-right:0;">'
          );
        }
        if (onHand == 0 || price == 0) {
          registro.push(
            `<input type="checkbox"  name="${estadisticaDeVentaPorCliente.codeSku}" id="${estadisticaDeVentaPorCliente.codeSku}" value="${estadisticaDeVentaPorCliente.skuName}">`
          );
        } else {
          registro.push(
            `<input type="checkbox" class="selection"  name="${estadisticaDeVentaPorCliente.codeSku}" id="${estadisticaDeVentaPorCliente.codeSku}" value="${estadisticaDeVentaPorCliente.skuName}">`
          );
        }
        registro.push(
          `<p class="valTableEstatistic">${estadisticaDeVentaPorCliente.codeSku}</p>`
        );
        registro.push(
          `<p class="valTableEstatistic">${estadisticaDeVentaPorCliente.skuName}</p>`
        );
        registro.push("</label>");
        registro.push("</div>");
        registro.push("</td>");
        registro.push(
          `<td class="valTableEstatistic">${estadisticaDeVentaPorCliente.qty}</td>`
        );
        registro.push(
          `<td class="valTableEstatistic">${estadisticaDeVentaPorCliente.onHand}</td>`
        );
        registro.push(
          `<td class="valTableEstatistic">${estadisticaDeVentaPorCliente.salePackUnit}</td>`
        );
        registro.push("</tr>");
      }
    );
    let cadenaHtml = registro.join("");
    $("#TableEstadistica tbody").append(cadenaHtml);
    /* Se utiliza el trigger para agregarle un evento al tbody y asi carga los estilos de lo contrario aparece simple */
    $("#TableEstadistica tbody").trigger("create");
    /* A los elementos con la clase .selection se le crea el evento click para que reconozca el evento */

    $(".selection").trigger("click");

    /* Se setea para que los elementos de la clase .selection aparezcan deshabilitados */

    $(".selection")
      .prop("checked", false)
      .checkboxradio("refresh");
    $("#SelectAllProducts").prop("checked", false);

    callback();
  }

  obtenerDiaActual(): string {
    let fecha = new Date();
    let dia_semana = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado"
    ];
    return dia_semana[fecha.getDay()];
  }
}
