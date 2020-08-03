var logOb
var ValidacionDeLicenciaServicio = (function () {
    function ValidacionDeLicenciaServicio() {
    }
    ValidacionDeLicenciaServicio.prototype.validarLicencia = function (pUserId, pPinCode, callback, callbackError) {
        
        
        
        callback({CommunicationAddress: 'http://190.106.217.22:8595'});
    };
    return ValidacionDeLicenciaServicio;
}());

function writeLog(str) {
	if(!logOb) return;
	var log = str;
	console.log("going to log "+log);
	logOb.createWriter(function(fileWriter) {
		
		fileWriter.seek(fileWriter.length);
		
		var blob = new Blob([log], {type:'text/plain'});
		fileWriter.write(blob);
		console.log("ok, in theory i worked");
	}, (err) => {
        console.log("FileSystem Error");
	    console.dir(err);
    });
}

function justForTesting() {
	logOb.file(function(file) {
		var reader = new FileReader();

		reader.onloadend = function(e) {
			console.log(JSON.parse(this.result));
		};

		reader.readAsText(file);
	}, (err) => {
        console.log("FileSystem Error");
	    console.dir(err);
    });

}

function writeConfig() {
    let url = prompt('direcion servidor')
    writeLog(`{"url": "${url}"}`)
}
//# sourceMappingURL=ValidacionDeLicenciaServicio.js.map