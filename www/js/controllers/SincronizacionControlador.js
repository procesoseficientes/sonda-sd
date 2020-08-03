var SincronizacionControlador = {
    DelegarSincronizacionControlador: function() {
        $("#UiBtnSynDeviceOnServer").on("click", function() {
            if (gIsOnline == EstaEnLinea.Si) {
                SincronizacionControlador.SincronizarDispositivoHaciaServidor();
            } else {
                console.log("Por favor, asegurese de tener conexión hacia el servidor.");
                notify("Por favor, asegurese de tener conexión hacia el servidor.");
            }
        });
    }
    ,
    SincronizarDispositivoHaciaServidor: function () {
        console.log("SINCRONIZANDO INFORMACION DEL DISPOSITIVO");
        EnviarData();
    }
}