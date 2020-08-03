class EstadisticaDeVentaControlador {
  estadisticaDeVentaServicio: EstadisticaDeVentaServicio = new EstadisticaDeVentaServicio();
  decimalesServicio: ManejoDeDecimalesServicio = new ManejoDeDecimalesServicio();
  decimales: ManejoDeDecimales = new ManejoDeDecimales();

  mostrarUOcultarContenedorDeModuloDeMEtas(
    mostrarModuloDeMetas: boolean
  ): void {
    let contenedorDeMetas = $("#UiGoalsContainer");
    if (mostrarModuloDeMetas) {
      contenedorDeMetas.css("display", "block");
      this.obtenerInformacionDeEstadisticaDeVentaActual();
    } else {
      contenedorDeMetas.css("display", "none");
    }
    contenedorDeMetas = null;
  }

  obtenerInformacionDeEstadisticaDeVentaActual(): void {
    this.estadisticaDeVentaServicio.obtenerInformacionDeEstadisticaDeVenta(
      (estadistica: EstadisticaDeVenta) => {
        this.construirVisualizacionDeInformacionDeEstadisticaDeVenta(
          estadistica
        );
      }
    );
  }

  construirVisualizacionDeInformacionDeEstadisticaDeVenta(
    estadisticaDeVenta: EstadisticaDeVenta
  ): void {
    try {
      this.decimalesServicio.obtenerInformacionDeManejoDeDecimales(
        (configuracionDeDecimales: ManejoDeDecimales) => {
          this.decimales = configuracionDeDecimales;

          let teamName = $("#teamName");
          let goalName = $("#goalName");
          let ranking = $("#ranking");
          let goalAmount = $("#goalAmount");
          let accumulatedAmount = $("#accumulatedAmount");
          let remainingDays = $("#remainingDays");
          let goalAmountOfDay = $("#goalAmountOfDay");
          let soldToday = $("#soldToday");
          let salesOrdersOfDay = $("#salesOrdersOfDay");
          let pendingToSaleToday = $("#pendingToSaleToday");
          let currencySymbol =
            localStorage.getItem("DISPLAY_SYMBOL_CURRENCY") || "Q";

          if (estadisticaDeVenta.goalHeaderId) {
            localStorage.setItem(
              "GOAL_HEADER_ID",
              estadisticaDeVenta.goalHeaderId.toString()
            );
          }

          teamName.text(estadisticaDeVenta.teamName);
          goalName.text(estadisticaDeVenta.goalName);
          ranking.text(estadisticaDeVenta.ranking);

          goalAmount.text(
            `${currencySymbol} ${format_number(
              estadisticaDeVenta.goalAmount,
              this.decimales.defaultDisplayDecimals
            )}`
          );

          accumulatedAmount.text(
            `${currencySymbol} ${format_number(
              estadisticaDeVenta.accumulatedAmount +
                estadisticaDeVenta.soldToday,
              this.decimales.defaultDisplayDecimals
            )} (${this.obtenerPorcentajeDeMetaCubiertoPorVentas(
              estadisticaDeVenta
            )}%) `
          );

          remainingDays.text(`${estadisticaDeVenta.remainingDays}`);

          goalAmountOfDay.text(
            `${currencySymbol} ${format_number(
              estadisticaDeVenta.goalAmountOfDay,
              this.decimales.defaultDisplayDecimals
            )}`
          );

          soldToday.text(
            `${currencySymbol} ${format_number(
              estadisticaDeVenta.soldToday,
              this.decimales.defaultDisplayDecimals
            )}`
          );

          salesOrdersOfDay.text(`(${estadisticaDeVenta.salesOrdersOfDay})`);
          pendingToSaleToday.text(
            `${currencySymbol} ${format_number(
              estadisticaDeVenta.pendingToSaleToday,
              this.decimales.defaultDisplayDecimals
            )}`
          );

          currencySymbol = null;
          teamName = null;
          goalName = null;
          ranking = null;
          goalAmount = null;
          accumulatedAmount = null;
          remainingDays = null;
          goalAmountOfDay = null;
          soldToday = null;
          salesOrdersOfDay = null;
          pendingToSaleToday = null;
        }
      );
    } catch (e) {
      console.log(
        `Ha ocurrido un error al intentar mostrar la estadística de venta debido a: ${
          e.message
        }`
      );
      notify(
        `Ha ocurrido un error al intentar mostrar la estadística de venta.`
      );
    }
  }

  obtenerPorcentajeDeMetaCubiertoPorVentas(
    estadisticaDeVenta: EstadisticaDeVenta
  ): number {
    let montoTotalAcumulado: number = 0;
    let porcentajeDeMetaCubierto: number = 0;

    montoTotalAcumulado =
      estadisticaDeVenta.accumulatedAmount + estadisticaDeVenta.soldToday;
    if (montoTotalAcumulado > 0 && estadisticaDeVenta.goalAmount > 0) {
      porcentajeDeMetaCubierto =
        (montoTotalAcumulado * 100) / estadisticaDeVenta.goalAmount;
    }

    return porcentajeDeMetaCubierto;
  }
}
