class EncuestaServicio implements IEncuestaServicio {
  guardarEncuestaProcesadaACliente(
    encuestaDeCliente: EncuestaDeCliente[],
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          trans.executeSql(
            this.obtenerFormatoDeInsercionDeEncabezadoDeEncuestaDeCliente(
              encuestaDeCliente[0]
            )
          );

          encuestaDeCliente.forEach(detalleEncuesta => {
            trans.executeSql(
              this.obtenerFormatoSqlDeInsercionDeEncuestaProcesadaACliente(
                detalleEncuesta
              )
            );
          });

          callback();
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
        codigo: error.code,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: error.message
      } as Operacion);
    }
  }
  obtenerEncuestasNoSincronizadas(
    callback: (encuestasPendientesDeSincronizar: EncuestaDeCliente[]) => void
  ): void {
    try {
      let sql: string[] = [];
      sql.push(
        `SELECT rowid, [DOC_SERIE], [DOC_NUM], [CODE_ROUTE], [CODE_CUSTOMER]`
      );
      sql.push(`, [IS_POSTED], [CREATED_DATE], [GPS]`);
      sql.push(`, [CUSTOMER_GPS], [SURVEY_ID], [SURVEY_NAME]`);
      sql.push(`, [QUESTION], [TYPE_QUESTION], [ANSWER]`);
      sql.push(` FROM CUSTOMER_SURVEY WHERE IS_POSTED <> 2`);

      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          trans.executeSql(
            sql.join(""),
            [],
            (txResult: SqlTransaction, results: SqlResultSet) => {
              let encuestas: EncuestaDeCliente[] = [];
              for (let index = 0; index < results.rows.length; index++) {
                let encuesta: EncuestaDeCliente = new EncuestaDeCliente();
                let encuestaTemp: any = results.rows.item(index);

                encuesta.rowId = encuestaTemp.rowid;
                encuesta.docSerie = encuestaTemp.DOC_SERIE;
                encuesta.docNum = encuestaTemp.DOC_NUM;
                encuesta.codeRoute = encuestaTemp.CODE_ROUTE;
                encuesta.codeCustomer = encuestaTemp.CODE_CUSTOMER;
                encuesta.createdDate = new Date(
                  encuestaTemp.CREATED_DATE
                ).toISOString() as any;
                encuesta.gps = encuestaTemp.GPS;
                encuesta.customerGps = encuestaTemp.CUSTOMER_GPS;
                encuesta.surveyId = encuestaTemp.SURVEY_ID;
                encuesta.surveyName = encuestaTemp.SURVEY_NAME;
                encuesta.question = encuestaTemp.QUESTION;
                encuesta.typeQuestion = encuestaTemp.TYPE_QUESTION;
                encuesta.answer = encuestaTemp.ANSWER;
                encuestas.push(encuesta);
              }
              callback(encuestas);
            },
            (txResult: SqlTransaction, error: SqlError) => {
              console.dir({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
              } as Operacion);
            }
          );
        },
        (error: SqlError) => {
          console.dir({
            codigo: error.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error.message
          } as Operacion);
        }
      );
    } catch (error) {
      console.dir({
        codigo: error.code,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: error.message
      } as Operacion);
    }
  }

  actualizarEstadoDePosteoDeEncuesta(data: any): void {
    try {
      SONDA_DB_Session.transaction(
        (trans: SqlTransaction) => {
          data.forEach((encuestaPosteada: any) => {
            if (encuestaPosteada.IS_SUCCESSFUL == 1) {
              trans.executeSql(
                `UPDATE CUSTOMER_SURVEY SET IS_POSTED = 2, POSTED_DATE = (SELECT date('now')) WHERE rowid = ${
                  encuestaPosteada.ROW_ID
                }`
              );
            }
          });
        },
        (error: SqlError) => {
          console.log({
            "Error al actualizar estado de posteo de encuestas de cliente": error
          });
        }
      );
    } catch (error) {
      console.log({
        "Error al actualizar estado de posteo de encuestas de cliente": error
      });
    }
  }

  obtenerEncuestas(
    cliente: Cliente,
    callback: (encuestas: Microencuesta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    this.validateQuizByChannel(
      cliente,
      (applyQuizByChannel: boolean) => {
        if (applyQuizByChannel) {
          this.obtenerEncabezadoDeEncuestasPorCanal(
            cliente,
            callback,
            errorCallback
          );
        } else {
          this.obtenerEncabezadoDeEncuestas(cliente, callback, errorCallback);
        }
      },
      errorCallback
    );
  }

  obtenerEncabezadoDeEncuestas(
    cliente: Cliente,
    callback: (encuestas: Microencuesta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (tx: SqlTransaction) => {
          let sql: string[] = [];
          sql.push(`SELECT [ID], [NAME], [VALID_FROM], [VALID_TO]`);
          sql.push(`, [ORDER], [IS_REQUIRED], [APPLY_IN]`);
          sql.push(`FROM MICROSURVEY AS M `);
          sql.push(`LEFT JOIN CUSTOMER_SURVEY_HEADER AS CSH `);
          sql.push(
            `ON(CSH.[SURVEY_ID] = M.[ID] AND CSH.[CODE_CUSTOMER] = '${
              cliente.clientId
            }') `
          );
          sql.push(`WHERE CSH.[SURVEY_ID] IS NULL `);
          sql.push(` AND [M].[CHANNELS_ON_QUIZ] IN (1) `);
          sql.push(`ORDER BY M.[ORDER] ASC`);

          tx.executeSql(
            sql.join(""),
            [],
            (txResult: SqlTransaction, results: SqlResultSet) => {
              let encuestasAsignadas: Microencuesta[] = [];
              if (results.rows.length > 0) {
                for (let index = 0; index < results.rows.length; index++) {
                  let encuestaTemp: any = results.rows.item(index);
                  let encuesta: Microencuesta = new Microencuesta();

                  encuesta.id = encuestaTemp.ID;
                  encuesta.name = encuestaTemp.NAME;
                  encuesta.validDateFrom = new Date(encuestaTemp.VALID_FROM);
                  encuesta.validDateTo = new Date(encuestaTemp.VALID_TO);
                  encuesta.order = encuestaTemp.ORDER;
                  encuesta.isMandatory = encuestaTemp.IS_REQUIRED;
                  encuesta.applyIn = encuestaTemp.APPLY_IN;

                  encuestasAsignadas.push(encuesta);
                }
                this.obtenerPreguntasDeEncuesta(
                  txResult,
                  encuestasAsignadas,
                  0,
                  callback,
                  errorCallback
                );
              } else {
                callback(encuestasAsignadas);
              }
            },
            (txResult: SqlTransaction, txError: SqlError) => {
              errorCallback({
                codigo: txError.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: txError.message
              } as Operacion);
            }
          );
        },
        (txError: SqlError) => {
          errorCallback({
            codigo: txError.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: txError.message
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

  obtenerPreguntasDeEncuesta(
    sqliteTransaction: SqlTransaction,
    encuestas: Microencuesta[],
    numeroDeEncuestaActual: number,
    callback: (encuestas: Microencuesta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      if (numeroDeEncuestaActual <= encuestas.length - 1) {
        let encuesta: Microencuesta = encuestas[numeroDeEncuestaActual];
        let sql: string[] = [];
        sql.push(
          `SELECT [ID], [MICROSURVEY_ID], [QUESTION], [ORDER], [IS_REQUIRED], [TYPE_QUESTION]`
        );
        sql.push(` FROM MICROSURVEY_QUESTION`);
        sql.push(` WHERE [MICROSURVEY_ID] = ${encuesta.id}`);
        sql.push(` ORDER BY [ORDER] ASC`);

        sqliteTransaction.executeSql(
          sql.join(""),
          [],
          (txResult: SqlTransaction, results: SqlResultSet) => {
            let preguntas: Pregunta[] = [];

            if (results.rows.length > 0) {
              for (let index = 0; index < results.rows.length; index++) {
                let preguntaTemp: any = results.rows.item(index);
                let pregunta: Pregunta = new Pregunta();

                pregunta.id = preguntaTemp.ID;
                pregunta.microsurveyId = preguntaTemp.MICROSURVEY_ID;
                pregunta.question = preguntaTemp.QUESTION;
                pregunta.order = preguntaTemp.ORDER;
                pregunta.required = preguntaTemp.IS_REQUIRED;
                pregunta.typeQuestion = preguntaTemp.TYPE_QUESTION;

                preguntas.push(pregunta);
              }
              encuestas[numeroDeEncuestaActual].questions = preguntas;

              this.obtenerRespuestasParaPreguntaDeEncuesta(
                txResult,
                preguntas,
                0,
                (preguntasConRespuesta: Pregunta[]) => {
                  encuestas[
                    numeroDeEncuestaActual
                  ].questions = preguntasConRespuesta;

                  this.obtenerPreguntasDeEncuesta(
                    txResult,
                    encuestas,
                    numeroDeEncuestaActual + 1,
                    callback,
                    errorCallback
                  );
                },
                errorCallback
              );
            } else {
              encuestas[numeroDeEncuestaActual].questions = [];
              this.obtenerPreguntasDeEncuesta(
                txResult,
                encuestas,
                numeroDeEncuestaActual + 1,
                callback,
                errorCallback
              );
            }
          },
          (txResult: SqlTransaction, error: SqlError) => {
            errorCallback({
              codigo: error.code,
              resultado: ResultadoOperacionTipo.Error,
              mensaje: error.message
            } as Operacion);
          }
        );
      } else {
        callback(encuestas);
      }
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
    }
  }

  obtenerRespuestasParaPreguntaDeEncuesta(
    sqliteTransaction: SqlTransaction,
    preguntas: Pregunta[],
    numeroDePreguntaActual: number,
    callback: (preguntasConRespuesta: Pregunta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      if (numeroDePreguntaActual <= preguntas.length - 1) {
        let pregunta: Pregunta = preguntas[numeroDePreguntaActual];
        let sql: string[] = [];
        sql.push(`SELECT [ID], [QUESTION_ID], [ANSWER]`);
        sql.push(` FROM ANSWER`);
        sql.push(` WHERE [QUESTION_ID] = ${pregunta.id}`);

        sqliteTransaction.executeSql(
          sql.join(""),
          [],
          (transResult: SqlTransaction, results: SqlResultSet) => {
            let respuestas: Respuesta[] = [];

            if (results.rows.length > 0) {
              for (let index = 0; index < results.rows.length; index++) {
                let respuesta: Respuesta = new Respuesta();
                let respuestaTemp: any = results.rows.item(index);

                respuesta.id = respuestaTemp.ID;
                respuesta.questionId = respuestaTemp.QUESTION_ID;
                respuesta.answer = respuestaTemp.ANSWER;

                respuestas.push(respuesta);
              }

              preguntas[numeroDePreguntaActual].answers = respuestas;
              this.obtenerRespuestasParaPreguntaDeEncuesta(
                transResult,
                preguntas,
                numeroDePreguntaActual + 1,
                callback,
                errorCallback
              );
            } else {
              preguntas[numeroDePreguntaActual].answers = respuestas;
              this.obtenerRespuestasParaPreguntaDeEncuesta(
                transResult,
                preguntas,
                numeroDePreguntaActual + 1,
                callback,
                errorCallback
              );
            }
          },
          (transResult: SqlTransaction, error: SqlError) => {
            errorCallback({
              codigo: -1,
              resultado: ResultadoOperacionTipo.Error,
              mensaje: error.message
            } as Operacion);
          }
        );
      } else {
        callback(preguntas);
      }
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
    }
  }

  obtenerFormatoSqlDeInsercionDeEncuestaProcesadaACliente(
    encuestaDeCliente: EncuestaDeCliente
  ): string {
    let sql: string[] = [];
    sql.push(`INSERT INTO CUSTOMER_SURVEY(`);
    sql.push(`[DOC_SERIE]`);
    sql.push(`, [DOC_NUM]`);
    sql.push(`, [CODE_ROUTE]`);
    sql.push(`, [CODE_CUSTOMER]`);
    sql.push(`, [IS_POSTED]`);
    sql.push(`, [CREATED_DATE]`);
    sql.push(`, [POSTED_DATE]`);
    sql.push(`, [GPS]`);
    sql.push(`, [CUSTOMER_GPS]`);
    sql.push(`, [SURVEY_ID]`);
    sql.push(`, [SURVEY_NAME]`);
    sql.push(`, [QUESTION]`);
    sql.push(`, [TYPE_QUESTION]`);
    sql.push(`, [ANSWER]`);
    sql.push(`) VALUES(`);
    sql.push(`'${encuestaDeCliente.docSerie}'`);
    sql.push(`,${encuestaDeCliente.docNum}`);
    sql.push(`,'${encuestaDeCliente.codeRoute}'`);
    sql.push(`,'${encuestaDeCliente.codeCustomer}'`);
    sql.push(`,${encuestaDeCliente.isPosted}`);
    sql.push(`,'${encuestaDeCliente.createdDate}'`);
    sql.push(`,NULL`);
    sql.push(`,'${encuestaDeCliente.gps}'`);
    sql.push(`,'${encuestaDeCliente.customerGps}'`);
    sql.push(`,${encuestaDeCliente.surveyId}`);
    sql.push(`,'${encuestaDeCliente.surveyName}'`);
    sql.push(`,'${encuestaDeCliente.question}'`);
    sql.push(`,'${encuestaDeCliente.typeQuestion}'`);
    sql.push(`,'${encuestaDeCliente.answer}'`);
    sql.push(`)`);

    return sql.join("");
  }

  obtenerFormatoDeInsercionDeEncabezadoDeEncuestaDeCliente(
    encuestaDeCliente: EncuestaDeCliente
  ): string {
    let sql: string[] = [];
    sql.push(`INSERT INTO CUSTOMER_SURVEY_HEADER([DOC_SERIE]`);
    sql.push(`, [DOC_NUM]`);
    sql.push(`, [CODE_CUSTOMER]`);
    sql.push(`, [IS_POSTED]`);
    sql.push(`, [SURVEY_ID]`);
    sql.push(`, [IS_FROM_DRAFT]) `);
    sql.push(`VALUES(`);
    sql.push(`'${encuestaDeCliente.docSerie}'`);
    sql.push(`,${encuestaDeCliente.docNum}`);
    sql.push(`,'${encuestaDeCliente.codeCustomer}'`);
    sql.push(`,0`);
    sql.push(`,${encuestaDeCliente.surveyId}`);
    sql.push(`,${encuestaDeCliente.isFromDraft ? 1 : 0}`);
    sql.push(`)`);

    return sql.join("");
  }

  filtrarEncuestasPorDisparador(
    encuestas: Microencuesta[],
    disparadorDeEncuesta: DisparadorDeEncuesta
  ): Array<Microencuesta> {
    let encuestasFiltradas: Microencuesta[] = encuestas.filter(
      (encuesta: Microencuesta) => {
        return encuesta.applyIn == disparadorDeEncuesta;
      }
    );
    return encuestasFiltradas;
  }

  procesarEncuestasDeCliente(
    encuestas: Microencuesta[],
    numeroDeEncuestaActual: number,
    isFromDraft: boolean,
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      let mensaje = new EncuestaMensaje(this);

      mensaje.encuestas = encuestas;
      mensaje.numeroDeEncuestaAProcesar = numeroDeEncuestaActual;
      mensaje.callbackAction = callback;
      mensaje.isFromDraft = isFromDraft;

      mensajero.publish(mensaje, getType(EncuestaMensaje));
    } catch (error) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: error.message
      } as Operacion);
    }
  }

  obtenerSecuenciaDeDocumento(
    tipoDeSecuencia: string,
    callback: (serie: string, numero: number) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    let sql: Array<string> = [];
    sql.push(`SELECT SERIE, (CURRENT_DOC + 1) AS CURRENT_DOC, DOC_TO`);
    sql.push(` FROM DOCUMENT_SEQUENCE WHERE DOC_TYPE = '${tipoDeSecuencia}'`);

    SONDA_DB_Session.transaction(
      (trans: SqlTransaction) => {
        trans.executeSql(
          sql.join(""),
          [],
          (transResult: SqlTransaction, results: SqlResultSet) => {
            if (results.rows.length > 0) {
              let secuencia: any = results.rows.item(0);
              if (
                parseInt(secuencia.CURRENT_DOC) > parseInt(secuencia.DOC_TO)
              ) {
                errorCallback({
                  codigo: -1,
                  resultado: ResultadoOperacionTipo.Error,
                  mensaje: `Operador ha superado la secuencia de documentos de tipo ${tipoDeSecuencia}, por favor contacte a su administrador.`
                } as Operacion);
              } else {
                callback(
                  (results.rows.item(0) as any).SERIE,
                  parseInt((results.rows.item(0) as any).CURRENT_DOC)
                );
              }
            } else {
              errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Operador no cuenta con secuencia de documentos de tipo ${tipoDeSecuencia}, por favor contacte a su administrador.`
              } as Operacion);
            }
          },
          (transResult: SqlTransaction, error: SqlError) => {
            errorCallback({
              codigo: error.code,
              resultado: ResultadoOperacionTipo.Error,
              mensaje: `Error al obtener la secuencia de documentos de tipo ${tipoDeSecuencia} debido a: ${
                error.message
              }`
            } as Operacion);
          }
        );
      },
      (error: SqlError) => {
        errorCallback({
          codigo: error.code,
          resultado: ResultadoOperacionTipo.Error,
          mensaje: `Error al obtener la secuencia de documentos de tipo ${tipoDeSecuencia} debido a: ${
            error.message
          }`
        } as Operacion);
      }
    );
  }

  actualizarSecuenciaDeDocumentos(
    tipo: string,
    numero: number,
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ): void {
    SONDA_DB_Session.transaction(
      (trans: SqlTransaction) => {
        let sql: Array<string> = [];

        sql.push(`UPDATE DOCUMENT_SEQUENCE SET CURRENT_DOC = ${numero}`);
        sql.push(` WHERE DOC_TYPE = '${tipo}'`);

        trans.executeSql(sql.join(""));
      },
      (error: SqlError) => {
        errorCallback({
          codigo: error.code,
          resultado: ResultadoOperacionTipo.Error,
          mensaje: `Error al actualizar secuencia de documentos debido a: ${
            error.message
          }`
        } as Operacion);
      },
      callback
    );
  }

  prepararDatosParaGuardarEncuestaProcesadaACliente(
    encuesta: Microencuesta,
    callback: (encuestaDeCliente: EncuestaDeCliente[]) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    this.obtenerSecuenciaDeDocumento(
      TIpoDeDocumento.EncuestaDeCliente.toString(),
      (serie: string, numero: number) => {
        let preguntasAProcesar: Pregunta[] = encuesta.questions.filter(
          (pregunta: Pregunta) => {
            return pregunta.answersOfUser.length > 0;
          }
        );

        if (preguntasAProcesar && preguntasAProcesar.length > 0) {
          let encuestaDeClienteAGuardar: EncuestaDeCliente[] = [];
          let fechaHora: Date = new Date();

          preguntasAProcesar.forEach((pregunta: Pregunta) => {
            let encuestaDeCliente: EncuestaDeCliente;
            if (
              pregunta.typeQuestion == TipoDePregunta.Multiple ||
              pregunta.typeQuestion == TipoDePregunta.Unica
            ) {
              pregunta.answersOfUser.forEach(
                (respuestaDeUsuario: Respuesta) => {
                  encuestaDeCliente = new EncuestaDeCliente();
                  encuestaDeCliente.docSerie = serie;
                  encuestaDeCliente.docNum = numero;
                  encuestaDeCliente.codeRoute = gCurrentRoute;
                  encuestaDeCliente.codeCustomer = gClientID;
                  encuestaDeCliente.isPosted = 0;
                  encuestaDeCliente.createdDate = fechaHora;
                  encuestaDeCliente.postedDate = null;
                  encuestaDeCliente.gps = gCurrentGPS;
                  encuestaDeCliente.customerGps = "";
                  encuestaDeCliente.surveyId = encuesta.id;
                  encuestaDeCliente.surveyName = encuesta.name;
                  encuestaDeCliente.question = pregunta.question;
                  encuestaDeCliente.typeQuestion = pregunta.typeQuestion;
                  encuestaDeCliente.answer = respuestaDeUsuario.answer;
                  encuestaDeCliente.isFromDraft = encuesta.isFromDraft;

                  encuestaDeClienteAGuardar.push(encuestaDeCliente);
                }
              );
            } else {
              encuestaDeCliente = new EncuestaDeCliente();
              encuestaDeCliente.docSerie = serie;
              encuestaDeCliente.docNum = numero;
              encuestaDeCliente.codeRoute = gCurrentRoute;
              encuestaDeCliente.codeCustomer = gClientID;
              encuestaDeCliente.isPosted = 0;
              encuestaDeCliente.createdDate = fechaHora;
              encuestaDeCliente.postedDate = null;
              encuestaDeCliente.gps = gCurrentGPS;
              encuestaDeCliente.customerGps = "";
              encuestaDeCliente.surveyId = encuesta.id;
              encuestaDeCliente.surveyName = encuesta.name;
              encuestaDeCliente.question = pregunta.question;
              encuestaDeCliente.typeQuestion = pregunta.typeQuestion;
              encuestaDeCliente.answer = pregunta.answersOfUser[0].answer;
              encuestaDeCliente.isFromDraft = encuesta.isFromDraft;

              encuestaDeClienteAGuardar.push(encuestaDeCliente);
            }
          });

          callback(encuestaDeClienteAGuardar);
        } else {
          errorCallback({
            codigo: -1,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: `No se han encontrado preguntas contestadas para procesar la encuesta actual. Por favor, verifique y vuelva a intentar.`
          } as Operacion);
        }
      },
      errorCallback
    );
  }

  validateQuizByChannel(
    cliente: Cliente,
    callback: (applyQuizByChannel: boolean) => void,
    errorCallback: (error: Operacion) => void
  ) {
    try {
      let sql: Array<string> = [];
      sql.push(`SELECT * FROM CHANNELS_BY_QUIZ`);
      sql.push(` WHERE CODE_CHANNEL = '${cliente.channel}'`);

      SONDA_DB_Session.transaction((trans: SqlTransaction) => {
        trans.executeSql(
          sql.join(""),
          [],
          (transResult: SqlTransaction, results: SqlResultSet) => {
            if (results.rows.length > 0) {
              callback(true);
            } else {
              callback(false);
            }
          }
        );
      });
    } catch (error) {
      errorCallback({
        codigo: -1,
        mensaje: `Error al validar las Microencuestas por canales ${
          error.message
        }`,
        resultado: ResultadoOperacionTipo.Error
      } as Operacion);
    }
  }

  obtenerEncabezadoDeEncuestasPorCanal(
    cliente: Cliente,
    callback: (encuestas: Microencuesta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void {
    try {
      SONDA_DB_Session.transaction(
        (tx: SqlTransaction) => {
          let sql: string[] = [];
          sql.push(`SELECT M.[ID], [NAME], [VALID_FROM], [VALID_TO]`);
          sql.push(`, [ORDER], [IS_REQUIRED], [APPLY_IN]`);
          sql.push(`FROM [MICROSURVEY] AS M `);
          sql.push(`INNER JOIN [CHANNELS_BY_QUIZ] AS CBQ `);
          sql.push(`ON(CBQ.QUIZ_ID = M.ID)`);
          sql.push(`LEFT JOIN CUSTOMER_SURVEY_HEADER AS CSH `);
          sql.push(
            `ON(CSH.[SURVEY_ID] = M.[ID] AND CSH.[CODE_CUSTOMER] = '${
              cliente.clientId
            }') `
          );
          sql.push(`WHERE CSH.[SURVEY_ID] IS NULL `);
          sql.push(`AND CBQ.CODE_CHANNEL = '${cliente.channel}'`);
          sql.push(`ORDER BY M.[ORDER] ASC`);

          tx.executeSql(
            sql.join(""),
            [],
            (txResult: SqlTransaction, results: SqlResultSet) => {
              let encuestasAsignadas: Microencuesta[] = [];
              if (results.rows.length > 0) {
                for (let index = 0; index < results.rows.length; index++) {
                  let encuestaTemp: any = results.rows.item(index);
                  let encuesta: Microencuesta = new Microencuesta();

                  encuesta.id = encuestaTemp.ID;
                  encuesta.name = encuestaTemp.NAME;
                  encuesta.validDateFrom = new Date(encuestaTemp.VALID_FROM);
                  encuesta.validDateTo = new Date(encuestaTemp.VALID_TO);
                  encuesta.order = encuestaTemp.ORDER;
                  encuesta.isMandatory = encuestaTemp.IS_REQUIRED;
                  encuesta.applyIn = encuestaTemp.APPLY_IN;

                  encuestasAsignadas.push(encuesta);
                }

                sql = [];
                sql.push(`SELECT [ID], [NAME], [VALID_FROM], [VALID_TO]`);
                sql.push(`, [ORDER], [IS_REQUIRED], [APPLY_IN], [CHANNELS_ON_QUIZ]`);
                sql.push(`FROM MICROSURVEY AS M `);
                sql.push(`LEFT JOIN CUSTOMER_SURVEY_HEADER AS CSH `);
                sql.push(
                  `ON(CSH.[SURVEY_ID] = M.[ID] AND CSH.[CODE_CUSTOMER] = '${
                    cliente.clientId
                  }') `
                );
                sql.push(`WHERE CSH.[SURVEY_ID] IS NULL `);
                sql.push(` AND [M].[CHANNELS_ON_QUIZ] IN (1, 3) `);
                sql.push(`ORDER BY M.[ORDER] ASC`);

                txResult.executeSql(
                  sql.join(""),
                  [],
                  (txResult: SqlTransaction, results: SqlResultSet) => {
                    let encuestasAsignadasPorRuta: Microencuesta[] = [];
                    if (results.rows.length > 0) {
                      for (
                        let index = 0;
                        index < results.rows.length;
                        index++
                      ) {
                        let encuestaTemp: any = results.rows.item(index);
                        let encuesta: Microencuesta = new Microencuesta();

                        encuesta.id = encuestaTemp.ID;
                        encuesta.name = encuestaTemp.NAME;
                        encuesta.validDateFrom = new Date(
                          encuestaTemp.VALID_FROM
                        );
                        encuesta.validDateTo = new Date(encuestaTemp.VALID_TO);
                        encuesta.order = encuestaTemp.ORDER;
                        encuesta.isMandatory = encuestaTemp.IS_REQUIRED;
                        encuesta.applyIn = encuestaTemp.APPLY_IN;
                        encuesta.channelsOnQuiz = encuestaTemp.CHANNELS_ON_QUIZ;

                        if(encuesta.channelsOnQuiz === 1){
                          encuestasAsignadasPorRuta.push(encuesta);
                        }else{
                          let resultadoDeBusqueda:  Microencuesta = (encuestasAsignadas as any).find((encuestaABuscar: Microencuesta)=>{
                            return (encuestaABuscar.id === encuesta.id);
                          });
                          if (resultadoDeBusqueda) {
                            encuestasAsignadasPorRuta.push(encuesta);
                          }
                        }
                      }
                      /*encuestasAsignadasPorRuta.map(
                        (encuesta: Microencuesta) => {
                          let resultadoDeBusqueda: Microencuesta = (encuestasAsignadas as any).find(
                            (encuestaABuscar: Microencuesta) => {
                              return (encuestaABuscar.id === encuesta.id);
                            }
                          );
                          if (!resultadoDeBusqueda) {
                            encuestasAsignadas.push(encuesta);
                          }
                        }
                      );*/

                      this.obtenerPreguntasDeEncuesta(
                        txResult,
                        encuestasAsignadasPorRuta,
                        0,
                        callback,
                        errorCallback
                      );
                    } else {
                      this.obtenerPreguntasDeEncuesta(
                        txResult,
                        encuestasAsignadas,
                        0,
                        callback,
                        errorCallback
                      );
                    }
                  },
                  (txResult: SqlTransaction, error: SqlError) => {
                    errorCallback({
                      codigo: error.code,
                      resultado: ResultadoOperacionTipo.Error,
                      mensaje: error.message
                    } as Operacion);
                  }
                );
              } else {
                callback(encuestasAsignadas);
              }
            },
            (txResult: SqlTransaction, txError: SqlError) => {
              errorCallback({
                codigo: txError.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: txError.message
              } as Operacion);
            }
          );
        },
        (txError: SqlError) => {
          errorCallback({
            codigo: txError.code,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: txError.message
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
}
