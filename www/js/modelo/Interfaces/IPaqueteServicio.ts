/// <reference path="../entidades/sku.ts" />
/// <reference path="../entidades/paqueteconversion.ts" />
/// <reference path="../entidades/paquete.ts" />
/// <reference path="../entidades/operacion.ts" />

interface IPaqueteServicio {

    obtenerDenominacionesPorSku(sku: Sku, configuracionDecimales: ManejoDeDecimales, cliente: Cliente, puedeEspecificarUm: boolean, callback: (paquetes: Paquete[]) => void, callbackError: (resultado: Operacion) => void);

    obtenerConversionDePaquetes(sku: Sku, configuracionDecimales: ManejoDeDecimales, callback: (paquetesConversion: PaqueteConversion[]) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerConversionDePaquete(sku: Sku, paquetes: Paquete[], index, configuracionDecimales: ManejoDeDecimales, callback: (paqueteConversion: PaqueteConversion, paquetes: Paquete[], index: number) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerDenominacionPorSku(sku: Sku, indiceDeLista: number, callback: (listaPaquete: Paquete[], indiceDeLista: number) => void, callbackError: (resultado: Operacion) => void): void;
}