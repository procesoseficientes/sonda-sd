class ManejoDeDecimalesServicio implements IManejoDeDecimales {

    obtenerInformacionDeManejoDeDecimales(callback: (decimales: ManejoDeDecimales) => void, callbackError: (reultado: Operacion) => void) {
            var decimales = new ManejoDeDecimales();
        //try {
            
            decimales.defaultCalculationsDecimals = parseInt(localStorage.getItem("DEFAULT_CALCULATIONS_DECIMALS"));
            decimales.defaultDisplayDecimals = parseInt(localStorage.getItem("DEFAULT_DISPLAY_DECIMALS"));
            decimales.displayDecimalsRoundConfiguration = localStorage.getItem("DISPLAY_DECIMALS_ROUND_CONFIGURATION");
            decimales.displayDecimalsRoundType = localStorage.getItem("DISPLAY_DECIMALS_ROUND_TYPE");
            callback(decimales);

        //} catch (e) {
            //var operacion = new Operacion();
            //operacion.resultado = ResultadoOperacionTipo.Error;
            //operacion.codigo = e.code;
            //operacion.mensaje = "No se pudo obtener la configuracion de Decimales debido al siguiente error: " + e.message;
            //callbackError(operacion);
        //} 
    }

    calcularPorTipoDecimales(manejoDeDecimales: ManejoDeDecimales, valor: number) : number {
        var resultadoValor: number = 0;

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
                resultadoValor = trunc_number(valor, manejoDeDecimales.defaultCalculationsDecimals);
                break;
        }
        return resultadoValor;
    };
}