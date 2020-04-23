var TareaEstado = {
    "Asignada": "ASSIGNED"
    , "Aceptada": "ACCEPTED"
    , "Completada": "COMPLETED"
};

var TareaTipo = {
    "Entrega": "DELIVERY",
    "Preventa": "PRESALE",
    "Venta": "SALE",
    "Obsoleto": "SALES",
    "Scouting": "SCOUTING",
    "Borrador": "DRAFT",
    "TomaDeInventario": "TAKE_INVENTORY"
};

var CampoTipo = {
    "Texto": "Texto"
    , "Numero": "Numero"
}

var OpcionFirmaYFotoTipo = {
    "Firma": "FIRMA"
    , "Foto": "FOTO"
    , "Ambos": "AMBOS"
    , "Ninguno": "NINGUNO"
}

var BroadcastOperacion = {
    "Nuevo": "NUEVO"
    , "Borrar": "BORRAR"
    , "Actualizacion": "ACTUALIZACION"
}

var OpcionImprimir = {
    "Ambos": "AMBOS"
    , "Imprimir": "IMPRIMIR"
    , "Guardar": "GUARDAR"
}

var TipoDocumento = {
    "OrdenDeVenta": "SALES_ORDER",
    "Borrador": "DRAFT",
    "TomaDeInventario": "TAKE_INVENTORY"
    ,"Promo": "HISTORY_BY_PROMO"
}


var OpcionListaOrdenDeVenta = {
    "Anular": "VOID"
    ,"Detalle": "DETAIL"
}

var OpcionRespuesta = {
    "Exito": "success"
    , "Error": "fail"
    , "Recibido": "receive"
}

var OpcionValidarSaldoCliente = {
    "AgregarSku": "ADD_SKU"
    , "PonerCantidad": "SET_QTY"
    , "FinalizarDocumento": "FINISH_DOC"
    , "EjecutarTarea" : "EXECUTE_TASK"

}

var EstadoEnvioDoc= {
    "NoEnviado": 0
    ,"EnviadoSinAcuseDeRecibido": 1
    ,"EnviadoConAcuseDeRecibido":2
    ,"RecibidoDelServidor":3
}

var TareaTipoDescripcion = {
    "Entrega": "En Entregas"
    , "Preventa": "En Venta"
    , "Venta": "En AutoVenta"
    , "Obsoleto": "En AutoVenta"
    , "Scouting": "Scouting"
    , "Borrador": "Borrador"
    , "TomaDeInventario": "Toma De Inventario"
};

var TiposRazones = {
    "NoEntrega": "NOT_DELIVERY_REASONS"
    , "NoVenta": "NOT_SALES_REASONS"
};

var OrdenDeVentaTipo = {
    "Contado": "CASH"
    ,"Credito": "CREDIT"
};

var ReglaEstado = {
    "Activa": "Si"
    , "Inactiva": "No"

};

var TipoDeValidacionDeOrdenDeVenta = {
    "FinDeRuta": ""
    , "EnRuta": "InRoute"
};

var EstadoDeValidacionDeOrdenDeVenta = {
    "PendienteDeValidar": 0
    , "EnviadoSinAcuseDeValidado": 1
    , "EnviadoConAcuseDeValidado": 2
}

var OrigenFirma = {
    "OrdenDeVenta": "SalesOrderSummaryPage"
}

var MaximoCF = ToDecimal(4800.00);

var AlertaRestanteDeSecuenciaDeDocumentos = 50;

default_image = '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';