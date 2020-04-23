interface IEncuestaServicio {
  obtenerEncuestas(
    cliente: Cliente,
    callback: (encuestas: Microencuesta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void;

  obtenerEncabezadoDeEncuestas(
    cliente: Cliente,
    callback: (encuestas: Microencuesta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void;

  obtenerPreguntasDeEncuesta(
    sqliteTransaction: SqlTransaction,
    encuestas: Microencuesta[],
    numeroDeEncuestaActual: number,
    callback: (encuestas: Microencuesta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void;

  obtenerRespuestasParaPreguntaDeEncuesta(
    sqliteTransaction: SqlTransaction,
    preguntas: Pregunta[],
    numeroDePreguntaActual: number,
    callback: (preguntasConRespuesta: Pregunta[]) => void,
    errorCallback: (error: Operacion) => void
  ): void;

  guardarEncuestaProcesadaACliente(
    encuestaDeCliente: EncuestaDeCliente[],
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ): void;

  obtenerEncuestasNoSincronizadas(
    callback: (encuestasPendientesDeSincronizar: EncuestaDeCliente[]) => void
  ): void;

  actualizarEstadoDePosteoDeEncuesta(data: any): void;

  obtenerFormatoSqlDeInsercionDeEncuestaProcesadaACliente(
    encuestaDeCliente: EncuestaDeCliente
  ): string;

  obtenerFormatoDeInsercionDeEncabezadoDeEncuestaDeCliente(
    encuestaDeCliente: EncuestaDeCliente
  ): string;

  procesarEncuestasDeCliente(
    encuestas: Microencuesta[],
    numeroDeEncuestaActual: number,
    isFromDraft: boolean,
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ): void;

  prepararDatosParaGuardarEncuestaProcesadaACliente(
    encuesta: Microencuesta,
    callback: (encuestaDeCliente: EncuestaDeCliente[]) => void,
    errorCallback: (error: Operacion) => void
  ): void;

  obtenerSecuenciaDeDocumento(
    tipoDeSecuencia: string,
    callback: (serie: string, numero: number) => void,
    errorCallback: (error: Operacion) => void
  ): void;

  actualizarSecuenciaDeDocumentos(
    tipo: string,
    numero: number,
    callback: () => void,
    errorCallback: (error: Operacion) => void
  ): void;

  filtrarEncuestasPorDisparador(
    encuestas: Microencuesta[],
    disparadorDeEncuesta: DisparadorDeEncuesta
  ): Array<Microencuesta>
}
