function AgregarTransferencia(transferencia, callback, errCallback) {
  AgregarTransferenciaEncabezado(
    transferencia,
    function() {
      for (var i = 0; i < transferencia.Detalles.length; i++) {
        AgregarTransferenciaDetalle(
          transferencia.Detalles[i],
          i,
          function(indice) {
            if (indice === transferencia.Detalles.length - 1) {
              callback();
            }
          },
          function(err) {
            errCallback(err);
          }
        );
      }
    },
    function(err) {
      errCallback(err);
    }
  );
}

function ValidarExistenciaDeTransferenciaEnElMovil(
  transferencia,
  callBack,
  errorCallBack
) {
  try {
    SONDA_DB_Session.transaction(
      function(trans) {
        var sql =
          "SELECT TRANSFER_ID FROM TRANSFER_HEADER WHERE TRANSFER_ID = " +
          transferencia.TRANSFER_ID;
        trans.executeSql(
          sql,
          [],
          function(transResult, recordsetResult) {
            if (recordsetResult.rows.length > 0) {
              callBack(false, transferencia);
            } else {
              callBack(true, transferencia);
            }
          },
          function(transResult, error) {
            if (error.code !== 0) {
              errorCallBack(error.message);
            }
          }
        );
      },
      function(error) {
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
    );
  } catch (e) {
    errorCallBack(e.message);
  }
}

function AgregarTransferenciaEncabezado(transferencia, callback, errCallback) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql =
        "INSERT INTO TRANSFER_HEADER(TRANSFER_ID,CODE_WAREHOUSE_SOURCE,STATUS,DATE)";
      sql += " VALUES (";
      sql += " " + transferencia.TRANSFER_ID;
      sql += " ,'" + transferencia.CODE_WAREHOUSE_SOURCE + "'";
      sql += " ,'" + transferencia.STATUS + "'";
      sql += " , '" + transferencia.CREATION_DATE + "'";
      sql += ");";
      console.log(sql);
      tx.executeSql(sql);
    },
    function(err) {
      errCallback(err);
    },
    function() {
      callback();
    }
  );
}

function AgregarTransferenciaDetalle(
  transferenciaDetalle,
  indice,
  callback,
  errCallback
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql =
        "INSERT INTO TRANSFER_DETAIL(TRANSFER_ID,SKU_CODE,DESCRIPTION_SKU,SERIE,QTY,SALES_PACK_UNIT,CODE_PACK_UNIT_STOCK, VAT_CODE)";
      sql += " VALUES (";
      sql += " " + transferenciaDetalle.TRANSFER_ID;
      sql += " ,'" + transferenciaDetalle.SKU_CODE + "'";
      sql += " ,'" + transferenciaDetalle.DESCRIPTION_SKU + "'";
      sql += transferenciaDetalle.SERIE
        ? " ,'" + transferenciaDetalle.SERIE + "'"
        : " , NULL";
      sql += " ," + transferenciaDetalle.QTY;
      sql += " ,'" + transferenciaDetalle.SALES_PACK_UNIT + "'";
      sql += " ,'" + transferenciaDetalle.CODE_PACK_UNIT_STOCK + "'";
      sql += transferenciaDetalle.VAT_CODE
        ? " ,'" + transferenciaDetalle.VAT_CODE + "'"
        : " , NULL";
      sql += ");";
      console.log(sql);
      tx.executeSql(sql);
    },
    function(err) {
      errCallback(err);
    },
    function() {
      callback(indice);
    }
  );
}

function ActualizarTransferencia(transferencia, callback, errCallback) {
  ActualizarTransferenciaEncabezado(
    transferencia,
    function() {
      for (var i = 0; i < transferencia.Detalles.length; i++) {
        ActualizarTransferenciaDetalle(
          transferencia,
          i,
          function(indice) {
            if (indice === transferencia.Detalles.length - 1) {
              callback();
            }
          },
          function(err) {
            errCallback(err);
          }
        );
      }
    },
    function(err) {
      errCallback(err);
    }
  );
}

function ActualizarTransferenciaEncabezado(
  transferencia,
  callback,
  errCallback
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "UPDATE TRANSFER_HEADER";
      sql +=
        " SET CODE_WAREHOUSE_SOURCE = '" +
        transferencia.CODE_WAREHOUSE_SOURCE +
        "'";
      sql += " ,STATUS = '" + transferencia.STATUS + "'";
      sql += " ,DATE = '" + transferencia.LAST_UPDATE + "'";
      sql += " WHERE TRANSFER_ID = " + transferencia.TRANSFER_ID;
      console.log(sql);
      tx.executeSql(sql);
    },
    function(err) {
      errCallback(err);
    },
    function() {
      callback();
    }
  );
}

function ActualizarTransferenciaDetalle(
  transferenciaDetalle,
  indice,
  callback,
  errCallback
) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "UPDATE TRANSFER_DETAIL";
      sql += " ,SKU_CODE = '" + transferenciaDetalle.SKU_CODE + "'";
      sql +=
        " ,DESCRIPTION_SKU = '" + transferenciaDetalle.DESCRIPTION_SKU + "'";
      sql += " ,SERIE = '" + transferenciaDetalle.SERIE + "'";
      sql += " ,QTY = " + transferenciaDetalle.QTY;
      sql += " WHERE TRANSFER_ID = " + transferenciaDetalle.TRANSFER_ID;
      console.log(sql);
      tx.executeSql(sql);
    },
    function(err) {
      errCallback(err);
    },
    function() {
      callback(indice);
    }
  );
}

function EliminarTransferencia(transferencia, callback, errCallback) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql =
        "DELETE FROM TRANSFER_DETAIL WHERE TRANSFER_ID = " +
        transferencia.TRANSFER_ID;
      console.log(sql);
      tx.executeSql(sql);

      sql =
        "DELETE FROM TRANSFER_HEADER WHERE TRANSFER_ID = " +
        transferencia.TRANSFER_ID;
      console.log(sql);
      tx.executeSql(sql);
    },
    function(err) {
      errCallback(err);
    },
    function() {
      callback();
    }
  );
}

function ActualizarEstadoDeTransferencia(transferencia, callback, errCallback) {
  SONDA_DB_Session.transaction(
    function(tx) {
      var sql = "";
      sql =
        "UPDATE TRANSFER_DETAIL SET STATUS ='" +
        transferencia.STATUS +
        "' WHERE TRANSFER_ID = " +
        transferencia.TRANSFER_ID;
      console.log(sql);
      tx.executeSql(sql);

      sql =
        "UPDATE TRANSFER_HEADER SET STATUS ='" +
        transferencia.STATUS +
        "' WHERE TRANSFER_ID = " +
        transferencia.TRANSFER_ID;
      console.log(sql);
      tx.executeSql(sql);
    },
    function(err) {
      errCallback(err);
    },
    function() {
      callback();
    }
  );
}

function ObtenerTransferencia(
  idTransferencia,
  obteniendoTransferenciaDesde,
  callBack,
  errorCallBack
) {
  try {
    var transferencia = {
      TRANSFER_ID: null,
      CODE_WAREHOUSE_SOURCE: null,
      STATUS: null,
      DATE: null,
      TRANSFER_DETAIL: []
    };
    var sql = "";
    SONDA_DB_Session.transaction(
      function(trans) {
        sql =
          "SELECT TRANSFER_ID" +
          ",CODE_WAREHOUSE_SOURCE" +
          ",STATUS" +
          ",DATE " +
          "FROM TRANSFER_HEADER WHERE TRANSFER_ID = " +
          parseInt(idTransferencia);
        trans.executeSql(
          sql,
          [],
          function(transResult, recordset) {
            if (recordset.rows.length !== 0) {
              var encabezado = recordset.rows[0];
              transferencia.TRANSFER_ID = encabezado.TRANSFER_ID;
              transferencia.CODE_WAREHOUSE_SOURCE =
                encabezado.CODE_WAREHOUSE_SOURCE;
              transferencia.STATUS = encabezado.STATUS;
              transferencia.DATE = encabezado.DATE;
              sql =
                "SELECT [SKU_CODE]" +
                ",MAX(DESCRIPTION_SKU) DESCRIPTION_SKU" +
                ",SUM([QTY]) QTY" +
                ",MAX([SERIE]) SERIE " +
                ", [SALES_PACK_UNIT]" +
                ", [CODE_PACK_UNIT_STOCK]" +
                ", [VAT_CODE]" +
                "FROM [TRANSFER_DETAIL] WHERE [TRANSFER_ID] = " +
                parseInt(idTransferencia) +
                " " +
                "GROUP BY [SKU_CODE]";
              transResult.executeSql(
                sql,
                [],
                function(transResultDetail, recordsetDetail) {
                  for (var i = 0; i < recordsetDetail.rows.length; i++) {
                    var skuDetalle = recordsetDetail.rows[i];
                    var sku = {
                      SKU_CODE: skuDetalle.SKU_CODE,
                      DESCRIPTION_SKU: skuDetalle.DESCRIPTION_SKU,
                      QTY: skuDetalle.QTY,
                      REQUERIES_SERIE:
                        skuDetalle.SERIE === null ||
                        skuDetalle.SERIE === "null" ||
                        skuDetalle.SERIE === "NULL"
                          ? 0
                          : 1,
                      SERIES: [],
                      SALES_PACK_UNIT: skuDetalle.SALES_PACK_UNIT,
                      CODE_PACK_UNIT_STOCK: skuDetalle.CODE_PACK_UNIT_STOCK,
                      VAT_CODE: skuDetalle.VAT_CODE
                    };
                    transferencia.TRANSFER_DETAIL.push(sku);
                  }
                  if (
                    obteniendoTransferenciaDesde ===
                    ObteniendoTransferenciaDesde.Notificacion
                  ) {
                    sql =
                      "UPDATE NOTIFICATION SET IS_NEW = 0 WHERE ID=" +
                      transferencia.TRANSFER_ID;
                    transResultDetail.executeSql(sql);
                    callBack(transferencia);
                  } else {
                    callBack(transferencia);
                  }
                },
                function(transResultDetail, error) {
                  if (error.code !== 0) {
                    errorCallBack(error.message);
                  }
                }
              );
            } else {
              errorCallBack("No se encontro la transferencia...");
            }
          },
          function(transResult, error) {
            if (error.code !== 0) {
              errorCallBack(
                "No se encontro la transferencia debido a: " + error.message
              );
            }
          }
        );
      },
      function(error) {
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
    );
  } catch (e) {
    errorCallBack(e.message);
  }
}

function ObtenerSeriesDeSkuEnTransferencia(
  idTransferencia,
  detalleTransferencia,
  indice,
  callBack,
  errorCallBack
) {
  try {
    if (indice <= detalleTransferencia.length - 1) {
      var sku = detalleTransferencia[indice];
      if (sku.REQUERIES_SERIE == 1) {
        SONDA_DB_Session.transaction(
          function(trans) {
            var sql = "";
            sql =
              "SELECT SERIE FROM TRANSFER_DETAIL WHERE TRANSFER_ID = " +
              parseInt(idTransferencia) +
              " AND SKU_CODE = '" +
              sku.SKU_CODE +
              "'";
            trans.executeSql(
              sql,
              [],
              function(transReturn, recordset) {
                if (recordset.rows.length > 0) {
                  for (var i = 0; i < recordset.rows.length; i++) {
                    sku.SERIES.push(recordset.rows.item(i).SERIE);
                  }
                  ObtenerSeriesDeSkuEnTransferencia(
                    idTransferencia,
                    detalleTransferencia,
                    indice + 1,
                    callBack,
                    errorCallBack
                  );
                } else {
                  ObtenerSeriesDeSkuEnTransferencia(
                    idTransferencia,
                    detalleTransferencia,
                    indice + 1,
                    callBack,
                    errorCallBack
                  );
                }
              },
              function(transReturn, error) {
                errorCallBack(
                  "No se pudieron obtener las series debido a: " + error.message
                );
              }
            );
          },
          function(error) {
            errorCallBack(error.message);
          }
        );
      } else {
        ObtenerSeriesDeSkuEnTransferencia(
          idTransferencia,
          detalleTransferencia,
          indice + 1,
          callBack,
          errorCallBack
        );
      }
    } else {
      callBack();
    }
  } catch (e) {
    errorCallBack(e.message);
  }
}

function ObtenerCantidadDeTransferenciasPendientes(callBack, errorCallBack) {
  try {
    var cantidadDeTransferenciasPendientes = 0;
    SONDA_DB_Session.transaction(
      function(trans) {
        var sql =
          "SELECT COUNT(*) AS QTY_PENDING_TRANSFERS FROM TRANSFER_HEADER WHERE STATUS='" +
          EstadoDeTransferencia.Completado +
          "'";

        trans.executeSql(
          sql,
          [],
          function(transResult, recordsets) {
            if (recordsets.rows.length > 0) {
              cantidadDeTransferenciasPendientes = recordsets.rows.item(0)
                .QTY_PENDING_TRANSFERS;
              callBack(cantidadDeTransferenciasPendientes);
            } else {
              callBack(cantidadDeTransferenciasPendientes);
            }
          },
          function(transResult, error) {
            if (error.code !== 0) {
              errorCallBack(error.message);
            }
          }
        );
      },
      function(error) {
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
    );
  } catch (e) {
    errorCallBack(e.message);
  }
}
function ObtenerSkusSinListaDePrecios(callBack, errorCallBack) {
  try {
    SONDA_DB_Session.transaction(
      function(trans) {
        var sql = "";
        sql =
          "SELECT SKU_CODE" +
          " FROM TRANSFER_DETAIL WHERE SKU_CODE NOT IN (SELECT CODE_SKU FROM PRICE_LIST_BY_SKU_PACK_SCALE) GROUP BY SKU_CODE";

        trans.executeSql(
          sql,
          [],
          function(transReturn, recordset) {
            if (recordset.rows.length > 0) {
              var skus = [];
              for (var i = 0; i < recordset.rows.length; i++) {
                skus.push(recordset.rows.item(i).SKU_CODE);
              }
              callBack(skus);
            } else {
              callBack(skus);
            }
          },
          function(transReturn, error) {
            if (error.code !== 0) {
              errorCallBack(
                "No se pudieron obtener los skus debido a: " + error.message
              );
            }
          }
        );
      },
      function(error) {
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
    );
  } catch (e) {
    errorCallBack(e.message);
  }
}
function InsertarListaDePrecioFueraDeRuta(
  listaPreciosFueraDeRuta,
  listaConversiones,
  callback
) {
  for (var j = 0; j < listaPreciosFueraDeRuta.length; j++) {
    var producto = listaPreciosFueraDeRuta[j];
    addPriceListBySckuPackScale(producto);
  }
  InsertarPaquetesDeConversionFueraDeRuta(listaConversiones, callback);
}

function InsertarPaquetesDeConversionFueraDeRuta(listaConversiones, callback) {
  var unidadDeMedidaServicio = new UnidadDeMedidaServicio();

  for (var j = 0; j < listaConversiones.length; j++) {
    var conversionSku = listaConversiones[j];
    unidadDeMedidaServicio.agregarPaqueteDeConversion(conversionSku);
  }
  callback();
}
