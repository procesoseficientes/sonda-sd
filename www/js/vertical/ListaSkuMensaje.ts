
class ListaSkuMensaje {
    listaSku: Sku[];
    listaDeSkuParaBonificacion = Array<Sku>();
    listaDeSkuParaBonificacionDeCombo = Array<BonoPorCombo> ();
    usuarioPuedeModificarBonificacionDeCombo: boolean;
    listaDeSkuParaBonificacionPorMontoGeneral: Array<BonoPorMontoGeneral> = new Array<BonoPorMontoGeneral>();
    constructor(public sender: any) { }
}