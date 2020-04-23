var _capturaCallback;
var _haFirmado = false;
var _firma = '';
var _foto = '';
var _almohadilla;
var _opcion;
var _paginaDeRetorno = "";
var _fotostomadas = 0;


function DelegarACapturaDeFirma() {
    $("#uiLimpiarFirma").bind("touchstart", function () { UsuarioDeseaLimpiarFirma(); });

    $("#uiTomarFoto").bind("touchstart", function () {
        cordova.plugins.diagnostic.isCameraAuthorized(function (enabled) {
            if (enabled) {
                UsuarioDeseaTomarFoto();
            } else {
                cordova.plugins.diagnostic.requestCameraAuthorization(function(authorization) {
                    if (authorization === "DENIED") {
                        cordova.plugins.diagnostic.switchToSettings(function() {
                            ToastThis("Debe autorizar el uso de la Cámara para poder capturar la Imágen.");
                        }, function(error) {
                            notify(error);
                        });
                    } else if (authorization === "GRANTED") {
                        UsuarioDeseaTomarFoto();
                    } else {
                        cordova.plugins.diagnostic.switchToSettings(function () {
                            ToastThis("Debe autorizar el uso de la Cámara para poder capturar la Imágen.");
                        }, function (error) {
                            notify(error);
                        });
                    }
                },function(error) {
                    notify(error);
                });
            }
        }, function (error) {
            notify(error);
        });
    });

    $("#uiGuardarFoto").bind("touchstart", function () {
        EstaGpsDesavilitado(function () {
            UsuarioDeseaGuardarFotografia();
        });
    });
}

function UsuarioDeseaLimpiarFirma() {
    _almohadilla.clear();
}

function UsuarioDeseaGuardarFotografia() {
    try {
        var validar = true;
        switch (_opcion) {
            case "FIRMA":
                if (_almohadilla.isEmpty()) {
                    notify("ERROR, Por favor proceda a firmar.");
                    _haFirmado = false;
                    validar = false;
                }
                break;
            case "FOTO":
                if (_foto === '') {
                    notify("ERROR, Por favor tome la foto.");
                    validar = false;
                }
                break;
            case "AMBOS":
                if (_almohadilla.isEmpty() || _foto === '') {
                    notify("ERROR, Por favor proceda a firmar y tomar la foto.");
                    validar = false;
                }
                if (_almohadilla.isEmpty()) {
                    _haFirmado = false;
                }
                break;
            case "NINGUNO":
                //----
                break;
        }

        if (validar) {
            _haFirmado = true;
            if (!_almohadilla.isEmpty()) {
                _firma = _almohadilla.toDataURL();
            }
            _capturaCallback(_firma, _foto);

        }
    } catch (e) {
        notify(e.message);
    }
}

function UsuarioDeseaTomarFoto() {
    navigator.camera.getPicture
   (
       function (imageUri) {
           $("#uiFotoTomada").attr('src', "data:image/jpeg;base64," + imageUri);
           $("#uiDivFotoTomada").css("visibility", "visible");
           _foto = imageUri;
           _fotostomadas = _fotostomadas + 1;
       },
       function (message) {
           console.log(message);
       },
       {

           quality: 90,
           targetWidth: 350,
           targetHeight: 350,
           saveToPhotoAlbum: false,
           sourceType: navigator.camera.PictureSourceType.CAMERA,
           correctOrientation: true,
           destinationType: Camera.DestinationType.DATA_URL
           
       }
   );
}

function MostrarCapturaDeFirmaYFoto(opcion, callback) {
    _capturaCallback = callback;
    _opcion = opcion;
    _haFirmado = false;
    var canvas = document.querySelector("canvas[core]");
    $("#uiFotoTomada").attr('src', "");
    _foto = '';
    _firma = '';
    _fotostomadas = 0;
    _almohadilla = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 2,
        penColor: "rgb(64, 64, 64)"
    });

    $.mobile.changePage('#uiCaputarDeFirmaYFoto', 'flow', true, true);
}