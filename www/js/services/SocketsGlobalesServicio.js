var SocketsGlobalesServicio = (function() {
    function SocketsGlobalesServicio() {
        this.unidadDeMedidaServicio = new UnidadDeMedidaServicio();
        this.estadisticaDeVentaServicio = new EstadisticaDeVentaServicio();
    }
    SocketsGlobalesServicio.prototype.delegarSocketsGlobales = function(socketIo) {
        var _this_1 = this;
        socketIo.on("broadcast_receive", function(data) {
            navigator.geolocation.getCurrentPosition(function(position) {
                gCurrentGPS = position.coords.latitude + "," + position.coords.longitude;
                socketIo.emit("broadcast_response", {
                    sockeit: socketIo.id,
                    gps: gCurrentGPS,
                    "message:": "OK",
                    routeid: gCurrentRoute,
                    loginid: gLastLogin
                });
            }, function(error) {
                socketIo.emit("broadcast_response", {
                    sockeit: socketIo.id,
                    gps: "0,0",
                    "message:": error,
                    routeid: gCurrentRoute,
                    loginid: gLastLogin
                });
            }, { timeout: 30000, enableHighAccuracy: true });
        });
        socketIo.on("set_basic_invoice_info", function(data) {
            $("#lblRemoteInvoice_NIT").text(data.rows[0].CDF_NIT);
            $("#lblRemoteInvoice_Nombre").text(data.rows[0].CDF_NOMBRECLIENTE);
            $("#lblRemoteInvoice_Monto").text("Q " + format_number(data.rows[0].TOTAL_AMOUNT, 2));
            $("#lblRemoteInvoice_FechaHora").text(data.rows[0].INVOICED_DATETIME);
        });
        socketIo.on("finish_route_completed", function(data) {
            finalizarRuta(function() {
                initlocalstorage();
                window.localStorage.removeItem("POS_STATUS");
                var countCloseInterval = 0;
                var closeInterval = setInterval(function() {
                    countCloseInterval++;
                    if (countCloseInterval == 3) {
                        my_dialog("", "", "close");
                        notify("Ruta Finalizada.");
                        clearInterval(closeInterval);
                        navigator.app.exitApp();
                    }
                }, 1000);
            }, function(err) {
                notify("No se pudo finalizar la Ruta debido al siguiente error: " +
                    err.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            });
        });
        socketIo.on("finish_route_error", function(data) {
            notify("Error al finalizar ruta: " + data.error);
            InteraccionConUsuarioServicio.desbloquearPantalla();
        });
        socketIo.on("UpdateStatusInvoice_Request_Complete", function(data) {
            ProcessVoidInvoice(data.invoiceid, data.reason, data.reason, data.paidconsignment, data.imgconsignment, 2);
        });
        socketIo.on("UpdateStatusInvoice_Request_Fail", function(data) {
            notify(data.error);
            my_dialog("", "", "close");
        });
        socketIo.on("invalid_credentials", function(data) {
            notify("Usuario o Password invalido");
        });
        socketIo.on("welcome_to_sonda", function(data) {
            my_dialog("", "", "close");
            gCurrentRoute = data.routeid;
            gLastLogin = pUserID;
            gDefaultWhs = data.default_warehouse;
            gdbuser = data.dbuser;
            gdbuserpass = data.dbuserpass;
            gRouteReturnWarehouse = data.route_return_warehouse;
            localStorage.setItem("user_type", data.user_type);
            UpdateLoginInfo("set");
            if (gIsOnline == EstaEnLinea.Si) {
                GetBankAccounts();
                GetVoidReasons();
            }
            $("#lblCurrentWarehouse").text(gDefaultWhs);
            setTimeout(function() {
                socketIo.emit("GetPosTaxParameters", data);
            }, 3000);
        });
        socketIo.on("GetPosTaxParametersResponse", function(data) {
            switch (data.option) {
                case "GetPosTaxParametersFail":
                    notify("No se han podido obtener los parámetros de etiquetas para resolución de facturación, por favor, comuníquese con su administrador");
                    break;
                case "GetPosTaxParametersNotFound":
                    notify("No se han podido obtener los parámetros de etiquetas para resolución de facturación, por favor, comuníquese con su administrador");
                    break;
                case "GetPosTaxParametersFound":
                    if (data.parameters) {
                        data.parameters.map(function(parameter, i) {
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
        socketIo.on("ValidateRoute_success", function(data) {
            try {
                GetRouteAuth("FACTURA");
            } catch (err) {
                notify("ValidateRoute.catch:" + err.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        });
        socketIo.on("ValidateRoute_fail", function(data) {
            try {
                if (!data.message) {
                    notify("No se puede iniciar ruta por: " + data.message);
                }
                InteraccionConUsuarioServicio.desbloquearPantalla();
            } catch (err) {
                notify("ValidateRoute.catch:" + err.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        });
        socketIo.on("ValidateRoute_error", function(data) {
            try {
                notify("Error al intentar iniciar ruta: " + data.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            } catch (err) {
                notify("ValidateRoute.catch:" + err.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        });
        socketIo.on("GetInitialRouteSend", function(data) {
            try {
                var cuentaCorrienteServicio = new CuentaCorrienteServicio();
                switch (data.option) {
                    case "fail":
                        ToastThis("Error al iniciar ruta: " + data.error);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
                    case "error_message":
                        ToastThis("Error al iniciar ruta: " + data.message);
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        break;
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
                        SONDA_DB_Session.transaction(function(tx) {
                            var pSql = "DELETE FROM SKUS WHERE SKU = '" + data.row.SKU + "'";
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
                                (data.row.CODE_PACK_UNIT_STOCK ?
                                    "'" + data.row.CODE_PACK_UNIT_STOCK + "'" :
                                    null) +
                                ", '" +
                                data.row.SALES_PACK_UNIT +
                                "')";
                            console.log("Inserting SKU: " + pSql);
                            tx.executeSql(pSql);
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
                        }, function(err) {
                            my_dialog("", "", "close");
                            notify(err.message);
                        });
                        break;
                    case "pos_skus_completed":
                        ToastThis(data.rowcount + " SKUs Cargados.");
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
                                    "','" +
                                    data.row.TASK_STATUS +
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
                    case "get_tasks_completed":
                        GetPriceLists();
                        try {
                            $("#skus_listview_sales_route").listview("refresh");
                        } catch (e) {
                            $("#skus_listview_sales_route")
                                .listview()
                                .listview("refresh");
                        }
                        var clientscount = $("#skus_listview_sales_route li").size();
                        $("#lblClientsToVisit").text("Plan de ruta (" + clientscount + ")");
                        break;
                    case "add_price_list_by_sku":
                        addPriceListBySckuPackScale(data.row);
                        break;
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
                        reglaServicio.limpiarTabla(function(e) {
                            notify(e.message);
                        });
                        reglaServicio = null;
                        break;
                    case "no_get_rules_found":
                        notify("No se encontraron reglas para la ruta");
                        break;
                    case "add_to_rule":
                        var reglaServicio2 = new ReglaServicio();
                        reglaServicio2.guardarReglas(data.row, function() {}, function(err) {
                            notify(err.message);
                        });
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
                        ToastThis("No se encontraron Secuencias de Documentos para la Ruta actual, por favor, comuníquese con su Administrador de Sonda");
                        break;
                    case "GetDocumentSequence_AddDocument":
                        AperturaDeCajaServicio.AgregarSecuenciaDeDocumento(data.row);
                        if (data.row.DOC_TYPE === "ONLINE_INVOICE") {
                            var menuControlador_1 = new MenuControlador();
                            menuControlador_1.cargarInformacionFel(localStorage.getItem("user_type"), function(display, implementaFel, secuenciaDocumento) {
                                menuControlador_1.seValidoCorrectamente(display, secuenciaDocumento);
                            }, function(error) {
                                notify("No se pudo validar si usar\u00E1 FEL debido a: " + error.mensaje);
                            });
                        }
                        break;
                    case "GetInitialRouteComplete":
                        localStorage.setItem("POS_STATUS", "OPEN");
                        localStorage.setItem("POS_DATE", getDateTime());
                        my_dialog("", "", "close");
                        ShowHideOptions();
                        var tiempoEsperaCambioDePantalla = setTimeout(function() {
                            $.mobile.changePage("#menu_page", {
                                transition: "flow",
                                reverse: true,
                                showLoadMsg: false
                            });
                            clearTimeout(tiempoEsperaCambioDePantalla);
                        }, 3000);
                        break;
                    case "requested_serie":
                        my_dialog("Series", "obteniendo series...", "open");
                        break;
                    case "add_to_series":
                        SONDA_DB_Session.transaction(function(tx) {
                            var pSql = "";
                            pSql = "DELETE FROM SKU_SERIES WHERE SKU = '" + data.row.SKU + "' AND SERIE = '" + data.row.SKU_SERIE + "'";
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
                        }, function(err) {
                            my_dialog("", "", "close");
                            notify(err.message);
                        });
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
                        ToastThis("No se han podido obtener las etiquetas para clientes debido a: " +
                            data.error);
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
                            ToastThis("Información de impuesto de artículos cargada exitosamente");
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
                        _this_1.unidadDeMedidaServicio.agregarUnidadDeMedida(data.row);
                        break;
                    case "GetPackConversion_AddPackConversion":
                        _this_1.unidadDeMedidaServicio.agregarPaqueteDeConversion(data.row);
                        break;
                    case "statistics_not_found":
                        notify("No se encontraron las estadisticas de venta.");
                        break;
                    case "add_statistic":
                        _this_1.estadisticaDeVentaServicio.agregarEstadisticaDeVenta(data.row);
                        break;
                    case "add_statistic_costumer":
                        _this_1.estadisticaDeVentaServicio.agregarEstadisticaDeVentaPorCliente(data.row);
                        break;
                    case "add_phrase_and_stage":
                        facturacionElectronicaServicio.agregarFraseEscenario(data.row);
                        break;
                }
            } catch (es) {
                notify("GetInitialRouteSend.catch:" + es.message);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
        });
        socketIo.on("post_invoice_completed", function(data) {
            my_dialog("", "", "close");
            var pInvoiceID = data.invoiceid;
            SONDA_DB_Session.transaction(function(tx) {
                var pSQL = "UPDATE INVOICE_HEADER SET IS_POSTED = 1 WHERE INVOICE_NUM = " +
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
        socketIo.on("post_invoice_offline_received", function(data) {
            try {
                ToastThis("Procesando offline...");
            } catch (e) {
                notify("Procesando offline... ERROR, ");
            }
        });
        socketIo.on("post_invoice_offline_failed", function(data) {
            try {
                notify("post_invoice_offline_failed:" + data.msg);
            } catch (e) {
                notify("post_invoice_offline_failed ERROR, ");
            }
        });
        socketIo.on("post_invoice_offline_completed", function(data) {
            my_dialog("", "", "close");
            var pInvoiceID = data.invoiceid;
            SONDA_DB_Session.transaction(function(tx) {
                var pSQL = "UPDATE INVOICE_HEADER SET IS_POSTED = 1 WHERE INVOICE_NUM = " +
                    pInvoiceID;
                tx.executeSql(pSQL);
                pSQL = "SELECT * FROM INVOICE_HEADER WHERE INVOICE_NUM = " + pInvoiceID;
                tx.executeSql(pSQL, [], function(tx2, results) {
                    UploadPhoto(data.invoiceid, data.autid, data.autserie, results.rows.item(0).IMG1, 1);
                    UploadPhoto(data.invoiceid, data.autid, data.autserie, results.rows.item(0).IMG2, 2);
                    UploadPhoto(data.invoiceid, data.autid, data.autserie, results.rows.item(0).IMG3, 3);
                }, function(tx2, err) {
                    my_dialog("", "", "close");
                    if (err.code != 0) {
                        alert("Error processing SQL: " + err.code);
                    }
                });
                tx.executeSql(pSQL);
            });
            listallinvoices();
        });
        socketIo.on("void_invoice_completed", function(data) {
            my_dialog("", "", "close");
            localStorage.setItem("POS_CURRENT_CREDIT_NOTE", (Number(pCurrentNoteID) - 1).toString());
            pCurrentNoteID = localStorage.getItem("POS_CURRENT_CREDIT_NOTE");
        });
        socketIo.on("add_to_auth", function(data) {
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
                        localStorage.setItem("direccionFacturacion01", data.row.AUTH_BRANCH_ADDRESS);
                        if (data.row.BRANCH_ADDRESS2 === null) {
                            $("#lblBranchAddress2").text("");
                            $("#branchAddress2").css("display", "none");
                            localStorage.setItem("direccionFacturacion02", "");
                        } else {
                            $("#lblBranchAddress2").text(data.row.BRANCH_ADDRESS2);
                            $("#branchAddress2").css("display", "block");
                            localStorage.setItem("direccionFacturacion02", data.row.BRANCH_ADDRESS2);
                        }
                        if (data.row.BRANCH_ADDRESS3 === null) {
                            $("#lblBranchAddress3").text("");
                            $("#branchAddress3").css("display", "none");
                            localStorage.setItem("direccionFacturacion03", "");
                        } else {
                            $("#lblBranchAddress3").text(data.row.BRANCH_ADDRESS3);
                            $("#branchAddress3").css("display", "block");
                            localStorage.setItem("direccionFacturacion03", data.row.BRANCH_ADDRESS3);
                        }
                        if (data.row.BRANCH_ADDRESS4 === null) {
                            $("#lblBranchAddress4").text("");
                            $("#branchAddress4").css("display", "none");
                            localStorage.setItem("direccionFacturacion04", "");
                        } else {
                            $("#lblBranchAddress4").text(data.row.BRANCH_ADDRESS4);
                            $("#branchAddress4").css("display", "block");
                            localStorage.setItem("direccionFacturacion04", data.row.BRANCH_ADDRESS4);
                        }
                        if (data.row.ENTERPRISE_EMAIL_ADDRESS === null) {
                            $("#lblbranchEmail").text("");
                            $("#branchEmail").css("display", "none");
                            localStorage.setItem("correoElectronicoEmpresa", "");
                        } else {
                            $("#lblbranchEmail").text(data.row.ENTERPRISE_EMAIL_ADDRESS);
                            $("#branchEmail").css("display", "block");
                            localStorage.setItem("correoElectronicoEmpresa", data.row.ENTERPRISE_EMAIL_ADDRESS);
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
                        localStorage.setItem("FEL_DOCUMENT_TYPE", data.row.FEL_DOCUMENT_TYPE);
                        localStorage.setItem("FEL_STABLISHMENT_CODE", data.row.FEL_STABLISHMENT_CODE);
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
                        localStorage.setItem("correoElectronicoEmpresa", data.row.ENTERPRISE_EMAIL_ADDRESS);
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
        socketIo.on("auth_not_found", function(data) {
            my_dialog("", "", "close");
            notify("ERROR, No hay autorizacion disponible para facturar.");
        });
        socketIo.on("auth_found", function(data) {
            my_dialog("", "", "close");
            data = {
                routeid: gCurrentRoute,
                dbuser: gdbuser,
                dbuserpass: gdbuserpass,
                inLogin: true
            };
            socketIo.emit("GetDeliveryParameter", data);
        });
        socketIo.on("getroute_inv_completed", function(data) {
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
        socketIo.on("requested_getalertlimit", function(data) {
            SONDA_DB_Session.transaction(function(tx) {
                localStorage.setItem("ALERT_LIMIT", "0");
                localStorage.setItem("ALERT_MESSAGE", "");
            }, function(err) {
                my_dialog("", "", "close");
                notify(err.code.toString());
            });
        });
        socketIo.on("add_to_getalertlimit", function(data) {
            SONDA_DB_Session.transaction(function(tx) {
                localStorage.setItem("ALERT_LIMIT", data.row.ALERT_PERC);
                localStorage.setItem("ALERT_MESSAGE", data.row.ALERT_MESSAGE);
            }, function(err) {
                my_dialog("", "", "close");
                notify(err.message);
            });
        });
        socketIo.on("getalertlimit_completed", function(data) {
            my_dialog("", "", "close");
        });
        socketIo.on("add_to_bank_accounts", function(data) {
            SONDA_DB_Session.transaction(function(tx) {
                var pSql = "INSERT INTO BANK_ACCOUNTS(BANK, ACCOUNT_BASE, ACCOUNT_NAME, ACCOUNT_NUMBER) VALUES('" +
                    data.row.ACCOUNT_BANK +
                    "','" +
                    data.row.ACCOUNT_BASE +
                    "','" +
                    data.row.ACCOUNT_NAME +
                    "','" +
                    data.row.ACCOUNT_NUMBER +
                    "')";
                tx.executeSql(pSql);
            }, function(err) {
                my_dialog("", "", "close");
                notify(err.message);
            });
        });
        socketIo.on("requested_void_reasons", function(data) {
            gVoidReasons = [];
        });
        socketIo.on("add_to_void_reasons", function(data) {
            SONDA_DB_Session.transaction(function(tx) {
                var pSQL = "INSERT INTO VOID_REASONS(REASON_ID, REASON_DESCRIPTION) VALUES('" +
                    data.row.REASON_ID +
                    "','" +
                    data.row.REASON_DESCRIPTION +
                    "')";
                tx.executeSql(pSQL);
            }, function(err) {
                my_dialog("", "", "close");
                notify(err.message);
            });
        });
        socketIo.on("void_reasons_completed", function(data) {
            my_dialog("", "", "close");
            GetAlertLimit(data.data);
        });
        socketIo.on("SendResolution_Request", function(data) {
            switch (data.request) {
                case "SendInvoice":
                    switch (data.option) {
                        case "success":
                            ObtenerBroadcastPerdidos();
                            break;
                        case "fail":
                            ObtenerBroadcastPerdidos();
                            var message = data.error.precedingErrors[0].message;
                            var message2 = message.substring(0, 54);
                            //var newCorrelative = message.substring(56, message.length);
                            if (message2 == ' No se puede actualizar el corelativo a un valor menor') {
                                InteraccionConUsuarioServicio.bloquearPantalla();
                                navigator.notification.confirm("Tu numero de secuencia está desactualizado debido a que se realizaron ordenes de venta con esta misma ruta en otro dispositivo, el valor actual es: " + localStorage.getItem('POS_CURRENT_INVOICE_ID') + ', vuelve a iniciar ruta para actualizar', function(buttonIndex) {
                                    if (buttonIndex === 1 || buttonIndex === 0) {
                                        console.log('si')
                                        OnConfirmFinishPOS(2);
                                    }
                                }, "Sonda\u00AE Ruta " + SondaVersion, ["ok"]);
                                break;
                            } else {
                                notify("Error al intentar actualizar la resoluci\u00F3n. " + (data.error.message === undefined ? "" : data.error.message));
                                break;
                            }

                    }
                    break;
                case "CloseBox":
                    switch (data.option) {
                        case "success":
                            OnConfirmFinishPOS(2);
                            break;
                        case "fail":
                            notify("Error al intentar cerrar la ruta. " + (data.error.message === undefined ? "" : data.error.message));
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            break;
                    }
                    break;
            }
        });
        socketIo.on("post_deposit_completed", function(data) {
            my_dialog("", "", "close");
            if (!isNaN(data.pResult)) {
                if (!isNaN(data.pResult)) {
                    SONDA_DB_Session.transaction(function(tx) {
                        var pSQL = "UPDATE DEPOSITS SET IS_POSTED = 1 WHERE TRANS_ID = " +
                            data.transid;
                        tx.executeSql(pSQL);
                    });
                }
            } else {
                notify("Error al crear el deposito en el servidor debido a: " + data.pResult);
                InteraccionConUsuarioServicio.desbloquearPantalla();
            }
            $.mobile.changePage("#menu_page", {
                transition: "slide",
                reverse: false,
                showLoadMsg: false
            });
        });
        socketIo.on("post_deposit_offline_completed", function(data) {
            var pTransID = data.transid;
            var pResult = data.pResult;
            SONDA_DB_Session.transaction(function(tx) {
                var pSQL = "UPDATE DEPOSITS SET IS_POSTED = 1 WHERE TRANS_ID = " + pTransID;
                tx.executeSql(pSQL);
                pSQL = "SELECT * FROM DEPOSITS WHERE TRANS_ID = " + pTransID;
                tx.executeSql(pSQL, [], function(tx, results) {
                    UploadPhotoDeposit(pResult, results.rows.item(0).IMG1);
                }, function(trans, err) {
                    my_dialog("", "", "close");
                    if (err.code !== 0) {
                        alert("Error processing SQL: " + err.code);
                    }
                });
            });
            listalldeposits();
        });
        socketIo.on("SendReturnSku_Request", function(data) {
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
        socketIo.on("ValidateRouteReturn_Request", function(data) {
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
        }); {
            socketIo.on("InsertScoutingFromSondaPosResponse", function(data) {
                switch (data.option) {
                    case "fail":
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify("Error al sincronizar scouting debido a: " + data.message);
                        break;
                    case "success":
                        var clienteServicio = new ClienteServicio();
                        clienteServicio.marcarClienteComoSincronizado(data.clients, function() {
                            EnviarValidacionDeClientes();
                        }, function(resultado) {
                            InteraccionConUsuarioServicio.desbloquearPantalla();
                            notify("Error al actualizar la sincronización de clientes debido a: " +
                                resultado.mensaje);
                        });
                        break;
                }
            });
            socketIo.on("ConsignmentReceiveComplete", function(data) {
                switch (data.option) {
                    case "fail":
                        notify("Error al crear la consignaci\u00F3n en el servidor: " + data.error);
                        break;
                    case "success":
                        SONDA_DB_Session.transaction(function(tx) {
                            data.Consignments.map(function(consignment) {
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
                        }, function(err) {
                            ToastThis(err.message);
                        });
                        break;
                }
            });
            socketIo.on("SendConsignmentPaidResponse", function(data) {
                switch (data.option) {
                    case "completed":
                        ActualizarConsignaciones(data.consignaciones);
                        break;
                    case "fail":
                        notify("Error al enviar consignaciones pagadas: " + data.error);
                        break;
                }
            });
            socketIo.on("SendDevolutionInventoryDocumentsResponse", function(data) {
                switch (data.option) {
                    case "fail":
                        ToastThis(data.error);
                        break;
                    case "insertHeaderComplete":
                        var id = data.ID;
                        var documento = data.documento;
                        var existiaDocumentoEnServidor = data.documentoYaExistiaEnServidor == 1 ? true : false;
                        RecogerProductoEnConsignacionServicio.ActualizarEstadoDePosteoDeDocumentoDeDevolucionDeInventario(documento, id, function(documento2) {
                            try {
                                var sql = "";
                                if (!existiaDocumentoEnServidor) {
                                    SONDA_DB_Session.transaction(function(tx) {
                                        for (var i = 0; i < documento2.DEVOLUTION_DETAIL.length; i++) {
                                            var sku = documento2.DEVOLUTION_DETAIL[i];
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
                                    }, function(err) {
                                        if (err.code !== 0) {
                                            notify("No se pudieron agregar los SKU(s) Recogidos de Consignación al Inventario Móvil debido a:" +
                                                err.message);
                                        }
                                    });
                                }
                            } catch (e) {
                                notify(e.message);
                            }
                        });
                        break;
                }
            });
            socketIo.on("InsertTraceabilityConsignmentsResponse", function(data) {
                switch (data.option) {
                    case "fail":
                        notify(data.error);
                        break;
                    case "success":
                        var registro = data.documento;
                        PagoConsignacionesServicio.ActualizarEstadoDePosteoDeTrazabilidadDeConsignaciones(registro, function(error) {
                            notify(error);
                        });
                        registro = null;
                        break;
                }
            });
            socketIo.on("SendTaskResponse", function(data) {
                _enviandoTareas = false;
                switch (data.option) {
                    case "fail":
                        notify(data.error);
                        break;
                    case "success":
                        MarcarTareaComoSincronizada(data.tareas, function(error) {
                            notify(error);
                        });
                        break;
                }
            });
            socketIo.on("SendConsignmentVoidResponse", function(data) {
                switch (data.option) {
                    case "fail":
                        notify(data.error);
                        break;
                    case "success":
                        MarcarConsignacionAnuladaComoSincronizada(data.consignacion, function(error) {
                            notify(error);
                        });
                        break;
                }
            });
            socketIo.on("SendBusinessRivalPoll_Request", function(data) {
                switch (data.option) {
                    case "receive":
                        EncuestaServicio.MarcarEncuestaDeCompraDeCompetenciaComoEnviada(data.data, 1, function() {}, function(err) {
                            notify("2-Error al enviar encuesta de compra de competencia: " +
                                err.message);
                        });
                        break;
                    case "success":
                        EncuestaServicio.MarcarEncuestaDeCompraDeCompetenciaComoEnviada(data.data, 2, function() {}, function(err) {
                            notify("3-Error al enviar encuesta de compra de competencia: " +
                                err.message);
                        });
                        break;
                    case "fail":
                        notify("1-Error al enviar encuesta de compra de competencia: " +
                            data.message);
                        break;
                }
            });
            socketIo.on("ValidateInvoices_Request" + TipoDeValidacionDeFactura.EnRuta, function(data) {
                switch (data.option) {
                    case OpcionRespuesta.Exito:
                        break;
                    case OpcionRespuesta.Error:
                        CambiarEstadoParaReenviarFacturas(data.reenviarFacturas, function() {
                            _enviandoValidacionDeFacturas = false;
                            setTimeout(EnviarValidacionDeFactura(function() {}, function(err) {}), 100);
                        }, function(err) {});
                        break;
                }
            });
            socketIo.on("PostInvoiceReceive", function(data) {
                ActualizarEnvioDeFactura(data, function(dataN1) {}, function(err) {
                    ToastThis(err.message);
                });
            });
            socketIo.on("PostInvoiceReceiveCompleted", function(data) {
                FinalizarEnvioFactura(data, function(dataN1) {}, function(err) {
                    ToastThis(err.message);
                });
            });
            socketIo.on("PostInvoiceFail", function(data) {
                var message = data.message.message;
                var message2 = message.substring(0, 23);

                if (message2 == 'Violation of UNIQUE KEY') {
                    //notify("Hay un problema con el correlativo de tu factura y no se pudo enviar al servidor, el ID de tu factura es: " + data.InvoiceId);
                } else {
                    notify("Error al crear la factura en el servidor: " + data.message.message);
                }
                //notify("Error al crear la factura en el servidor: " + data.message.message);
            });
            socketIo.on("ValidateScoutingsPOS_Request" + TipoDeValidacionDeCliente.EnRuta, function(data) {
                switch (data.option) {
                    case OpcionRespuesta.Exito:
                        break;
                    case OpcionRespuesta.Error:
                        var clienteServicio = new ClienteServicio();
                        clienteServicio.cambiarEstadoAClientesParaReenviar(data.reenviarScoutings, function() {
                            _enviandoValidacionDeClientes = false;
                            EnviarData();
                        }, function(resultado) {
                            notify("Error al intentar enviar nuevamente los clientes debido a: " +
                                resultado.mensaje);
                        });
                        break;
                }
            });
            socketIo.on("InsertDeliveryNotesFromSondaSd_Response", function(data) {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var notaDeEntregaServicio = new NotaDeEntregaServicio();
                        notaDeEntregaServicio.marcarNotasDeEntregaComoPosteadasEnElServidor(data.deliveryNotes);
                        break;
                }
            });
            socketIo.on("InsertCanceledDeliveryFromSondaSd_Response", function(data) {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var entregaServicio = new EntregaServicio();
                        entregaServicio.marcarEntregaCanceladaComoPosteadasEnElServidor(data.deliveriesCanceled);
                        break;
                }
            });
            socketIo.on("InsertPickingDemandByTaskFromSondaSd_Response", function(data) {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var entregaServicio = new EntregaServicio();
                        entregaServicio.marcarDemandasDeDespachoPorTareaComoPosteadasEnElServidor(data.demandasDespachoPorTarea);
                        break;
                }
            });
            socketIo.on("InsertDeliveryNoteCanceledFromSondaSd_Response", function(data) {
                switch (data.option) {
                    case "fail":
                        notify(data.message);
                        break;
                    case "success":
                        var notaDeEntregaServicio = new NotaDeEntregaServicio();
                        notaDeEntregaServicio.marcarNotasDeEntregaAnuladaComoPosteadasEnElServidor(data.data.notasDeEntrega);
                        break;
                }
            });
        }
        socketIo.on("AddOverdueInvoicePaymentResponse", function(data) {
            switch (data.option) {
                case "success":
                    var pagoServicio = new PagoServicio();
                    pagoServicio.marcarDocumentosDePagoComoPosteadosEnElServidor(data.recordsets);
                    pagoServicio = null;
                    break;
                case "fail":
                    notify("Error al postear documentos de pago de facturas vencidas en el servidor debido a: " + data.message);
                    break;
            }
        });
    };
    return SocketsGlobalesServicio;
}());

function UsuarioFacturaEnRuta(data) {
    return data.INVOICE_IN_ROUTE == SiNo.Si;
}
//# sourceMappingURL=SocketsGlobalesServicio.js.map