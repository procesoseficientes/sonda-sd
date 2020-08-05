
var DispositivoServicio = {

    TomarFoto: function (callback, errCallback) {
        navigator.camera.getPicture(function (imageUri) {
            callback(imageUri);
        }, function (message) {
            errCallback(message);
        }, {
            quality: 90,
            targetWidth: 350,
            targetHeight: 350,
            saveToPhotoAlbum: false,
            sourceType: navigator.camera.PictureSourceType.CAMERA,
            correctOrientation: true,
            destinationType: Camera.DestinationType.DATA_URL
        });
    }

    , obtenerUbicacion: function(callback) {
        navigator.geolocation.getCurrentPosition(function (position) {
            navigator.notification.activityStop();
            gGPSPositionIsAvailable = true;
            gCurrentGPS = position.coords.latitude + "," + position.coords.longitude;
            $("#myCurrentGPS").text(gCurrentGPS);
            callback();
        },function (error) {
            window.navigator.notification.activityStop();
            gGPSPositionIsAvailable = false;
            $("#myCurrentGPS").text("GPS is unable at this moment");
            ToastThis("Error al obtener ubicación: " + error.message);
            gCurrentGPS = "0,0";
            callback();
        }, { maximumAge: 30000, timeout: 15000, enableHighAccuracy: true });
    }


}