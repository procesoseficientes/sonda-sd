var OpcionSiNo;
(function (OpcionSiNo) {
    OpcionSiNo[OpcionSiNo["No"] = 0] = "No";
    OpcionSiNo[OpcionSiNo["Si"] = 1] = "Si";
})(OpcionSiNo || (OpcionSiNo = {}));
var ResultadoOperacionTipo;
(function (ResultadoOperacionTipo) {
    ResultadoOperacionTipo[ResultadoOperacionTipo["Exitoso"] = 0] = "Exitoso";
    ResultadoOperacionTipo[ResultadoOperacionTipo["Error"] = 1] = "Error";
})(ResultadoOperacionTipo || (ResultadoOperacionTipo = {}));
var EstaEnLinea;
(function (EstaEnLinea) {
    EstaEnLinea[EstaEnLinea["No"] = 0] = "No";
    EstaEnLinea[EstaEnLinea["Si"] = 1] = "Si";
})(EstaEnLinea || (EstaEnLinea = {}));
var ReglaTipo;
(function (ReglaTipo) {
    ReglaTipo[ReglaTipo["Scouting"] = "agregarCliente"] = "Scouting";
    ReglaTipo[ReglaTipo["CobroDeFacturaVencida"] = "FacturarAunConFacturasVencidas"] = "CobroDeFacturaVencida";
    ReglaTipo[ReglaTipo["VisualizarEImprimirResumenDeFacturasEnReporteDeLiquidacion"] = ("VerEImprimirReporteFacturas")] = "VisualizarEImprimirResumenDeFacturasEnReporteDeLiquidacion";
    ReglaTipo[ReglaTipo["VisualizarMultiplesOpcionesDeImpresion"] = ("VisualizarMultiplesOpcionesDeImpresion")] = "VisualizarMultiplesOpcionesDeImpresion";
    ReglaTipo[ReglaTipo["EncuestaInventarioCompetencia"] = "EncuestaInventarioCompetencia"] = "EncuestaInventarioCompetencia";
    ReglaTipo[ReglaTipo["NoVenderAlContadoConLimiteExcedido"] = ("NoVenderAlContadoConLimiteExcedido")] = "NoVenderAlContadoConLimiteExcedido";
    ReglaTipo[ReglaTipo["MostrarModuloDeMetas"] = "MostrarModuloDeMetas"] = "MostrarModuloDeMetas";
})(ReglaTipo || (ReglaTipo = {}));
var EstadoDeManifiesto;
(function (EstadoDeManifiesto) {
    EstadoDeManifiesto[EstadoDeManifiesto["Asignado"] = "ASSIGNED"] = "Asignado";
    EstadoDeManifiesto[EstadoDeManifiesto["Completado"] = "COMPLETED"] = "Completado";
    EstadoDeManifiesto[EstadoDeManifiesto["Certificado"] = "CERTIFIED"] = "Certificado";
    EstadoDeManifiesto[EstadoDeManifiesto["Cancelado"] = "CANCELED"] = "Cancelado";
})(EstadoDeManifiesto || (EstadoDeManifiesto = {}));
var TareaTipo;
(function (TareaTipo) {
    TareaTipo[TareaTipo["Venta"] = "SALE"] = "Venta";
    TareaTipo[TareaTipo["Entrega"] = "DELIVERY_SD"] = "Entrega";
})(TareaTipo || (TareaTipo = {}));
var EstadoEntrega;
(function (EstadoEntrega) {
    EstadoEntrega[EstadoEntrega["Cancelada"] = "CANCELED"] = "Cancelada";
    EstadoEntrega[EstadoEntrega["Entregado"] = "DELIVERED"] = "Entregado";
    EstadoEntrega[EstadoEntrega["Pendiente"] = "PENDING"] = "Pendiente";
    EstadoEntrega[EstadoEntrega["Parcial"] = "PARTIAL"] = "Parcial";
})(EstadoEntrega || (EstadoEntrega = {}));
var TipoDeClasificacion;
(function (TipoDeClasificacion) {
    TipoDeClasificacion[TipoDeClasificacion["NoEntrega"] = "NOT_DELIVERY_REASONS"] = "NoEntrega";
})(TipoDeClasificacion || (TipoDeClasificacion = {}));
var EstadoDePosteoDeNotaDeEntrega;
(function (EstadoDePosteoDeNotaDeEntrega) {
    EstadoDePosteoDeNotaDeEntrega[EstadoDePosteoDeNotaDeEntrega["SinPostear"] = 0] = "SinPostear";
    EstadoDePosteoDeNotaDeEntrega[EstadoDePosteoDeNotaDeEntrega["PosteadaEnElServidor"] = 2] = "PosteadaEnElServidor";
    EstadoDePosteoDeNotaDeEntrega[EstadoDePosteoDeNotaDeEntrega["AnuladaSinPostear"] = 3] = "AnuladaSinPostear";
    EstadoDePosteoDeNotaDeEntrega[EstadoDePosteoDeNotaDeEntrega["AnuladaPosteadaEnElServidor"] = 4] = "AnuladaPosteadaEnElServidor";
})(EstadoDePosteoDeNotaDeEntrega || (EstadoDePosteoDeNotaDeEntrega = {}));
var ConfiguracionSondaSd;
(function (ConfiguracionSondaSd) {
    ConfiguracionSondaSd[ConfiguracionSondaSd["FacturaEnRuta"] = "INVOICE_IN_ROUTE"] = "FacturaEnRuta";
    ConfiguracionSondaSd[ConfiguracionSondaSd["EntregaEnRuta"] = "DELIVERY_IN_ROUTE"] = "EntregaEnRuta";
})(ConfiguracionSondaSd || (ConfiguracionSondaSd = {}));
var ResultadoDePosteoEnServidor;
(function (ResultadoDePosteoEnServidor) {
    ResultadoDePosteoEnServidor[ResultadoDePosteoEnServidor["Exitoso"] = 1] = "Exitoso";
    ResultadoDePosteoEnServidor[ResultadoDePosteoEnServidor["Fallido"] = 0] = "Fallido";
})(ResultadoDePosteoEnServidor || (ResultadoDePosteoEnServidor = {}));
var GrupoParametro;
(function (GrupoParametro) {
    GrupoParametro[GrupoParametro["Factura"] = "INVOICE"] = "Factura";
})(GrupoParametro || (GrupoParametro = {}));
var TipoDeParametro;
(function (TipoDeParametro) {
    TipoDeParametro[TipoDeParametro["PorcentajeMinimoDePagoDeFacturasVencidas"] = "MINIMUM_PERCENT_OF_PAID"] = "PorcentajeMinimoDePagoDeFacturasVencidas";
})(TipoDeParametro || (TipoDeParametro = {}));
var TipoDePagoFacturaVencida;
(function (TipoDePagoFacturaVencida) {
    TipoDePagoFacturaVencida[TipoDePagoFacturaVencida["Cheque"] = "BANK_CHECK"] = "Cheque";
    TipoDePagoFacturaVencida[TipoDePagoFacturaVencida["Deposito"] = "BANK_DEPOSIT"] = "Deposito";
    TipoDePagoFacturaVencida[TipoDePagoFacturaVencida["Efectivo"] = "CASH"] = "Efectivo";
})(TipoDePagoFacturaVencida || (TipoDePagoFacturaVencida = {}));
var OpcionDisponibleParaDocumentoDePagoSeleccionado;
(function (OpcionDisponibleParaDocumentoDePagoSeleccionado) {
    OpcionDisponibleParaDocumentoDePagoSeleccionado[OpcionDisponibleParaDocumentoDePagoSeleccionado["Reimprimir"] = "REPRINT"] = "Reimprimir";
    OpcionDisponibleParaDocumentoDePagoSeleccionado[OpcionDisponibleParaDocumentoDePagoSeleccionado["VerDetalle"] = "DETAIL"] = "VerDetalle";
})(OpcionDisponibleParaDocumentoDePagoSeleccionado || (OpcionDisponibleParaDocumentoDePagoSeleccionado = {}));
var TipoDePagoDeFactura;
(function (TipoDePagoDeFactura) {
    TipoDePagoDeFactura[TipoDePagoDeFactura["FacturaVencida"] = "OVERDUE_INVOICE"] = "FacturaVencida";
    TipoDePagoDeFactura[TipoDePagoDeFactura["FacturaAbierta"] = "OPEN_INVOICE"] = "FacturaAbierta";
})(TipoDePagoDeFactura || (TipoDePagoDeFactura = {}));
var TiposDeSecuenciaAControlar;
(function (TiposDeSecuenciaAControlar) {
    TiposDeSecuenciaAControlar[TiposDeSecuenciaAControlar["NuevaTarea"] = "NEW_TASK"] = "NuevaTarea";
})(TiposDeSecuenciaAControlar || (TiposDeSecuenciaAControlar = {}));
//# sourceMappingURL=TiposYEstados.js.map