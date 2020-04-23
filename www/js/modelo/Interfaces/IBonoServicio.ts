interface IBonoServicio {

    obtenerBonificacionPorEscalaPorCliente(cliente: Cliente, sku: Sku, callback: (listaDeBonos: Array<Bono>) => void, callbackError: (resultado: Operacion) => void, indiceDeListaSku?: number): void;

    obtenerListaDeSkuParaBonoficaciones(cliente: Cliente, listaDeSku: Array<Sku>, callback: (listaDeSkuParaBonificaciones: Array<Sku>) => void, callbackError: (resultado: Operacion) => void): void;

    limpiarTablaDeBonificacionesPorMultiplo(callBack: () => void, errorCallBack: (resultado: Operacion) => void): void;

    agregarBonificacionPorMultiplo(bonificacion: any, callBack: () => void, errorCallBack: (resultado: Operacion) => void): void;

    obtenerBonoPorMultiploPorCliente(cliente: Cliente, sku: Sku, callback: (listaDeBonos: Array<Bono>) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerBonificacionesPorCombo(bonoPorCombos: Array<BonoPorCombo>, listaDeSku: Array<Sku>, callback: (bonificacionPorCombosEnListaDeSkus: Array<BonoPorCombo>) => void, callbackError: (resultado: Operacion) => void): void;
    

    insertParaBonificacionesNormalesAlDraft(id: number, codigoDeRuta: string, cliente: Cliente, bonosNormales: Sku[], bonosPorCombo: BonoPorCombo[], callback: (bonosNormales: Sku[], bonosPorCombo: BonoPorCombo[]) => void,
        errCallback: (resultado: Operacion) => void): void;

    insertParaBonificacionesPorComboAlDraft(id: number, codigoDeRuta: string, cliente: Cliente, bonosNormales: Sku[], bonosPorCombo: BonoPorCombo[], callback: (bonosNormales: Sku[], bonosPorCombo: BonoPorCombo[]) => void,errCallback: (resultado: Operacion) => void): void;
    
    obtnerBonificacionUnida(id: number, callback: (bonosFinales: Array<Sku>) => void, errCallback: (resultado: Operacion) => void): void;

    unirListaDeBonificaionesNormalConListaDeBonificacionPorCombo(id: number, codigoDeRuta: string, cliente: Cliente, bonosNormales: Array<Sku>, bonosPorCombo: Array<BonoPorCombo>, callback: (bonosFinales: Array<Sku>) => void, errCallback: (resultado: Operacion) => void): void;
}