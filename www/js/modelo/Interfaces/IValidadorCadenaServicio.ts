interface IValidadorCadenaServicio {
    
}


interface IValidadorCadenaServicioStatic<C extends new (...args) => IValidadorCadenaServicio>{
    removerCaracteresEspeciales(cadena: string): string;
}