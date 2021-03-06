var EncuestaServicio = (function () {
    function EncuestaServicio() {
    }
    EncuestaServicio.prototype.guardarEncuestaProcesadaACliente = function (encuestaDeCliente, callback, errorCallback) {
        var _this = this;
        try {
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(_this.obtenerFormatoDeInsercionDeEncabezadoDeEncuestaDeCliente(encuestaDeCliente[0]));
                encuestaDeCliente.forEach(function (detalleEncuesta) {
                    trans.executeSql(_this.obtenerFormatoSqlDeInsercionDeEncuestaProcesadaACliente(detalleEncuesta));
                });
                callback();
            }, function (error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }
        catch (error) {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    EncuestaServicio.prototype.obtenerEncuestasNoSincronizadas = function (callback) {
        try {
            var sql_1 = [];
            sql_1.push("SELECT rowid, [DOC_SERIE], [DOC_NUM], [CODE_ROUTE], [CODE_CUSTOMER]");
            sql_1.push(", [IS_POSTED], [CREATED_DATE], [GPS]");
            sql_1.push(", [CUSTOMER_GPS], [SURVEY_ID], [SURVEY_NAME]");
            sql_1.push(", [QUESTION], [TYPE_QUESTION], [ANSWER]");
            sql_1.push(" FROM CUSTOMER_SURVEY WHERE IS_POSTED <> 2");
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(sql_1.join(""), [], function (txResult, results) {
                    var encuestas = [];
                    for (var index = 0; index < results.rows.length; index++) {
                        var encuesta = new EncuestaDeCliente();
                        var encuestaTemp = results.rows.item(index);
                        encuesta.rowId = encuestaTemp.rowid;
                        encuesta.docSerie = encuestaTemp.DOC_SERIE;
                        encuesta.docNum = encuestaTemp.DOC_NUM;
                        encuesta.codeRoute = encuestaTemp.CODE_ROUTE;
                        encuesta.codeCustomer = encuestaTemp.CODE_CUSTOMER;
                        encuesta.createdDate = new Date(encuestaTemp.CREATED_DATE).toISOString();
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
                }, function (txResult, error) {
                    console.dir({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: error.message
                    });
                });
            }, function (error) {
                console.dir({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: error.message
                });
            });
        }
        catch (error) {
            console.dir({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    EncuestaServicio.prototype.actualizarEstadoDePosteoDeEncuesta = function (data) {
        try {
            SONDA_DB_Session.transaction(function (trans) {
                data.forEach(function (encuestaPosteada) {
                    if (encuestaPosteada.IS_SUCCESSFUL == 1) {
                        trans.executeSql("UPDATE CUSTOMER_SURVEY SET IS_POSTED = 2, POSTED_DATE = (SELECT date('now')) WHERE rowid = " + encuestaPosteada.ROW_ID);
                    }
                });
            }, function (error) {
                console.log({
                    "Error al actualizar estado de posteo de encuestas de cliente": error
                });
            });
        }
        catch (error) {
            console.log({
                "Error al actualizar estado de posteo de encuestas de cliente": error
            });
        }
    };
    EncuestaServicio.prototype.obtenerEncuestas = function (cliente, callback, errorCallback) {
        var _this = this;
        this.validateQuizByChannel(cliente, function (applyQuizByChannel) {
            if (applyQuizByChannel) {
                _this.obtenerEncabezadoDeEncuestasPorCanal(cliente, callback, errorCallback);
            }
            else {
                _this.obtenerEncabezadoDeEncuestas(cliente, callback, errorCallback);
            }
        }, errorCallback);
    };
    EncuestaServicio.prototype.obtenerEncabezadoDeEncuestas = function (cliente, callback, errorCallback) {
        var _this = this;
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = [];
                sql.push("SELECT [ID], [NAME], [VALID_FROM], [VALID_TO]");
                sql.push(", [ORDER], [IS_REQUIRED], [APPLY_IN]");
                sql.push("FROM MICROSURVEY AS M ");
                sql.push("LEFT JOIN CUSTOMER_SURVEY_HEADER AS CSH ");
                sql.push("ON(CSH.[SURVEY_ID] = M.[ID] AND CSH.[CODE_CUSTOMER] = '" + cliente.clientId + "') ");
                sql.push("WHERE CSH.[SURVEY_ID] IS NULL ");
                sql.push(" AND [M].[CHANNELS_ON_QUIZ] IN (1) ");
                sql.push("ORDER BY M.[ORDER] ASC");
                tx.executeSql(sql.join(""), [], function (txResult, results) {
                    var encuestasAsignadas = [];
                    if (results.rows.length > 0) {
                        for (var index = 0; index < results.rows.length; index++) {
                            var encuestaTemp = results.rows.item(index);
                            var encuesta = new Microencuesta();
                            encuesta.id = encuestaTemp.ID;
                            encuesta.name = encuestaTemp.NAME;
                            encuesta.validDateFrom = new Date(encuestaTemp.VALID_FROM);
                            encuesta.validDateTo = new Date(encuestaTemp.VALID_TO);
                            encuesta.order = encuestaTemp.ORDER;
                            encuesta.isMandatory = encuestaTemp.IS_REQUIRED;
                            encuesta.applyIn = encuestaTemp.APPLY_IN;
                            encuestasAsignadas.push(encuesta);
                        }
                        _this.obtenerPreguntasDeEncuesta(txResult, encuestasAsignadas, 0, callback, errorCallback);
                    }
                    else {
                        callback(encuestasAsignadas);
                    }
                }, function (txResult, txError) {
                    errorCallback({
                        codigo: txError.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: txError.message
                    });
                });
            }, function (txError) {
                errorCallback({
                    codigo: txError.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: txError.message
                });
            });
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    EncuestaServicio.prototype.obtenerPreguntasDeEncuesta = function (sqliteTransaction, encuestas, numeroDeEncuestaActual, callback, errorCallback) {
        var _this = this;
        try {
            if (numeroDeEncuestaActual <= encuestas.length - 1) {
                var encuesta = encuestas[numeroDeEncuestaActual];
                var sql = [];
                sql.push("SELECT [ID], [MICROSURVEY_ID], [QUESTION], [ORDER], [IS_REQUIRED], [TYPE_QUESTION]");
                sql.push(" FROM MICROSURVEY_QUESTION");
                sql.push(" WHERE [MICROSURVEY_ID] = " + encuesta.id);
                sql.push(" ORDER BY [ORDER] ASC");
                sqliteTransaction.executeSql(sql.join(""), [], function (txResult, results) {
                    var preguntas = [];
                    if (results.rows.length > 0) {
                        for (var index = 0; index < results.rows.length; index++) {
                            var preguntaTemp = results.rows.item(index);
                            var pregunta = new Pregunta();
                            pregunta.id = preguntaTemp.ID;
                            pregunta.microsurveyId = preguntaTemp.MICROSURVEY_ID;
                            pregunta.question = preguntaTemp.QUESTION;
                            pregunta.order = preguntaTemp.ORDER;
                            pregunta.required = preguntaTemp.IS_REQUIRED;
                            pregunta.typeQuestion = preguntaTemp.TYPE_QUESTION;
                            preguntas.push(pregunta);
                        }
                        encuestas[numeroDeEncuestaActual].questions = preguntas;
                        _this.obtenerRespuestasParaPreguntaDeEncuesta(txResult, preguntas, 0, function (preguntasConRespuesta) {
                            encuestas[numeroDeEncuestaActual].questions = preguntasConRespuesta;
                            _this.obtenerPreguntasDeEncuesta(txResult, encuestas, numeroDeEncuestaActual + 1, callback, errorCallback);
                        }, errorCallback);
                    }
                    else {
                        encuestas[numeroDeEncuestaActual].questions = [];
                        _this.obtenerPreguntasDeEncuesta(txResult, encuestas, numeroDeEncuestaActual + 1, callback, errorCallback);
                    }
                }, function (txResult, error) {
                    errorCallback({
                        codigo: error.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: error.message
                    });
                });
            }
            else {
                callback(encuestas);
            }
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: e.message
            });
        }
    };
    EncuestaServicio.prototype.obtenerRespuestasParaPreguntaDeEncuesta = function (sqliteTransaction, preguntas, numeroDePreguntaActual, callback, errorCallback) {
        var _this = this;
        try {
            if (numeroDePreguntaActual <= preguntas.length - 1) {
                var pregunta = preguntas[numeroDePreguntaActual];
                var sql = [];
                sql.push("SELECT [ID], [QUESTION_ID], [ANSWER]");
                sql.push(" FROM ANSWER");
                sql.push(" WHERE [QUESTION_ID] = " + pregunta.id);
                sqliteTransaction.executeSql(sql.join(""), [], function (transResult, results) {
                    var respuestas = [];
                    if (results.rows.length > 0) {
                        for (var index = 0; index < results.rows.length; index++) {
                            var respuesta = new Respuesta();
                            var respuestaTemp = results.rows.item(index);
                            respuesta.id = respuestaTemp.ID;
                            respuesta.questionId = respuestaTemp.QUESTION_ID;
                            respuesta.answer = respuestaTemp.ANSWER;
                            respuestas.push(respuesta);
                        }
                        preguntas[numeroDePreguntaActual].answers = respuestas;
                        _this.obtenerRespuestasParaPreguntaDeEncuesta(transResult, preguntas, numeroDePreguntaActual + 1, callback, errorCallback);
                    }
                    else {
                        preguntas[numeroDePreguntaActual].answers = respuestas;
                        _this.obtenerRespuestasParaPreguntaDeEncuesta(transResult, preguntas, numeroDePreguntaActual + 1, callback, errorCallback);
                    }
                }, function (transResult, error) {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: error.message
                    });
                });
            }
            else {
                callback(preguntas);
            }
        }
        catch (e) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: e.message
            });
        }
    };
    EncuestaServicio.prototype.obtenerFormatoSqlDeInsercionDeEncuestaProcesadaACliente = function (encuestaDeCliente) {
        var sql = [];
        sql.push("INSERT INTO CUSTOMER_SURVEY(");
        sql.push("[DOC_SERIE]");
        sql.push(", [DOC_NUM]");
        sql.push(", [CODE_ROUTE]");
        sql.push(", [CODE_CUSTOMER]");
        sql.push(", [IS_POSTED]");
        sql.push(", [CREATED_DATE]");
        sql.push(", [POSTED_DATE]");
        sql.push(", [GPS]");
        sql.push(", [CUSTOMER_GPS]");
        sql.push(", [SURVEY_ID]");
        sql.push(", [SURVEY_NAME]");
        sql.push(", [QUESTION]");
        sql.push(", [TYPE_QUESTION]");
        sql.push(", [ANSWER]");
        sql.push(") VALUES(");
        sql.push("'" + encuestaDeCliente.docSerie + "'");
        sql.push("," + encuestaDeCliente.docNum);
        sql.push(",'" + encuestaDeCliente.codeRoute + "'");
        sql.push(",'" + encuestaDeCliente.codeCustomer + "'");
        sql.push("," + encuestaDeCliente.isPosted);
        sql.push(",'" + encuestaDeCliente.createdDate + "'");
        sql.push(",NULL");
        sql.push(",'" + encuestaDeCliente.gps + "'");
        sql.push(",'" + encuestaDeCliente.customerGps + "'");
        sql.push("," + encuestaDeCliente.surveyId);
        sql.push(",'" + encuestaDeCliente.surveyName + "'");
        sql.push(",'" + encuestaDeCliente.question + "'");
        sql.push(",'" + encuestaDeCliente.typeQuestion + "'");
        sql.push(",'" + encuestaDeCliente.answer + "'");
        sql.push(")");
        return sql.join("");
    };
    EncuestaServicio.prototype.obtenerFormatoDeInsercionDeEncabezadoDeEncuestaDeCliente = function (encuestaDeCliente) {
        var sql = [];
        sql.push("INSERT INTO CUSTOMER_SURVEY_HEADER([DOC_SERIE]");
        sql.push(", [DOC_NUM]");
        sql.push(", [CODE_CUSTOMER]");
        sql.push(", [IS_POSTED]");
        sql.push(", [SURVEY_ID]");
        sql.push(", [IS_FROM_DRAFT]) ");
        sql.push("VALUES(");
        sql.push("'" + encuestaDeCliente.docSerie + "'");
        sql.push("," + encuestaDeCliente.docNum);
        sql.push(",'" + encuestaDeCliente.codeCustomer + "'");
        sql.push(",0");
        sql.push("," + encuestaDeCliente.surveyId);
        sql.push("," + (encuestaDeCliente.isFromDraft ? 1 : 0));
        sql.push(")");
        return sql.join("");
    };
    EncuestaServicio.prototype.filtrarEncuestasPorDisparador = function (encuestas, disparadorDeEncuesta) {
        var encuestasFiltradas = encuestas.filter(function (encuesta) {
            return encuesta.applyIn == disparadorDeEncuesta;
        });
        return encuestasFiltradas;
    };
    EncuestaServicio.prototype.procesarEncuestasDeCliente = function (encuestas, numeroDeEncuestaActual, isFromDraft, callback, errorCallback) {
        try {
            var mensaje = new EncuestaMensaje(this);
            mensaje.encuestas = encuestas;
            mensaje.numeroDeEncuestaAProcesar = numeroDeEncuestaActual;
            mensaje.callbackAction = callback;
            mensaje.isFromDraft = isFromDraft;
            mensajero.publish(mensaje, getType(EncuestaMensaje));
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    EncuestaServicio.prototype.obtenerSecuenciaDeDocumento = function (tipoDeSecuencia, callback, errorCallback) {
        var sql = [];
        sql.push("SELECT SERIE, (CURRENT_DOC + 1) AS CURRENT_DOC, DOC_TO");
        sql.push(" FROM DOCUMENT_SEQUENCE WHERE DOC_TYPE = '" + tipoDeSecuencia + "'");
        SONDA_DB_Session.transaction(function (trans) {
            trans.executeSql(sql.join(""), [], function (transResult, results) {
                if (results.rows.length > 0) {
                    var secuencia = results.rows.item(0);
                    if (parseInt(secuencia.CURRENT_DOC) > parseInt(secuencia.DOC_TO)) {
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: "Operador ha superado la secuencia de documentos de tipo " + tipoDeSecuencia + ", por favor contacte a su administrador."
                        });
                    }
                    else {
                        callback(results.rows.item(0).SERIE, parseInt(results.rows.item(0).CURRENT_DOC));
                    }
                }
                else {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Operador no cuenta con secuencia de documentos de tipo " + tipoDeSecuencia + ", por favor contacte a su administrador."
                    });
                }
            }, function (transResult, error) {
                errorCallback({
                    codigo: error.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "Error al obtener la secuencia de documentos de tipo " + tipoDeSecuencia + " debido a: " + error.message
                });
            });
        }, function (error) {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al obtener la secuencia de documentos de tipo " + tipoDeSecuencia + " debido a: " + error.message
            });
        });
    };
    EncuestaServicio.prototype.actualizarSecuenciaDeDocumentos = function (tipo, numero, callback, errorCallback) {
        SONDA_DB_Session.transaction(function (trans) {
            var sql = [];
            sql.push("UPDATE DOCUMENT_SEQUENCE SET CURRENT_DOC = " + numero);
            sql.push(" WHERE DOC_TYPE = '" + tipo + "'");
            trans.executeSql(sql.join(""));
        }, function (error) {
            errorCallback({
                codigo: error.code,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: "Error al actualizar secuencia de documentos debido a: " + error.message
            });
        }, callback);
    };
    EncuestaServicio.prototype.prepararDatosParaGuardarEncuestaProcesadaACliente = function (encuesta, callback, errorCallback) {
        this.obtenerSecuenciaDeDocumento(TIpoDeDocumento.EncuestaDeCliente.toString(), function (serie, numero) {
            var preguntasAProcesar = encuesta.questions.filter(function (pregunta) {
                return pregunta.answersOfUser.length > 0;
            });
            if (preguntasAProcesar && preguntasAProcesar.length > 0) {
                var encuestaDeClienteAGuardar_1 = [];
                var fechaHora_1 = new Date();
                preguntasAProcesar.forEach(function (pregunta) {
                    var encuestaDeCliente;
                    if (pregunta.typeQuestion == TipoDePregunta.Multiple ||
                        pregunta.typeQuestion == TipoDePregunta.Unica) {
                        pregunta.answersOfUser.forEach(function (respuestaDeUsuario) {
                            encuestaDeCliente = new EncuestaDeCliente();
                            encuestaDeCliente.docSerie = serie;
                            encuestaDeCliente.docNum = numero;
                            encuestaDeCliente.codeRoute = gCurrentRoute;
                            encuestaDeCliente.codeCustomer = gClientID;
                            encuestaDeCliente.isPosted = 0;
                            encuestaDeCliente.createdDate = fechaHora_1;
                            encuestaDeCliente.postedDate = null;
                            encuestaDeCliente.gps = gCurrentGPS;
                            encuestaDeCliente.customerGps = "";
                            encuestaDeCliente.surveyId = encuesta.id;
                            encuestaDeCliente.surveyName = encuesta.name;
                            encuestaDeCliente.question = pregunta.question;
                            encuestaDeCliente.typeQuestion = pregunta.typeQuestion;
                            encuestaDeCliente.answer = respuestaDeUsuario.answer;
                            encuestaDeCliente.isFromDraft = encuesta.isFromDraft;
                            encuestaDeClienteAGuardar_1.push(encuestaDeCliente);
                        });
                    }
                    else {
                        encuestaDeCliente = new EncuestaDeCliente();
                        encuestaDeCliente.docSerie = serie;
                        encuestaDeCliente.docNum = numero;
                        encuestaDeCliente.codeRoute = gCurrentRoute;
                        encuestaDeCliente.codeCustomer = gClientID;
                        encuestaDeCliente.isPosted = 0;
                        encuestaDeCliente.createdDate = fechaHora_1;
                        encuestaDeCliente.postedDate = null;
                        encuestaDeCliente.gps = gCurrentGPS;
                        encuestaDeCliente.customerGps = "";
                        encuestaDeCliente.surveyId = encuesta.id;
                        encuestaDeCliente.surveyName = encuesta.name;
                        encuestaDeCliente.question = pregunta.question;
                        encuestaDeCliente.typeQuestion = pregunta.typeQuestion;
                        encuestaDeCliente.answer = pregunta.answersOfUser[0].answer;
                        encuestaDeCliente.isFromDraft = encuesta.isFromDraft;
                        encuestaDeClienteAGuardar_1.push(encuestaDeCliente);
                    }
                });
                callback(encuestaDeClienteAGuardar_1);
            }
            else {
                errorCallback({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: "No se han encontrado preguntas contestadas para procesar la encuesta actual. Por favor, verifique y vuelva a intentar."
                });
            }
        }, errorCallback);
    };
    EncuestaServicio.prototype.validateQuizByChannel = function (cliente, callback, errorCallback) {
        try {
            var sql_2 = [];
            sql_2.push("SELECT * FROM CHANNELS_BY_QUIZ");
            sql_2.push(" WHERE CODE_CHANNEL = '" + cliente.channel + "'");
            SONDA_DB_Session.transaction(function (trans) {
                trans.executeSql(sql_2.join(""), [], function (transResult, results) {
                    if (results.rows.length > 0) {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                });
            });
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                mensaje: "Error al validar las Microencuestas por canales " + error.message,
                resultado: ResultadoOperacionTipo.Error
            });
        }
    };
    EncuestaServicio.prototype.obtenerEncabezadoDeEncuestasPorCanal = function (cliente, callback, errorCallback) {
        var _this = this;
        try {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = [];
                sql.push("SELECT M.[ID], [NAME], [VALID_FROM], [VALID_TO]");
                sql.push(", [ORDER], [IS_REQUIRED], [APPLY_IN]");
                sql.push("FROM [MICROSURVEY] AS M ");
                sql.push("INNER JOIN [CHANNELS_BY_QUIZ] AS CBQ ");
                sql.push("ON(CBQ.QUIZ_ID = M.ID)");
                sql.push("LEFT JOIN CUSTOMER_SURVEY_HEADER AS CSH ");
                sql.push("ON(CSH.[SURVEY_ID] = M.[ID] AND CSH.[CODE_CUSTOMER] = '" + cliente.clientId + "') ");
                sql.push("WHERE CSH.[SURVEY_ID] IS NULL ");
                sql.push("AND CBQ.CODE_CHANNEL = '" + cliente.channel + "'");
                sql.push("ORDER BY M.[ORDER] ASC");
                tx.executeSql(sql.join(""), [], function (txResult, results) {
                    var encuestasAsignadas = [];
                    if (results.rows.length > 0) {
                        for (var index = 0; index < results.rows.length; index++) {
                            var encuestaTemp = results.rows.item(index);
                            var encuesta = new Microencuesta();
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
                        sql.push("SELECT [ID], [NAME], [VALID_FROM], [VALID_TO]");
                        sql.push(", [ORDER], [IS_REQUIRED], [APPLY_IN], [CHANNELS_ON_QUIZ]");
                        sql.push("FROM MICROSURVEY AS M ");
                        sql.push("LEFT JOIN CUSTOMER_SURVEY_HEADER AS CSH ");
                        sql.push("ON(CSH.[SURVEY_ID] = M.[ID] AND CSH.[CODE_CUSTOMER] = '" + cliente.clientId + "') ");
                        sql.push("WHERE CSH.[SURVEY_ID] IS NULL ");
                        sql.push(" AND [M].[CHANNELS_ON_QUIZ] IN (1, 3) ");
                        sql.push("ORDER BY M.[ORDER] ASC");
                        txResult.executeSql(sql.join(""), [], function (txResult, results) {
                            var encuestasAsignadasPorRuta = [];
                            if (results.rows.length > 0) {
                                var _loop_1 = function (index) {
                                    var encuestaTemp = results.rows.item(index);
                                    var encuesta = new Microencuesta();
                                    encuesta.id = encuestaTemp.ID;
                                    encuesta.name = encuestaTemp.NAME;
                                    encuesta.validDateFrom = new Date(encuestaTemp.VALID_FROM);
                                    encuesta.validDateTo = new Date(encuestaTemp.VALID_TO);
                                    encuesta.order = encuestaTemp.ORDER;
                                    encuesta.isMandatory = encuestaTemp.IS_REQUIRED;
                                    encuesta.applyIn = encuestaTemp.APPLY_IN;
                                    encuesta.channelsOnQuiz = encuestaTemp.CHANNELS_ON_QUIZ;
                                    if (encuesta.channelsOnQuiz === 1) {
                                        encuestasAsignadasPorRuta.push(encuesta);
                                    }
                                    else {
                                        var resultadoDeBusqueda = encuestasAsignadas.find(function (encuestaABuscar) {
                                            return (encuestaABuscar.id === encuesta.id);
                                        });
                                        if (resultadoDeBusqueda) {
                                            encuestasAsignadasPorRuta.push(encuesta);
                                        }
                                    }
                                };
                                for (var index = 0; index < results.rows.length; index++) {
                                    _loop_1(index);
                                }
                                _this.obtenerPreguntasDeEncuesta(txResult, encuestasAsignadasPorRuta, 0, callback, errorCallback);
                            }
                            else {
                                _this.obtenerPreguntasDeEncuesta(txResult, encuestasAsignadas, 0, callback, errorCallback);
                            }
                        }, function (txResult, error) {
                            errorCallback({
                                codigo: error.code,
                                resultado: ResultadoOperacionTipo.Error,
                                mensaje: error.message
                            });
                        });
                    }
                    else {
                        callback(encuestasAsignadas);
                    }
                }, function (txResult, txError) {
                    errorCallback({
                        codigo: txError.code,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: txError.message
                    });
                });
            }, function (txError) {
                errorCallback({
                    codigo: txError.code,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: txError.message
                });
            });
        }
        catch (error) {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: error.message
            });
        }
    };
    return EncuestaServicio;
}());
//# sourceMappingURL=EncuestaServicio.js.map