interface IClienteServicio {
    guardarScouting(scouting: Cliente, callbak: () => void, errCallback: (resultado: Operacion) => void): void;

    obtenerClientesConEtiquetasNoSincronizados(callback: (clientes: Cliente[]) => void, errCallback: (resultado: Operacion) => void): void;

    obtenerEtiquetasPorCliente(txResult: SqlTransaction, cliente: Cliente, indice: number, callback: (cliente: Cliente) => void, errCallback: (resultado: Operacion) => void): void;
    
    marcarClienteComoSincronizado(clientes: any, callback: () => void, errCallback: (resultado: Operacion) => void): void;

    obtenerFormatoDeInsercionDeClienteNuevo(cliente: Cliente, callback: (formatoInsercion: string) => void): string;

    obtenerFormatoDeInsercionDeEtiquetaDeClienteNuevo(cliente: Cliente, etiqueta: Etiqueta): string;

    obtenerClientesParaValidacionEnBo(obtenerTodosLosClientes: boolean,callback: (clientes: Cliente[]) => void, errorCallback: (resultado: Operacion) => void): void;

    cambiarEstadoAClientesParaReenviar(clientes: any, callback:()=>void,errorCallback:(resultado: Operacion)=>void): void;
}