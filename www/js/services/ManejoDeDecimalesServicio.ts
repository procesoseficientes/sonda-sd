class ManejoDeDecimalesServicio implements IManejoDeDecimales {
  obtenerInformacionDeManejoDeDecimales(
    callback: (decimales: ManejoDeDecimales) => void
  ) {
    let decimales = new ManejoDeDecimales();
    try {
      decimales.defaultCalculationsDecimals = parseInt(
        localStorage.getItem("DEFAULT_CALCULATIONS_DECIMALS")
      );
      decimales.defaultDisplayDecimals = parseInt(
        localStorage.getItem("DEFAULT_DISPLAY_DECIMALS")
      );
      decimales.displayDecimalsRoundConfiguration = localStorage.getItem(
        "DISPLAY_DECIMALS_ROUND_CONFIGURATION"
      );
      decimales.displayDecimalsRoundType = localStorage.getItem(
        "DISPLAY_DECIMALS_ROUND_TYPE"
      );
      decimales.defaultDisplayDecimalsForSkuQty = parseInt(
        localStorage.getItem("DEFAULT_DISPLAY_DECIMALS_FOR_SKU_QTY")
      );
      decimales.currencySymbol = localStorage.getItem("CURRENCY_SYMBOL") || "Q";
      callback(decimales);
    } catch (e) {
      decimales.defaultCalculationsDecimals = 2;
      decimales.defaultDisplayDecimals = 2;
      decimales.displayDecimalsRoundConfiguration = "TOTAL";
      decimales.displayDecimalsRoundType = "ROUND";
      decimales.defaultDisplayDecimalsForSkuQty = 2;
      decimales.currencySymbol = "Q";
      callback(decimales);
    }
  }

  calcularPorTipoDecimales(
    manejoDeDecimales: ManejoDeDecimales,
    valor: number
  ): number {
    let resultadoValor: number = 0;

    switch (manejoDeDecimales.displayDecimalsRoundType) {
      case "TRUNC":
        resultadoValor = format_number(valor, 0);
        break;
      case "ROUND":
        resultadoValor = Math.round(valor);
        break;
      case "FLOOR":
        resultadoValor = Math.floor(valor);
        break;
      case "CEILING":
        resultadoValor = Math.ceil(valor);
        break;
      default:
        resultadoValor = trunc_number(
          valor,
          manejoDeDecimales.defaultCalculationsDecimals
        );
        break;
    }
    return resultadoValor;
  }
}
