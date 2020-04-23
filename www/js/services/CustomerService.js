function GetCustomer(callback, errCallBack, customerId) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT * FROM CLIENTS ";
            sql += " WHERE ";
            sql += " CLIENT_ID ='" + customerId + "'";
            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length > 0) {
                        var customer =
                        {
                            CustomerId: results.rows.item(0).CLIENT_ID,
                            CustomerName: results.rows.item(0).CLIENT_NAME,
                            TaxId: results.rows.item(0).CLIENT_TAX_ID,
                            PriceList: results.rows.item(0).BASE_PRICELIST,
                            Address: results.rows.item(0).ADDRESS,
                            Gps: results.rows.item(0).GPS,
                            Balance: 0,
                            ClientHhIdOld: results.rows.item(0).CLIENT_HH_ID_OLD,
                            Phone: results.rows.item(0).PHONE,
                            ContactCustomer: results.rows.item(0).CONTACT_CUSTOMER,
                            Discount: results.rows.item(0).DISCOUNT,
                            AppliedDiscount: 0.00,
                            Invoices: Array(),
                            Payments: Array(),
                            Consignments: Array(),
                            Sales: Array()
                        };
                        callback(customer);
                    } else {
                        errCallBack({ message: "No se encontro el cliente " + customerId, code: 0 });
                    }
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                });
        },
        function (err) {
            errCallBack(err);
        }
    );
}

function GetBalanceByCustomer(callback, errCallback, customer) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT SUM(IFNULL(TOTAL_AMOUNT,0)-IFNULL(PAID_TO_DATE,0)) AS BALANCE ";
            sql += " FROM INVOICE_HEADER ";
            sql += " WHERE CLIENT_ID='" + customer.CustomerId + "'";
            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length > 0 && results.rows.item(0).BALANCE != null) {
                        customer.Balance = results.rows.item(0).BALANCE;
                    } else {
                        customer.Balance = 0;
                    }
                    callback(customer);
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

function GetInvoicesByCustomer(callback, errCallBack, customer) {
    SONDA_DB_Session.transaction(
         function (tx) {
             var sql = "SELECT *  ";
             sql += " FROM INVOICE_HEADER ";
             sql += " WHERE CLIENT_ID='" + customer.CustomerId + "'";
             sql += " ORDER BY POSTED_DATETIME";

             tx.executeSql(sql, [],
                 function (tx, results) {
                     for (var i = 0; i < results.rows.length ; i++) {
                         var invoice = {
                             InvoiceNum: results.rows.item(i).INVOICE_NUM,
                             Terms: results.rows.item(i).TERMS,
                             PostedDatetime: results.rows.item(i).POSTED_DATETIME,
                             ClientId: results.rows.item(i).CLIENT_ID,
                             ClientName: results.rows.item(i).CLIENT_NAME,
                             PosTerminal: results.rows.item(i).POS_TERMINAL,
                             Gps: results.rows.item(i).GPS,
                             TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
                             PaidToDate: results.rows.item(i).PAID_TO_DATE,
                             ErpInvoiceId: results.rows.item(i).ERP_INVOICE_ID,
                             IsPosted: results.rows.item(i).IS_POSTED,
                             Status: results.rows.item(i).STATUS,
                             IsCreditNote: results.rows.item(i).IS_CREDIT_NOTE,
                             VoidReason: results.rows.item(i).VOID_REASON,
                             VoidNotes: results.rows.item(i).VOID_NOTES,
                             VoidInvoiceId: results.rows.item(i).VOID_INVOICE_ID,
                             PrintRequest: results.rows.item(i).PRINT_REQUEST,
                             PrintedCount: results.rows.item(i).PRINTED_COUNT,
                             AuthId: results.rows.item(i).AUTH_ID,
                             SatSerie: results.rows.item(i).SAT_SERIE,
                             Change: results.rows.item(i).CHANGE,
                             Img1: results.rows.item(i).IMG1,
                             Img2: results.rows.item(i).IMG2,
                             Img3: results.rows.item(i).IMG3,
                             InvoiceRows: Array(),
                             IsDraf: false
                         };
                         customer.Invoices.push(invoice);

                     }
                     callback(customer);

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

function GetInvoiceRowByCustomer(invoice, errCallBack, customer, i, callback, returncallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT * ";
            sql += " FROM INVOICE_DETAIL ";
            sql += " WHERE INVOICE_NUM=" + invoice.InvoiceNum + "";
            tx.executeSql(sql, [],
                function (tx, results) {
                    for (var j = 0; j < results.rows.length; j++) {
                        var invoiceRow = {
                            InvoiceNum: results.rows.item(j).INVOICE_NUM,
                            Sku: results.rows.item(j).SKU,
                            SkuName: results.rows.item(j).SKU_NAME,
                            Qty: results.rows.item(j).QTY,
                            Price: results.rows.item(j).PRICE,
                            Discount: results.rows.item(j).DISCOUNT,
                            TotalLine: results.rows.item(j).TOTAL_LINE,
                            Serie: results.rows.item(j).SERIE,
                            Serie2: results.rows.item(j).SERIE_2,
                            RequeriesSerie: results.rows.item(j).REQUERIES_SERIE,
                            LineSeq: results.rows.item(j).LINE_SEQ,
                            IsActive: results.rows.item(j).IS_ACTIVE,
                            ComboReference: results.rows.item(j).COMBO_REFERENCE,
                            ParentSeq: results.rows.item(j).PARENT_SEQ,
                            Exposure: results.rows.item(j).EXPOSURE,
                            Phone: results.rows.item(j).PHONE
                        };
                        invoice.InvoiceRows.push(invoiceRow);
                    }
                    customer = callback(customer, i, invoice);

                    if (customer.Invoices.length - 1 === i) {
                        returncallBack(customer);
                    }
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

function GetInvoicesDetailByCustomer(callback, errCallBack, customer) {
    var i;
    for (i = 0; i < customer.Invoices.length; i++) {
        GetInvoiceRowByCustomer(customer.Invoices[i], errCallBack, customer, i, function (customer, index, invoice) {
            customer.Invoices[index] = invoice;
            return customer;
        }, callback);
    }
    if (i === 0) {
        callback(customer);
    }


}

function GetConsignmentsByCustomer(callback, errCallBack, customer) {
    SONDA_DB_Session.transaction(
             function (tx) {
                 var sql = "SELECT *  ";
                 sql += " FROM CONSIGNMENT_HEADER ";
                 sql += " WHERE CUSTOMER_ID='" + customer.CustomerId + "'";
                 sql += " ORDER BY DATE_CREATE";

                 tx.executeSql(sql, [],
                     function (tx, results) {
                         for (var i = 0; i < results.rows.length ; i++) {
                             var consignment = {
                                 CONSIGNMENT_ID: results.rows.item(i).CONSIGNMENT_ID,
                                 CUSTOMER_ID: results.rows.item(i).CUSTOMER_ID,
                                 DATE_CREATE: results.rows.item(i).DATE_CREATE,
                                 DATE_UPDATE: results.rows.item(i).DATE_UPDATE,
                                 STATUS: results.rows.item(i).STATUS,
                                 POSTED_BY: results.rows.item(i).POSTED_BY,
                                 IS_POSTED: results.rows.item(i).IS_POSTED,
                                 POS_TERMINAL: results.rows.item(i).POS_TERMINAL,
                                 GPS_URL: results.rows.item(i).GPS_URL,
                                 DOC_DATE: results.rows.item(i).DOC_DATE,
                                 CLOSED_ROUTE_DATETIME: results.rows.item(i).CLOSED_ROUTE_DATETIME,
                                 IS_ACTIVE_ROUTE: results.rows.item(i).IS_ACTIVE_ROUTE,
                                 DUE_DATE: results.rows.item(i).DUE_DATE,
                                 CONSIGNMENT_DETAILS: Array()
                             };
                             customer.Consignments.push(consignment);

                         }
                         callback(customer);

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

function GetConsignmentsDetailByCustomer(callback, errCallBack, customer) {
    var i;
    for (i = 0; i < customer.Consignments.length; i++) {
        GetConsignmentRowByCustomer(customer.Consignments[i], errCallBack, customer, i, function (customer, index, consignment) {
            customer.Consignments[index] = consignment;
            return customer;
        }, callback);
    }
    if (i === 0) {
        callback(customer);
    }


}

function GetConsignmentRowByCustomer(consignment, errCallBack, customer, i, callback, returncallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT * ";
            sql += " FROM CONSIGNMENT_DETAIL ";
            sql += " WHERE CONSIGNMENT_ID=" + consignment.CONSIGNMENT_ID + "";
            tx.executeSql(sql, [],
                function (tx, results) {
                    for (var j = 0; j < results.rows.length; j++) {
                        var consignmentDetail = {
                            CONSIGNMENT_ID: results.rows.item(j).CONSIGNMENT_ID,
                            SKU: results.rows.item(j).SKU,
                            LINE_NUM: results.rows.item(j).LINE_NUM,
                            QTY: results.rows.item(j).QTY,
                            PRICE: results.rows.item(j).PRICE,
                            DISCOUNT: results.rows.item(j).DISCOUNT,
                            TOTAL_LINE: results.rows.item(j).TOTAL_LINE,
                            POSTED_DATETIME: results.rows.item(j).POSTED_DATETIME
                            , PAYMEN_ID: 0
                        };
                        consignment.CONSIGNMENT_DETAILS.push(consignmentDetail);
                    }
                    customer = callback(customer, i, consignment);

                    if (customer.Consignments.length - 1 === i) {
                        returncallBack(customer);
                    }
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

/*-----Obtener PreVenta-----*/

function GetSalesByCustomer(callback, errCallBack, customer) {
    SONDA_DB_Session.transaction(
             function (tx) {
                 var sql = "SELECT *  ";
                 sql += " FROM SALES_ORDER_HEADER ";
                 sql += " WHERE CLIENT_ID = '" + customer.CustomerId + "'";
                 sql += " ORDER BY POSTED_DATETIME DESC";

                 tx.executeSql(sql, [],
                     function (tx, results) {
                         for (var i = 0; i < results.rows.length ; i++) {
                             var sale = {
                                 SalesOrderId: results.rows.item(i).SALES_ORDER_ID,
                                 Terms: results.rows.item(i).TERMS,
                                 PostedDatetime: results.rows.item(i).POSTED_DATETIME,
                                 ClientId: results.rows.item(i).CLIENT_ID,
                                 PosTerminal: results.rows.item(i).POS_TERMINAL,
                                 GpsUrl: results.rows.item(i).GPS_URL,
                                 TotalAmount: results.rows.item(i).TOTAL_AMOUNT,
                                 Status: results.rows.item(i).STATUS,
                                 PostedBy: results.rows.item(i).POSTED_BY,
                                 Image1: results.rows.item(i).IMAGE_1,
                                 Image2: results.rows.item(i).IMAGE_2,
                                 Image3: results.rows.item(i).IMAGE_3,
                                 DeviceBatteryFactor: results.rows.item(i).DEVICE_BATTERY_FACTOR,
                                 VoidDatetime: results.rows.item(i).VOID_DATETIME,
                                 VoidReason: results.rows.item(i).VOID_REASON,
                                 VoidNotes: results.rows.item(i).VOID_NOTES,
                                 Voided: results.rows.item(i).VOIDED,
                                 ClosedRouteDatetime: results.rows.item(i).CLOSED_ROUTE_DATETIME,
                                 IsActiveRoute: results.rows.item(i).IS_ACTIVE_ROUTE,
                                 GpsExpected: results.rows.item(i).GPS_EXPECTED,
                                 SalesOrderIdBo: results.rows.item(i).SALES_ORDER_ID_BO,
                                 IsPosted: results.rows.item(i).SALES_ORDER_ID_BO,
                                 DeliveryDate: results.rows.item(i).DELIVERY_DATE,
                                 IsParent: results.rows.item(i).IS_PARENT,
                                 ReferenceId: results.rows.item(i).REFERENCE_ID,
                                 SaleDetails: Array()
                             };
                             customer.Sales.push(sale);
                         }
                         callback(customer);
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

function GetSalesDetailByCustomer(callback, errCallBack, customer) {
    var i;
    for (i = 0; i < customer.Sales.length; i++) {
        GetSaleRowByCustomer(customer.Sales[i], errCallBack, customer, i, function (customer, index, sale) {
            customer.Sales[index] = sale;
            return customer;
        }, callback);
    }
    if (i === 0) {
        callback(customer);
    }


}

function GetSaleRowByCustomer(sale, errCallBack, customer, i, callback, returncallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT * ";
            sql += " FROM SALES_ORDER_DETAIL ";
            sql += " WHERE SALES_ORDER_ID = " + sale.SalesOrderId + "";
            tx.executeSql(sql, [],
                function (tx, results) {
                    for (var j = 0; j < results.rows.length; j++) {
                        var saleDetail = {
                            SalesOrderId: results.rows.item(j).SALES_ORDER_ID,
                            Sku: results.rows.item(j).SKU,
                            LineSeq: results.rows.item(j).LINE_SEQ,
                            Qty: results.rows.item(j).QTY,
                            Price: results.rows.item(j).PRICE,
                            Discount: results.rows.item(j).DISCOUNT,
                            TotalLine: results.rows.item(j).TOTAL_LINE,
                            PostedDatetime: results.rows.item(j).POSTED_DATETIME,
                            Serie: results.rows.item(j).SERIE,
                            Serie2: results.rows.item(j).SERIE_2,
                            RequeriesSerie: results.rows.item(j).REQUERIES_SERIE,
                            ComboReference: results.rows.item(j).COMBO_REFERENCE,
                            ParentSeq: results.rows.item(j).PARENT_SEQ,
                            IsActiveRoute: results.rows.item(j).IS_ACTIVE_ROUTE
                        };
                        sale.SaleDetails.push(saleDetail);
                    }
                    customer = callback(customer, i, sale);

                    if (customer.Sales.length - 1 === i) {
                        returncallBack(customer);
                    }
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

/*-----Fin Obtener PreVenta-----*/

function PopulateCustomer(callback, errCallBack, customerId) {
    GetCustomer(function (customer) {
        GetBalanceByCustomer(function (customer) {
            GetInvoicesByCustomer(function (customer) {
                GetInvoicesDetailByCustomer(function (customer) {
                    GetConsignmentsByCustomer(function (customer) {
                        GetConsignmentsDetailByCustomer(function (customer) { //(callback, errCallBack, customer);
                            GetSalesByCustomer(function (customer) {
                                GetSalesDetailByCustomer(callback, errCallBack, customer);
                            }, errCallBack, customer);
                        }, errCallBack, customer);
                    }, errCallBack, customer);
                }, errCallBack, customer);
            }, errCallBack, customer);
        }, errCallBack, customer);
    }, errCallBack, customerId);
}

function CrearNuevoCliente(clienteNuevo, callback) {
    SONDA_DB_Session.transaction(
        function(tx) {


            //BORRAR EN ABSE DE DATOS LOCAL EL CLIENTE SI EXISTE
            var sqlTagsXCustomerDelete = "DELETE FROM TAGS_X_CUSTOMER WHERE CUSTOMER = '" +clienteNuevo.CodigoHH +"'";
            tx.executeSql(sqlTagsXCustomerDelete);

            var sqlCustomerFrequencyDelete = "DELETE FROM CLIENTS_FREQUENCY WHERE CODE_CUSTOMER = '"+ clienteNuevo.CodigoHH +"'";
            tx.executeSql(sqlCustomerFrequencyDelete);

            var sqlCustomerDelete = "DELETE FROM CLIENTS WHERE CLIENT_ID = '"+ clienteNuevo.CodigoHH +"'";
            tx.executeSql(sqlCustomerDelete);

            //INSERTAR EN BASE DE DATOS LOCAL EL CLIENTE NUEVO
            var sql = [];
            sql
                .push("INSERT INTO CLIENTS(CLIENT_ID, CLIENT_NAME, CLIENT_TAX_ID, BASE_PRICELIST,ADDRESS, IS_POSTED, PHONE,CONTACT_CUSTOMER,SIGN,PHOTO,STATUS,NEW,GPS,CLIENT_HH_ID_OLD,REFERENCE, POST_DATETIME, POS_SALE_NAME, INVOICE_NAME, INVOICE_ADDRESS, NIT, CONTACT_ID,CREDIT_LIMIT,EXTRADAYS,UPDATED_FROM_BO,SYNC_ID,DISCOUNT_LIST_ID,BONUS_LIST_ID, OWNER_ID, DEVICE_NETWORK_TYPE, IS_POSTED_OFFLINE)");
            sql.push(" VALUES( '"+ clienteNuevo.CodigoHH+"'");
            sql.push(", '"+ clienteNuevo.Nombre+"'");
            sql.push(" , 'CF', 0 ");
            sql.push(", '"+ clienteNuevo.Direccion +"'");
            sql.push(", 0");
            sql.push(",'"+ clienteNuevo.Telefono+ "'");
            sql.push(",'"+ clienteNuevo.Contacto+"'");
            sql.push(",'"+ clienteNuevo.Firma+"'");
            sql.push(",'"+ clienteNuevo.Foto+"'");
            sql.push(",'" + clienteNuevo.Status + "'");
            sql.push("," + clienteNuevo.New);
            sql.push(",'" + gCurrentGPS +"'");
            sql.push(",'" + clienteNuevo.CodigoHH+ "'");
            sql.push(",'" + clienteNuevo.Referencia + "'");
            sql.push(", '" + getDateTime() + "'");
            sql.push(",'" + clienteNuevo.NombrePuntoVenta+"'");
            sql.push(",'" + clienteNuevo.NombreFacturacion + "'");
            sql.push(",'" + clienteNuevo.DireccionFacturacion + "'");
            sql.push(",'" + clienteNuevo.Nit + "'");
            sql.push(",'" + clienteNuevo.ContactoIdentificacion+"'");
            sql.push(",1000000,365,0");
            sql.push(",'" + clienteNuevo.SyncId + "'");
            sql.push(", " + clienteNuevo.DiscountListId);
            sql.push(", " + clienteNuevo.BonusListId);
            sql.push(", '" + clienteNuevo.ownerId + "'");
            sql.push(",'"+tipoDeRedALaQueEstaConectadoElDispositivo+"'");
            sql.push(", " + (gIsOnline === SiNo.Si ? 0 : 1) + ")");
            tx.executeSql(sql.join(""));
            sql = null;

            var sqlFrequency = [];
            sqlFrequency
                .push("INSERT INTO CLIENTS_FREQUENCY([CODE_CUSTOMER],[SUNDAY],[MONDAY],[TUESDAY],[WEDNESDAY],[THURSDAY],[FRIDAY],[SATURDAY],[FREQUENCY_WEEKS],[LAST_DATE_VISITED])");
            sqlFrequency.push(" VALUES('"+ clienteNuevo.CodigoHH +"' ");
            sqlFrequency.push(",'"+ clienteNuevo.DiasVisita.domingo+"' ");
            sqlFrequency.push(",'"+ clienteNuevo.DiasVisita.lunes+"' ");
            sqlFrequency.push(",'"+ clienteNuevo.DiasVisita.martes+"' ");
            sqlFrequency.push(",'"+ clienteNuevo.DiasVisita.miercoles+"' ");
            sqlFrequency.push(",'"+ clienteNuevo.DiasVisita.jueves+"' ");
            sqlFrequency.push(",'"+ clienteNuevo.DiasVisita.viernes+"' ");
            sqlFrequency.push(",'"+ clienteNuevo.DiasVisita.sabado+"' ");
            sqlFrequency.push(",'"+ clienteNuevo.Frecuencia+"' ");
            sqlFrequency.push(",'"+ (getDateTime())+"')");
            tx.executeSql(sqlFrequency.join(""));
            sqlFrequency = null;

            //Grabar Etiquetas

            for (var i = 0; i < clienteNuevo.Tags.length; i++) {
                var etiqueta = clienteNuevo.Tags[i];
                if (etiqueta.ASIGNADO === 1) {
                    var sqlTags = [];
                    sqlTags
                        .push("INSERT INTO TAGS_X_CUSTOMER(TAG_COLOR,CUSTOMER,IS_POSTED, DEVICE_NETWORK_TYPE, IS_POSTED_OFFLINE)");
                    sqlTags.push(" VALUES('"+etiqueta.TAG_COLOR+"','"+clienteNuevo.CodigoHH+"', 0,'"+tipoDeRedALaQueEstaConectadoElDispositivo+"', "+(gIsOnline === SiNo.Si ? 0 : 1)+ ")");
                    tx.executeSql(sqlTags.join(""));
                    sqlTags = null;
                }
            }

        },
        function(err) {
            if (err.code !== 0)
                notify(err.message);
        },
        function() {
            callback(clienteNuevo);
        }
    );
}

function GuardarClienteNuevoHandHeld(clienteNuevo, callback) {
    ObtenerPosicionGPS(function () {
        ObtenerCliente(clienteNuevo.CodigoHH, function (clienteFotoFirma) {
            if (clienteFotoFirma.rows[0].SIGN !== "" && clienteFotoFirma.rows[0].SIGN !== undefined && clienteNuevo.Firma === "") {
                clienteNuevo.Firma = clienteFotoFirma.rows[0].SIGN;
            }
                
            if (clienteFotoFirma.rows[0].PHOTO !== "" && clienteFotoFirma.rows[0].PHOTO !== undefined && clienteNuevo.Foto === "") {
                clienteNuevo.Foto = clienteFotoFirma.rows[0].PHOTO;
            }

            clienteNuevo.SyncId = clienteFotoFirma.rows[0].SYNC_ID;

            clienteNuevo.DiscountListId = (clienteFotoFirma.rows[0].DISCOUNT_LIST_ID === null || clienteFotoFirma.rows[0].DISCOUNT_LIST_ID === "null" || clienteFotoFirma.rows[0].DISCOUNT_LIST_ID === "NULL") ? null : parseInt(clienteFotoFirma.rows[0].DISCOUNT_LIST_ID);
            clienteNuevo.BonusListId = (clienteFotoFirma.rows[0].BONUS_LIST_ID === null || clienteFotoFirma.rows[0].BONUS_LIST_ID === "null" || clienteFotoFirma.rows[0].BONUS_LIST_ID === "NULL") ? null : parseInt(clienteFotoFirma.rows[0].BONUS_LIST_ID);
            clienteNuevo.saleByMultipleListId = (clienteFotoFirma.rows[0].SALES_BY_MULTIPLE_LIST_ID === null || clienteFotoFirma.rows[0].SALES_BY_MULTIPLE_LIST_ID === "null" || clienteFotoFirma.rows[0].SALES_BY_MULTIPLE_LIST_ID === "NULL") ? null : parseInt(clienteFotoFirma.rows[0].SALES_BY_MULTIPLE_LIST_ID);

            CrearNuevoCliente(clienteNuevo, function (cliente) {
                callback(cliente);
            });
        }, function () {
            ObtenerListaDeDescuentosYBonificacionesParaScouting(clienteNuevo, function(clienteConAcuerdoComercial) {
                CrearNuevoCliente(clienteConAcuerdoComercial, function (cliente) {
                    callback(cliente);
                });
            });
        });
    });
}

function ObtenerEtiquetas(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT";
            sql += " TAG_COLOR";
            sql += " ,TAG_VALUE_TEXT";
            sql += " ,TAG_PRIORITY";
            sql += " ,TAG_COMMENTS";
            sql += " FROM TAGS";
            sql += " ORDER BY CAST(TAG_PRIORITY AS INT)";

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

function ActualizarIdClienteItems(customer, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT * FROM CLIENTS ";
            sql += " WHERE CLIENT_HH_ID_OLD = '" + customer.CustomerId + "'";
            sql += " and substr(CLIENT_ID,1,1 ) <> '-'";
            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length > 0) {
                        if (results.rows.item(0).CLIENT_ID != customer.ClientHhIdOld) {
                            customer.CustomerId = results.rows.item(0).CLIENT_ID;
                            ActualizarIdClienteEnFacturas(customer.CustomerId, customer.Invoices, function (idClienteN1) {
                                ActualizarIdClienteEnPagos(idClienteN1, customer.Payments, function (idClienteN2) {
                                    ActualizarIdClienteEnConsignaciones(idClienteN2, customer.Consignments, function (idClienteN3) {
                                        ActualizarIdClienteEnPreventa(idClienteN3, customer.Sales, callback);

                                    });
                                });
                            });
                        }
                        else {
                            callback();
                        }
                    } else {
                        callback();
                    }
                },
                function (tx, err) {
                    if (err.code !== 0)
                        errCallBack(err);
                });
        },
        function (err) {
            errCallBack(err);
        }
    );
}

function ActualizarIdClienteEnFacturas(idCliente, facturas, callback) {
    for (var i = 0; i < facturas.length; i++) {
        facturas[i].ClientId = idCliente;
    }
    callback(idCliente);
}

function ActualizarIdClienteEnPagos(idCliente, pagos, callback) {
    for (var i = 0; i < pagos.length; i++) {
        pagos[i].ClientId = idCliente;
    }
    callback(idCliente);
}

function ActualizarIdClienteEnConsignaciones(idCliente, consignaciones, callback) {
    for (var i = 0; i < consignaciones.length; i++) {
        consignaciones[i].ClientId = idCliente;
    }
    callback(idCliente);
}

function ActualizarIdClienteEnPreventa(idCliente, sales, callback) {
    for (var i = 0; i < sales.length; i++) {
        sales[i].CLIENT_ID = idCliente;
    }
    callback();
}

function ObtenerClientes(pClientName, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "";

            sql = "SELECT ";
            sql += " count(*)  clientes ";
            sql += " FROM CLIENTS";
            sql += " WHERE CLIENT_NAME LIKE '%" + pClientName + "%'";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.item(0).clientes > 100) {
                    errCallBack({ codig: -1, message: "Favor Ingresar mas caracteres" });
                } else {
                    sql = "SELECT ";
                    sql += " CLIENT_ID";
                    sql += " , CLIENT_NAME ";
                    sql += " ,ADDRESS";
                    sql += " FROM CLIENTS";
                    sql += " WHERE CLIENT_NAME LIKE '%" + pClientName + "%'";

                    tx.executeSql(sql, [],
                        function (tx, results) {
                            callback(results);
                        },
                        function (tx, err) {
                            if (err.code !== 0)
                                errCallBack(err);
                        }
                    );
                }
            });


        },
         function (err) {
             errCallBack(err);
         }
    );
}


function ObtenerCliente(pCodeCustomer, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT *";
            sql += " FROM CLIENTS";
            sql += " WHERE CLIENT_ID = '" + pCodeCustomer + "'";

            tx.executeSql(sql, [],
                function (tx, results) {
                    if (results.rows.length === 1) {
                        callback(results);
                    } else {
                        errCallBack("No se encontro el cliente.");
                    }
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

function ObtenerFrecuenciasCliente(pCodeCustomer, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT *";
            sql += " FROM CLIENTS_FREQUENCY";
            sql += " WHERE CODE_CUSTOMER = '" + pCodeCustomer + "'";

            tx.executeSql(sql, [],
                function (tx, results) {
                    callback(results, pCodeCustomer);
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

function ObtenerEtiquetasCliente(pCodeCustomer, callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = " SELECT TC.*";
            sql += " ,T.TAG_VALUE_TEXT";
            sql += " FROM TAGS_X_CUSTOMER TC, TAGS T";
            sql += " WHERE CUSTOMER = '" + pCodeCustomer + "'";
            sql += " AND T.TAG_COLOR = TC.TAG_COLOR";

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

function GetCompanies(callback, errCallBack) {
    SONDA_DB_Session.transaction(
        function (tx) {
            var sql = "SELECT * ";
            sql += " FROM COMPANY";
            tx.executeSql(sql, [],
                function (tx, results) {
                    var companies = [];
                    for (var j = 0; j < results.rows.length; j++) {
                        var company = {
                            text: results.rows.item(j).COMPANY_NAME,
                            value: results.rows.item(j).COMPANY_ID
                        };
                        companies.push(company);
                    }
                    callback(companies);
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
