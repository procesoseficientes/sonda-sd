class ImpresionManifiestoServicio implements IImpresionManifiestoServicio {
    obtenerFormatoDeImpresionManifiesto(manifiesto:any,operadorEnBodega:string, callback: (formato: string) => void, callbackError: (resultado: Operacion) => void): void {
        try {

            let formato = "";
            let altura =315;
            let posY = 315; 
            altura += (manifiesto.detalle.length * 100)+(manifiesto.carritos.length * 100);
            //ENCABEZADO----------------------------------------------------------------
            formato = "! 0 200 200 " + altura + " 1\r\n";
            formato += "! U1 PAGE-WIDTH 1400 \r\n";
            formato += "ON-FEED IGNORE \r\n";
            formato += "L 0 0 1395 0 2 \r\n";
            formato += "CENTER 575 \r\n";
            formato += "T 7 0 0 5 MANIFIESTO #" + manifiesto.manifiestoId.toString() + "\r\n";
            formato += "L 0 30 1395 30 2 \r\n";
            formato += "CENTER 600 \r\n";
            formato += "T 7 0 0 35 DISTRIBUIDORA 'ME LLEGA' \r\n";
            formato += "L 0 60 1395 60 2 \r\n";
            formato += "CENTER \r\n";
            formato += "B QR 220 75 M 2 U 6 \r\n";
            formato += "MA," + "LP" + manifiesto.manifiestoId.toString() + "\r\n";
            formato += "ENDQR \r\n";
            formato += "CENTER 550 \r\n";
            formato += "T 7 0 0 210 Fecha y Hora: " + getDateTime().toString() + "\r\n";
            formato += "T 7 0 0 230 Operador: " + operadorEnBodega + "\r\n";
            formato += "L 0 260 1395 260 2 \r\n";
            formato += "CENTER 550 \r\n";
            formato += "T 7 0 0 265 DETALLE \r\n";
            formato += "CENTER 550 \r\n";
            formato += "T 7 0 0 290 DESCRIPCION \r\n";
            formato += "LEFT 5 \r\n";
            formato += "T 7 0 5 290 SKU \r\n";
            formato += "RIGHT \r\n";
            formato += "T 7 0 535 290 QTY \r\n";
            formato += "L 0 315 1395 315 0.5 \r\n";
            //DETALLE--------------------------------------------------------------------
            var totalSkusDetalle = 0;
            for (var i = 0; i < manifiesto.detalle.length; i++) {
                var skuDetalle = manifiesto.detalle[i];
                posY += 20;
                formato += "CENTER 600 \r\n";
                formato += "T 7 0 0 " + posY + " " + skuDetalle.skuDescription + "\r\n"; //DESCRIPCION DEL SKU CARGADO
                formato += "LEFT 5 \r\n";
                formato += "T 7 0 5 "+posY+" " + skuDetalle.sku + "\r\n"; //CODIGO DEL SKU CARGADO
                formato += "RIGHT\r\n";
                formato += "T 7 0 525 " + posY + " " + skuDetalle.qty.toString() + "\r\n"; // CANTIDAD DEL SKU CARGADO 
                totalSkusDetalle += skuDetalle.qty;
            }

            posY += 25;
            formato += "L 0 " + posY + " 1395 " + posY + " 0.5 \r\n";

            posY += 5;
            formato += "CENTER 600 \r\n";
            formato += "T 7 0 0 " + posY + " TOTAL: " + totalSkusDetalle + " SKU(s) Cargado(s) \r\n";

            posY += 25;
            formato += "L 0 "+posY+" 1395 "+posY+" 2 \r\n";
            //PIE------------------------------------------------------------------------
            posY += 20;
            formato += "LEFT \r\n";
            formato += "T 7 0 50 " + posY + " CARRITOS: \r\n";

            for (var j = 0; j < manifiesto.carritos.length; j++) {
                posY += 20;
                formato += "T 7 0 100 "+posY+" " + manifiesto.carritos[j] + " \r\n"; // codigo de los carritos que hay en el manifiesto
            }

            posY += 20;
            formato += "T 7 0 50 " + posY + " PEDIDOS CARGADOS: \r\n";
            formato += "T 7 0 300 "+posY+" " + manifiesto.pedidos.length.toString() + "\r\n"; //cantidad de pedidos cargados en el manifiesto

            posY += 20;
            formato += "T 7 0 50 "+posY+" CLIENTES A VISITAR: \r\n";
            formato += "T 7 0 300 "+posY+" " + manifiesto.clientes.length.toString() + "\r\n"; // cantidad de clientes que se deben visitar

            posY += 120;
            formato += "L 50 "+posY+" 250 "+posY+" 0.5 \r\n"; //linea para firma del bodeguero
            formato += "L 350 " + posY + " 550 " + posY + " 0.5 \r\n"; //linea para firma del piloto

            posY += 5;
            formato += "T 7 0 50 "+posY+" FIRMA BODEGUERO \r\n";
            formato += "T 7 0 350 "+posY+" FIRMA PILOTO \r\n";

            posY += 20;
            formato += "L 0 "+posY+" 1395 "+posY+" 2 \r\n";

            formato += "PRINT\r\n";

            callback(formato);

        } catch (e) {
            const resultado = new Operacion();
            resultado.codigo = -1;
            resultado.mensaje = e.message;
            resultado.resultado = ResultadoOperacionTipo.Error;
            callbackError(resultado);
        } 
    }

    enviarSolicitudDeInformacionDeManifiesto(numeroManifiesto:number, callbackError: (resultado: Operacion) => void): void {
        try {
            if (gIsOnline === EstaEnLinea.Si) {
                const data = {
                    'numeroManifiesto': numeroManifiesto,
                    'dbuser': gdbuser,
                    'dbuserpass': gdbuserpass,
                    'routeid': gCurrentRoute
                };
                socket.emit("obtenerInformacionManifiesto", data);
            } else {
                const resultado = new Operacion();
                resultado.codigo = -1;
                resultado.mensaje = "Debe tener conexion hacia el servidor para poder enviar la solicitud de informacion...";
                resultado.resultado = ResultadoOperacionTipo.Error;
                callbackError(resultado);
            }
        } catch (e) {
            const resultado = new Operacion();
            resultado.codigo = -1;
            resultado.mensaje = `No se ha podido enviar la solicitud de informacion de manifiesto debido a: ${e.message}`;
            resultado.resultado = ResultadoOperacionTipo.Error;
            callbackError(resultado);
        }
    }

    generarObjetoManifiesto(data: any, callBack:(manifiesto: any)=>void, callbackError: (resultado: Operacion) => void):void {
        try {

            const manifiesto = {
                "manifiestoId": 0,
                "detalle": new Array(),
                "carritos": new Array(),
                "pedidos": new Array(),
                "clientes": new Array()
            };

            var skus = new Array();
            var carritos = new Array();
            var clientes = new Array();
            var pedidos = new Array();

            for (let i = 0; i < data.length; i++) {
                const detalle = data[i];
                const sku = new Sku();
                sku.sku = detalle.MATERIAL_ID;
                sku.skuDescription = detalle.MATERIAL_NAME;
                sku.qty = detalle.QTY;
                skus.push(sku);

                carritos.push(detalle.CART_CODE);
                pedidos.push(detalle.ERP_DOC);
                clientes.push(detalle.CLIENT_NAME);
            }

            if (data.length > 0) {
                manifiesto.manifiestoId = data[0].TEMP_MANIFEST;
                manifiesto.detalle = skus;
                let j = 0;
                for ( j = 0; j < carritos.length; j++) {
                    if (manifiesto.carritos.indexOf(carritos[j]) === -1) {
                        manifiesto.carritos.push(carritos[j]);
                    }
                }

                for (j = 0; j < pedidos.length; j++) {
                    if (manifiesto.pedidos.indexOf(pedidos[j]) === -1) {
                        manifiesto.pedidos.push(pedidos[j]);
                    }
                }

                for (j = 0; j < clientes.length; j++) {
                    if (manifiesto.clientes.indexOf(clientes[j]) === -1) {
                        manifiesto.clientes.push(clientes[j]);
                    }
                }
            }

            callBack(manifiesto);


        } catch (e) {
            const resultado = new Operacion();
            resultado.codigo = -1;
            resultado.mensaje = `No se ha podido procesar la informacion del manifiesto debido a: ${e.message}`;
            resultado.resultado = ResultadoOperacionTipo.Error;
            callbackError(resultado);
        } 
    }
}