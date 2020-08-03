class ValidadorCadenaServicio implements IValidadorCadenaServicio {


    static removerCaracteresEspeciales(cadena: string): string{
        return cadena.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    }

    
}