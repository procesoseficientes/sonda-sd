interface ITareaServicio {

    actualizarTareaEstado(tarea: Tarea, callback: () => void, callbackError: (reultado: Operacion) => void):void;

    enviarTareaAceptada(tarea: Tarea, callbackError: (reultado: Operacion) => void): void;

    obtenerRegla(pTipo: string, callback: (listaDeReglas: Regla[]) => void, callbackError: (reultado: Operacion) => void):void;

    obtenerTarea(tarea: Tarea, callback: (tarea: Tarea) => void, errCallBack: (resultado: Operacion) => void): void;

    obtenerTareasDeCliente(cliente: Cliente, callback: (listaDeTareas: Tarea[]) => void, errCallBack: (resultado: Operacion) => void): void;

    actualizarClienteTarea(tareaId, idCliente, nombreCliente, direccionCliente, callback: () => void, callbackError: (reultado: Operacion) => void): void;

    obtenerTareaBo(tarea: Tarea, callback: (tarea: Tarea) => void, callbackError: (resultado: Operacion) => void);

    verificarTareaPosteada(idTarea: number, callBack: (isPosted: number) => void, errorCallBack: (resultado: Operacion) => void): void;
}