﻿/// <reference path="../../../typings/tsd.d.ts" />

//-----Variables Globales
declare var odatajs: any;
declare var gNit: any;
declare var TareaControlador: any;
declare var TareaServicio: any;
declare var DispositivoServicio: any;
declare var PagoConsignacionesControlador: any;
declare var PagoConsignacionesServicio: any;
declare var ParametroServicio: any;
declare var gInitialTaskImage: string;
declare var gIsOnline: number;
declare var gClientName: string;
declare var gClientCode: string;
declare var gtaskStatus: string;
declare var SecuenciaDeDocumentoTipo: any;
declare var EstadoEnvioDoc: any;
declare var gTaskId: number;
declare var gdbuser: string;
declare var gdbuserpass: string;
declare var gCurrentGPS: string;
declare var gLastGPS: string;
declare var TareaEstado: any;
declare var gClientID: string;
declare var gTaskType: string;
declare var OrdenDeVentaTipo: any;
declare var OpcionValidarSaldoCliente: any;
declare var gCurrentRoute: string;
declare var gSalesOrderType: string;
declare var OpcionRespuesta: any;
declare var ReglaEstado: any;
declare var plugins: any;
declare var SondaVersion: string;
declare var OpcionFirmaYFotoTipo: any;
declare var TipoDocumento: any;
declare var gBatteryLevel: any;
declare var OpcionImprimir: any;
declare var gMaxImpresiones: number;
declare var gVentaEsReimpresion: boolean;
declare var gtaskStatus: string;
declare var gUserCode: string;
declare var gLastLogin: string;
declare var gLoggedUser: string;
declare var gloginimage: string;
declare var guser_name: string;
declare var gPrintAddress: string;
declare var swiftPickingLineVersion: string;
declare var gProductName: string;
declare var gInvoiceNUM: number;
declare var TareaServicio: any;
declare var vieneDeListadoDeDocumentosDeEntrega: boolean;
declare var esEntregaParcial: boolean;
declare var esEntregaConsolidada: boolean;
declare var esEntregaPorDocumento: boolean;
declare var esFacturaDeEntrega: boolean;
declare var listaDeDemandasDeDespachoEnProcesoDeEntrega;
declare var demandaDeDespachoEnProcesoDeEntrega: DemandaDeDespachoEncabezado;
declare var listaDeDetalleDeDemandaDeDespachoParaProcesoDeEntrega;
declare var EstadoDeProcesoDeDemandaDeDespacho: any;
declare var gDefaultWhs: string;
declare var lastDeliveryNoteId: number;
declare var gcountPrints: number;
declare var SiNo: any;
declare var TareaGeneroGestion;
declare var guardarInventarioDeFacturaCancelada: boolean;
declare var gImageURI_1: string;
declare var BotonSeleccionado: any;
declare var mainInvoiceHasBeenPrinted: boolean;
declare var invoiceCopyHasBeenPrinted: boolean;

declare function onResume(callback): void;
declare function notify(pMessage: string): void;
declare var SONDA_DB_Session: Database;
declare var states: any;
declare var gNetworkState: any;
declare var gTotalInvoiced: number;
declare var ReglasServicio: any;
declare var gDiscount: any;
declare var estaEnFacturaTemporal: boolean;
declare var pUserID: any;
declare var gRouteReturnWarehouse: any;
declare var AperturaDeCajaServicio: any;
declare var currencySymbol: any;
declare var ClasificacionesServicio: any;
declare var pCurrentNoteID: any;
declare var gVoidReasons: any;
declare var RecogerProductoEnConsignacionServicio: any;
declare var _enviandoTareas: any;
declare var EncuestaServicio: any;
declare var TipoDeValidacionDeFactura: any;
declare var _enviandoValidacionDeFacturas: any;
declare var TipoDeValidacionDeCliente: any;
declare var _enviandoValidacionDeClientes: any;
declare var ClasificacionControlador: any;
declare var pPINCode: any;
declare var validator: any;
declare var tipoDePagoProcesadoEnCobroDeFacturasVencidas: TipoDePagoDeFactura;
declare var zkSignature: {
  capture: () => void;
  save: () => any;
  clear: () => void;
};
declare var TareaFueraDeRutaServicio: any;
declare var tareaControladorADelegar;
declare var confirmacionControlador: ConfirmacionControlador;
declare var gPuedeIniciarRuta: Boolean;
declare var gInvoiceHeader: FacturaEncabezado;
declare var facturacionElectronicaServicio: FacturacionElectronicaServicio;
// controladores
declare var imagenDeEntregaControlador: ImagenDeEntregaControlador;
declare var firmaControlador: FirmaControlador;
declare var manifiestoControlador: ManifiestoControlador;
declare var estadisticaDeVentaPorDiaControlador: EstadisticaDeVentaPorDiaControlador;
//-----Funciones Globales-----
declare function ObtenerPosicionGPS(callback: () => void): void;
declare function my_dialog(
  titulo: string,
  mensaje: string,
  estadoDelDialogo: string
): void;
declare function ToDecimal(valor: number): void;
declare function ValidarFechaDeEntrega(
  fechaActual: Date,
  fechaDeEntrega: Date
): void;
declare function ObtenerFecha(): Date;
declare function MostrarCapturaDeFirmaYFoto(
  opcionFirmaYFotoTipo: any,
  paginaDeRetorno: string,
  callback: (firma: string, foto: string) => void
): void;
declare function GetNexSequence(
  tipo: string,
  callback: (sequencia: string) => void,
  callbackError: (error: any) => void
): void;
declare function ObtenerSecuenciaSiguiente(
  tipoDocumento: any,
  callback: (serie: string, numeroDeDocumento: number) => void,
  callbackError: (error: any) => void
): void;
declare function ObtenerPosicionGPS(callback: () => void): void;
declare function getDateTime(): string;
declare function format_number(
  cantidad: number,
  cantidadDeDecimales: number
): number;
declare function ConectarImpresora(
  printAddress: string,
  callBack: () => void,
  errorCallBack: (error: string) => void
): void;
declare function ImprimirDocumento(
  documento: string,
  callback: () => void,
  callbackError: (error: any) => void
): void;
declare function EnviarData(): void;
declare function CrearTarea(
  cliente: any,
  tipoTarea: string,
  callback: (clienteNuevo: string, codigoTarea: string) => void
): void;
declare function ShowListPicker(
  configoptions: any,
  callback: (item: any) => void
);
declare function gotomyDelivery(): void;
declare function EjecutarTareaDeVenta(clienteId: string): void;
declare function CrearQrManifiesto(
  texto: string,
  canvas: any,
  callBack: () => void,
  errorCallBack: (error: string) => void
): void;

declare function trunc_number(
  cantidad: number,
  cantidadDeDecimales: number
): number;
declare function ToastThis(message: string): void;

declare function ListarImpresoras(callback: (devices: any[]) => void);
declare function EnviarValidacionDeClientes(): void;
declare function ShowInvoiceListPage(): void;
declare function EnviarValidacionDeFactura(
  callback: () => void,
  errorCallback: (error) => void
);
declare function EnviarFacturasConNumeroDeTelefonoAsociado(
  callback: () => void,
  errorCallback: (error) => void
);
declare function AddToTask(data: any): void;
declare function TaskNavigateTo(gps: string, clientname: string): void;
declare function actualizarEstadoDeTarea(
  taskId: number,
  completedSuccesfully: number,
  reason: string,
  callBack: () => void,
  taskStatus: string
);
declare function GrabarNotaDeEntrega(callback, errorCallback);

declare function ProcessVoidInvoice(
  pInvoiceID,
  pReasonID,
  pVoidNotes,
  isPaidConsignment,
  imgConsignment,
  seq
): void;
declare function initlocalstorage(): void;
declare function finalizarRuta(callback, errcallBack): void;
declare function ObtenerBroadcastPerdidos(): void;
declare function DelegarASincronizacion(): void;
declare function EnviarResolucion(request): void;
declare function lanzarEventoDePerdidaDeConexionAlServidor(): void;
declare function UpdateLoginInfo(action): void;
declare function GetBankAccounts(): void;
declare function GetVoidReasons(): void;
declare function GetRoutePlan(): void;
declare function GetPriceLists(): void;
declare function PriceListDefaultReceived(): void;
declare function PriceListDefaultNotFound(data): void;
declare function AddPriceListDefault(data): void;
declare function PriceListDefaultCompleted(): void;
declare function InsertarConsignacionDesdeBo(data): void;
declare function ShowHideOptions(): void;
declare function AgregarTipoDeImpuesto(data): void;
declare function CalculationRulesReceived(): void;
declare function CalculationRulesNotFound(data): void;
declare function AddCalculationRules(data): void;
declare function CalculationRulesCompleted(): void;
declare function ShowInvoiceConfirmation(): void;
declare function UploadPhoto(
  invoiceId,
  pAutId,
  pAutSerial,
  gpicture,
  pId
): void;
declare function listallinvoices(): void;
declare function GetAlertLimit(data): void;
declare function OnConfirmFinishPOS(option): void;
declare function UploadPhotoDeposit(result, image): void;
declare function listalldeposits(): void;
declare function LimpiarInventario(): void;
declare function ActualizarConsignaciones(data): void;
declare function MarcarTareaComoSincronizada(tareas, errorCallback): void;
declare function MarcarConsignacionAnuladaComoSincronizada(
  consignacion,
  errorCallback
): void;
declare function CambiarEstadoParaReenviarFacturas(
  facturas,
  callback,
  errorCallback
): void;
declare function ActualizarEnvioDeFactura(data, callback, errorCallback): void;
declare function FinalizarEnvioFactura(data, callback, errorCallback): void;
declare function delegarABroadcast(socketIo): void;
declare function delegarSocketsTareaFueraDeRutaControlador(socketIo): void;
declare function delegarSocketsDeObjetosJs(socketIo): void;
declare function onBackKeyDown(): void;
declare function onMenuKeyDown(): void;
declare function ObtenerFormatoDeImpresionDePago(
  documentoDePago: PagoDeFacturaVencidaEncabezado,
  callback: (formatoDeImpresion: string) => void,
  errorCallback: (error: any) => void
): void;
declare function Imprimir(formato: string, callback, errorCallback);
declare function ShowSkusToPOS();
declare function publicarClienteParaProcesoDeCobroDeFacturasVencidas(
  callback: () => void
);
declare function addPriceListBySckuPackScale(data: any): void;
declare function obtenerCuentasDeBancos(
  callback: (cuentasDeBanco) => void,
  errCallback: (error) => void
): void;
declare function ShorSummaryPage(): void;
declare function ContinueToSkus(): void;
declare function ObtenerListaDePreciosDeCliente(
  customerId,
  callBack,
  errCalback
): void;
declare function ObtenerUnidadesDeMedidaDeProductosPorListaDePrecios(
  transaccionActual,
  listadoDeProductos,
  indiceDeProductoActual,
  codigoDeListaDePrecios,
  callback,
  errorCallback
);

declare function obtenerUnidadDeMedidaDeProductoAVender(producto);
declare function cantidadDisponibleDeProductoEsSuficienteParaVender(
  producto,
  unidadDeMedidaAVender
);

declare function InsertInvoiceDetail(
  pSkuParent,
  pSkuPrice,
  paramQty,
  callBack,
  saleMeasureUnit,
  stockMeasureUnit,
  convertionFactor
);
declare function ReturnSkus();
declare function crearTareaFueraDeRuta(ruta, cliente, tipo);
declare function InvoiceThisTask(
  taskid,
  client_code,
  client_name,
  client_nit,
  taskType,
  taskStatus
);
declare function GetRouteAuth(tipoDocumento: string);
class JavaScriptServicio {}
