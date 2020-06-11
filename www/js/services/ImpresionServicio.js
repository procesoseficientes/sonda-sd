var ImpresionServicio = (function () {
    function ImpresionServicio() {
    }
    ImpresionServicio.prototype.validarEstadosYImprimir = function (esImpresoZebra, macAddress, documento, tambienImprimir, callback) {
        if (esImpresoZebra) {
            this.validarYimprimir(macAddress.split(":").join(""), documento, tambienImprimir, function (resultado) {
                callback(resultado);
            });
        }
        else {
            if (tambienImprimir) {
                ConectarImpresora(macAddress, function () {
                    documento += '! U1 getvar "device.host_status"\r\n';
                    ImprimirDocumento(documento, function () {
                        DesconectarImpresora(function (result) {
                            callback({ resultado: ResultadoOperacionTipo.Exitoso, codigo: 1, mensaje: "Exitoso" });
                        }, function (err) {
                            callback({ resultado: ResultadoOperacionTipo.Error, codigo: -1, mensaje: " " + err });
                        });
                    }, function (err) {
                        callback({ resultado: ResultadoOperacionTipo.Error, codigo: -1, mensaje: " " + err });
                    });
                });
            }
            else {
                callback({ resultado: ResultadoOperacionTipo.Exitoso, codigo: 1, mensaje: "Exitoso" });
            }
        }
    };
    ImpresionServicio.prototype.validarYimprimir = function (macAddress, documento, tambienImprimir, callback) {
        var _this = this;
        window.linkOsPlugin.disconnect();
        window.linkOsPlugin.connect(macAddress).then(function (result) {
            window.linkOsPlugin.getStatus(macAddress, true).then(function (result) {
                if (result.isReadyToPrint) {
                    if (tambienImprimir) {
                        window.linkOsPlugin.printCPCL(documento).then(function (result) {
                            window.linkOsPlugin.disconnect();
                            callback({ resultado: ResultadoOperacionTipo.Exitoso, codigo: 1, mensaje: "Exitoso" });
                        }, function (err) {
                            window.linkOsPlugin.disconnect();
                            navigator.notification.confirm("Error: " + _this.obtenerMensajeTraducido(err.message) + " ¿Desea intentarlo nuevamente?", function (respuesta) {
                                if (respuesta === 2) {
                                    _this.validarYimprimir(macAddress, documento, tambienImprimir, callback);
                                }
                                else {
                                    callback({ resultado: ResultadoOperacionTipo.Error, codigo: -1, mensaje: "Get printer status failed: " + err });
                                }
                            }, "Sonda\u00AE " + SondaVersion, "No,Si");
                        });
                    }
                    else {
                        window.linkOsPlugin.disconnect();
                        callback({ resultado: ResultadoOperacionTipo.Exitoso, codigo: 1, mensaje: "Exitoso" });
                    }
                }
                else {
                    window.linkOsPlugin.disconnect();
                    navigator.notification.confirm("Error: " + _this.obtenerMensajeTraducido(result.message) + " ¿Desea intentarlo nuevamente?", function (respuesta) {
                        if (respuesta === 2) {
                            _this.validarYimprimir(macAddress, documento, tambienImprimir, callback);
                        }
                        else {
                            callback({ resultado: ResultadoOperacionTipo.Error, codigo: -1, mensaje: "The printer is not ready : " + result.message });
                        }
                    }, "Sonda\u00AE " + SondaVersion, "No,Si");
                }
            }, function (err) {
                window.linkOsPlugin.disconnect();
                navigator.notification.confirm("Error: " + _this.obtenerMensajeTraducido(err.message) + " ¿Desea intentarlo nuevamente?", function (respuesta) {
                    if (respuesta === 2) {
                        _this.validarYimprimir(macAddress, documento, tambienImprimir, callback);
                    }
                    else {
                        callback({ resultado: ResultadoOperacionTipo.Error, codigo: -1, mensaje: "Get printer status failed: " + err });
                    }
                }, "Sonda\u00AE " + SondaVersion, "No,Si");
            });
        }, function (err) {
            window.linkOsPlugin.disconnect();
            navigator.notification.confirm("Error: " + _this.obtenerMensajeTraducido(err) + " ¿Desea intentarlo nuevamente?", function (respuesta) {
                if (respuesta === 2) {
                    _this.validarYimprimir(macAddress, documento, tambienImprimir, callback);
                }
                else {
                    callback({ resultado: ResultadoOperacionTipo.Error, codigo: -1, mensaje: "No connect: " + err });
                }
            }, "Sonda\u00AE " + SondaVersion, "No,Si");
        });
    };
    ImpresionServicio.prototype.obtenerMensajeTraducido = function (mensaje) {
        var cadena = mensaje;
        switch (mensaje.toUpperCase()) {
            case "CANNOT ESTABLISH CONNECTION":
                cadena = "No se puede establecer la conexión.";
                break;
            case "PAPER OUT":
                cadena = "Sin papel.";
                break;
            case "HEAD OPEN":
                cadena = "Tapa abierta.";
                break;
            case "HEAD OPEN;PAPER OUT":
                cadena = "Tapa abierta.";
                break;
        }
        return cadena;
    };
    ImpresionServicio.prototype.impresionDePrueba = function (esImpresoZebra, macAddress, callback) {
        this.validarEstadosYImprimir(esImpresoZebra, macAddress, this.obterFormatoDePrueba(), true, function (resultado) {
            callback(resultado);
        });
    };
    ImpresionServicio.prototype.obterFormatoDePrueba = function () {
        var cadena = "";
        cadena = "! 0 50 50 620 1\r\n";
        cadena += "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
        cadena += "CENTER 570 T 0 3 0 10 MOBILITY SCM\r\n";
        cadena += "B QR 380 60 M 2 U 8 \r\n";
        cadena += "M0A,1234515155-1/1\r\n";
        cadena += "ENDQR \r\n";
        cadena += "LEFT 5 T 4 4 0 70 1/1\r\n";
        cadena += "L 5 240 570 240 1\r\n";
        cadena += "CENTER 570 T 0 3 0 270 GUIA: 1234515155\r\n";
        cadena += "LEFT 5 T 0 2 0 300 REMITENTE    : CODIGO Y NOMBRE REMITENTE\r\n";
        cadena += "LEFT 5 T 0 2 0 330 DESTINATARIO : CODIGO Y NOMBRE DESTINATARIO\r\n";
        cadena += "LEFT 5 T 0 2 0 360 DIRECCION DESTINARIO 1\r\n";
        cadena += "LEFT 5 T 0 2 0 390 COURIER      : CODIGO, NOMBRE COURIER\r\n";
        cadena += "LEFT 5 T 0 2 0 420 FECHA Y HORA : " + getDateTime() + "\r\n";
        cadena += "L 5 470 570 470 1\r\n";
        cadena += "CENTER 570 T 0 1 1 500 www.mobilityscm.com\r\n";
        cadena += "\r\nPRINT\r\n";
        return cadena;
    };
    return ImpresionServicio;
}());
//# sourceMappingURL=ImpresionServicio.js.map