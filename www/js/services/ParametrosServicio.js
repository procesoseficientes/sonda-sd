var ParametroServicio = {
  delegarSockets: function(socketIo) {
    socketIo.on("send_parameter_from_bo", function(data) {
      switch (data.option) {
        case "send_parameter_from_bo_received":
          ParametroServicio.LimpiarTablaDeParametros();
          break;

        case "send_parameter_from_bo_fail":
          ParametroServicio.MostrarError(data.message);
          break;
        case "send_parameter_from_bo_not_found":
          ParametroServicio.MostrarError(
            "No se encontraron parametros para CONSIGNACION, por favor, contacte a su Administrador"
          );
          break;
        case "send_parameter_from_bo_add_row":
          ParametroServicio.InsertarParametro(data.row);
          break;
        case "send_parameter_from_bo_complete":
          // ToastThis("Recepción de parámetros completada...");
          break;
        case "add_GetInvoiceParameter":
          if (data.row.PARAMETER_ID === "PRINT_FORMAT") {
            localStorage.setItem("PRINT_FORMAT", data.row.VALUE);
          }

          if (data.row.PARAMETER_ID == "METHOD_CALCULATION_TAX") {
            localStorage.setItem("METHOD_CALCULATION_TAX", data.row.VALUE);
          }
          ParametroServicio.InsertarParametro(data.row);
          break;
        case "not_found_GetInvoiceParameter":
          ParametroServicio.MostrarError(
            "No se encontraron parametros para FORMATO DE IMPRESION, por favor, contacte a su Administrador"
          );
          break;
        case "GetInvoiceParameter_completed":
          //   ToastThis("Recepción de parámetros completada...");
          break;
        case "not_found_GetDeliveryParameter":
          ParametroServicio.MostrarError(
            "No se encontraron parametros para ENTREGA, por favor, contacte a su Administrador"
          );
          break;
        case "add_GetDeliveryParameter":
          ParametroServicio.InsertarParametro(data.row);
          if (data.inLogin) {
            var menuControlador = new MenuControlador();
            if (data.row.PARAMETER_ID === ConfiguracionSondaSd.EntregaEnRuta) {
              localStorage.setItem("DELIVERY_IN_ROUTE", data.row.VALUE);
            }
            if (data.row.PARAMETER_ID === ConfiguracionSondaSd.FacturaEnRuta) {
              localStorage.setItem("INVOICE_IN_ROUTE", data.row.VALUE);
            }
            var invoiceInRoute =
              localStorage.getItem("INVOICE_IN_ROUTE") == "1";
            var deliveryInRoute =
              localStorage.getItem("DELIVERY_IN_ROUTE") == "1";
            menuControlador.mostrarUOcultarOpcionesDeFacturacionYEntrega(
              invoiceInRoute,
              deliveryInRoute,
              function() {}
            );
          }
          break;
        case "GetDeliveryParameter_completed":
          break;
        case "not_found_GetFelCertifierParameter":
          ParametroServicio.MostrarError(
            "No se encontraron parametros para CERTIFICADOR FEL, por favor, contacte a su Administrador"
          );
          break;
        case "add_GetFelCertifierParameter":
          localStorage.setItem(data.row.PARAMETER_ID, data.row.VALUE);
          break;
        case "GetFelCertifierParameter_completed":
          ToastThis("Recepción de parámetros completada");
          break;
      }
    });
  },
  InsertarParametro: function(parametro) {
    try {
      if (parametro !== undefined) {
        SONDA_DB_Session.transaction(
          function(tx) {
            var sql =
              "INSERT INTO PARAMETERS(IDENTITY,GROUP_ID,PARAMETER_ID,VALUE) VALUES(" +
              parametro.IDENTITY +
              ",'" +
              parametro.GROUP_ID +
              "', '" +
              parametro.PARAMETER_ID +
              "','" +
              parametro.VALUE +
              "')";
            tx.executeSql(sql);
          },
          function(err) {
            if (err.code !== 0) {
              notify(
                "No se pudo insertar el parametro debido a: " + err.message
              );
            }
          }
        );
      }
    } catch (e) {
      notify(e.message);
    }
  },
  MostrarError: function(error) {
    try {
      notify(error);
    } catch (e) {
      notify(e.message);
    }
  },
  LimpiarTablaDeParametros: function() {
    try {
      SONDA_DB_Session.transaction(
        function(tx) {
          var sql = "DELETE FROM PARAMETERS";
          tx.executeSql(sql);
        },
        function(err) {
          if (err.code !== 0) {
            notify(
              "No se pudo limpiar la tabla de Parametros debido a: " +
                err.message
            );
          }
        }
      );
    } catch (e) {
      notify(e.message);
    }
  },
  ObtenerGrupoDeParametros: function(grupoDeParametro, callback, errCallback) {
    try {
      SONDA_DB_Session.transaction(
        function(tx) {
          var sql = "SELECT IDENTITY, GROUP_ID, PARAMETER_ID, VALUE";
          sql += " FROM PARAMETERS ";
          sql += " WHERE GROUP_ID = '" + grupoDeParametro + "'";

          tx.executeSql(
            sql,
            [],
            function(tx, results) {
              var parametros = [];
              for (var i = 0; i < results.rows.length; i++) {
                var parametro = {
                  Identity: results.rows.item(i).IDENTITY,
                  GroupId: results.rows.item(i).GROUP_ID,
                  ParameterId: results.rows.item(i).PARAMETER_ID,
                  Value: results.rows.item(i).VALUE
                };
                parametros.push(parametro);
              }
              callback(parametros);
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
      notify(e.message);
    }
  },
  ObtenerParametro: function(
    grupoDeParametro,
    idParametro,
    callback,
    errCallback
  ) {
    try {
      SONDA_DB_Session.transaction(
        function(tx) {
          var sql = "SELECT IDENTITY, GROUP_ID, PARAMETER_ID, VALUE";
          sql += " FROM PARAMETERS ";
          sql += " WHERE GROUP_ID = '" + grupoDeParametro + "'";
          sql += " AND PARAMETER_ID = '" + idParametro + "'";

          tx.executeSql(
            sql,
            [],
            function(tx, results) {
              if (results.rows.length > 0) {
                var parametro = {
                  Identity: results.rows.item(0).IDENTITY,
                  GroupId: results.rows.item(0).GROUP_ID,
                  ParameterId: results.rows.item(0).PARAMETER_ID,
                  Value: results.rows.item(0).VALUE
                };
                callback(parametro);
              } else {
                errCallback({
                  message:
                    "No se ha podido encontrar el parámetro: " + idParametro
                });
              }
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
      notify(e.message);
    }
  }
};
