/// <reference path="../entidades/cliente.ts" />
/// <reference path="../tiposyestados/tipos.ts" />

interface IClienteServicio {

    obtenerCliente(cliente: Cliente, configuracionDecimales: ManejoDeDecimales, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerListaDePrecioPorCliente(cliente: Cliente, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerCuentaCorriente(cliente: Cliente, configuracionDecimales: ManejoDeDecimales, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerSiTieneFacturasVenciadas(cliente: Cliente, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerLimiteDeCredito(cliente: Cliente, configuracionDecimales: ManejoDeDecimales,callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerSiTieneDiasDeCreditoVencidos(cliente: Cliente, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerSaldoActual(cliente: Cliente, configuracionDecimales: ManejoDeDecimales,callback: (cliente: Cliente) => void, callbackError: (reultado: Operacion) => void): void;

    validarDatosGeneralesCuentaCorriente(cliente: Cliente, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    validarCuentaCorriente(cliente: Cliente, listasku: Sku[], ordenDeVentaTipo: any, configuracionDecimales: ManejoDeDecimales,callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    enviarSolicitudParaObtenerCuentaCorriente(socketIo:SocketIOClient.Socket,cliente: Cliente, opcionValidarSaldoCliente: string, ordenDeVentaTipo: string, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerEtiquetas(cliente: Cliente, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;
    
    guardarCambiosDeCliente(cliente: Cliente, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void): void;

    obtnerFormatoSqlDeInsertarClienteModificado(cliente: Cliente, sequence: string): string;

    obtenerEtiquetasNoAsociadasAlCliente(cliente: Cliente, callback: (etiquetas: Etiqueta[]) => void, callbackError: (resultado: Operacion) => void): void;

    obtenerClienteBo(cliente: Cliente, callback: (cliente: Cliente) => void, callbackError: (resultado: Operacion) => void);
    
}