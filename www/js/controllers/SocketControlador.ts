class SocketControlador {
    static socketIo: SocketIOClient.Socket;
    static vieneDeDesconexion: boolean = false;

    static establecerConexionConServidor(direccionDeServidor: string) {
        SocketControlador.socketIo = io(direccionDeServidor);
    }

    static cerrarConexionConServidor() {
        SocketControlador.vieneDeDesconexion = true;
        SocketControlador.socketIo.close();
        SocketControlador.socketIo.removeAllListeners();
    }

}