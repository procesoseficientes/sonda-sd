interface IPromoServicio {
    obtenerHistoricoDePromosParaCliente(cliente: Cliente, callback: (listaHistoricoDePromos: Promo[]) => void, callbackError: (resultado: Operacion) => void): void;

    insertarHistoricoDePromo(promo: Promo, callback: () => void, callbackError: (resultado: Operacion) => void): void;

    obtenerFechaParaCompararLaPromo(diasARestar: number, callback: (fecha: Date) => void, callbackError: (resultado: Operacion) => void): void;

    validarSiAplicaPromo(promo: Promo, promoHistorico: Promo, callback: (aplicarPromo: boolean) => void, callbackError: (resultado: Operacion) => void):void;
}