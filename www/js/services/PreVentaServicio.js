
function AumentarEnUnoProductoDeBorradorDeOrdenDeVenta(callback, errcallback, idProducto) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "";
            sql = "SELECT A.SKU, A.PRICE, A.SKU_NAME, A.QTY, A.TOTAL_LINE, A.REQUERIES_SERIE, A.LINE_SEQ,";
            sql += "  0 IS_KIT, A.SERIE, A.SERIE_2, B.ON_HAND-B.IS_COMITED AVAILABLE  FROM SALES_ORDER_DETAIL A,  ";
            sql += " SKU_PRESALE B WHERE A.SALES_ORDER_ID = -9999 AND B.SKU = A.SKU  ";
            sql += " AND A.SKU ='" + idProducto + "'";
            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length <= 0) {
                        errcallback({ code: -1, message: "No existe el articulo" + idProducto });
                    } else {


                        var inventario = {
                            SKU: results.rows.item(0).SKU,
                            PRICE: results.rows.item(0).PRICE,
                            SKU_NAME: results.rows.item(0).SKU_NAME,
                            QTY: (results.rows.item(0).QTY + 1),
                            TOTAL_LINE: results.rows.item(0).TOTAL_LINE,
                            REQUERIES_SERIE: results.rows.item(0).REQUERIES_SERIE,
                            LINE_SEQ: results.rows.item(0).LINE_SEQ,
                            IS_KIT: results.rows.item(0).IS_KIT,
                            SERIE_2: results.rows.item(0).SERIE_2,
                            AVAILABLE: results.rows.item(0).AVAILABLE
                        }

                        gInvocingTotal = gInvocingTotal - inventario.TOTAL_LINE;

                        gInvocingTotal = gInvocingTotal + (parseFloat(inventario.PRICE) * parseInt(inventario.QTY));

                        sql = "UPDATE SALES_ORDER_DETAIL  SET";
                        sql += " QTY= " + inventario.QTY;
                        sql += ", PRICE =" + inventario.PRICE;
                        sql += ",TOTAL_LINE= " + parseFloat(inventario.PRICE) * parseInt(inventario.QTY);
                        sql += " WHERE SALES_ORDER_ID = -9999 AND SKU = '" + idProducto + "'";
                        tx.executeSql(sql);
                        callback(inventario);
                    }
                },
                function (tx, err) {
                    errcallback(err);
                });
        },
        function (err) {
            errcallback(err);
        }
    );
}

function InsertSaleOrderDetail(pSkuParent, pSeq, paramQty,listaDePrecio) {
    try {

        var pNextParentSeq = 1;

        SONDA_DB_Session.transaction(
            function (tx) {
                var pSql = "SELECT COUNT(1)+1 as CURRENT_SEQ FROM SALES_ORDER_DETAIL WHERE SALES_ORDER_ID = -9999 AND SKU = '" + pSkuParent + "'";

                try {
                    tx.executeSql(pSql, [],
                        function (tx, results) {
                            pNextParentSeq = results.rows.item(0).CURRENT_SEQ;
                            pSql = "SELECT S.*, 0 AS REQUERIES_SERIE, IFNULL(P.PRICE,0) COST";
                            pSql += " FROM SKU_PRESALE S";
                            pSql += " INNER JOIN PRICE_LIST_BY_SKU_PACK_SCALE P ON (S.SKU = P.CODE_SKU)";
                            pSql += " WHERE S.SKU = '" + pSkuParent + "'";
                            pSql += " AND P.CODE_PRICE_LIST = '" + listaDePrecio + "'";

                            tx.executeSql(pSql, [],
                                function (tx, results) {
                                    var pSkuPrice = results.rows.item(0).COST;
                                    var pSkuName = results.rows.item(0).SKU_NAME;
                                    var pSkuQty = paramQty;

                                    pSql = "DELETE FROM SALES_ORDER_DETAIL WHERE SALES_ORDER_ID = -9999 AND SKU = '" + pSkuParent + "'";
                                    console.log(pSql);
                                    tx.executeSql(pSql);

                                    pSql = 'INSERT INTO SALES_ORDER_DETAIL(SALES_ORDER_ID, SKU, LINE_SEQ, QTY, PRICE, DISCOUNT, TOTAL_LINE, REQUERIES_SERIE, SERIE, SERIE_2, IS_ACTIVE_ROUTE, PARENT_SEQ, COMBO_REFERENCE,  POSTED_DATETIME, SKU_NAME, IS_POSTED_VOID, IS_VOID) ';
                                    pSql += " VALUES(-9999,'" + results.rows.item(0).SKU + "'," + pSeq + ", " + pSkuQty + "," + pSkuPrice;
                                    pSql += ", 0, " + parseFloat(pSkuPrice) * parseInt(pSkuQty) + "," + "0,0,0,1," + pNextParentSeq + ",'" + pSkuParent + "', '" + getDateTime() + "','" + pSkuName + "',2,0)";
                                    tx.executeSql(pSql);

                                    my_dialog("", "", "close");
                                },
                                function (err) {
                                    my_dialog("", "", "close");
                                    if (err.code !== 0) {
                                        alert("Error on: insert into InsertSaleOrderDetail: " + err.code);
                                    }
                                }
                            );

                        }
                    );

                } catch (e) {
                    notify(e.message);
                }
            },
            function (err) {
                // ReSharper disable once CoercedEqualsUsing
                if (err.code != 0) {
                    alert("InsertSaleOrderDetail.Error processing SQL: " + err.code);
                }
            }
        );
    } catch (e) {
        var xresult = "InsertSaleOrderDetail.Catch:" + e.message;
        console.log(xresult);
        notify("InsertSaleOrderDetail: " + xresult);
    }
}

function ObtenerPreventasEncabezadoCliente(taskId, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "";
            sql = "SELECT H.SALES_ORDER_ID, H.DELIVERY_DATE, C.CLIENT_NAME, C.ADDRESS, C.PHONE, C.CONTACT_CUSTOMER, H.TIMES_PRINTED, H.REFERENCE_ID, H.TOTAL_AMOUNT, H.DOC_SERIE, H.DOC_NUM, H.IS_VOID";
            sql += " FROM CLIENTS C INNER JOIN SALES_ORDER_HEADER H ON (C.CLIENT_ID = H.CLIENT_ID)";
            sql += " WHERE h.TASK_ID = " + taskId + " AND IS_PARENT = '1'";
            tx.executeSql(sql, [], function (tx, results) {
                tx.executeSql(sql, [],
                    function (tx, results) {
                        callback(results);
                    },
                    function (tx, err) {
                        if (err.code !== 0)
                            errCallBack(err);
                    }
                );
            });
        },
         function (err) {
             errCallBack(err);
         }
    );
}

function ObtenerPreventasDetalleCliente(referenceId, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "";

            sql = " SELECT D.SKU" +
                ", MAX(S.SKU_NAME) SKU_NAME" +
                ", MAX(D.PRICE) PRICE" +
                ", SUM(D.QTY) QTY" +
                ", SUM(D.TOTAL_LINE) TOTAL_LINE" +
                ", MAX(D.SERIE) SERIE" +
                ", MAX(TOTAL_AMOUNT) TOTAL_AMOUNT" +
                ", MAX(H.DISCOUNT) DISCOUNT" +
                ", D.LONG" +
                ", MAX(S.HANDLE_DIMENSION) HANDLE_DIMENSION" +
                ", H.DISCOUNT_BY_GENERAL_AMOUNT";
            sql += " FROM SALES_ORDER_HEADER H";
            sql += " INNER JOIN SALES_ORDER_DETAIL D ON (h.SALES_ORDER_ID = d.SALES_ORDER_ID)";
            sql += " INNER JOIN SKU_PRESALE S ON (S.SKU = D.SKU)";
            sql += " WHERE H.REFERENCE_ID = '" + referenceId + "'";
            sql += " GROUP BY D.SKU,D.LONG";

            tx.executeSql(sql, [], function (tx, results) {

                tx.executeSql(sql, [],
                    function (tx, results) {
                        callback(results);
                    },
                    function (tx, err) {
                        if (err.code !== 0)
                            errCallBack(err);
                    }
                );
            });


        },
         function (err) {
             errCallBack(err);
         }
    );
}

function GetSalesOrderHeaderInsert(saleHeader, idTarea) {
    var sql = "";
    sql += "INSERT INTO SALES_ORDER_HEADER (";
    sql += "SALES_ORDER_ID";
    sql += ", TERMS";
    sql += ", POSTED_DATETIME";
    sql += ", CLIENT_ID";
    sql += ", POS_TERMINAL";
    sql += ", GPS_URL";
    sql += ", TOTAL_AMOUNT";
    sql += ", STATUS";
    sql += ", POSTED_BY";
    sql += ", IMAGE_1";
    sql += ", IMAGE_2";
    sql += ", IMAGE_3";
    sql += ", DEVICE_BATTERY_FACTOR";
    sql += ", VOID_DATETIME";
    sql += ", VOID_REASON";
    sql += ", VOID_NOTES";
    sql += ", VOIDED";
    sql += ", CLOSED_ROUTE_DATETIME";
    sql += ", IS_ACTIVE_ROUTE";
    sql += ", GPS_EXPECTED";
    sql += ", SALES_ORDER_ID_BO";
    sql += ", IS_POSTED";
    sql += ", DELIVERY_DATE";
    sql += ", TASK_ID";
    sql += ", IS_PARENT";
    sql += ", REFERENCE_ID";
    sql += ", TIMES_PRINTED";
    sql += ", SINC";
    sql += ", DOC_SERIE";
    sql += ", DOC_NUM";
    sql += ", IS_POSTED_VOID";
    sql += ", IS_VOID";
    sql += ", SALES_ORDER_TYPE";
    sql += ", DISCOUNT";
    sql += ") VALUES(";
    sql += "" + saleHeader.SalesOrderId;
    sql += ",'" + saleHeader.Terms + "'";
    sql += ",'" + saleHeader.PostedDatetime + "'";
    sql += ",'" + saleHeader.ClientId + "'";
    sql += ",'" + saleHeader.PosTerminal + "'";
    sql += ",'" + saleHeader.GpsUrl + "'";
    sql += "," + saleHeader.TotalAmount;
    sql += ",'" + saleHeader.Status + "'";
    sql += ",'" + saleHeader.PostedBy + "'";
    sql += ",'" + saleHeader.Image1 + "'";
    sql += ",'" + saleHeader.Image2 + "'";
    sql += ",'" + saleHeader.Image3 + "'";
    sql += ",'" + saleHeader.DeviceBatteryFactor + "'";
    sql += ",'" + saleHeader.VoidDatetime + "'";
    sql += ",'" + saleHeader.VoidReason + "'";
    sql += ",'" + saleHeader.VoidNotes + "'";
    sql += ",'" + saleHeader.Voided + "'";
    sql += ",'" + saleHeader.ClosedRouteDatetime + "'";
    sql += "," + saleHeader.IsActiveRoute;
    sql += ",'" + saleHeader.GpsExpected + "'";
    sql += "," + saleHeader.SalesOrderIdBo;
    sql += "," + saleHeader.IsPosted;
    sql += ",'" + saleHeader.DeliveryDate + "'";
    sql += "," + idTarea;
    sql += ",'" + saleHeader.IsParent + "'";
    sql += ",'" + saleHeader.ReferenceId + "'";
    sql += "," + saleHeader.TimesPrinted;
    sql += "," + saleHeader.Sinc;
    sql += ",'" + saleHeader.DocSerie + "'";
    sql += "," + saleHeader.DocNum;
    sql += "," + saleHeader.IsPostedVoid;
    sql += "," + saleHeader.IsVoid;
    sql += ",'" + saleHeader.SalesOrderType + "'";
    sql += ",'" + saleHeader.Discount + "'";
    sql += ");";
    return sql;
}

function InsertSalesOrderDetail(saleDetail) {
    var sql = "";
    sql += "INSERT INTO SALES_ORDER_DETAIL (";
    sql += "SALES_ORDER_ID";
    sql += ",SKU";
    sql += ",LINE_SEQ";
    sql += ",QTY";
    sql += ",PRICE";
    sql += ",DISCOUNT";
    sql += ",TOTAL_LINE";
    sql += ",POSTED_DATETIME";
    sql += ",SERIE";
    sql += ",SERIE_2";
    sql += ",REQUERIES_SERIE";
    sql += ",COMBO_REFERENCE";
    sql += ",PARENT_SEQ";
    sql += ",IS_ACTIVE_ROUTE";
    sql += ", IS_POSTED_VOID";
    sql += ", IS_VOID";
    sql += ", CODE_PACK_UNIT";
    sql += ") VALUES(";
    sql += "" + saleDetail.SalesOrderId;
    sql += ",'" + saleDetail.Sku + "'";
    sql += "," + saleDetail.LineSeq;
    sql += "," + saleDetail.Qty;
    sql += "," + saleDetail.Price;
    sql += "," + saleDetail.Discount;
    sql += "," + saleDetail.TotalLine;
    sql += ",'" + saleDetail.PostedDatetime + "'";
    sql += ",'" + saleDetail.Serie + "'";
    sql += ",'" + saleDetail.Serie2 + "'";
    sql += ",'" + saleDetail.RequeriesSerie + "'";
    sql += ",'" + saleDetail.ComboReference + "'";
    sql += ",'" + saleDetail.ParentSeq + "'";
    sql += "," + saleDetail.IsActiveRoute;
    sql += "," + saleDetail.IsPostedVoid;
    sql += "," + saleDetail.IsVoid;
    sql += ",'" + saleDetail.CodePackUnit + "'";
    sql += ");";
    return sql;
}

function DetailtSalesOrderDetailDomi() {
    var sql = "";
    sql += "DELETE FROM SALES_ORDER_DETAIL WHERE SALES_ORDER_ID = -9999";
    return sql;
}

function GetSalesOrderDetailUpdate(saleHeader) {
    var sql = "";
    sql += "UPDATE SALES_ORDER_DETAIL SET";
    sql += " SALES_ORDER_ID = " + saleHeader.SalesOrderId;
    sql += " WHERE SALES_ORDER_ID = -9999";
    return sql;
}

function ActualizaInventarioPreventa(saleDetail) {
    var sql = "";
    sql += "UPDATE SKU_PRESALE SET";
    sql += " IS_COMITED = (IS_COMITED +" + saleDetail.Qty + ")";
    sql += " ,DIFFERENCE = (ON_HAND - IS_COMITED)";
    sql += " WHERE SKU = '" + saleDetail.Sku + "'";
    return sql;
}

function ObtenerQueryInsertarTareasAuxiliar(taskId, html) {
    var sql = "";
    sql += "INSERT INTO TASK_AUX (";
    sql += "PRESALES_ROUTE_ID";
    sql += ",HTML";
    sql += ")VALUES(";
    sql += taskId;
    sql += ",'" + html + "'";
    sql += ")";
    return sql;
}

function ConvertirBorradorAOrdenDeCompra(saleHeader, firma, foto, idTarea, borrarDomi, insertarTotalHtml, callback, errCallback) {
    saleHeader.Image1 = foto;
    saleHeader.Image2 = firma;

    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "";
            var totalM = 0;
            //var qtyTotal = 0;
            for (var j = 0; j < saleHeader.SaleDetails.length; j++) {
                if (borrarDomi) {
                    if (j === 0) {
                        sql = DetailtSalesOrderDetailDomi();
                        tx.executeSql(sql);
                    }
                    sql = InsertSalesOrderDetail(saleHeader.SaleDetails[j]);
                    tx.executeSql(sql);
                }
                totalM += ToDecimal(saleHeader.SaleDetails[j].TotalLine);
                //qtyTotal += ToDecimal(saleHeader.SaleDetails[j].Qty);
            }
            saleHeader.TotalAmount = totalM;


            sql = GetSalesOrderHeaderInsert(saleHeader, idTarea);
            tx.executeSql(sql);

            sql = GetSalesOrderDetailUpdate(saleHeader);
            tx.executeSql(sql);

            if (insertarTotalHtml) {
                ObtenerTotalDeProductosDePreVenta(gtaskid, tx, function(qty,total) {
                    var html = '<p>';
                    html += '<span class="small-roboto">';
                    html += 'Cant.' + qty;
                    html += '</span>';
                    html += '<span class="ui-li-count" style="position:absolute; top:73%">Q';
                    html += ToDecimal(total);
                    html += '</span>';
                    html += '</p>';

                    var sql1 = ObtenerQueryInsertarTareasAuxiliar(gtaskid, html);
                    tx.executeSql(sql1);
                }, function(err) {
                    notify(err.message);
                });
            }

            if (gIsOnline === 0) {
                for (var i = 0; i < saleHeader.SaleDetails.length; i++) {
                    sql = ActualizaInventarioPreventa(saleHeader.SaleDetails[i]);
                    if (sql !== "") {
                        tx.executeSql(sql);
                    }
                }
            }

            callback();
        }, function (err) {
            if (err.code !== 0)
                errCallback(err);
        }
        );
}

function ValidarFechaDeEntrega(fechaActual, fechaEntrega) {
    if (fechaEntrega >= fechaActual) {
        return true;
    } else {
        return false;
    }
}

function ObtenerPreVentaDetalle(sale, callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT *  ";
             sql += " FROM SALES_ORDER_DETAIL ";
             sql += " WHERE SALES_ORDER_ID=-9999 ";
             sql += " AND PRICE > " + MaximoCF;
             sql += " ORDER BY PRICE DESC ";

             tx.executeSql(sql, [],
                function (tx, results) {
                    callback(sale, results);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        });
}

function ObtenerPreVentaDetalleRestante(sale, callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT *  ";
             sql += " FROM SALES_ORDER_DETAIL ";
             sql += " WHERE SALES_ORDER_ID=-9999 ";
             sql += " AND PRICE <= " + MaximoCF;
             sql += " ORDER BY PRICE";

             tx.executeSql(sql, [],
                function (tx, results) {
                    callback(sale, results);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        });
}

function ActualizarVecesImpresionDeOrdenDeVenta(taskId, callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "UPDATE SALES_ORDER_HEADER";
             sql += " SET";
             sql += " TIMES_PRINTED = TIMES_PRINTED + 1";
             sql += " ,SINC = 0";
             sql += " WHERE TASK_ID = " + taskId;

             tx.executeSql(sql, [],
                function (tx, results) {
                    callback(taskId, results);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        });
}

function ActualizarDocumnetoImpreso(taskId, documento, callback, errCallBack) {
    documento = documento.replace("***** ORIGINAL *****", "***** REIMPRESION *****");

    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "UPDATE PRESALES_ROUTE";
             sql += " SET";
             sql += " DOC_PRINTED = '" + documento + "'";
             sql += " WHERE TASK_ID = " + taskId;

             tx.executeSql(sql, [],
                function (tx, results) {
                    callback(taskId, results);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        });
}

function ObtenerDocumnetoImpreso(taskId, callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT DOC_PRINTED";
             sql += " FROM PRESALES_ROUTE";
             sql += " WHERE TASK_ID = " + taskId;

             tx.executeSql(sql, [],
                function (tx, results) {
                    callback(taskId, results.rows.item(0).DOC_PRINTED);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        });
}

function ObtenerNumeroDeImpreciones(taskId, callback, errCallBack) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT TIMES_PRINTED";
             sql += " FROM SALES_ORDER_HEADER";
             sql += " WHERE TASK_ID = " + taskId;

             tx.executeSql(sql, [],
                function (tx, results) {
                    callback(taskId, results.rows.item(0).TIMES_PRINTED);
                }, function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
         },
        function (err) {
            errCallBack(err);
        });
}

function ObtenerPreVentaDetalleSplit(referenciaId, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function(tx) {
            var sql = "SELECT D.SALES_ORDER_ID,D.SKU,D.LINE_SEQ,D.QTY,D.PRICE,D.DISCOUNT,D.TOTAL_LINE,D.POSTED_DATETIME";
            sql += ",D.SERIE,D.SERIE_2,D.REQUERIES_SERIE,D.COMBO_REFERENCE,D.PARENT_SEQ,D.IS_ACTIVE_ROUTE,S.SKU_NAME, H.DISCOUNT_BY_GENERAL_AMOUNT";
            sql += " FROM SALES_ORDER_HEADER H";
            sql += " INNER JOIN SALES_ORDER_DETAIL D ON (h.SALES_ORDER_ID = d.SALES_ORDER_ID)";
            sql += " INNER JOIN SKU_PRESALE S ON (S.SKU = D.SKU)";
            sql += " WHERE H.REFERENCE_ID = '" + referenciaId + "'";

            tx.executeSql(sql, [],
                function(tx, results) {
                    callback(referenciaId, results);
                }, function(tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                }
            );
        },
        function(err) {
            errCallBack(err);
        });
}

function ObtenerTotalDeProductosDePreVenta(taskId, tx, callback, errCallBack) {
    try {
        var sql = "SELECT SUM(D.QTY) QTY ,SUM(D.TOTAL_LINE) TOTAL";
        sql += " FROM SALES_ORDER_HEADER H";
        sql += " INNER JOIN SALES_ORDER_DETAIL D ON (H.SALES_ORDER_ID = D.SALES_ORDER_ID)";
        sql += " WHERE H.TASK_ID = " + taskId;

        tx.executeSql(sql, [],
            function(tx, results) {
                callback(results.rows.item(0).QTY, results.rows.item(0).TOTAL);
            }, function(tx, err) {
                if (err.code !== 0)
                    errCallBack(err);
            }
        );
    } catch (e) {
        errCallBack({code:0 ,message: e.message});
    }
}

function AnulacionDeOrdenDeVentaEncabezado(docSerie, docNum, callback, errCallBack) {
    try {
        SONDA_DB_Session.transaction(
            function(tx) {
                var sql = "UPDATE SALES_ORDER_HEADER";
                sql += " SET IS_POSTED_VOID = 2 ,IS_VOID = 1";
                sql += " WHERE DOC_SERIE = '" + docSerie + "'";
                sql += " AND DOC_NUM = " + docNum;

                tx.executeSql(sql, [],
                    function(tx, results) {
                        callback(docSerie, docNum);
                    }, function(tx, err) {
                        if (err.code !== 0)
                            errCallBack(err);
                    }
                );
            },
            function(err) {
                errCallBack(err);
            });
    } catch (e) {
        errCallBack({ code: 0, message: e.message });
    }
}

function AnulacionDeOrdenDeVentaDetalle(docSerie, docNum, callback, errCallBack) {
    try {
        SONDA_DB_Session.transaction(
            function(tx) {
                var sql = "UPDATE SALES_ORDER_DETAIL";
                sql += " SET IS_POSTED_VOID = 2 ,IS_VOID = 1";
                sql += " WHERE SALES_ORDER_ID = (";
                sql += " SELECT SALES_ORDER_ID";
                sql += " FROM SALES_ORDER_HEADER H";
                sql += " WHERE H.DOC_SERIE = '" + docSerie + "'";
                sql += " AND H.DOC_NUM = " + docNum;
                sql += ")";

                tx.executeSql(sql, [],
                    function(tx, results) {
                        callback();
                    }, function(tx, err) {
                        if (err.code !== 0)
                            errCallBack(err);
                    }
                );
            },
            function(err) {
                errCallBack(err);
            });
    } catch (e) {
        errCallBack({ code: 0, message: e.message });
    }
}

function ObtenerOrdenesDeVentaNoAnuladasPorReferencia(callback, errCallBack) {
    try {
        SONDA_DB_Session.transaction(
            function(tx) {
                var sql = "SELECT H.CLIENT_ID, C.CLIENT_NAME, H.REFERENCE_ID, SUM(H.TOTAL_AMOUNT) TOTAL_AMOUNT, H.IS_POSTED";
                sql += " ,MIN(DOC_SERIE) DOC_SERIE, MIN(DOC_NUM) DOC_NUM, MIN(TASK_ID) TASK_ID";
                sql += " FROM SALES_ORDER_HEADER H";
                sql += " INNER JOIN CLIENTS C ON (H.CLIENT_ID = C.CLIENT_ID)";
                sql += " WHERE H.IS_VOID = 0 AND H.IS_DRAFT = 0";
                sql += " GROUP BY H.CLIENT_ID,H.REFERENCE_ID";

                tx.executeSql(sql, [],
                    function(tx, results) {
                        var ordenesDeVenta = Array();
                        for (var i = 0; i < results.rows.length; i++) {
                            var ordenDeVenta = {
                                ClientId: results.rows.item(i).CLIENT_ID,
                                ClientName: results.rows.item(i).CLIENT_NAME,
                                TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
                                ReferenceId: results.rows.item(i).REFERENCE_ID,
                                DocSerie: results.rows.item(i).DOC_SERIE,
                                DocNum: results.rows.item(i).DOC_NUM,
                                TaskId: results.rows.item(i).TASK_ID,
                                IsPosted: results.rows.item(i).IS_POSTED
                            };
                            ordenesDeVenta.push(ordenDeVenta);
                        }
                        callback(ordenesDeVenta);
                    }, function(tx, err) {
                        if (err.code !== 0)
                            errCallBack(err);
                    }
                );
            },
            function(err) {
                errCallBack(err);
            });
    } catch (e) {
        errCallBack({ code: 0, message: e.message });
    }
}

function ObtenerOrdenesDeVentaPorReferencia(referenciaId, callback, errCallBack) {
    try {
        SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT H.SALES_ORDER_ID, H.REFERENCE_ID, H.DOC_SERIE, H.DOC_NUM";
            sql += " FROM SALES_ORDER_HEADER H";
            sql += " WHERE H.REFERENCE_ID= '" + referenciaId + "'";

            tx.executeSql(sql, [],
               function (tx, results) {
                   var ordenesDeVenta = Array();
                   for (var i = 0; i < results.rows.length ; i++) {
                       var ordenDeVenta = {
                           SalesOrderId: results.rows.item(i).SALES_ORDER_ID,
                           ReferenceId: results.rows.item(i).REFERENCE_ID,
                           DocSerie: results.rows.item(i).DOC_SERIE,
                           DocNum: results.rows.item(i).DOC_NUM
                           
                       };
                       ordenesDeVenta.push(ordenDeVenta);
                   }
                   callback(ordenesDeVenta);
               }, function (tx, err) {
                   if (err.code !== 0)
                       errCallBack(err);
               }
           );
        },
       function (err) {
           errCallBack(err);
       });
    } catch (e) {
        errCallBack({ code: 0, message: e.message });
    }
}

function AnularOrdenDeVenta(docSerie, docNum, callback, errCallback) {
    AnulacionDeOrdenDeVentaEncabezado(docSerie,
        docNum,
        function(docSerieN1, docNumN1) {
            AnulacionDeOrdenDeVentaDetalle(docSerieN1,
                docNumN1,
                function() {
                    callback();
                },
                function(errN1) {
                    errCallback(errN1);
                });
        },
        function(err) {
            errCallback(err);
        });
}

function ActualizarEstadoDeOrdenDeVenta(docSerie, docNum, estado, estadoDeValidacion, index, callback, errCallback) {
    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                var sql = "UPDATE SALES_ORDER_HEADER";
                sql += " SET IS_POSTED = " + estado;
                sql += " ,IS_POSTED_VALIDATED = " + estadoDeValidacion;
                sql += " WHERE DOC_SERIE = '" + docSerie + "'";
                sql += " AND DOC_NUM = " + docNum;

                tx.executeSql(sql, [],
                    function (tx, results) {
                        callback(index);
                    }, function (tx, err) {
                        if (err.code !== 0)
                            errCallback(err);
                    }
                );
            },
            function (err) {
                errCallback(err);
            });
    } catch (e) {
        errCallback({ code: 0, message: e.message });
    }
}

function CambiarEstadoParaReenviarOrdenesDeVenta(ordenesDeVenta, callback, errCallback) {
    try {
        for (var i = 0; i < ordenesDeVenta.length; i++) {
            ActualizarEstadoDeOrdenDeVenta(ordenesDeVenta[i].DOC_SERIE, ordenesDeVenta[i].DOC_NUM, (ordenesDeVenta[i].RESULT === EstadoEnvioDoc.NoEnviado ? EstadoEnvioDoc.NoEnviado : EstadoEnvioDoc.EnviadoConAcuseDeRecibido), (ordenesDeVenta[i].RESULT === EstadoDeValidacionDeOrdenDeVenta.PendienteDeValidar ? EstadoDeValidacionDeOrdenDeVenta.PendienteDeValidar : EstadoDeValidacionDeOrdenDeVenta.EnviadoConAcuseDeValidado), i, function (index) {
                if (index === (ordenesDeVenta.length - 1)) {
                    callback();
                }
            }, function(err) {
                errCallback(err);
            });
        }
    } catch (e) {
        errCallback({ code: 0, message: e.message });
    } 
}

function ValidarSiYaFueEnvidaYValidadaLaOrdenDeVenta(docSerie, docNum, callback, errCallback) {
    try {
        SONDA_DB_Session.transaction(
            function (tx) {
                var sql = "SELECT H.DOC_SERIE ,H.DOC_NUM";
                sql += " FROM SALES_ORDER_HEADER H";
                sql += " WHERE H.DOC_SERIE = '" + docSerie + "' AND H.DOC_NUM = " + docNum;
                sql += " AND IS_POSTED = 2 AND IS_POSTED_VALIDATED = 2";

                tx.executeSql(sql, [],
                    function (tx, results) {
                        if (results.rows.length > 0) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    }, function (tx, err) {
                        if (err.code !== 0)
                            errCallback(err);
                    }
                );
            },
            function (err) {
                errCallback(err);
            });
    } catch (e) {
        errCallback({ code: 0, message: e.message });
    }
}