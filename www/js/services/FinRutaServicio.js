function EjecutarConsulta(transaccion, consultas, indice, callback, errorCallback) {
    if (indice < consultas.length) {
        var consultaActual = consultas[indice];
        transaccion.executeSql(consultaActual.consulta,
            [],
            function (trans, results) {
                if (results.rows.length > 0) {
                    for (var i = 0; i < results.rows.length; i++) {
                        consultaActual.documentos.push(results.rows.item(i));
                    }
                    consultas[indice] = consultaActual;
                    EjecutarConsulta(trans, consultas, indice + 1, callback, errorCallback);
                } else {
                    EjecutarConsulta(trans, consultas, indice + 1, callback, errorCallback);
                }
            },
            function (trans, err) {
                if (err.code !== SqliteError.Desconocido) {
                    errorCallback(err.message);
                }
            });
    } else {
        callback(consultas);
    }
}

function ObtenerDocumentosParaControlDeFinDeRuta(callback, errorCallback) {
    try {
        var consultas = [
            {
                consulta: "SELECT * FROM TASK WHERE TASK_STATUS<>'COMPLETED' AND TASK_TYPE ='PRESALE'",
                tipoDeDocumento: "TAREAS DE PREVENTA NO COMPLETADAS",
                documentos: [],
                habilitadoParaReporte: false
            }, {
                consulta:
                    "SELECT CLIENT_ID AS DOC_NO, 'Scouting' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                        ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE " +
                        "FROM CLIENTS WHERE IS_POSTED IN (0,1,2)",
                tipoDeDocumento: "CLIENTES",
                documentos: [],
                habilitadoParaReporte: true
            }, {
                consulta:
                    "SELECT PAYMENT_NUM AS DOC_NO, 'Pago' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                        ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE" +
                        ", DOC_SERIE, DOC_NUM " +
                        "FROM PAYMENT_HEADER WHERE IS_POSTED IN ('0','1','2')",
                tipoDeDocumento: "PAGOS",
                documentos: [],
                habilitadoParaReporte: true
            }, {
                consulta: "SELECT CASE SALES_ORDER_ID_BO " +
                    "WHEN 0 THEN SALES_ORDER_ID " +
                    "WHEN NULL THEN SALES_ORDER_ID " +
                    "ELSE SALES_ORDER_ID_BO END AS DOC_NO" +
                    ", 'Preventa' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                    ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE" +
                    ", DOC_SERIE, DOC_NUM FROM SALES_ORDER_HEADER WHERE (IS_POSTED IN (0,1,2) OR SINC IN (0,1,2) OR IS_POSTED_VOID IN (0,1,2)) AND IS_DRAFT != 1",
                tipoDeDocumento: "ORDENES DE VENTA",
                documentos: [],
                habilitadoParaReporte: true
            }, {
                consulta:
                    "SELECT CASE SALES_ORDER_ID_BO " +
                        "WHEN 0 THEN SALES_ORDER_ID " +
                        "WHEN NULL THEN SALES_ORDER_ID " +
                        "ELSE SALES_ORDER_ID_BO END AS DOC_NO" +
                        ", 'Borrador Preventa' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                        ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE" +
                        ", DOC_SERIE, DOC_NUM FROM SALES_ORDER_HEADER WHERE (IS_POSTED IN (0,1,2) OR SINC IN (0,1,2) OR IS_POSTED_VOID IN (0,1,2) OR IS_UPDATED = 0) AND IS_DRAFT = 1",
                tipoDeDocumento: "BORRADORES DE ORDENES DE VENTA",
                documentos: [],
                habilitadoParaReporte: true
            }, {
                consulta:
                    "SELECT CUSTOMER_CHANGE_ID AS DOC_NO, 'Cambio Cliente' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                        ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE " +
                        "FROM CUSTOMER_CHANGE WHERE IS_POSTED IN (0,1,2)",
                tipoDeDocumento: "CAMBIOS DE CLIENTES",
                documentos: [],
                habilitadoParaReporte: true
            }, {
                consulta:
                    "SELECT CASE WHEN TAKE_INVENTORY_ID_BO = 0 THEN TAKE_INVENTORY_ID ELSE TAKE_INVENTORY_ID_BO END AS DOC_NO, 'Toma Inventario' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                        ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE" +
                        ", DOC_SERIE, DOC_NUM FROM TAKE_INVENTORY_HEADER WHERE IS_POSTED IN (0,1,2)",
                tipoDeDocumento: "TOMAS DE INVENTARIO",
                documentos: [],
                habilitadoParaReporte: true
            }, {
                consulta:
                    "SELECT CASE SALES_ORDER_ID_BO " +
                        "WHEN 0 THEN SALES_ORDER_ID " +
                        "WHEN NULL THEN SALES_ORDER_ID " +
                        "ELSE SALES_ORDER_ID_BO END AS DOC_NO" +
                        ", 'Preventa Validada' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                        ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE" +
                        ", DOC_SERIE, DOC_NUM FROM SALES_ORDER_HEADER WHERE IS_POSTED_VALIDATED IN (0,1,2)",
                tipoDeDocumento: "ORDENES DE VENTA VALIDADAS",
                documentos: [],
                habilitadoParaReporte: false
            }
            , {
                consulta:
                    "SELECT DOC_NUM AS DOC_NO" +
                        ", 'Hist. Promo.' AS DOC_TYPE, IS_POSTED AS DOC_STATUS" +
                        ", CASE WHEN SERVER_POSTED_DATETIME IS NULL THEN 'Pendiente' ELSE strftime('%H:%M:%S',SERVER_POSTED_DATETIME) END AS DOC_POSTED_DATE" +
                        ", DOC_SERIE, DOC_NUM FROM HISTORY_BY_PROMO WHERE IS_POSTED IN (1,2)",
                tipoDeDocumento: "HISTORIAL DE PROMO",
                documentos: [],
                habilitadoParaReporte: true
            }
        ];

        SONDA_DB_Session.readTransaction(function(tx) {
            EjecutarConsulta(tx, consultas, 0, callback, errorCallback);
        }, function(err) {
            if (err.code !== SqliteError.Desconocido) {
                errorCallback(err.message);
            } 
        });
    } catch (e) {
        errorCallback("No se pudieron obtener los documentos para fin de ruta debido a: " + e.message);
    }
}

function ObtenerPagos(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT ";
            sql += " PAYMENT_TYPE ";
            sql += " , SUM(AMOUNT_PAID) AS TOTAL ";
            sql += " FROM PAYMENT_DETAIL ";
            sql += " GROUP BY PAYMENT_TYPE ";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ObtenerPagosPorConsignacion(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT ";
            sql += " CD.SKU ";
            sql += " , SKU_NAME ";
            sql += " , SUM(CD.QTY) AS QTY ";
            sql += " , SUM(TOTAL_LINE) AS TOTAL ";
            sql += " FROM CONSIGNMENT_DETAIL CD";
            sql += " , SKUS S";
            sql += " WHERE CD.SKU = S.SKU";
            sql += " GROUP BY CD.SKU, S.SKU_NAME";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ObtenerVentas(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT";
            sql += " D.SKU";
            sql += " ,D.SKU_NAME";
            sql += " ,SUM(D.QTY) AS QTY";
            sql += " ,SUM(D.TOTAL_LINE) AS TOTAL";
            sql += " FROM INVOICE_DETAIL D";
            sql += " INNER JOIN INVOICE_HEADER H ON (H.INVOICE_NUM = D.INVOICE_NUM)";
            sql += " WHERE H.IS_POSTED != 3";
            sql += " GROUP BY D.SKU, D.SKU_NAME";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ObtenerVentasPorCliente(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT";
            sql += " H.INVOICE_NUM";
            sql += " ,H.SAT_SERIE";
            sql += " ,H.CLIENT_ID";
            sql += " ,H.CLIENT_NAME";
            sql += " ,H.TOTAL_AMOUNT";
            sql += " FROM INVOICE_HEADER H";
            sql += " WHERE H.IS_POSTED != 3";
            sql += " ORDER BY H.CLIENT_ID";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ImprimirReporteFinDeRuta(formatoImpresion, callback, errCallback) {
    bluetoothSerial.write(formatoImpresion,
                        function () {
                            callback();
                        },
                        function () {
                            errCallback("Imposible Imprimir");
                        });
}

function BorrarFacturaEncabezado(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE ";
            sql += " FROM INVOICE_HEADER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarFacturaDetalle(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE ";
            sql += " FROM INVOICE_DETAIL ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarPagosDetalle(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM PAYMENT_DETAIL ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarPagosEncabezado(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE ";
            sql += " FROM PAYMENT_HEADER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarConsignacionEncabezado(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE ";
            sql += " FROM CONSIGNMENT_HEADER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarConsignacionDetalle(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE ";
            sql += " FROM CONSIGNMENT_DETAIL ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarClientes(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM CLIENTS ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarClientesFrecuencia(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM CLIENTS_FREQUENCY ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarTareas(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM TASK ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarRuta(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM PRESALES_ROUTE ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarOrdenesDeCompraEncabezado(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM SALES_ORDER_HEADER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarOrdenesDeCompraDetalle(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE ";
            sql += " FROM SALES_ORDER_DETAIL ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ObtenerProductosDeOrdenesDeVenta(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT";
            sql += " d.SKU, s.SKU_NAME, SUM(d.QTY) QTY, SUM(d.TOTAL_LINE) TOTAL";
            sql += " FROM SALES_ORDER_DETAIL d, SKU_PRESALE s";
            sql += " WHERE d.SKU = s.SKU";
            sql += " GROUP BY s.SKU,s.SKU_NAME";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ObtenerClientesDeOrdenesDeVenta(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT";
            sql += " h.SALES_ORDER_ID, c.CLIENT_ID, c.CLIENT_NAME, h.TOTAL_AMOUNT";
            sql += " FROM SALES_ORDER_HEADER h, CLIENTS c";
            sql += " WHERE h.CLIENT_ID = c.CLIENT_ID";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ObtenerOrdenesDeVentaSincronizadas(obtenerTodas, callback, errCallback) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT H.SALES_ORDER_ID, H.SALES_ORDER_ID_BO, H.DOC_SERIE, H.DOC_NUM, COUNT(D.SKU) AS DETAIL_NUM";
            sql += " FROM SALES_ORDER_HEADER H";
            sql += " INNER JOIN SALES_ORDER_DETAIL D ON (H.SALES_ORDER_ID = D.SALES_ORDER_ID AND H.DOC_SERIE = D.DOC_SERIE AND H.DOC_NUM = D.DOC_NUM)";
            sql += " WHERE H.IS_POSTED =" + EstadoEnvioDoc.EnviadoConAcuseDeRecibido;
            sql += " AND H.IS_DRAFT = 0 ";
            if (!obtenerTodas) {
                sql += " AND H.IS_POSTED_VALIDATED IN (0,1) ";
            }
            sql += " GROUP BY H.SALES_ORDER_ID, H.SALES_ORDER_ID_BO, H.DOC_SERIE, H.DOC_NUM";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results);
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallback(err);
                }
            );
        },
        function (err) {
            errCallback(err);
        }
    );
}

function FormarEnvioDeOrdenesDeVenta(ordenesDeVenta, callback, errCallback) {
    try {
        var enviarOrdenesDeVenta = Array();

        for (var i = 0; i < ordenesDeVenta.rows.length; i++) {
            var ordenDeVenta = {
                SalesOrderIdBo: ordenesDeVenta.rows.item(i).SALES_ORDER_ID_BO
                , SalesOrderId: ordenesDeVenta.rows.item(i).SALES_ORDER_ID
                , DocSerie: ordenesDeVenta.rows.item(i).DOC_SERIE
                , DocNum: ordenesDeVenta.rows.item(i).DOC_NUM
                , DetailNum: ordenesDeVenta.rows.item(i).DETAIL_NUM
            };
            enviarOrdenesDeVenta.push(ordenDeVenta);
        }
        callback(enviarOrdenesDeVenta);
    } catch (e) {
        errCallback(e);
    }
}

function BorrarListaDePreciosPorSku(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM PRICE_LIST_BY_SKU ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarListaDePreciosPorCliente(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM PRICE_LIST_BY_CUSTOMER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarSkusPreventa(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM SKU_PRESALE ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarFamiliasSkus(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM FAMILY_SKU ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

//-----------------------------------------------------------
function BorrarSecuenciaDeDocumentos(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM DOCUMENT_SEQUENCE ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarHistorialDeVentas(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM ITEM_HISTORY ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarPaquetesDeConversion(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM PACK_CONVERSION ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarUnidadesDePaquete(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM PACK_UNIT ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarUnidadesDePaquetePorSku(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM PACK_UNIT_BY_SKU ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarRazones(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM REASONS ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarReglas(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM RULE ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarSkusParaVentaDirecta(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM SKUS ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarSeries(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM SKU_SERIES ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarSecuenciasSwift(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM SWIFT_SEQUENCES ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarEtiquetas(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM TAGS ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarEtiquetasPorCliente(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM TAGS_X_CUSTOMER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarTareasAuxiliares(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM TASK_AUX ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}


function BorrarListaDePreciosPorSkuYEscala(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM PRICE_LIST_BY_SKU_PACK_SCALE ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarHistorialDeArticulos(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM ITEM_HISTORY ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarTomaDeInventarioEncabezado(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM TAKE_INVENTORY_HEADER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarTomaDeInventarioDetalle(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "DELETE ";
            sql += " FROM TAKE_INVENTORY_DETAIL ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarCambiosDeClientes(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM CUSTOMER_CHANGE ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarTagsCambiosDeClientes(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM TAG_X_CUSTOMER_CHANGE ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarBonificacionesPorCliente(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM BONUS_LIST_BY_CUSTOMER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarBonificacionesPorSku(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM BONUS_LIST_BY_SKU ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarDescuentosPorCliente(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM DISCOUNT_LIST_BY_CUSTOMER ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarDescuentosPorSku(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE ";
            sql += " FROM DISCOUNT_LIST_BY_SKU ";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarCombo(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM COMBO";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarSkuPorCombo(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM SKU_BY_COMBO";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarListaDeBonificacionPorCombo(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM BONUS_LIST_BY_COMBO";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarBonificacionPorCombo(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM BONUS_LIST_BY_COMBO_SKU";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarBonificacionPorMultiplo(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM BONUS_LIST_BY_SKU_MULTIPLE";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarVentaPorMultiplo(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM SKU_SALES_BY_MULTIPLE_LIST_BY_SKU";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarBorradorDeBono(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM BONUS_DRAFT";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarListaDeBonosPorMontoGeneral(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM BONUS_LIST_BY_GENERAL_AMOUNT";
            tx.executeSql(sql, [],
                function () {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarListaDeDescuentoPorMontoGeneral(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM DISCOUNT_LIST_BY_GENERAL_AMOUNT";
            tx.executeSql(sql, [],
                function () {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function BorrarHistoricoDePromo(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " DELETE FROM HISTORY_BY_PROMO";
            tx.executeSql(sql, [],
                function (tx, results) {
                    callback();
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
         function (err) {
             errCallBack(err);
         }
    );
}
