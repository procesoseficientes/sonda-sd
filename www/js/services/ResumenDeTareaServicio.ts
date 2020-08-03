class ResumenDeTareaServicio implements IResumenDeTareaServicio {
  /**
     * obtenerFacturaPorIdentificadorDeTarea
identificadorDeTarea: number     */
  public obtenerFacturaPorIdentificadorDeTarea(
    identificadorDeTarea: number,
    callback: (factura: FacturaEncabezado) => void,
    errorCallback: (resultado: Operacion) => void
  ) {
    let sql: Array<string> = [];
    sql.push(`SELECT`);
    sql.push(`INVOICE_NUM, TERMS, POSTED_DATETIME, CLIENT_ID,`);
    sql.push(`CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT,`);
    sql.push(`ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE,`);
    sql.push(`VOID_REASON, VOID_NOTES, VOID_INVOICE_ID,`);
    sql.push(`PRINT_REQUEST, PRINTED_COUNT, AUTH_ID,`);
    sql.push(`SAT_SERIE, CHANGE, IMG1, IMG2, IMG3,`);
    sql.push(`CONSIGNMENT_ID, IS_PAID_CONSIGNMENT,`);
    sql.push(`INITIAL_TASK_IMAGE, IN_ROUTE_PLAN,`);
    sql.push(`ID_BO, IS_POSTED_VALIDATED, DETAIL_QTY,HANDLE_TAX, TAX_PERCENT,`);
    sql.push(`TELEPHONE_NUMBER, IS_FROM_DELIVERY_NOTE, DISCOUNT,`);
    sql.push(`COMMENT, DUE_DATE, CREDIT_AMOUNT,`);
    sql.push(`CASH_AMOUNT, PAID_TO_DATE, TASK_ID, GOAL_HEADER_ID`);
    sql.push(`FROM INVOICE_HEADER`);
    sql.push(`WHERE TASK_ID = ${identificadorDeTarea}`);

    SONDA_DB_Session.transaction(
      (transaccion: SqlTransaction) => {
        transaccion.executeSql(
          sql.join(" "),
          [],
          (_transaccionRetorno: SqlTransaction, resultados: SqlResultSet) => {
            if (resultados.rows.length > 0) {
              let facturaTemporal: any = resultados.rows.item(0);
              let factura: FacturaEncabezado = new FacturaEncabezado();

              factura.invoiceNum = facturaTemporal.INVOICE_NUM;
              factura.clientId = facturaTemporal.CLIENT_ID;
              factura.clientName = facturaTemporal.CLIENT_NAME;
              factura.totalAmount = facturaTemporal.TOTAL_AMOUNT;
              factura.comment = facturaTemporal.COMMENT;
              factura.inPlanRoute = facturaTemporal.IN_ROUTE_PLAN;
              factura.voidReason = facturaTemporal.VOID_REASON;
              factura.isPosted = facturaTemporal.IS_POSTED;
              factura.authId = facturaTemporal.AUTH_ID;
              factura.satSerie = facturaTemporal.SAT_SERIE;
              factura.postedDateTime = facturaTemporal.POSTED_DATETIME;
              factura.idBo = facturaTemporal.ID_BO;
              factura.isPostedValidated = facturaTemporal.IS_POSTED_VALIDATED;

              callback(factura);
            } else {
              errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Lo sentimos no ha sido posible encontrar la factura relacionada a la tarea indicada`
              } as Operacion);
            }
          },
          (_transaccionRetorno: SqlTransaction, error: SqlError) => {
            errorCallback({
              codigo: -1,
              resultado: ResultadoOperacionTipo.Error,
              mensaje: error.message
            } as Operacion);
          }
        );
      },
      (error: SqlError) => {
        errorCallback({
          codigo: -1,
          resultado: ResultadoOperacionTipo.Error,
          mensaje: error.message
        } as Operacion);
      }
    );
  }

  /**
   * crearNuevaTarea
   */
  public crearNuevaTarea(
    tarea: any,
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ) {
    TareaServicio.crearNuevaTarea(tarea, callback, (err: string) => {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: err
      } as Operacion);
    });
  }
}
