var TareaServicio = {
  ActualizarTareaRazon: function(
    tarea,
    completadaConExito,
    razon,
    callBack,
    errorCallBack
  ) {
    if (tarea !== null) {
      var error = "";
      try {
        SONDA_DB_Session.transaction(
          function(trans) {
            var sql =
              "UPDATE TASK SET COMPLETED_SUCCESSFULLY = " +
              parseInt(completadaConExito) +
              ", REASON = '" +
              razon +
              "', IS_POSTED = 2 WHERE TASK_ID = " +
              parseInt(tarea);
            trans.executeSql(sql);
            callBack();
          },
          function(err) {
            if (err.code !== 0) {
              error = "No se pudo actualizar la tarea debido a: " + err.message;
              errorCallBack(error);
            }
          }
        );
      } catch (e) {
        error =
          "Error al intentar actualizar la tarea actual debido a: " + e.message;

        errorCallBack(error);
      }
    } else {
      callBack();
    }
  },
  ObtenerTareasPorStatus: function(status, type, callBack, errorCallBack) {
    try {
      var sql = "";
      var tareas = new Array();
      SONDA_DB_Session.transaction(
        function(trans) {
          sql =
            "SELECT " +
            "TASK_ID, " +
            "TASK_TYPE, " +
            "TASK_DATE, " +
            "SCHEDULE_FOR, " +
            "CREATED_STAMP, " +
            "ASSIGEND_TO, " +
            "ASSIGNED_BY, " +
            "ACCEPTED_STAMP, " +
            "COMPLETED_STAMP, " +
            "EXPECTED_GPS, " +
            "POSTED_GPS, " +
            "TASK_COMMENTS, " +
            "TASK_SEQ, " +
            "TASK_ADDRESS, " +
            "RELATED_CLIENT_CODE, " +
            "RELATED_CLIENT_NAME, " +
            "TASK_STATUS, " +
            "IS_POSTED, " +
            "TASK_BO_ID, " +
            "COMPLETED_SUCCESSFULLY, " +
            "REASON, " +
            "RGA_CODE, " +
            "NIT, " +
            "IFNULL((SELECT SUM(IFNULL(I.CREDIT_AMOUNT,0)) FROM INVOICE_HEADER AS I WHERE I.CLIENT_ID = T.RELATED_CLIENT_CODE),0) AS CREDIT_AMOUNT," +
            "IFNULL(AI.OUTSTANDING_BALANCE,0) AS CURRENT_BALANCE " +
            ",CASE WHEN (IFNULL(AI.CREDIT_LIMIT,0) > 0 AND IFNULL(AI.OUTSTANDING_BALANCE,0) > 0 AND IFNULL(AI.EXTRA_DAYS,0) > 0) THEN 'Crédito' ELSE 'Contado' END AS BUY_TYPE " +
            "FROM TASK AS T LEFT JOIN CUSTOMER_ACCOUNTING_INFORMATION AS AI ON(AI.CODE_CUSTOMER = T.RELATED_CLIENT_CODE) " +
            " WHERE TASK_STATUS IN (" +
            status +
            ") ";
          if (type) {
            sql += " AND TASK_TYPE = '" + type + "' ";
          } else {
            sql += " AND TASK_TYPE IN('SALE', 'DELIVERY_SD') ";
          }

          sql += " ORDER BY TASK_SEQ ASC";

          trans.executeSql(
            sql,
            [],
            function(_transResult, results) {
              for (var i = 0; i < results.rows.length; i++) {
                tareas.push(results.rows.item(i));
              }
              callBack(tareas);
            },
            function(error, _transResult) {
              if (error.code !== 0) {
                errorCallBack(
                  "Error al obtener las tareas '" +
                    status +
                    "' debido a: " +
                    error.message
                );
              }
            }
          );
        },
        function(err) {
          if (err.code !== 0) {
            err = "Error al obtener las tareas debido a: " + err.message;
            errorCallBack(err);
          }
        }
      );
    } catch (e) {
      errorCallBack(
        "Error al obtener las tareas " + status + " debido a: " + e.message
      );
    }
  },
  ObtenerTareasPorCodigoRga: function(rgaCode, callBack, errorCallBack) {
    try {
      var sql = "";
      var tareas = new Array();
      SONDA_DB_Session.transaction(
        function(trans) {
          sql =
            "SELECT " +
            "TASK_ID, " +
            "TASK_TYPE, " +
            "TASK_DATE, " +
            "SCHEDULE_FOR, " +
            "CREATED_STAMP, " +
            "ASSIGEND_TO, " +
            "ASSIGNED_BY, " +
            "ACCEPTED_STAMP, " +
            "COMPLETED_STAMP, " +
            "EXPECTED_GPS, " +
            "POSTED_GPS, " +
            "TASK_COMMENTS, " +
            "TASK_SEQ, " +
            "TASK_ADDRESS, " +
            "RELATED_CLIENT_CODE, " +
            "RELATED_CLIENT_NAME, " +
            "TASK_STATUS, " +
            "IS_POSTED, " +
            "TASK_BO_ID, " +
            "COMPLETED_SUCCESSFULLY, " +
            "REASON, " +
            "RGA_CODE, " +
            "NIT " +
            "FROM TASK WHERE RGA_CODE = '" +
            rgaCode +
            "' OR RELATED_CLIENT_CODE LIKE ('%" +
            rgaCode +
            "%') OR RELATED_CLIENT_NAME LIKE ('%" +
            rgaCode +
            "%')";
          trans.executeSql(
            sql,
            [],
            function(transResult, results) {
              for (var i = 0; i < results.rows.length; i++) {
                tareas.push(results.rows.item(i));
              }
              callBack(tareas);
            },
            function(error, transResult) {
              if (error.code !== 0) {
                errorCallBack(
                  "Error al obtener las tareas debido a: " + error.message
                );
              }
            }
          );
        },
        function(err) {
          if (err.code !== 0) {
            err = "Error al obtener las tareas debido a: " + err.message;
            errorCallBack(err);
          }
        }
      );
    } catch (e) {
      errorCallBack(
        "Error al obtener las tareas del cliente debido a: " + e.message
      );
    }
  },
  ObtenerTareasPorCodigoDeCliente: function(
    codeCustomer,
    callBack,
    errorCallBack
  ) {
    try {
      var sql = "";
      var tareas = new Array();
      SONDA_DB_Session.transaction(
        function(trans) {
          sql =
            "SELECT " +
            "TASK_ID, " +
            "TASK_TYPE, " +
            "TASK_DATE, " +
            "SCHEDULE_FOR, " +
            "CREATED_STAMP, " +
            "ASSIGEND_TO, " +
            "ASSIGNED_BY, " +
            "ACCEPTED_STAMP, " +
            "COMPLETED_STAMP, " +
            "EXPECTED_GPS, " +
            "POSTED_GPS, " +
            "TASK_COMMENTS, " +
            "TASK_SEQ, " +
            "TASK_ADDRESS, " +
            "RELATED_CLIENT_CODE, " +
            "RELATED_CLIENT_NAME, " +
            "TASK_STATUS, " +
            "IS_POSTED, " +
            "TASK_BO_ID, " +
            "COMPLETED_SUCCESSFULLY, " +
            "REASON, " +
            "RGA_CODE, " +
            "NIT " +
            "FROM TASK WHERE RELATED_CLIENT_CODE = '" +
            codeCustomer +
            "'";
          trans.executeSql(
            sql,
            [],
            function(transResult, results) {
              for (var i = 0; i < results.rows.length; i++) {
                tareas.push(results.rows.item(i));
              }
              callBack(tareas);
            },
            function(error, transResult) {
              if (error.code !== 0) {
                errorCallBack(
                  "Error al obtener las tareas debido a: " + error.message
                );
              }
            }
          );
        },
        function(err) {
          if (err.code !== 0) {
            err = "Error al obtener las tareas debido a: " + err.message;
            errorCallBack(err);
          }
        }
      );
    } catch (e) {
      errorCallBack(
        "Error al obtener las tareas del cliente debido a: " + e.message
      );
    }
  },
  obtenerTareaPorCodigoYTipo: function(
    taskId,
    taskType,
    callBack,
    errorCallBack
  ) {
    try {
      var sql = "";
      SONDA_DB_Session.transaction(
        function(trans) {
          sql =
            "SELECT " +
            "TASK_ID, " +
            "TASK_TYPE, " +
            "TASK_DATE, " +
            "SCHEDULE_FOR, " +
            "CREATED_STAMP, " +
            "ASSIGEND_TO, " +
            "ASSIGNED_BY, " +
            "ACCEPTED_STAMP, " +
            "COMPLETED_STAMP, " +
            "EXPECTED_GPS, " +
            "POSTED_GPS, " +
            "TASK_COMMENTS, " +
            "TASK_SEQ, " +
            "TASK_ADDRESS, " +
            "RELATED_CLIENT_CODE, " +
            "RELATED_CLIENT_NAME, " +
            "TASK_STATUS, " +
            "IS_POSTED, " +
            "TASK_BO_ID, " +
            "COMPLETED_SUCCESSFULLY, " +
            "REASON, " +
            "RGA_CODE, " +
            "NIT, " +
            "PHONE_CUSTOMER," +
            "CODE_PRICE_LIST, " +
            "IN_PLAN_ROUTE, " +
            "DEPARTMENT, " +
            "MUNICIPALITY " +
            "FROM TASK WHERE TASK_TYPE = '" +
            taskType +
            "' AND TASK_ID = " +
            taskId;

          trans.executeSql(
            sql,
            [],
            function(transResult, results) {
              var tarea = new Tarea();
              for (var i = 0; i < results.rows.length; i++) {
                tarea.taskId = results.rows.item(i).TASK_ID;
                tarea.taskType = results.rows.item(i).TASK_TYPE;
                tarea.taskDate = results.rows.item(i).TASK_DATE;
                tarea.scheduleFor = results.rows.item(i).SCHEDULE_FOR;
                tarea.createdStamp = results.rows.item(i).CREATED_STAMP;
                tarea.assignedTo = results.rows.item(i).ASSIGEND_TO;
                tarea.assignedBy = results.rows.item(i).ASSIGNED_BY;
                tarea.acceptedStamp = results.rows.item(i).ACCEPTED_STAMP;
                tarea.completedStamp = results.rows.item(i).COMPLETED_STAMP;
                tarea.expectedGps =
                  results.rows.item(i).EXPECTED_GPS == "undefined" ||
                  results.rows.item(i).EXPECTED_GPS == "null"
                    ? null
                    : results.rows.item(i).EXPECTED_GPS;
                tarea.postedGps = results.rows.item(i).POSTED_GPS;
                tarea.taskComments = results.rows.item(i).TASK_COMMENTS;
                tarea.taskSeq = results.rows.item(i).TASK_SEQ;
                tarea.taskAddress = results.rows.item(i).TASK_ADDRESS;
                tarea.relatedClientCode = results.rows.item(
                  i
                ).RELATED_CLIENT_CODE;
                tarea.relatedClientName = results.rows.item(
                  i
                ).RELATED_CLIENT_NAME;
                tarea.taskStatus = results.rows.item(i).TASK_STATUS;
                tarea.isPosted = results.rows.item(i).IS_POSTED;
                tarea.taskBoId = results.rows.item(i).TASK_BO_ID;
                tarea.completedSuccessfully = results.rows.item(
                  i
                ).COMPLETED_SUCCESSFULLY;
                tarea.reason = results.rows.item(i).REASON;
                tarea.rgaCode = results.rows.item(i).RGA_CODE;
                tarea.nit = results.rows.item(i).NIT;
                tarea.phoneCustomer =
                  results.rows.item(i).PHONE_CUSTOMER == "undefined" ||
                  results.rows.item(i).PHONE_CUSTOMER == "null"
                    ? null
                    : results.rows.item(i).PHONE_CUSTOMER;
                tarea.codePriceList = results.rows.item(i).CODE_PRICE_LIST;
                tarea.inPlanRoute = results.rows.item(i).IN_ROUTE_PLAN;
                tarea.department = results.rows.item(i).DEPARTMENT;
                tarea.municipality = results.rows.item(i).MUNICIPALITY;
              }
              callBack(tarea);
            },
            function(error) {
              errorCallBack(
                "Error al obtener la tarea por tipo debido a: " + error.message
              );
            }
          );
        },
        function(err) {
          errorCallBack(
            "Error al obtener la tarea por tipo debido a: " + err.message
          );
        }
      );
    } catch (e) {
      errorCallBack(
        "Error al obtener la tarea del cliente debido a: " + e.message
      );
    }
  },
  gradosARadianes: function(grados) {
    return grados * (Math.PI / 180);
  },
  obtenerDistanciaEnKM: function(latitud1, longitud1, latitud2, longitud2) {
    var radioTierra = 6371; // Earth's radius (km)
    var latGrados = this.gradosARadianes(latitud2 - latitud1);
    var lonGrados = this.gradosARadianes(longitud2 - longitud1);

    var a =
      Math.sin(latGrados / 2) * Math.sin(latGrados / 2) +
      Math.cos(this.gradosARadianes(latitud1)) *
        Math.cos(this.gradosARadianes(latitud2)) *
        Math.sin(lonGrados / 2) *
        Math.sin(lonGrados / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distancia = radioTierra * c; // Distance in km
    return distancia;
  },
  recalcularSecuenciaDeTareas: function(callBack) {
    var este = this;
    navigator.geolocation.getCurrentPosition(
      function(posicion) {
        este.ObtenerTareasPorStatus(
          "'" + TareaEstado.Asignada + "','" + TareaEstado.Aceptada + "'",
          TareaTipo.Entrega,
          function(tareas) {
            if (tareas.length > 0) {
              este.ObtenerUltimaSequenciaDeTarea(
                function(secuencia) {
                  var distancia = 0;
                  var distanciaMenor = 0;
                  var proximaTarea = [];
                  var tareasConSecuencia = [];
                  var puntoOrigen = {
                    latitud: posicion.coords.latitude,
                    longitud: posicion.coords.longitude
                  };
                  var indiceABorrar = 0;
                  distanciaMenor = este.obtenerDistanciaEnKM(
                    puntoOrigen.latitud,
                    puntoOrigen.longitud,
                    tareas[0].EXPECTED_GPS.split(",")[0],
                    tareas[0].EXPECTED_GPS.split(",")[1]
                  );

                  while (tareas.length > 0) {
                    if (tareas.length === 1) {
                      proximaTarea = tareas[0];
                      indiceABorrar = 0;
                    } else {
                      tareas.map(function(tarea, indice) {
                        distancia = este.obtenerDistanciaEnKM(
                          puntoOrigen.latitud,
                          puntoOrigen.longitud,
                          tarea.EXPECTED_GPS.split(",")[0],
                          tarea.EXPECTED_GPS.split(",")[1]
                        );
                        if (distancia <= distanciaMenor) {
                          distanciaMenor = distancia;
                          proximaTarea = tarea;
                          indiceABorrar = indice;
                        }
                      });
                    }
                    proximaTarea.TASK_SEQ = secuencia;
                    puntoOrigen = {
                      latitud: tareas[indiceABorrar].EXPECTED_GPS.split(",")[0],
                      longitud: tareas[indiceABorrar].EXPECTED_GPS.split(",")[1]
                    };
                    tareasConSecuencia.push(proximaTarea);
                    secuencia++;
                    tareas.splice(indiceABorrar, 1);
                    if (tareas.length > 0) {
                      distanciaMenor = este.obtenerDistanciaEnKM(
                        puntoOrigen.latitud,
                        puntoOrigen.longitud,
                        tareas[0].EXPECTED_GPS.split(",")[0],
                        tareas[0].EXPECTED_GPS.split(",")[1]
                      );
                    }
                  }
                  este.actualizarTareasConSecuencias(
                    tareasConSecuencia,
                    function(error) {
                      InteraccionConUsuarioServicio.desbloquearPantalla();
                      notify(
                        "Error al actualizar tareas con secuencias: " + error
                      );
                    },
                    function() {
                      callBack();
                    }
                  );
                },
                function(error) {
                  InteraccionConUsuarioServicio.desbloquearPantalla();
                  notify(
                    "Error al obtener última secuencia de tarea de entrega: " +
                      error
                  );
                }
              );
            } else {
              InteraccionConUsuarioServicio.desbloquearPantalla();
            }
          },
          function(error) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify("Error al recalcular secuencia de tareas: " + error);
          }
        );
      },
      function(error) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify("No se pudo obtener el GPS, no se actualizará el plan de ruta.");
      },
      { timeout: 30000, enableHighAccuracy: true }
    );
  },
  actualizarTareasConSecuencias: function(
    tareasConSecuencia,
    errorCallBack,
    callBack
  ) {
    try {
      var este = this;
      SONDA_DB_Session.transaction(
        function(trans) {
          este.actualizarTareaConSecuencia(
            este,
            tareasConSecuencia,
            0,
            function(error) {
              errorCallBack(error);
            },
            function() {
              callBack();
            },
            trans
          );
        },
        function(err) {
          errorCallBack(err.message);
        }
      );
    } catch (e) {
      errorCallBack(e.message);
    }
  },
  actualizarTareaConSecuencia: function(
    servicio,
    tareasConSecuencia,
    indice,
    errorCallBack,
    callBack,
    trans
  ) {
    if (tareasConSecuencia.length > indice) {
      var sql = [];
      sql.push("UPDATE TASK ");
      sql.push("SET TASK_SEQ = " + tareasConSecuencia[indice].TASK_SEQ);
      sql.push(", IS_POSTED = 2 ");
      sql.push("WHERE TASK_ID = " + tareasConSecuencia[indice].TASK_ID);
      trans.executeSql(
        sql.join(""),
        [],
        function() {
          servicio.actualizarTareaConSecuencia(
            servicio,
            tareasConSecuencia,
            indice + 1,
            function(error) {
              errorCallBack(error);
            },
            function() {
              if (callBack) {
                callBack();
              }
            },
            trans
          );
        },
        function(error) {
          errorCallBack(error.message);
        }
      );
      sql = null;
    } else {
      if (callBack) {
        callBack();
      }
    }
  },
  ObtenerUltimaSequenciaDeTarea: function(callBack, errorCallBack) {
    try {
      var sql = "";
      SONDA_DB_Session.transaction(
        function(trans) {
          sql =
            "SELECT " +
            " TASK_SEQ " +
            " FROM TASK WHERE TASK_STATUS = 'COMPLETED' " +
            " AND TASK_TYPE = 'DELIVERY_SD' " +
            " ORDER BY TASK_SEQ DESC ";

          trans.executeSql(
            sql,
            [],
            function(transResult, results) {
              if (results.rows.length > 0) {
                callBack(results.rows.item(0).TASK_SEQ + 1);
              } else {
                callBack(1);
              }
            },
            function(error, transResult) {
              errorCallBack(
                "Error al obtener última secuencia de tarea de entrega: " +
                  error.message
              );
            }
          );
          sql = null;
        },
        function(error) {
          errorCallBack(
            "Error al obtener última secuencia de tarea de entrega: " +
              error.message
          );
        }
      );
    } catch (e) {
      errorCallBack(
        "Error al obtener última secuencia de tarea de entrega: " + e.message
      );
    }
  },
  ValidarParametroYTareasParaFinDeRuta: function(callBack, errorCallBack) {
    try {
      var este = this;
      var sql = [];
      SONDA_DB_Session.transaction(function(trans) {
        sql.push(" SELECT VALUE FROM PARAMETERS ");
        sql.push(" WHERE PARAMETER_ID = 'VALIDATE_PENDING_TASKS' ");

        trans.executeSql(
          sql.join(""),
          [],
          function(transResult, results) {
            if (results.rows.length > 0) {
              if (este.validaTareasPendientes(results)) {
                sql.length = 0;
                sql.push(
                  " SELECT TASK_ID FROM TASK WHERE TASK_STATUS <> 'COMPLETED' "
                );
                sql.push(" AND TASK_TYPE IN ('SALE', 'DELIVERY_SD') ");
                transResult.executeSql(sql.join(""), [], function(
                  transResult2,
                  results
                ) {
                  if (results.rows.length > 0) {
                    callBack(false);
                  } else {
                    callBack(true);
                  }
                });
              } else {
                callBack(true);
              }
            } else {
              callBack(true);
            }
          },
          function(error) {
            errorCallBack(error.message);
          }
        );
      });
    } catch (e) {
      errorCallBack(e.message);
    }
  },
  validaTareasPendientes: function(resultadoDeConsulta) {
    return resultadoDeConsulta.rows.item(0).VALUE == SiNo.Si;
  },
  //#region crearNuevaTarea func
  /**
   * Método que inserta la nueva tarea a la base de datos del móvil
   * @param {data} data Tarea a insertar
   * @param {(data)=>void} callBack Método que devuelve la tarea si se pudo insertar
   * @param {(error)=>void} errorCallBack
   */
  crearNuevaTarea: function(data, callBack, errorCallBack) {
    var pSql = "";
    SONDA_DB_Session.transaction(
      //#region tx func
      function(tx) {
        var tarea = data;

        pSql = " INSERT INTO TASK(";
        pSql += "TASK_ID";
        pSql += ", TASK_TYPE";
        pSql += ", TASK_DATE";
        pSql += ", SCHEDULE_FOR";
        pSql += ", CREATED_STAMP";
        pSql += ", ASSIGEND_TO";
        pSql += ", ASSIGNED_BY";
        pSql += ", ACCEPTED_STAMP";
        pSql += ", COMPLETED_STAMP";
        pSql += ", EXPECTED_GPS";
        pSql += ", POSTED_GPS";
        pSql += ", TASK_COMMENTS";
        pSql += ", TASK_SEQ";
        pSql += ", TASK_ADDRESS";
        pSql += ", RELATED_CLIENT_CODE";
        pSql += ", RELATED_CLIENT_NAME";
        pSql += ", TASK_STATUS";
        pSql += ", IS_POSTED";
        pSql += ", TASK_BO_ID";
        pSql += ", NIT";
        pSql += ", CODE_PRICE_LIST";
        pSql += ", IN_PLAN_ROUTE";
        pSql += " ) VALUES (";
        pSql += tarea.taskId;
        pSql += ",'" + tarea.taskType + "'";
        pSql += ",'" + tarea.taskDate + "'";
        pSql += ",'" + tarea.scheduleFor + "'";
        pSql += ",'" + tarea.taskDate + "'";
        pSql += ",'" + tarea.assignedTo + "'";
        pSql += ",'" + tarea.assignedBy + "'";
        pSql += ",NULL";
        pSql += ",NULL";
        pSql += ",'" + tarea.expectedGps + "'";
        pSql += ",NULL";
        pSql += ",'" + tarea.taskComments + "'";
        pSql +=
          ",(SELECT COUNT(TASK_SEQ) + 1 FROM TASK WHERE TASK_TYPE = 'SALE')";
        pSql += ",'" + tarea.taskAddress + "'";
        pSql += ",'" + tarea.relatedClientCode + "'";
        pSql += ",'" + tarea.relatedClientName + "'";
        pSql += ",'" + tarea.taskStatus + "'";
        pSql += "," + tarea.isPosted;
        pSql += "," + tarea.taskId;
        pSql += ",'" + tarea.nit + "'";
        pSql += ",'" + tarea.codePriceList + "'";
        pSql += ",'" + tarea.inPlanRoute + "'";
        pSql += ")";

        tx.executeSql(pSql);
      },
      //#endregion

      //#region err func
      function(err) {
        errorCallBack(
          "Error al generar la nueva tarea para el cliente debido a: " +
            err.message
        );
      },
      //#endregion

      //#region  func
      function() {
        callBack(data);
      }
      //#endregion
    );
  },
  //#endregion

  //#region ObtenerNuevasTareasNoPosteadas func
  /**
   * Para obtener tareas creadas desde el
   * móvil
   * @param {(nuevasTareas)=>void} callBack Devuelve las nuevas tareas
   * @param {(error)=>void} errorCallBack Devuelve el error
   * @param {Tarea[]} nuevasTareas Arreglo que se utilizará para mandar las nuevas tareas
   */
  ObtenerNuevasTareasNoPosteadas: function(
    callBack,
    errorCallBack,
    nuevasTareas
  ) {
    SONDA_DB_Session.transaction(
      //#region transaction transCallback
      trans => {
        //#region sqlVar
        var sql =
          "SELECT TASK_ID, TASK_TYPE, TASK_DATE, SCHEDULE_FOR, CREATED_STAMP, " +
          "ASSIGEND_TO, ASSIGNED_BY, ACCEPTED_STAMP, COMPLETED_STAMP, EXPECTED_GPS, " +
          "POSTED_GPS, TASK_COMMENTS, TASK_SEQ, TASK_ADDRESS, RELATED_CLIENT_CODE, " +
          "RELATED_CLIENT_NAME, TASK_STATUS, IS_POSTED, TASK_BO_ID, " +
          "COMPLETED_SUCCESSFULLY, REASON, RGA_CODE, NIT, PHONE_CUSTOMER, " +
          "CODE_PRICE_LIST, IN_PLAN_ROUTE FROM TASK WHERE IS_POSTED = -1";
        //#endregion
        //#region trans.executeSql function
        trans.executeSql(
          sql,
          [],
          //#region resultsCallback
          (trans2, results) => {
            for (let x = 0; x < results.rows.length; x++) {
              var nuevaTarea = {
                taskId: results.rows.item(x).TASK_ID,
                taskType: results.rows.item(x).TASK_TYPE,
                taskDate: results.rows.item(x).TASK_DATE,
                scheduleFor: results.rows.item(x).SCHEDULE_FOR,
                createdStamp: results.rows.item(x).CREATED_STAMP,
                assignedTo: results.rows.item(x).ASSIGEND_TO,
                assignedBy: results.rows.item(x).ASSIGNED_BY,
                acceptedStamp: results.rows.item(x).ACCEPTED_STAMP,
                completedStamp: results.rows.item(x).COMPLETED_STAMP,
                expectedGps: results.rows.item(x).EXPECTED_GPS,
                postedGps: results.rows.item(x).POSTED_GPS,
                taskComments: results.rows.item(x).TASK_COMMENTS,
                taskSeq: parseInt(results.rows.item(x).TASK_SEQ),
                taskAddress: results.rows.item(x).TASK_ADDRESS,
                relatedClientCode: results.rows.item(x).RELATED_CLIENT_CODE,
                relatedClientName: results.rows.item(x).RELATED_CLIENT_NAME,
                taskStatus: results.rows.item(x).TASK_STATUS,
                taskBoId: results.rows.item(x).TASK_BO_ID,
                isPosted: results.rows.item(x).IS_POSTED,
                completedSuccessfully: results.rows.item(x)
                  .COMPLETED_SUCCESSFULLY,
                reason: results.rows.item(x).REASON,
                rgaCode: results.rows.item(x).RGA_CODE,
                nit: results.rows.item(x).NIT,
                phoneCustomer: results.rows.item(x).PHONE_CUSTOMER,
                codePriceList: results.rows.item(x).CODE_PRICE_LIST,
                inPlanRoute: results.rows.item(x).IN_PLAN_ROUTE
              };
              if (
                !nuevaTarea.completedSuccessfully ||
                nuevaTarea.completedSuccessfully === ""
              ) {
                nuevaTarea.completedSuccessfully = 0;
              }
              nuevasTareas.push(nuevaTarea);
            }
            callBack(nuevasTareas);
          },
          //#endregion
          //#region errorCallback
          (error, trans2) => {
            _enviandoNuevasTareas = false;
            if (error.code !== 0) {
              errorCallBack(trans2.message);
            }
          }
          //#endregion
        );
        //#endregion
      },
      //#endregion
      //#region transaction errorCallback
      error => {
        _enviandoNuevasTareas = false;
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
      //#endregion
    );
  },
  //#endregion

  //#region ActualizarIdTarea func
  /**
   * Actualiza el id de la tarea luego de que se sincroniza con el servidor
   * @param {number} newTaskId Id de la base de datos
   * @param {number} oldTaskId Id del móvil
   * @param {(result)=>void} callBack En caso de éxito
   * @param {(error: string)=>void} errorCallBack En caso de error
   */
  ActualizarTaskIdEnTarea: function(
    newTaskId,
    oldTaskId,
    callBack,
    errorCallBack
  ) {
    if (gTaskId) {
      if (gTaskId === oldTaskId) {
        gTaskId = newTaskId;
      }
    }

    if (gInvoiceHeader) {
      if (gInvoiceHeader.taskId === oldTaskId) {
        gInvoiceHeader.taskId = newTaskId;
      }
    }

    SONDA_DB_Session.transaction(
      trans => {
        var sql =
          "UPDATE TASK SET TASK_ID = " +
          newTaskId +
          ", TASK_BO_ID = " +
          newTaskId +
          ", IS_POSTED = 2 WHERE TASK_ID = " +
          oldTaskId;
        trans.executeSql(
          sql,
          [],
          (trans2, result) => {
            callBack(result);
          },
          (error, trans2) => {
            if (error.code !== 0) {
              errorCallBack(trans2.message);
            }
          }
        );
      },
      error => {
        _enviandoNuevasTareas = false;
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
    );
  },
  //#endregion

  //#region ActualizarIdTarea func
  /**
   * Actualiza el taskId de la factura luego de que se sincroniza con el servidor
   * @param {number} newTaskId Id de la base de datos
   * @param {number} oldTaskId Id del móvil
   * @param {(result)=>void} callBack En caso de éxito
   * @param {(error: string)=>void} errorCallBack En caso de error
   */
  ActualizarTaskIdEnFactura: function(
    newTaskId,
    oldTaskId,
    callBack,
    errorCallBack
  ) {
    SONDA_DB_Session.transaction(
      trans => {
        var sql =
          "UPDATE INVOICE_HEADER SET TASK_ID = " +
          newTaskId +
          " WHERE TASK_ID = " +
          oldTaskId;
        trans.executeSql(
          sql,
          [],
          (trans2, result) => {
            callBack(result);
          },
          (error, trans2) => {
            if (error.code !== 0) {
              errorCallBack(trans2.message);
            }
          }
        );
      },
      error => {
        _enviandoNuevasTareas = false;
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
    );
  },
  //#endregion
  /**
   * CrearTareaParaClienteConsumidorFinal
   */
  CrearTareaParaClienteConsumidorFinal: function CrearTareaParaClienteConsumidorFinal(
    nit,
    nombreDeFacturacion,
    callback,
    errorCallback
  ) {
    try {
      var nuevaTarea = new Tarea();

      nuevaTarea.taskStatus = "ASSIGNED";
      nuevaTarea.taskType = "SALE";
      nuevaTarea.taskComments = `Nueva tarea generada para el cliente ${nombreDeFacturacion}`;
      nuevaTarea.isPosted = -1;
      nuevaTarea.acceptedStamp = null;
      nuevaTarea.postedGps = null;
      nuevaTarea.createdStamp = getDateTime();
      nuevaTarea.taskDate = getDateTime();
      nuevaTarea.scheduleFor = getDateTime();
      nuevaTarea.inPlanRoute = 0;
      nuevaTarea.department = "N/A";
      nuevaTarea.municipality = "N/A";
      nuevaTarea.assignedTo = gLastLogin;
      nuevaTarea.assignedBy = gLastLogin;
      nuevaTarea.phoneCustomer = null;
      nuevaTarea.relatedClientCode = "C000000";
      nuevaTarea.relatedClientName = nombreDeFacturacion;
      nuevaTarea.nit = nit;
      nuevaTarea.taskAddress = "...";
      nuevaTarea.rgaCode = null;
      nuevaTarea.completedSuccessfully = 0;
      nuevaTarea.reason = null;
      nuevaTarea.codePriceList = localStorage.getItem("gDefaultPriceList");
      nuevaTarea.expectedGps = gCurrentGPS;

      var controlDeSecuenciaServicio = new ControlDeSecuenciaServicio();

      controlDeSecuenciaServicio.obtenerSiguienteNumeroDeSecuenciaDeControl(
        TiposDeSecuenciaAControlar.NuevaTarea,
        function(controlDeSecuencia) {
          nuevaTarea.taskId = controlDeSecuencia.NEXT_VALUE;
          nuevaTarea.taskBoId = controlDeSecuencia.NEXT_VALUE;
          TareaServicio.crearNuevaTarea(
            nuevaTarea,
            function() {
              controlDeSecuenciaServicio.actualizarSecuenciaDeControl(
                controlDeSecuencia,
                function() {
                  callback(nuevaTarea);
                },
                function(resultado) {
                  errorCallback(resultado.mensaje);
                }
              );
            },
            function(resultado) {
              errorCallback(resultado.mensaje);
            }
          );
        },
        function(resultado) {
          errorCallback(resultado.mensaje);
        }
      );
    } catch (error) {
      errorCallback(
        "Error al crear la tarea para el cliente " +
          nombreDeFacturacion +
          " debido a: " +
          error.message
      );
    }
  }
};
