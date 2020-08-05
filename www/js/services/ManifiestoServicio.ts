class ManifiestoServicio implements IManifiestoServicio {
    limpiarTareasDeEntrega(): void {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql = `DELETE FROM TASK WHERE TASK_TYPE = 'DELIVERY_SD' AND TASK_STATUS <> 'COMPLETED'`;
                trans.executeSql(sql);
            }, (error: SqlError) => {
                notify(error.message);
            });
        } catch (e) {
            notify(e.message);
        }
    }

    obtenerCantidadDeEntregasDeManifiesto(codigoManifiesto: number,
        callback: (cantidadDeVisitas: number) => void,
        errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.readTransaction((trans: SqlTransaction) => {
            let sql = `SELECT DISTINCT CLIENT_CODE FROM MANIFEST_DETAIL WHERE MANIFEST_HEADER_ID = ${codigoManifiesto}`;
            trans.executeSql(sql,
                [],
                (transReturn: SqlTransaction, results: SqlResultSet) => {
                    callback(results.rows.length);
                },
                (transResult: SqlTransaction, error: SqlError) => {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `No se ha podido obtener la cantidad de entregas del manifiesto debido a: ${error.message}`
                    } as Operacion);
                });
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido obtener la cantidad de entregas del manifiesto debido a: ${error.message}`
            } as Operacion);
        });
    }

    almacenarEncabezadoDeManifiesto(encabezadoDeManifiesto: any,
        callback: () => void,
        errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sqlLimpiarEncabezado: string = `DELETE FROM MANIFEST_HEADER WHERE MANIFEST_HEADER_ID = ${
                encabezadoDeManifiesto.MANIFEST_HEADER_ID}`;
            trans.executeSql(sqlLimpiarEncabezado);
            sqlLimpiarEncabezado = null;

            let sqlManifiesto: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sqlManifiesto.push("INSERT INTO MANIFEST_HEADER(");
            sqlManifiesto.push("MANIFEST_HEADER_ID,");
            sqlManifiesto.push("DRIVER,");
            sqlManifiesto.push("VEHICLE,");
            sqlManifiesto.push("DISTRIBUTION_CENTER,");
            sqlManifiesto.push("CREATED_DATE,");
            sqlManifiesto.push("STATUS,");
            sqlManifiesto.push("LAST_UPDATE,");
            sqlManifiesto.push("LAST_UPDATE_BY,");
            sqlManifiesto.push("MANIFEST_TYPE,");
            sqlManifiesto.push("TRANSFER_REQUEST_ID,");
            sqlManifiesto.push("IS_POSTED");
            sqlManifiesto.push(") VALUES(");
            sqlManifiesto.push(`${encabezadoDeManifiesto.MANIFEST_HEADER_ID}`);
            sqlManifiesto.push(`,${encabezadoDeManifiesto.DRIVER}`);
            sqlManifiesto.push(`,${encabezadoDeManifiesto.VEHICLE}`);
            sqlManifiesto.push(`,'${encabezadoDeManifiesto.DISTRIBUTION_CENTER}'`);
            sqlManifiesto.push(`,'${encabezadoDeManifiesto.CREATED_DATE}'`);
            sqlManifiesto.push(`,'${EstadoDeManifiesto.Asignado}'`);
            sqlManifiesto.push(`,'${encabezadoDeManifiesto.LAST_UPDATE}'`);
            sqlManifiesto.push(`,'${encabezadoDeManifiesto.LAST_UPDATE_BY}'`);
            sqlManifiesto.push(`,'${encabezadoDeManifiesto.MANIFEST_TYPE}'`);
            sqlManifiesto.push(`,${encabezadoDeManifiesto.TRANSFER_REQUEST_ID}`);
            sqlManifiesto.push(`, 1`);
            sqlManifiesto.push(`)`);
            trans.executeSql(sqlManifiesto.join(""));

            sqlManifiesto = null;
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido almacenar el encabezado del manifiesto debido a: ${error.message}`
            } as Operacion);
        }, () => {
            callback();
        });
    }

    almacenarDetalleDeManifiesto(detalleDeManifiesto: any,
        callback: () => void,
        errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sqlLimpiarDetalle: string = `DELETE FROM MANIFEST_DETAIL WHERE MANIFEST_DETAIL_ID = ${
                detalleDeManifiesto.MANIFEST_DETAIL_ID} AND MANIFEST_HEADER_ID = ${detalleDeManifiesto
                    .MANIFEST_HEADER_ID}`;

            trans.executeSql(sqlLimpiarDetalle);
            sqlLimpiarDetalle = null;

            let sqlManifiesto: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sqlManifiesto.push("INSERT INTO MANIFEST_DETAIL(");
            sqlManifiesto.push("MANIFEST_DETAIL_ID,");
            sqlManifiesto.push("MANIFEST_HEADER_ID,");
            sqlManifiesto.push("CODE_ROUTE,");
            sqlManifiesto.push("CLIENT_CODE,");
            sqlManifiesto.push("WAVE_PICKING_ID,");
            sqlManifiesto.push("MATERIAL_ID,");
            sqlManifiesto.push("QTY,");
            sqlManifiesto.push("STATUS,");
            sqlManifiesto.push("LAST_UPDATE,");
            sqlManifiesto.push("LAST_UPDATE_BY,");
            sqlManifiesto.push("ADDRESS_CUSTOMER,");
            sqlManifiesto.push("CLIENT_NAME,");
            sqlManifiesto.push("LINE_NUM,");
            sqlManifiesto.push("PICKING_DEMAND_HEADER_ID,");
            sqlManifiesto.push("STATE_CODE,");
            sqlManifiesto.push("CERTIFICATION_TYPE");
            sqlManifiesto.push(") VALUES(");
            sqlManifiesto.push(`${detalleDeManifiesto.MANIFEST_DETAIL_ID}`);
            sqlManifiesto.push(`,${detalleDeManifiesto.MANIFEST_HEADER_ID}`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.CODE_ROUTE}'`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.CLIENT_CODE}'`);
            sqlManifiesto.push(`,${detalleDeManifiesto.WAVE_PICKING_ID}`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.MATERIAL_ID}'`);
            sqlManifiesto.push(`,${detalleDeManifiesto.QTY}`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.STATUS}'`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.LAST_UPDATE}'`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.LAST_UPDATE_BY}'`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.ADDRESS_CUSTOMER}'`);
            sqlManifiesto.push(`,'${detalleDeManifiesto.CLIENT_NAME}'`);
            sqlManifiesto.push(`,${detalleDeManifiesto.LINE_NUM}`);
            sqlManifiesto.push(`,${detalleDeManifiesto.PICKING_DEMAND_HEADER_ID}`);
            sqlManifiesto.push(`,${detalleDeManifiesto.STATE_CODE}`);
            sqlManifiesto.push(`,${detalleDeManifiesto.CERTIFICATION_TYPE}`);
            sqlManifiesto.push(`)`);

            trans.executeSql(sqlManifiesto.join(""));

            sqlManifiesto = null;
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido almacenar el detalle del manifiesto debido a: ${error.message}`
            } as Operacion);
        }, () => {
            callback();
        });
    }

    obtenerManifiesto(manifiestoId: number,
        callback: (manifiesto: ManifiestoEncabezado) => void,
        errorCallback: (resultado: Operacion) => void): void {
        this.obtenerEncabezadoDeManifiesto(manifiestoId, (manifiestoEncabezado) => {
            this.obtenerDetalleDeManifiesto(manifiestoEncabezado, callback, errorCallback);
        }, errorCallback);
    }

    obtenerEncabezadoDeManifiesto(manifiesto: number,
        callback: (manifiestoEncabezado: ManifiestoEncabezado) => void,
        errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.readTransaction((trans: SqlTransaction) => {
            let sqlManifiesto: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sqlManifiesto.push("SELECT ");
            sqlManifiesto.push("MANIFEST_HEADER_ID,");
            sqlManifiesto.push("DRIVER,");
            sqlManifiesto.push("VEHICLE,");
            sqlManifiesto.push("DISTRIBUTION_CENTER,");
            sqlManifiesto.push("CREATED_DATE,");
            sqlManifiesto.push("STATUS,");
            sqlManifiesto.push("LAST_UPDATE,");
            sqlManifiesto.push("LAST_UPDATE_BY,");
            sqlManifiesto.push("MANIFEST_TYPE,");
            sqlManifiesto.push("TRANSFER_REQUEST_ID ");
            sqlManifiesto.push("FROM MANIFEST_HEADER");
            sqlManifiesto.push(`WHERE MANIFEST_HEADER = ${manifiesto}`);
            trans.executeSql(sqlManifiesto.join(""),
                [],
                (transReturn: SqlTransaction, results: SqlResultSet) => {
                    if (results.rows.length > 0) {
                        let manifiestoEncabezado = new ManifiestoEncabezado();
                        let manifiestoTemporal = <any>results.rows.item(0);
                        manifiestoEncabezado.manifestHeaderId = manifiestoTemporal.MANIFEST_HEADER_ID;
                        manifiestoEncabezado.driver = manifiestoTemporal.DRIVER;
                        manifiestoEncabezado.vehicle = manifiestoTemporal.VEHICLE;
                        manifiestoEncabezado.distributionCenter = manifiestoTemporal.DISTRIBUTION_CENTER;
                        manifiestoEncabezado.createdDate = manifiestoTemporal.CREATED_DATE;
                        manifiestoEncabezado.status = manifiestoTemporal.STATUS;
                        manifiestoEncabezado.lastUpdate = manifiestoTemporal.LAST_UPDATE;
                        manifiestoEncabezado.lastUpdateBy = manifiestoTemporal.LAST_UPDATE_BY;
                        manifiestoEncabezado.manifestType = manifiestoTemporal.MANIFEST_TYPE;
                        manifiestoEncabezado.transferRequestId = manifiestoTemporal.TRANSFER_REQUEST_ID;
                        manifiestoEncabezado.manifestDetail = [];
                        callback(manifiestoEncabezado);
                        manifiestoTemporal = null;
                        return;
                    } else {
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: `No se ha podido encontrar el encabezado del manifiesto, por favor, verifique y vuelva a intentar.`
                        } as Operacion);
                        return;
                    }
                },
                (transReturn: SqlTransaction, error: SqlError) => {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `No se ha podido obtener el encabezado del manifiesto debido a: ${error.message}`
                    } as Operacion);
                });
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido obtener el encabezado del manifiesto debido a: ${error.message}`
            } as Operacion);
        });
    }

    obtenerDetalleDeManifiesto(manifiesto: ManifiestoEncabezado,
        callback: (manifiestoCompleto: ManifiestoEncabezado) => void,
        errorCallback: (resultado: Operacion) => void): void {

        SONDA_DB_Session.readTransaction((trans: SqlTransaction) => {
            let sqlManifiesto: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sqlManifiesto.push("SELECT ");
            sqlManifiesto.push("MANIFEST_DETAIL_ID,");
            sqlManifiesto.push("MANIFEST_HEADER_ID,");
            sqlManifiesto.push("CODE_ROUTE,");
            sqlManifiesto.push("CLIENT_CODE,");
            sqlManifiesto.push("WAVE_PICKING_ID,");
            sqlManifiesto.push("MATERIAL_ID,");
            sqlManifiesto.push("QTY,");
            sqlManifiesto.push("STATUS,");
            sqlManifiesto.push("LAST_UPDATE,");
            sqlManifiesto.push("LAST_UPDATE_BY,");
            sqlManifiesto.push("ADDRESS_CUSTOMER,");
            sqlManifiesto.push("CLIENT_NAME,");
            sqlManifiesto.push("LINE_NUM,");
            sqlManifiesto.push("PICKING_DEMAND_HEADER_ID,");
            sqlManifiesto.push("STATE_CODE,");
            sqlManifiesto.push("CERTIFICATION_TYPE");
            sqlManifiesto.push("FROM MANIFEST_DETAIL");
            sqlManifiesto.push(`WHERE MANIFEST_HEADER = ${manifiesto.manifestHeaderId}`);
            trans.executeSql(sqlManifiesto.join(""),
                [],
                (transReturn: SqlTransaction, results: SqlResultSet) => {
                    if (results.rows.length > 0) {
                        for (let i = 0; i < results.rows.length; i++) {
                            let detalleTemporal: any = results.rows.item(i);
                            let detalleManifiesto = new ManifiestoDetalle();

                            detalleManifiesto.manifestDetailId = detalleTemporal.MANIFEST_DETAIL_ID;
                            detalleManifiesto.manifestHeaderId = detalleTemporal.MANIFEST_HEADER_ID;
                            detalleManifiesto.codeRoute = detalleTemporal.CODE_ROUTE;
                            detalleManifiesto.clientCode = detalleTemporal.CLIENT_CODE;
                            detalleManifiesto.wavePickingId = detalleTemporal.WAVE_PICKING_ID;
                            detalleManifiesto.materialId = detalleTemporal.MATERIAL_ID;
                            detalleManifiesto.qty = detalleTemporal.QTY;
                            detalleManifiesto.status = detalleTemporal.STATUS;
                            detalleManifiesto.lastUpdate = detalleTemporal.LAST_UPDATE;
                            detalleManifiesto.lastUpdateBy = detalleTemporal.LAST_UPDATE_BY;
                            detalleManifiesto.addressCustomer = detalleTemporal.ADDRESS_CUSTOMER;
                            detalleManifiesto.clientName = detalleTemporal.CLIENT_NAME;
                            detalleManifiesto.lineNum = detalleTemporal.LINE_NUM;
                            detalleManifiesto.pickingDemandHeaderId = detalleTemporal.PICKING_DEMAND_HEADER_ID;
                            detalleManifiesto.stateCode = detalleTemporal.STATE_CODE;
                            detalleManifiesto.certificationType = detalleTemporal.CERTIFICATION_TYPE;
                            manifiesto.manifestDetail.push(detalleManifiesto);
                        }
                        callback(manifiesto);
                        return;
                    } else {
                        errorCallback({
                            codigo: -1,
                            resultado: ResultadoOperacionTipo.Error,
                            mensaje: `No se ha podido encontrar el detalle del manifiesto, por favor, verifique y vuelva a intentar.`
                        } as Operacion);
                        return;
                    }
                },
                (transReturn: SqlTransaction, error: SqlError) => {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `No se ha podido obtener el detalle del manifiesto debido a: ${error.message}`
                    } as Operacion);
                });
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido obtener el detalle del manifiesto debido a: ${error.message}`
            } as Operacion);
        });

    }


    almacenarDemandaDeDespachoEncabezado(demandaDespachoEncabezado: any,
        errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sqlLimpiarDetalle: string = `DELETE FROM NEXT_PICKING_DEMAND_HEADER WHERE PICKING_DEMAND_HEADER_ID = ${
                demandaDespachoEncabezado.PICKING_DEMAND_HEADER_ID}`;

            trans.executeSql(sqlLimpiarDetalle);
            sqlLimpiarDetalle = null;

            let sql: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sql.push("INSERT INTO NEXT_PICKING_DEMAND_HEADER(");
            sql.push("PICKING_DEMAND_HEADER_ID,");
            sql.push("DOC_NUM,");
            sql.push("CLIENT_CODE,");
            sql.push("CODE_ROUTE,");
            sql.push("CODE_SELLER,");
            sql.push("TOTAL_AMOUNT,");
            sql.push("SERIAL_NUMBER,");
            sql.push("DOC_NUM_SEQUENCE,");
            sql.push("EXTERNAL_SOURCE_ID,");
            sql.push("IS_FROM_ERP,");
            sql.push("IS_FROM_SONDA,");
            sql.push("LAST_UPDATE,");
            sql.push("LAST_UPDATE_BY,");
            sql.push("IS_COMPLETED,");
            sql.push("WAVE_PICKING_ID,");
            sql.push("CODE_WAREHOUSE,");
            sql.push("IS_AUTHORIZED,");
            sql.push("ATTEMPTED_WITH_ERROR,");
            sql.push("IS_POSTED_ERP,");
            sql.push("POSTED_ERP,");
            sql.push("POSTED_RESPONSE,");
            sql.push("ERP_REFERENCE,");
            sql.push("CLIENT_NAME,");
            sql.push("CREATED_DATE,");
            sql.push("ERP_REFERENCE_DOC_NUM,");
            sql.push("DOC_ENTRY,");
            sql.push("IS_CONSOLIDATED,");
            sql.push("PRIORITY,");
            sql.push("HAS_MASTERPACK,");
            sql.push("POSTED_STATUS,");
            sql.push("OWNER,");
            sql.push("CLIENT_OWNER,");
            sql.push("MASTER_ID_SELLER,");
            sql.push("SELLER_OWNER,");
            sql.push("SOURCE_TYPE,");
            sql.push("INNER_SALE_STATUS,");
            sql.push("INNER_SALE_RESPONSE,");
            sql.push("DEMAND_TYPE,");
            sql.push("TRANSFER_REQUEST_ID,");
            sql.push("ADDRESS_CUSTOMER,");
            sql.push("STATE_CODE,");
            sql.push("MANIFEST_HEADER_ID,");
            sql.push("PROCESS_STATUS");
            sql.push(",DISCOUNT");
            sql.push(") VALUES(");
            sql.push(`${demandaDespachoEncabezado.PICKING_DEMAND_HEADER_ID}`);
            sql.push(`,${demandaDespachoEncabezado.DOC_NUM}`);
            sql.push(`,'${demandaDespachoEncabezado.CLIENT_CODE}'`);
            sql.push(`,'${demandaDespachoEncabezado.CODE_ROUTE}'`);
            sql.push(`,'${demandaDespachoEncabezado.CODE_SELLER}'`);
            sql.push(`,${demandaDespachoEncabezado.TOTAL_AMOUNT}`);
            sql.push(`,'${demandaDespachoEncabezado.SERIAL_NUMBER}'`);
            sql.push(`,${demandaDespachoEncabezado.DOC_NUM_SEQUENCE}`);
            sql.push(`,${demandaDespachoEncabezado.EXTERNAL_SOURCE_ID}`);
            sql.push(`,${demandaDespachoEncabezado.IS_FROM_ERP}`);
            sql.push(`,${demandaDespachoEncabezado.IS_FROM_SONDA}`);
            sql.push(`,'${demandaDespachoEncabezado.LAST_UPDATE}'`);
            sql.push(`,'${demandaDespachoEncabezado.LAST_UPDATE_BY}'`);
            sql.push(`,${demandaDespachoEncabezado.IS_COMPLETED}`);
            sql.push(`,${demandaDespachoEncabezado.WAVE_PICKING_ID}`);
            sql.push(`,'${demandaDespachoEncabezado.CODE_WAREHOUSE}'`);
            sql.push(`,${demandaDespachoEncabezado.IS_AUTHORIZED}`);
            sql.push(`,${demandaDespachoEncabezado.ATTEMPTED_WITH_ERROR}`);
            sql.push(`,${demandaDespachoEncabezado.IS_POSTED_ERP}`);
            sql.push(`,'${demandaDespachoEncabezado.POSTED_ERP}'`);
            sql.push(`,'${demandaDespachoEncabezado.POSTED_RESPONSE}'`);
            sql.push(`,'${demandaDespachoEncabezado.ERP_REFERENCE}'`);
            sql.push(`,'${demandaDespachoEncabezado.CLIENT_NAME}'`);
            sql.push(`,'${demandaDespachoEncabezado.CREATED_DATE}'`);
            sql.push(`,'${demandaDespachoEncabezado.ERP_REFERENCE_DOC_NUM}'`);
            sql.push(`,${demandaDespachoEncabezado.DOC_ENTRY}`);
            sql.push(`,${demandaDespachoEncabezado.IS_CONSOLIDATED}`);
            sql.push(`,${demandaDespachoEncabezado.PRIORITY}`);
            sql.push(`,${demandaDespachoEncabezado.HAS_MASTERPACK}`);
            sql.push(`,${demandaDespachoEncabezado.POSTED_STATUS}`);
            sql.push(`,'${demandaDespachoEncabezado.OWNER}'`);
            sql.push(`,'${demandaDespachoEncabezado.CLIENT_OWNER}'`);
            sql.push(`,'${demandaDespachoEncabezado.MASTER_ID_SELLER}'`);
            sql.push(`,'${demandaDespachoEncabezado.SELLER_OWNER}'`);
            sql.push(`,'${demandaDespachoEncabezado.SOURCE_TYPE}'`);
            sql.push(`,'${demandaDespachoEncabezado.INNER_SALE_STATUS}'`);
            sql.push(`,'${demandaDespachoEncabezado.INNER_SALE_RESPONSE}'`);
            sql.push(`,'${demandaDespachoEncabezado.DEMAND_TYPE}'`);
            sql.push(`,'${demandaDespachoEncabezado.TRANSFER_REQUEST_ID}'`) ;
            sql.push(`,'${demandaDespachoEncabezado.ADDRESS_CUSTOMER}'`);
            sql.push(`,${demandaDespachoEncabezado.STATE_CODE}`);
            sql.push(`,${demandaDespachoEncabezado.MANIFEST_HEADER_ID}`);
            sql.push(`,'PENDING'`);
            sql.push(`,${demandaDespachoEncabezado.DISCOUNT}`);
            sql.push(`)`);
            trans.executeSql(sql.join(""));

            sql = null;
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido almacenar el encabezado de la demanda de despacho: ${error.message}`
            } as Operacion);
        }, () => { });
    }

    almacenarDemandaDeDespachoDetalle(demandaDespachoDetalle: any,
        errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sqlLimpiarDetalle: string = `DELETE FROM NEXT_PICKING_DEMAND_DETAIL WHERE PICKING_DEMAND_DETAIL_ID = ${
                demandaDespachoDetalle.PICKING_DEMAND_DETAIL_ID}`;

            trans.executeSql(sqlLimpiarDetalle);
            sqlLimpiarDetalle = null;

            let sql: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sql.push("INSERT INTO NEXT_PICKING_DEMAND_DETAIL(");
            sql.push("PICKING_DEMAND_DETAIL_ID,");
            sql.push("PICKING_DEMAND_HEADER_ID,");
            sql.push("MATERIAL_ID,");
            sql.push("MATERIAL_DESCRIPTION,");
            sql.push("REQUERIES_SEERIE,");
            sql.push("QTY,");
            sql.push("LINE_NUM,");
            sql.push("ERP_OBJECT_TYPE,");
            sql.push("PRICE,");
            sql.push("WAS_IMPLODED,");
            sql.push("QTY_IMPLODED,");
            sql.push("MASTER_ID_MATERIAL,");
            sql.push("MATERIAL_OWNER,");
            sql.push("ATTEMPTED_WITH_ERROR,");
            sql.push("IS_POSTED_ERP,");
            sql.push("POSTED_ERP,");
            sql.push("ERP_REFERENCE,");
            sql.push("POSTED_STATUS,");
            sql.push("POSTED_RESPONSE,");
            sql.push("INNER_SALE_STATUS,");
            sql.push("INNER_SALE_RESPONSE,");
            sql.push("TONE,");
            sql.push("CALIBER,");
            sql.push("IS_BONUS,");
            sql.push("DISCOUNT");
            sql.push(") VALUES(");
            sql.push(`${demandaDespachoDetalle.PICKING_DEMAND_DETAIL_ID}`);
            sql.push(`,${demandaDespachoDetalle.PICKING_DEMAND_HEADER_ID}`);
            sql.push(`,'${demandaDespachoDetalle.MATERIAL_ID}'`);
            sql.push(`,'${demandaDespachoDetalle.MATERIAL_DESCRIPTION}'`);
            sql.push(`,${demandaDespachoDetalle.REQUERIES_SEERIE}`);
            sql.push(`,${demandaDespachoDetalle.QTY}`);
            sql.push(`,${demandaDespachoDetalle.LINE_NUM}`);
            sql.push(`,${demandaDespachoDetalle.ERP_OBJECT_TYPE}`);
            sql.push(`,${demandaDespachoDetalle.PRICE}`);
            sql.push(`,${demandaDespachoDetalle.WAS_IMPLODED}`);
            sql.push(`,${demandaDespachoDetalle.QTY_IMPLODED}`);
            sql.push(`,'${demandaDespachoDetalle.MASTER_ID_MATERIAL}'`);
            sql.push(`,'${demandaDespachoDetalle.MATERIAL_OWNER}'`);
            sql.push(`,${demandaDespachoDetalle.ATTEMPTED_WITH_ERROR}`);
            sql.push(`,${demandaDespachoDetalle.IS_POSTED_ERP}`);
            sql.push(`,'${demandaDespachoDetalle.POSTED_ERP}'`);
            sql.push(`,'${demandaDespachoDetalle.ERP_REFERENCE}'`);
            sql.push(`,'${demandaDespachoDetalle.POSTED_STATUS}'`);
            sql.push(`,'${demandaDespachoDetalle.POSTED_RESPONSE}'`);
            sql.push(`,'${demandaDespachoDetalle.INNER_SALE_STATUS}'`);
            sql.push(`,'${demandaDespachoDetalle.INNER_SALE_RESPONSE}'`);
            sql.push(`,'${demandaDespachoDetalle.TONE}'`);
            sql.push(`,'${demandaDespachoDetalle.CALIBER}'`);
            sql.push(`,${demandaDespachoDetalle.IS_BONUS ? demandaDespachoDetalle.IS_BONUS : 0}`);
            sql.push(`,${demandaDespachoDetalle.DISCOUNT ? demandaDespachoDetalle.DISCOUNT : 0}`);
            sql.push(`)`);

            trans.executeSql(sql.join(""));

            sql = null;
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido almacenar el detalle de la demanda de despacho: ${error.message}`
            } as Operacion);
        }, () => { });
    }

    almacenarDemandaDeDespachoDetallePorNumeroDeSerie(demandaDespachoDetalleDeNumeroDeSerie: any,
        errorCallback: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sqlLimpiarDetalle: string = `DELETE FROM NEXT_PICKING_DEMAND_DETAIL_BY_SERIAL_NUMBER 
                                             WHERE MANIFEST_HEADER_ID = ${demandaDespachoDetalleDeNumeroDeSerie.MANIFEST_HEADER_ID} 
                                             AND MATERIAL_ID = '${demandaDespachoDetalleDeNumeroDeSerie.MATERIAL_ID}'
                                             AND SERIAL_NUMBER = '${demandaDespachoDetalleDeNumeroDeSerie.SERIAL_NUMBER}'`;

            trans.executeSql(sqlLimpiarDetalle);
            sqlLimpiarDetalle = null;

            let sql: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sql.push("INSERT INTO NEXT_PICKING_DEMAND_DETAIL_BY_SERIAL_NUMBER(");
            sql.push("MANIFEST_HEADER_ID,");
            sql.push("MATERIAL_ID,");
            sql.push("SERIAL_NUMBER");
            sql.push(") VALUES(");
            sql.push(`${demandaDespachoDetalleDeNumeroDeSerie.MANIFEST_HEADER_ID}`);
            sql.push(`,'${demandaDespachoDetalleDeNumeroDeSerie.MATERIAL_ID}'`);
            sql.push(`,'${demandaDespachoDetalleDeNumeroDeSerie.SERIAL_NUMBER}'`);
            sql.push(`)`);
            trans.executeSql(sql.join(""));

            sql = null;
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido almacenar el detalle de numero de serie de la demanda de despacho: ${error.message}`
            } as Operacion);
        }, () => { });
    }

    marcarTareasDeEntregaCompletadas(callBack: () => void, errorCallBack: (resultado: Operacion) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sqlClientes: string = ` SELECT RELATED_CLIENT_CODE FROM TASK WHERE TASK_TYPE = 'DELIVERY_SD' GROUP BY RELATED_CLIENT_CODE`;

            trans.executeSql(sqlClientes, [], (transReturn: SqlTransaction, results: SqlResultSet) => {
                if (results.rows.length > 0) {
                    for (var i = 0; i < results.rows.length; i++) {
                        let clientCode = <any>results.rows.item(i);

                        let sql: string[] = [];

                        sql.push(" UPDATE TASK ");
                        sql.push(" SET TASK_STATUS = 'COMPLETED' ");
                        sql.push(" ,COMPLETED_SUCCESSFULLY = 1 ");
                        sql.push(" ,REASON = 'Genero Gestion' ");
                        sql.push(" ,IS_POSTED = 2 ");
                        sql.push(" WHERE  TASK_TYPE = 'DELIVERY_SD' ");
                        sql.push(` AND RELATED_CLIENT_CODE = '${clientCode.RELATED_CLIENT_CODE}' `);
                        sql.push(" AND ( ");
                        sql.push(" SELECT COUNT(*)  ");
                        sql.push(" FROM NEXT_PICKING_DEMAND_HEADER ");
                        sql.push(" WHERE PROCESS_STATUS = 'PENDING' ");
                        sql.push(`AND CLIENT_CODE = '${clientCode.RELATED_CLIENT_CODE}'`);
                        sql.push(" ) = 0  ");

                        trans.executeSql(sql.join(""));
                        sql = null;
                        clientCode = null;
                    }
                }

            }, (error) => {
                errorCallBack({
                    codigo: -1,
                    resultado: ResultadoOperacionTipo.Error,
                    mensaje: 'No se ha podido almacenar el detalle de numero de serie de la demanda de despacho: ' + error
                } as Operacion);
            });
            sqlClientes = null;

        }, (error) => {
            errorCallBack({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido almacenar el detalle de numero de serie de la demanda de despacho: ${error}`
            } as Operacion);
        }, () => { });

    }

    almacenarInformacionDeCanastasPorManifiesto(basketInformation, errorCallBack: (resultado: any) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {

            let sql: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sql.push("INSERT INTO BASKET_BY_MANIFEST(");
            sql.push("MANIFEST_HEADER_ID,");
            sql.push("PICKING_DEMAND_HEADER_ID,");
            sql.push("BARCODE,");
            sql.push("DOC_NUM,");
            sql.push("ERP_REFERENCE_DOC_NUM");
            sql.push(") VALUES(");
            sql.push(`${basketInformation.MANIFEST_HEADER_ID}`);
            sql.push(`,'${basketInformation.PICKING_DEMAND_HEADER_ID}'`);
            sql.push(`,'${basketInformation.BARCODE}'`);
            sql.push(`,'${basketInformation.DOC_NUM}'`);
            sql.push(`,'${basketInformation.ERP_REFERENCE_DOC_NUM}'`);
            sql.push(`)`);
            trans.executeSql(sql.join(""));

            sql = null;
        }, (error: SqlError) => {
            errorCallBack({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido almacenar la información de las canastas debido a: ${error.message}`
            } as Operacion);
        }, () => { });
    }

    almacenarDataDeDemandasPorTarea(errorCallBack: (resultado: any) => void): void {
        SONDA_DB_Session.transaction((trans: SqlTransaction) => {
            let sqlLimpiarTareas: string = `DELETE FROM PICKING_DEMAND_BY_TASK `;

            trans.executeSql(sqlLimpiarTareas);
            sqlLimpiarTareas = null;

            let sql: string[] = [];
            // ReSharper disable once UsageOfPossiblyUnassignedValue
            sql.push(" INSERT INTO PICKING_DEMAND_BY_TASK (PICKING_DEMAND_HEADER_ID, TASK_ID, IS_POSTED, PICKING_DEMAND_STATUS) ");
            sql.push(" SELECT ");
            sql.push(" PDH.PICKING_DEMAND_HEADER_ID, ");
            sql.push(" T.TASK_ID, ");
            sql.push(" 0, ");
            sql.push(" PDH.PROCESS_STATUS ");
            sql.push(" FROM TASK T INNER JOIN ");
            sql.push(" NEXT_PICKING_DEMAND_HEADER PDH ON ");
            sql.push(" (PDH.CLIENT_CODE = T.RELATED_CLIENT_CODE AND T.TASK_TYPE = 'DELIVERY_SD') ");

            trans.executeSql(sql.join(""));

            sql = null;
        }, (error: SqlError) => {
            errorCallBack({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `Error al almacenar data de demandas por tarea debido a: ${error.message}`
            } as Operacion);
        }, () => { my_dialog("", "", "close"); });
    }

    obtenerManifiestos3PlParaSincronizacion(
        callback: (manifiestos: ManifiestoEncabezado[]) => void,
        errorCallback: (resultado: Operacion) => void): void {

        SONDA_DB_Session.readTransaction((trans: SqlTransaction) => {
            let sql = `SELECT DISTINCT MANIFEST_HEADER_ID FROM MANIFEST_HEADER WHERE IS_POSTED = 0`;
            trans.executeSql(sql,
                [],
                (transReturn: SqlTransaction, results: SqlResultSet) => {
                    let manifiestos: ManifiestoEncabezado[] = [];
                    if (results.rows.length > 0) {
                        for (let i = 0; i < results.rows.length; i++) {
                            let manifistoTemporal: any = results.rows.item(i);
                            let manifiesto = new ManifiestoEncabezado();
                            manifiesto.manifestHeaderId = manifistoTemporal.MANIFEST_HEADER_ID;
                            manifiestos.push(manifiesto);
                        }
                        callback(manifiestos);
                    } else {
                        callback(manifiestos);
                    }
                },
                (transReturn: SqlTransaction, error: SqlError) => {
                    errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: `No se ha podido obtener manifiestos a sincronizar debido a: ${error.message}`
                    } as Operacion);
                });
        }, (error: SqlError) => {
            errorCallback({
                codigo: -1,
                resultado: ResultadoOperacionTipo.Error,
                mensaje: `No se ha podido obtener manifiestos a sincronizar debido a: ${error.message}`
            } as Operacion);
        });

    }

    marcarManifiestoComoPosteadoEnElServidor(manifiesto: number, errorCallback: (resultado: Operacion) => void) {
        try {
            SONDA_DB_Session.transaction((trans: SqlTransaction) => {
                let sql: string = "";
                sql = `UPDATE  MANIFEST_HEADER SET IS_POSTED = 1 WHERE MANIFEST_HEADER_ID = ${manifiesto} `;
                trans.executeSql(sql);
            }, (error: SqlError) => {
                throw new Error(error.message);
            });
        } catch (e) {
            errorCallback({ codigo: -1, resultado: ResultadoOperacionTipo.Error, mensaje: `No se pudo marcar manifiesto ${manifiesto} como posteado debido a: ${e.message}` } as Operacion);
        }
    }


}


