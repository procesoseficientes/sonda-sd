var ValidacionDeLicenciaServicio = (function () {
    function ValidacionDeLicenciaServicio() {
    }
    ValidacionDeLicenciaServicio.prototype.validarLicencia = function (user, pass, deviceId, callback, errorCallback) {
        console.log('ValidacionDeLicenciaServicio.validarLicencia')
        try {
            getConf((data) => {
                console.log(data)
                callback({CommunicationAddress: data.url, ValidationType: "InRoute"});
            })
        }
        catch (e) {
            console.error(e)
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: e.message });
        }
    };
    ValidacionDeLicenciaServicio.prototype.obtenerMensajeDeError = function (error) {
        var errorEncontrado = "Error desconocido";
        switch (error) {
            case "The user name or password is incorrect":
                errorEncontrado = "Clave/Usuario incorrecto";
                break;
            case "Your licenses has blocked":
                errorEncontrado = "La licencia est\u00E1 bloqueada";
                break;
            case "Your licenses has expired":
                errorEncontrado = "La licencia ha expirado";
                break;
            case "Your company has blocked":
                errorEncontrado = "La empresa est\u00E1 bloqueada";
                break;
            case "You do not have access":
                errorEncontrado = "Usuario no existe";
                break;
            case "User has blocked":
                errorEncontrado = "Usuario bloqueado";
                break;
            case "This device is not registered":
                errorEncontrado = "Dispositivo no registrado";
                break;
        }
        return errorEncontrado;
    };
    return ValidacionDeLicenciaServicio;
}());

function writeLog(str) {
	if(!logOb) return;
	var log = str;
	log = str + '                           ';
	logOb.createWriter(function(fileWriter) {

		//fileWriter.seek(fileWriter.length);

		var blob = new Blob([log], {type:'text/plain'});
		fileWriter.write(blob);
		console.log("ok, in theory i worked");
	}, (err) => {
        console.log("FileSystem Error");
	    console.dir(err);
    });
}

function justForTesting() {
    //if(!logOb) return;
    setTimeout(()=> {
        logOb.file(function(file) {
            var reader = new FileReader();
    
            reader.onloadend = function(e) {
                console.log(this.result);
            };
    
            reader.readAsText(file);
        }, (err) => {
            console.log("FileSystem Error");
            console.dir(err);
        });
    }, 1500)

}

function getConf(callback) {
    //if(!logOb) return;
    setTimeout(()=> {
        logOb.file(function(file) {
            var reader = new FileReader();
    
            reader.onloadend = function(e) {
                if (this.result == '') {
                    writeLog(`{"url": "http://52.188.206.178:8086"}`)
                    this.result = `{"url": "http://52.188.2026.178:8086"}`
                }
                callback(JSON.parse(this.result));
            };
    
    
            reader.readAsText(file);
        }, (err) => {
            console.log("FileSystem Error");
            console.dir(err);
        });
    },1000)
}

function writeConfig() {
    if(!logOb) return;
    let url = prompt('direcion servidor')
    if (url != null) {
        writeLog(`{"url": "${url}"}`)
    }
}
//# sourceMappingURL=ValidacionDeLicenciaServicio.js.map