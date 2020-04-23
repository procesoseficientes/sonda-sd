interface IDescuentoServicio {
    obtenerDescuentosPorCliente(cliente: Cliente, callback: (listaDeDescuentos: Array<Descuento>) => void, callbackError: (resultado:Operacion) => void): void;
}