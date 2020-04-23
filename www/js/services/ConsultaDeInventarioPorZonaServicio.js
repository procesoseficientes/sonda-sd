var ConsultaDeInventarioPorZonaServicio = (function () {
    function ConsultaDeInventarioPorZonaServicio() {
    }
    ConsultaDeInventarioPorZonaServicio.prototype.consultarInventarioDeSkuPorZona = function (socketIo, codigoSku, errorCallBack) {
        try {
            var data = {
                'sku': codigoSku,
                'dbuser': gdbuser,
                'dbuserpass': gdbuserpass,
                'routeid': gCurrentRoute
            };
            socketIo.emit("GetInventoryForSkuByZone", data);
        }
        catch (e) {
            var operacion = new Operacion();
            operacion.codigo = -1;
            operacion.mensaje = e.message;
            operacion.resultado = ResultadoOperacionTipo.Error;
            errorCallBack(operacion);
            operacion = null;
        }
    };
    return ConsultaDeInventarioPorZonaServicio;
}());
//# sourceMappingURL=ConsultaDeInventarioPorZonaServicio.js.map