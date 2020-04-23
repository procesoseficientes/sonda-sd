class ConsultaDeInventarioPorZonaServicio {
    consultarInventarioDeSkuPorZona(socketIo:SocketIOClient.Socket,codigoSku: string, errorCallBack: (resultado: Operacion) => void) {
        try {
            const data = {
                'sku': codigoSku,
                'dbuser': gdbuser,
                'dbuserpass': gdbuserpass,
                'routeid': gCurrentRoute
            };
            socketIo.emit("GetInventoryForSkuByZone", data);
        } catch (e) {
            let operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = e.message;
            operacion.resultado = ResultadoOperacionTipo.Error;
            errorCallBack(operacion);
            operacion = null;
        }
    }
}