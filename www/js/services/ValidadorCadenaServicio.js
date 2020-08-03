var ValidadorCadenaServicio = (function () {
    function ValidadorCadenaServicio() {
    }
    ValidadorCadenaServicio.removerCaracteresEspeciales = function (cadena) {
        return cadena.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    };
    return ValidadorCadenaServicio;
}());
//# sourceMappingURL=ValidadorCadenaServicio.js.map