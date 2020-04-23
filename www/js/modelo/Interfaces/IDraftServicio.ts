/// <reference path="../entidades/sku.ts" />
/// <reference path="../entidades/operacion.ts" />
/// <reference path="../entidades/OrdenDeVenta.ts" />
/// <reference path="../entidades/OrdenDeVentaDetalle.ts" />
/// <reference path="../entidades/Factura.ts" />
/// <reference path="../entidades/FacturaDetalle.ts" />

interface IDraftServico {
    obtenerDraftsOrdenDeVenta(callback: (ordenes: OrdenDeVenta[]) => void, callbackError: (resultado: Operacion) => void);

    obtenerDraftDeFacturas(callback: (facturas: Factura[]) => void, callbackError: (resultado: Operacion) => void);
}