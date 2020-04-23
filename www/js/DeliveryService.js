var gSaldoPen = 0;
var gManifest = '0';


function GotoNotDeliveredReason() {
    $.mobile.changePage("#NotDeliveryReason_page", {
        transition: "flow",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
    });
}
function ProcessNotDelivered(reason_id) {
    try {
        var conn_option;
        
        my_dialog("Procesando", "espere un momento...", "open");

        ActualizarTareaEstado(gtaskid, TareaEstado.Completada,
            function () {
                navigator.geolocation.getCurrentPosition(
                 function (position) {
                     gCurrentGPS = position.coords.latitude + "," + position.coords.longitude;
                     $(".gpsclass").text(position.coords.latitude + "," + position.coords.longitude);
                     gLastGPS = gCurrentGPS;
                     console.log("ProcessNotDelivered.gLastGPS=" + gLastGPS);


                     conn_option = {
                         'dbuser': gdbuser,
                         'dbuserpass': gdbuserpass,
                         task: {
                             'taskid': gtaskid,
                             'delivery': 'no',
                             'reason': reason_id,
                             'taskstatus': TareaEstado.Completada,
                             'postedgps': gCurrentGPS,
                             'taskimg': gpicture,
                             'loginid': gLastLogin

                         }
                     };

                     console.dir(conn_option);

                     socket.emit("SendDeliveryTask", conn_option);
                     my_dialog("", "", "close");

                 },
                 function () {
                     gCurrentGPS = gLastGPS;

                     conn_option = {
                         'dbuser': gdbuser,
                         'dbuserpass': gdbuserpass,
                         task: {
                             'taskid': gtaskid,
                             'delivery': 'no',
                             'reason': reason_id,
                             'taskstatus': TareaEstado.Completada,
                             'postedgps': gCurrentGPS,
                             'taskimg': gpicture,
                             'loginid': gLastLogin

                         }
                     };
                     
                     console.log("ProcessNotDelivered.gCurrentGPS=" + gCurrentGPS);


                     socket.emit("SendDeliveryTask", conn_option);
                     my_dialog("", "", "close");

                 },
                 { maximumAge: 30000, timeout: 15000, enableHighAccuracy: true }
            );

            },
        function (err) {
            my_dialog("", "", "close");
            notify("ProcessNotDelivered: " +err.message);
        });
        
       
    } catch (e) {
        notify("ProcessNotDelivered: " +e.message);
    }
}

function CompletedDeliveryTask() {
    try {
        $("#lblRemitenteName").text(gClientName);

        ActualizarTareaEstado(gtaskid, TareaEstado.Completada, function () {
            var conn_option;

            if (gIsOnline == 1) {

                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        gCurrentGPS = position.coords.latitude + "," + position.coords.longitude;
                        $(".gpsclass").text(position.coords.latitude + "," + position.coords.longitude);
                        gLastGPS = gCurrentGPS;

                        conn_option = {
                            'dbuser': gdbuser,
                            'dbuserpass': gdbuserpass,
                            task: {
                                'taskid': gtaskid,
                                'delivery': 'yes',
                                'reason': null,
                                'taskstatus': TareaEstado.Completada,
                                'postedgps': gCurrentGPS,
                                'taskimg': gpicture,
                                'loginid': gLastLogin

                            }
                        };

                        socket.emit("SendDeliveryTask", conn_option);
                    },
                    function () {
                        gCurrentGPS = '0,0';

                        ToastThis("WO_GPS");

                        try{
                            conn_option = {
                                'dbuser': gdbuser,
                                'dbuserpass': gdbuserpass,
                                task: {
                                    'taskid': gtaskid,
                                    'delivery': 'yes',
                                    'reason': null,
                                    'taskstatus': TareaEstado.Completada,
                                    'postedgps': gCurrentGPS,
                                    'taskimg': gpicture,
                                    'loginid': gLastLogin

                                }
                            };
                        } catch (e) {
                            notify(e.message);
                        }

                        
                        socket.emit("SendDeliveryTask", conn_option);
                    },
                    { maximumAge: 30000, timeout: 15000, enableHighAccuracy: true }
                );
                ClearControlsPageManifest();

                
                var clienteServicio = new ClienteServicio();
                var configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();

                configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(
                    function (decimales) {
                    var cliente = new Cliente();
                    cliente.clientId = gClientID;
                        clienteServicio.obtenerCliente(cliente,decimales,function(clienteN1) {
                            actualizarListadoDeTareas(gtaskid, 'DELIVERY', TareaEstado.Completada, clienteN1.clientId, clienteN1.clientName, clienteN1.address, 0, TareaEstado.Asignada, clienteN1.rgaCode);
                        },function(operacion) {
                            notify(operacion.mensaje);
                        });
                    },function (operacion) {
                    notify(operacion.mensaje);
                });


                
                $.mobile.changePage("#pickupplan_page", {
                    transition: "flow",
                    reverse: true,
                    changeHash: true,
                    showLoadMsg: false
                });
            }


        }, function (err) {
            my_dialog("", "", "close");
            notify(err.message);
        });
        

    } catch (e) {
        notify("AcceptTask:" + e.message);
    }

}

function obtenerConfiguracionDeDecimales(callback) {
    
    configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(function(decimales) {
        callback(decimales);
    },function(operacion) {
        notify(operacion.mensaje);
    });
}

function gotomyManifestHeader() {
    ClearControlsPageManifest();
    $("#txtManifestHeader").val("");
    $.mobile.changePage('#pageManifestHeader', 'flow', true, true);
    ClearControlsTabCobros();
}

function StartDeliveryRoute() {
    ClearControlsPageManifest();
    $("#txtManifestHeader").val("");
    $.mobile.changePage('#scanmanifest_page', 'flow', true, true);
    
}

function gotomyDelivery() {
    $.mobile.changePage('#pageDeliveryOrder', 'flow', true, true);
    //UserWantsGetManifiest();
}

function gotomyInvoice() {
    $('#lstInfInvoice_Det').children().remove('li');
    $("#lstInvoiceTotal").children().remove('li');
    $.mobile.changePage('#pageDeliverys', 'flow', true, true);
    UserWantsGetManifiest();
    UserWantsChangeTipoCobro($('#cboPaymentTerm').val());
}

function UserWantsGetManifest() {
    if ($("#txtManifestHeader").val() !== "") {
        var data = {
            'ManifestHeader': $("#txtManifestHeader").val()
            , 'dbuser': gdbuser,
            'dbuserpass': gdbuserpass
        };
        socket.emit("GetManifestHeader", data);
    }
}

function UserWantsAcceptManifest() {
    gManifest = $("#lblManifest").text();
    //alert(pManifest);
    
    if (gManifest !== "0") {
        navigator.notification.confirm("Confirma aceptar el manifiesto: " + gManifest + "?",  // message
            function (buttonIndex) {
                if (buttonIndex === 1) {
                    var data = {
                        'manifestid': gManifest
                        , 'loginid'     : gLastLogin
                        , 'dbuser'      : gdbuser
                        , 'dbuserpass'  : gdbuserpass
                    };
                    //console.dir(data);
                    socket.emit("CreateMyRoutePlan", data);
                }
            }
        );
    }
    pManifest = null;
}

function UserWantsDeliverInvoice() {
    CompletedDeliveryTask(this.client);
}

function UserWantsChangeTipoCobro(values) {
    $("#DocumentWrapper").css('display', '');
    $("#BankWrapper").css('display', '');
    $("#CashWrapper").css('display', '');
    $("#liCash").css('display', '');
    $("#liInvoiceBank").css('display', '');
    $("#RowBankAccount").css('display', '');
    $("#liInvoiceChange").css('display', '');

    switch (values) {
        case "PMCASH":
            $("#DocumentWrapper").css('display', 'none');
            $("#BankWrapper").css('display', 'none');
            break;
        case "PMCREDIT":
            $("#DocumentWrapper").css('display', 'none');
            $("#BankWrapper").css('display', 'none');
            $("#liInvoiceChange").css('display', 'none');
            break;
        case "PMCHEQUE":
            $("#RowBankAccount").css('display', 'none');
            $("#liInvoiceChange").css('display', 'none');
            break;
        case "PMDEPOSIT":
            $("#liInvoiceChange").css('display', 'none');
            break;
    }
}

function ClearControlsPageManifest() {
    $("#lblManifest").text("0");
    $("#lblManifestCode").text("...");
    $("#lblManifestDateCreation").text("../../....");
    $("#lblManifestNumDoc").text("0");
    $("#lblManifestComments").text("...");
    
    $("#lblManifestPilotAsigne").text("...");
    $("#lblManifestVehiculo").text("...");
    $("#lblManifestRuta").text("...");
    
    CleanUpDeliveryImage();
}

function UserWantsAddTipoCobro() {
    try {
        if ($('#txtCash').val() === "") {
            return;
        }

        var qty = parseInt($('#txtCash').val());

        if ($('#cboPaymentTerm').val() === "PMCASH") {
            if (gSaldoPen <= qty && qty !== 0 && gSaldoPen !== 0) {
                var gSaldoAnC = gSaldoPen;
                var vuelto = 0;
                vuelto = qty - gSaldoPen;
                $("#lblInfInvoiceTotal_Vuelto").text("Q " + format_number(parseFloat(vuelto), 2));

                $("#lblInfInvoiceTotal_Pendiente").text("Q " + format_number(parseFloat("0"), 2));

                var vLi = '';
                vLi = '<li data-icon="false" class="ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
                vLi = vLi + '<p>';
                vLi = vLi + '<h2>' + "Contado" + '</h2>';
                vLi = vLi + '</p>';
                vLi = vLi + '<p>';
                vLi = vLi + '<b>Saldo anterior: </b><span>' + "Q " + format_number(parseFloat(gSaldoAnC), 2) + '</span>';
                vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:30%; color:#FF0004"> ' + "-Q " + format_number(parseFloat($('#txtCash').val()), 2) + '</span>';
                vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:70%"> ' + "Q " + format_number(parseFloat("0"), 2) + '</span>';
                vLi = vLi + '</p>';
                vLi = vLi + '</li>';
                $("#lstInvoiceTotal").append(vLi);
                $("#lstInvoiceTotal").listview('refresh');
                ClearControlsTabCobros();
                gSaldoPen = 0;
                return;
            }
            else {
                if (gSaldoPen <= 0) {
                    notify("No hay saldo pendiente");
                    return;
                }
            }
        }
        if (gSaldoPen >= qty && qty !== 0) {
            var gSaldoAn = gSaldoPen;
            gSaldoPen = (gSaldoPen - qty);

            var tipoCobro = "";
            switch ($('#cboPaymentTerm').val()) {
                case "PMCASH":
                    tipoCobro = "Contado";
                    break;
                case "PMCREDIT":
                    tipoCobro = "Credito";
                    break;
                case "PMCHEQUE":
                    tipoCobro = "Cheque";
                    break;
                case "PMDEPOSIT":
                    tipoCobro = "Deposito";
                    break;
            }
            $("#lblInfInvoiceTotal_Pendiente").text("Q " + format_number(parseFloat(gSaldoPen), 2));
            var vLi = '';
            vLi = '<li data-icon="false" class="ui-field-contain ui-alt-icon ui-nodisc-icon ui-shadow ui-icon-check">';
            vLi = vLi + '<p>';
            vLi = vLi + '<h2>' + tipoCobro + '</h2>';
            vLi = vLi + '</p>';
            vLi = vLi + '<p>';
            vLi = vLi + '<b>Saldo anterior: </b><span>' + "Q " + format_number(parseFloat(gSaldoAn), 2) + '</span>';
            vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:30%; color:#FF0004"> ' + "-Q " + format_number(parseFloat($('#txtCash').val()), 2) + '</span>';
            vLi = vLi + '<span class="ui-li-count" style="position:absolute; top:70%"> ' + "Q " + format_number(parseFloat(gSaldoPen), 2) + '</span>';
            vLi = vLi + '</p>';
            vLi = vLi + '</li>';
            $("#lstInvoiceTotal").append(vLi);
            $("#lstInvoiceTotal").listview('refresh');
            ClearControlsTabCobros();
        } else {
            if (gSaldoPen <= 0) {
                notify("No hay saldo pendiente");
            } else {
                notify("La cantidad es mayor al saldo");
            }
            
        }

    } catch (e) {
        notify("Error: " + e.message);
    }
}

function CalcularVuelto() {
    if ($('#txtCash').val() === "") {
        return;
    }
    var qty = parseInt($('#txtCash').val());
    if ($('#cboPaymentTerm').val() === "PMCASH") {
        if (gSaldoPen <= qty && qty !== 0) {
            var vuelto = 0;
            vuelto = qty - gSaldoPen;
            $("#lblInfInvoiceTotal_Vuelto").text("Q " + format_number(parseFloat(vuelto), 2));
        }
    }
}

function ClearControlsTabCobros() {
    $("#datePaymentTerm").val("");
    $("#txtDocNumber").val("");
    $("#txtAccountNumber").val("");
    $("#txtCash").val("");
    //$("#lblInvoiceChange").val("0");
}

function DelegateSondaRoute() {
    
    $("#txtManifestHeader").keyup(function (event) {
        if (event.keyCode === 13) {
            UserWantsGetManifest();
        }
    });
  
    $(document).on('keyup', '#txtCash',function (event) {
        if (event.keyCode === 13) {
            UserWantsAddTipoCobro();
        }
    });

    $("#btnDeliverInvoice").bind("touchstart", function() { CompletedDeliveryTask(); });


}