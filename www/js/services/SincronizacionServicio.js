var _enviandoValidacionDeFacturas = false;
var _enviandoValidacionDeClientes = false;
var _enviandoScouting = false;
var _enviandoNumeroDeSecuenciaDeDocumentos = false;
var _enviandoNumerosDeTelefonoAsociadosAFactura = false;
var _enviandoNotasDeEntrega = false;
var _enviandoNotasDeEntregaCanceladas = false;
var _enviandoRazonesDeNoEntrega = false;
var _enviandoDemandasDeDespachoPorTarea = false;
var _marcandoManifiestos3Pl = false;
var _enviandoNotasDeEntregaAnuladas = false;
var _enviandoTareas = false;
var _enviandoDocumentosDePagoDeFacturasVencidas = false;

function EnviarData() {
  try {
    if (gIsOnline) {
      setTimeout(EnviarScouting(), 100);

      setTimeout(
        EnviarValidacionDeClientes(
          function() {},
          function(err) {}
        ),
        100
      );

      setTimeout(
        EnviarFacturas(
          function() {},
          function(err) {}
        ),
        100
      );

      setTimeout(
        EnviarConsignaciones(
          function() {},
          function(err) {}
        ),
        100
      );

      setTimeout(
        EnviarConsignacionesPagadas(
          function() {},
          function(err) {}
        ),
        100
      );

      setTimeout(
        EnviarDocumentosDeDevolucionDeInventarioRecogidoDeConsignacion(
          function() {},
          function() {}
        ),
        100
      );

      setTimeout(
        EnviarRegistroDeTrazabilidadDeConsignacion(
          function() {},
          function() {}
        ),
        100
      );

      setTimeout(
        EvniarTareas(
          function() {},
          function(error) {}
        ),
        100
      );

      setTimeout(
        EnviarConsignacionesAnuladas(
          function() {},
          function(error) {}
        ),
        100
      );

      setTimeout(
        EnviarEncuestasDeCompraDeCompetencia(
          function() {},
          function(error) {}
        ),
        100
      );

      setTimeout(
        EnviarDepositosNoPosteados(
          function() {},
          function() {}
        ),
        100
      );

      setTimeout(EnviarResolucion("SendInvoice"), 100);

      setTimeout(
        EnviarValidacionDeFactura(
          function() {},
          function(err) {}
        ),
        200
      );

      setTimeout(ObtenerBroadcastPerdidos(), 2000);

      setTimeout(EnviarNumeroDeSecuenciaDeDocumentos(), 100);

      setTimeout(
        EnviarFacturasConNumeroDeTelefonoAsociado(
          function() {},
          function() {}
        ),
        100
      );

      setTimeout(EnviarNotasDeEntrega(), 500);

      setTimeout(EnviarEntregasCanceladas(), 500);

      setTimeout(EnviarDemandasDeDespachoPorTarea(), 500);

      setTimeout(MarcarManifiestos3PlComoCompletos(), 500);

      setTimeout(EnviarNotasDeEntregaAnuladas(), 500);

      setTimeout(EnviarDocumentosDePagoDeFacturasVencidas(), 500);

      setTimeout(
        EnviarNuevasTareas(
          () => {},
          error => {}
        ),
        100
      );
    }
  } catch (e) {
    /* empty */
  }
}

///*********************ENVIO DE NUMERO DE DOCUMENTO ACTUAL *********************/
{
  function ObtenerNumeroDeSecuenciaDeDocumentos(
    callback,
    errCallBack,
    documentos
  ) {
    SONDA_DB_Session.transaction(
      function(tx) {
        var sql = "SELECT DOC_TYPE,SERIE,CURRENT_DOC";
        sql += " FROM DOCUMENT_SEQUENCE ";

        tx.executeSql(
          sql,
          [],
          function(tx, results) {
            for (var i = 0; i < results.rows.length; i++) {
              var documento = {
                DocType: results.rows.item(i).DOC_TYPE,
                Serie: results.rows.item(i).SERIE,
                DocNum: results.rows.item(i).CURRENT_DOC
              };
              documentos.push(documento);
            }
            callback(documentos);
          },
          function(tx, err) {
            if (err.code !== 0) errCallBack(err);
          }
        );
      },
      function(err) {
        errCallBack(err);
      }
    );
  }

  function EnviarNumeroDeSecuenciaDeDocumentos() {
    if (_enviandoNumeroDeSecuenciaDeDocumentos) {
      return;
    }
    _enviandoNumeroDeSecuenciaDeDocumentos = true;
    var documentos = Array();
    ObtenerNumeroDeSecuenciaDeDocumentos(
      function(documentosN1) {
        for (var i = 0; i < documentosN1.length; i++) {
          var data = {
            DocType: documentosN1[i].DocType,
            Serie: documentosN1[i].Serie,
            DocNum: documentosN1[i].DocNum,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute
          };
          SocketControlador.socketIo.emit("SendDocumentSecuence", data);
        }
        _enviandoNumeroDeSecuenciaDeDocumentos = false;
      },
      function(err) {
        ToastThis(
          "Error al actualizar secuencia de documentos: " + err.message
        );
      },
      documentos
    );
  }
}

//-------- INICIA ENVIO DE NUEVAS CONSIGNACIONES----------------------------
var _enviandoConsignaciones = false;

function EnviarConsignaciones(callback, errCallback) {
  if (_enviandoConsignaciones) {
    callback();
    return;
  }
  _enviandoConsignaciones = true;
  var consignaciones = Array();
  ObtenerConsignacionesNoPosteadas(
    function(consignacionesN1) {
      ObtenerDetalleDeConsignaciones(
        function(consignacionesN2) {
          if (consignacionesN2.length > 0) {
            var intervaloDeEnvioDeConsignaciones = setInterval(function() {
              consignaciones = consignacionesN2.splice(0, 5); //Se envian los clientes de 5 en 5
              var data = {
                consignment: consignaciones,
                dbuser: gdbuser,
                dbuserpass: gdbuserpass,
                battery: gBatteryLevel,
                routeid: gCurrentRoute,
                default_warehouse: gDefaultWhs,
                deviceId: device.uuid
              };

              SocketControlador.socketIo.emit("SendConsignment", data);
              if (consignacionesN2.length === 0) {
                consignaciones = null;
                clearInterval(intervaloDeEnvioDeConsignaciones);
                _enviandoConsignaciones = false;
              }
            }, 3000);
          } else {
            _enviandoConsignaciones = false;
          }
        },
        function(error) {
          notify("Error al obtener detalle de consignaciones " + error.mensaje);
        },
        consignacionesN1
      );
    },
    function(error) {
      notify("Error al obtener consignaciones " + error.mensaje);
    },
    consignaciones
  );
}

function ObtenerConsignacionesNoPosteadas(
  callback,
  errCallback,
  consignaciones
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT *";
      sql += " FROM CONSIGNMENT_HEADER ";
      sql += " WHERE IS_POSTED IN (0,-1) ";
      sql += " ORDER BY DATE_CREATE ";

      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var consignacion = {
              ConsignmentId: results.rows.item(i).CONSIGNMENT_ID,
              CustomerId: results.rows.item(i).CUSTOMER_ID,
              DateCreate: results.rows.item(i).DATE_CREATE,
              DateUpdate: results.rows.item(i).DATE_UPDATE,
              Status: results.rows.item(i).STATUS,
              PostedBy: results.rows.item(i).POSTED_BY,
              IsPosted: results.rows.item(i).IS_POSTED,
              PosTerminal: results.rows.item(i).POS_TERMINAL,
              GpsUrl: results.rows.item(i).GPS_URL,
              DocDate: results.rows.item(i).DOC_DATE,
              ClosedRouteDatetime: results.rows.item(i).CLOSED_ROUTE_DATETIME,
              IsActiveRoute: results.rows.item(i).IS_ACTIVE_ROUTE,
              DueDate: results.rows.item(i).DUE_DATE,
              ConsignmentBoNum: results.rows.item(i).CONSIGNMENT_BO_NUM,
              DocSerie: results.rows.item(i).DOC_SERIE,
              DocNum: results.rows.item(i).DOC_NUM,
              TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
              Image: results.rows.item(i).IMG,
              IsReconsign: results.rows.item(i).IS_RECONSIGN,
              ConsignmentType: results.rows.item(i).CONSIGNMENT_TYPE,
              InvoiceSerie: results.rows.item(i).INVOICE_SERIE,
              InvoiceNum: results.rows.item(i).INVOICE_NUM,
              ConsignmentRows: Array()
            };
            consignaciones.push(consignacion);
          }
          callback(consignaciones);
        },
        function(tx, err) {
          if (err.code !== 0) errCallBack(err);
        }
      );
    },
    function(err) {
      errCallBack(err);
    }
  );
}

function ObtenerDetalleDeConsignaciones(callback, errCallback, consignaciones) {
  var i;
  for (i = 0; i < consignaciones.length; i++) {
    ObtenerDetalleDeConsignacionesNoPosteados(
      consignaciones[i],
      function(err) {
        errCallBack(err);
      },
      consignaciones,
      i,
      function(consignacionesN1, index, consignacion) {
        consignacionesN1[index] = consignacion;
        return consignacionesN1;
      },
      callback
    );
  }
  if (i === 0) {
    callback(consignaciones);
  }
}

function ObtenerDetalleDeConsignacionesNoPosteados(
  consignacion,
  errCallBack,
  consignaciones,
  i,
  callback,
  returncallBack
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT *  ";
      sql += " FROM CONSIGNMENT_DETAIL ";
      sql += " WHERE CONSIGNMENT_ID= " + consignacion.ConsignmentId;
      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var j = 0; j < results.rows.length; j++) {
            var detalleConsignacion = {
              ConsignmentId: results.rows.item(j).CONSIGNMENT_ID,
              Sku: results.rows.item(j).SKU,
              LineNum: results.rows.item(j).LINE_NUM,
              Qty: results.rows.item(j).QTY,
              Price: results.rows.item(j).PRICE,
              Discount: results.rows.item(j).DISCOUNT,
              TotalLine: results.rows.item(j).TOTAL_LINE,
              PostedDateTime: results.rows.item(j).POSTED_DATETIME,
              PaymentId: results.rows.item(j).PAYMENT_ID,
              HandleSerial: results.rows.item(j).HANDLE_SERIAL,
              SerialNumber: results.rows.item(j).SERIAL_NUMBER
            };
            consignacion.ConsignmentRows.push(detalleConsignacion);
          }
          callback(consignaciones, i, consignacion);

          if (consignaciones.length - 1 === i) {
            returncallBack(consignaciones);
          }
        },
        function(tx, err) {
          if (err.code !== 0) errCallBack(err);
        }
      );
    },
    function(err) {
      errCallBack(err);
    }
  );
}

//------ FINALIZA ENVIO DE NUEVAS CONSIGNACIONES -----------------------------------------------

//----------- INICIA ENVIO DE CONSIGNACIONES PAGADAS -----------------------------------------------
var _enviandoConsignacionesPagadas = false;

function EnviarConsignacionesPagadas(callback, errCallback) {
  if (_enviandoConsignacionesPagadas) {
    callback();
    return;
  }
  _enviandoConsignacionesPagadas = true;
  var consignaciones = Array();
  ObtenerConsignacionesPagadasNoPosteadas(
    function(consignacionesN1) {
      if (consignacionesN1.length > 0) {
        var intervaloDeEnvioDeConsignacionesPagadas = setInterval(function() {
          consignaciones = consignacionesN1.splice(0, 5); //Se envian los clientes de 5 en 5
          var data = {
            consignment: consignaciones,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            battery: gBatteryLevel,
            routeid: gCurrentRoute,
            default_warehouse: gDefaultWhs,
            deviceId: device.uuid
          };
          SocketControlador.socketIo.emit("SendConsignmentPaid", data);
          if (consignacionesN1.length === 0) {
            consignaciones = null;
            clearInterval(intervaloDeEnvioDeConsignacionesPagadas);
            _enviandoConsignacionesPagadas = false;
          }
        }, 3000);
      } else {
        _enviandoConsignacionesPagadas = false;
      }
    },
    function(error) {
      notify(
        "Error al ObtenerConsignacionesPagadasNoPosteadas " + error.mensaje
      );
    },
    consignaciones
  );
}

function ObtenerConsignacionesPagadasNoPosteadas(
  callback,
  errCallback,
  consignaciones
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT * ";
      sql += " FROM CONSIGNMENT_HEADER ";
      sql += " WHERE IS_POSTED = 3 AND STATUS = 'CANCELLED' ";
      sql += " ORDER BY DATE_CREATE ";

      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var consignacion = {
              ConsignmentId: results.rows.item(i).CONSIGNMENT_ID,
              CustomerId: results.rows.item(i).CUSTOMER_ID,
              DateCreate: results.rows.item(i).DATE_CREATE,
              DateUpdate: results.rows.item(i).DATE_UPDATE,
              Status: results.rows.item(i).STATUS,
              PostedBy: results.rows.item(i).POSTED_BY,
              IsPosted: results.rows.item(i).IS_POSTED,
              PosTerminal: results.rows.item(i).POS_TERMINAL,
              GpsUrl: results.rows.item(i).GPS_URL,
              DocDate: results.rows.item(i).DOC_DATE,
              ClosedRouteDatetime: results.rows.item(i).CLOSED_ROUTE_DATETIME,
              IsActiveRoute: results.rows.item(i).IS_ACTIVE_ROUTE,
              DueDate: results.rows.item(i).DUE_DATE,
              ConsignmentBoNum: results.rows.item(i).CONSIGNMENT_BO_NUM,
              DocSerie: results.rows.item(i).DOC_SERIE,
              DocNum: results.rows.item(i).DOC_NUM,
              TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
              ConsignmentRows: Array()
            };

            consignaciones.push(consignacion);
          }
          callback(consignaciones);
        },
        function(tx, err) {
          if (err.code !== 0) errCallback(err);
        }
      );
    },
    function(err) {
      errCallback(err);
    }
  );
}

function ObtenerDetalleDeConsignacionesPagadas(
  callback,
  errCallback,
  consignaciones
) {
  var i;
  for (i = 0; i < consignaciones.length; i++) {
    ObtenerDetalleDeConsignacionesPagadasNoPosteados(
      consignaciones[i],
      function(err) {
        errCallback(err);
      },
      consignaciones,
      i,
      function(consignacionesN1, index, consignacion) {
        consignacionesN1[index] = consignacion;
        return consignacionesN1;
      },
      callback
    );
  }
  if (i === 0) {
    callback(consignaciones);
  }
}

function ObtenerDetalleDeConsignacionesPagadasNoPosteados(
  consignacion,
  errCallBack,
  consignaciones,
  i,
  callback,
  returncallBack
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT *  ";
      sql += " FROM CONSIGNMENT_DETAIL ";
      sql += " WHERE CONSIGNMENT_ID= " + consignacion.ConsignmentId;
      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var j = 0; j < results.rows.length; j++) {
            var detalleConsignacion = {
              ConsignmentId: results.rows.item(j).CONSIGNMENT_ID,
              Sku: results.rows.item(j).SKU,
              LineNum: results.rows.item(j).LINE_NUM,
              Qty: results.rows.item(j).QTY,
              Price: results.rows.item(j).PRICE,
              Discount: results.rows.item(j).DISCOUNT,
              TotalLine: results.rows.item(j).TOTAL_LINE,
              PostedDateTime: results.rows.item(j).POSTED_DATETIME,
              PaymentId: results.rows.item(j).PAYMENT_ID
            };
            consignacion.ConsignmentRows.push(detalleConsignacion);
          }
          callback(consignaciones, i, consignacion);

          if (consignaciones.length - 1 === i) {
            returncallBack(consignaciones);
          }
        },
        function(tx, err) {
          if (err.code !== 0) errCallBack(err);
        }
      );
    },
    function(err) {
      errCallBack(err);
    }
  );
}

function ActualizarConsignaciones(consignaciones) {
  try {
    SONDA_DB_Session.transaction(
      function(tx) {
        consignaciones.map(function(consignacion) {
          var sql = [];
          sql.push("UPDATE CONSIGNMENT_HEADER");
          sql.push(" SET IS_POSTED = 4");
          sql.push(" WHERE");
          sql.push(" DOC_SERIE = '" + consignacion.DOC_SERIE + "'");
          sql.push(" AND DOC_NUM =" + consignacion.DOC_NUM);
          tx.executeSql(sql.join(""));
        });
      },
      function(err) {
        ToastThis(
          "No se pudo actualizar la informacion de la consignacion: " +
            consignacion.CONSIGNMENT_ID.toString() +
            " debido a: " +
            err.message
        );
      },
      function() {}
    );
  } catch (e) {
    notify(
      "No se pudo actulizar la informacion de la consignacion enviada desde el servidor debido a: " +
        e.message
    );
  }
}
//----------- FINALIZA ENVIO DE CONSIGNACIONES PAGADAS -----------------------------------------------

//----------- INICIA ENVIO DE DOCUMENTOS DE DEVOLUCION (RECOGER INVENTARIO EN CONSIGNACION) -----------------------------------------
var _enviandoDocumentosDeDevolucionDeInventario = false;
function EnviarDocumentosDeDevolucionDeInventarioRecogidoDeConsignacion(
  callBack,
  errorCallBack
) {
  if (_enviandoDocumentosDeDevolucionDeInventario) {
    callBack();
    return;
  }
  _enviandoDocumentosDeDevolucionDeInventario = true;

  var documentosDeDevolucion = Array();
  ObtenerDocumentosDeDevolucionDeInventarioNoPosteados(
    function(documentos) {
      ObtenerDetalleDeDocumentoDeDevolucion(
        function(documentosCompletos) {
          if (documentosCompletos.length > 0)
            EnviarDocumentosDeDevolucionDeInventario(
              documentosCompletos,
              0,
              documentosCompletos.length - 1 === 0
            );
          _enviandoDocumentosDeDevolucionDeInventario = false;
        },
        function(err) {
          errorCallBack(err);
        },
        documentos
      );
    },
    function(error) {
      errorCallBack(error);
    },
    documentosDeDevolucion
  );
}

function ObtenerDocumentosDeDevolucionDeInventarioNoPosteados(
  callBack,
  errorCallBack,
  documentosDeDevolucion
) {
  try {
    SONDA_DB_Session.transaction(
      function(tx) {
        var sql =
          "SELECT SKU_COLLECTED_ID" +
          ", CUSTOMER_ID" +
          ", DOC_SERIE" +
          ", DOC_NUM" +
          ", CODE_ROUTE" +
          ", GPS_URL" +
          ", POSTED_DATETIME" +
          ", POSTED_BY" +
          ", LAST_UPDATE" +
          ", LAST_UPDATE_BY" +
          ", TOTAL_AMOUNT" +
          ", IS_POSTED" +
          ", IMG_1" +
          ", IMG_2" +
          ", IMG_3" +
          ", SKU_COLLECTED_BO_ID" +
          "  FROM SKU_COLLECTED_HEADER WHERE IS_POSTED = 0";

        tx.executeSql(
          sql,
          [],
          function(tx2, results) {
            for (var i = 0; i < results.rows.length; i++) {
              var documentoDevolucion = {
                SKU_COLLECTED_ID: results.rows.item(i).SKU_COLLECTED_ID,
                CUSTOMER_ID: results.rows.item(i).CUSTOMER_ID,
                DOC_SERIE: results.rows.item(i).DOC_SERIE,
                DOC_NUM: results.rows.item(i).DOC_NUM,
                CODE_ROUTE: results.rows.item(i).CODE_ROUTE,
                GPS_URL: results.rows.item(i).GPS_URL,
                POSTED_DATETIME: results.rows.item(i).POSTED_DATETIME,
                POSTED_BY: results.rows.item(i).POSTED_BY,
                LAST_UPDATE: results.rows.item(i).LAST_UPDATE,
                LAST_UPDATE_BY: results.rows.item(i).LAST_UPDATE_BY,
                TOTAL_AMOUNT: results.rows.item(i).TOTAL_AMOUNT,
                IS_POSTED: results.rows.item(i).IS_POSTED,
                IMG_1: results.rows.item(i).IMG_1,
                IMG_2: results.rows.item(i).IMG_2,
                IMG_3: results.rows.item(i).IMG_3,
                SKU_COLLECTED_BO_ID: results.rows.item(i).SKU_COLLECTED_BO_ID,
                DEVOLUTION_DETAIL: new Array()
              };
              documentosDeDevolucion.push(documentoDevolucion);
            }
            callBack(documentosDeDevolucion);
          },
          function(tx2, err) {
            if (err.code !== 0) {
              errorCallBack(
                "Error al obtener los Documentos de Devolución de Inventario Recogido de Consignación debido a: " +
                  err.message
              );
            }
          }
        );
      },
      function(err) {
        if (err.code !== 0) {
          errorCallBack(
            "No se pudieron obtener los Documentos de Devolución de Inventario Recogido de Consignación debido a: " +
              err.message
          );
        }
      }
    );
  } catch (e) {
    errorCallBack(
      "Error al intentar obtener los Documentos de Devolución de Inventario Recogido De Consignación debido a: " +
        e.message
    );
  }
}

function ObtenerDetalleDeDocumentoDeDevolucion(
  callBack,
  errorCallBack,
  documentos
) {
  var i;
  for (i = 0; i < documentos.length; i++) {
    ObtenerDetalleDeDevolucionesNoPosteadas(
      documentos[i],
      function(err) {
        errorCallBack(err);
      },
      documentos,
      i,
      function(documentos2, index, documento) {
        documentos2[index] = documento;
        return documentos2;
      },
      callBack
    );
  }
  if (i === 0) {
    callBack(documentos);
  }
}

function ObtenerDetalleDeDevolucionesNoPosteadas(
  documento,
  errorCallBack,
  documentos,
  indice,
  callBack,
  returnCallBack
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql =
        "SELECT " +
        "SKU_COLLECTED_ID" +
        ", CODE_SKU" +
        ", QTY_SKU" +
        ", IS_GOOD_STATE" +
        ", LAST_UPDATE" +
        ", LAST_UPDATE_BY" +
        ", SOURCE_DOC_TYPE" +
        ", SOURCE_DOC_NUM" +
        ", TOTAL_AMOUNT, HANDLE_SERIAL, SERIAL_NUMBER " +
        " FROM SKU_COLLECTED_DETAIL WHERE SKU_COLLECTED_ID =" +
        parseInt(documento.SKU_COLLECTED_ID);
      tx.executeSql(
        sql,
        [],
        function(tx2, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var skuDetalle = {
              SKU_COLLECTED_ID: results.rows.item(i).SKU_COLLECTED_ID,
              CODE_SKU: results.rows.item(i).CODE_SKU,
              QTY_SKU: results.rows.item(i).QTY_SKU,
              IS_GOOD_STATE: results.rows.item(i).IS_GOOD_STATE,
              LAST_UPDATE: results.rows.item(i).LAST_UPDATE,
              LAST_UPDATE_BY: results.rows.item(i).LAST_UPDATE_BY,
              SOURCE_DOC_TYPE: results.rows.item(i).SOURCE_DOC_TYPE,
              SOURCE_DOC_NUM: results.rows.item(i).SOURCE_DOC_NUM,
              TOTAL_AMOUNT: results.rows.item(i).TOTAL_AMOUNT,
              HANDLE_SERIAL: results.rows.item(i).HANDLE_SERIAL,
              SERIAL_NUMBER: results.rows.item(i).SERIAL_NUMBER
            };
            documento.DEVOLUTION_DETAIL.push(skuDetalle);
          }
          callBack(documentos, indice, documento);
          if (documentos.length - 1 === indice) {
            returnCallBack(documentos);
          }
        },
        function(tx2, err) {
          if (err.code !== 0) {
            errorCallBack(
              "No se pudo obtener el Detalle de Devolución de Inventario Recogido en Consignación debido a: " +
                err.message
            );
          }
        }
      );
    },
    function(err) {
      if (err.code !== 0) {
        errorCallBack(
          "No se pudo obtener el Detalle de Devolución de Inventario Recogido en Consignación debido a: " +
            err.message
        );
      }
    }
  );
}

function EnviarDocumentosDeDevolucionDeInventario(documentos, index, esUltimo) {
  var data = {
    documentoDeDevolucion: documentos[index],
    dbuser: gdbuser,
    dbuserpass: gdbuserpass,
    battery: gBatteryLevel,
    routeid: gCurrentRoute,
    default_warehouse: gDefaultWhs,
    deviceId: device.uuid
  };
  SocketControlador.socketIo.emit("SendDevolutionInventoryDocuments", data);
  if (esUltimo) return;
  setTimeout(function() {
    var actual = index + 1;
    EnviarDocumentosDeDevolucionDeInventario(
      documentos,
      actual,
      documentos.length - 1 === actual
    );
  }, 5000);
}

//-------------INICIA ENVIO DE REGISTROS DE TRAZABILIDAD DE CONSIGNACION-----------------------------
var _enviandoRegistrosDeTrazabilidad = false;
function EnviarRegistroDeTrazabilidadDeConsignacion(callBack, errorCallBack) {
  if (_enviandoRegistrosDeTrazabilidad) {
    callBack();
    return;
  }

  _enviandoRegistrosDeTrazabilidad = true;
  var registros = Array();
  ObtenerRegistrosDeTrazabilidadDeConsignacionNoPosteados(
    function(registrosDeTrazabilidad) {
      if (registrosDeTrazabilidad.length > 0) {
        var intervaloDeEnvioDeRegistroDeTrazabilidadDeConsignacion = setInterval(
          function() {
            registros = registrosDeTrazabilidad.splice(0, 5); //Se envian los clientes de 5 en 5
            var data = {
              documentoDeTrazabilidad: registros,
              dbuser: gdbuser,
              dbuserpass: gdbuserpass,
              battery: gBatteryLevel,
              routeid: gCurrentRoute,
              default_warehouse: gDefaultWhs
            };
            SocketControlador.socketIo.emit(
              "InsertTraceabilityConsignments",
              data
            );
            if (registrosDeTrazabilidad.length === 0) {
              registros = null;
              clearInterval(
                intervaloDeEnvioDeRegistroDeTrazabilidadDeConsignacion
              );
              _enviandoRegistrosDeTrazabilidad = false;
            }
          },
          3000
        );
      } else {
        _enviandoRegistrosDeTrazabilidad = false;
      }
    },
    errorCallBack,
    registros
  );
}

function ObtenerRegistrosDeTrazabilidadDeConsignacionNoPosteados(
  callBack,
  errorCallBack,
  registrosDeTrazabilidad
) {
  SONDA_DB_Session.transaction(
    function(trans) {
      var sql =
        "SELECT CONSIGNMENT_ID" +
        ", DOC_SERIE_SOURCE" +
        ", DOC_NUM_SOURCE" +
        ", SKU" +
        ", QTY" +
        ", ACTION" +
        ", DOC_SERIE_TARGET" +
        ", DOC_NUM_TARGET" +
        ", DATE_TRANSACTION, " +
        "HANDLE_SERIAL, " +
        "SERIAL_NUMBER " +
        " FROM HISTORICAL_TRACEABILITY_CONSIGNMENT " +
        "WHERE IS_POSTED = 0";

      trans.executeSql(
        sql,
        [],
        function(trans2, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var registro = results.rows.item(i);
            var registroModelo = {
              CONSIGNMENT_ID: registro.CONSIGNMENT_ID,
              DOC_SERIE_SOURCE: registro.DOC_SERIE_SOURCE,
              DOC_NUM_SOURCE: registro.DOC_NUM_SOURCE,
              SKU: registro.SKU,
              QTY: registro.QTY,
              ACTION: registro.ACTION,
              DOC_SERIE_TARGET: registro.DOC_SERIE_TARGET,
              DOC_NUM_TARGET: registro.DOC_NUM_TARGET,
              DATE_TRANSACTION: registro.DATE_TRANSACTION,
              HANDLE_SERIAL: registro.HANDLE_SERIAL,
              SERIAL_NUMBER: registro.SERIAL_NUMBER
            };
            registrosDeTrazabilidad.push(registroModelo);
          }
          callBack(registrosDeTrazabilidad);
        },
        function(error, trans2) {
          if (error.code !== 0) {
            errorCallBack(error);
          }
        }
      );
    },
    function(error) {
      if (error.code !== 0) {
        errorCallBack(error);
      }
    }
  );
}

function EnviarRegistroDeTrazabilidad(
  registrosDeTrazabilidad,
  index,
  esUltimo
) {
  var data = {
    documentoDeTrazabilidad: registrosDeTrazabilidad[index],
    dbuser: gdbuser,
    dbuserpass: gdbuserpass,
    battery: gBatteryLevel,
    routeid: gCurrentRoute,
    default_warehouse: gDefaultWhs
  };
  SocketControlador.socketIo.emit("InsertTraceabilityConsignments", data);
  if (esUltimo) return;
  setTimeout(function() {
    var actual = index + 1;
    EnviarRegistroDeTrazabilidad(
      registrosDeTrazabilidad,
      actual,
      registrosDeTrazabilidad.length - 1 === actual
    );
  }, 5000);
}

//------------------- INICIA ENVIO DE TAREAS -------------------------------------------------------

function EvniarTareas(callBack, errorCallBack) {
  if (_enviandoTareas) {
    callBack();
    return;
  }

  _enviandoTareas = true;
  var tareas = [];
  ObtenerTareasNoPosteadas(
    function(tareasNoPosteadas) {
      if (tareasNoPosteadas.length > 0) {
        EnviarTareaNoPosteada(tareasNoPosteadas);
      } else {
        _enviandoTareas = false;
      }
    },
    errorCallBack,
    tareas
  );
}

function ObtenerTareasNoPosteadas(callBack, errorCallBack, tareas) {
  SONDA_DB_Session.transaction(
    function(trans) {
      var sql =
        "SELECT TASK_ID, RELATED_CLIENT_CODE, TASK_BO_ID, COMPLETED_SUCCESSFULLY, REASON, ACCEPTED_STAMP, COMPLETED_STAMP, TASK_STATUS, POSTED_GPS, TASK_SEQ FROM TASK " +
        "WHERE IS_POSTED = 2";
      trans.executeSql(
        sql,
        [],
        function(trans2, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var tarea = {
              taskId: results.rows.item(i).TASK_ID,
              relatedClientCode: results.rows.item(i).RELATED_CLIENT_CODE,
              taskBoId: results.rows.item(i).TASK_BO_ID,
              completedSuccessfully: results.rows.item(i)
                .COMPLETED_SUCCESSFULLY,
              reason: results.rows.item(i).REASON,
              acceptedStamp: results.rows.item(i).ACCEPTED_STAMP,
              completedStamp: results.rows.item(i).COMPLETED_STAMP,
              taskStatus: results.rows.item(i).TASK_STATUS,
              postedGps: results.rows.item(i).POSTED_GPS,
              taskSeq: parseInt(results.rows.item(i).TASK_SEQ)
            };
            tareas.push(tarea);
          }
          callBack(tareas);
        },
        function(error, trans2) {
          _enviandoTareas = false;
          if (error.code !== 0) {
            errorCallBack(
              "Error al obtener las tareas no posteadas debido a: " +
                error.message
            );
          }
        }
      );
    },
    function(error) {
      _enviandoTareas = false;
      if (error.code !== 0) {
        errorCallBack(
          "Error al obtener las tareas no posteadas debido a: " + error.message
        );
      }
    }
  );
}

function EnviarTareaNoPosteada(tareasNoPosteadas) {
  var data = {
    tareas: tareasNoPosteadas,
    dbuser: gdbuser,
    dbuserpass: gdbuserpass,
    battery: gBatteryLevel,
    routeid: gCurrentRoute,
    default_warehouse: gDefaultWhs
  };
  SocketControlador.socketIo.emit("SendTaskPos", data);
  _enviandoTareas = false;
}

function MarcarTareaComoSincronizada(tareas, errorCallBack) {
  SONDA_DB_Session.transaction(
    function(trans) {
      tareas.map(function(tarea) {
        var sql =
          "UPDATE TASK SET IS_POSTED = 3 WHERE TASK_ID = " +
          parseInt(tarea.TASK_ID) +
          " AND TASK_BO_ID = " +
          parseInt(tarea.TASK_BO_ID);
        trans.executeSql(sql);
      });
    },
    function(error) {
      if (error.code !== 0) {
        errorCallBack(
          "No se pudo actualizar la tarea sincronizada debido a: " +
            error.message
        );
      }
    }
  );
}

//---------- FINALIZA ENVIO DE TAREAS -------------------------------------------------------------

//----------------- INICIA ENVIO DE CONSIGNACIONES ANULADAS ---------------------------------------

var _enviandoConsignacionesAnuladas = false;
function EnviarConsignacionesAnuladas(callBack, errorCallBack) {
  if (_enviandoConsignacionesAnuladas) {
    callBack();
    return;
  }

  _enviandoConsignacionesAnuladas = true;
  var consignacionesAnuladas = Array();
  ObtenerConsignacionesAnuladasNoPosteadas(
    function(consignacionesAnuladasNoPosteadas) {
      if (consignacionesAnuladasNoPosteadas.length > 0)
        EnviarConsignacionAnulada(
          consignacionesAnuladasNoPosteadas,
          0,
          consignacionesAnuladasNoPosteadas.length - 1 === 0
        );
      _enviandoConsignacionesAnuladas = false;
    },
    errorCallBack,
    consignacionesAnuladas
  );
}

function ObtenerConsignacionesAnuladasNoPosteadas(
  callback,
  errCallback,
  consignaciones
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT *";
      sql += " FROM CONSIGNMENT_HEADER ";
      sql += " WHERE IS_POSTED = 5 AND STATUS = 'VOID'";
      sql += " ORDER BY DATE_CREATE ";

      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var consignacion = {
              ConsignmentId: results.rows.item(i).CONSIGNMENT_ID,
              CustomerId: results.rows.item(i).CUSTOMER_ID,
              DateCreate: results.rows.item(i).DATE_CREATE,
              DateUpdate: results.rows.item(i).DATE_UPDATE,
              Status: results.rows.item(i).STATUS,
              PostedBy: results.rows.item(i).POSTED_BY,
              IsPosted: results.rows.item(i).IS_POSTED,
              PosTerminal: results.rows.item(i).POS_TERMINAL,
              GpsUrl: results.rows.item(i).GPS_URL,
              DocDate: results.rows.item(i).DOC_DATE,
              ClosedRouteDatetime: results.rows.item(i).CLOSED_ROUTE_DATETIME,
              IsActiveRoute: results.rows.item(i).IS_ACTIVE_ROUTE,
              DueDate: results.rows.item(i).DUE_DATE,
              ConsignmentBoNum: results.rows.item(i).CONSIGNMENT_BO_NUM,
              DocSerie: results.rows.item(i).DOC_SERIE,
              DocNum: results.rows.item(i).DOC_NUM,
              TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
              Image: results.rows.item(i).IMG,
              IsReconsign: results.rows.item(i).IS_RECONSIGN,
              Reason: results.rows.item(i).REASON,
              ConsignmentRows: Array()
            };
            consignaciones.push(consignacion);
          }
          callback(consignaciones);
        },
        function(tx, err) {
          if (err.code !== 0) errCallback(err);
        }
      );
    },
    function(err) {
      errCallback(err);
    }
  );
}

function EnviarConsignacionAnulada(consignaciones, index, esUltimo) {
  var data = {
    consignacion: consignaciones[index],
    dbuser: gdbuser,
    dbuserpass: gdbuserpass,
    battery: gBatteryLevel,
    routeid: gCurrentRoute,
    default_warehouse: gDefaultWhs
  };
  SocketControlador.socketIo.emit("SendConsignmentVoid", data);
  if (esUltimo) return;
  setTimeout(function() {
    var actual = index + 1;
    EnviarConsignacionAnulada(
      consignaciones,
      actual,
      consignaciones.length - 1 === actual
    );
  }, 5000);
}

function MarcarConsignacionAnuladaComoSincronizada(
  consignacion,
  errorCallBack
) {
  SONDA_DB_Session.transaction(
    function(trans) {
      var sql =
        "UPDATE CONSIGNMENT_HEADER SET IS_POSTED = 6 WHERE CONSIGNMENT_ID = " +
        parseInt(consignacion.ConsignmentId) +
        " AND DOC_NUM = " +
        parseInt(consignacion.DocNum);
      trans.executeSql(sql);
    },
    function(error) {
      if (error.code !== 0) {
        errorCallBack(
          "No se pudo actualizar la consignación anulada debido a: " +
            error.message
        );
      }
    }
  );
}

//------------------ FINALIZA ENVIO DE CONSIGNACIONES ANULADAS -------------------------------------

//----------------- INICIA ENVIO DE ENCUESTA DE COMPETENCIA ---------------------------------------
function EnviarEncuestasDeCompraDeCompetencia() {
  try {
    EncuestaServicio.ObtenerEncuestasDeCompraDeCompetenciaNoEnviadas(
      function(encuestas) {
        if (encuestas.length > 0) {
          for (var i = 0; i < encuestas.length; i++) {
            var data = {
              encuesta: encuestas[i],
              dbuser: gdbuser,
              dbuserpass: gdbuserpass,
              battery: gBatteryLevel,
              routeid: gCurrentRoute,
              default_warehouse: gDefaultWhs
            };
            SocketControlador.socketIo.emit("SendBusinessRivalPoll", data);
          }
        }
      },
      function(err) {
        notify(err);
      }
    );
  } catch (e) {
    notify(
      "Error al intentar enviar las encuestas de compra de competencia: " +
        e.message
    );
  }
}
//------------------ FINALIZA ENVIO DE ENCUESTA DE COMPETENCIA -------------------------------------

//------------------ INICIA ENVIO DE DEPOSITOS BANCARIOS -------------------------------------
var _estaEnviandoDepositos = false;
function EnviarDepositosNoPosteados(callBack, errorCallBack) {
  try {
    if (_estaEnviandoDepositos) {
      callBack();
    } else {
      _estaEnviandoDepositos = true;
      ObtenerDepositosNoPosteados(
        function(depositos) {
          if (depositos.length > 0) {
            for (var i = 0; i < depositos.length; i++) {
              var data = {
                accountid: depositos[i].accountNum,
                gps: depositos[i].gpsUrl,
                amount: depositos[i].amount,
                routeid: gCurrentRoute,
                processdate: depositos[i].transDateTime,
                loginid: gLastLogin,
                transid: depositos[i].transId,
                docSerie: depositos[i].docSerie,
                docNum: depositos[i].docNum,
                image1: depositos[i].image1,
                dbuser: gdbuser,
                dbuserpass: gdbuserpass,
                deviceId: device.uuid
              };
              SocketControlador.socketIo.emit("post_deposit", data);
            }
            _estaEnviandoDepositos = false;
          } else {
            _estaEnviandoDepositos = false;
          }
        },
        function(err) {
          _estaEnviandoDepositos = false;
          notify(err);
        }
      );
    }
  } catch (e) {
    notify(
      "Error al intentar enviar las encuestas de compra de competencia: " +
        e.message
    );
  }
}

function ObtenerDepositosNoPosteados(callBack, errorCallBack) {
  try {
    var listaDeDepositos = [];
    SONDA_DB_Session.transaction(
      function(tx) {
        var sql =
          "SELECT TRANS_ID, TRANS_TYPE, TRANS_DATETIME, BANK_ID, ACCOUNT_NUM, AMOUNT, GPS_URL, IS_POSTED, IMG1, DOC_SERIE, DOC_NUM FROM DEPOSITS WHERE IS_POSTED = 0";

        tx.executeSql(
          sql,
          [],
          function(txResult, results) {
            if (results.rows.length > 0) {
              for (var i = 0; i < results.rows.length; i++) {
                var deposito = results.rows.item(i);
                var depositoItem = new Deposito();

                depositoItem.transId = deposito.TRANS_ID;
                depositoItem.transType = deposito.TRANS_TYPE;
                depositoItem.transDateTime = deposito.TRANS_DATETIME;
                depositoItem.bankId = deposito.BANK_ID;
                depositoItem.accountNum = deposito.ACCOUNT_NUM;
                depositoItem.amount = deposito.AMOUNT;
                depositoItem.gpsUrl = deposito.GPS_URL;
                depositoItem.isPosted = deposito.IS_POSTED;
                depositoItem.image1 = deposito.IMG1;
                depositoItem.docSerie = deposito.DOC_SERIE;
                depositoItem.docNum = deposito.DOC_NUM;
                listaDeDepositos.push(depositoItem);
              }

              callBack(listaDeDepositos);
            } else {
              callBack(listaDeDepositos);
            }
          },
          function(txResult, error) {
            if (error.code !== 0) {
              errorCallBack(
                "No se pudo obtener la lista de Depositos debido a: " +
                  error.message
              );
            }
          }
        );
      },
      function(err) {
        if (err.code !== 0) {
          errorCallBack(
            "No se pudo inicar la transaccion debido a: " + err.message
          );
        }
      }
    );
  } catch (e) {
    errorCallBack(
      "Error al obtener los depositos no posteados debido a: " + e.message
    );
  }
}

//------------------ INICIA ENVIO DE FACTURAS -------------------------------------
var _enviandoFacturas = false;

function ObtenerFacturasNoPosteadas(callback, errCallBack, facturas) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql =
        "SELECT * FROM INVOICE_HEADER IH " +
        "INNER JOIN TASK T " +
        "WHERE IS_CREDIT_NOTE = 0 " +
        "AND IH.IS_POSTED IN (0,1) " +
        "AND IH.STATUS <> 3 " +
        "AND T.IS_POSTED = 3 " +
        "GROUP BY IH.INVOICE_NUM " +
        "ORDER BY IH.INVOICE_NUM";

      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var factura = {
              InvoiceId: results.rows.item(i).INVOICE_NUM,
              Terms: results.rows.item(i).TERMS,
              PostedDatetime: results.rows.item(i).POSTED_DATETIME,
              ClientId: results.rows.item(i).CLIENT_ID,
              ClientName: results.rows.item(i).CLIENT_NAME,
              PosTerminal: results.rows.item(i).POS_TERMINAL,
              Gps: results.rows.item(i).GPS,
              TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
              IsPosted: results.rows.item(i).IS_POSTED,
              Status: results.rows.item(i).STATUS,
              VoidReason: results.rows.item(i).VOID_REASON,
              VoidNotes: results.rows.item(i).VOID_NOTES,
              VoidInvoiceId: results.rows.item(i).VOID_INVOICE_ID,
              PrintRequest: results.rows.item(i).PRINT_REQUEST,
              PrintedCount: results.rows.item(i).PRINTED_COUNT,
              AuthId: results.rows.item(i).AUTH_ID,
              SatSerie: results.rows.item(i).SAT_SERIE,
              Change: results.rows.item(i).CHANGE,
              ConsignmnetId: results.rows.item(i).CONSIGNMENT_ID,
              IsPaidConsignment: results.rows.item(i).IS_PAID_CONSIGNMENT,
              InitialTaskImage: results.rows.item(i).INITIAL_TASK_IMAGE,
              Image1: results.rows.item(i).IMG1,
              Image2: results.rows.item(i).IMG2,
              Image3: results.rows.item(i).IMG3,
              ErpInvoiceId: results.rows.item(i).ERP_INVOICE_ID,
              IsCreditNote: results.rows.item(i).IS_CREDIT_NOTE,
              InRoutePlan: results.rows.item(i).IN_ROUTE_PLAN,
              IdBo: results.rows.item(i).ID_BO,
              IsPostedValidated: results.rows.item(i).IS_POSTED_VALIDATED,
              DetailQty: 0,
              HandleTax: results.rows.item(i).HANDLE_TAX,
              TaxPercent: results.rows.item(i).TAX_PERCENT,
              TelephoneNumber: results.rows.item(i).TELEPHONE_NUMBER,
              IsFromDeliveryNote: results.rows.item(i).IS_FROM_DELIVERY_NOTE,
              Discount: results.rows.item(i).DISCOUNT,
              Comment: results.rows.item(i).COMMENT,
              DueDate: results.rows.item(i).DUE_DATE
                ? results.rows.item(i).DUE_DATE
                : null,
              CreditAmount: results.rows.item(i).CREDIT_AMOUNT
                ? results.rows.item(i).CREDIT_AMOUNT
                : 0,
              CashAmount: results.rows.item(i).CASH_AMOUNT
                ? results.rows.item(i).CASH_AMOUNT
                : 0,
              PaidToDate: results.rows.item(i).PAID_TO_DATE
                ? results.rows.item(i).PAID_TO_DATE
                : 0,
              TaskId: results.rows.item(i).TASK_ID,
              GoalHeaderId: results.rows.item(i).GOAL_HEADER_ID,
              ElectronicSignature: results.rows.item(i).ELECTRONIC_SIGNATURE,
              DocumentSeries: results.rows.item(i).DOCUMENT_SERIES,
              DocumentNumber: results.rows.item(i).DOCUMENT_NUMBER,
              DocumentUrl: results.rows.item(i).DOCUMENT_URL,
              Shipment: results.rows.item(i).SHIPMENT,
              ValidationResult: results.rows.item(i).VALIDATION_RESULT,
              ShipmentDatetime: results.rows.item(i).SHIPMENT_DATETIME,
              ShipmentResponse: results.rows.item(i).SHIPMENT_RESPONSE,
              IsContingencyDocument: results.rows.item(i)
                .IS_CONTINGENCY_DOCUMENT,
              ContingencyDocSerie: results.rows.item(i).CONTINGENCY_DOC_SERIE,
              ContingencyDocNum: results.rows.item(i).CONTINGENCY_DOC_NUM,
              FelDocumentType: results.rows.item(i).FEL_DOCUMENT_TYPE,
              FelStablishmentCode: results.rows.item(i).FEL_STABLISHMENT_CODE,
              InvoiceDetail: Array()
            };
            facturas.push(factura);
          }
          callback(facturas);
        },
        function(tx, err) {
          if (err.code !== 0) errCallBack(err);
        }
      );
    },
    function(err) {
      errCallBack(err);
    }
  );
}

function ObtenerLineasDeFacturaNoPosteados(
  factura,
  errCallBack,
  facturas,
  i,
  callback,
  returncallBack
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT * ";
      sql += " FROM INVOICE_DETAIL ";
      sql += " WHERE INVOICE_NUM=" + factura.InvoiceId + "";
      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var j = 0; j < results.rows.length; j++) {
            var detFactura = {
              InvoiceId: results.rows.item(j).INVOICE_NUM,
              Sku: results.rows.item(j).SKU,
              SkuName: results.rows.item(j).SKU_NAME,
              Qty: results.rows.item(j).QTY,
              Price: results.rows.item(j).PRICE,
              Discount: results.rows.item(j).DISCOUNT,
              TotalLine: results.rows.item(j).TOTAL_LINE,
              Serie: results.rows.item(j).SERIE,
              Serie2: results.rows.item(j).SERIE_2,
              RequeriesSerie: results.rows.item(j).REQUERIES_SERIE,
              LineSeq: j,
              IsActive: results.rows.item(j).IS_ACTIVE,
              ComboReference: results.rows.item(j).COMBO_REFERENCE,
              ParentSeq: results.rows.item(j).PARENT_SEQ,
              Exposure: results.rows.item(j).EXPOSURE,
              Phone: results.rows.item(j).PHONE,
              TaxCode: results.rows.item(j).TAX_CODE,
              SalesPackUnit: results.rows.item(j).PACK_UNIT,
              StockPackUnit: results.rows.item(j).CODE_PACK_UNIT_STOCK,
              ConversionFactor: results.rows.item(j).CONVERSION_FACTOR
            };
            factura.InvoiceDetail.push(detFactura);
          }

          factura.DetailQty = results.rows.length;

          facturas = callback(facturas, i, factura);

          if (facturas.length - 1 === i) {
            returncallBack(facturas);
          }
        },
        function(tx, err) {
          if (err.code !== 0) errCallBack(err);
        }
      );
    },
    function(err) {
      errCallBack(err);
    }
  );
}

function ObtenerDetalleDeFacturaNoPosteados(callback, errCallBack, facturas) {
  var i;
  for (i = 0; i < facturas.length; i++) {
    ObtenerLineasDeFacturaNoPosteados(
      facturas[i],
      errCallBack,
      facturas,
      i,
      function(facturasN1, index, factura) {
        facturasN1[index] = factura;
        return facturasN1;
      },
      callback
    );
  }
  if (i === 0) {
    callback(facturas);
  }
}

function EnviarFactura(facturas, index, esUltimo) {
  if (facturas.length <= 0) {
    _enviandoFacturas = false;
  } else {
    var facturaAEnviar = null;
    var sendingInterval = setInterval(function() {
      facturaAEnviar = facturas.splice(0, 1); //Se envian facturas de 1 en 1
      if (facturaAEnviar && facturaAEnviar.length > 0) {
        var data = {
          invoice: facturaAEnviar[0],
          dbuser: gdbuser,
          dbuserpass: gdbuserpass,
          battery: gBatteryLevel,
          routeid: gCurrentRoute,
          uuid: device.uuid,
          warehouse: gDefaultWhs
        };
        SocketControlador.socketIo.emit("post_invoice", data);
      }

      if (facturas.length === 0) {
        facturaAEnviar = null;
        clearInterval(sendingInterval);
        _enviandoFacturas = false;
      }
    }, 3000);
  }
}

function ActualizarEnvioDeFactura(data, callback, errCallBack) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "UPDATE INVOICE_HEADER";
      sql += " SET IS_POSTED=1";
      sql += " WHERE";
      sql += " INVOICE_NUM =" + data.InvoiceId;

      tx.executeSql(sql);
    },
    function(err) {
      errCallBack(err);
    },
    function() {
      callback(data);
    }
  );
}

function FinalizarEnvioFactura(data, callback, errCallBack) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "UPDATE INVOICE_HEADER";
      sql += " SET IS_POSTED = 2";
      sql += "  ,ID_BO = " + data.IdBo;
      sql += " WHERE";
      sql += " INVOICE_NUM =" + data.InvoiceId;

      tx.executeSql(sql);
    },
    function(err) {
      errCallBack(err);
    },
    function() {
      callback(data);
    }
  );
}

function EnviarFacturas(callback, errCallback) {
  if (_enviandoFacturas) {
    callback();
    return;
  }
  _enviandoFacturas = true;
  var facturas = [];
  ObtenerFacturasNoPosteadas(
    function(facturasN1) {
      console.dir(facturasN1);
      ObtenerDetalleDeFacturaNoPosteados(
        function(facturasN2) {
          if (facturasN2.length > 0) {
            EnviarFactura(facturasN2, 0, facturasN2.length - 1 === 0);
          } else {
            _enviandoFacturas = false;
          }
        },
        errCallback,
        facturasN1
      );
    },
    errCallback,
    facturas
  );
}

//------------------ FINALIZA ENVIO DE FACTURAS -------------------------------------

//------------------ INICIA VALIDACION ENVIO DE FACTURAS -------------------------------------

function EnviarValidacionDeFactura(callback, errCallback) {
  if (_enviandoValidacionDeFacturas) {
    callback();
    return;
  }
  _enviandoValidacionDeFacturas = true;

  VerificarDocumentosEnServidor(
    TipoDeValidacionDeFactura.EnRuta,
    false,
    function() {
      _enviandoValidacionDeFacturas = false;
      callback();
    },
    function(err) {
      errCallback(err);
    }
  );
}

function VerificarDocumentosEnServidor(
  tipoDeValidacionDeFactura,
  obtenerTodasLasFacturas,
  callback,
  errCallback
) {
  if (gIsOnline == EstaEnLinea.No) {
    errCallback("No hay conexion hacia el servidor");
    return;
  }

  ObtenerFacturasSincronizadas(
    obtenerTodasLasFacturas,
    function(facturas) {
      FormarEnvioDeFacturas(
        facturas,
        function(enviarFacturas) {
          if (
            tipoDeValidacionDeFactura === TipoDeValidacionDeFactura.FinDeRuta
          ) {
            SocketControlador.socketIo.on("ValidateInvoices_Request", callback);
          }

          var data = {
            Invoices: enviarFacturas,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            Source: tipoDeValidacionDeFactura
          };

          SocketControlador.socketIo.emit("ValidateInvoice", data);

          if (
            tipoDeValidacionDeFactura !== TipoDeValidacionDeFactura.FinDeRuta
          ) {
            callback();
          }
        },
        function(err) {
          errCallback(err);
        }
      );
    },
    function(err) {
      errCallback(err);
    }
  );
}

function ObtenerFacturasSincronizadas(obtenerTodas, callback, errCallback) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql =
        "SELECT H.INVOICE_NUM, H.ID_BO, COUNT(D.SKU) AS DETAIL_NUM, MAX(H.CLIENT_ID) CLIENT_ID, " +
        "MAX(H.AUTH_ID) AUTH_ID, MAX(H.SAT_SERIE) SAT_SERIE, MAX(H.POSTED_DATETIME) POSTED_DATETIME";
      sql += " FROM INVOICE_HEADER H";
      sql += " INNER JOIN INVOICE_DETAIL D ON (H.INVOICE_NUM = D.INVOICE_NUM)";
      sql +=
        " WHERE H.IS_CREDIT_NOTE = 0 AND H.IS_POSTED =" +
        EstadoEnvioDoc.EnviadoConAcuseDeRecibido;
      if (!obtenerTodas) {
        sql += " AND IFNULL(H.IS_POSTED_VALIDATED,0) IN (0,1) ";
      }
      sql += " GROUP BY H.ID_BO";

      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          callback(results);
        },
        function(tx, err) {
          if (err.code !== 0) errCallback(err);
        }
      );
    },
    function(err) {
      errCallback(err);
    }
  );
}

function FormarEnvioDeFacturas(facturas, callback, errCallback) {
  try {
    var enviarFacturas = [];

    for (var i = 0; i < facturas.rows.length; i++) {
      var factura = {
        IdBo: facturas.rows.item(i).ID_BO,
        InvoiceId: facturas.rows.item(i).INVOICE_NUM,
        AuthId: facturas.rows.item(i).AUTH_ID,
        SatSerie: facturas.rows.item(i).SAT_SERIE,
        ClientId: facturas.rows.item(i).CLIENT_ID,
        PostedDatetime: facturas.rows.item(i).POSTED_DATETIME,
        DetailNum:
          facturas.rows.item(i).DETAIL_NUM === null ||
          facturas.rows.item(i).DETAIL_NUM === "null" ||
          facturas.rows.item(i).DETAIL_NUM === "NULL" ||
          facturas.rows.item(i).DETAIL_NUM === undefined
            ? 0
            : facturas.rows.item(i).DETAIL_NUM
      };
      enviarFacturas.push(factura);
    }
    callback(enviarFacturas);
  } catch (e) {
    errCallback(e);
  }
}

function ActualizarEstadoDeFactura(
  invoiceId,
  estado,
  estadoDeValidacion,
  index,
  callback,
  errCallback
) {
  try {
    SONDA_DB_Session.transaction(
      function(tx) {
        var sql = "UPDATE INVOICE_HEADER";
        sql += " SET IS_POSTED = " + estado;
        sql += " ,IS_POSTED_VALIDATED = " + estadoDeValidacion;
        sql += " WHERE INVOICE_NUM = " + invoiceId;

        tx.executeSql(
          sql,
          [],
          function(tx, results) {
            callback(index);
          },
          function(tx, err) {
            if (err.code !== 0) errCallback(err);
          }
        );
      },
      function(err) {
        errCallback(err);
      }
    );
  } catch (e) {
    errCallback({ code: 0, message: e.message });
  }
}

function CambiarEstadoParaReenviarFacturas(facturas, callback, errCallback) {
  try {
    for (var i = 0; i < facturas.length; i++) {
      ActualizarEstadoDeFactura(
        facturas[i].DOC_NUM,
        facturas[i].RESULT === EstadoEnvioDoc.NoEnviado
          ? EstadoEnvioDoc.NoEnviado
          : EstadoEnvioDoc.EnviadoConAcuseDeRecibido,
        facturas[i].RESULT ===
          EstadoDeValidacionDeOrdenDeVenta.PendienteDeValidar
          ? EstadoDeValidacionDeOrdenDeVenta.PendienteDeValidar
          : EstadoDeValidacionDeOrdenDeVenta.EnviadoConAcuseDeValidado,
        i,
        function(index) {
          if (index === facturas.length - 1) {
            callback();
          }
        },
        function(err) {
          errCallback(err);
        }
      );
    }
  } catch (e) {
    errCallback({ code: 0, message: e.message });
  }
}

function ValidarValidacionesDeFacturasSincronizadas(callback, errCallBack) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT *  ";
      sql += " FROM INVOICE_HEADER ";
      sql += " WHERE IFNULL(IS_POSTED_VALIDATED,0) IN (0,1)";
      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          if (results.rows.length < 1) {
            callback();
          } else {
            errCallBack(
              "No se han validado todas las facturas, espere por favor."
            );
          }
        },
        function(tx, err) {
          if (err.code !== 0) errCallBack(err);
        }
      );
    },
    function(err) {
      errCallBack(err);
    }
  );
}

//------------------ FINALIZA VALIDACION ENVIO DE FACTURAS -------------------------------------

//------------------ INICIA ENVIO DE VALIDACION DE SCOUTINGS -----------------------------------
function EnviarValidacionDeClientes(callback, errCallback) {
  if (_enviandoValidacionDeClientes) {
    callback();
    return;
  }
  _enviandoValidacionDeClientes = true;

  VerificarClientesEnServidor(
    false,
    TipoDeValidacionDeCliente.EnRuta,
    function() {
      _enviandoValidacionDeClientes = false;
      if (callback) {
        callback();
      }
    },
    function(err) {
      if (errCallback) {
        errCallback(err);
      }
    }
  );
}
//------------------ FINALIZA ENVIO DE VALIDACION DE SCOUTINGS ---------------------------------

//------------------ INICIA ENVIO DE CLIENTES SCOUTING -----------------------------------------
function EnviarScouting() {
  if (_enviandoScouting) return;
  _enviandoScouting = true;
  var clienteServicio = new ClienteServicio();
  var clientesAEnviar = [];

  clienteServicio.obtenerClientesConEtiquetasNoSincronizados(
    function(clientes) {
      if (clientes.length > 0) {
        InteraccionConUsuarioServicio.bloquearPantalla();
        var sendingInterval = setInterval(function() {
          clientesAEnviar = clientes.splice(0, 5); //Se envian los clientes de 5 en 5
          var data = {
            scouting: clientesAEnviar,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            loginId: gLastLogin,
            deviceId: device.uuid
          };

          SocketControlador.socketIo.emit("InsertScoutingFromSondaPos", data);
          if (clientes.length === 0) {
            clientesAEnviar = null;
            clearInterval(sendingInterval);
            _enviandoScouting = false;
          }
        }, 3000);
      } else {
        _enviandoScouting = false;
      }
    },
    function(resultado) {
      notify(
        "No se han podido obtener los clientes no sincronizados debido a: " +
          resultado.mensaje
      );
    }
  );
}

function VerificarValidacionesDeClientesSincronizados(callback, errCallBack) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "SELECT *  ";
      sql += " FROM CLIENT ";
      sql += " WHERE IFNULL(IS_POSTED_VALIDATED,0) IN (0,1)";
      tx.executeSql(
        sql,
        [],
        function(txReturn, results) {
          if (results.rows.length < 1) {
            callback();
          } else {
            errCallBack(
              "No se han validado todos los clientes, espere por favor."
            );
          }
        },
        function(txReturn, err) {
          if (err.code !== 0) errCallBack(err.message);
        }
      );
    },
    function(err) {
      errCallBack(err.message);
    }
  );
}

function VerificarClientesEnServidor(
  obtenerTodosLosClientes,
  tipoDeValidacionDeCliente,
  callback,
  errCallback
) {
  if (gIsOnline == EstaEnLinea.No) {
    errCallback("No hay conexion hacia el servidor");
    return;
  }

  var clienteServicio = new ClienteServicio();
  clienteServicio.obtenerClientesParaValidacionEnBo(
    obtenerTodosLosClientes,
    function(clientes) {
      if (clientes.length > 0) {
        if (tipoDeValidacionDeCliente === TipoDeValidacionDeCliente.FinDeRuta) {
          SocketControlador.socketIo.on(
            "ValidateScoutingsPOS_Request" + tipoDeValidacionDeCliente,
            callback
          );
        }
        var data = {
          scouting: clientes,
          dbuser: gdbuser,
          dbuserpass: gdbuserpass,
          routeid: gCurrentRoute,
          Source: tipoDeValidacionDeCliente
        };

        SocketControlador.socketIo.emit("ValidateScoutingsPOS", data);

        if (tipoDeValidacionDeCliente !== TipoDeValidacionDeCliente.FinDeRuta) {
          callback();
        }
      } else {
        if (tipoDeValidacionDeCliente === TipoDeValidacionDeCliente.FinDeRuta) {
          var data2 = {
            option: OpcionRespuesta.Exito,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            Source: tipoDeValidacionDeCliente
          };
          callback(data2);
          data2 = null;
        } else {
          callback();
        }
      }
    },
    function(resultado) {
      errCallback(resultado.mensaje);
      return;
    }
  );
}
//------------------ FINALIZA ENVIO DE CLIENTES SCOUTING -----------------------------------------

//------------------ INICIA ENVIO DE NUMEROS DE TELEFONO ASOCIADOS A FACTURAS -----------------------------------------

function EnviarFacturasConNumeroDeTelefonoAsociado(callback, errCallback) {
  if (gIsOnline == EstaEnLinea.No) {
    return;
  }
  if (_enviandoNumerosDeTelefonoAsociadosAFactura) {
    callback();
    return;
  }
  _enviandoNumerosDeTelefonoAsociadosAFactura = true;

  var facturas = [];
  ObtenerFacturasConNumeroTelefonico(
    function(facturasN1) {
      if (facturasN1.length > 0)
        EnviarFacturaConNumeroDeTelefonoAsociado(facturasN1);
      _enviandoNumerosDeTelefonoAsociadosAFactura = false;
    },
    errCallback,
    facturas,
    true
  );
}

function ObtenerFacturasConNumeroTelefonico(callback, errCallBack, facturas) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql =
        "SELECT * FROM INVOICE_HEADER WHERE IS_CREDIT_NOTE = 0 AND IS_POSTED IN (1,2) AND STATUS <> 3 AND TELEPHONE_NUMBER IS NOT NULL AND ID_BO IS NOT NULL ORDER BY INVOICE_NUM";
      tx.executeSql(
        sql,
        [],
        function(tx, results) {
          for (var i = 0; i < results.rows.length; i++) {
            var factura = {
              InvoiceId: results.rows.item(i).INVOICE_NUM,
              PosTerminal: results.rows.item(i).POS_TERMINAL,
              AuthId: results.rows.item(i).AUTH_ID,
              SatSerie: results.rows.item(i).SAT_SERIE,
              IdBo: results.rows.item(i).ID_BO,
              TelephoneNumber: results.rows.item(i).TELEPHONE_NUMBER
            };
            facturas.push(factura);
          }
          callback(facturas);
        },
        function(tx, err) {
          if (err.code !== 0) errCallBack(err);
        }
      );
    },
    function(err) {
      errCallBack(err);
    }
  );
}

function EnviarFacturaConNumeroDeTelefonoAsociado(facturas) {
  var data = {
    invoices: facturas,
    dbuser: gdbuser,
    dbuserpass: gdbuserpass,
    battery: gBatteryLevel,
    routeid: gCurrentRoute,
    uuid: device.uuid,
    warehouse: gDefaultWhs
  };
  SocketControlador.socketIo.emit("UpdateTelephoneNumberToInvoice", data);
}
//------------------ FINALIZA ENVIO DE NUMEROS DE TELEFONO ASOCIADOS A FACTURAS -----------------------------------------

//----------------- INICIA ENVIO DE NOTAS DE ENTREGA --------------------------------------------------------------------

function EnviarNotasDeEntrega() {
  if (_enviandoNotasDeEntrega) return;

  _enviandoNotasDeEntrega = true;

  var notaDeEntregaServicio = new NotaDeEntregaServicio();
  var notasDeEntregaAEnviar = [];

  notaDeEntregaServicio.obtenerDocumentosParaSincronizacion(
    function(documentosParaSincronizar) {
      if (documentosParaSincronizar.length > 0) {
        var intervaloDeEnvioDeNotasDeEntrega = setInterval(function() {
          notasDeEntregaAEnviar = documentosParaSincronizar.splice(0, 5); //Se envian los clientes de 5 en 5
          var data = {
            notasDeEntrega: notasDeEntregaAEnviar,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            loginId: gLastLogin,
            deviceId: device.uuid
          };

          SocketControlador.socketIo.emit(
            "InsertDeliveryNotesFromSondaSd",
            data
          );
          if (documentosParaSincronizar.length === 0) {
            notasDeEntregaAEnviar = null;
            clearInterval(intervaloDeEnvioDeNotasDeEntrega);
            _enviandoNotasDeEntrega = false;
          }
        }, 3000);
      } else {
        _enviandoNotasDeEntrega = false;
      }
    },
    function(error) {
      notify(error.mensaje);
    }
  );
}

//----------------- FINALIZA ENVIO DE NOTAS DE ENTREGA ------------------------------------------------------------------

//----------------- INICIA ENVIO DE ENTREGA CANCELADAS--------------------------------------------------------------------

function EnviarEntregasCanceladas() {
  if (_enviandoNotasDeEntregaCanceladas) return;

  _enviandoNotasDeEntregaCanceladas = true;

  var entregaServicio = new EntregaServicio();
  var entregasCanceladasAEnviar = [];

  entregaServicio.obtenerEntregasCanceladasParaSincronizacion(
    function(entregasCanceladasParaSincronizar) {
      if (entregasCanceladasParaSincronizar.length > 0) {
        var intervaloDeEnvioDeEntregasCanceladas = setInterval(function() {
          entregasCanceladasAEnviar = entregasCanceladasParaSincronizar.splice(
            0,
            5
          ); //Se envian los clientes de 5 en 5
          var data = {
            entregasCanceladas: entregasCanceladasAEnviar,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            loginId: gLastLogin
          };

          SocketControlador.socketIo.emit(
            "InsertCanceledDeliveryFromSondaSd",
            data
          );
          if (entregasCanceladasParaSincronizar.length === 0) {
            entregasCanceladasAEnviar = null;
            clearInterval(intervaloDeEnvioDeEntregasCanceladas);
            _enviandoNotasDeEntregaCanceladas = false;
          }
        }, 3000);
      } else {
        _enviandoNotasDeEntregaCanceladas = false;
      }
    },
    function(error) {
      notify(error.mensaje);
    }
  );
}

//----------------- FINALIZA ENVIO DE ENTREGA CANCELADAS ------------------------------------------------------------------

//----------------- INICIA ENVIO DE DEMANDAS DE DESPACHO POR TAREA --------------------------------------------------------------------

function EnviarDemandasDeDespachoPorTarea() {
  if (_enviandoDemandasDeDespachoPorTarea) return;

  _enviandoDemandasDeDespachoPorTarea = true;

  var entregaServicio = new EntregaServicio();
  var demandasDeDespachoPorTareaAEnviar = [];

  entregaServicio.obtenerDemandasDeDespachoPorTareaParaSincronizacion(
    function(demandasDeDespachoPorTareaParaSincronizar) {
      if (demandasDeDespachoPorTareaParaSincronizar.length > 0) {
        var intervaloDeEnvioDeDemandasDeDespachoPorTarea = setInterval(
          function() {
            demandasDeDespachoPorTareaAEnviar = demandasDeDespachoPorTareaParaSincronizar.splice(
              0,
              5
            ); //Se envian los clientes de 5 en 5
            var data = {
              demandasDespachoPorTarea: demandasDeDespachoPorTareaAEnviar,
              dbuser: gdbuser,
              dbuserpass: gdbuserpass,
              routeid: gCurrentRoute,
              loginId: gLastLogin
            };

            SocketControlador.socketIo.emit(
              "InsertPickingDemandByTaskFromSondaSd",
              data
            );
            if (demandasDeDespachoPorTareaParaSincronizar.length === 0) {
              demandasDeDespachoPorTareaAEnviar = null;
              clearInterval(intervaloDeEnvioDeDemandasDeDespachoPorTarea);
              _enviandoDemandasDeDespachoPorTarea = false;
            }
          },
          3000
        );
      } else {
        _enviandoDemandasDeDespachoPorTarea = false;
      }
    },
    function(error) {
      notify(error.mensaje);
    }
  );
}

//----------------- FINALIZA ENVIO DE DEMANDAS DE DESPACHO POR TAREA --------------------------------------------------------------------

//----------------- INICIA SINCRONIZAICON DE MANIFIESTOS 3PL --------------------------------------------------------------------

function MarcarManifiestos3PlComoCompletos() {
  if (_marcandoManifiestos3Pl) return;
  _marcandoManifiestos3Pl = true;
  var manifiestoServicio = new ManifiestoServicio();
  manifiestoServicio.obtenerManifiestos3PlParaSincronizacion(
    function(manifiestos3PlParaSincronizar) {
      if (manifiestos3PlParaSincronizar.length > 0) {
        this.EnviarManifiesto3pl(
          manifiestos3PlParaSincronizar,
          0,
          manifiestos3PlParaSincronizar.length - 1 === 0
        );
        _marcandoManifiestos3Pl = false;
      } else {
        _marcandoManifiestos3Pl = false;
      }
    },
    function(error) {
      notify(error.mensaje);
    }
  );
}

function EnviarManifiesto3pl(manifiestos, index, esUltimo) {
  var manifiestoControlador = new ManifiestoControlador();
  manifiestoControlador.cambiarEstadoManifiesto3plEnElServidor(
    manifiestos[index].manifestHeaderId,
    EstadoDeManifiesto.Completado.toString()
  );
  if (esUltimo) return;
  setTimeout(function() {
    var actual = index + 1;
    EnviarManifiesto3pl(manifiestos, actual, manifiestos.length - 1 === actual);
  }, 5000);
}

//----------------- INICIA ENVIO DE NOTAS DE ENTREGA ANULADAS --------------------------------------------------------------------

function EnviarNotasDeEntregaAnuladas() {
  if (_enviandoNotasDeEntregaAnuladas) return;

  _enviandoNotasDeEntregaAnuladas = true;

  var notaDeEntregaServicio = new NotaDeEntregaServicio();
  var notasDeEntregaAEnviar = [];

  notaDeEntregaServicio.obtenerNotasDeEntregaAnuladasParaSincronizacion(
    function(documentosParaSincronizar) {
      if (documentosParaSincronizar.length > 0) {
        var intervaloDeEnvioDeNotasDeEntrega = setInterval(function() {
          notasDeEntregaAEnviar = documentosParaSincronizar.splice(0, 5); //Se envian los documentos de 5 en 5
          var data = {
            notasDeEntrega: notasDeEntregaAEnviar,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            loginId: gLastLogin
          };

          SocketControlador.socketIo.emit(
            "InsertDeliveryNoteCanceledFromSondaSd",
            data
          );
          if (documentosParaSincronizar.length === 0) {
            notasDeEntregaAEnviar = null;
            clearInterval(intervaloDeEnvioDeNotasDeEntrega);
            _enviandoNotasDeEntregaAnuladas = false;
          }
        }, 3000);
      } else {
        _enviandoNotasDeEntregaAnuladas = false;
      }
    },
    function(error) {
      notify(error.mensaje);
    }
  );
}

//----------------- FINALIZA ENVIO DE NOTAS DE ENTREGA ANULADAS ------------------------------------------------------------------

//----------------- ENVIO DE DOCUMENTOS DE PAGO DE FACTURAS VENCIDAS -----------------------------

{
  function EnviarDocumentosDePagoDeFacturasVencidas() {
    if (_enviandoDocumentosDePagoDeFacturasVencidas) return;

    _enviandoDocumentosDePagoDeFacturasVencidas = true;

    var pagoServicio = new PagoServicio();
    var pagosAEnviar = [];

    pagoServicio.obtenerDocumentosDePagoNoPosteadosEnElServidor(function(
      documentosNoPosteados
    ) {
      if (documentosNoPosteados.length > 0) {
        var intervaloDeEnvioDeDocumentosDePago = setInterval(function() {
          pagosAEnviar = documentosNoPosteados.splice(0, 5); //Se envian los documentos de 5 en 5
          var data = {
            overdueInvoicePayment: pagosAEnviar,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            loginId: gLastLogin
          };

          SocketControlador.socketIo.emit("AddOverdueInvoicePayment", data);
          if (documentosNoPosteados.length === 0) {
            pagosAEnviar = null;
            clearInterval(intervaloDeEnvioDeDocumentosDePago);
            _enviandoDocumentosDePagoDeFacturasVencidas = false;
            pagoServicio = null;
          }
        }, 3000);
      } else {
        pagoServicio = null;
        _enviandoDocumentosDePagoDeFacturasVencidas = false;
      }
    });
  }
}
//-------------------------------------------------------------------------------------------------

//#region SINCRONIZACIÓN DE TAREAS CON SERVIDOR
//-------------------------------------- SINCRONIZACIÓN DE TAREAS CON SERVIDOR --------------------------------------
var _enviandoNuevasTareas = false;

/**
 *
 * @param {()=>void} callBack
 * @param {()=>void} errorCallBack
 */
function EnviarNuevasTareas(callBack, errorCallBack) {
  if (_enviandoNuevasTareas) {
    callBack();
    return;
  }

  _enviandoNuevasTareas = true;
  var nuevasTareas = [];
  var nuevasTareasAEnviar = [];
  TareaServicio.ObtenerNuevasTareasNoPosteadas(
    nuevasTareas => {
      if (nuevasTareas.length > 0) {
        var sendingInterval = setInterval(() => {
          nuevasTareasAEnviar = nuevasTareas.splice(0, 5); //Se envían las tareas de 5 en 5
          gNetworkState = navigator.connection.type;
          states[Connection.UNKNOWN] = "Unknown";
          states[Connection.ETHERNET] = "Ethernet";
          states[Connection.WIFI] = "WiFi";
          states[Connection.CELL_2G] = "2G";
          states[Connection.CELL_3G] = "3G";
          states[Connection.CELL_4G] = "4G";
          states[Connection.CELL] = "EDGE";
          states[Connection.NONE] = "NONE";

          var data = {
            tasking: nuevasTareasAEnviar,
            dbuser: gdbuser,
            dbuserpass: gdbuserpass,
            routeid: gCurrentRoute,
            loginId: gLastLogin,
            deviceId: device.uuid,
            networkType: states[gNetworkState]
          };

          SocketControlador.socketIo.emit("InsertNewTasksSD", data);
          if (nuevasTareas.length === 0) {
            nuevasTareasAEnviar = null;
            clearInterval(sendingInterval);
            _enviandoNuevasTareas = false;
          }
        }, 3000);
      } else {
        _enviandoNuevasTareas = false;
      }
    },
    resultado => {
      notify(
        "No se han podido obtener tareas no sincronizadas debido a: " +
          resultado
      );
    },
    nuevasTareas
  );
}
//-------------------------------------------------------------------------------------------------------------------
//#endregion
