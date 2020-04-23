/// <reference path="../entidades/HistoricoDeArticulo.ts" />
/// <reference path="../entidades/Cliente.ts" />
/// <reference path="../entidades/operacion.ts" />

interface IHistoricoDeArticuloServicio {
    obtenerHistoricoDeArticuloParaCliente(tipoDeDocumento: TIpoDeDocumento, cliente: Cliente, callback: (historicoDeArticulos: HistoricoDeArticulo[]) => void, callbackError: (reultado: Operacion) => void): void;

    colocarSugerenciaDeVentaAPaquetes(tipoDeDocumento: TIpoDeDocumento,cliente: Cliente, sku: Sku, paquetes: Paquete[], decimales: ManejoDeDecimales, callback: (paquetes: Paquete[]) => void, callbackError: (resultado: Operacion) => void): void;

    colocarSugerenciaDeVentaAPaquete(tipoDeDocumento: TIpoDeDocumento,cliente: Cliente, sku: Sku, paquete: Paquete, index: number, decimales: ManejoDeDecimales, callback: (paquete: Paquete, index: number) => void, callbackError: (resultado: Operacion) => void): void;
}