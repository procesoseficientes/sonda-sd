interface IListaDePreciosServicio {

    agregarListaDePreciosPorSku(bonificacion: any, callBack: () => void, errorCallBack: (resultado: Operacion) => void): void;
}