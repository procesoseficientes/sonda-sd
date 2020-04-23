
interface IRazonServicio {
    obtenerRazones(tipoDeRazon: any,callback: (razones: Razon[]) => void, errorCallback: (resultado: Operacion) => void): void;

    obenerRazonSinRazones(callback: (razones: Razon[]) => void, errorCallback: (resultado: Operacion) => void): void;
}