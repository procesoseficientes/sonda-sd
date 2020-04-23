interface IVentasPorMultiploServicio {

    verificarVentasPorMultiploSkuUm(cliente: Cliente, sku: Sku, callBack: (skuMultiplo: VentaPorMultiplo) => void, errorCallBack: (operacion: Operacion) => void): void;

    validarSiTieneVentaPorMultiplo(cliente: Cliente, sku: Sku, paquete: Paquete, control: any, callback: (tiene: boolean, paqueteN1: Paquete, controlN1: any) => void, errCallback: (resultado: Operacion) => void): void;

    obtenerVentaPorMultiploDeSkuConUnidadDeMedida(cliente: Cliente, sku: string, unidadDeMedida: string, control: any, callback: (multiplo: number, controlN1: any) => void, errCallback: (resultado: Operacion) => void): void;
       
}