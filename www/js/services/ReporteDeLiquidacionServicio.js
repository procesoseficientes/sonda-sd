var ReporteDeLiquidacionServicio = (function () {

    function ReporteDeLiquidacionServicio() {

    }

    ReporteDeLiquidacionServicio.prototype.ObtenerTotalFacturado = function (callBack, errorCallBack) {
        try {
            var este = this;
            var sql = [];
            SONDA_DB_Session.transaction(
                function (trans) {

                    if (localStorage.getItem("INVOICE_IN_ROUTE") &&
                        localStorage.getItem("INVOICE_IN_ROUTE") == SiNo.Si) {
                        sql.push("SELECT IFNULL(SUM(TOTAL_AMOUNT),0) AS TOTAL_FACTURADO");
                        sql.push(" FROM INVOICE_HEADER WHERE VOID_INVOICE_ID IS NULL");
                    } else {
                        sql.push("SELECT IFNULL(SUM(TOTAL_AMOUNT),0) AS TOTAL_FACTURADO");
                        sql.push(" FROM SONDA_DELIVERY_NOTE_HEADER");
                    }

                    trans.executeSql(sql.join(""), [],
                        function (transReturn, results) {
                            var totalFacturado = parseFloat(results.rows.item(0).TOTAL_FACTURADO);
                            este.ObtenerTotalFacturadoAlCredito(function (totalFacturadoAlCredito) {
                                callBack(totalFacturado, totalFacturadoAlCredito);
                            }, function (error) {
                                errorCallBack(error);
                            });
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }
                , function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.ObtenerTotalConsignado = function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "SELECT SUM(CH.TOTAL_AMOUNT) AS TOTAL_CONSIGNADO";
                    sql += " FROM CONSIGNMENT_HEADER AS CH " +
                        "WHERE CH.IS_RECONSIGN = 0 AND CH.IN_ROUTE = 1 AND CH.STATUS <> 'VOID' ";

                    trans.executeSql(sql, [],
                        function (transReturn, results) {
                            if (parseFloat(results.rows.item(0).TOTAL_CONSIGNADO) > 0) {
                                callBack(parseFloat(results.rows.item(0).TOTAL_CONSIGNADO));
                            } else {
                                callBack(0);
                            }
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }
                , function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.ObtenerTotalRecogido = function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "SELECT SUM(SCD.TOTAL_AMOUNT) AS TOTAL_RECOGIDO";
                    sql += " FROM SKU_COLLECTED_DETAIL AS SCD";

                    trans.executeSql(sql, [],
                        function (transReturn, results) {
                            if (parseFloat(results.rows.item(0).TOTAL_RECOGIDO) > 0) {
                                callBack(parseFloat(results.rows.item(0).TOTAL_RECOGIDO));
                            } else {
                                callBack(0);
                            }
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }
                , function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.ActualizarCantidadesVendidas = function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "SELECT ID.SKU";
                    sql += ", IFNULL(SUM(ID.QTY * IFNULL(ID.CONVERSION_FACTOR,1)),0) AS QTY_SOLD ";
                    sql += " FROM INVOICE_DETAIL AS ID ";
                    sql += " INNER JOIN INVOICE_HEADER AS IH ON(";
                    sql += " IH.INVOICE_NUM = ID.INVOICE_NUM)";
                    sql += " WHERE IH.IS_PAID_CONSIGNMENT = 0 ";
                    sql += " AND IH.VOID_INVOICE_ID IS NULL ";
                    sql += " GROUP BY ID.SKU ";

                    trans.executeSql(sql, [],
                        function (transReturn, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var sku = results.rows.item(i);
                                sql = "UPDATE SKU_HISTORY SET QTY_SOLD = " + sku.QTY_SOLD + " WHERE SKU = '" + sku.SKU + "'";
                                transReturn.executeSql(sql);
                            }
                            callBack();
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }
                , function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.ActualizrCantidadesConsignadas = function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "SELECT CD.SKU";
                    sql += ", IFNULL(SUM(CD.QTY),0) AS QTY_CONSIGNED";
                    sql += " FROM CONSIGNMENT_DETAIL AS CD";
                    sql += " INNER JOIN CONSIGNMENT_HEADER AS CH ON(";
                    sql += " CH.CONSIGNMENT_ID = CD.CONSIGNMENT_ID)";
                    sql += " WHERE CH.IN_ROUTE = 1 AND IS_RECONSIGN = 0";
                    sql += " GROUP BY CD.SKU";

                    trans.executeSql(sql, [],
                        function (transReturn, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var sku = results.rows.item(i);
                                sql = "UPDATE SKU_HISTORY SET QTY_CONSIGNED = " + sku.QTY_CONSIGNED + " WHERE SKU = '" + sku.SKU + "'";
                                transReturn.executeSql(sql);
                            }
                            callBack();
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }
                , function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.ActualizrCantidadesRecogidas = function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "SELECT SCD.CODE_SKU";
                    sql += " ,IFNULL(SUM(SCD.QTY_SKU),0) AS QTY_COLLECTED ";
                    sql += " FROM SKU_COLLECTED_DETAIL AS SCD ";
                    sql += " GROUP BY SCD.CODE_SKU ";

                    trans.executeSql(sql, [],
                        function (transReturn, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var sku = results.rows.item(i);
                                sql = "UPDATE SKU_HISTORY SET QTY_COLLECTED = " + sku.QTY_COLLECTED + " WHERE SKU = '" + sku.CODE_SKU + "'";

                                transReturn.executeSql(sql);
                            }
                            callBack();
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }
                , function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.AgregarCantidadesRecogidasEnEntregas = function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "SELECT PDD.MATERIAL_ID";
                    sql += ",PDD.MATERIAL_DESCRIPTION ";
                    sql += " ,CASE PDH.PROCESS_STATUS ";
                    sql += " WHEN 'CANCELED' THEN PDD.QTY ";
                    sql += " WHEN 'DELIVERED' THEN (PDD.QTY - DND.QTY) ";
                    sql += " END AS QTY_COLLECTED ";
                    sql += " ,SH.SKU AS SKU_HISTORY";
                    sql += " FROM NEXT_PICKING_DEMAND_DETAIL PDD ";
                    sql += " INNER JOIN NEXT_PICKING_DEMAND_HEADER PDH ";
                    sql += " ON (PDH.PICKING_DEMAND_HEADER_ID = PDD.PICKING_DEMAND_HEADER_ID)";
                    sql += " LEFT JOIN SONDA_DELIVERY_NOTE_DETAIL DND";
                    sql += " ON (DND.CODE_SKU = PDD.MATERIAL_ID)";
                    sql += " LEFT JOIN SKU_HISTORY SH";
                    sql += " ON (SH.SKU = PDD.MATERIAL_ID)";
                    sql += " GROUP BY PDD.MATERIAL_ID";

                    trans.executeSql(sql, [],
                        function (transReturn, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var sku = results.rows.item(i);
                                if (sku.SKU_HISTORY) {
                                    sql = "UPDATE SKU_HISTORY SET QTY_COLLECTED = QTY_COLLECTED + " + sku.QTY_COLLECTED + " WHERE SKU = '" + sku.MATERIAL_ID + "'";
                                } else {
                                    sql = "INSERT INTO SKU_HISTORY (SKU, SKU_NAME, QTY_COLLECTED) VALUES ('" + sku.MATERIAL_ID + "', '" + sku.MATERIAL_DESCRIPTION + "', " + sku.QTY_COLLECTED + ")  ";
                                }
                                transReturn.executeSql(sql);
                            }
                            callBack();
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }
                , function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };


    ReporteDeLiquidacionServicio.prototype.ObtenerInformacionDeInventario = function (callBack, errorCallBack) {
        try {
            var sql = "";
            var skusInventario = new Array();
            SONDA_DB_Session.transaction(function (trans) {

                sql = "SELECT " +
                    "SH.SKU" +
                    ", SH.SKU_NAME" +
                    ", IFNULL(SH.ON_HAND, 0) AS INITIAL_INV " +
                    ", IFNULL(SH.QTY_SOLD, 0) AS QTY_SOLD " +
                    ", IFNULL(SH.QTY_CONSIGNED, 0) AS QTY_CONSIGNED" +
                    ", IFNULL(SH.QTY_COLLECTED, 0) AS QTY_COLLECTED" +
                    ", IFNULL(SH.QTY_TRANSFERED,0) QTY_TRANSFERED" +
                    ", ((IFNULL(SH.ON_HAND, 0) - IFNULL(SH.QTY_SOLD, 0) - IFNULL(SH.QTY_CONSIGNED, 0)) + IFNULL(SH.QTY_COLLECTED, 0) + IFNULL(SH.QTY_TRANSFERED,0)) AS DIFFERENCE " +
                    "FROM SKU_HISTORY AS SH " +
                    "WHERE IFNULL(SH.ON_HAND, 0) > 0 OR (IFNULL(SH.QTY_SOLD, 0) > 0 OR IFNULL(SH.QTY_CONSIGNED, 0) > 0 OR IFNULL(SH.QTY_COLLECTED, 0) > 0 OR IFNULL(SH.QTY_TRANSFERED,0) > 0) " +
                    "ORDER BY QTY_SOLD > 0, QTY_CONSIGNED > 0, QTY_COLLECTED > 0";
                trans.executeSql(sql, [], function (transResult, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        skusInventario.push(results.rows.item(i));
                    }
                    callBack(skusInventario);
                }, function (err, transResults) {
                    if (err.code !== 0) {
                        errorCallBack(err.message);
                    }
                });
            }, function (err) {
                if (err.code !== 0) {
                    errorCallBack(err.message);
                }
            });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.ImprimirReporteDeLiquidacion = function (formato, callBack, errorCallBack) {
        try {
            ConectarImpresora(localStorage.getItem('PRINTER_ADDRESS'), function () {
                Imprimir(formato, function () {
                    callBack();
                }, function (e) {
                    errorCallBack(e);
                });
            }, function () {
                errorCallBack("Lo sentimos, no ha sido posible imprimir el reporte.");
            });
        } catch (e) {
            errorCallBack(e.message);
        }
    };

    ReporteDeLiquidacionServicio.prototype.ActualizarCantidadesTransferidas = function (callBack, errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "SELECT D.SKU_CODE";
                    sql += ", IFNULL(SUM(D.QTY),0) AS QTY_TRANSFER ";
                    sql += " FROM TRANSFER_DETAIL AS D ";
                    sql += " INNER JOIN TRANSFER_HEADER AS H ON(H.TRANSFER_ID = D.TRANSFER_ID)";
                    sql += " WHERE H.STATUS = '" + EstadoDeTransferencia.Transferido + "' ";
                    sql += " GROUP BY D.SKU_CODE";

                    trans.executeSql(sql, [],
                        function (transReturn, results) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var sku = results.rows.item(i);
                                sql = "UPDATE SKU_HISTORY SET QTY_TRANSFERED = " + sku.QTY_TRANSFER + " WHERE SKU = '" + sku.SKU_CODE + "'";

                                transReturn.executeSql(sql);
                            }
                            callBack();
                        }, function (transReturn, error) {
                            if (error.code !== 0) {
                                errorCallBack(error.message);
                            }
                        });
                }, function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };


    ReporteDeLiquidacionServicio.prototype.ObtenerTotalDeDepositosDeRuta = function (callBack, errorCallBack) {
        try {
            var totalDepositos = 0;
            SONDA_DB_Session.transaction(function (trans) {
                var sql =
                    "SELECT COUNT(*) AS QTY_DEPOSITS, SUM(AMOUNT) AS TOTAL_AMOUNT FROM DEPOSITS";
                trans.executeSql(sql,
                    [],
                    function (transResult, results) {
                        if (results.rows.length > 0) {
                            totalDepositos = results.rows.item(0).TOTAL_AMOUNT;
                            callBack(totalDepositos);
                        } else {
                            callBack(totalDepositos);
                        }
                    },
                    function (transResult, error) {
                        if (error.code !== 0) {
                            errorCallBack(error.message);
                        }
                    });
            },
                function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    }

    ReporteDeLiquidacionServicio.prototype.ObtenerDetalleDeDepositosDeRuta = function (callBack, errorCallBack) {
        try {
            var listaDeDepositos = [];
            SONDA_DB_Session.transaction(function (trans) {
                var sql =
                    "SELECT D.ACCOUNT_NUM, D.AMOUNT FROM DEPOSITS AS D";
                trans.executeSql(sql,
                    [],
                    function (transResult, results) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var depositoTemp = results.rows.item(i);
                                listaDeDepositos.push(depositoTemp);
                            }
                            callBack(listaDeDepositos);
                        } else {
                            callBack(listaDeDepositos);
                        }
                    },
                    function (transResult, error) {
                        if (error.code !== 0) {
                            errorCallBack(error.message);
                        }
                    });
            },
                function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    }

    ReporteDeLiquidacionServicio.prototype.limpiarInformacionDeReporteDeLiquidacion = function (callBack,
        errorCallBack) {
        try {
            var sql = "";
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql = "UPDATE SKU_HISTORY SET QTY_SOLD = 0, QTY_CONSIGNED = 0, QTY_COLLECTED = 0, QTY_TRANSFERED = 0";
                    trans.executeSql(sql);
                    callBack();
                }, function (error) {
                    if (error.code !== 0) {
                        errorCallBack(error.message);
                    }
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    }

    ReporteDeLiquidacionServicio.prototype.ObtenerNotasDeEntrega = function (callBack, errorCallBack) {
        var este = this;
        try {
            var notasDeEntrega = [];
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql.push(" SELECT ");
                sql.push(" DNH.DELIVERY_NOTE_ID ");
                sql.push(" ,DNH.DOC_SERIE ");
                sql.push(" ,DNH.DOC_NUM ");
                sql.push(" ,DNH.CODE_CUSTOMER ");
                sql.push(" ,DNH.DELIVERY_NOTE_ID_HH ");
                sql.push(" ,DNH.TOTAL_AMOUNT ");
                sql.push(" ,DNH.IS_POSTED ");
                sql.push(" ,DNH.CREATED_DATETIME ");
                sql.push(" ,DNH.POSTED_DATETIME ");
                sql.push(" ,DNH.TASK_ID ");
                sql.push(" ,DNH.INVOICE_ID");
                sql.push(" ,CASE  ");
                sql.push(" WHEN IH.STATUS = 1 THEN 'ACTIVA' ");
                sql.push(" WHEN IH.STATUS IS NULL THEN 'N/A' ");
                sql.push(" WHEN IH.STATUS = 3 THEN 'CANCELADA' ");
                sql.push(" ELSE 'ACTIVA' ");
                sql.push(" END AS INVOICE_STATUS ");
                sql.push(" ,DNH.CONSIGNMENT_ID ");
                sql.push(" ,DNH.DEVOLUTION_ID ");
                sql.push(" ,DNH.BILLED_FROM_SONDA ");
                sql.push(" FROM SONDA_DELIVERY_NOTE_HEADER AS DNH ");
                sql.push(" LEFT JOIN INVOICE_HEADER AS IH ON( ");
                sql.push(" IH.INVOICE_NUM = DNH.INVOICE_ID ) ");

                trans.executeSql(sql.join(""),
                    [],
                    function (readtransResult, results) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var notaDeEntregaTemp = results.rows.item(i);
                                notasDeEntrega.push(notaDeEntregaTemp);
                            }
                            este.ObtenerClienteDesdeTablaTareasPorCodigoDeCliente(notasDeEntrega, callBack, errorCallBack, 0, readtransResult);
                        } else {
                            callBack(notasDeEntrega);
                        }
                    },
                    function (transResult, error) {
                        if (error.code !== 0) {
                            errorCallBack("Error al obtener notas de entrega " + error.message);
                        }
                    });
            },
                function (error) {
                    if (error.code !== 0) {
                        errorCallBack("Error al obtener notas de entrega " + error.message);
                    }
                });
        } catch (e) {
            errorCallBack("Error al obtener notas de entrega " + e.message);
        }
    }

    ReporteDeLiquidacionServicio.prototype.ObtenerClienteDesdeTablaTareasPorCodigoDeCliente = function (notasDeEntrega, callBack, errorCallBack, indice, transaccion) {
        var este = this;
        try {
            if (this.esUltimoRegistro(indice, notasDeEntrega.length)) {
                var documentoActual = notasDeEntrega[indice];
                var sql = [];
                sql.push("SELECT  RELATED_CLIENT_CODE ");
                sql.push(" , RELATED_CLIENT_NAME , RGA_CODE, NIT ");
                sql.push(" ,PHONE_CUSTOMER, TASK_ADDRESS ");
                sql.push(" FROM TASK AS T ");
                sql.push(" WHERE RELATED_CLIENT_CODE = '" + documentoActual.CODE_CUSTOMER + "' LIMIT 1 ");

                transaccion.executeSql(sql.join(""),
                    [],
                    function (transResult, results) {
                        if (results.rows.length > 0) {
                            documentoActual.cliente = results.rows.item(0);
                        }
                        notasDeEntrega[indice] = documentoActual;
                        este.ObtenerClienteDesdeTablaTareasPorCodigoDeCliente(notasDeEntrega, callBack, errorCallBack, indice + 1, transaccion);
                    },
                    function (transResult, error) {
                        errorCallBack("Error al obtener cliente de tarea " + error.message);
                    });
            } else {
                callBack(notasDeEntrega);
            }
        } catch (e) {
            errorCallBack("Error al obtener cliente de tarea " + e.message);
        }
    }

    ReporteDeLiquidacionServicio.prototype.esUltimoRegistro = function (indiceDeDocumento, cantidadDeDocumentos) {
        return indiceDeDocumento < cantidadDeDocumentos;
    };

    ReporteDeLiquidacionServicio.prototype.ObtenerOrdenesDeVentaNoEntregadas = function (callBack, errorCallBack) {
        try {
            var ordenesDeVentaNoEntregadas = [];
            SONDA_DB_Session.transaction(function (trans) {
                var sql = [];
                sql.push(" SELECT ");
                sql.push(" PDH.PICKING_DEMAND_HEADER_ID ");
                sql.push(" ,PDH.CLIENT_CODE ");
                sql.push(" ,SUM(PDD.QTY * PDD.PRICE) AS TOTAL_AMOUNT ");
                sql.push(" ,PDH.CLIENT_NAME ");
                sql.push(" ,PDH.PROCESS_STATUS ");
                sql.push(" ,PDH.MANIFEST_HEADER_ID ");
                sql.push(" ,PDH.ERP_REFERENCE_DOC_NUM ");
                sql.push(" ,PDH.DOC_NUM ");
                sql.push(" FROM NEXT_PICKING_DEMAND_HEADER PDH ");
                sql.push(" LEFT JOIN DELIVERY_CANCELED DC ");
                sql.push(" ON (DC.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID) ");
                sql.push(" INNER JOIN NEXT_PICKING_DEMAND_DETAIL PDD ");
                sql.push(" ON (PDD.PICKING_DEMAND_HEADER_ID = PDH.PICKING_DEMAND_HEADER_ID) ");
                sql.push(" WHERE PDH.PROCESS_STATUS IN ('PENDING','CANCELED') ");
                sql.push(" GROUP BY PDH.PICKING_DEMAND_HEADER_ID ");
                sql.push(" ,PDH.CLIENT_CODE ,PDH.CLIENT_NAME, PDH.PROCESS_STATUS ");
                sql.push(" ,PDH.MANIFEST_HEADER_ID ,PDH.ERP_REFERENCE_DOC_NUM ,PDH.DOC_NUM ");

                trans.executeSql(sql.join(""),
                    [],
                    function (transResult, results) {
                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                var ordenDeVentaTemp = results.rows.item(i);
                                ordenesDeVentaNoEntregadas.push(ordenDeVentaTemp);
                            }
                            callBack(ordenesDeVentaNoEntregadas);
                        } else {
                            callBack(ordenesDeVentaNoEntregadas);
                        }
                    },
                    function (transResult, error) {
                        if (error.code !== 0) {
                            errorCallBack("Error al obtener notas de entrega " + error.message);
                        }
                    });
            },
                function (error) {
                    if (error.code !== 0) {
                        errorCallBack("Error al obtener notas de entrega " + error.message);
                    }
                });
        } catch (e) {
            errorCallBack("Error al obtener notas de entrega " + e.message);
        }
    }

    ReporteDeLiquidacionServicio.prototype.ObtenerTotalFacturadoAlCredito = function (callBack, errorCallBack) {
        try {
            var sql = [];
            SONDA_DB_Session.transaction(
                function (trans) {
                    sql.push("SELECT IFNULL(SUM(CREDIT_AMOUNT), 0) AS TOTAL_FACTURADO_AL_CREDITO");
                    sql.push(" FROM INVOICE_HEADER WHERE VOID_INVOICE_ID IS NULL");

                    trans.executeSql(sql.join(""),
                        [],
                        function (transReturn, results) {
                            callBack(parseFloat(results.rows.item(0).TOTAL_FACTURADO_AL_CREDITO));
                        },
                        function (transReturn, error) {
                            errorCallBack(error.message);
                        });
                },
                function (error) {
                    errorCallBack(error.message);
                });
        } catch (e) {
            errorCallBack(e.message);
        }
    };


    ReporteDeLiquidacionServicio.prototype.ResumenFacturaLiquidacion = function (callBack, errorCallBack) {
        var _this = this;
        try {
            var reglaServicio = new ReglaServicio();
            var resumenLiquidacionFacturas = [];
            var sql = [];
            sql.push("SELECT INVOICE_NUM, CREDIT_AMOUNT, CASH_AMOUNT, TOTAL_AMOUNT, STATUS");
            sql.push(" FROM INVOICE_HEADER WHERE INVOICE_NUM IS NOT NULL AND IS_CREDIT_NOTE = 0");

            reglaServicio.obtenerRegla(ReglaTipo.VisualizarEImprimirResumenDeFacturasEnReporteDeLiquidacion,
                function(resultados) {

                    if (_this.SeMuestraEImprimeReporteDeFacturasEnReporteDeLiquidacion(resultados)) {
                        SONDA_DB_Session.transaction(
                            function(trans) {
                                trans.executeSql(sql.join(""),
                                    [],
                                    function(transResult, results) {
                                        for (var i = 0; i < results.rows.length; i++) {
                                            var resumenLiquidacionFacturasTemp = results.rows.item(i);
                                            resumenLiquidacionFacturas.push(resumenLiquidacionFacturasTemp);
                                        }
                                        callBack(resumenLiquidacionFacturas, true);
                                    },
                                    function(transReturn, error) {
                                        if (error.code !== 0) {
                                            errorCallBack("Error al obtener resumen de facturas: " + error.message);
                                        }
                                    });
                            },
                            function(error) {
                                errorCallBack(error.message);
                            });
                    } else {
                        callBack(resumenLiquidacionFacturas, false);
                    }

                },
                function(error) {
                    console.log("Error al verificar si se muestra e imprime el resúmen de facturas => " + error);
                    notify("Error al verificar si se muestra e imprime el resúmen de facturas.");
                });

        } catch (e) {
            errorCallBack(e.message);
        }
    };


    ReporteDeLiquidacionServicio.prototype
        .SeMuestraEImprimeReporteDeFacturasEnReporteDeLiquidacion = function (resultadoDeConsulta) {
            if (resultadoDeConsulta.rows.length > 0) {
                return resultadoDeConsulta.rows.item(0).ENABLED.toUpperCase() === "SI";
            } else {
                return false;
            }
        };

    return ReporteDeLiquidacionServicio;
}());