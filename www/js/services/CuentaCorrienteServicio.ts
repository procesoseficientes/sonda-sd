class CuentaCorrienteServicio implements ICuentaCorrienteServicio {
  agregarFacturaVencidaDeCliente(data: any): void {
    let facturaVencida: FacturaVencidaDeCliente = new FacturaVencidaDeCliente();
    facturaVencida.id = data.ID;
    facturaVencida.invoiceId = data.INVOICE_ID;
    facturaVencida.docEntry = data.DOC_ENTRY;
    facturaVencida.codeCustomer = data.CODE_CUSTOMER;
    facturaVencida.createdDate = data.CREATED_DATE;
    facturaVencida.dueDate = data.DUE_DATE;
    facturaVencida.totalAmount = data.TOTAL_AMOUNT;
    facturaVencida.pendingToPaid = data.PENDING_TO_PAID;
    facturaVencida.isExpired = data.IS_EXPIRED;

    let sql: Array<string> = [];

    sql.push(`INSERT INTO OVERDUE_INVOICE_BY_CUSTOMER(`);
    sql.push(
      `ID,INVOICE_ID,DOC_ENTRY,CODE_CUSTOMER,CREATED_DATE,DUE_DATE,TOTAL_AMOUNT,PENDING_TO_PAID,IS_EXPIRED)`
    );
    sql.push(`VALUES(`);
    sql.push(`${facturaVencida.id}`);
    sql.push(`,'${facturaVencida.invoiceId}'`);
    sql.push(`,'${facturaVencida.docEntry}'`);
    sql.push(`,'${facturaVencida.codeCustomer}'`);
    sql.push(`,'${facturaVencida.createdDate}'`);
    sql.push(`,'${facturaVencida.dueDate}'`);
    sql.push(`,${facturaVencida.totalAmount}`);
    sql.push(`,${facturaVencida.pendingToPaid}`);
    sql.push(`,${facturaVencida.isExpired}`);
    sql.push(`)`);

    gInsertsInitialRoute.push(sql.join(""));

    sql = null;
  }

  obtenerFacturasVencidasDeCliente(
    cliente: Cliente,
    callback: (facturasVencidas: FacturaVencidaDeCliente[]) => void,
    errorCallback: (resultado: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          let sql: Array<string> = [];

          sql.push(
// tslint:disable-next-line: max-line-length
            `SELECT ID,INVOICE_ID,DOC_ENTRY,CODE_CUSTOMER,(SELECT datetime(CREATED_DATE)) as CREATED_DATE,(SELECT datetime(DUE_DATE)) as DUE_DATE,TOTAL_AMOUNT,PENDING_TO_PAID `
          );
          sql.push(`FROM OVERDUE_INVOICE_BY_CUSTOMER `);
          if (cliente.paymentType === TipoDePagoDeFactura.FacturaVencida) {
            sql.push(
              `WHERE CODE_CUSTOMER = '${
                cliente.clientId
              }' AND PENDING_TO_PAID > 0 AND IS_EXPIRED = 1 ORDER BY DUE_DATE ASC`
            );
          } else {
            sql.push(
              `WHERE CODE_CUSTOMER = '${
                cliente.clientId
              }' AND PENDING_TO_PAID > 0 ORDER BY DUE_DATE ASC`
            );
          }

          trans.executeSql(
            sql.join(""),
            [],
            (transReturn: SqlTransaction, results: SqlResultSet) => {
              let facturasDeCliente: Array<FacturaVencidaDeCliente> = [];

              for (let i: number = 0; i < results.rows.length; i++) {
                let factura: any = results.rows.item(i);
                let facturaVencida: FacturaVencidaDeCliente = new FacturaVencidaDeCliente();

                facturaVencida.id = factura.ID;
                facturaVencida.invoiceId = factura.INVOICE_ID;
                facturaVencida.docEntry = factura.DOC_ENTRY;
                facturaVencida.codeCustomer = factura.CODE_CUSTOMER;
                facturaVencida.createdDate = factura.CREATED_DATE;
                facturaVencida.dueDate = factura.DUE_DATE;
                facturaVencida.totalAmount = factura.TOTAL_AMOUNT;
                facturaVencida.pendingToPaid = factura.PENDING_TO_PAID;

                facturasDeCliente.push(facturaVencida);
              }
              callback(facturasDeCliente);
            },
            (transReturn: SqlTransaction, errorTrans: SqlError) => {
              errorCallback({
                codigo: errorTrans.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: errorTrans.message
              } as Operacion);
            }
          );
        },
        (error: SqlError) => {
          errorCallback({
            codigo: error.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error.message
          } as Operacion);
        }
      );
    } catch (error) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: error.message
      } as Operacion);
    }
  }

  obtenerCuentaCorrienteDeCliente(
    cliente: Cliente,
    callback: (cuentaCorriente: CuentaCorrienteDeCliente) => void,
    errorCallback: (resultado: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.readTransaction(
        (trans: SqlTransaction) => {
          let sql: Array<string> = [];

          sql.push(
            `SELECT CLIENT_ID AS CODE_CUSTOMER, GROUP_NUM, CREDIT_LIMIT, OUTSTANDING_BALANCE, EXTRADAYS`
          );
          sql.push(`FROM CLIENTS`);
          sql.push(`WHERE CLIENT_ID = '${cliente.clientId}'`);

          trans.executeSql(
            sql.join(" "),
            [],
            (transReturn: SqlTransaction, results: SqlResultSet) => {
              let cuentaCorriente: CuentaCorrienteDeCliente = new CuentaCorrienteDeCliente();
              if (results.rows.length > 0) {
                let cuenta: any = results.rows.item(0);
                cuentaCorriente.codeCustomer = cuenta.CODE_CUSTOMER;
                cuentaCorriente.groupNum = cuenta.GROUP_NUM;
                cuentaCorriente.creditLimit = cuenta.CREDIT_LIMIT;
                cuentaCorriente.outstandingBalance = cuenta.OUTSTANDING_BALANCE;
                cuentaCorriente.extraDays = cuenta.EXTRADAYS;
              }

              callback(cuentaCorriente);
            },
            (transReturn: SqlTransaction, errorTrans: SqlError) => {
              errorCallback({
                codigo: errorTrans.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: errorTrans.message
              } as Operacion);
            }
          );
        },
        (error: SqlError) => {
          errorCallback({
            codigo: error.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error.message
          } as Operacion);
        }
      );
    } catch (error) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: error.message
      } as Operacion);
    }
  }

  obtenerSumatoriaTotalDeFacturasEnRutaDeCliente(
    cliente: Cliente,
    callback: (cliente: Cliente) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          let sql: Array<string> = [];

          sql.push("SELECT IFNULL(SUM(TOTAL_AMOUNT),0) AS TOTAL_FACTURADO");
          sql.push(" FROM INVOICE_HEADER WHERE VOID_INVOICE_ID IS NULL");
          sql.push(` AND CLIENT_ID = '${cliente.clientId}'`);
          sql.push(` AND IFNULL(CREDIT_AMOUNT,0) > 0`);

          trans.executeSql(
            sql.join(""),
            [],
            (transReturn, results) => {
              cliente.currentAccountingInformation.currentAmountOnCredit = (results.rows.item(
                0
              ) as any).TOTAL_FACTURADO;
              cliente.currentAccountingInformation.outstandingBalance -=
                cliente.currentAccountingInformation.currentAmountOnCredit;
              callback(cliente);
            },
            (transReturn, error) => {
              errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
              } as Operacion);
            }
          );
        },
        (error: SqlError) => {
          errorCallback({
            codigo: error.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error.message
          } as Operacion);
        }
      );
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
    }
  }

  procesarInformacionDeCuentaCorrienteDeCliente(
    codigoDeCliente: string,
    callbak: (cliente: Cliente) => void,
    errorCallback: (resultado: Operacion) => void
  ): void {
    try {
      let cliente: Cliente = new Cliente();
      cliente.clientId = codigoDeCliente;

      this.obtenerCuentaCorrienteDeCliente(
        cliente,
        cuentaCorrienteDeCliente => {
          cliente.currentAccountingInformation = cuentaCorrienteDeCliente;
          this.obtenerSumatoriaTotalDeFacturasEnRutaDeCliente(
            cliente,
            clienteConMontoDeFacturasDelDiaActual => {
              // tslint:disable-next-line: max-line-length
              clienteConMontoDeFacturasDelDiaActual.canBuyOnCredit = this.verificarSiElClienteTieneLimiteDeCreditoYDiasDeCreditoConfigurados(
                clienteConMontoDeFacturasDelDiaActual
              );
              if (clienteConMontoDeFacturasDelDiaActual.canBuyOnCredit) {
                this.obtenerFechaDeVencimientoDeFacturaEnBaseADiasDeCreditoDelCliente(
                  clienteConMontoDeFacturasDelDiaActual,
                  clienteCompleto => {
                    callbak(clienteCompleto);
                  },
                  error => {
                    errorCallback({
                      codigo: error.codigo,
                      resultado: error.resultado,
                      mensaje: error.mensaje
                    } as Operacion);
                  }
                );
              } else {
                callbak(clienteConMontoDeFacturasDelDiaActual);
              }
            },
            error => {
              errorCallback({
                codigo: error.codigo,
                resultado: error.resultado,
                mensaje:
                  "Error al intentar obtener las facturas del d�a para el cliente."
              } as Operacion);
            }
          );
        },
        error => {
          errorCallback({
            codigo: error.codigo,
            resultado: error.resultado,
            mensaje:
              "Error al intentar obtener la cuenta corriente del cliente."
          } as Operacion);
        }
      );
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje:
          "Error al intentar procesar la informaci�n de cuenta corriente del cliente."
      } as Operacion);
    }
  }

  verificarSiElClienteTieneLimiteDeCreditoYDiasDeCreditoConfigurados(
    cliente: Cliente
  ): boolean {
    return (
      cliente.currentAccountingInformation.extraDays > 0 &&
      cliente.currentAccountingInformation.creditLimit > 0
    );
  }

  verificarSiElLimiteDeCreditoDelClienteNoHaSidoSobrepasadoPorElMontoFacturadoEnElDia(
    cliente: Cliente
  ): boolean {
    return cliente.currentAccountingInformation.outstandingBalance > 0;
  }

  obtenerFechaDeVencimientoDeFacturaEnBaseADiasDeCreditoDelCliente(
    cliente: Cliente,
    callback: (cliente: Cliente) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          let sql: string = `SELECT DateTime('Now', 'LocalTime', '+${
            cliente.currentAccountingInformation.extraDays
          } Day') AS INVOICE_DUE_DATE`;

          trans.executeSql(
            sql,
            [],
            (transResult: SqlTransaction, results: SqlResultSet) => {
              cliente.invoiceDueDate = (results.rows.item(
                0
              ) as any).INVOICE_DUE_DATE;
              callback(cliente);
            },
            (transResult: SqlTransaction, error: SqlError) => {
              errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje:
                  "Error al intentar calcular la fecha de vencimiento de la factura."
              } as Operacion);
            }
          );
        },
        (error: SqlError) => {
          errorCallback({
            codigo: error.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje:
              "Error al intentar obtener la fecha de vencimiento de la factura."
          } as Operacion);
        }
      );
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje:
          "Error al intentar obtener la fecha de vencimiento de la factura."
      } as Operacion);
    }
  }

  obtenerSumatoriaDePagosRealizadosPorClienteDuranteElDia(
    cliente: Cliente,
    callback: (cliente: Cliente) => void,
    errorCallback: (resultado: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          let sql: Array<string> = [];

          sql.push(
            `SELECT IFNULL(SUM(IFNULL(PAYMENT_AMOUNT,0)), 0) AS TOTAL_AMOUNT_PAYED`
          );
          sql.push(`FROM OVERDUE_INVOICE_PAYMENT_HEADER`);
          sql.push(
            `WHERE CODE_CUSTOMER = '${
              cliente.clientId
            }' AND PAYMENT_APPLIED_TO = '${cliente.paymentType}'`
          );

          trans.executeSql(
            sql.join(" "),
            [],
            (transResult: SqlTransaction, results: SqlResultSet) => {
              cliente.totalAmountPayedOfOverdueInvoices = parseFloat(
                (results.rows.item(0) as any).TOTAL_AMOUNT_PAYED
              );
              callback(cliente);
            },
            (transResult: SqlTransaction, error: SqlError) => {
              errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
              } as Operacion);
            }
          );
        },
        (error: SqlError) => {
          errorCallback({
            codigo: error.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error.message
          } as Operacion);
        }
      );
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
    }
  }

  obtenerSumatoriaTotalDeFacturasAbiertas(
    cliente: Cliente,
    callback: (sumatoriaDeFacturasAbiertas: number) => void,
    errorCallback: (resultado: Operacion) => void
  ) {
    try {
      var sumaDeFacturasAbiertas: number = 0;

      cliente.overdueInvoices.forEach((factura, _idx, _invoices) => {
        sumaDeFacturasAbiertas += factura.pendingToPaid;
      });
      callback(sumaDeFacturasAbiertas);
    } catch (error) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: error.message
      } as Operacion);
    }
  }

  clienteTieneFacturasAbiertasOVencidas(
    facturasVencidas: FacturaVencidaDeCliente[]
  ): boolean {
    return facturasVencidas && facturasVencidas.length > 0;
  }
}
