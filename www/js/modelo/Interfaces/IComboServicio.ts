interface IComboServicio {

    obtenerSkusDeCombo(bonoPorCombo: BonoPorCombo, callback: (bonoPorComboConSkusDeCombo: BonoPorCombo) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerSkusDeComboParaBonificar(bonoPorCombo: BonoPorCombo, callback: (bonoPorComboConSkusDeBonificacion: BonoPorCombo) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerReglasDeBonificacionDeCombosPorCliente(cliente: Cliente, callback: (clienteConCombos: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerCombosPorCliente(cliente: Cliente, callback: (clienteConCombos: Cliente) => void, callbackError: (resultado: Operacion) => void): void;
}