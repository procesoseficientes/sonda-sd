interface IReglaServicio {
    guardarReglas(regla: any, callback: () => void, errorCallBack: (error: any) => void): void;

    obtenerRegla(tipoRegla: string, callbak: (results: SqlResultSet) => void, errorCallback: (error: string) => void): void;

    limpiarTabla(errorCallback: (error: string) => void): void;

    obtenerReglasParaInicioDeTarea(callback: (results: SqlResultSet) => void, errorCallback: (error: string) => void): void;

    ejecutarReglasDeInicioDeRuta(reglas: SqlResultSet, reglaActual: number, callback: () => void, errorCallback: (error: string) => void): void;

}