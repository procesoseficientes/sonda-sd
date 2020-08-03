interface IResumenDeTareaServicio {
  obtenerFacturaPorIdentificadorDeTarea(
    identificadorDeTarea: number,
    callback: (factura: FacturaEncabezado) => void,
    errorCallback: (resultado: Operacion) => void
  ): void;

  crearNuevaTarea(
    tarea: any,
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ): void;
}
