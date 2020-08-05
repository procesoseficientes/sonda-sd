interface IEstadisticaDeVentaServicio {

    agregarEstadisticaDeVenta(data: any): void;

    obtenerInformacionDeEstadisticaDeVenta(callback: (estadistica: EstadisticaDeVenta) => void): void;

    obtenerEstadisticaDeVenta(callback: (estadisticaDeVenta: EstadisticaDeVenta) => void, errorCallback: (resultado: Operacion) => void): void;

    obtenerInformacionDeVentasDelDia(estadisticaDeVenta: EstadisticaDeVenta, callback: (estadistica: EstadisticaDeVenta) => void, errorCallback: (resultado: Operacion) => void): void;
    
}