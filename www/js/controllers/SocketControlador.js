var SocketControlador = (function () {
    function SocketControlador() {
    }
    SocketControlador.establecerConexionConServidor = function (direccionDeServidor) {
        SocketControlador.socketIo = io(direccionDeServidor);
    };
    SocketControlador.cerrarConexionConServidor = function () {
        SocketControlador.vieneDeDesconexion = true;
        SocketControlador.socketIo.close();
        SocketControlador.socketIo.removeAllListeners();
    };
    SocketControlador.vieneDeDesconexion = false;
    return SocketControlador;
}());
//# sourceMappingURL=SocketControlador.js.map