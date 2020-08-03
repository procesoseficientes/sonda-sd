
interface IManejoDeDecimales {

    obtenerInformacionDeManejoDeDecimales(callback: (decimales: ManejoDeDecimales) => void): void;

    calcularPorTipoDecimales(manejoDeDecimales: ManejoDeDecimales, valor : number):number;
}