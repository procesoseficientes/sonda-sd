interface IReporteDeEntregasServicio {
    obtenerEntregasProcesadas(callBack: (entregasProcesadas: DemandaDeDespachoEncabezado[]) => void, errorCallBack: (error: Operacion) => void): void;

    obtenerEntregasPendientes(callBack: (entregasPendientes: DemandaDeDespachoEncabezado[]) => void, errorCallBack: (error: Operacion) => void): void;

    obtenerEntregasCanceladas(callBack: (entregasProcesadas: DemandaDeDespachoEncabezado[]) => void, errorCallBack: (error: Operacion) => void): void;
}