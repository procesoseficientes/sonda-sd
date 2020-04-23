class PrecioEspecialServicio {
  private obtenerHistoricoDePromosParaCliente(
    cliente: Cliente,
    callback: (listaHistoricoDePromos: Promo[]) => void,
    callbackError: (resultado: Operacion) => void
  ) {
    SONDA_DB_Session.transaction(
      tx => {
        let listaParaEjecucion: string[] = [];
        listaParaEjecucion.push("SELECT");
        listaParaEjecucion.push(
          " MAX([HP].[HISTORY_DATETIME]) HISTORY_DATETIME"
        );
        listaParaEjecucion.push(" , [HP].[PROMO_ID]");
        listaParaEjecucion.push(" , [HP].[FREQUENCY]");
        listaParaEjecucion.push(" FROM HISTORY_BY_PROMO HP");
        listaParaEjecucion.push(` WHERE CODE_CUSTOMER = '${cliente.clientId}'`);
        listaParaEjecucion.push(" GROUP BY [HP].[PROMO_ID], [HP].[FREQUENCY]");
        tx.executeSql(
          listaParaEjecucion.join(""),
          [],
          (tx: SqlTransaction, results: SqlResultSet) => {
            let listaHistoricaDePromos: Promo[] = [];
            for (let i = 0; i < results.rows.length; i++) {
              let registroPorComboSql: any = results.rows.item(i);
              let historicoDePromo = new Promo();

              let fecha: Date;
              fecha = new Date(registroPorComboSql.HISTORY_DATETIME);
              fecha.setHours(0);
              fecha.setMinutes(0);
              fecha.setSeconds(0);
              fecha.setMilliseconds(0);
              historicoDePromo.historyDateTime = fecha;
              fecha = null;
              historicoDePromo.promoId = registroPorComboSql.PROMO_ID;
              historicoDePromo.frequency = registroPorComboSql.FREQUENCY;

              listaHistoricaDePromos.push(historicoDePromo);
              historicoDePromo = null;
              registroPorComboSql = null;
            }
            callback(listaHistoricaDePromos);
            listaHistoricaDePromos = null;
          }
        );
        listaParaEjecucion = null;
      },
      (err: SqlError) => {
        callbackError({
          codigo: -1,
          mensaje: `Error al obtener el historico de promos: ${err.message}`
        } as Operacion);
      }
    );
  }

  private validarSiAplicaElPrecioEspecial(
    lista: Array<PrecioEspecial>,
    indiceDeListaDeDescuento: number,
    listaHistoricoDePromos: Array<Promo>,
    callBack: (listaDePreciosEspeciales: Array<PrecioEspecial>) => void,
    errCallback: (resultado: Operacion) => void
  ) {
    try {
      if (listaHistoricoDePromos.length > 0) {
        if (
          this.listaDePreciosEspecialesTerminoDeIterar(
            lista,
            indiceDeListaDeDescuento
          )
        ) {
          let descuentoAValidar: PrecioEspecial =
            lista[indiceDeListaDeDescuento];
          let resultadoDePromoHistorico = (listaHistoricoDePromos as any).find(
            (promo: Promo) => {
              return promo.promoId === descuentoAValidar.promoId;
            }
          );
          if (resultadoDePromoHistorico) {
            let promoDeDescuento: Promo = new Promo();
            promoDeDescuento.promoId = descuentoAValidar.promoId;
            promoDeDescuento.promoName = descuentoAValidar.promoName;
            promoDeDescuento.frequency = descuentoAValidar.frequency;
            this.validarSiAplicaPromo(
              promoDeDescuento,
              resultadoDePromoHistorico,
              (aplicaDescuento: boolean) => {
                if (!aplicaDescuento) {
                  lista = lista.filter((descuento: PrecioEspecial) => {
                    return (
                      resultadoDePromoHistorico.promoId !== descuento.promoId
                    );
                  });
                }
                this.validarSiAplicaElPrecioEspecial(
                  lista,
                  indiceDeListaDeDescuento + (aplicaDescuento ? 1 : 0),
                  listaHistoricoDePromos,
                  (lista: PrecioEspecial[]) => {
                    callBack(lista);
                  },
                  (resultado: Operacion) => {
                    errCallback(resultado);
                  }
                );
              },
              (resultado: Operacion) => {
                errCallback(resultado);
              }
            );
            promoDeDescuento = null;
          } else {
            this.validarSiAplicaElPrecioEspecial(
              lista,
              indiceDeListaDeDescuento + 1,
              listaHistoricoDePromos,
              (lista: PrecioEspecial[]) => {
                callBack(lista);
              },
              (resultado: Operacion) => {
                errCallback(resultado);
              }
            );
          }
        } else {
          callBack(lista);
        }
      } else {
        callBack(lista);
      }
    } catch (ex) {
      errCallback({
        codigo: -1,
        mensaje: `Error al validar si aplica el descuento por familia y tipo pago: ${
          ex.message
        }`
      } as Operacion);
    }
  }

  private listaDePreciosEspecialesTerminoDeIterar(
    lista: Array<PrecioEspecial>,
    indiceDeLista: number
  ): boolean {
    return lista.length > 0 && lista.length > indiceDeLista;
  }

  private validarSiAplicaPromo(
    promo: Promo,
    promoHistorico: Promo,
    callback: (aplicarPromo: boolean) => void,
    callbackError: (resultado: Operacion) => void
  ) {
    try {
      promoHistorico.historyDateTime.setHours(0);
      promoHistorico.historyDateTime.setMinutes(0);
      promoHistorico.historyDateTime.setSeconds(0);
      promoHistorico.historyDateTime.setMilliseconds(0);

      let cantidadDeDias: number = 0;
      switch (promo.frequency) {
        case TipoPeriodicidadDePromo.Siempre.toString():
          callback(true);
          break;
        case TipoPeriodicidadDePromo.Unica.toString():
          callback(false);
          break;
        case TipoPeriodicidadDePromo.PorDia.toString():
          let fechaActual = new Date();
          fechaActual.setHours(0);
          fechaActual.setMinutes(0);
          fechaActual.setSeconds(0);
          fechaActual.setMilliseconds(0);

          if (promoHistorico.historyDateTime < fechaActual) {
            callback(true);
          } else {
            callback(false);
          }
          fechaActual = null;
          break;
        case TipoPeriodicidadDePromo.PorSemana.toString():
          cantidadDeDias = 7;
          break;
        case TipoPeriodicidadDePromo.PorMes.toString():
          cantidadDeDias = 30;
          break;
      }
      if (cantidadDeDias > 0) {
        this.obtenerFechaParaCompararLaPromo(
          cantidadDeDias,
          (fecha: Date) => {
            if (promoHistorico.historyDateTime <= fecha) {
              callback(true);
            } else {
              callback(false);
            }
          },
          (resultado: Operacion) => {
            callbackError(resultado);
          }
        );
      }
    } catch (ex) {
      callbackError({
        codigo: -1,
        mensaje: `Error al validar si aplica promo: ${ex.message}`
      } as Operacion);
    }
  }

  private obtenerFechaParaCompararLaPromo(
    diasARestar: number,
    callback: (fecha: Date) => void,
    callbackError: (resultado: Operacion) => void
  ) {
    SONDA_DB_Session.transaction(
      tx => {
        let listaParaEjecucion: string[] = [];
        listaParaEjecucion.push(
          `SELECT DateTime('Now', 'LocalTime', '-${diasARestar} Day') AS DATE_PROMO`
        );
        tx.executeSql(
          listaParaEjecucion.join(""),
          [],
          (tx: SqlTransaction, results: SqlResultSet) => {
            if (results.rows.length > 0) {
              let registroPorComboSql: any = results.rows.item(0);
              let fecha: Date;
              fecha = new Date(registroPorComboSql.DATE_PROMO);
              fecha.setHours(0);
              fecha.setMinutes(0);
              fecha.setSeconds(0);
              fecha.setMilliseconds(0);
              callback(fecha);
              fecha = null;
              registroPorComboSql = null;
            } else {
              callbackError({
                codigo: -1,
                mensaje: `No se pudo obtener la fecha para la comparación.`
              } as Operacion);
            }
          }
        );
        listaParaEjecucion = null;
      },
      (err: SqlError) => {
        callbackError({
          codigo: -1,
          mensaje: `Error al obtener fecha para compara la p de promo: ${
            err.message
          }`
        } as Operacion);
      }
    );
  }

  obtenerPreciosEspecialesPorCliente(
    qty: number,
    cliente: Cliente,
    sku: Sku,    
    callback: (listaDePreciosEspeciales: Array<PrecioEspecial>) => void,
    callbackError: (resultado: Operacion) => void
  ) {
    SONDA_DB_Session.transaction(
      tx => {
        var sql = "SELECT";
        sql += " PLS.SPECIAL_PRICE_LIST_ID";
        sql += " ,PLS.CODE_SKU";
        sql += " ,PU.CODE_PACK_UNIT";
        sql += " ,PLS.LOW_LIMIT";
        sql += " ,PLS.HIGH_LIMIT";
        sql += " ,PLS.SPECIAL_PRICE";
        sql += " ,PLS.PROMO_ID";
        sql += " ,PLS.PROMO_NAME";
        sql += " ,PLS.PROMO_TYPE";
        sql += " ,PLS.FREQUENCY";
        sql += " ,PLS.APPLY_DISCOUNT";
        sql += " FROM SPECIAL_PRICE_LIST_BY_SCALE PLS";
        sql += " INNER JOIN PACK_UNIT PU";
        sql += " ON(PLS.PACK_UNIT = PU.PACK_UNIT)";
        sql +=
          " WHERE PLS.SPECIAL_PRICE_LIST_ID = " + cliente.spcialPriceListId;
        if (qty > 0) {
          sql += " AND " + qty + " BETWEEN PLS.LOW_LIMIT AND PLS.HIGH_LIMIT";
        }
        if (sku.sku !== "") {
          sql += " AND PLS.CODE_SKU = '" + sku.sku + "'";
        }
        if (sku.codePackUnit !== "") {
          sql += " AND PU.CODE_PACK_UNIT = '" + sku.codePackUnit + "'";
        }

        tx.executeSql(sql, [], (tx: SqlTransaction, results: SqlResultSet) => {
          let listaDePreciosEspeciales = new Array<PrecioEspecial>();
          for (var i = 0; i < results.rows.length; i++) {
            let pricioEspecialSql: any = results.rows.item(i);
            let pricioEspecial = new PrecioEspecial();
            pricioEspecial.spcialPriceListId =
              pricioEspecialSql.SPECIAL_PRICE_LIST_ID;
            pricioEspecial.codeSku = pricioEspecialSql.CODE_SKU;
            pricioEspecial.codePackUnit = pricioEspecialSql.CODE_PACK_UNIT;
            pricioEspecial.lowLimit = pricioEspecialSql.LOW_LIMIT;
            pricioEspecial.highLimit = pricioEspecialSql.HIGH_LIMIT;
            pricioEspecial.specialPrice = pricioEspecialSql.SPECIAL_PRICE;
            pricioEspecial.promoId = pricioEspecialSql.PROMO_ID;
            pricioEspecial.promoName = pricioEspecialSql.PROMO_NAME;
            pricioEspecial.promoType = pricioEspecialSql.PROMO_TYPE;
            pricioEspecial.frequency = pricioEspecialSql.FREQUENCY;
            pricioEspecial.applyDiscount =
              pricioEspecialSql.APPLY_DISCOUNT === 1;
            listaDePreciosEspeciales.push(pricioEspecial);
          }
          this.obtenerHistoricoDePromosParaCliente(
            cliente,
            (listaHistoricoDePromos: Array<Promo>) => {
              this.validarSiAplicaElPrecioEspecial(
                listaDePreciosEspeciales,
                0,
                listaHistoricoDePromos,
                (listaDePreciosEspecialesResultado: Array<PrecioEspecial>) => {
                  callback(listaDePreciosEspecialesResultado);
                },
                (resultado: Operacion) => {
                  callbackError(resultado);
                }
              );
            },
            (resultado: Operacion) => {
              callbackError(resultado);
            }
          );
        });
      },
      (err: SqlError) => {
        callbackError(<Operacion>{
          codigo: -1,
          mensaje: "Error al obtener los precios especiales: " + err.message
        });
      }
    );
  }
}
