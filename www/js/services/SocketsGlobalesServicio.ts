class SocketsGlobalesServicio {

    unidadDeMedidaServicio: UnidadDeMedidaServicio = new UnidadDeMedidaServicio();
    estadisticaDeVentaServicio: EstadisticaDeVentaServicio = new EstadisticaDeVentaServicio();

    delegarSocketsGlobales(socketIo: SocketIOClient.Socket) {
        //Socket Core

        socketIo.on("broadcast_receive", data => {
            navigator.geolocation.getCurrentPosition(
                position => {
                    gCurrentGPS = `${position.coords.latitude},${
                        position.coords.longitude
                        }`;
                    socketIo.emit("broadcast_response", {
                        sockeit: socketIo.id,
                        gps: gCurrentGPS,
                        "message:": "OK",
                        routeid: gCurrentRoute,
                        loginid: gLastLogin
                    });
                },
                error => {
                    socketIo.emit("broadcast_response", {
                        sockeit: socketIo.id,
                        gps: "0,0",
                        "message:": error,
                        routeid: gCurrentRoute,
                        loginid: gLastLogin
                    });
                },
                { timeout: 30000, enableHighAccuracy: true }
            );
        });

        socketIo.on("set_basic_invoice_info", data => {
            $("#lblRemoteInvoice_NIT").text(data.rows[0].CDF_NIT);
            $("#lblRemoteInvoice_Nombre").text(data.rows[0].CDF_NOMBRECLIENTE);
            $("#lblRemoteInvoice_Monto").text(
                "Q " + format_number(data.rows[0].TOTAL_AMOUNT, 2)
            );
            $("#lblRemoteInvoice_FechaHora").text(data.rows[0].INVOICED_DATETIME);
        });

        socketIo.on("finish_route_completed", data => {
            finalizarRuta(
                () => {
                    initlocalstorage();
                    window.localStorage.removeItem("POS_STATUS");
                    var countCloseInterval = 0;
                    var closeInterval = setInterval(() => {
                        countCloseInterval++;
                        if (countCloseInterval == 3) {
                            my_dialog("", "", "close");
                            notify("Ruta Finalizada.");
                            clearInterval(closeInterval);
                            // ReSharper disable once TsResolvedFromInaccessibleModule
                            (navigator as any).app.exitApp();
                        }
                    }, 1000);
                },
                err => {
                    notify(
                        "No se pudo finalizar la Ruta debido al siguiente error: " +
                        err.message
                    );
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                }
            );
        });

        socketIo.on("finish_route_error", data => {
            notify(`Error al finalizar ruta: ${data.error}`);
            InteraccionConUsuarioServicio.desbloquearPantalla();
        });

        socketIo.on("UpdateStatusInvoice_Request_Complete", data => {
            ProcessVoidInvoice(
                data.invoiceid,
                data.reason,
                data.reason,
                data.paidconsignment,
                data.imgconsignment,
                2
            );
        });

        socketIo.on("UpdateStatusInvoice_Request_Fail", data => {
            notify(data.error);
            my_dialog("", "", "close");
        });

        //===================== Socket Login =============================================
        socketIo.on("invalid_credentials", data => {
            notify("Usuario o Password invalido");
        });

        socketIo.on("welcome_to_sonda", data => {
            my_dialog("", "", "close");
            gCurrentRoute = data.routeid;
            gLastLogin = pUserID;
            gDefaultWhs = data.default_warehouse;
            gdbuser = data.dbuser;
            gdbuserpass = data.dbuserpass;
            gRouteReturnWarehouse = data.route_return_warehouse;

            UpdateLoginInfo("set");

            if (gIsOnline == EstaEnLinea.Si) {
                GetBankAccounts();
                GetVoidReasons();
            }
            $("#lblCurrentWarehouse").text(gDefaultWhs);

            setTimeout(() => {
                socketIo.emit("GetPosTaxParameters", data);
            }, 3000);
        });

        /* TAX PARAMETERS */
        socketIo.on("GetPosTaxParametersResponse", data => {
            switch (data.option) {
                case "GetPosTaxParametersFail":
                    notify(
                        "No se han podido obtener los parámetros de etiquetas para resolución de facturación, por favor, comuníquese con su administrador"
                    );
                    break;
                case "GetPosTaxParametersNotFound":
                    notify(
                        "No se han podido obtener los parámetros de etiquetas para resolución de facturación, por favor, comuníquese con su administrador"
                    );
                    break;
                case "GetPosTaxParametersFound":
                    if (data.parameters) {
                        data.parameters.map((parameter, i) => {
                            switch (parameter.PARAMETER_ID) {
                                case "TAX_ID":
                                    localStorage.setItem("TAX_ID", parameter.VALUE);
                                    break;
                                case "TAX_RESOLUTION_ID":
                                    localStorage.setItem("TAX_RESOLUTION_ID", parameter.VALUE);
                                    break;
                                case "TAX_PERCENT":
                                    localStorage.setItem("TAX_PERCENT", parameter.VALUE);
                                    break;
                                case "TAX_LABEL_ID":
                                    localStorage.setItem("TAX_LABEL_ID", parameter.VALUE);
                                    break;
                            }

                            if (i === data.parameters.length - 1) {
                                $.mobile.changePage("#dialog_startpos", {
                                    transition: "pop",
                                    reverse: false,
                                    showLoadMsg: false
                                });
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                            }
                        });
                    }
                    break;
            }
        });

        //====================================== socketIo Skus ======================================================================
        socketIo.on("GetInitialRouteSend", data => {
            try {
                let cuentaCorrienteServicio = new CuentaCorrienteServicio();
                switch (data.option) {
                    case "fail":
                        ToastThis(`Error al iniciar ruta: ${data.error}`);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "error_message":
                        ToastThis(`Error al iniciar ruta: ${data.message}`);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    //
                    case "requested_get_tasks":
                        my_dialog("Obteniendo plan de ruta", "espere...", "open");
                        break;
                    case "no_get_tasks_found":
                        my_dialog("", "", "close");
                        ToastThis("No hay clientes a quien visitar");
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "no_skus_found":
                        my_dialog("", "", "close");
                        ToastThis("No hay skus en inventario");
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "getroute_inv_completed":
                        my_dialog("", "", "close");
                        ToastThis("Inventario cargado");
                        break;
                    case "requested_skus":
                        my_dialog("", "", "close");
                        my_dialog("Obteniendo inventario", "espere...", "open");
                        data = {
                            routeid: gCurrentRoute,
                            default_warehouse: gDefaultWhs,
                            dbuser: gdbuser,
                            dbuserpass: gdbuserpass
                        };

                        socketIo.emit("get_sales_skus", data);
                        break;
                    case "add_to_pos_sku":
                        SONDA_DB_Session.transaction(
                            tx => {
                                var pSql =
                                    "DELETE FROM SKUS WHERE SKU = '" + data.row.SKU + "'";
                                tx.executeSql(pSql);

                                pSql =
                                    "INSERT INTO SKUS(SKU, SKU_NAME, SKU_PRICE, SKU_LINK, REQUERIES_SERIE, IS_KIT, ON_HAND, ROUTE_ID, IS_PARENT, PARENT_SKU, EXPOSURE, PRIORITY, QTY_RELATED, LOADED_LAST_UPDATED, TAX_CODE, CODE_PACK_UNIT_STOCK, SALES_PACK_UNIT)";
                                pSql +=
                                    "VALUES('" +
                                    data.row.SKU +
                                    "','" +
                                    data.row.SKU_NAME +
                                    "'," +
                                    format_number(data.row.SKU_PRICE, 2) +
                                    ",'...',";
                                pSql +=
                                    data.row.REQUERIES_SERIE +
                                    "," +
                                    data.row.IS_KIT +
                                    "," +
                                    data.row.ON_HAND +
                                    ",'" +
                                    data.row.ROUTE_ID +
                                    "',";
                                pSql +=
                                    data.row.IS_PARENT +
                                    ",'" +
                                    data.row.PARENT_SKU +
                                    "'," +
                                    data.row.EXPOSURE +
                                    "," +
                                    data.row.PRIORITY +
                                    ",";
                                pSql +=
                                    data.row.QTY_RELATED +
                                    ",'" +
                                    getDateTime() +
                                    "', '" +
                                    data.row.TAX_CODE +
                                    "', " +
                                    (data.row
                                        .CODE_PACK_UNIT_STOCK
                                        ? ("'" + data.row.CODE_PACK_UNIT_STOCK + "'")
                                        : null) +
                                    ", '" +
                                    data.row.SALES_PACK_UNIT +
                                    "')";
                                console.log("Inserting SKU: " + pSql);
                                tx.executeSql(pSql);

                                //---insert para la tabla que guardara el inventario inicial
                                pSql =
                                    "DELETE FROM SKU_HISTORY WHERE SKU = '" + data.row.SKU + "'";
                                tx.executeSql(pSql);

                                pSql =
                                    "INSERT INTO SKU_HISTORY(SKU, SKU_NAME, SKU_PRICE, SKU_LINK, REQUERIES_SERIE, IS_KIT, ON_HAND, ROUTE_ID, IS_PARENT, PARENT_SKU, EXPOSURE, PRIORITY, QTY_RELATED, LOADED_LAST_UPDATED,QTY_SOLD,QTY_CONSIGNED,QTY_COLLECTED)";
                                pSql +=
                                    "VALUES('" +
                                    data.row.SKU +
                                    "','" +
                                    data.row.SKU_NAME +
                                    "'," +
                                    format_number(data.row.SKU_PRICE, 2) +
                                    ",'...',";
                                pSql +=
                                    data.row.REQUERIES_SERIE +
                                    "," +
                                    data.row.IS_KIT +
                                    "," +
                                    data.row.ON_HAND +
                                    ",'" +
                                    data.row.ROUTE_ID +
                                    "',";
                                pSql +=
                                    data.row.IS_PARENT +
                                    ",'" +
                                    data.row.PARENT_SKU +
                                    "'," +
                                    data.row.EXPOSURE +
                                    "," +
                                    data.row.PRIORITY +
                                    ",";
                                pSql +=
                                    data.row.QTY_RELATED + ",'" + getDateTime() + "',0,0,0)";
                                tx.executeSql(pSql);
                            },
                            err => {
                                my_dialog("", "", "close");
                                notify(err.message);
                            }
                        );
                        break;
                    case "pos_skus_completed":
                        ToastThis(`${data.rowcount} SKUs Cargados.`);
                        my_dialog("", "", "close");

                        GetRoutePlan();

                        break;
                    case "add_to_task":
                        AddToTask(data);
                        var xonclick1 = "";
                        var xonclick2 = "";
                        var vLI = "";
                        switch (data.row.TASK_TYPE) {
                            case TareaTipo.Venta:
                                if (data.row.EXPECTED_GPS == "0,0") {
                                    xonclick1 = "notify('No hay punto GPS');";
                                    vLI =
                                        '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-forbidden">';
                                } else {
                                    xonclick1 =
                                        "TaskNavigateTo('" + data.row.EXPECTED_GPS + "',null)";
                                    vLI =
                                        '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-navigation">';
                                }
                                xonclick2 =
                                    "InvoiceThisTask(" +
                                    data.row.TASK_ID +
                                    ",'" +
                                    data.row.RELATED_CLIENT_CODE +
                                    "','" +
                                    data.row.RELATED_CLIENT_NAME.replace(/"|'/g, "") +
                                    "','" +
                                    data.row.NIT +
                                    "','" +
                                    data.row.TASK_TYPE +
                                    "')";

                                vLI = vLI + '<a href="#" onclick="' + xonclick2 + '">';

                                vLI = vLI + '<h2><span class="small-roboto">';
                                vLI =
                                    vLI +
                                    data.row.TASK_SEQ +
                                    ')</span>&nbsp<span class="small-roboto">' +
                                    data.row.RELATED_CLIENT_NAME +
                                    "</span></h2><p>" +
                                    data.row.TASK_ADDRESS +
                                    "</p>";
                                vLI = vLI + '</a><a href="#" onclick="' + xonclick1 + '">';
                                vLI = vLI + "</a></li>";
                                $("#skus_listview_sales_route").append(vLI);
                                break;

                            case TareaTipo.Entrega:
                                if (data.row.EXPECTED_GPS == "0,0") {
                                    xonclick1 = "notify('No hay punto GPS');";
                                    vLI =
                                        '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-forbidden">';
                                } else {
                                    xonclick1 =
                                        "TaskNavigateTo('" + data.row.EXPECTED_GPS + "',null)";
                                    vLI =
                                        '<li data-mini="true" class="ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-navigation">';
                                }

                                vLI = vLI + '<h2><span class="small-roboto">';
                                vLI =
                                    vLI +
                                    data.row.TASK_SEQ +
                                    ')</span>&nbsp<span class="small-roboto">' +
                                    data.row.RELATED_CLIENT_NAME +
                                    "</span></h2><p>" +
                                    data.row.TASK_ADDRESS +
                                    "</p>";
                                vLI = vLI + '</a><a href="#" onclick="' + xonclick1 + '">';
                                vLI = vLI + "</a></li>";
                                $("#skus_listview_sales_route").append(vLI);
                                break;
                        }

                        break;
                    case "get_tasks_completed": //data service has been completed
                        GetPriceLists();

                        try {
                            $("#skus_listview_sales_route").listview("refresh");
                        } catch (e) {
                            $("#skus_listview_sales_route")
                                .listview()
                                .listview("refresh");
                        }

                        // ReSharper disable once TsResolvedFromInaccessibleModule
                        var clientscount = $("#skus_listview_sales_route li").size();

                        $("#lblClientsToVisit").text("Plan de ruta (" + clientscount + ")");

                        break;
                    //Listas de Precios por escala para skus
                    case "add_price_list_by_sku":
                        addPriceListBySckuPackScale(data.row);
                        break;
                    //Lista de Precios Default
                    case "get_price_list_default_received":
                        PriceListDefaultReceived();
                        break;
                    case "not_found_default_price_list":
                        PriceListDefaultNotFound(data);
                        break;
                    case "add_price_list_default":
                        AddPriceListDefault(data);
                        break;
                    case "get_price_list_default_completed":
                        PriceListDefaultCompleted();
                        break;
                    case "requested_get_rules":
                        var reglaServicio = new ReglaServicio();
                        reglaServicio.limpiarTabla(e => {
                            notify(e.message);
                        });
                        reglaServicio = null;
                        break;
                    case "no_get_rules_found":
                        notify("No se encontraron reglas para la ruta");
                        break;
                    case "add_to_rule":
                        var reglaServicio2 = new ReglaServicio();
                        reglaServicio2.guardarReglas(
                            data.row,
                            () => { },
                            err => {
                                notify(err.message);
                            }
                        );
                        reglaServicio2 = null;
                        break;
                    case "get_rules_completed":
                        ToastThis("Reglas Cargadas Exitosamente");
                        break;
                    case "add_consignment":
                        InsertarConsignacionDesdeBo(data.Consignment);
                        break;
                    case "GetDocumentSequence_start":
                        AperturaDeCajaServicio.LimpiarTablaDeSecuenciaDeDocumentos();
                        break;
                    case "GetDocumentSequence_NoFound":
                        ToastThis(
                            "No se encontraron Secuencias de Documentos para la Ruta actual, por favor, comuníquese con su Administrador de Sonda"
                        );
                        break;
                    case "GetDocumentSequence_AddDocument":
                        AperturaDeCajaServicio.AgregarSecuenciaDeDocumento(data.row);
                        break;
                    case "GetInitialRouteComplete":
                        localStorage.setItem("POS_STATUS", "OPEN");
                        localStorage.setItem("POS_DATE", getDateTime());
                        my_dialog("", "", "close");

                        ShowHideOptions();

                        var tiempoEsperaCambioDePantalla = setTimeout(() => {
                            $.mobile.changePage("#menu_page", {
                                transition: "flow",
                                reverse: true,
                                showLoadMsg: false
                            });
                            clearTimeout(tiempoEsperaCambioDePantalla);
                        }, 3000);

                        break;
                    //SERIES POR SKU
                    case "requested_serie":
                        my_dialog("Series", "obteniendo series...", "open");
                        break;

                    case "add_to_series":
                        SONDA_DB_Session.transaction(
                            tx => {
                                var pSql = "";

                                pSql = `DELETE FROM SKU_SERIES WHERE SKU = '${data.row.SKU}' AND SERIE = '${data.row.SKU_SERIE}'`;
                                console.log(pSql);
                                tx.executeSql(pSql);

                                pSql = "";

                                pSql =
                                    "INSERT INTO SKU_SERIES(" +
                                    "SKU, " +
                                    "IMEI, " +
                                    "SERIE, " +
                                    "PHONE, " +
                                    "ICC, " +
                                    "STATUS, " +
                                    "LOADED_LAST_UPDATED)";
                                pSql +=
                                    "VALUES('" +
                                    data.row.SKU +
                                    "'," +
                                    "'" +
                                    data.row.SKU_ICC +
                                    "'," +
                                    "'" +
                                    data.row.SKU_SERIE +
                                    "'," +
                                    "'" +
                                    data.row.SKU_PHONE +
                                    "',";
                                pSql +=
                                    "'" +
                                    data.row.SKU_ICC +
                                    "'," +
                                    "0," +
                                    "'" +
                                    getDateTime() +
                                    "')";
                                tx.executeSql(pSql);
                            },
                            err => {
                                my_dialog("", "", "close");
                                notify(err.message);
                            }
                        );
                        break;

                    case "get_currency_fail":
                        notify(data.error);
                        currencySymbol = "Q";
                        localStorage.setItem("NAME_CURRENCY", "");
                        break;

                    case "get_currency_not_found":
                        notify(data.error);
                        currencySymbol = "Q";
                        localStorage.setItem("NAME_CURRENCY", "");
                        break;

                    case "add_currency":
                        localStorage.setItem("CURRENCY_SYMBOL", data.row.SYMBOL_CURRENCY);
                        localStorage.setItem("NAME_CURRENCY", data.row.NAME_CURRENCY);
                        currencySymbol = data.row.SYMBOL_CURRENCY;
                        break;
                    case "GetTagsByTypeFail":
                        ToastThis(
                            "No se han podido obtener las etiquetas para clientes debido a: " +
                            data.error
                        );
                        break;
                    case "GetTagsByTypeNotFound":
                        ToastThis("No se encontraron etiquetas para clientes...");
                        break;
                    case "AddTagByType":
                        var etiquetaServicio = new EtiquetaServicio();
                        etiquetaServicio.agregarEtiqueta(data.tag);
                        etiquetaServicio = null;
                        break;
                    case "GetTagsByTypeCompleted":
                        if (data.rows > 0) {
                            ToastThis("Etiquetas cargadas exitosamente...");
                        }
                        break;

                    case "add_tax_for_sku":
                        AgregarTipoDeImpuesto(data.row);
                        break;

                    case "get_tax_information_for_skus_completed":
                        if (data.rowscount > 0) {
                            ToastThis(
                                "Información de impuesto de artículos cargada exitosamente"
                            );
                        }
                        break;

                    case "GetCalculationRules_received":
                        CalculationRulesReceived();
                        break;
                    case "not_found_CalculationRules":
                        CalculationRulesNotFound(data);
                        break;
                    case "add_GetCalculationRules":
                        AddCalculationRules(data);
                        break;
                    case "GetCalculationRules_completed":
                        CalculationRulesCompleted();
                        break;
                    case "add_not_delivery_reason":
                        ClasificacionesServicio.AgregarClasificacion(data.row);
                        break;
                    case "add_overdue_invoice_of_customer":
                        cuentaCorrienteServicio.agregarFacturaVencidaDeCliente(data.row);
                        break;
                    case "add_accounting_information_of_customer":
                        cuentaCorrienteServicio.agregarCuentaCorrienteDeCliente(data.row);
                        break;
                    case "GetPackUnit_AddPackUnit":
                        this.unidadDeMedidaServicio.agregarUnidadDeMedida(data.row);
                        break;
                    case "GetPackConversion_AddPackConversion":
                        this.unidadDeMedidaServicio.agregarPaqueteDeConversion(data.row);
                        break;
                    //StatisticsByUser
                    case "statistics_not_found":
                        notify("No se encontraron las estadisticas de venta.");
                        break;
                    case "add_statistic":
                        this.estadisticaDeVentaServicio.agregarEstadisticaDeVenta(data.row);
                        break;
                }
            } catch (es) {
                notify("GetInitialRouteSend.catch:" + es.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        });

        //========================== socketIo Invoice ============================================================================
        /* INVOICES */
        socketIo.on("post_invoice_completed", data => {
            my_dialog("", "", "close");
            var pInvoiceID = data.invoiceid;

            SONDA_DB_Session.transaction(tx => {
                var pSQL =
                    "UPDATE INVOICE_HEADER SET IS_POSTED = 1 WHERE INVOICE_NUM = " +
                    pInvoiceID;

                var gpicture = $("#btnTakePic1").attr("srcpic");
                UploadPhoto(data.invoiceid, data.autid, data.autserie, gpicture, 1);
                gpicture = $("#btnTakePic2").attr("srcpic");
                UploadPhoto(data.invoiceid, data.autid, data.autserie, gpicture, 2);
                gpicture = $("#btnTakePic3").attr("srcpic");
                UploadPhoto(data.invoiceid, data.autid, data.autserie, gpicture, 3);

                tx.executeSql(pSQL);
            });

            ShowInvoiceConfirmation();
        });

        socketIo.on("post_invoice_offline_received", data => {
            try {
                ToastThis("Procesando offline...");
            } catch (e) {
                notify("Procesando offline... ERROR, ");
            }
        });

        socketIo.on("post_invoice_offline_failed", data => {
            try {
                notify("post_invoice_offline_failed:" + data.msg);
            } catch (e) {
                notify("post_invoice_offline_failed ERROR, ");
            }
        });

        /* OFFLINE TXS RECOVERED FROM LOCAL SAVED TO SERVER*/
        socketIo.on("post_invoice_offline_completed", data => {
            my_dialog("", "", "close");
            var pInvoiceID = data.invoiceid;

            SONDA_DB_Session.transaction(tx => {
                var pSQL =
                    "UPDATE INVOICE_HEADER SET IS_POSTED = 1 WHERE INVOICE_NUM = " +
                    pInvoiceID;
                tx.executeSql(pSQL);

                pSQL = "SELECT * FROM INVOICE_HEADER WHERE INVOICE_NUM = " + pInvoiceID;

                tx.executeSql(
                    pSQL,
                    [],
                    (tx2, results) => {
                        // ReSharper disable once TsNotResolved
                        UploadPhoto(
                            data.invoiceid,
                            data.autid,
                            data.autserie,
                            (results.rows.item(0) as any).IMG1,
                            1
                        );
                        // ReSharper disable once TsNotResolved
                        UploadPhoto(
                            data.invoiceid,
                            data.autid,
                            data.autserie,
                            (results.rows.item(0) as any).IMG2,
                            2
                        );
                        // ReSharper disable once TsNotResolved
                        UploadPhoto(
                            data.invoiceid,
                            data.autid,
                            data.autserie,
                            (results.rows.item(0) as any).IMG3,
                            3
                        );
                    },
                    (tx2, err) => {
                        my_dialog("", "", "close");
                        if (err.code != 0) {
                            alert("Error processing SQL: " + err.code);
                        }
                    }
                );

                tx.executeSql(pSQL);
            });
            listallinvoices();
        });

        /* VOID INVOICE */
        socketIo.on("void_invoice_completed", data => {
            my_dialog("", "", "close");
            localStorage.setItem(
                "POS_CURRENT_CREDIT_NOTE",
                (Number(pCurrentNoteID) - 1).toString()
            );
            pCurrentNoteID = localStorage.getItem("POS_CURRENT_CREDIT_NOTE");
        });

        //======================== socketIo Auths =======================================================================
        /* AUTORIZACIONES SAT */

        socketIo.on("add_to_auth", data => {
            try {
                var date_autho;
                var date_autho_limit;

                my_dialog("", "", "close");

                localStorage.setItem("INVOICE_IN_ROUTE", data.row.INVOICE_IN_ROUTE);

                if (UsuarioFacturaEnRuta(data.row)) {
                    date_autho =
                        data.row.AUTH_POST_DATETIME.substring(0, 4) +
                        "/" +
                        data.row.AUTH_POST_DATETIME.substring(5, 7) +
                        "/" +
                        data.row.AUTH_POST_DATETIME.substring(8, 10);
                    date_autho_limit =
                        data.row.AUTH_LIMIT_DATETIME.substring(0, 4) +
                        "/" +
                        data.row.AUTH_LIMIT_DATETIME.substring(5, 7) +
                        "/" +
                        data.row.AUTH_LIMIT_DATETIME.substring(8, 10);

                    if (data.doctype == "FACTURA") {
                        $("#lblCurrent_AuthID").text(data.row.AUTH_ID);
                        $("#lblCurrent_Serie").text(data.row.AUTH_SERIE);

                        $("#lblCurrent_DateAuth").text(date_autho.toString());
                        $("#lblCurrent_AuthFinishDate").text(date_autho_limit.toString());

                        $("#lblCurrent_From").text(data.row.AUTH_DOC_FROM);
                        $("#lblCurrent_To").text(data.row.AUTH_DOC_TO);

                        $("#lblCurrent_CurrentInvoice").text(data.row.AUTH_CURRENT_DOC);

                        $("#lblBranchName").text(data.row.AUTH_BRANCH_NAME);

                        $("#lblCurrent_Nit").text(data.row.NIT_ENTERPRISE);
                        localStorage.setItem("NitEnterprise", data.row.NIT_ENTERPRISE);

                        $("#lblBranchAddress").text(data.row.AUTH_BRANCH_ADDRESS);

                        localStorage.setItem(
                            "direccionFacturacion01",
                            data.row.AUTH_BRANCH_ADDRESS
                        );

                        if (data.row.BRANCH_ADDRESS2 === null) {
                            $("#lblBranchAddress2").text("");
                            $("#branchAddress2").css("display", "none");
                            localStorage.setItem("direccionFacturacion02", "");
                        } else {
                            $("#lblBranchAddress2").text(data.row.BRANCH_ADDRESS2);
                            $("#branchAddress2").css("display", "block");
                            localStorage.setItem(
                                "direccionFacturacion02",
                                data.row.BRANCH_ADDRESS2
                            );
                        }

                        if (data.row.BRANCH_ADDRESS3 === null) {
                            $("#lblBranchAddress3").text("");
                            $("#branchAddress3").css("display", "none");
                            localStorage.setItem("direccionFacturacion03", "");
                        } else {
                            $("#lblBranchAddress3").text(data.row.BRANCH_ADDRESS3);
                            $("#branchAddress3").css("display", "block");
                            localStorage.setItem(
                                "direccionFacturacion03",
                                data.row.BRANCH_ADDRESS3
                            );
                        }

                        if (data.row.BRANCH_ADDRESS4 === null) {
                            $("#lblBranchAddress4").text("");
                            $("#branchAddress4").css("display", "none");
                            localStorage.setItem("direccionFacturacion04", "");
                        } else {
                            $("#lblBranchAddress4").text(data.row.BRANCH_ADDRESS4);
                            $("#branchAddress4").css("display", "block");
                            localStorage.setItem(
                                "direccionFacturacion04",
                                data.row.BRANCH_ADDRESS4
                            );
                        }

                        if (data.row.ENTERPRISE_EMAIL_ADDRESS === null) {
                            $("#lblbranchEmail").text("");
                            $("#branchEmail").css("display", "none");
                            localStorage.setItem("correoElectronicoEmpresa", "");
                        } else {
                            $("#lblbranchEmail").text(data.row.ENTERPRISE_EMAIL_ADDRESS);
                            $("#branchEmail").css("display", "block");
                            localStorage.setItem(
                                "correoElectronicoEmpresa",
                                data.row.ENTERPRISE_EMAIL_ADDRESS
                            );
                        }

                        if (data.row.PHONE_NUMBER === null) {
                            $("#lblbranchTelefono").text("");
                            $("#branchTelefono").css("display", "none");
                            localStorage.setItem("telefonoEmpresa", "");
                        } else {
                            $("#lblbranchTelefono").text(data.row.PHONE_NUMBER);
                            $("#branchTelefono").css("display", "block");
                            localStorage.setItem("telefonoEmpresa", data.row.PHONE_NUMBER);
                        }

                        $("#lblCompanyName").text(data.row.NAME_ENTERPRISE);

                        localStorage.setItem("SAT_RES_EXPIRE", date_autho_limit);

                        localStorage.setItem("NAME_USER", data.row.NAME_USER);
                    }
                } else {
                    $("#lblCompanyName").text(data.row.NAME_ENTERPRISE);

                    $("#lblCurrent_Nit").text(data.row.NIT_ENTERPRISE);
                    localStorage.setItem("NitEnterprise", data.row.NIT_ENTERPRISE);

                    if (data.row.ENTERPRISE_EMAIL_ADDRESS === null) {
                        $("#lblbranchEmail").text("");
                        $("branchEmail").css("display", "none");
                        localStorage.setItem("correoElectronicoEmpresa", "");
                    } else {
                        $("#lblbranchEmail").text(data.row.ENTERPRISE_EMAIL_ADDRESS);
                        $("#branchEmail").css("display", "block");
                        localStorage.setItem(
                            "correoElectronicoEmpresa",
                            data.row.ENTERPRISE_EMAIL_ADDRESS
                        );
                    }

                    if (data.row.PHONE_NUMBER === null) {
                        $("#lblbranchTelefono").text("");
                        $("#branchTelefono").css("display", "none");
                        localStorage.setItem("telefonoEmpresa", "");
                    } else {
                        $("#lblbranchTelefono").text(data.row.PHONE_NUMBER);
                        $("#branchTelefono").css("display", "block");
                        localStorage.setItem("telefonoEmpresa", data.row.PHONE_NUMBER);
                    }

                    localStorage.setItem("NAME_USER", data.row.NAME_USER);
                }

                $("#btnStartPOS_action").css("visibility", "visible");
            } catch (e) {
                notify(e.message);
                my_dialog("", "", "close");
            }
        });
        socketIo.on("auth_not_found", data => {
            my_dialog("", "", "close");
            notify("ERROR, No hay autorizacion disponible para facturar.");
        });
        socketIo.on("auth_found", data => {
            my_dialog("", "", "close");
            data = {
                routeid: gCurrentRoute,
                dbuser: gdbuser,
                dbuserpass: gdbuserpass,
                inLogin: true
            };
            socketIo.emit("GetDeliveryParameter", data);
        });

        //============================================= socketIos Inv =====================================================
        socketIo.on("getroute_inv_completed", data => {
            my_dialog("", "", "close");

            if (data.pResult == "OK") {
                var emitData = {
                    default_warehouse: gDefaultWhs,
                    dbuser: gdbuser,
                    dbuserpass: gdbuserpass
                };
                socketIo.emit("get_sales_skus", emitData);
            } else {
                notify("delegate_socketIo_inv: " + data.pResult);
            }
        });

        //============================================================= socketIos Catalogs ======================================================
        /* ALERT */
        //
        socketIo.on("requested_getalertlimit", data => {
            SONDA_DB_Session.transaction(
                tx => {
                    localStorage.setItem("ALERT_LIMIT", "0");
                    localStorage.setItem("ALERT_MESSAGE", "");
                },
                err => {
                    my_dialog("", "", "close");
                    notify(err.code.toString());
                }
            );
        });

        socketIo.on("add_to_getalertlimit", data => {
            SONDA_DB_Session.transaction(
                tx => {
                    localStorage.setItem("ALERT_LIMIT", data.row.ALERT_PERC);
                    localStorage.setItem("ALERT_MESSAGE", data.row.ALERT_MESSAGE);
                },
                err => {
                    my_dialog("", "", "close");
                    notify(err.message);
                }
            );
        });

        socketIo.on("getalertlimit_completed", data => {
            my_dialog("", "", "close");
        });

        /* BANK ACCOUNTS */
        socketIo.on("requested_bank_accounts", data => {
            SONDA_DB_Session.transaction(
                tx => {
                    var pSql = "DELETE FROM BANK_ACCOUNTS";
                    tx.executeSql(pSql);
                },
                err => {
                    my_dialog("", "", "close");
                    notify(err.code.toString());
                }
            );
        });
        socketIo.on("add_to_bank_accounts", data => {
            SONDA_DB_Session.transaction(
                tx => {
                    var pSql =
                        "INSERT INTO BANK_ACCOUNTS(BANK, ACCOUNT_BASE, ACCOUNT_NAME, ACCOUNT_NUMBER) VALUES('" +
                        data.row.ACCOUNT_BANK +
                        "','" +
                        data.row.ACCOUNT_BASE +
                        "','" +
                        data.row.ACCOUNT_NAME +
                        "','" +
                        data.row.ACCOUNT_NUMBER +
                        "')";
                    tx.executeSql(pSql);
                },
                err => {
                    my_dialog("", "", "close");
                    notify(err.message);
                }
            );
        });
        socketIo.on("add_to_bank_completed", data => {
            my_dialog("", "", "close");
        });

        /* INVOICE'S VOID REASON */
        socketIo.on("requested_void_reasons", data => {
            gVoidReasons = [];
            //SONDA_DB_Session.transaction(
            //    tx => {
            //        var pSQL = "DELETE FROM VOID_REASONS";
            //        tx.executeSql(pSQL);
            //    },
            //    err => {
            //        my_dialog("", "", "close");
            //        notify(err.code.toString());
            //    }
            //);
        });
        socketIo.on("add_to_void_reasons", data => {
            SONDA_DB_Session.transaction(
                tx => {
                    var pSQL =
                        "INSERT INTO VOID_REASONS(REASON_ID, REASON_DESCRIPTION) VALUES('" +
                        data.row.REASON_ID +
                        "','" +
                        data.row.REASON_DESCRIPTION +
                        "')";
                    tx.executeSql(pSQL);
                },
                err => {
                    my_dialog("", "", "close");
                    notify(err.message);
                }
            );
        });
        socketIo.on("void_reasons_completed", data => {
            my_dialog("", "", "close");
            GetAlertLimit(data.data);
        });

        /* Enviar Resolucion */
        socketIo.on("SendResolution_Request", data => {
            switch (data.request) {
                case "SendInvoice":
                    switch (data.option) {
                        case "success":
                            ObtenerBroadcastPerdidos();
                            break;
                        case "fail":
                            ObtenerBroadcastPerdidos();
                            notify(
                                `Error al intentar actualizar la resolución. ${
                                data.error.message === undefined ? "" : data.error.message
                                }`
                            );
                            break;
                    }
                    break;
                case "CloseBox":
                    switch (data.option) {
                        case "success":
                            OnConfirmFinishPOS(2);
                            break;
                        case "fail":
                            notify(
                                `Error al intentar cerrar la ruta. ${
                                data.error.message === undefined ? "" : data.error.message
                                }`
                            );
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                    }
                    break;
            }
        });

        //=================================================== socketIos Deposit ============================================================================
        /* POST DEPOSIT */
        socketIo.on("post_deposit_completed", data => {
            my_dialog("", "", "close");

            if (!isNaN(data.pResult)) {
                if (!isNaN(data.pResult)) {
                    SONDA_DB_Session.transaction(tx => {
                        var pSQL =
                            "UPDATE DEPOSITS SET IS_POSTED = 1 WHERE TRANS_ID = " +
                            data.transid;
                        tx.executeSql(pSQL);
                    });
                }
            } else {
                notify(
                    `Error al crear el deposito en el servidor debido a: ${data.pResult}`
                );
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
            $.mobile.changePage("#menu_page", {
                transition: "slide",
                reverse: false,
                showLoadMsg: false
            });
        });

        /* OFFLINE TXS RECOVERED FROM LOCAL SAVED TO SERVER*/
        socketIo.on("post_deposit_offline_completed", data => {
            var pTransID = data.transid;
            var pResult = data.pResult;

            SONDA_DB_Session.transaction(tx => {
                var pSQL =
                    "UPDATE DEPOSITS SET IS_POSTED = 1 WHERE TRANS_ID = " + pTransID;
                tx.executeSql(pSQL);

                pSQL = "SELECT * FROM DEPOSITS WHERE TRANS_ID = " + pTransID;

                tx.executeSql(
                    pSQL,
                    [],
                    (tx, results) => {
                        // ReSharper disable once TsNotResolved
                        UploadPhotoDeposit(pResult, (results.rows.item(0) as any).IMG1);
                    },
                    (trans, err) => {
                        my_dialog("", "", "close");
                        if (err.code !== 0) {
                            alert("Error processing SQL: " + err.code);
                        }
                    }
                );
            });
            listalldeposits();
        });

        //========================================= socketIos Devolucion ================================================================================

        socketIo.on("SendReturnSku_Request", data => {
            switch (data.option) {
                case "SendRouteReturn_Error":
                    my_dialog("", "", "close");
                    notify("Error : " + data.error);
                    break;
                case "SendRouteReturn_Complete":
                    my_dialog("", "", "close");
                    localStorage.setItem("ID_ROUTE_RETURN", data.data.DocEntry);
                    $("#UiBotonDevolucionEnviar").addClass("ui-disabled");
                    $("#UiBotonDevolucionValidar").removeClass("ui-disabled");
                    break;
            }
        });

        socketIo.on("ValidateRouteReturn_Request", data => {
            switch (data.option) {
                case "ValidateRouteReturn_Error":
                    my_dialog("", "", "close");
                    notify("Error : " + data.error);
                    break;
                case "ValidateRouteReturn_Incomplete":
                    my_dialog("", "", "close");
                    notify("Documento no existe");
                    localStorage.setItem("ID_ROUTE_RETURN", "0");
                    $("#UiBotonDevolucionEnviar").removeClass("ui-disabled");
                    $("#UiBotonDevolucionValidar").addClass("ui-disabled");
                    break;
                case "ValidateRouteReturn_Complet":
                    my_dialog("", "", "close");
                    localStorage.setItem("ID_ROUTE_RETURN", "0");
                    $("#UiBotonDevolucionEnviar").addClass("ui-disabled");
                    $("#UiBotonDevolucionValidar").addClass("ui-disabled");
                    $("#UiBotonDevolucionImprimir").removeClass("ui-disabled");
                    LimpiarInventario();
                    break;
            }
        });

        //================================================= socketIos Sincronizacion =======================================
        {
            socketIo.on("InsertScoutingFromSondaPosResponse", data => {
                switch (data.option) {
                    case "fail":
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify("Error al sincronizar scouting debido a: " + data.message);
                        break;
                    case "success":
                        var clienteServicio = new ClienteServicio();
                        clienteServicio.marcarClienteComoSincronizado(
                            data.clients,
                            () => {
                                EnviarValidacionDeClientes();
                            },
                            resultado => {
                                InteraccionConUsuarioServicio.desbloquearPantalla();
                                notify(
                                    "Error al actualizar la sincronización de clientes debido a: " +
                                    resultado.mensaje
                                );
                            }
                        );
                        break;
                }
            });

            socketIo.on("ConsignmentReceiveComplete", data => {
                switch (data.option) {
                    case "fail":
                        notify(
                            `Error al crear la consignación en el servidor: ${data.error}`
                        );
                        break;

                    case "success":
                        SONDA_DB_Session.transaction(
                            tx => {
                                data.Consignments.map(consignment => {
                                    if (consignment.IS_POSTED === SiNo.Si) {
                                        var sql = "UPDATE CONSIGNMENT_HEADER";
                                        sql += " SET IS_POSTED = 2";
                                        sql +=
                                            " ,CONSIGNMENT_BO_NUM = " + consignment.CONSIGNMENT_ID;
                                        sql += " ,DUE_DATE = '" + consignment.DUE_DATE + "' ";
                                        sql +=
                                            " WHERE DOC_SERIE = '" +
                                            consignment.DOC_SERIE +
                                            "' AND DOC_NUM = " +
                                            consignment.DOC_NUM;
                                        tx.executeSql(sql);

                                        sql = "";
                                        sql =
                                            "UPDATE INVOICE_HEADER SET CONSIGNMENT_ID = " +
                                            consignment.CONSIGNMENT_ID;
                                        sql +=
                                            " WHERE INVOICE_NUM = (SELECT INVOICE_NUM FROM CONSIGNMENT_HEADER WHERE DOC_SERIE = '" +
                                            consignment.DOC_SERIE +
                                            "' AND DOC_NUM = " +
                                            consignment.DOC_NUM +
                                            ")";
                                        tx.executeSql(sql);
                                    }
                                });
                            },
                            err => {
                                ToastThis(err.message);
                            }
                        );
                        break;
                }
            });

            socketIo.on("SendConsignmentPaidResponse", data => {
                switch (data.option) {
                    case "completed":
                        ActualizarConsignaciones(data.consignaciones);
                        break;
                    case "fail":
                        notify("Error al enviar consignaciones pagadas: " + data.error);
                        break;
                }
            });

            socketIo.on("SendDevolutionInventoryDocumentsResponse", data => {
                switch (data.option) {
                    case "fail":
                        ToastThis(data.error);
                        break;
                    case "insertHeaderComplete":
                        var id = data.ID;
                        var documento = data.documento;
                        // ReSharper disable once CoercedEqualsUsing
                        var existiaDocumentoEnServidor =
                            data.documentoYaExistiaEnServidor == 1 ? true : false;

                        RecogerProductoEnConsignacionServicio.ActualizarEstadoDePosteoDeDocumentoDeDevolucionDeInventario(
                            documento,
                            id,
                            documento2 => {
                                try {
                                    var sql = "";
                                    if (!existiaDocumentoEnServidor) {
                                        SONDA_DB_Session.transaction(
                                            tx => {
                                                for (
                                                    let i = 0;
                                                    i < documento2.DEVOLUTION_DETAIL.length;
                                                    i++
                                                ) {
                                                    let sku = documento2.DEVOLUTION_DETAIL[i];
                                                    if (parseInt(sku.IS_GOOD_STATE) === 1) {
                                                        sql =
                                                            "UPDATE SKUS SET ON_HAND = ON_HAND + (" +
                                                            parseInt(sku.QTY_SKU) +
                                                            ") WHERE SKU = '" +
                                                            sku.CODE_SKU +
                                                            "'";
                                                        tx.executeSql(sql);

                                                        if (sku.HANDLE_SERIAL === 1) {
                                                            sql =
                                                                "INSERT INTO SKU_SERIES(" +
                                                                "SKU," +
                                                                "SERIE," +
                                                                "STATUS," +
                                                                "LOADED_LAST_UPDATED)" +
                                                                "VALUES('" +
                                                                sku.CODE_SKU +
                                                                "', '" +
                                                                sku.SERIAL_NUMBER +
                                                                "',0,'" +
                                                                getDateTime().toString() +
                                                                "')";
                                                            tx.executeSql(sql);
                                                        }
                                                    }
                                                }
                                            },
                                            err => {
                                                if (err.code !== 0) {
                                                    notify(
                                                        "No se pudieron agregar los SKU(s) Recogidos de Consignación al Inventario Móvil debido a:" +
                                                        err.message
                                                    );
                                                }
                                            }
                                        );
                                    }
                                } catch (e) {
                                    notify(e.message);
                                }
                            }
                        );
                        break;
                }
            });

            socketIo.on("InsertTraceabilityConsignmentsResponse", data => {
                switch (data.option) {
                    case "fail":
                        notify(data.error);
                        break;
                    case "success":
                        var registro = data.documento;
                        PagoConsignacionesServicio.ActualizarEstadoDePosteoDeTrazabilidadDeConsignaciones(
                            registro,
                            error => {
                                notify(error);
                            }
                        );
                        registro = null;
                        break;
                }
            });

            socketIo.on("SendTaskResponse", data => {
                _enviandoTareas = false;
                switch (data.option) {
                    case "fail":
                        notify(data.error);
                        break;
                    case "success":
                        MarcarTareaComoSincronizada(data.tareas, error => {
                            notify(error);
                        });

                        break;
                }
            });

            socketIo.on("SendConsignmentVoidResponse", data => {
                switch (data.option) {
                    case "fail":
                        notify(data.error);
                        break;
                    case "success":
                        MarcarConsignacionAnuladaComoSincronizada(
                            data.consignacion,
                            error => {
                                notify(error);
                            }
                        );
                        break;
                }
            });

            socketIo.on("SendBusinessRivalPoll_Request", data => {
                switch (data.option) {
                    case "receive":
                        EncuestaServicio.MarcarEncuestaDeCompraDeCompetenciaComoEnviada(
                            data.data,
                            1,
                            () => { },
                            err => {
                                notify(
                                    "2-Error al enviar encuesta de compra de competencia: " +
                                    err.message
                                );
                            }
                        );
                        break;
                    case "success":
                        EncuestaServicio.MarcarEncuestaDeCompraDeCompetenciaComoEnviada(
                            data.data,
                            2,
                            () => { },
                            err => {
                                notify(
                                    "3-Error al enviar encuesta de compra de competencia: " +
                                    err.message
                                );
                            }
                        );
                        break;
                    case "fail":
                        notify(
                            "1-Error al enviar encuesta de compra de competencia: " +
                            data.message
                        );
                        break;
                }
            });

            socketIo.on(
                "ValidateInvoices_Request" + TipoDeValidacionDeFactura.EnRuta,
                data => {
                    switch (data.option) {
                        case OpcionRespuesta.Exito:
                            break;
                        case OpcionRespuesta.Error:
                            CambiarEstadoParaReenviarFacturas(
                                data.reenviarFacturas,
                                () => {
                                    _enviandoValidacionDeFacturas = false;
                                    setTimeout(
                                        EnviarValidacionDeFactura(() => { }, err => { }),
                                        100
                                    );
                                },
                                err => { }
                            );
                            break;
                    }
                }
            );

            socketIo.on("PostInvoiceReceive", data => {
                ActualizarEnvioDeFactura(
                    data,
                    dataN1 => { },
                    err => {
                        ToastThis(err.message);
                    }
                );
            });

            socketIo.on("PostInvoiceReceiveCompleted", data => {
                FinalizarEnvioFactura(
                    data,
                    dataN1 => { },
                    err => {
                        ToastThis(err.message);
                    }
                );
            });

            socketIo.on("PostInvoiceFail", data => {
                notify(
                    `Error al crear la factura en el servidor: ${data.message.message}`
                );
            });

            socketIo.on(
                "ValidateScoutingsPOS_Request" + TipoDeValidacionDeCliente.EnRuta,
                data => {
                    switch (data.option) {
                        case OpcionRespuesta.Exito:
                            break;
                        case OpcionRespuesta.Error:
                            let clienteServicio = new ClienteServicio();
                            clienteServicio.cambiarEstadoAClientesParaReenviar(
                                data.reenviarScoutings,
                                () => {
                                    _enviandoValidacionDeClientes = false;
                                    EnviarData();
                                },
                                resultado => {
                                    notify(
                                        "Error al intentar enviar nuevamente los clientes debido a: " +
                                        resultado.mensaje
                                    );
                                }
                            );
                            break;
                    }
                }
            );

            //--------- Notas De Entrega ----------

            socketIo.on("InsertDeliveryNotesFromSondaSd_Response", data => {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var notaDeEntregaServicio = new NotaDeEntregaServicio();
                        notaDeEntregaServicio.marcarNotasDeEntregaComoPosteadasEnElServidor(
                            data.deliveryNotes
                        );
                        break;
                }
            });

            //-------------------------------------

            //--------- Entregas Canceladas ----------

            socketIo.on("InsertCanceledDeliveryFromSondaSd_Response", data => {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var entregaServicio = new EntregaServicio();
                        entregaServicio.marcarEntregaCanceladaComoPosteadasEnElServidor(
                            data.deliveriesCanceled
                        );
                        break;
                }
            });

            //-------------------------------------
            //--------- Entregas Canceladas ----------

            socketIo.on("InsertPickingDemandByTaskFromSondaSd_Response", data => {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var entregaServicio = new EntregaServicio();
                        entregaServicio.marcarDemandasDeDespachoPorTareaComoPosteadasEnElServidor(
                            data.demandasDespachoPorTarea
                        );
                        break;
                }
            });

            //-------------------------------------

            //--------- Notas De Entrega Anuladas ----------

            socketIo.on("InsertDeliveryNoteCanceledFromSondaSd_Response", data => {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var notaDeEntregaServicio = new NotaDeEntregaServicio();
                        notaDeEntregaServicio.marcarNotasDeEntregaAnuladaComoPosteadasEnElServidor(
                            data.data.notasDeEntrega
                        );
                        break;
                }
            });

            //-------------------------------------
        }

        socketIo.on("AddOverdueInvoicePaymentResponse",
            (data) => {
                switch (data.option) {
                    case "success":
                        let pagoServicio = new PagoServicio();
                        pagoServicio.marcarDocumentosDePagoComoPosteadosEnElServidor(data.recordsets);
                        pagoServicio = null;
                        break;
                    case "fail":
                        notify(`Error al postear documentos de pago de facturas vencidas en el servidor debido a: ${data.message}`);
                        break;
                }
            });
    }
}
function UsuarioFacturaEnRuta(data) {
    return data.INVOICE_IN_ROUTE == SiNo.Si;
}
