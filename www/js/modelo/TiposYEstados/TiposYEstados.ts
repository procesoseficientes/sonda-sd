enum OpcionSiNo {
  No,
  Si
}

enum ResultadoOperacionTipo {
  Exitoso,
  Error
}

enum EstaEnLinea {
  No,
  Si
}

enum ReglaTipo {
  "Scouting" = <any>"agregarCliente",
  "CobroDeFacturaVencida" = <any>"FacturarAunConFacturasVencidas",
  "VisualizarEImprimirResumenDeFacturasEnReporteDeLiquidacion" = <any>(
    "VerEImprimirReporteFacturas"
  ),
  "VisualizarMultiplesOpcionesDeImpresion" = <any>(
    "VisualizarMultiplesOpcionesDeImpresion"
  ),
  "EncuestaInventarioCompetencia" = <any>"EncuestaInventarioCompetencia",
  "NoVenderAlContadoConLimiteExcedido" = <any>(
    "NoVenderAlContadoConLimiteExcedido"
  ),
  "MostrarModuloDeMetas" = <any>"MostrarModuloDeMetas"
}

enum EstadoDeManifiesto {
  "Asignado" = <any>"ASSIGNED",
  "Completado" = <any>"COMPLETED",
  "Certificado" = <any>"CERTIFIED",
  "Cancelado" = <any>"CANCELED"
}

enum TareaTipo {
  "Venta" = <any>"SALE",
  "Entrega" = <any>"DELIVERY_SD"
}

enum EstadoEntrega {
  "Cancelada" = <any>"CANCELED",
  "Entregado" = <any>"DELIVERED",
  "Pendiente" = <any>"PENDING",
  "Parcial" = <any>"PARTIAL"
}

enum TipoDeClasificacion {
  "NoEntrega" = <any>"NOT_DELIVERY_REASONS"
}

enum EstadoDePosteoDeNotaDeEntrega {
  "SinPostear" = 0,
  "PosteadaEnElServidor" = 2,
  "AnuladaSinPostear" = 3,
  "AnuladaPosteadaEnElServidor" = 4
}

enum ConfiguracionSondaSd {
  "FacturaEnRuta" = <any>"INVOICE_IN_ROUTE",
  "EntregaEnRuta" = <any>"DELIVERY_IN_ROUTE"
}

enum ResultadoDePosteoEnServidor {
  "Exitoso" = 1,
  "Fallido" = 0
}

enum GrupoParametro {
  "Factura" = <any>"INVOICE"
}

enum TipoDeParametro {
  "PorcentajeMinimoDePagoDeFacturasVencidas" = <any>"MINIMUM_PERCENT_OF_PAID"
}

enum TipoDePagoFacturaVencida {
  Cheque = "BANK_CHECK" as any,
  Deposito = "BANK_DEPOSIT" as any,
  Efectivo = "CASH" as any
}

enum OpcionDisponibleParaDocumentoDePagoSeleccionado {
  Reimprimir = "REPRINT" as any,
  VerDetalle = "DETAIL" as any
}

enum TipoDePagoDeFactura {
  FacturaVencida = "OVERDUE_INVOICE" as any,
  FacturaAbierta = "OPEN_INVOICE" as any
}

enum TiposDeSecuenciaAControlar {
  NuevaTarea = "NEW_TASK" as any
}
