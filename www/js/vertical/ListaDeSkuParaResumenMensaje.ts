class ListaDeSkuParaResumenMensaje {
    listaSku: Sku[];
    listaDeSkuParaBonificacion = Array<Sku>();
    listaDeSkuParaBonificacionDeCombo = Array<BonoPorCombo>();
    usuarioPuedeModificarBonificacionDeCombo: boolean;
    constructor(public sender: any) { }
}