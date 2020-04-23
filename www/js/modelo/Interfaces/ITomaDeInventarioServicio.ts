interface ITomaDeInventarioServicio {

    insertarTomaDeInventario(tomaInventario: TomaInventario, callback: () => void, callbackError: (resultado: Operacion) => void): void;

    obtenerFormatoSqlDeInsertarTomaDeInventarioEncabezado(tomaInventario: TomaInventario): string;

    obtenerFormatoSqlDeInsertarTomaDeInventarioDetalle(tomaInventarioDetalle: TomaInventarioDetalle): string;

    obtenerTomaDeInventarioPorTarea(tarea: Tarea, decimales: ManejoDeDecimales, callback: (tomaDeInventario: TomaInventario) => void, errCallBack: (resultado: Operacion) => void): void;

    obtenerTomaDeInventarioDetalle(tomaDeInventario: TomaInventario, decimales: ManejoDeDecimales, callback: (tomaDeInventario: TomaInventario) => void, errCallBack: (resultado: Operacion) => void): void;
}
