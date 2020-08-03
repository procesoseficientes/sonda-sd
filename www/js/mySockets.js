function finalizarRuta(callback, errcallBack) {
  var pSQL = "";
  try {
    SONDA_DB_Session.transaction(
      function(tx) {
        try {
          var query =
            "SELECT name FROM sqlite_master WHERE type='table' AND [name] NOT IN('SEQUENCE_CONTROL')";
          tx.executeSql(
            query,
            [],
            function(txRet, results) {
              if (results.rows.length > 1) {
                //INFO: this loop starts at 1 because index 0 corresponds to the master information table
                for (var index = 1; index < results.rows.length; index++) {
                  var tableName = results.rows.item(index).name;
                  txRet.executeSql("DELETE FROM " + tableName);
                }

                localStorage.removeItem("gDefaultPriceList");
                callback();
              } else {
                localStorage.removeItem("gDefaultPriceList");
                callback();
              }
            },
            function(txRet, error) {
              errcallBack(e);
              console.log({ "Clear DataBase Error": error });
            }
          );
        } catch (e) {
          errcallBack(e);
        }
      },
      function(err, tx) {
        errcallBack(err);
      }
    );
  } catch (e) {
    notify("Error al finalizar la ruta..." + e.message);
  }
}

function NoTieneDocumentosPendientesDeEntrega(resultadoDeConsulta) {
  return resultadoDeConsulta.rows.item(0).QTY_DOCS_PENDING == SiNo.No;
}

function actualizarEstadoDeTarea(
  taskId,
  completadaConExito,
  razon,
  callBack,
  estadoDeTarea
) {
  DispositivoServicio.obtenerUbicacion(function() {
    var sql = [];
    SONDA_DB_Session.transaction(
      function(_tx) {
        var tx = _tx;
        if (!vieneDeListadoDeDocumentosDeEntrega) {
          sql.push("UPDATE TASK SET POSTED_GPS = '" + gCurrentGPS + "'");

          if (
            completadaConExito === SiNo.No ||
            completadaConExito === SiNo.Si
          ) {
            sql.push(
              ", COMPLETED_SUCCESSFULLY = " + parseInt(completadaConExito)
            );
          }

          if (razon) {
            sql.push(", REASON = '" + razon + "'");
          }

          if (estadoDeTarea && estadoDeTarea === TareaEstado.Aceptada) {
            sql.push(
              ", ACCEPTED_STAMP = CASE WHEN ACCEPTED_STAMP IS NULL THEN '" +
                getDateTime() +
                "' ELSE ACCEPTED_STAMP END, TASK_STATUS = 'ACCEPTED'"
            );
          }

          if (estadoDeTarea && estadoDeTarea === TareaEstado.Completada) {
            sql.push(
              ", COMPLETED_STAMP = CASE WHEN COMPLETED_STAMP IS NULL THEN '" +
                getDateTime() +
                "' ELSE COMPLETED_STAMP END, TASK_STATUS = 'COMPLETED'"
            );
          }

          sql.push(
            ", IS_POSTED = CASE WHEN IS_POSTED = -1 THEN IS_POSTED ELSE 2 END"
          );
          sql.push(" WHERE TASK_ID = " + parseInt(taskId));
          
          tx.executeSql(sql.join(""));
        } else {
          sql.push(
            "SELECT COUNT(*) AS QTY_DOCS_PENDING FROM NEXT_PICKING_DEMAND_HEADER AS DH INNER JOIN TASK AS T "
          );
          sql.push(
            "ON(T.RELATED_CLIENT_CODE = DH.CLIENT_CODE AND T.TASK_ADDRESS = DH.ADDRESS_CUSTOMER) WHERE T.TASK_ID = " +
              taskId +
              " AND DH.PROCESS_STATUS = '" +
              EstadoEntrega.Pendiente +
              "'"
          );
          tx.executeSql(
            sql.join(""),
            [],
            function(transReturn, results) {
              sql.length = 0;
              if (NoTieneDocumentosPendientesDeEntrega(results)) {
                sql.push("UPDATE TASK SET POSTED_GPS = '" + gCurrentGPS + "'");

                if (completadaConExito) {
                  sql.push(
                    ", COMPLETED_SUCCESSFULLY = " + parseInt(completadaConExito)
                  );
                }

                if (razon) {
                  sql.push(", REASON = '" + razon + "'");
                }

                if (estadoDeTarea && estadoDeTarea === TareaEstado.Aceptada) {
                  sql.push(
                    ", ACCEPTED_STAMP = CASE WHEN ACCEPTED_STAMP IS NULL THEN '" +
                      getDateTime() +
                      "' ELSE ACCEPTED_STAMP END, TASK_STATUS = 'ACCEPTED'"
                  );
                }

                if (estadoDeTarea && estadoDeTarea === TareaEstado.Completada) {
                  sql.push(
                    ", COMPLETED_STAMP = CASE WHEN COMPLETED_STAMP IS NULL THEN '" +
                      getDateTime() +
                      "' ELSE COMPLETED_STAMP END, TASK_STATUS = 'COMPLETED'"
                  );
                }

                sql.push(
                  ", IS_POSTED = 2 WHERE TASK_ID = " +
                    parseInt(taskId) +
                    " AND TASK_STATUS <> 'COMPLETED'"
                );

                tx.executeSql(sql.join(""));

                TareaServicio.recalcularSecuenciaDeTareas(function() {
                  EnviarData();
                });
              } else {
                sql.push(
                  "UPDATE TASK SET POSTED_GPS = '" +
                    gCurrentGPS +
                    "', TASK_STATUS = '" +
                    TareaEstado.Asignada +
                    "'"
                );

                sql.push(
                  ", IS_POSTED = 2 WHERE TASK_ID = " +
                    parseInt(taskId) +
                    " AND TASK_STATUS <> 'COMPLETED'"
                );

                tx.executeSql(sql.join(""));
              }
            },
            function(transResult, error) {
              EnviarData();
              callBack();
            }
          );
        }
      },
      function(
        err //fail
      ) {
        EnviarData();
        callBack();
      },
      function() //success
      {
        EnviarData();
        callBack();
      }
    );
  });
}

function AgregarTipoDeImpuesto(tipoDeImpuesto) {
  SONDA_DB_Session.transaction(
    function(transaction) {
      var sql = "";

      sql =
        "DELETE FROM SWIFT_TAX WHERE TAX_CODE = '" +
        tipoDeImpuesto.TAX_CODE +
        "'";
      transaction.executeSql(sql);

      sql =
        "INSERT INTO SWIFT_TAX(TAX_CODE, TAX_NAME, TAX_VALUE) VALUES('" +
        tipoDeImpuesto.TAX_CODE +
        "', '" +
        tipoDeImpuesto.TAX_NAME +
        "', " +
        tipoDeImpuesto.TAX_VALUE +
        ")";
      transaction.executeSql(sql);
      sql = null;
    },
    function(error) {
      notify(error.message);
    }
  );
}

function TareaEsDeTipoVentaOEntrega(tarea) {
  return (
    tarea.TASK_TYPE == TareaTipo.Venta || tarea.TASK_TYPE == TareaTipo.Entrega
  );
}

//----------Inicio de reglas de calculo---------//
function CalculationRulesReceived() {
  ToastThis("Recibiendo reglas de calculo.");
}

function CalculationRulesNotFound(data) {
  ToastThis("No se encontraron reglas de calculo.");
}

function AddCalculationRules(data) {
  try {
    localStorage.setItem(data.row.PARAMETER_ID, data.row.VALUE);
  } catch (e) {
    notify(e.message);
  }
}

function CalculationRulesCompleted() {
  ToastThis("Reglas de calculo Cargadas Exitosamente.");
}
