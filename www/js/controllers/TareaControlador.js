var TareaControlador = (function() {
  function TareaControlador() {}

  TareaControlador.prototype.delegarTareaControlador = function() {
    var _this = this;

    $("#UiBtnActualizarPlanDeRuta").on("click", function() {
      InteraccionConUsuarioServicio.bloquearPantalla();
      TareaServicio.recalcularSecuenciaDeTareas(function() {
        var mensaje = "Plan actualizado exitosamente.";
        if (gIsOnline === SiNo.No) {
          mensaje +=
            " No se actualizará el plan de ruta en el servidor por falta de conexión";
        }
        notify(mensaje);
        EnviarData();
        _this.UsuarioDeseaObtenerTareasPorEstado(
          "'" + TareaEstado.Asignada + "','" + TareaEstado.Aceptada + "'",
          function(listaTareas) {
            _this.CrearListadoDeTareas(listaTareas, function() {
              InteraccionConUsuarioServicio.desbloquearPantalla();
            });
          },
          function(error) {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify(error);
          }
        );
      });
    });

    $("#UiBtnScanRgaCode").on("click", function() {
      window.estaEnEscaneoDeRga = true;
      var codigoRgaTxt = $("#uiTxtFiltroClientes");
      _this.UsuarioDeseaEscanearCodigoRga(
        function(codigoRga) {
          window.estaEnEscaneoDeRga = false;
          console.log(codigoRga);
          _this.UsuarioDeseaObtenerTareasPorCodigoRga(
            codigoRga,
            function(listaTareas) {
              if (listaTareas.length === 1) {
                _this.CrearListadoDeTareas(listaTareas, function() {
                  codigoRgaTxt.val("");
                  codigoRgaTxt = null;
                  if (_this.EsTareaDeVenta(listaTareas[0])) {
                    InvoiceThisTask(
                      listaTareas[0].TASK_ID,
                      listaTareas[0].RELATED_CLIENT_CODE,
                      listaTareas[0].RELATED_CLIENT_NAME,
                      listaTareas[0].NIT,
                      listaTareas[0].TASK_TYPE
                    );
                  }
                });
              } else if (listaTareas.length > 1) {
                _this.CrearListadoDeTareas(listaTareas, function() {
                  ToastThis("Se encontró más de un registro...");
                });
              } else if (listaTareas.length === 0) {
                notify("No se encontraron clientes para el filtro aplicado");
                _this.UsuarioDeseaObtenerTareasPorEstado(
                  "'" +
                    TareaEstado.Asignada +
                    "','" +
                    TareaEstado.Aceptada +
                    "'",
                  function(listaTareas) {
                    _this.CrearListadoDeTareas(listaTareas, function() {});
                  },
                  function(error) {
                    codigoRgaTxt.val("");
                    codigoRgaTxt = null;
                    notify(error);
                  }
                );
              }
            },
            function(error) {
              codigoRgaTxt.val("");
              codigoRgaTxt = null;
              notify(error);
            }
          );
        },
        function() {
          _this.UsuarioDeseaObtenerTareasPorEstado(
            "'" + TareaEstado.Asignada + "','" + TareaEstado.Aceptada + "'",
            function(listaTareas) {
              _this.CrearListadoDeTareas(listaTareas, function() {
                //..
              });
            },
            function(error) {
              codigoRgaTxt.val("");
              codigoRgaTxt = null;
              notify(error);
            }
          );
        },
        function(error) {
          codigoRgaTxt.val("");
          codigoRgaTxt = null;
          notify(error);
        }
      );
    });

    $("#UiBtnMostrarTareasAsignadas").on("click", function() {
      _this.UsuarioDeseaObtenerTareasPorEstado(
        "'" + TareaEstado.Asignada + "','" + TareaEstado.Aceptada + "'",
        function(listaTareas) {
          _this.CrearListadoDeTareas(listaTareas, function() {
            //..
          });
        },
        function(error) {
          notify(error);
        }
      );
    });

    $("#UiBtnMostrarTareasCompletadas").on("click", function() {
      _this.UsuarioDeseaObtenerTareasPorEstado(
        "'" + TareaEstado.Completada + "'",
        function(listaTareas) {
          _this.CrearListadoDeTareas(listaTareas, function() {
            //..
          });
        },
        function(error) {
          notify(error);
        }
      );
    });

    $("#uiTxtFiltroClientes").on("keyup", function(e) {
      if (e.keyCode === 13) {
        var codigoRga = $("#uiTxtFiltroClientes");
        if (codigoRga.val() === "" || codigoRga.val() === " ") {
          notify("El campo de filtro no debe estar vacio...");
          codigoRga.focus();
        } else {
          _this.UsuarioDeseaObtenerTareasPorCodigoRga(
            codigoRga.val(),
            function(listaTareas) {
              if (listaTareas.length === 1) {
                _this.CrearListadoDeTareas(listaTareas, function() {
                  codigoRga.val("");
                  if (_this.EsTareaDeVenta(listaTareas[0])) {
                    InvoiceThisTask(
                      listaTareas[0].TASK_ID,
                      listaTareas[0].RELATED_CLIENT_CODE,
                      listaTareas[0].RELATED_CLIENT_NAME,
                      listaTareas[0].NIT,
                      listaTareas[0].TASK_TYPE
                    );
                  }
                });
              } else if (listaTareas.length > 1) {
                _this.CrearListadoDeTareas(listaTareas, function() {
                  ToastThis("Se encontró más de un registro...");
                });
              } else if (listaTareas.length === 0) {
                notify("No se encontraron clientes para el filtro aplicado");
                _this.UsuarioDeseaObtenerTareasPorEstado(
                  "'" +
                    TareaEstado.Asignada +
                    "','" +
                    TareaEstado.Aceptada +
                    "'",
                  function(listaTareas) {
                    _this.CrearListadoDeTareas(listaTareas, function() {
                      //..
                    });
                  },
                  function(error) {
                    notify(error);
                  }
                );
              }
            },
            function(error) {
              notify(error);
            }
          );
        }
      }
    });
  };

  TareaControlador.prototype.EsTareaDeVenta = function(tarea) {
    // ReSharper disable once CoercedEqualsUsing
    return tarea.TASK_TYPE == TareaTipo.Venta;
  };

  TareaControlador.prototype.CrearListadoDeTareas = function(
    listaTareas,
    callBack
  ) {
    try {
      var este = this;
      var objetoListaTareas = $("#skus_listview_sales_route");
      objetoListaTareas.children().remove("li");

      var listadoDeTareasDeVenta = listaTareas.filter(function(tareaVenta) {
        return tareaVenta.TASK_TYPE == TareaTipo.Venta;
      });

      var listadoDeTareasDeEntrega = listaTareas.filter(function(tareaEntrega) {
        return tareaEntrega.TASK_TYPE == TareaTipo.Entrega;
      });

      var li = "";
      for (var i = 0; i < listadoDeTareasDeVenta.length; i++) {
        var tarea = listadoDeTareasDeVenta[i];
        var xonclick1 = "";

        if (este.EsPrimeraIteracion(i)) {
          li += '<li data-role="list-divider">De Venta</li>';
        }

        if (!este.VerificarSiTraeGps(tarea)) {
          xonclick1 = "notify('No hay punto GPS');";
          li +=
            '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-forbidden">';
        } else {
          xonclick1 = "TaskNavigateTo('" + tarea.EXPECTED_GPS + "',null);";
          li +=
            '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-navigation">';
        }

        var xonclick2 =
          "gTaskOnRoutePlan = 1; InvoiceThisTask(" +
          tarea.TASK_ID +
          ",'" +
          tarea.RELATED_CLIENT_CODE +
          "','" +
          tarea.RELATED_CLIENT_NAME +
          "','" +
          tarea.NIT +
          "','" +
          tarea.TASK_TYPE +
          "','" +
          tarea.TASK_STATUS +
          "');";

        li +=
          '<a href="#" onclick="' +
          xonclick2 +
          '" id="' +
          "TA_" +
          tarea.TASK_ID +
          '">';
        li += "<h2>";
        li += '<span class="small-roboto">';
        li += i + 1 + ")</span>&nbsp";
        li +=
          '<span class="small-roboto">' +
          tarea.RELATED_CLIENT_CODE +
          "</span><br>";
        li +=
          '<span class="small-roboto">' + tarea.RELATED_CLIENT_NAME + "</span>";
        li += "</h2>";
        li += "<p>" + tarea.TASK_ADDRESS + "</p>";
        li += "<p style='display: none'>" + tarea.RGA_CODE + "</p>";
        if (tarea.BUY_TYPE === "Crédito") {
          li +=
            "<p>" +
            tarea.BUY_TYPE +
            ": " +
            window.accounting.formatMoney(
              tarea.CURRENT_BALANCE - tarea.CREDIT_AMOUNT
            ) +
            "</p>";
        } else {
          li += "<p>" + tarea.BUY_TYPE + "</p>";
        }
        li += "</a>";
        li += '<a href="#" onclick="' + xonclick1 + '">';
        li += "</a>";
        li += "</li>";

        xonclick1 = null;
        xonclick2 = null;
        tarea = null;
      }

      for (var j = 0; j < listadoDeTareasDeEntrega.length; j++) {
        var tareaEntrega = listadoDeTareasDeEntrega[j];
        var onClick = "";

        if (este.EsPrimeraIteracion(j)) {
          li += '<li data-role="list-divider">De Entrega</li>';
        }

        if (!este.VerificarSiTraeGps(tareaEntrega)) {
          onClick = "notify('No hay punto GPS');";
          li +=
            '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-forbidden">';
        } else {
          onClick = "TaskNavigateTo('" + tareaEntrega.EXPECTED_GPS + "',null);";
          li +=
            '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-navigation">';
        }

        var deliveryTaskClick =
          "gTaskOnRoutePlan = 1; InvoiceThisTask(" +
          tareaEntrega.TASK_ID +
          ",'" +
          tareaEntrega.RELATED_CLIENT_CODE +
          "','" +
          tareaEntrega.RELATED_CLIENT_NAME +
          "','" +
          tareaEntrega.NIT +
          "','" +
          tareaEntrega.TASK_TYPE +
          "');";

        li +=
          '<a href="#" onclick="' +
          deliveryTaskClick +
          '" id="' +
          "TA_" +
          tareaEntrega.TASK_ID +
          '">';
        li += "<h2>";
        li += '<span class="small-roboto">';
        li += j + 1 + ")</span>&nbsp";
        li +=
          '<span class="small-roboto">' +
          tareaEntrega.RELATED_CLIENT_CODE +
          "</span><br>";
        li +=
          '<span class="small-roboto">' +
          tareaEntrega.RELATED_CLIENT_NAME +
          "</span>";
        li += "</h2>";
        li += "<p>" + tareaEntrega.TASK_ADDRESS + "</p>";
        li += "<p style='display: none'>" + tareaEntrega.RGA_CODE + "</p>";
        li += "</a>";
        li += '<a href="#" onclick="' + onClick + '">';
        li += "</a>";
        li += "</li>";

        onClick = null;
        tareaEntrega = null;
      }

      if (li !== "") {
        //TODO: Validar si es necesario el refresh.
        objetoListaTareas.append(li);
        objetoListaTareas.listview("refresh");
      }
      li = null;
      objetoListaTareas = null;
      document.getElementById("lblClientsToVisit").innerText =
        "Plan de ruta (" +
        este.ObtenerCantidadTotalDeTareas(
          listadoDeTareasDeEntrega,
          listadoDeTareasDeVenta
        ) +
        ")";
      callBack();
    } catch (e) {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify("Error al crear el listado de tareas debido a: " + e.message);
    }
  };

  TareaControlador.prototype.EsPrimeraIteracion = function(numeroDeIteracion) {
    // ReSharper disable once CoercedEqualsUsing
    return numeroDeIteracion == 0;
  };

  TareaControlador.prototype.VerificarSiTraeGps = function(tarea) {
    // ReSharper disable once CoercedEqualsUsing
    return tarea.EXPECTED_GPS != "0,0";
  };

  TareaControlador.prototype.ObtenerCantidadTotalDeTareas = function(
    tareasDeVenta,
    tareasDeEntrega
  ) {
    return tareasDeVenta.length + tareasDeEntrega.length;
  };

  TareaControlador.prototype.UsuarioDeseaObtenerTareasPorEstado = function(
    status,
    callBack,
    errorCallBack
  ) {
    TareaServicio.ObtenerTareasPorStatus(
      status,
      null,
      function(listaTareas) {
        callBack(listaTareas);
      },
      function(error) {
        errorCallBack(error);
      }
    );
  };

  TareaControlador.prototype.UsuarioDeseaEscanearCodigoRga = function(
    callBack,
    returnCallBack,
    errorCallBack
  ) {
    try {
      cordova.plugins.barcodeScanner.scan(
        function(result) {
          if (!result.cancelled) {
            $("#uiTxtFiltroClientes").text(result.text);
            callBack(result.text);
          } else {
            returnCallBack();
          }
        },
        function(error) {
          console.log(
            "Error al intentar leer el codigo RGA del cliente debido a: " +
              error
          );
          errorCallBack(
            "Error al intentar leer el codigo RGA del cliente debido a: " +
              error
          );
        }
      );
    } catch (e) {
      console.log(
        "Error al intentar leer el codigo RGA del cliente debido a: " +
          e.message
      );
      errorCallBack(
        "Error al intentar leer el codigo RGA del cliente debido a: " +
          e.message
      );
    }
  };

  TareaControlador.prototype.UsuarioDeseaObtenerTareasPorCodigoRga = function(
    codigoRga,
    callBack,
    errorCallBack
  ) {
    TareaServicio.ObtenerTareasPorCodigoRga(
      codigoRga,
      function(listaTareas) {
        callBack(listaTareas);
      },
      function(error) {
        errorCallBack(error);
      }
    );
  };
  //#region DelegarSocketsDeTareaControlador funct
  /**
   * Función para recibir data del servidor
   * @param {socket} socket Socket para comunicarse con el servidor
   */
  TareaControlador.prototype.DelegarSocketsDeTareaControlador = function(
    socket
  ) {
    socket.on("InsertNewTasksSD_Response", data => {
      switch (data.option) {
        case "InsertNewTasksSD_Success":
          console.log(data.data);
          data.data.forEach(tarea => {
            TareaServicio.ActualizarTaskIdEnTarea(
              tarea.taskId,
              tarea.taskIdHh,
              () => {
                TareaServicio.ActualizarTaskIdEnFactura(
                  tarea.taskId,
                  tarea.taskIdHh,
                  () => {},
                  error => {
                    notify(
                      "No se pudo actualizar factura en el móvil debido a:" +
                        error
                    );
                  }
                );
              },
              error => {
                notify(
                  "No se pudo actualizar tarea en el móvil debido a:" + error
                );
              }
            );
          });
          break;
        case "InsertNewTasksSD_Error":
          notify("No se han podido sincronizar tareas debido a: " + data.error);
          break;
      }
    });
  };
  //#endregion
  return TareaControlador;
})();
