
//------------- DELEGADO -----------------------------
function delegarTareaFueraDeRutaControlador() {

    $("#UiBtnVolverAMenuNuevaTarea").on("click",
        function() {
            $.mobile.changePage("#menu_page",
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
        });

    $("#uiBtnLimpiarFiltroClientesNuevaTarea").on("click",
        function() {
            limpiarFiltro();
        });

    $("#UiBotonCamaraClientesNuevaTarea").on("click",
        function() {
            LeerCodigoBarraConCamara(function(codigoLeido) {
                var uiTxtFiltroClientesAceptadas = $("#uiTxtFiltroClientesNuevaTarea");
                uiTxtFiltroClientesAceptadas.val(codigoLeido);
                if (codigoLeido !== "") {
                    obtenerClientesFueraDeRuta(gCurrentRoute, codigoLeido);
                }
            });
        });

    $("#uiTxtFiltroClientesNuevaTarea").on("keypress",
        function(e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                var txtFiltro = document.getElementById("uiTxtFiltroClientesNuevaTarea");
                if (txtFiltro.value === "") {
                    notify("Debe proporcionar un criterio de búsqueda...");
                    txtFiltro.focus();
                    txtFiltro = null;
                } else {
                    obtenerClientesFueraDeRuta(gCurrentRoute, txtFiltro.value.toString());
                }
            }
        });

    $("#UiNewTaskOutsideOfRoutePlanPage").on("click",
        "#uiListaClientesNuevaTarea li",
        function (event) {
            InteraccionConUsuarioServicio.bloquearPantalla();
            var clientId = event.currentTarget.attributes["id"].nodeValue;
            crearTarea(gCurrentRoute, clientId, "SALE");
        });
}

function delegarSocketsTareaFueraDeRutaControlador(socketIo) {
    socketIo.on('GetClientsForTaskOutsideTheRoutePlan_Response',
        function(data) {
            cargarClientes(data);
        });

    socketIo.on('CreateTaskOutsideTheRoutePlan_Response',
        function(data) {
            if (data.data && data.data.tarea) {
                var tarea = data.data.tarea;
                insertarTareaFueraDeRuta(data,
                    function(data) {
                        insertarListaDePreciosPorClienteFueraDeRuta(data,
                            data.data.cliente,
                            function(data) {
                                insertarListaDePreciosPorSkuFueraDeRuta(data,
                                    function(data) {
                                        insertarConsignaciones(data.data,
                                            data.data.consignaciones,
                                            data.data.detalleconsignaciones,
                                            function(originalData) {
                                                agregarInformacionDeFacturasVencidas(originalData,
                                                    function(dataProcess) {
                                                        agregarInformacionDeCuentaCorriente(dataProcess,
                                                            function() {
                                                                gTaskOnRoutePlan = 0;
                                                                InvoiceThisTask(tarea.TASK_ID,
                                                                    tarea.RELATED_CLIENT_CODE,
                                                                    tarea.RELATED_CLIENT_NAME,
                                                                    tarea.NIT,
                                                                    Tarea.TASK_TYPE);
                                                            });
                                                    });

                                            });
                                    });
                            });
                    });
            } else {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                console.log("Error al procesar la tarea fuera del plan de ruta en el servidor, fallo: ");
                console.dir(data);
                notify("Ha ocurrido un error al procesar la tarea fuera del plan de ruta, por favor, vuelva a intentar.");
            }
        });
}

//------------- FUNCIONES ----------------------------

function limpiarFiltro() {
    try {
        var txtFiltro = document.getElementById("uiTxtFiltroClientesNuevaTarea");
        txtFiltro.value = "";
        txtFiltro.focus();
        txtFiltro = null;
        var objetoListaDeClientes = $("#uiListaClientesNuevaTarea");
        objetoListaDeClientes.children().remove("li");
        objetoListaDeClientes = null;
        document.getElementById("UiContenedorListaDeClientesNuevaTarea").style.display = "none";
        document.getElementById("UiNotificacionClientesNuevaTarea").style.display = "none";
    }
    catch (e) {
        notify("No se ha podido limpiar el campo debido a: " + e.message);
    }
}


function LeerCodigoBarraConCamara(callback) {
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            if (result.text.length > 0) {
                callback(result.text);
            }
            else {
                alert("No se ha podido escanear");
                callback("");
            }
        },
        function (error) {
            alert("No se ha podido escanear debido a: " + error);
            callback("");
        }
    );
}

function obtenerClientesFueraDeRuta(ruta, filtro) {
    try {
        obtenerClientesFueraDeRutaBD(ruta, filtro);
    } catch (err) {
        notify("No se han podido buscar los clientes debido a:" + err.message);
    }
}

function cargarClientes(data) {
    try {
        my_dialog("Cargando...", "Cargando lista de Clientes, por favor, espere...", "open");
        var objetoListaDeClientes = $("#uiListaClientesNuevaTarea");
        objetoListaDeClientes.children().remove("li");
        if (data.clientes.length > 0) {
            document.getElementById("UiContenedorListaDeClientesNuevaTarea").style.display = "block";
            document.getElementById("UiNotificacionClientesNuevaTarea").style.display = "none";
        }
        else {
            document.getElementById("UiNotificacionClientesNuevaTarea").style.display = "block";
            document.getElementById("UiContenedorListaDeClientesNuevaTarea").style.display = "none";
            notify("No se han encontrado coincidencias para el criterio proporcionado, por favor verifique y vuelva a intentar.");
        }

        var etiquetaDeImpuesto = localStorage.getItem("TAX_ID");

        for (var i = 0, a = data.clientes; i < a.length; i++) {
            var clienteTemp = a[i];
            var li = "";
            if (clienteTemp.ADRESS_CUSTOMER == null || clienteTemp.ADRESS_CUSTOMER === "null") clienteTemp.ADRESS_CUSTOMER = "No tiene direccion";
            var direccion = '';
            while (clienteTemp.ADRESS_CUSTOMER.length > 0) {
                direccion += clienteTemp.ADRESS_CUSTOMER.substring(0, 50) + '<br>';
                clienteTemp.ADRESS_CUSTOMER = clienteTemp.ADRESS_CUSTOMER.substring(50);
            }

            li = "<li id=" + clienteTemp.CODE_CUSTOMER + " class='small-roboto ui-content'>\n                        <a href='#'>\n                        <p>\n                        <span><strong>CLIENTE: </strong>" + clienteTemp.CODE_CUSTOMER + "</span>\t\t                        <br><span><strong>" + etiquetaDeImpuesto + ": </strong>" + clienteTemp.NIT + "</span>\n                        <br><span>" + clienteTemp.NAME_CUSTOMER + "</span>\n                        <br><span>" + direccion + "</span>\n                        </p>\n                        </a>\n                      </li>";

            objetoListaDeClientes.append(li);
            objetoListaDeClientes.listview("refresh");
            li = null;
        }
        objetoListaDeClientes = null;
        my_dialog("", "", "close");
    }
    catch (e) {
        my_dialog("", "", "close");
        notify("No se ha podido cargar la lista de clientes debido a: " + e.message);
    }
}

function crearTarea(ruta, cliente, tipo) {
    try {
        crearTareaFueraDeRuta(ruta, cliente, tipo);
    } catch (err) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify("No se ha podido crear la tarea debido a: " + err.message);
    }
}