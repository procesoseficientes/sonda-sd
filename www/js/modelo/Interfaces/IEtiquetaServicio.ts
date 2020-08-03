interface IEtiquetaServicio {
    obtenerEtiquetas(callback: (estiquetas: Etiqueta[]) => void, errCallback: (resultado: Operacion) => void): void;

    guardarEtiquetasDeCliente(cliente: Cliente, callback: (cliente: Cliente) => void, errCallback: (resultado: Operacion) => void): void;

    agregarEtiqueta(etiqueta: any): void;
}