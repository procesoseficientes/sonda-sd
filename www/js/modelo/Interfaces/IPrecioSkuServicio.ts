/// <reference path="../entidades/sku.ts" />
/// <reference path="../entidades/paqueteconversion.ts" />
/// <reference path="../entidades/paquete.ts" />
/// <reference path="../entidades/Cliente.ts" />
/// <reference path="../entidades/operacion.ts" />

interface IPrecioSkuServicio {
    obtenerPreciosDePaquetes(cliente: Cliente, sku: Sku, paquetes: Paquete[],decimales:ManejoDeDecimales, callback: (paquetes: Paquete[]) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerPrecioDePaquete(cliente: Cliente, sku: Sku, paquete: Paquete, index: number, decimales:ManejoDeDecimales,callback: (paquete: Paquete, index: number) => void, callbackError: (resultado: Operacion) => void): void;
}