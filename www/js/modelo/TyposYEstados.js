var ConsignmentPaymentOptions = {
    "Pagado": "PAID",
    "ReConsignar": "RECONSIGN",
    "Recoger": "PICKUP",
    "Reset": "RESET"
}

var ConsignmentPayments = {
    "Completa": "COMPLETE",
    "Detalle": "DETAIL"
}

var ConsignmentStatus = {
    "Activa": "ACTIVE",
    "Cancelada": "CANCELLED",
    "Vencida": "DUE",
    "Anulada": "VOID"
}

var SecuenciaDeDocumentoTipo = {
    "Consignacion": "CONSIGNMENT"
    , "Reconsignacion": "RE_CONSIGN"
    , "RecogerInventario": "RECOLLECT_INVENTORY"
    , "DepositoBancario": "BANK_DEPOSIT"
    , "Scouting": "SCOUTING"
    , "NotaDeEntrega": "DELIVERY_NOTE"
    , "EntregaCancelada": "DELIVERY_CANCELED"
    , "PagoDeFacturaVencida": "CREDIT_INVOICE_PAYMENT"
    , "DocumentoDeContingencia": "CONTINGENCY_DOCUMENT"
}

var TiposDeRazones = {
    "NoFacturacion": "NO_INVOICE_REASON_POS",
    "AnulacionConsignacion": "ANNULMENT_CONSIGNMENT_REASON_POS"
}

var SerieUtilizada = {
    "Si": 1,
    "No": 0
}

var TareaEstado = {
    "Asignada": "ASSIGNED"
    , "Aceptada": "ACCEPTED"
    , "Completada": "COMPLETED"
}

var BroadcastOperacion = {
    "Nuevo": "NUEVO"
    , "Borrar": "BORRAR"
    , "Actualizacion": "ACTUALIZACION"
}

var EsNuevaNotificacion = {
    "Si": 1,
    "No": 0
}

var SiNo = {
    "Si": 1,
    "No": 0
}

var EstaEnLinea = {
    "Si": 1,
    "No": 0
}

var BotonSeleccionado = {
    "Si": 2
    , "No": 1
    ,"Atras": 0
}

var TareaGeneroGestion = SiNo;

var EstadoDeTransferencia = {
    "Pendiente": "PENDIENTE"
    , "Completado": "COMPLETADO"
    , "Transferido": "TRANSFERIDO"
    , "Cancelado": "CANCELADO"
}

var LugarDeEnvioDeTransferenciaAceptada = {
    "ListadoDeNotificacions": "NotificationList"
    , "DetalleDeTransferencia": "TransferDetail"
}

var NotificacionDeTransferencia = {
    "VerDetalle": "VER_DETALLE"
    , "AceptarTransferencia": "ACEPTAR_TRANSFERENCIA"
}

var ObteniendoTransferenciaDesde = {
    "Notificacion": "Notificacion"
    , "ProcesoDeTransferencia": "ProcesoDeTransferencia"
}

var TipoDeNotificacion = {
    "TransferenciaDeInventario": "transfer"
}

var EstaEnPantallaDeNotificaciones = {
    "Si": true,
    "No": false
};

var TipoDeValidacionDeFactura = {
    "FinDeRuta": "",
    "EnRuta": "InRoute"
};

var TipoDeValidacionDeCliente = TipoDeValidacionDeFactura;

var EstadoEnvioDoc = {
    "NoEnviado": 0
    , "EnviadoSinAcuseDeRecibido": 1
    , "EnviadoConAcuseDeRecibido": 2
    , "RecibidoDelServidor": 3
}

var EstadoDeValidacionDeOrdenDeVenta = {
    "PendienteDeValidar": 0
    , "EnviadoSinAcuseDeValidado": 1
    , "EnviadoConAcuseDeValidado": 2
}

var OpcionRespuesta = {
    "Exito": "success"
    , "Error": "fail"
    , "Recibido": "receive"
}

var EstadoDeProcesoDeDemandaDeDespacho = {
    "Pendiente": "PENDING"
    , "Completada": "COMPLETED"
    , "Cancelada": "CANCELED"
}

var EstadoDeFactura =
{
    "EnProceso": -9999
}