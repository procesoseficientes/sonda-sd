var o = new Array("diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve");
var u = new Array("cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve");
var d = new Array("", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa");
var c = new Array("", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos");

function numberToWord(n) {
    n = parseFloat(n).toFixed(2); /*se limita a dos decimales, no sabía que existía toFixed() :)*/
    var p = n.toString().substring(n.toString().indexOf(".") + 1); /*decimales*/
    var m = n.toString().substring(0, n.toString().indexOf(".")); /*número sin decimales*/
    m = parseFloat(m).toString().split("").reverse(); /*tampoco que reverse() existía :D*/
    var t = "";

    /*Se analiza cada 3 dígitos*/
    for (var i = 0; i < m.length; i += 3) {
        var x = t;
        /*formamos un número de 2 dígitos*/
        var b = m[i + 1] != undefined ? parseFloat(m[i + 1].toString() + m[i].toString()) : parseFloat(m[i].toString());
        /*analizamos el 3 dígito*/
        t = m[i + 2] != undefined ? (c[m[i + 2]] + " ") : "";
        t += b < 10 ? u[b] : (b < 30 ? o[b - 10] : (d[m[i + 1]] + (m[i] == '0' ? "" : (" y " + u[m[i]]))));
        t = t == "ciento cero" ? "cien" : t;
        if (2 < i && i < 6)
            t = t == "uno" ? "mil " : (t.replace("uno", "un") + " mil ");
        if (5 < i && i < 9)
            t = t == "uno" ? "un millón " : (t.replace("uno", "un") + " millones ");
        t += x;
        //t=i<3?t:(i<6?((t=="uno"?"mil ":(t+" mil "))+x):((t=="uno"?"un millón ":(t+" millones "))+x));
    }

    t += " con " + p + "/100";
    /*correcciones*/
    t = t.replace("  ", " ");
    t = t.replace(" cero", "");
    //t=t.replace("ciento y","cien y");
    //alert("Numero: "+n+"\nNº Dígitos: "+m.length+"\nDígitos: "+m+"\nDecimales: "+p+"\nt: "+t);
    //document.getElementById("esc").value=t;
    return t;
}