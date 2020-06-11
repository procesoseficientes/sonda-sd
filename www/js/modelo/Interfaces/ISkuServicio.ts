interface ISkuServicio {

    obtenerSkuParaVenta(cliente: Cliente, sku: Sku, configuracionDecimales: ManejoDeDecimales, callback: (listaSkus: Sku[]) => void, callbackError: (reultado: Operacion) => void): void;

    obtenerSkuParaPreVenta(cliente: Cliente, sku: Sku, configuracionDecimales: ManejoDeDecimales, opcionDeOrdenamiento: string, tipoDeOrdenamiento: string, callback: (listaSkus: Sku[]) => void, callbackError: (reultado: Operacion) => void): void;

    obtenerFamiliaSku(callback: (results: any) => void, callbackError: (reultado: Operacion) => void):void;
}