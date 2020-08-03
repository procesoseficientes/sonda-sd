class ControlDeSecuenciaServicio implements IControlDeSecuenciaServicio {
  private secuencias: Array<Secuencia> = [
    {
      tipo: TiposDeSecuenciaAControlar.NuevaTarea,
      constructorDeSecuencia: `INSERT INTO SEQUENCE_CONTROL([SEQUENCE_TYPE], [LAST_USED], [CREATED_DATE]) 
      VALUES ('${TiposDeSecuenciaAControlar.NuevaTarea}', 0, (SELECT date('now')))`
    } as Secuencia
  ];

  /**
   * inicializarControlDeSequencias
   */
  public inicializarControlDeSequencias(): void {
    SONDA_DB_Session.transaction(
      (transaction: SqlTransaction) => {
        this.inicializarSecuencias(this.secuencias, 0, transaction);
      },
      (error: SqlError) => {
        console.log({
          "Error en inicializacion de control de secuencias": error
        });
      }
    );
  }

  /**
   * inicializarSecuencias
   */
  private inicializarSecuencias(
    secuencias: Array<Secuencia>,
    secuenciaActual: number,
    transaccionActual: SqlTransaction
  ) {
    if (secuenciaActual < secuencias.length) {
      let secuencia = secuencias[secuenciaActual];
      transaccionActual.executeSql(
        `SELECT 1 FROM SEQUENCE_CONTROL WHERE [SEQUENCE_TYPE] = '${secuencia.tipo}' LIMIT 1`,
        [],
        (transaccion: SqlTransaction, resultados: SqlResultSet) => {
          if (!resultados.rows.length) {
            transaccion.executeSql(secuencia.constructorDeSecuencia);
            this.inicializarSecuencias(
              secuencias,
              secuenciaActual + 1,
              transaccion
            );
          }
        },
        (transaccion: SqlTransaction, error: SqlError) => {
          console.log(
            `Error al intentar crear la secuencia de tipo ${secuencia.tipo} debido a: ${error.message}`
          );
          this.inicializarSecuencias(
            secuencias,
            secuenciaActual + 1,
            transaccion
          );
        }
      );
    } else {
      console.log("Secuencias inicializadas correctamente");
    }
  }
  /**
   * obtenerSiguienteNumeroDeSecuenciaDeControl
   */
  public obtenerSiguienteNumeroDeSecuenciaDeControl(
    tipoDeSecuencia: TiposDeSecuenciaAControlar,
    callback: (secuencia: ControlDeSecuencia) => void,
    errorCallback: (resultado: Operacion) => void
  ) {
    SONDA_DB_Session.transaction(
      (transaction: SqlTransaction) => {
        transaction.executeSql(
          `SELECT [SEQUENCE_TYPE], 
            [LAST_USED], 
            ([LAST_USED] + 1) [NEXT_VALUE], 
            [CREATED_DATE], 
            [LAST_UPDATE] 
            FROM [SEQUENCE_CONTROL] 
            WHERE [SEQUENCE_TYPE] = '${tipoDeSecuencia}' LIMIT 1`,
          [],
          (_transactionRet: SqlTransaction, resultados: SqlResultSet) => {
            if (resultados.rows.length > 0) {
              let secuenciaControlada: any = resultados.rows.item(0);
              let secuencia: ControlDeSecuencia = new ControlDeSecuencia();

              secuencia.SEQUENCE_TYPE = secuenciaControlada.SEQUENCE_TYPE;
              secuencia.LAST_USED = secuenciaControlada.LAST_USED;
              secuencia.NEXT_VALUE = secuenciaControlada.NEXT_VALUE;
              secuencia.CREATED_DATE = secuenciaControlada.CREATED_DATE;
              secuencia.LAST_UPDATE = secuenciaControlada.LAST_UPDATE;

              callback(secuencia);
            } else {
              errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Lo sentimos no fue posible encontrar un registro de control para la secuencia solicitada '${tipoDeSecuencia}'`
              } as Operacion);
            }
          },
          (_transactionRet: SqlTransaction, error: SqlError) => {
            errorCallback({
              codigo: -1,
              resultado: ResultadoOperacionTipo.Error,
              mensaje: error.message
            } as Operacion);
          }
        );
      },
      (error: SqlError) => {
        console.log({
          "Error al obtener la secuencia solicitada": error.message
        });
      }
    );
  }

  /**
   * actualizarSecuenciaDeControl
    secuencia: ControlDeSecuencia
    callback?: () => void
    errorCallback?: (resultado: Operacion) => void   */
  public actualizarSecuenciaDeControl(
    secuencia: ControlDeSecuencia,
    callback?: () => void,
    errorCallback?: (resultado: Operacion) => void
  ) {
    SONDA_DB_Session.transaction(
      (transaction: SqlTransaction) => {
        transaction.executeSql(
          `UPDATE [SEQUENCE_CONTROL]
            SET 
              [LAST_USED] = ${secuencia.NEXT_VALUE},  
              [LAST_UPDATE] = (SELECT date('now'))
              WHERE [SEQUENCE_TYPE] = '${secuencia.SEQUENCE_TYPE}'`
        );

        if (callback) {
          callback();
        }
      },
      (error: SqlError) => {
        console.log({
          "Error al obtener la secuencia solicitada": error.message
        });
        if (errorCallback) {
          errorCallback({
            codigo: -1,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: `Error al obtener la secuencia solicitada ${error.message}`
          } as Operacion);
        }
      }
    );
  }

  /**
   * Obtiene secuencia de documento del móvil
   * @param tipoSecuencia Tipo de secuencia a obtener
   * @param callback Secuencia obtenida
   * @param errorCallback mensaje del error al obtener secuenica
   */
  obtenerSecuenciaDeDocumento(
    tipoSecuencia: string,
    callback: (secuenciaDocumento) => void,
    errorCallback: (error: string) => void
  ) {
    let sql: Array<string> = [];
    sql.push("SELECT [DOC_TYPE], [SERIE], [CURRENT_DOC], [DOC_TO],");
    sql.push("[DOC_FROM], [BRANCH_NAME], [BRANCH_ADDRESS]");
    sql.push("FROM [DOCUMENT_SEQUENCE]");
    sql.push(`WHERE [DOC_TYPE] = '${tipoSecuencia}'`);

    SONDA_DB_Session.transaction((tx: SqlTransaction) => {
      tx.executeSql(
        sql.join(" "),
        [],
        (tx2, results) => {
          if (results.rows.length > 0) {
            var secuenciaDocumento = results.rows.item(0);
            callback(secuenciaDocumento);
          } else {
            callback(null);
          }
        },
        (tx2, error) => {
          errorCallback(error.message);
        }
      );
    });
  }

  /**
   * Método que actualiza las secuencias de documentos
   * @param tipoSecuencia tipo de secuencia a actualizar
   * @param ultimaSecuenciaUtilizada último número de secuencia utilizado
   * @param errorCallback callback si hay error
   */
  actualizarSecuenciaDeDocumento(
    tipoSecuencia: string,
    ultimaSecuenciaUtilizada: number,
    errorCallback: (resultado: Operacion) => void
  ) {
    try {
      let sql: Array<string> = [];
      sql.push(`UPDATE [DOCUMENT_SEQUENCE]`);
      sql.push(`SET [CURRENT_DOC] = ${ultimaSecuenciaUtilizada}`);
      sql.push(`WHERE [DOC_TYPE] = '${tipoSecuencia}'`);

      SONDA_DB_Session.transaction((tx: SqlTransaction) => {
        tx.executeSql(sql.join(" "));
      });
    } catch (error) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: `Error al actualizar la secuencia ${error.message}`
      } as Operacion);
    }
  }
}
