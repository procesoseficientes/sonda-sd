class FacturacionElectronicaServicio
  implements IFacturacionElectronicaServicio {
  agregarFraseEscenario(data: any) {
    try {
      ToastThis(
        `F:${data.PHRASE_CODE}, E:${data.SCENARIO_CODE}; ${data.DESCRIPTION}`
      );
      let sql: Array<string> = [];
      sql.push(`INSERT INTO PHRASE_AND_SCENARIO(`);
      sql.push(`[ID], [FEL_DOCUMENT_TYPE], [PHRASE_CODE],`);
      sql.push(`[SCENARIO_CODE], [DESCRIPTION], [TEXT_TO_SHOW]`);
      sql.push(`) VALUES (`);
      sql.push(`${data.ID},`);
      sql.push(`'${data.FEL_DOCUMENT_TYPE}',`);
      sql.push(`${data.PHRASE_CODE},`);
      sql.push(`${data.SCENARIO_CODE},`);
      sql.push(`'${data.DESCRIPTION}',`);
      sql.push(`'${data.TEXT_TO_SHOW}'`);
      sql.push(`)`);
      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          trans.executeSql(sql.join(" "));
        },
        (error: SqlError) => {
          console.log(error.message);
          InteraccionConUsuarioServicio.desbloquearPantalla();
          notify("Error insertando frases y escenarios");
        }
      );
    } catch (error) {
      console.log(error.message);
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify("Error al ejecutar inserción frases y escenarios");
    }
  }

  obtenerFrasesYEscenariosPorTipoDeDocumentoFel(
    felDocumentType: string,
    callBack: (frasesEscenarios: FraseEscenario[]) => void,
    errorCallBack: (error: Operacion) => void
  ) {
    let sql: Array<string> = [];
    sql.push(`SELECT [ID], [PHRASE_CODE],`);
    sql.push(`[SCENARIO_CODE], [DESCRIPTION], [TEXT_TO_SHOW]`);
    sql.push(`FROM PHRASE_AND_SCENARIO`);
    sql.push(`WHERE [FEL_DOCUMENT_TYPE] = '${felDocumentType}'`);
    SONDA_DB_Session.transaction(trans => {
      trans.executeSql(
        sql.join(" "),
        [],
        (_txResult, results) => {
          let frasesEscenarios: FraseEscenario[] = [];
          if (results.rows.length > 0) {
            for (let i = 0; i < results.rows.length; i++) {
              var fraseEscenario = new FraseEscenario();
              var FETemp: any = results.rows.item(i);
              fraseEscenario.FelDocumentType = FETemp.FEL_DOCUMENT_TYPE;
              fraseEscenario.PhraseCode = FETemp.PHRASE_CODE;
              fraseEscenario.ScenarioCode = FETemp.SCENARIO_CODE;
              fraseEscenario.Description = FETemp.DESCRIPTION;
              fraseEscenario.TextToShow = FETemp.TEXT_TO_SHOW;
              frasesEscenarios.push(fraseEscenario);
            }
            callBack(frasesEscenarios);
          } else {
            callBack([]);
          }
        },
        (_tx, error) => {
          errorCallBack({
            codigo: -1,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error.message
          } as Operacion);
        }
      );
    });
  }
  obtenerDocumentoDeContingenciaPorNumeroDeFactura(
    invoiceNum: number,
    callBack: (factura: FacturaEncabezado) => void,
    errorCallBack: (resultado: Operacion) => void
  ) {
    let sql: Array<string> = [];
    sql.push(`SELECT`);
    sql.push(`[INVOICE_NUM], [TERMS], [POSTED_DATETIME], [CLIENT_ID],`);
    sql.push(`[CLIENT_NAME], [POS_TERMINAL], [GPS], [TOTAL_AMOUNT],`);
    sql.push(`[ERP_INVOICE_ID], [IS_POSTED], [STATUS], [IS_CREDIT_NOTE],`);
    sql.push(`[VOID_REASON], [VOID_NOTES], [VOID_INVOICE_ID],`);
    sql.push(`[PRINT_REQUEST], [PRINTED_COUNT], [AUTH_ID], [SAT_SERIE],`);
    sql.push(`[CHANGE], [IMG1], [IMG2], [IMG3], [CONSIGNMENT_ID],`);
    sql.push(`[IS_PAID_CONSIGNMENT], [INITIAL_TASK_IMAGE], [IN_ROUTE_PLAN],`);
    sql.push(`[ID_BO], [IS_POSTED_VALIDATED], [DETAIL_QTY],`);
    sql.push(`[HANDLE_TAX], [TAX_PERCENT], [TELEPHONE_NUMBER],`);
    sql.push(`[IS_FROM_DELIVERY_NOTE], [DISCOUNT], [COMMENT], [DUE_DATE],`);
    sql.push(`[CREDIT_AMOUNT], [CASH_AMOUNT], [PAID_TO_DATE], [TASK_ID],`);
    sql.push(`[GOAL_HEADER_ID], [SHIPMENT], [CONTINGENCY_DOC_SERIE],`);
    sql.push(`[CONTINGENCY_DOC_NUM]`);
    sql.push(`FROM`);
    sql.push(`[INVOICE_HEADER]`);
    sql.push(`WHERE`);
    sql.push(`[INVOICE_NUM]`);
    sql.push(`=`);
    sql.push(`${invoiceNum}`);
    SONDA_DB_Session.transaction(trans => {
      trans.executeSql(
        sql.join(" "),
        [],
        (tx, results) => {
          let factura = new FacturaEncabezado();
          if (results.rows.length > 0) {
            let facturaTemp = results.rows.item(0) as any;
            factura.invoiceNum = facturaTemp.INVOICE_NUM;
            factura.terms = facturaTemp.TERMS;
            factura.postedDateTime = facturaTemp.POSTED_DATETIME;
            factura.clientId = facturaTemp.CLIENT_ID;
            factura.clientName = facturaTemp.CLIENT_NAME;
            factura.posTerminal = facturaTemp.POS_TERMINAL;
            factura.gps = facturaTemp.GPS;
            factura.totalAmount = facturaTemp.TOTAL_AMOUNT;
            factura.erpInvoiceId = facturaTemp.ERP_INVOICE_ID;
            factura.isPosted = facturaTemp.IS_POSTED;
            factura.status = facturaTemp.STATUS;
            factura.isCreditNote = facturaTemp.IS_CREDIT_NOTE;
            factura.voidReason = facturaTemp.VOID_REASON;
            factura.voidNotes = facturaTemp.VOID_NOTES;
            factura.voidInvoiceId = facturaTemp.VOID_INVOICE_ID;
            factura.printRequests = facturaTemp.PRINT_REQUEST;
            factura.printedCount = facturaTemp.PRINTED_COUNT;
            factura.authId = facturaTemp.AUTH_ID;
            factura.satSerie = facturaTemp.SAT_SERIE;
            factura.change = facturaTemp.CHANGE;
            factura.img1 = facturaTemp.IMG1;
            factura.img2 = facturaTemp.IMG2;
            factura.img3 = facturaTemp.IMG3;
            factura.consignmentId = facturaTemp.CONSIGNMENT_ID;
            factura.isPaidConsignment = facturaTemp.IS_PAID_CONSIGNMENT;
            factura.initialTaskImage = facturaTemp.INITIAL_TASK_IMAGE;
            factura.inPlanRoute = facturaTemp.IN_ROUTE_PLAN;
            factura.idBo = facturaTemp.ID_BO;
            factura.isPostedValidated = facturaTemp.IS_POSTED_VALIDATED;
            factura.detailQty = facturaTemp.DETAIL_QTY;
            factura.handleTax = facturaTemp.HANDLE_TAX;
            factura.taxPercent = facturaTemp.TAX_PERCENT;
            factura.telephoneNumber = facturaTemp.TELEPHONE_NUMBER;
            factura.isFromDeliveryNote = facturaTemp.IS_FROM_DELIVERY_NOTE;
            factura.discount = facturaTemp.DISCOUNT;
            factura.comment = facturaTemp.COMMENT;
            factura.dueDate = facturaTemp.DUE_DATE;
            factura.creditAmount = facturaTemp.CREDIT_AMOUNT;
            factura.cashAmount = facturaTemp.CASH_AMOUNT;
            factura.paidToDate = facturaTemp.PAID_TO_DATE;
            factura.taskId = facturaTemp.TASK_ID;
            factura.goalHeaderId = facturaTemp.GOAL_HEADER_ID;
            factura.felData = new DatosFelParaFactura();
            factura.felData.Shipment = facturaTemp.SHIPMENT;
            factura.felData.ContingencyDocSerie =
              facturaTemp.CONTINGENCY_DOC_SERIE;
            factura.felData.ContingencyDocNum = facturaTemp.CONTINGENCY_DOC_NUM;
            callBack(factura);
          } else {
            errorCallBack({
              codigo: -1,
              resultado: ResultadoOperacionTipo.Error,
              mensaje: "No se encontró el documento de contingencia requerido"
            } as Operacion);
          }
        },
        (tx, error) => {
          errorCallBack({
            codigo: -1,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error.message
          } as Operacion);
        }
      );
    });
  }
  actualizarDocumentoDeContingencia(
    invoiceNum: number,
    felData: DatosFelParaFactura,
    errorCallBack: (resultado: Operacion) => void,
    callBack?: () => void
  ) {
    let sql: Array<string> = [];
    sql.push(`UPDATE [INVOICE_HEADER] SET`);
    sql.push(`[ELECTRONIC_SIGNATURE] = '${felData.ElectronicSignature}',`);
    sql.push(`[DOCUMENT_NUMBER] = ${felData.DocumentNumber},`);
    sql.push(`[DOCUMENT_SERIES] = '${felData.DocumentSeries}',`);
    sql.push(`[DOCUMENT_URL] = '${felData.DocumentUrl}',`);
    sql.push(`[SHIPMENT] = ${felData.Shipment},`);
    sql.push(`[VALIDATION_RESULT] = ${felData.ValidationResult ? 1 : 0},`);
    sql.push(`[SHIPMENT_DATETIME] = '${felData.ShipmentDatetime}',`);
    sql.push(`[SHIPMENT_RESPONSE] = '${felData.ShipmentResponse}'`);
    sql.push(`WHERE`);
    sql.push(`[INVOICE_NUM]`);
    sql.push(`=`);
    sql.push(`${invoiceNum}`);
    SONDA_DB_Session.transaction(
      trans => {
        trans.executeSql(sql.join(" "));
        if (callBack) {
          callBack();
        }
      },
      (error: SqlError) => {
        errorCallBack({
          codigo: -1,
          resultado: ResultadoOperacionTipo.Error,
          mensaje: error.message
        } as Operacion);
      }
    );
  }
}
