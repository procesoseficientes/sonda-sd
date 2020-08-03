interface IEntregaServicio {
    realizarLlamadaTelefonica(tarea: Tarea, callback: () => void, errCallback: (resultado: Operacion) => void): void;

    tomarFotografiaEntrega(callback: (fotografia) => void, errCallback: (resultado: Operacion) => void): void;

    navegarHaciaCliente(cliente: Cliente, callback: () => void, errCallback: (resultado: Operacion) => void): void;

    obtenerDocumentosParaEntrega(tarea: Tarea, callback: (documentosAEntregar: any) => void,errorCallback: (error: Operacion) => void): void;
}