function closepos_action() {
  try {
    EnviarResolucion("CloseBox");
  } catch (e) {
    InteraccionConUsuarioServicio.bloquearPantalla();
    alert(e.message);
  }
}
function showdepositform() {
  GetGPS_ProcessDeposit();
  $.mobile.changePage("#deposit_page", {
    transition: "pop",
    reverse: false,
    changeHash: false,
    showLoadMsg: false
  });
  $("#txtDepositAmount").focus();
}
function PopulateBankAccounts() {
  SONDA_DB_Session.transaction(
    function(tx) {
      tx.executeSql(
        "SELECT * FROM BANK_ACCOUNTS",
        [],
        function(tx, results) {
          var xskus_len = results.rows.length - 1;
          gBankAccounts = [];
          for (i = 0; i <= xskus_len; i++) {
            gBankAccounts.push({
              text: results.rows.item(i).ACCOUNT_NAME,
              value: results.rows.item(i).ACCOUNT_NUMBER,
              bank: results.rows.item(i).BANK
            });
          }
          // Put the object into storage
          localStorage.setItem("gBankAccounts", JSON.stringify(gBankAccounts));

          my_dialog("", "", "close");
        },
        function(err) {
          my_dialog("", "", "close");
          if (err.code !== 0) {
            alert("Error processing SQL: " + err.code);
          }
        }
      );
    },
    function(err) {
      notify("ERROR, " + err.code);

      if (err.code !== 0) {
        alert("Error processing SQL: " + err.code);
      }
    }
  );
  my_dialog("", "", "close");
}
function UploadPhoto(invoiceId, pAutId, pAutSerial, gpicture, pId) {
  try {
    var data = {
      invoiceid: invoiceId,
      img: gpicture,
      imgid: pId,
      dbuser: gdbuser,
      dbuserpass: gdbuserpass,
      autid: pAutId,
      autserie: pAutSerial
    };
    SocketControlador.socketIo.emit("process_invoice_image", data);
    $("#btnTakePic" + pId).attr("srcpic", "");
    my_dialog("", "", "close");
  } catch (e) {
    notify(e.message);
  }
}
function UploadPhotoDeposit(pTransId, pimageUri) {}
function take_picture_deposit() {
  navigator.camera.getPicture(
    function(imageURI) {
      var image = "data:image/jpeg;base64," + imageURI;
      $("#btnTakePicDepositBank").attr("srcpic", image);
      $("#btnTakePicDepositBank").buttonMarkup({ icon: "check" });

      window.gImageURI_Deposit = image;
      $("#btnMakeDepositBank").css("visibility", "visible");
      image = null;
    },
    function(message) {
      var error =
        "No se pudo capturar la imágen del deposito debido a: " + message;
      console.log(error);
    },
    {
      quality: 80,
      targetWidth: 500,
      targetHeight: 500,
      saveToPhotoAlbum: false,
      sourceType: navigator.camera.PictureSourceType.CAMERA,
      correctOrientation: true,
      destinationType: Camera.DestinationType.DATA_URL
    }
  );
}
function PostDeposit(pAccountNumber, pAmount, pUpdate, docSerie, docNum) {
  try {
    if (pUpdate === 1) {
      localStorage.setItem(
        "POS_TOTAL_DEPOSITED",
        Number(gTotalDeposited) + Number(pAmount)
      );
      localStorage.setItem(
        "POS_TOTAL_DEPOSITS_PROC",
        Number(pCurrentDepositID)
      );

      $("#lblTotalDeposits").text(pCurrentDepositID);
      $("#lblTotalDeposited ").text("Q " + format_number(gTotalDeposited, 2));

      window.gTotalDeposited = localStorage.getItem("POS_TOTAL_DEPOSITED");
      SetNextDepositID();
    }

    if (gIsOnline == EstaEnLinea.Si) {
      var data = {
        accountid: pAccountNumber,
        gps: gCurrentGPS,
        amount: pAmount,
        routeid: gCurrentRoute,
        processdate: getDateTime(),
        loginid: gLastLogin,
        transid: pCurrentDepositID,
        docSerie: docSerie,
        docNum: docNum,
        image1: window.gImageURI_Deposit,
        dbuser: gdbuser,
        dbuserpass: gdbuserpass
      };
      console.log("Deposito a procesar: " + JSON.stringify(data));
      SocketControlador.socketIo.emit("post_deposit", data);
    } else {
      if (pUpdate === 1) {
        $.mobile.changePage("#menu_page", {
          transition: "flow",
          reverse: false,
          showLoadMsg: false
        });
      }
    }
  } catch (e) {
    InteraccionConUsuarioServicio.desbloquearPantalla();
    notify("PostDeposit: " + e.message);
    HabilitarBotonDeDepositos(true);
  }
}

function onSuccessGPS_Deposit(position) {
  try {
    gGPSPositionIsAvailable = true;
    gCurrentGPS = position.coords.latitude + "," + position.coords.longitude;
    my_dialog("", "", "close");
  } catch (e) {
    alert("error on getting gps:" + err.message);
  }
}
function onErrorGPS_Deposit(error) {
  my_dialog("", "", "close");
  gGPSPositionIsAvailable = false;
  gMyCurrentGPS = "0,0";
  ToastThis("GPS position Is unreachable.");
}
function GetGPS_ProcessDeposit() {
  navigator.geolocation.getCurrentPosition(
    onSuccessGPS_Deposit,
    onErrorGPS_Deposit,
    { timeout: 10000, enableHighAccuracy: true }
  );
}
function ProcessDeposit() {
  InteraccionConUsuarioServicio.bloquearPantalla();
  HabilitarBotonDeDepositos(false);
  var pAccountNumber = gSelectedAccount;
  var totalFacturado = $("#lblSold_Dep").text();

  var pAmount = new Number();
  try {
    pAmount = parseFloat($("#txtDepositAmount").val());

    if (!isNaN(pAmount) && Number(pAmount) > 0) {
      if (
        pAccountNumber === "" ||
        pAccountNumber === undefined ||
        pAccountNumber === null
      ) {
        InteraccionConUsuarioServicio.desbloquearPantalla();
        notify("Debe seleccionar una cuenta bancaria...");
        HabilitarBotonDeDepositos(true);
      } else {
        if (!isNaN(totalFacturado) && pAmount > parseFloat(totalFacturado)) {
          notify(
            "Por favor, ingrese una cantidad igual o menor al monto facturado."
          );
          InteraccionConUsuarioServicio.desbloquearPantalla();
          HabilitarBotonDeDepositos(true);
        } else {
          PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(
            SecuenciaDeDocumentoTipo.DepositoBancario,
            function(serie, numeroDocumento) {
              SONDA_DB_Session.transaction(
                function(tx) {
                  GetNextDepositID();
                  var pSql =
                    "INSERT INTO DEPOSITS(TRANS_ID, TRANS_TYPE, TRANS_DATETIME, BANK_ID, ACCOUNT_NUM, AMOUNT, GPS_URL, IS_POSTED, IMG1, DOC_SERIE, DOC_NUM) ";
                  pSql +=
                    "VALUES(" +
                    pCurrentDepositID +
                    ",'BANK_DEPOSIT','" +
                    getDateTime() +
                    "','" +
                    gBankName +
                    "','";
                  pSql +=
                    pAccountNumber +
                    "'," +
                    pAmount +
                    ",'" +
                    gCurrentGPS +
                    "', 0, '" +
                    gImageURI_Deposit +
                    "','" +
                    serie +
                    "', " +
                    numeroDocumento +
                    ")";

                  tx.executeSql(pSql);

                  PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(
                    SecuenciaDeDocumentoTipo.DepositoBancario,
                    numeroDocumento,
                    function() {},
                    function(error) {
                      InteraccionConUsuarioServicio.desbloquearPantalla();
                      notify(error);
                      HabilitarBotonDeDepositos(true);
                    }
                  );
                },
                function(tx, err) {
                  InteraccionConUsuarioServicio.desbloquearPantalla();
                  my_dialog("", "", "close");
                  notify(err);
                  HabilitarBotonDeDepositos(true);
                },
                function() {
                  PostDeposit(
                    pAccountNumber,
                    pAmount,
                    1,
                    serie,
                    numeroDocumento
                  );
                }
              );
            },
            function(error) {
              InteraccionConUsuarioServicio.desbloquearPantalla();
              HabilitarBotonDeDepositos(true);
              notify(error);
            }
          );
        }
      }
    } else {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify("ERROR, Debe Ingresar un monto mayor a cero");
      HabilitarBotonDeDepositos(true);
    }
  } catch (e) {
    InteraccionConUsuarioServicio.desbloquearPantalla();
    notify("ProcessDeposit" + e.message);
    HabilitarBotonDeDepositos(true);
  }
}

function HabilitarBotonDeDepositos(habilitar) {
  if (habilitar) {
    $("#btnMakeDepositBank").css("visibility", "visible");
  } else {
    $("#btnMakeDepositBank").css("visibility", "hidden");
  }
}

function GetBankAccounts() {
  try {
    var data = {
      routeid: gCurrentRoute,
      dbuser: gdbuser,
      dbuserpass: gdbuserpass
    };
    SocketControlador.socketIo.emit("getbankaccounts", data);
    my_dialog("", "", "close");
  } catch (e) {
    notify("GetBankAccounts: " + e.message);
    my_dialog("", "", "close");
  }
}
function GetNextInvoiceID() {
  try {
    var pInvID = new Number();
    var pInvoice_Until = new Number();

    pInvoice_Until = parseInt(localStorage.getItem("POS_SAT_RES_DOC_FINISH"));

    pInvID = 0;
    pInvID = parseInt(localStorage.getItem("POS_CURRENT_INVOICE_ID")) + 1;

    if (pInvID <= pInvoice_Until) {
      //check if user needs to be alerted about % of left invoices

      return pInvID;
    } else {
      return -1;
    }
  } catch (e) {
    console.log("GetNextInvoiceID.catch: " + e.message);
    return 0;
  }
}
function GetNextDepositID() {
  pCurrentDepositID = localStorage.getItem("POS_TOTAL_DEPOSITS_PROC");
  pCurrentDepositID++;
}
function SetNextDepositID() {
  localStorage.setItem("POS_TOTAL_DEPOSITS_PROC", Number(pCurrentDepositID));
}
function CheckPOS() {
  var pCash = 0;

  try {
    gPrintAddress = "0";

    if (localStorage.getItem("POS_STATUS")) {
      pPOSStatus = localStorage.getItem("POS_STATUS");

      if (localStorage.getItem("POS_SAT_RESOLUTION") === null) {
        pCurrentSAT_Resolution = 0;
        pCurrentSAT_Res_Serie = 0;
        pCurrentSAT_Res_Serie_notes = 0;
        pCurrentSAT_Resolution_notes = 0;
        gBranchName = "";
        gBranchAddress = "";
        gCompanyName = "";
      } else {
        pCurrentSAT_Resolution = localStorage.getItem("POS_SAT_RESOLUTION");
        pCurrentSAT_Res_Serie = localStorage.getItem("POS_SAT_RES_SERIE");
        pCurrentSAT_Resolution_notes = localStorage.getItem(
          "POS_SAT_RESOLUTION_NOTES"
        );
        pCurrentSAT_Res_Serie_notes = localStorage.getItem(
          "POS_SAT_RES_SERIE_NOTES"
        );

        gBranchName = localStorage.getItem("POS_SAT_BRANCH_NAME");
        gBranchAddress = localStorage.getItem("POS_SAT_BRANCH_ADDRESS");
        gCompanyName = localStorage.getItem("POS_COMPANY_NAME");
      }

      pCurrentSAT_Res_DocStart = localStorage.getItem("POS_SAT_RES_DOC_START");
      pCurrentSAT_Res_DocFinish = localStorage.getItem(
        "POS_SAT_RES_DOC_FINISH"
      );
      pCurrentSAT_Res_Date = localStorage.getItem("POS_SAT_RES_DATE");
      pCurrentInvoiceID = localStorage.getItem("POS_CURRENT_INVOICE_ID");

      pCurrentSAT_Res_DocStart_notes = localStorage.getItem(
        "POS_SAT_RES_DOC_START_NOTES"
      );
      pCurrentSAT_Res_DocFinish_notes = localStorage.getItem(
        "POS_SAT_RES_DOC_FINISH_NOTES"
      );
      pCurrentSAT_Res_Date_notes = localStorage.getItem(
        "POS_SAT_RES_DATE_NOTES"
      );
      pCurrentNoteID = localStorage.getItem("POS_CURRENT_CREDIT_NOTE");

      gTotalInvoicesProc = localStorage.getItem("POS_TOTAL_INVOICES_PROC");

      pCurrentDepositID = localStorage.getItem("POS_CURRENT_DEPOSIT_ID");
      gPrintAddress = localStorage.getItem("PRINTER_ADDRESS");

      gLastLogin = localStorage.getItem("POS_LAST_LOGIN_ID");
      gCurrentRoute = localStorage.getItem("POS_CURRENT_ROUTE");
      gdbuser = localStorage.getItem("POS_DBUSER");
      gdbuserpass = localStorage.getItem("POS_DBPASSWORD");

      gTotalDeposited = Number(localStorage.getItem("POS_TOTAL_DEPOSITED"));
      gTotalDepositsProc = Number(
        localStorage.getItem("POS_TOTAL_DEPOSITS_PROC")
      );

      gTotalInvoiced = Number(localStorage.getItem("POS_TOTAL_INVOICED"));

      gRouteReturnWarehouse = localStorage.getItem("ROUTE_RETURN_WAREHOUSE");
      displaysumminfo();
    } else {
      initlocalstorage();
      displaysumminfo();
    }
  } catch (e) {
    notify("CheckPOS: " + e.message);
    initlocalstorage();
    pPOSStatus = "CLOSED";
  }

  return pPOSStatus;
}
function displaysumminfo() {
  ObtenerTotalDeDepositosYMontoDepositados(function(infoDepositos) {
    $("#lblTotalDeposits").text(infoDepositos.totalDepositosRealizados);
    $("#lblTotalDeposited").text(
      currencySymbol +
        " " +
        format_number(
          infoDepositos.totalDepositado,
          parseInt(localStorage.getItem("DEFAULT_DISPLAY_DECIMALS"))
        )
    );
  });

  $("#lblTotalInvoices").text(gTotalInvoicesProc);
  $("#lblSold").text(
    currencySymbol +
      " " +
      format_number(
        gTotalInvoiced,
        parseInt(localStorage.getItem("DEFAULT_DISPLAY_DECIMALS"))
      )
  );

  $("#lblSumm_Autho").text(pCurrentSAT_Resolution);
  $("#lblSumm_Serie").text(pCurrentSAT_Res_Serie);
  $("#lblSumm_AuthDate").text(pCurrentSAT_Res_Date);

  $("#lblSumm_DocFrom").text(pCurrentSAT_Res_DocStart);
  $("#lblSumm_DocTo").text(pCurrentSAT_Res_DocFinish);
  $("#lblSumm_CurrentDoc").text(pCurrentInvoiceID);

  //notes
  $("#lblSumm_Autho_notes").text(pCurrentSAT_Resolution_notes);
  $("#lblSumm_Serie_notes").text(pCurrentSAT_Res_Serie_notes);
  $("#lblSumm_AuthDate_notes").text(pCurrentSAT_Res_Date_notes);

  $("#lblSumm_DocFrom_notes").text(pCurrentSAT_Res_DocStart_notes);
  $("#lblSumm_DocTo_notes").text(pCurrentSAT_Res_DocFinish_notes);

  $("#lblSumm_CurrentDoc_notes").text(pCurrentNoteID);
  $("#lblCompanyName").text(gCompanyName);
}

function ObtenerTotalDeDepositosYMontoDepositados(callback) {
  var infoDeDepositos = { totalDepositosRealizados: 0, totalDepositado: 0 };
  SONDA_DB_Session.transaction(
    function(trans) {
      var sql =
        "SELECT COUNT(TRANS_ID) AS TOTAL_DEPOSITS, SUM(AMOUNT) AS TOTAL_DEPOSITED FROM DEPOSITS";
      trans.executeSql(
        sql,
        [],
        function(transReturn, results) {
          if (results.rows.length > 0) {
            infoDeDepositos.totalDepositosRealizados = results.rows.item(
              0
            ).TOTAL_DEPOSITS;
            infoDeDepositos.totalDepositado = results.rows.item(
              0
            ).TOTAL_DEPOSITED;
            callback(infoDeDepositos);
          } else {
            callback(infoDeDepositos);
          }
        },
        function(transReturn, error) {
          callback(infoDeDepositos);
        }
      );
    },
    function(error) {
      callback(infoDeDepositos);
    }
  );
}

function initlocalstorage() {
  localStorage.setItem("POS_STATUS", "CLOSED");
  localStorage.setItem("POS_LAST_LOGIN_ID", "");
  //localStorage.setItem('POS_CURRENT_ROUTE', '');
  localStorage.setItem("POS_CURRENT_INVOICE_ID", Number(0));

  localStorage.setItem("POS_TOTAL_DEPOSITED", 0);
  localStorage.setItem("POS_TOTAL_INVOICED", 0);
  localStorage.setItem("POS_TOTAL_INVOICES_PROC", 0);
  localStorage.setItem("POS_CURRENT_CREDIT_NOTE", 0);

  localStorage.setItem("POS_SAT_RES_DOC_START", 0);
  localStorage.setItem("POS_SAT_RES_DOC_FINISH", 0);
  localStorage.setItem("POS_SAT_RES_DATE", "");

  localStorage.setItem("POS_SAT_RES_DOC_START_NOTES", 0);
  localStorage.setItem("POS_SAT_RES_DOC_FINISH_NOTES", 0);
  localStorage.setItem("POS_SAT_RES_DATE_NOTES", "");

  localStorage.setItem("POS_CURRENT_DEPOSIT_ID", 0);
  localStorage.setItem("POS_CURRENT_DEPOSIT_ID", "");
  localStorage.setItem("POS_ITEM_SEQ", Number(0));
  localStorage.setItem("POS_TOTAL_DEPOSITS_PROC", Number(0));
  localStorage.setItem("PRINTER_ADDRESS", "0");

  localStorage.setItem("POS_SAT_RESOLUTION", "");
  localStorage.setItem("POS_SAT_RES_SERIE", "");

  localStorage.setItem("POS_SAT_BRANCH_NAME", "");
  localStorage.setItem("POS_SAT_BRANCH_ADDRESS", "");
  localStorage.setItem("POS_COMPANY_NAME", "");
  localStorage.setItem("ROUTE_RETURN_WAREHOUSE", "");

  pCurrentNoteID = new Number();
  gTotalDeposited = new Number();
  gInvocingTotal = new Number();
  gTotalInvoiced = new Number();
  gTotalInvoicesProc = new Number();
  gPrintAddress = "0";
  gTotalInvoicesProc = 0;
  gTotalDepositsProc = 0;
  gLastLogin = "CLOSED";
  gBranchAddress = "";
  gCompanyName = "";
  gBranchName = "";
  gdbuser = "";
  gdbuserpass = "";
}
function ShowDepositsListPage() {
  $.mobile.changePage("#deposit_list_page", {
    transition: "slide",
    reverse: true,
    changeHash: true,
    showLoadMsg: false
  });
  listalldeposits();
}
function listalldeposits() {
  try {
    //my_dialog("Cargando Depositos", "Espere...", "open");
    SONDA_DB_Session.transaction(
      function(tx) {
        var vLI = "";
        tx.executeSql(
          'SELECT * FROM DEPOSITS WHERE BANK_ID <> "?"',
          [],
          function(tx, results) {
            $("#depositslist_listview")
              .children()
              .remove("li");

            for (i = 0; i <= results.rows.length - 1; i++)
              for (i = 0; i <= results.rows.length - 1; i++) {
                //var xonclick = 'viewdepositpicture(' + results.rows.item(i).TRANS_ID + ');'
                //DEPOSITS(TRANS_ID, TRANS_TYPE, TRANS_DATETIME, BANK_ID, ACCOUNT_NUM, AMOUNT, GPS_URL)
                var pIS_POSTED = results.rows.item(i).IS_POSTED;
                var xmsg;
                if (results.rows.item(i).IS_POSTED === 1) {
                  xmsg =
                    "<img src='css/styles/images/icons-png/check-black.png'></img>";
                } else {
                  xmsg =
                    "<img src='css/styles/images/icons-png/forbidden-black.png'></img>";
                }

                vLI = "";
                vLI = '<li class="ui-nodisc-icon ui-btn ui-shadow">';
                vLI +=
                  '<p><span class="title">' +
                  results.rows.item(i).BANK_ID +
                  "</span></p>";
                vLI +=
                  '<p><span class="medium">' +
                  xmsg +
                  " " +
                  results.rows.item(i).ACCOUNT_NUM +
                  "</span></p>";
                vLI +=
                  '<p><span class="medium">' +
                  results.rows.item(i).TRANS_DATETIME +
                  "</span></p>";
                vLI +=
                  '<p class="ui-li-aside medium">#' +
                  results.rows.item(i).TRANS_ID +
                  "</p>";
                vLI +=
                  '<p><span class="small-roboto ui-li-count">' +
                  currencySymbol +
                  ". " +
                  format_number(results.rows.item(i).AMOUNT, 2) +
                  "</span></p>";
                vLI += "</li>";
                vLI += "";

                //vLI = '<li><a href="#">test prg</a></li>'
                //console.log(vLI);
                try {
                  $("#depositslist_listview")
                    .append(vLI)
                    .trigger("create");
                } catch (e) {
                  console.log("? " + e.message);
                }
              }
            $("#depositslist_listview").listview("refresh");
            my_dialog("", "", "close");
          },
          function(err) {
            if (err.code !== 0) {
              alert("Error processing SQL: " + err.code);
            }
          }
        );
      },
      function(err) {
        if (err.code !== 0) {
          alert("Error processing SQL: " + err.code);
        }
      }
    );

    my_dialog("", "", "close");
  } catch (e) {
    console.log("show invoices cath: " + e.message);
  }
}
function GetRouteAuth(docType) {
  //var pRoute = $("#lblCurrentLoggedRoute").text();

  try {
    var data = {
      routeid: gCurrentRoute,
      doctype: docType,
      dbuser: gdbuser,
      dbuserpass: gdbuserpass
    };
    SocketControlador.socketIo.emit("getauthinfo", data);
  } catch (e) {
    console.log(e.message);
  }
}
function startpos() {
  $.mobile.changePage("#dialog_startpos", {
    transition: "pop",
    reverse: false,
    changeHash: false,
    showLoadMsg: false
  });
}

function start_invoicing() {
  vieneDeListadoDeDocumentosDeEntrega = false;
  ClearUpInvoice();
  window.gClientCode = "C000000";

  $("#lblClientCode").text("C000000");

  $.mobile.changePage("#pos_client_page", {
    transition: "pop",
    reverse: false,
    changeHash: false,
    showLoadMsg: false
  });
}

function pos_sku_swipeHandler(event) {
  try {
    if (event.type === "swipeleft") {
      event.preventDefault();

      if (vieneDeListadoDeDocumentosDeEntrega) return;

      var pId = $(this).attr("id");
      var pSku = pId.substring(4, pId.length);
      var pLineSeq = $(this).attr("LineSeq");
      var pSerie = $(this).attr("SkuSerie");
      var pQty = $(this).attr("SkuQTY");
      var saleUnitMeasure = $(this).attr("UM");
      var stockUnitMeasure = $(this).attr("UM_STOCK");
      var convertionFactor = $(this).attr("CONVERSION_FACTOR");
      var qtyToDelete = 0;

      if (saleUnitMeasure.toUpperCase() !== stockUnitMeasure.toUpperCase()) {
        qtyToDelete = pQty * parseFloat(convertionFactor);
      } else {
        qtyToDelete = pQty;
      }

      try {
        navigator.notification.confirm(
          "Confirma remover de la lista al SKU " + pSku + "?",
          function(buttonIndex) {
            if (buttonIndex === 2) {
              RemoveSKU(pSku, pLineSeq, pSerie, qtyToDelete, saleUnitMeasure);
            }
          },
          "Sonda® SD " + SondaVersion,
          ["No", "Si"]
        );
      } catch (e) {
        notify("Error al remover el SKU debido a: " + e.message);
      }
    }
  } catch (ex) {
    notify("Error al remover el SKU debido a: " + ex.message);
  }
}

function PopulateInvoiceSKUsList() {
  try {
    var configuracionDeDecimalesServicio = new ManejoDeDecimalesServicio();
    var configuracionDeDecimales = new ManejoDeDecimales();
    configuracionDeDecimalesServicio.obtenerInformacionDeManejoDeDecimales(
      function(configuracionDecimales) {
        configuracionDeDecimales = configuracionDecimales;
      }
    );
    window.gInvocingTotal = 0;
    window.gInvocingTotalToSave = 0;
    $("#lblTotalSKU").text("0.00");

    $("#pos_skus_page_listview")
      .children()
      .remove("li");

    window.gSkuList.length = 0;

    SONDA_DB_Session.transaction(
      function(tx) {
        var pDoc = "";
        var pImg = "";
        var pSql = "";
        if (
          vieneDeListadoDeDocumentosDeEntrega &&
          localStorage.getItem("INVOICE_IN_ROUTE") === "0"
        ) {
          pSql =
            "SELECT A.SKU, A.PRICE, A.SKU_NAME, A.ON_HAND AS ON_HAND_DELEBERY, A.QTY, A.TOTAL_LINE, A.REQUERIES_SERIE, A.LINE_SEQ, ";
          pSql +=
            " 0 AS IS_KIT, A.SERIE, A.SERIE_2, A.DISCOUNT, A.IS_BONUS FROM INVOICE_DETAIL AS A";
          pSql += " WHERE A.INVOICE_NUM = -9999 ORDER BY A.IS_BONUS DESC";
        } else {
          pSql =
            "SELECT A.SKU, A.PRICE, B.SKU_NAME, B.ON_HAND, A.QTY, A.TOTAL_LINE, A.REQUERIES_SERIE, A.LINE_SEQ, ";
          pSql +=
            " B.IS_KIT, A.SERIE, A.SERIE_2, A.ON_HAND AS ON_HAND_DELEBERY, A.DISCOUNT, A.IS_BONUS, A.PACK_UNIT, A.CODE_PACK_UNIT_STOCK, A.CONVERSION_FACTOR FROM INVOICE_DETAIL A, ";
          pSql +=
            " SKUS B WHERE A.INVOICE_NUM = -9999 AND B.SKU = A.SKU AND B.EXPOSURE = 1 ORDER BY A.IS_BONUS DESC";
        }
        tx.executeSql(
          pSql,
          [],
          function(tx, results) {
            if (results.rows.length > 0) {
              var vLI = "";
              for (var i = 0; i < results.rows.length; i++) {
                var isBonus = results.rows.item(i).IS_BONUS;
                var discount = results.rows.item(i).DISCOUNT;
                var pSKU = results.rows.item(i).SKU;
                var pPRICE = trunc_number(
                  results.rows.item(i).PRICE,
                  configuracionDeDecimales.defaultCalculationsDecimals
                );
                var pSKU_Name = results.rows.item(i).SKU_NAME;
                var pQTY = trunc_number(
                  results.rows.item(i).QTY,
                  configuracionDeDecimales.defaultCalculationsDecimals
                );
                var pTOTAL_LINE = !vieneDeListadoDeDocumentosDeEntrega
                  ? trunc_number(
                      pQTY * pPRICE,
                      configuracionDeDecimales.defaultCalculationsDecimals
                    )
                  : trunc_number(
                      results.rows.item(i).TOTAL_LINE,
                      configuracionDeDecimales.defaultCalculationsDecimals
                    );
                var pREQUERIES_SERIE = results.rows.item(i).REQUERIES_SERIE;
                var pSERIE = results.rows.item(i).SERIE;
                var pSERIE_2 = results.rows.item(i).SERIE_2;
                var pIS_KIT = results.rows.item(i).IS_KIT;
                var pLINE_SEQ = results.rows.item(i).LINE_SEQ;
                var codePackUnitStock = results.rows.item(i)
                  .CODE_PACK_UNIT_STOCK;
                var codePackUnitSales = results.rows.item(i).PACK_UNIT;
                var conversionFactor = results.rows.item(i).CONVERSION_FACTOR;

                vLI +=
                  '<li requiereSerie="' +
                  pREQUERIES_SERIE +
                  '" skuQTY="' +
                  pQTY +
                  '" LineSeq="' +
                  pLINE_SEQ +
                  '" SkuSerie="' +
                  pSERIE +
                  '" UM="' +
                  codePackUnitSales +
                  '" UM_STOCK ="' +
                  codePackUnitStock +
                  '" CONVERSION_FACTOR = "' +
                  conversionFactor +
                  '" id="SKU_' +
                  pSKU +
                  '">';

                var onSKUClick = "";

                if (isBonus == SiNo.No) {
                  if (pREQUERIES_SERIE === 1 || pREQUERIES_SERIE === "1") {
                    onSKUClick =
                      "AddSeriesForSku('" +
                      pSKU +
                      "','" +
                      pSKU_Name +
                      "'," +
                      pPRICE +
                      ")";
                    vLI =
                      vLI +
                      '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' +
                      onSKUClick +
                      '">';
                  } else {
                    //-pQTY
                    onSKUClick =
                      "SetSKUCant(" +
                      "'" +
                      pSKU +
                      "','" +
                      pSKU_Name.replace(/"|'/g, "") +
                      "'" +
                      "," +
                      pLINE_SEQ +
                      "," +
                      (vieneDeListadoDeDocumentosDeEntrega
                        ? results.rows.item(i).ON_HAND_DELEBERY
                        : parseFloat(
                            format_number(results.rows.item(i).ON_HAND, 2)
                          )) +
                      ", '" +
                      results.rows.item(i).PACK_UNIT +
                      "');";
                    vLI =
                      vLI +
                      '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" onclick="' +
                      onSKUClick +
                      '">';
                  }
                } else {
                  vLI =
                    vLI +
                    '<a class="ui-alt-icon ui-shadow ui-nodisc-icon" href="#" style="border: 0.3em solid blue;">';
                }

                vLI =
                  vLI + '<span class="small-roboto">' + pSKU_Name + "</span>";
                vLI =
                  vLI +
                  '<p><span id="SKU_QTY_' +
                  pSKU +
                  '" class="small-roboto">Cant.: ' +
                  format_number(
                    pQTY,
                    configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                  ) +
                  " Pre.: " +
                  currencySymbol +
                  format_number(
                    pPRICE,
                    configuracionDeDecimales.defaultCalculationsDecimals
                  ) +
                  "</span></p>";

                if (pREQUERIES_SERIE === 1) {
                  vLI =
                    vLI +
                    '<span style="color:blue; width: 80%" class="small-roboto">Series:' +
                    pSERIE +
                    "</span>";
                }

                vLI =
                  vLI +
                  '<span class="small-roboto ui-li-count">' +
                  currencySymbol +
                  format_number(
                    pTOTAL_LINE,
                    configuracionDeDecimales.defaultDisplayDecimals
                  ) +
                  "</span>";

                if (
                  results.rows.item(i).PACK_UNIT &&
                  results.rows.item(i).PACK_UNIT.toUpperCase() != "NULL"
                ) {
                  vLI =
                    vLI +
                    '<span class="small-roboto">UM:' +
                    results.rows.item(i).PACK_UNIT +
                    "</span></a>";
                }

                if (!vieneDeListadoDeDocumentosDeEntrega) {
                  if (pREQUERIES_SERIE === 0) {
                    var xonclick2 =
                      "AddSKU('" +
                      pSKU +
                      "',1, true, '" +
                      results.rows.item(i).PACK_UNIT +
                      "');";

                    console.log(xonclick2);

                    vLI =
                      vLI +
                      '<a href="#" onclick="' +
                      xonclick2 +
                      '" class="ui-nodisc-icon ui-alt-icon ui-icon-plus" data-theme="plus"></a>';
                  }
                }

                vLI += "</li>";

                window.gInvocingTotal = gInvocingTotal + pTOTAL_LINE;
              }
              window.gInvocingTotalToSave = window.gInvocingTotal;
              window.gInvocingTotal =
                gDiscount > 0
                  ? ((100 - gDiscount) / 100) * window.gInvocingTotal
                  : window.gInvocingTotal;

              $("#pos_skus_page_listview").append(vLI);

              $("#pos_skus_page_listview").listview("refresh");

              $("#lblTotalSKU").text(
                format_number(
                  gInvocingTotal,
                  configuracionDeDecimales.defaultDisplayDecimals
                )
              );
            }

            my_dialog("", "", "close");
          },
          function(err) {
            console.log("aqui el error: " + err.message);

            my_dialog("", "", "close");
            if (err.code !== 0) {
              alert("10.20.50.90, Error processing SQL: " + err);
            }
          }
        );
      },
      function(trans, err) {
        console.log("aqui el error: " + err.message);

        my_dialog("", "", "close");
        if (err.code !== 0) {
          alert("Error processing SQL: " + err);
        }
      }
    );
  } catch (e) {
    my_dialog("", "", "close");
    notify("PopulateInvoiceSKUsList: " + e.message);
    console.log(e.message);
  }
}
function RemoveSKU(pSku, pLineSeq, pSerie, pQty, saleUnitMeasure) {
  try {
    SONDA_DB_Session.transaction(
      function(tx) {
        var pSql =
          "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" +
          pSku +
          "' AND SERIE = '" +
          pSerie +
          "'";
        console.log(pSql);
        tx.executeSql(pSql);

        var pSql1 =
          "UPDATE SKU_SERIES SET STATUS = 0 WHERE SKU = '" +
          pSku +
          "' AND SERIE = '" +
          pSerie +
          "'";
        console.log(pSql1);
        tx.executeSql(pSql1);

        var pCurrentSeq = Number(localStorage.getItem("POS_ITEM_SEQ"));
        localStorage.setItem("POS_ITEM_SEQ", Number(pCurrentSeq) - 1);
      },
      function(err) {
        notify("Error al remover el SKU debido a: " + err);
        console.log(err);
      },
      function() {
        PopulateInvoiceSKUsList();
        my_dialog("", "", "close");
      }
    );
  } catch (e) {
    notify("Error al remover el SKU debido a: " + e.message);
    console.log(e.message);
  }
}

function PopulateAndShowSKUPanel() {
  PopulateSKUGrid();

  $.mobile.changePage("#skus_list_page", {
    transition: "none",
    reverse: true,
    changeHash: true,
    showLoadMsg: false
  });
}

function pos_skus_swipeHandler(event) {
  PopulateAndShowSKUPanel();
}

function ProceedToVoid() {
  PopulateVoidReasons();
  $.mobile.changePage("#void_invoice_page", {
    transition: "none",
    reverse: true,
    changeHash: true,
    showLoadMsg: false
  });
  var pClientName = $("#invoice_actions_custname").text();
  $("#lblvoid_invoiceid").text("Factura # " + pInvoiceID);
  $("#lblvoid_clientname").text(pClientName);
}

function showvoidinvoice(pInvoiceID) {
  var pLeftAuthNotes = new Number();
  pLeftAuthNotes = 0;

  pCurrentNoteID = localStorage.getItem("POS_CURRENT_CREDIT_NOTE"); //POS_CURRENT_INVOICE_ID

  pLeftAuthNotes =
    Number(pCurrentSAT_Res_DocFinish_notes) - Number(pCurrentNoteID);
  switch (pLeftAuthNotes) {
    case 0:
      notify(
        "ERROR, No se puede anular la factura, puesto que no hay notas de credito autorizadas. \nContacte a su administrador de Sonda."
      );
      break;
    case 1:
      notify(
        "ATENCION, Esta es la ultima anulacion que se puede realizar, (notas de credito autorizadas). \nContacte a su administrador de Sonda."
      );
      break;
    default:
      ProceedToVoid();
      break;
  }
}
function PostVoidedInvoice(pInvoiceID, pNoteID, pVoidReason, pVoidNotes) {
  try {
    var pAuth = localStorage.getItem("POS_SAT_RESOLUTION_NOTES");
    var pSerie = localStorage.getItem("POS_SAT_RES_SERIE_NOTES");

    console.log(pAuth + " " + pSerie);
    var data = {
      invoiceid: pInvoiceID,
      noteid: pNoteID,
      reasonid: pVoidReason,
      authid: pAuth,
      serie: pSerie,
      dbuser: gdbuser,
      dbuserpass: gdbuserpass
    };
    SocketControlador.socketIo.emit("void_invoice", data);
  } catch (e) {
    console.log(e.message);
  }
}
function DuplicateInvoiceDetail_Void(
  pInvoiceID,
  pVoidReason,
  pVoidNotes,
  isPaidConsignment
) {
  var pSql = "";

  pSql +=
    " INSERT INTO INVOICE_DETAIL (INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT, TOTAL_LINE, SERIE, SERIE_2, REQUERIES_SERIE, LINE_SEQ, IS_ACTIVE, COMBO_REFERENCE, PARENT_SEQ, EXPOSURE, PHONE) ";
  pSql += "   SELECT";
  pSql += " 	" + pCurrentNoteID + " AS INVOICE_NUM";
  pSql += "    ,SKU";
  pSql += "    ,SKU_NAME";
  pSql += "    ,QTY";
  pSql += "    ,PRICE";
  pSql += "    ,DISCOUNT";
  pSql += "    ,TOTAL_LINE";
  pSql += "    ,SERIE";
  pSql += "    ,SERIE_2";
  pSql += "    ,REQUERIES_SERIE";
  pSql += "    ,LINE_SEQ";
  pSql += "    ,IS_ACTIVE";
  pSql += "    ,COMBO_REFERENCE";
  pSql += "    ,PARENT_SEQ";
  pSql += "    ,EXPOSURE";
  pSql += "    ,PHONE";
  pSql += "   FROM INVOICE_DETAIL";
  pSql += "   WHERE INVOICE_NUM = " + pInvoiceID;

  SONDA_DB_Session.transaction(function(tx) {
    tx.executeSql(pSql);

    pSql = "SELECT * FROM INVOICE_DETAIL  WHERE  INVOICE_NUM = " + pInvoiceID;
    tx.executeSql(
      pSql,
      [],
      function(tx, results) {
        for (var i = 0; i <= results.rows.length - 1; i++) {
          if (results.rows.item(i).EXPOSURE === 1) {
            pSql =
              "UPDATE SKU_SERIES SET STATUS = 0 WHERE SERIE = " +
              results.rows.item(i).SERIE;
            tx.executeSql(pSql);
          }
          if (isPaidConsignment !== 1) {
            pSql =
              "UPDATE SKUS SET ON_HAND = (ON_HAND + " +
              results.rows.item(i).QTY +
              ") WHERE SKU = '" +
              results.rows.item(i).SKU +
              "'";
            tx.executeSql(pSql);
          }
        }

        pSql =
          "UPDATE INVOICE_HEADER SET STATUS = 3, VOID_INVOICE_ID = " +
          pCurrentNoteID +
          " WHERE IS_CREDIT_NOTE=0 AND INVOICE_NUM = " +
          pInvoiceID;
        tx.executeSql(pSql);

        pSql =
          "UPDATE INVOICE_DETAIL SET IS_ACTIVE = 2 WHERE INVOICE_NUM = " +
          pInvoiceID;
        tx.executeSql(pSql);

        //PostVoidetdInvoice(pInvoiceID, pCurrentNoteID, pVoidReason, pVoidNotes);

        ShowInvoiceListPage();
      },
      function(err) {
        pCurrentNoteID += 1;
        localStorage.setItem("POS_CURRENT_CREDIT_NOTE", pCurrentNoteID);
        notify("ERROR, 8.1.17: " + err.code);
      }
    );
  });
}

function checkInvoiceIsPosted(pInvoiceId, callback, errCallback) {
  var pSql = "";

  try {
    my_dialog("Procesando Factura", "Espere...", "open");

    SONDA_DB_Session.transaction(
      function(tx) {
        //INVOICE_HEADER(INVOICE_NUM, TERMS, POSTED_DATETIME, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES)
        pSql =
          "SELECT * FROM INVOICE_HEADER WHERE INVOICE_NUM = " +
          pInvoiceId +
          " AND IS_POSTED = 2 AND IS_POSTED_VALIDATED = 2 ";
        //console.log(pSQL);

        tx.executeSql(
          pSql,
          [],
          function(tx, results) {
            if (results.rows.length > 0) {
              callback();
            } else {
              errCallback(
                "La factura no esta sincronizada y no es posible anularla."
              );
            }
          },
          function(err) {
            errCallback(err);
          }
        );
      },
      function(err) {
        errCallback(err);
      }
    );
  } catch (e) {
    errCallback(e);
  }
}

function ProcessVoidInvoice(
  pInvoiceID,
  pReasonID,
  pVoidNotes,
  isPaidConsignment,
  imgConsignment,
  seq
) {
  var pSQL = "";

  try {
    my_dialog("Procesando Factura", "Espere...", "open");

    SONDA_DB_Session.transaction(
      function(tx) {
        pSQL =
          "SELECT * FROM INVOICE_HEADER WHERE INVOICE_NUM = " +
          pInvoiceID +
          " AND IS_CREDIT_NOTE = 0 ";

        tx.executeSql(
          pSQL,
          [],
          function(tx, results) {
            var xrow_len = results.rows.length;
            ObtenerDetalleDeFacturaPorSku(
              tx,
              pInvoiceID,
              function(detalle) {
                if (seq === 1) {
                  AnularFactura(
                    pInvoiceID,
                    localStorage.getItem("POS_SAT_RES_SERIE"),
                    localStorage.getItem("POS_SAT_RESOLUTION"),
                    detalle,
                    pReasonID,
                    isPaidConsignment,
                    imgConsignment,
                    1,
                    results.rows.item(0).IS_FROM_DELIVERY_NOTE
                  );
                  return;
                }
                AnularFactura(
                  pInvoiceID,
                  localStorage.getItem("POS_SAT_RES_SERIE"),
                  localStorage.getItem("POS_SAT_RESOLUTION"),
                  detalle,
                  pReasonID,
                  isPaidConsignment,
                  imgConsignment,
                  2,
                  results.rows.item(0).IS_FROM_DELIVERY_NOTE
                );

                pCurrentNoteID -= 1;

                gHeaderSerial = "";

                if (xrow_len >= 1) {
                  pSQL =
                    "INSERT INTO INVOICE_HEADER(INVOICE_NUM, TERMS, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS, IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES, POSTED_DATETIME, VOID_INVOICE_ID, CHANGE, IS_POSTED_VALIDATED, IS_FROM_DELIVERY_NOTE) ";
                  pSQL +=
                    " VALUES(" +
                    pCurrentNoteID +
                    ",'CASH','" +
                    results.rows.item(0).CLIENT_ID +
                    "','" +
                    results.rows.item(0).CLIENT_NAME +
                    "', '" +
                    gCurrentRoute +
                    "',";
                  pSQL +=
                    "'" +
                    results.rows.item(0).GPS +
                    "'," +
                    results.rows.item(0).TOTAL_AMOUNT +
                    ",'', " +
                    results.rows.item(0).IS_POSTED +
                    ", 0, 1,'" +
                    pReasonID +
                    "',";
                  pSQL +=
                    "'" +
                    pVoidNotes +
                    "','" +
                    getDateTime() +
                    "'," +
                    results.rows.item(0).INVOICE_NUM +
                    "," +
                    results.rows.item(0).CHANGE +
                    ", 2, " +
                    (results.rows.item(0).IS_FROM_DELIVERY_NOTE
                      ? results.rows.item(0).IS_FROM_DELIVERY_NOTE
                      : null) +
                    ")";

                  var pAmount = results.rows.item(0).TOTAL_AMOUNT;
                  var clientId = results.rows.item(0).CLIENT_ID;
                  var docSerieSource = results.rows.item(0).SAT_SERIE;
                  var docNumSource = results.rows.item(0).INVOICE_NUM;
                  tx.executeSql(
                    pSQL,
                    [],
                    function(tx, results) {
                      console.log(
                        "results.rowsAffected: " + results.rowsAffected
                      );
                      if (results.rowsAffected === 1) {
                        localStorage.setItem(
                          "POS_CURRENT_CREDIT_NOTE",
                          Number(pCurrentNoteID)
                        );

                        gTotalInvoiced -= Number(pAmount);
                        gTotalInvoicesProc--;

                        //pSQL = "UPDATE SKU SET ON_HAND = (ON_HAND + " +

                        localStorage.setItem(
                          "POS_TOTAL_INVOICED",
                          gTotalInvoiced
                        );
                        localStorage.setItem(
                          "POS_TOTAL_INVOICES_PROC",
                          gTotalInvoicesProc
                        );

                        $("#lblTotalInvoices").text(gTotalInvoicesProc);
                        $("#lblSold").text(
                          currencySymbol +
                            " " +
                            format_number(
                              gTotalInvoiced,
                              parseInt(
                                localStorage.getItem("DEFAULT_DISPLAY_DECIMALS")
                              )
                            )
                        );

                        DuplicateInvoiceDetail_Void(
                          pInvoiceID,
                          pReasonID,
                          pVoidNotes,
                          isPaidConsignment
                        );

                        if (isPaidConsignment === 1) {
                          PagoConsignacionesServicio.CalcularFechaDeVencimientoDeReconsignacion(
                            function(fechaVencimientoCalculada) {
                              PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(
                                SecuenciaDeDocumentoTipo.Reconsignacion,
                                function(serie, numero) {
                                  var consignacionEncabezado = {
                                    ConsignmentId: ObtenerSiguienteNumeroDeConsignacion(),
                                    CustomerId: clientId,
                                    DateCreate: getDateTime().toString(),
                                    DateUpdate: null,
                                    Status: "ACTIVE",
                                    PostedBy: gLastLogin,
                                    IsPosted: 0,
                                    Pos_terminal: gCurrentRoute,
                                    Gps: gCurrentGPS,
                                    DocDate: getDateTime().toString(),
                                    ClosedRouteDateTime: null,
                                    IsActiveRoute: 1,
                                    DueDate: fechaVencimientoCalculada,
                                    ConsignmentBoNum: null,
                                    DocSerie: serie,
                                    DocNum: numero,
                                    Image: imgConsignment,
                                    IsClosed: 0,
                                    IsReconsign: 1,
                                    InRoute: 1,
                                    TotalAmount: pAmount
                                  };

                                  var consignacionId =
                                    consignacionEncabezado.ConsignmentId;
                                  InsertarConsignacionEncabezado(
                                    consignacionEncabezado,
                                    function() {
                                      PagoConsignacionesServicio.ActualizarDetalleDeReconsignacion(
                                        consignacionId,
                                        function() {
                                          PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(
                                            SecuenciaDeDocumentoTipo.Reconsignacion,
                                            numero,
                                            function() {
                                              for (
                                                var i = 0;
                                                i < detalle.rows.length;
                                                i++
                                              ) {
                                                window.AgregarTrazabilidad(
                                                  consignacionId,
                                                  docSerieSource,
                                                  docNumSource,
                                                  detalle.rows.item(i).SKU,
                                                  detalle.rows.item(i).QTY,
                                                  ConsignmentPaymentOptions.ReConsignar,
                                                  serie,
                                                  numero,
                                                  getDateTime().toString(),
                                                  function() {
                                                    clientId = null;
                                                    EnviarData();
                                                  },
                                                  function(err) {
                                                    notify(err);
                                                  }
                                                );
                                              }
                                            },
                                            function(error) {
                                              notify(error);
                                            }
                                          );
                                        },
                                        function(error) {
                                          notify(error);
                                        }
                                      );
                                    },
                                    function(error) {
                                      notify(error);
                                    }
                                  );
                                },
                                function(error) {
                                  notify(error);
                                }
                              );
                            },
                            function(error) {
                              console.log(error);
                              notify(error);
                            }
                          );
                        }
                        listallinvoices();

                        my_dialog("", "", "close");
                      } else {
                        notify("ERROR, 9.1.0: No se actualizo correctamente");
                        pCurrentNoteID += 1;
                        localStorage.setItem(
                          "POS_CURRENT_CREDIT_NOTE",
                          Number(pCurrentNoteID)
                        );
                      }
                    },
                    function(tx, err) {
                      alert("ERROR, 7.1.2:" + err.code);
                      console.log("err.code:" + err.code);
                      my_dialog("", "", "close");
                      notify(err);
                      my_dialog("", "", "close");
                    }
                  );
                  my_dialog("", "", "close");
                }
              },
              function(err) {
                notify(err.Message);
                my_dialog("", "", "close");
              }
            );
          },
          function(err) {
            my_dialog("", "", "close");
            pCurrentNoteID += 1;
            localStorage.setItem("POS_CURRENT_CREDIT_NOTE", pCurrentNoteID);
            if (err.code !== 0) {
              alert("ERROR, 8.2.4: " + err.code);
            }
          }
        );
      },
      function(err) {
        my_dialog("", "", "close");
        pCurrentNoteID += 1;
        localStorage.setItem("POS_CURRENT_CREDIT_NOTE", pCurrentNoteID);
        if (err.code !== 0) {
          alert("ERROR, 8.2.4: " + err.code);
        }
      }
    );
  } catch (e) {
    my_dialog("", "", "close");
    pCurrentNoteID += 1;
    localStorage.setItem("POS_CURRENT_CREDIT_NOTE", pCurrentNoteID);
    notify("ERROR, 01.02.03: " + e.message);
  }
}
function PopulateVoidReasons() {
  var xchild_list = 0;
  try {
    xchild_list = $("#cmbVoidReason").children().length;
  } catch (e) {
    notify(e.message);
  }

  if (xchild_list === 0) {
    //my_dialog("Cargando motivos de devolucion", "Espere...", "open");

    SONDA_DB_Session.transaction(
      function(tx) {
        var pDoc = "";
        var pImg = "";

        tx.executeSql(
          "SELECT * FROM VOID_REASONS",
          [],
          function(tx, results) {
            $("#cmbVoidReason")
              .children()
              .remove("option");
            var xskus_len = results.rows.length - 1;

            for (i = 0; i <= xskus_len; i++) {
              try {
                vLI = "";
                vLI =
                  '<option value="' +
                  results.rows.item(i).REASON_ID +
                  '">' +
                  results.rows.item(i).REASON_DESCRIPTION +
                  "</option>";

                $("#cmbVoidReason").append(vLI);
              } catch (e) {
                notiy(e.message);
              }
            }
            $("#cmbVoidReason").selectmenu("refresh");
            my_dialog("", "", "close");
          },
          function(err) {
            my_dialog("", "", "close");
            if (err.code !== 0) {
              alert("Error processing SQL: " + err.code);
            }
          }
        );
      },
      function(err) {
        notify("ERROR, " + err.code);

        if (err.code !== 0) {
          alert("Error processing SQL: " + err.code);
        }
      }
    );
  }
  my_dialog("", "", "close");
}
function GetVoidReasons() {
  try {
    var data = {
      routeid: gCurrentRoute,
      dbuser: gdbuser,
      dbuserpass: gdbuserpass
    };
    SocketControlador.socketIo.emit("getvoidreasons", data);
    my_dialog("", "", "close");
  } catch (e) {
    notify(e.message);
  }
}
function SetCF() {
  $("#txtNIT").val("CF");
  $("#txtNombre").val("Consumidor Final");
}
function ConfirmPostInvoice() {
  try {
    var efectivo =
      clienteProcesadoConInformacionDeCuentaCorriente.invoiceHasCredit &&
      clienteProcesadoConInformacionDeCuentaCorriente.totalInvoicedIsOnCredit
        ? 0
        : document.getElementById("txtCash_summ").value;

    if (
      efectivo !== "" ||
      clienteProcesadoConInformacionDeCuentaCorriente.totalInvoicedIsOnCredit
    ) {
      if (
        !isNaN(efectivo) ||
        clienteProcesadoConInformacionDeCuentaCorriente.totalInvoicedIsOnCredit
      ) {
        if (gPagado == 1) {
          SONDA_DB_Session.transaction(
            function(tx) {
              var vLI = "";

              tx.executeSql(
                "SELECT * FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND REQUERIES_SERIE = 1 AND (SERIE = 0 )",
                [],
                function(tx, results) {
                  my_dialog("", "", "close");
                  if (results.rows.length === 0) {
                    if (gImageURI_1.length > 0) {
                      if (
                        parseInt(efectivo) === 0 &&
                        facturaCompletaEnConsignacion === true &&
                        !clienteProcesadoConInformacionDeCuentaCorriente.totalInvoicedIsOnCredit
                      ) {
                        navigator.notification.confirm(
                          "Esta seguro de Grabar la Consignación actual?",
                          function(buttonIndex) {
                            if (buttonIndex === 2) {
                              InteraccionConUsuarioServicio.bloquearPantalla();
                              actualizarEstadoDeTarea(
                                gTaskId,
                                1,
                                "Genero Gestion",
                                function() {
                                  LimpiarFacturaOriginal(
                                    window.gSkuList,
                                    function() {
                                      UsuarioDeseaGrabarConsignacion(function(
                                        conConsignacion
                                      ) {
                                        InteraccionConUsuarioServicio.desbloquearPantalla();
                                        $.mobile.changePage(
                                          "#confirmation_consignment",
                                          {
                                            transition: "slide",
                                            reverse: true,
                                            changeHash: true,
                                            showLoadMsg: false
                                          }
                                        );
                                        efectivo = null;
                                      });
                                    }
                                  );
                                },
                                TareaEstado.Completada
                              );
                            } else {
                              estaEnConfirmacionDeFacturacion = false;
                            }
                          },
                          "Sonda SD " + SondaVersion,
                          ["No", "Si"]
                        );
                      } else if (
                        parseInt(efectivo) === 0 &&
                        facturaCompletaEnConsignacion === false &&
                        !clienteProcesadoConInformacionDeCuentaCorriente.totalInvoicedIsOnCredit
                      ) {
                        notify(
                          "Debe de ingresar la cantidad de efectivo correspondiente al Total de la Factura..."
                        );
                        document.getElementById("txtCash_summ").focus();
                        efectivo = null;
                        estaEnConfirmacionDeFacturacion = false;
                      } else if (
                        parseInt(efectivo) > 0 &&
                        facturaCompletaEnConsignacion === true &&
                        !clienteProcesadoConInformacionDeCuentaCorriente.totalInvoicedIsOnCredit
                      ) {
                        notify(
                          "Por favor, deje la casilla de Efectivo con Valor Cero ('0').\r\n Debido a que la Factura Completa está en consignación"
                        );
                        document.getElementById("txtCash_summ").focus();
                        efectivo = null;
                        estaEnConfirmacionDeFacturacion = false;
                      } else if (
                        (parseInt(efectivo) > 0 &&
                          facturaCompletaEnConsignacion === false) ||
                        (parseInt(efectivo) === 0 &&
                          facturaCompletaEnConsignacion === false &&
                          clienteProcesadoConInformacionDeCuentaCorriente.totalInvoicedIsOnCredit)
                      ) {
                        navigator.notification.confirm(
                          "¿Confirma facturar?",
                          function(buttonIndex) {
                            if (buttonIndex === 2) {
                              InteraccionConUsuarioServicio.bloquearPantalla();
                              actualizarEstadoDeTarea(
                                gTaskId,
                                1,
                                "Genero Gestion",
                                function() {
                                  my_dialog(
                                    "Factura",
                                    "Procesando...",
                                    "close"
                                  );

                                  LimpiarFacturaOriginal(
                                    window.gSkuList,
                                    function() {
                                      AgregarNuevosSkusAFactura(
                                        window.gSkuList,
                                        function() {
                                          UsuarioDeseaGrabarConsignacion(
                                            function(conConsignacion) {
                                              PostInvoice(conConsignacion);

                                              if (
                                                PagoConsignacionesControlador.EstaEnPagoDeConsignacion
                                              ) {
                                                //Si tiene algun producto o productos reconsignado(s) debe realizar el proceso de Reconsignacion...
                                                if (
                                                  PagoConsignacionesControlador.TotalReconsignado >
                                                  0
                                                ) {
                                                  PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(
                                                    SecuenciaDeDocumentoTipo.Reconsignacion,
                                                    function(tieneSecuencia) {
                                                      if (tieneSecuencia) {
                                                        var procesaConsignacion = function(
                                                          fecha
                                                        ) {
                                                          PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(
                                                            SecuenciaDeDocumentoTipo.Reconsignacion,
                                                            function(
                                                              serie,
                                                              numero
                                                            ) {
                                                              var consignacionEncabezado = {
                                                                ConsignmentId: ObtenerSiguienteNumeroDeConsignacion(),
                                                                CustomerId: gClientCode,
                                                                DateCreate: getDateTime().toString(),
                                                                DateUpdate: null,
                                                                Status:
                                                                  "ACTIVE",
                                                                PostedBy: gCurrentRoute,
                                                                IsPosted: 0,
                                                                Pos_terminal: gCurrentRoute,
                                                                Gps: gCurrentGPS,
                                                                DocDate: getDateTime().toString(),
                                                                ClosedRouteDateTime: null,
                                                                IsActiveRoute: 1,
                                                                DueDate: fecha.toString(),
                                                                ConsignmentBoNum: null,
                                                                DocSerie: serie,
                                                                DocNum: numero,
                                                                Image:
                                                                  PagoConsignacionesControlador.imagenProductoReconsignado,
                                                                IsClosed: 0,
                                                                IsReconsign: 1,
                                                                InRoute: 1,
                                                                TotalAmount:
                                                                  PagoConsignacionesControlador.TotalReconsignado
                                                              };
                                                              window.consignacion.encabezado = consignacionEncabezado;
                                                              var consignacionId =
                                                                consignacionEncabezado.ConsignmentId;
                                                              InsertarConsignacionEncabezado(
                                                                consignacionEncabezado,
                                                                function() {
                                                                  PagoConsignacionesServicio.ActualizarDetalleDeReconsignacion(
                                                                    consignacionId,
                                                                    function() {
                                                                      PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(
                                                                        SecuenciaDeDocumentoTipo.Reconsignacion,
                                                                        numero,
                                                                        function() {
                                                                          PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                            ConsignmentPaymentOptions.ReConsignar,
                                                                            serie,
                                                                            numero,
                                                                            function() {
                                                                              if (
                                                                                PagoConsignacionesControlador.TotalRecogido >
                                                                                0
                                                                              ) {
                                                                                PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(
                                                                                  SecuenciaDeDocumentoTipo.RecogerInventario,
                                                                                  function(
                                                                                    serie2,
                                                                                    numero2
                                                                                  ) {
                                                                                    CantidadSkuARecogerProductoEnConsignacionControlador.UltimoDocumentoDeRecoleccion = numero2;
                                                                                    var recollecionEncabezado = {
                                                                                      SKU_COLLECTED_ID:
                                                                                        numero2 *
                                                                                        -1,
                                                                                      CUSTOMER_ID: gClientCode,
                                                                                      DOC_SERIE: serie2,
                                                                                      DOC_NUM: numero2,
                                                                                      CODE_ROUTE: gCurrentRoute,
                                                                                      GPS_URL: gCurrentGPS,
                                                                                      LAST_UPDATE: getDateTime(),
                                                                                      LAST_UPDATE_BY: gLastLogin,
                                                                                      TOTAL_AMOUNT:
                                                                                        PagoConsignacionesControlador.TotalRecogido,
                                                                                      IS_POSTED: 0,
                                                                                      IMG_1:
                                                                                        PagoConsignacionesControlador
                                                                                          .FotografiasDeRecollecionDeInventario[0],
                                                                                      IMG_2:
                                                                                        PagoConsignacionesControlador
                                                                                          .FotografiasDeRecollecionDeInventario[1],
                                                                                      IMG_3:
                                                                                        PagoConsignacionesControlador
                                                                                          .FotografiasDeRecollecionDeInventario[2]
                                                                                    };
                                                                                    RecogerProductoEnConsignacionServicio.InsertarEncabezadoDeRecollecionDeInventarioEnConsignacion(
                                                                                      recollecionEncabezado,
                                                                                      function(
                                                                                        encabezado
                                                                                      ) {
                                                                                        RecogerProductoEnConsignacionServicio.ActualizarDetalleDeRecollecion(
                                                                                          encabezado,
                                                                                          function() {
                                                                                            PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(
                                                                                              SecuenciaDeDocumentoTipo.RecogerInventario,
                                                                                              numero2,
                                                                                              function() {
                                                                                                PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(
                                                                                                  function() {
                                                                                                    PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                                                      ConsignmentPaymentOptions.Recoger,
                                                                                                      serie2,
                                                                                                      numero2,
                                                                                                      function() {
                                                                                                        if (
                                                                                                          PagoConsignacionesControlador.totalEfectivo >
                                                                                                          0
                                                                                                        ) {
                                                                                                          PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                                                            ConsignmentPaymentOptions.Pagado,
                                                                                                            pCurrentSAT_Res_Serie,
                                                                                                            parseInt(
                                                                                                              gInvoiceNUM
                                                                                                            ),
                                                                                                            function() {
                                                                                                              EnviarData();
                                                                                                              document.getElementById(
                                                                                                                "DivUiListaConsignacionesAPagar"
                                                                                                              ).style.display =
                                                                                                                "block";
                                                                                                              document.getElementById(
                                                                                                                "DivUiListaDetalleDeConsignacionAPagar"
                                                                                                              ).style.display =
                                                                                                                "none";
                                                                                                              window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                                              //PagoConsignacionesControlador.EstaEnDetalle = false;
                                                                                                              //PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                                                                                                              if (
                                                                                                                PagoConsignacionesControlador
                                                                                                                  .FotografiasDeRecollecionDeInventario
                                                                                                                  .length >
                                                                                                                0
                                                                                                              ) {
                                                                                                                PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                                              }
                                                                                                            },
                                                                                                            function(
                                                                                                              error
                                                                                                            ) {
                                                                                                              notify(
                                                                                                                error
                                                                                                              );
                                                                                                            }
                                                                                                          );
                                                                                                        } else {
                                                                                                          EnviarData();
                                                                                                          document.getElementById(
                                                                                                            "DivUiListaConsignacionesAPagar"
                                                                                                          ).style.display =
                                                                                                            "block";
                                                                                                          document.getElementById(
                                                                                                            "DivUiListaDetalleDeConsignacionAPagar"
                                                                                                          ).style.display =
                                                                                                            "none";
                                                                                                          window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                                          //PagoConsignacionesControlador.EstaEnDetalle = false;
                                                                                                          //PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                                                                                                          if (
                                                                                                            PagoConsignacionesControlador
                                                                                                              .FotografiasDeRecollecionDeInventario
                                                                                                              .length >
                                                                                                            0
                                                                                                          ) {
                                                                                                            PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                                          }
                                                                                                        }
                                                                                                      },
                                                                                                      function(
                                                                                                        error
                                                                                                      ) {
                                                                                                        notify(
                                                                                                          error
                                                                                                        );
                                                                                                      }
                                                                                                    );
                                                                                                  },
                                                                                                  function(
                                                                                                    error
                                                                                                  ) {
                                                                                                    notify(
                                                                                                      error
                                                                                                    );
                                                                                                  }
                                                                                                );
                                                                                              },
                                                                                              function(
                                                                                                error
                                                                                              ) {
                                                                                                notify(
                                                                                                  error
                                                                                                );
                                                                                              }
                                                                                            );
                                                                                          },
                                                                                          function(
                                                                                            error
                                                                                          ) {
                                                                                            notify(
                                                                                              error
                                                                                            );
                                                                                          }
                                                                                        );
                                                                                      },
                                                                                      function(
                                                                                        error
                                                                                      ) {
                                                                                        notify(
                                                                                          error
                                                                                        );
                                                                                      }
                                                                                    );
                                                                                  },
                                                                                  function(
                                                                                    error
                                                                                  ) {
                                                                                    notify(
                                                                                      error
                                                                                    );
                                                                                  }
                                                                                );
                                                                              } else {
                                                                                PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(
                                                                                  function() {
                                                                                    if (
                                                                                      PagoConsignacionesControlador.totalEfectivo >
                                                                                      0
                                                                                    ) {
                                                                                      PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                                        ConsignmentPaymentOptions.Pagado,
                                                                                        pCurrentSAT_Res_Serie,
                                                                                        parseInt(
                                                                                          gInvoiceNUM
                                                                                        ),
                                                                                        function() {
                                                                                          EnviarData();
                                                                                          document.getElementById(
                                                                                            "DivUiListaConsignacionesAPagar"
                                                                                          ).style.display =
                                                                                            "block";
                                                                                          document.getElementById(
                                                                                            "DivUiListaDetalleDeConsignacionAPagar"
                                                                                          ).style.display =
                                                                                            "none";
                                                                                          window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                          if (
                                                                                            PagoConsignacionesControlador
                                                                                              .FotografiasDeRecollecionDeInventario
                                                                                              .length >
                                                                                            0
                                                                                          ) {
                                                                                            PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                          }
                                                                                        },
                                                                                        function(
                                                                                          error
                                                                                        ) {
                                                                                          notify(
                                                                                            error
                                                                                          );
                                                                                        }
                                                                                      );
                                                                                    } else {
                                                                                      EnviarData();
                                                                                      document.getElementById(
                                                                                        "DivUiListaConsignacionesAPagar"
                                                                                      ).style.display =
                                                                                        "block";
                                                                                      document.getElementById(
                                                                                        "DivUiListaDetalleDeConsignacionAPagar"
                                                                                      ).style.display =
                                                                                        "none";
                                                                                      window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                      //PagoConsignacionesControlador.EstaEnDetalle = false;
                                                                                      //PagoConsignacionesControlador.EstaEnPagoDeConsignacion = false;
                                                                                      if (
                                                                                        PagoConsignacionesControlador
                                                                                          .FotografiasDeRecollecionDeInventario
                                                                                          .length >
                                                                                        0
                                                                                      ) {
                                                                                        PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                      }
                                                                                    }
                                                                                  },
                                                                                  function(
                                                                                    error
                                                                                  ) {
                                                                                    notify(
                                                                                      error
                                                                                    );
                                                                                  }
                                                                                );
                                                                              }
                                                                            },
                                                                            function(
                                                                              error
                                                                            ) {
                                                                              notify(
                                                                                error
                                                                              );
                                                                            }
                                                                          );
                                                                        },
                                                                        function(
                                                                          error
                                                                        ) {
                                                                          notify(
                                                                            error
                                                                          );
                                                                        }
                                                                      );
                                                                    },
                                                                    function(
                                                                      error
                                                                    ) {
                                                                      notify(
                                                                        error
                                                                      );
                                                                    }
                                                                  );
                                                                }
                                                              );
                                                            },
                                                            function(error) {
                                                              notify(error);
                                                            }
                                                          );
                                                        };
                                                        PagoConsignacionesServicio.ObtenerFechaDeVencimientoDeReconsignaciones(
                                                          function(
                                                            fechaVencimiento
                                                          ) {
                                                            if (
                                                              fechaVencimiento ===
                                                                null ||
                                                              fechaVencimiento ===
                                                                ""
                                                            ) {
                                                              PagoConsignacionesServicio.CalcularFechaDeVencimientoDeReconsignacion(
                                                                function(
                                                                  fechaVencimientoCalculada
                                                                ) {
                                                                  procesaConsignacion(
                                                                    fechaVencimientoCalculada
                                                                  );
                                                                },
                                                                function(
                                                                  error
                                                                ) {
                                                                  console.log(
                                                                    error
                                                                  );
                                                                  notify(error);
                                                                }
                                                              );
                                                            } else {
                                                              procesaConsignacion(
                                                                fechaVencimiento
                                                              );
                                                            }
                                                          },
                                                          function(error) {
                                                            notify(error);
                                                          }
                                                        );
                                                      } else {
                                                        notify(
                                                          "Usted no cuenta con Secuencia de Documentos de Reconsignación, por favor, comuníquese con su Administrador de Sonda."
                                                        );
                                                      }
                                                    },
                                                    function(error) {
                                                      notify(error);
                                                    }
                                                  );
                                                } else if (
                                                  PagoConsignacionesControlador.TotalRecogido >
                                                  0
                                                ) {
                                                  //Si recogio productos de consignaciones, guarda el documento de devolucion de inventario
                                                  PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(
                                                    SecuenciaDeDocumentoTipo.RecogerInventario,
                                                    function(serie, numero) {
                                                      CantidadSkuARecogerProductoEnConsignacionControlador.UltimoDocumentoDeRecoleccion = numero;
                                                      var recollecionEncabezado = {
                                                        SKU_COLLECTED_ID:
                                                          numero * -1,
                                                        CUSTOMER_ID: gClientCode,
                                                        DOC_SERIE: serie,
                                                        DOC_NUM: numero,
                                                        CODE_ROUTE: gCurrentRoute,
                                                        GPS_URL: gCurrentGPS,
                                                        LAST_UPDATE: getDateTime(),
                                                        LAST_UPDATE_BY: gLastLogin,
                                                        TOTAL_AMOUNT:
                                                          PagoConsignacionesControlador.TotalRecogido,
                                                        IS_POSTED: 0,
                                                        IMG_1:
                                                          PagoConsignacionesControlador
                                                            .FotografiasDeRecollecionDeInventario[0],
                                                        IMG_2:
                                                          PagoConsignacionesControlador
                                                            .FotografiasDeRecollecionDeInventario[1],
                                                        IMG_3:
                                                          PagoConsignacionesControlador
                                                            .FotografiasDeRecollecionDeInventario[2]
                                                      };
                                                      RecogerProductoEnConsignacionServicio.InsertarEncabezadoDeRecollecionDeInventarioEnConsignacion(
                                                        recollecionEncabezado,
                                                        function(encabezado) {
                                                          RecogerProductoEnConsignacionServicio.ActualizarDetalleDeRecollecion(
                                                            encabezado,
                                                            function() {
                                                              PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(
                                                                SecuenciaDeDocumentoTipo.RecogerInventario,
                                                                numero,
                                                                function() {
                                                                  PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(
                                                                    function() {
                                                                      PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                        ConsignmentPaymentOptions.Recoger,
                                                                        serie,
                                                                        numero,
                                                                        function() {
                                                                          if (
                                                                            PagoConsignacionesControlador.totalEfectivo >
                                                                            0
                                                                          ) {
                                                                            PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                                              ConsignmentPaymentOptions.Pagado,
                                                                              pCurrentSAT_Res_Serie,
                                                                              parseInt(
                                                                                gInvoiceNUM
                                                                              ),
                                                                              function() {
                                                                                EnviarData();
                                                                                document.getElementById(
                                                                                  "DivUiListaConsignacionesAPagar"
                                                                                ).style.display =
                                                                                  "block";
                                                                                document.getElementById(
                                                                                  "DivUiListaDetalleDeConsignacionAPagar"
                                                                                ).style.display =
                                                                                  "none";
                                                                                window.consignacionesEnProcedimientoDePago.length = 0;
                                                                                if (
                                                                                  PagoConsignacionesControlador
                                                                                    .FotografiasDeRecollecionDeInventario
                                                                                    .length >
                                                                                  0
                                                                                ) {
                                                                                  PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                                }
                                                                              },
                                                                              function(
                                                                                error
                                                                              ) {
                                                                                notify(
                                                                                  error
                                                                                );
                                                                              }
                                                                            );
                                                                          } else {
                                                                            EnviarData();
                                                                            document.getElementById(
                                                                              "DivUiListaConsignacionesAPagar"
                                                                            ).style.display =
                                                                              "block";
                                                                            document.getElementById(
                                                                              "DivUiListaDetalleDeConsignacionAPagar"
                                                                            ).style.display =
                                                                              "none";
                                                                            window.consignacionesEnProcedimientoDePago.length = 0;
                                                                            if (
                                                                              PagoConsignacionesControlador
                                                                                .FotografiasDeRecollecionDeInventario
                                                                                .length >
                                                                              0
                                                                            ) {
                                                                              PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                                            }
                                                                          }
                                                                        },
                                                                        function(
                                                                          error
                                                                        ) {
                                                                          notify(
                                                                            error
                                                                          );
                                                                        }
                                                                      );
                                                                    },
                                                                    function(
                                                                      error
                                                                    ) {
                                                                      notify(
                                                                        error
                                                                      );
                                                                    }
                                                                  );
                                                                },
                                                                function(
                                                                  error
                                                                ) {
                                                                  notify(error);
                                                                }
                                                              );
                                                            },
                                                            function(error) {
                                                              notify(error);
                                                            }
                                                          );
                                                        },
                                                        function(error) {
                                                          notify(error);
                                                        }
                                                      );
                                                    },
                                                    function(error) {
                                                      notify(error);
                                                    }
                                                  );
                                                } else if (
                                                  PagoConsignacionesControlador.totalEfectivo >
                                                  0
                                                ) {
                                                  PagoConsignacionesControlador.CambiarEstadoDeConsignacionesPagadas(
                                                    function() {
                                                      PagoConsignacionesControlador.ActualizarNumeroDeDocumentoYSerieDeHistoricoDeTrazabilidad(
                                                        ConsignmentPaymentOptions.Pagado,
                                                        pCurrentSAT_Res_Serie,
                                                        parseInt(gInvoiceNUM),
                                                        function() {
                                                          EnviarData();
                                                          window.consignacionesEnProcedimientoDePago.length = 0;
                                                          if (
                                                            PagoConsignacionesControlador
                                                              .FotografiasDeRecollecionDeInventario
                                                              .length > 0
                                                          ) {
                                                            PagoConsignacionesControlador.FotografiasDeRecollecionDeInventario.length = 0;
                                                          }
                                                        },
                                                        function(error) {
                                                          notify(error);
                                                        }
                                                      );
                                                    },
                                                    function(error) {
                                                      notify(error);
                                                    }
                                                  );
                                                }
                                              }
                                              efectivo = null;
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                },
                                TareaEstado.Completada
                              );
                            } else {
                              estaEnConfirmacionDeFacturacion = false;
                            }
                          },
                          "Sonda® SD " + SondaVersion,
                          ["No", "Si"]
                        );
                      }
                    } else {
                      efectivo = null;
                      notify("ERROR, Aun Debe tomar la imagen frontal");
                      estaEnConfirmacionDeFacturacion = false;
                    }
                  } else {
                    efectivo = null;
                    notify(
                      "ERROR, Aun Debe ingresar la información de series/imei"
                    );
                    estaEnConfirmacionDeFacturacion = false;
                  }
                },
                function(err) {
                  if (err.code !== 0) {
                    alert("Error processing SQL: " + err.code);
                  }
                  pReturnValue = -2;
                  estaEnConfirmacionDeFacturacion = false;
                  return pReturnValue;
                }
              );
            },
            function(err) {
              if (err.code !== 0) {
                alert("Error processing SQL: " + err.code);
              }
              pReturnValue = -3;
              estaEnConfirmacionDeFacturacion = false;
              return pReturnValue;
            }
          );
        } else {
          notify(
            "ERROR, Debe cancelar la totalidad de la factura: " +
              currencySymbol +
              ". " +
              format_number(gInvocingTotal, 2)
          );
          efectivo = null;
          estaEnConfirmacionDeFacturacion = false;
        }
      } else {
        notify("ERROR, Debe de ingresar un valor numerico");
        efectivo = null;
        estaEnConfirmacionDeFacturacion = false;
      }
    } else {
      if (PagoConsignacionesControlador.EstaEnPagoDeConsignacion) {
        notify("ERROR, Debe de ingresar la cantidad de efectivo.");
      } else {
        notify(
          "ERROR, Debe de ingresar la cantidad de efectivo o cero si dejo todo en consignacion."
        );
      }

      efectivo = null;
      estaEnConfirmacionDeFacturacion = false;
    }
  } catch (e) {
    notify("ConfirmPostInvoice: " + e.message);
    estaEnConfirmacionDeFacturacion = false;
  }
}

function GrabarNotaDeEntrega(callback, errorCallback) {
  try {
    if (esFacturaDeEntrega) {
      if (ValidarDemandaDeDespachoEnProcesoDeEntrega()) {
        ProcesarDocumentoDeEntrega(
          function(notaEntrega) {
            PagoConsignacionesServicio.ActualizarSecuenciaDeDocumentos(
              SecuenciaDeDocumentoTipo.NotaDeEntrega,
              notaEntrega.docNum,
              function() {
                callback();
              },
              function(error) {
                errorCallback({
                  codigo: -1,
                  resultado: ResultadoOperacionTipo.Error,
                  mensaje: error
                });
              }
            );
          },
          function(error) {
            errorCallback({
              codigo: -1,
              resultado: ResultadoOperacionTipo.Error,
              mensaje: error
            });
          }
        );
      } else {
        errorCallback({
          codigo: -1,
          resultado: ResultadoOperacionTipo.Error,
          mensaje:
            "El documento en proceso de entrega no tiene detalle, por favor, verifique y vuelva a intentar"
        });
      }
    } else {
      callback();
    }
  } catch (e) {
    errorCallback({
      codigo: -1,
      resultado: ResultadoOperacionTipo.Error,
      mensaje: e.message
    });
  }
}

function ValidarDemandaDeDespachoEnProcesoDeEntrega() {
  return esEntregaConsolidada || esEntregaParcial
    ? true
    : demandaDeDespachoEnProcesoDeEntrega.detalleDeDemandaDeDespacho.length > 0;
}

function ProcesarDocumentoDeEntrega(callback, errorCallback) {
  PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(
    SecuenciaDeDocumentoTipo.NotaDeEntrega,
    function(secuenciaValida) {
      if (secuenciaValida) {
        PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(
          SecuenciaDeDocumentoTipo.NotaDeEntrega,
          function(docSerie, docNum) {
            var notaDeEntregaServicio = new NotaDeEntregaServicio();

            var notaDeEntregaEncabezado = new NotaDeEntregaEncabezado();

            var usuarioFacturaEnRuta = localStorage.getItem("INVOICE_IN_ROUTE")
              ? parseInt(localStorage.getItem("INVOICE_IN_ROUTE"))
              : 0;

            notaDeEntregaEncabezado.deliveryNoteId = docNum * -1;
            notaDeEntregaEncabezado.docSerie = docSerie;
            notaDeEntregaEncabezado.docNum = docNum;
            notaDeEntregaEncabezado.codeCustomer = gClientCode;
            notaDeEntregaEncabezado.deliveryNoteIdHh = docNum * -1;
            notaDeEntregaEncabezado.totalAmount = gInvocingTotalToSave;
            notaDeEntregaEncabezado.isPosted = EstadoEnvioDoc.NoEnviado;
            notaDeEntregaEncabezado.createdDateTime = getDateTime();
            notaDeEntregaEncabezado.taskId = gTaskId;
            notaDeEntregaEncabezado.invoiceId =
              usuarioFacturaEnRuta == SiNo.Si
                ? gInvoiceNUM
                : demandaDeDespachoEnProcesoDeEntrega &&
                  demandaDeDespachoEnProcesoDeEntrega.erpReferenceDocNum
                ? demandaDeDespachoEnProcesoDeEntrega.erpReferenceDocNum
                : null;
            notaDeEntregaEncabezado.deliveryImage =
              imagenDeEntregaControlador.imagenesCapturadas[0] || null;
            notaDeEntregaEncabezado.deliveryImage2 =
              imagenDeEntregaControlador.imagenesCapturadas[1] || null;
            notaDeEntregaEncabezado.deliveryImage3 =
              imagenDeEntregaControlador.imagenesCapturadas[2] || null;
            notaDeEntregaEncabezado.deliveryImage4 =
              imagenDeEntregaControlador.imagenesCapturadas[3] || null;
            notaDeEntregaEncabezado.billedFromSonda = usuarioFacturaEnRuta;
            notaDeEntregaEncabezado.discount = gDiscount;
            notaDeEntregaEncabezado.deliverySignature =
              firmaControlador.firmaCapturada || null;

            notaDeEntregaServicio.obtenerDocumentoDeNotaDeEntregaConDetalleParaGuardar(
              notaDeEntregaEncabezado,
              function(notaDeEntregaParaGuardar) {
                //TODO:insertar nota de entrega
                notaDeEntregaServicio.insertarNotaDeEntrega(
                  notaDeEntregaParaGuardar,
                  callback,
                  function(resultado) {
                    errorCallback(
                      "Error al intentar guardar la nota de entrega debido a: " +
                        resultado.mensaje
                    );
                  }
                );
              },
              function(error) {
                notify(
                  "No se ha podido obtener el detalle para la nota de entrega debido a: " +
                    error.mensaje
                );
              }
            );
          },
          function(error) {
            errorCallback(error);
          }
        );
      } else {
        errorCallback(
          "Usted no cuenta con secuencia de documentos válida para generar entregas, por favor, comuníquese con su administrador."
        );
      }
    },
    function(error) {
      errorCallback(error);
    }
  );
}

function UploadOfflinePhoto(pINVOICE_NUM, pIMG1, pIMG2, pIMG3) {}
function CheckforOffline() {
  try {
    $("#UiBtnSynDeviceOnServer").click();

    SONDA_DB_Session.transaction(
      function(tx) {
        var pSQL = "";
        pSQL =
          "SELECT * FROM INVOICE_HEADER WHERE IS_CREDIT_NOTE = 0 AND IS_POSTED = 0 AND STATUS <> 3 ORDER BY INVOICE_NUM";
        //console.log(pSQL);

        tx.executeSql(
          pSQL,
          [],
          function(tx, results) {
            for (var i = 0; i <= results.rows.length - 1; i++) {
              Process_SKUsToInvoice(
                results.rows.item(i).INVOICE_NUM,
                0,
                results.rows.item(i).AUTH_ID
              );
            }
          },
          function(err) {
            if (err.code !== 0) {
              alert("Error processing SQL: " + err.code);
            }
          }
        );
      },
      function(err) {
        if (err.code !== 0) {
          alert("Error processing SQL: " + err.code);
        }
      }
    );
  } catch (e) {
    notify("CheckforOffline: " + e.message);
    console.log("show invoices cath: " + e.message);
  }
}

function PostInvoice(conConsignacion) {
  var pTaxID = $("#txtNIT").val();
  var pCustName = $("#txtNombre").val();
  var pChange = $("#txtVuelto_summ").text();

  try {
    window.gInvoiceNUM = GetNextInvoiceID();

    var comentario = "N/A";
    var campoComentarioDeFactura = $("#UiInvoiceComment");

    if (campoComentarioDeFactura.val() !== "") {
      comentario = campoComentarioDeFactura.val();
      comentario = ValidadorCadenaServicio.removerCaracteresEspeciales(
        comentario
      );
    }

    if (window.gInvoiceNUM !== -1) {
      SONDA_DB_Session.transaction(
        function(tx) {
          var pSQL = "";
          var goalHeaderId = localStorage.getItem("GOAL_HEADER_ID")
            ? parseInt(localStorage.getItem("GOAL_HEADER_ID"))
            : null;

          pSQL =
            "UPDATE SKU_SERIES SET STATUS = 2 " +
            " WHERE SKU IN(SELECT SKU FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND REQUERIES_SERIE = 1 ) AND STATUS = 1";

          tx.executeSql(pSQL);

          pSQL =
            "UPDATE INVOICE_DETAIL SET INVOICE_NUM = " +
            window.gInvoiceNUM +
            ", IS_ACTIVE=1 WHERE INVOICE_NUM = -9999";

          tx.executeSql(pSQL);

          window.pCurrentSAT_Resolution = localStorage.getItem(
            "POS_SAT_RESOLUTION"
          );

          var consignacionActual = null;

          if (conConsignacion === 1) {
            consignacionActual =
              localStorage.getItem("POS_CURRENT_CONSIGNMENT_ID") * -1;

            var sql =
              "UPDATE CONSIGNMENT_HEADER SET INVOICE_SERIE = '" +
              pCurrentSAT_Res_Serie +
              "', INVOICE_NUM = " +
              window.gInvoiceNUM +
              "  WHERE CONSIGNMENT_ID = " +
              consignacionActual;

            tx.executeSql(sql);
          }
          var esPagoDeConsignacion = PagoConsignacionesControlador.EstaEnPagoDeConsignacion
            ? 1
            : 0;
          if (localStorage.getItem("IMPLEMENTS_FEL") === "true") {
            gInvoiceHeader = new FacturaEncabezado();
            gInvoiceHeader.invoiceNum = window.gInvoiceNUM;
            gInvoiceHeader.terms = "CASH";
            gInvoiceHeader.clientId = gClientCode;
            gInvoiceHeader.clientName = pCustName;
            gInvoiceHeader.posTerminal = gCurrentRoute;
            gInvoiceHeader.gps = gCurrentGPS;
            gInvoiceHeader.totalAmount = 0;
            gInvoiceHeader.erpInvoiceId = pTaxID;
            gInvoiceHeader.isPosted = 0;
            gInvoiceHeader.status = "1";
            gInvoiceHeader.isCreditNote = 0;
            gInvoiceHeader.voidReason = "";
            gInvoiceHeader.voidNotes = "";
            gInvoiceHeader.postedDateTime = getDateTime();
            gInvoiceHeader.printRequests = 1;
            gInvoiceHeader.printedCount = 0;
            gInvoiceHeader.authId = pCurrentSAT_Resolution;
            gInvoiceHeader.satSerie = pCurrentSAT_Res_Serie;
            gInvoiceHeader.change = parseFloat(pChange);
            gInvoiceHeader.img1 = gImageURI_1;
            gInvoiceHeader.img2 = gImageURI_2;
            gInvoiceHeader.img3 = gImageURI_3;
            gInvoiceHeader.consignmentId = 0;
            gInvoiceHeader.isPaidConsignment = esPagoDeConsignacion;
            gInvoiceHeader.initialTaskImage = gInitialTaskImage;
            gInvoiceHeader.inPlanRoute = gTaskOnRoutePlan;
            gInvoiceHeader.discount = gDiscount;
            gInvoiceHeader.comment = comentario;
            gInvoiceHeader.dueDate = clienteProcesadoConInformacionDeCuentaCorriente.canBuyOnCredit
              ? clienteProcesadoConInformacionDeCuentaCorriente.invoiceDueDate
              : null;
            gInvoiceHeader.creditAmount =
              clienteProcesadoConInformacionDeCuentaCorriente.creditAmount;
            gInvoiceHeader.cashAmount =
              clienteProcesadoConInformacionDeCuentaCorriente.cashAmount;
            gInvoiceHeader.paidToDate = 0;
            gInvoiceHeader.taskId = gTaskId;
            gInvoiceHeader.goalHeaderId = goalHeaderId;
            gInvoiceHeader.felData.FelDocumentType = localStorage.getItem(
              "FEL_DOCUMENT_TYPE"
            );
            gInvoiceHeader.felData.FelStablishmentCode = parseInt(
              localStorage.getItem("FEL_STABLISHMENT_CODE")
            );
            pTaxID = null;
            pCustName = null;
            pChange = null;
            esPagoDeConsignacion = null;
            window.gTaskOnRoutePlan = 1;

            gInvoiceHeader.handleTax = gCalculaImpuesto ? 1 : 0;
            gInvoiceHeader.taxPercent = gCalculaImpuesto
              ? window.gImpuestoDeFactura
              : 0;
            pSQL = "SELECT SUM(ID.TOTAL_LINE) AS TOTAL ";
            pSQL += "FROM INVOICE_DETAIL AS ID ";
            pSQL += "WHERE ID.INVOICE_NUM = " + gInvoiceNUM;
            tx.executeSql(
              pSQL,
              [],
              function(txRet, results) {
                if (results.rows.length > 0) {
                  gInvoiceHeader.totalAmount = results.rows.item(0).TOTAL;
                } else {
                  gInvoiceHeader.totalAmount = 0;
                }
              },
              function(txRet, error) {
                notify(
                  "Error al obtener total de detalle factura debido a: " +
                    error.message
                );
              }
            );
          } else {
            var sqlInvoice = [];
            sqlInvoice.push(
              "INSERT INTO INVOICE_HEADER(INVOICE_NUM, TERMS, CLIENT_ID, CLIENT_NAME, POS_TERMINAL, GPS, TOTAL_AMOUNT, ERP_INVOICE_ID, IS_POSTED, STATUS"
            );
            sqlInvoice.push(
              ", IS_CREDIT_NOTE, VOID_REASON, VOID_NOTES, POSTED_DATETIME, PRINT_REQUEST, PRINTED_COUNT, AUTH_ID, SAT_SERIE, CHANGE, IMG1"
            );
            sqlInvoice.push(
              ", IMG2, IMG3, CONSIGNMENT_ID, IS_PAID_CONSIGNMENT, INITIAL_TASK_IMAGE , IN_ROUTE_PLAN, DISCOUNT, COMMENT, DUE_DATE, CREDIT_AMOUNT, CASH_AMOUNT, PAID_TO_DATE"
            );
            sqlInvoice.push(", TASK_ID, GOAL_HEADER_ID)");
            sqlInvoice.push(" VALUES(");
            sqlInvoice.push(window.gInvoiceNUM);
            sqlInvoice.push(",'CASH','" + gClientCode + "'");
            sqlInvoice.push(",'" + pCustName + "'");
            sqlInvoice.push(", '" + gCurrentRoute + "'");
            sqlInvoice.push(",'" + gCurrentGPS + "', 0");
            sqlInvoice.push(",'" + pTaxID + "'");
            sqlInvoice.push(", 0, 1, 0,'',''");
            sqlInvoice.push(",'" + getDateTime() + "'");
            sqlInvoice.push(", 1, 0,'" + pCurrentSAT_Resolution + "'");
            sqlInvoice.push(",'" + pCurrentSAT_Res_Serie + "'");
            sqlInvoice.push("," + pChange);
            sqlInvoice.push(",'" + gImageURI_1 + "'");
            sqlInvoice.push(",'" + gImageURI_2 + "'");
            sqlInvoice.push(",'" + gImageURI_3 + "'");
            sqlInvoice.push(",NULL, " + esPagoDeConsignacion);
            sqlInvoice.push(", '" + gInitialTaskImage + "'");
            sqlInvoice.push(", " + gTaskOnRoutePlan);
            sqlInvoice.push(", " + gDiscount);
            sqlInvoice.push(", '" + comentario + "'");
            if (
              clienteProcesadoConInformacionDeCuentaCorriente.canBuyOnCredit
            ) {
              sqlInvoice.push(
                ", '" +
                  clienteProcesadoConInformacionDeCuentaCorriente.invoiceDueDate +
                  "'"
              );
            } else {
              sqlInvoice.push(",NULL");
            }
            sqlInvoice.push(
              ", " +
                clienteProcesadoConInformacionDeCuentaCorriente.creditAmount
            );
            sqlInvoice.push(
              ", " +
                clienteProcesadoConInformacionDeCuentaCorriente.cashAmount +
                ", 0 "
            );
            sqlInvoice.push(", " + gTaskId);
            sqlInvoice.push(", " + goalHeaderId);
            sqlInvoice.push(")");
            tx.executeSql(sqlInvoice.join(""));

            pTaxID = null;
            pCustName = null;
            pChange = null;
            esPagoDeConsignacion = null;
            window.gTaskOnRoutePlan = 1;

            pSQL =
              "UPDATE INVOICE_HEADER SET TOTAL_AMOUNT = (SELECT SUM(ID.TOTAL_LINE) AS TOTAL FROM INVOICE_DETAIL AS ID WHERE ID.INVOICE_NUM = " +
              gInvoiceNUM +
              "), HANDLE_TAX = " +
              (gCalculaImpuesto ? 1 : 0) +
              ", TAX_PERCENT = " +
              (gCalculaImpuesto ? window.gImpuestoDeFactura : 0) +
              " WHERE INVOICE_NUM = " +
              gInvoiceNUM;

            tx.executeSql(pSQL);

            sqlInvoice.length = 0;
          }
        },
        function(err) {
          my_dialog("", "", "close");
          notify(err.message);
          estaEnConfirmacionDeFacturacion = false;
        },
        function() {
          UpdateQuantityOfSkuSold(
            function() {
              gTotalInvoiced += Number(gInvocingTotal);
              gTotalInvoicesProc++;

              UpdateInvoiceCounter();
              GrabarNotaDeEntrega(
                function() {
                  gImageURI_1 = "";
                  actualizarEstadoDeTarea(
                    gTaskId,
                    TareaGeneroGestion.Si,
                    "Genero Gestión",
                    function() {
                      ShowInvoiceConfirmation();
                    },
                    TareaEstado.Completada
                  );
                },
                function(error) {
                  notify(error.mensaje);
                  ShowInvoiceConfirmation();
                  estaEnConfirmacionDeFacturacion = false;
                }
              );

              window.clienteProcesadoConInformacionDeCuentaCorriente = null;
            },
            function(error) {
              notify(
                "Ha ocurrido un error al actualizar el inventario con las cantidades vendidas, por favor, vuelva a intentar."
              );
              estaEnConfirmacionDeFacturacion = false;
            }
          );
        }
      );
    } else {
      notify(
        "ERROR, Resolucion de SAT ha sido agotada, contacte a su administrador."
      );
      estaEnConfirmacionDeFacturacion = false;
    }
  } catch (e) {
    notify("PostInvoice: " + e.message);
    estaEnConfirmacionDeFacturacion = false;
  }
}

function UpdateQuantityOfSkuSold(callback, errorCallBack) {
  try {
    if (vieneDeListadoDeDocumentosDeEntrega) {
      callback();
      return;
    }
    var sql = "";
    SONDA_DB_Session.transaction(
      function(trans) {
        sql = "SELECT ID.SKU";
        sql +=
          ", IFNULL((ID.QTY * IFNULL(ID.CONVERSION_FACTOR,1)),0) AS QTY_SOLD ";
        sql += " FROM INVOICE_DETAIL AS ID ";
        sql += " WHERE ID.INVOICE_NUM = " + gInvoiceNUM;

        trans.executeSql(
          sql,
          [],
          function(transReturn, results) {
            for (var i = 0; i < results.rows.length; i++) {
              var sku = results.rows.item(i);
              sql =
                "UPDATE SKUS SET ON_HAND = ON_HAND - " +
                parseFloat(sku.QTY_SOLD) +
                " WHERE SKU = '" +
                sku.SKU +
                "'";
              transReturn.executeSql(sql);
            }
            callback();
          },
          function(transReturn, error) {
            if (error.code !== 0) {
              errorCallBack(error.message);
            }
          }
        );
      },
      function(error) {
        if (error.code !== 0) {
          errorCallBack(error.message);
        }
      }
    );
  } catch (e) {
    errorCallBack(e.message);
  }
}

function ContinueToSkus() {
  LimpiarDatosConsignacion();

  var sePuedeFacturar = true;
  var esUltimaFactura = false;

  var cantidadDeFacturasDisponibles =
    Number(pCurrentSAT_Res_DocFinish) - Number(pCurrentInvoiceID) || 0;
  window.pCurrentInvoiceID = localStorage.getItem("POS_CURRENT_INVOICE_ID");

  switch (cantidadDeFacturasDisponibles) {
    case 0:
      sePuedeFacturar = false;
      break;
    case 1:
      esUltimaFactura = true;
      break;
    default:
      sePuedeFacturar = true;
      esUltimaFactura = false;
      break;
  }

  if (sePuedeFacturar) {
    if (esUltimaFactura) {
      notify(
        "ATENCION, esta es la última factura disponible en resolución: " +
          pCurrentSAT_Resolution +
          ". \nComuníquese con su administrador de Sonda"
      );
    }

    var porcerntajeDeFacturasDisponible =
      (parseInt(cantidadDeFacturasDisponibles) /
        parseInt(pCurrentSAT_Res_DocFinish)) *
      100;
    var porcentajeMinimoDeAlertaParaFacturas = parseInt(
      localStorage.getItem("ALERT_LIMIT")
    );

    if (
      porcerntajeDeFacturasDisponible <= porcentajeMinimoDeAlertaParaFacturas
    ) {
      var mensajeDeAlerta = localStorage.getItem("ALERT_MESSAGE");
      notify(mensajeDeAlerta);
      mensajeDeAlerta = null;
    }

    var procesarTareaDeCliente = function(servicioReglas) {
      servicioReglas.obtenerReglasParaInicioDeTarea(
        function(reglas) {
          servicioReglas.ejecutarReglasDeInicioDeRuta(
            reglas,
            0,
            function() {
              ShowSkusToPOS();
              servicioReglas = null;
            },
            function(error) {
              ShowSkusToPOS();
              notify("Error al ejecutar reglas de inicio de ruta: " + error);
              servicioReglas = null;
            }
          );
        },
        function(error) {
          ShowSkusToPOS();
          notify("Error al ejecutar reglas de inicio de ruta: " + error);
          servicioReglas = null;
        }
      );
    };

    var reglaServicio = new ReglaServicio();

    reglaServicio.obtenerRegla(
      ReglaTipo.CobroDeFacturaVencida,
      function(resultado) {
        if (seDebeCobrarFacturasVencidasAntesDeFacturar(resultado)) {
          var cuentaCorrienteServicio = new CuentaCorrienteServicio();

          var cliente = new Cliente();
          cliente.clientId = gClientCode;
          cliente.paymentType = TipoDePagoDeFactura.FacturaVencida;

          cuentaCorrienteServicio.obtenerFacturasVencidasDeCliente(
            cliente,
            function(facturasVencidas) {
              if (clienteTieneFacturasVencidas(facturasVencidas)) {
                var actualizacionDeInformacionDePagoDeFacturasVencidasMensaje = new ActualizacionDeInformacionDePagoDeFacturasVencidasMensaje(
                  this
                );
                actualizacionDeInformacionDePagoDeFacturasVencidasMensaje.montoCubiertoPorUltimoPagoProcesado = 0;
                mensajero.publish(
                  actualizacionDeInformacionDePagoDeFacturasVencidasMensaje,
                  getType(
                    ActualizacionDeInformacionDePagoDeFacturasVencidasMensaje
                  )
                );

                publicarClienteParaProcesoDeCobroDeFacturasVencidas(function() {
                  $.mobile.changePage("#UiOverdueInvoicePaymentPage", {
                    transition: "flip",
                    reverse: false,
                    changeHash: false,
                    showLoadMsg: false
                  });
                });
              } else {
                procesarTareaDeCliente(reglaServicio);
              }
            },
            function(error) {
              console.log(
                "Error al obtener las facturas vencidas del cliente debido a: " +
                  error.mensaje
              );
              notify(
                "Ha ocurrido un error al procesar la tarea del cliente, por favor vuelva a intentar."
              );
            }
          );
        } else {
          procesarTareaDeCliente(reglaServicio);
        }
      },
      function(error) {
        console.log(
          "No se ha podido obtener la regla 'CobroDeFacturaVencida' debido a: " +
            error
        );
        notify(
          "Ha ocurrido un error al validar las reglas del inicio de tarea, por favor vuelva a intentar."
        );
      }
    );
  } else {
    notify(
      "ERROR, no se puede continuar facturando, no hay mas facturas disponibles en resolución: " +
        pCurrentSAT_Resolution +
        ". \nComuníquese con su administrador de Sonda"
    );
  }
}

function seDebeCobrarFacturasVencidasAntesDeFacturar(resultadoDeConsulta) {
  return (
    resultadoDeConsulta.rows.length > 0 &&
    resultadoDeConsulta.rows.item(0).ENABLED.toUpperCase() === "SI" &&
    window.gClientCode !== "C000000"
  );
}

function clienteTieneFacturasVencidas(facturasVencidas) {
  return facturasVencidas.length > 0;
}

function ShowSkusToPOS() {
  try {
    var campoNit = $("#txtNIT").val();
    if (campoNit.length === 0) {
      notify("ERROR, Debe Ingresar la identificacion.");
      $("#txtNIT").focus();
    } else {
      window.gNit = campoNit;
      actualizarEstadoDeTarea(
        gTaskId,
        null,
        null,
        function() {
          ReleaseUnsedSeries();
          $.mobile.changePage("#pos_skus_page", {
            transition: "flip",
            reverse: true,
            changeHash: true,
            showLoadMsg: false
          });
        },
        TareaEstado.Aceptada
      );
    }
  } catch (e) {
    console.log(
      "Error al intentar procesar tarea del cliente debido a: " + e.message
    );
    notify(
      "Lo sentimos, ha ocurrido un error al intentar procesar la tarea del cliente, por favor vuelva a intentar."
    );
  }
}

function AddSKU(pSKU, pQTY, esSuma, unidadDeMedida) {
  try {
    var sql = "";
    var inventario = 0;
    var reservado = 0;

    var decimalesServicio = new ManejoDeDecimalesServicio();
    decimalesServicio.obtenerInformacionDeManejoDeDecimales(function(
      configuracionDeDecimales
    ) {
      SONDA_DB_Session.transaction(
        function(tx) {
          if (
            vieneDeListadoDeDocumentosDeEntrega &&
            localStorage.getItem("INVOICE_IN_ROUTE") === "0"
          ) {
            sql =
              "SELECT ON_HAND AS AVAILABLE, 0 AS QTY, ON_HAND AS ON_HAND_DELEVERY FROM INVOICE_DETAIL AS ID WHERE ID.SKU = '" +
              pSKU +
              "' AND ID.INVOICE_NUM = -9999";
          } else {
            sql =
              "SELECT S.ON_HAND AS AVAILABLE, ID.QTY, ID.ON_HAND AS ON_HAND_DELEVERY, ID.CODE_PACK_UNIT_STOCK, ID.CONVERSION_FACTOR FROM SKUS AS S INNER JOIN INVOICE_DETAIL AS ID ON(ID.SKU = S.SKU) WHERE S.SKU = '" +
              pSKU +
              "' AND ID.INVOICE_NUM = -9999 AND ID.PACK_UNIT = '" +
              unidadDeMedida +
              "'";
          }

          tx.executeSql(
            sql,
            [],
            function(tx2, results) {
              if (results.rows.length > 0) {
                inventario =
                  parseFloat(results.rows.item(0).AVAILABLE).toFixed(
                    configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                  ) * 1;
                reservado =
                  parseFloat(results.rows.item(0).QTY).toFixed(
                    configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                  ) * 1;
                var unidadDeMedidaStock = results.rows.item(0)
                  .CODE_PACK_UNIT_STOCK;
                var factorDeConversion =
                  parseFloat(
                    results.rows.item(0).CONVERSION_FACTOR
                      ? results.rows.item(0).CONVERSION_FACTOR
                      : 0
                  ).toFixed(
                    configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                  ) * 1;
                var cantidadAEvaluar = 0;

                if (
                  unidadDeMedida &&
                  unidadDeMedidaStock &&
                  unidadDeMedida.toUpperCase() !==
                    unidadDeMedidaStock.toUpperCase()
                ) {
                  cantidadAEvaluar =
                    (pQTY * factorDeConversion).toFixed(
                      configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                    ) * 1;
                  reservado =
                    (reservado * factorDeConversion).toFixed(
                      configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                    ) * 1;
                } else {
                  cantidadAEvaluar = pQTY;
                }

                var inventarioParaEntrega =
                  parseFloat(results.rows.item(0).ON_HAND_DELEVERY).toFixed(
                    configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                  ) * 1;
                if (esSuma) {
                  if (
                    parseFloat(cantidadAEvaluar + reservado).toFixed(
                      configuracionDeDecimales.defaultDisplayDecimalsForSkuQty
                    ) *
                      1 <=
                    inventario
                  ) {
                    sql =
                      "UPDATE INVOICE_DETAIL SET QTY = QTY + " +
                      parseFloat(pQTY) +
                      ", TOTAL_LINE = ((QTY + " +
                      parseFloat(pQTY) +
                      ")* PRICE)  WHERE  INVOICE_NUM = -9999 AND SKU = '" +
                      pSKU +
                      "' AND PACK_UNIT = '" +
                      unidadDeMedida +
                      "'";
                    console.log(sql);
                    tx2.executeSql(sql);

                    PopulateInvoiceSKUsList();
                    inventario = null;
                    reservado = null;
                  } else {
                    console.log(
                      "No tiene inventario disponible para realizar la accion, por favor, verifique y vuelva a intentar."
                    );
                    notify(
                      "No tiene inventario disponible para realizar la accion, por favor, verifique y vuelva a intentar."
                    );
                  }
                } else {
                  var inventarioDisponible = vieneDeListadoDeDocumentosDeEntrega
                    ? inventarioParaEntrega
                    : inventario;

                  if (parseFloat(cantidadAEvaluar) <= inventarioDisponible) {
                    if (
                      unidadDeMedida &&
                      unidadDeMedida.toUpperCase() !== "UNDEFINED" &&
                      unidadDeMedida.toUpperCase() !== "NULL"
                    ) {
                      sql =
                        "UPDATE INVOICE_DETAIL SET QTY = " +
                        parseFloat(pQTY) +
                        ", TOTAL_LINE = (" +
                        parseFloat(pQTY) +
                        " * PRICE)  " +
                        "WHERE  INVOICE_NUM = -9999 AND SKU = '" +
                        pSKU +
                        "' AND PACK_UNIT = '" +
                        unidadDeMedida +
                        "'";
                    } else {
                      sql =
                        "UPDATE INVOICE_DETAIL SET QTY = " +
                        parseFloat(pQTY) +
                        ", TOTAL_LINE = (" +
                        parseFloat(pQTY) +
                        " * PRICE)  " +
                        "WHERE  INVOICE_NUM = -9999 AND SKU = '" +
                        pSKU +
                        "'";
                    }

                    console.log(sql);
                    tx2.executeSql(sql);

                    PopulateInvoiceSKUsList();
                    inventario = null;
                    reservado = null;
                  } else {
                    console.log(
                      "No tiene inventario disponible para realizar la accion, por favor, verifique y vuelva a intentar."
                    );
                    notify(
                      "No tiene inventario disponible para realizar la accion, por favor, verifique y vuelva a intentar."
                    );
                  }
                }
              }
            },
            function(tx2, err) {
              if (err.code !== 0) {
                console.log(err.message);
                notify(err.message);
              }
            }
          );
        },
        function(err, tx) {
          //ojo
          console.log("03.50.110:" + err.code + " msg: " + err.message);
          if (err.code !== 0) {
            alert("03.50.110.Error processing SQL: " + err.message);
          }
        }
      );
    });
  } catch (e) {
    notify("AddSKU: " + e.message);
    console.log("catch: " + e.message);
  }
}
function InsertInvoiceDetail(
  pSkuParent,
  pSkuPrice,
  paramQty,
  callBack,
  saleMeasureUnit,
  stockMeasureUnit,
  convertionFactor
) {
  try {
    var pNextParentSeq = 1;
    var pSeq = 0;

    SONDA_DB_Session.transaction(
      function(tx) {
        var pSQL =
          "SELECT COUNT(1)+1 as CURRENT_SEQ FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" +
          pSkuParent +
          "'";

        try {
          tx.executeSql(pSQL, [], function(tx, results) {
            pNextParentSeq = results.rows.item(0).CURRENT_SEQ;

            pSQL = "SELECT * FROM SKUS WHERE SKU = '" + pSkuParent + "'";

            tx.executeSql(
              pSQL,
              [],
              function(tx, results) {
                var pExposure = 0;

                var pRequeriesSerie = results.rows.item(0).REQUERIES_SERIE;
                var skuPrice = pSkuPrice;
                var pSkuqty = paramQty;
                var pSkuName = results.rows.item(0).SKU_NAME;
                pExposure = results.rows.item(0).EXPOSURE;

                if (
                  saleMeasureUnit.toUpperCase() !==
                  stockMeasureUnit.toUpperCase()
                ) {
                  pSkuqty = paramQty * convertionFactor;
                }

                if (pRequeriesSerie === 0) {
                  pSQL =
                    "DELETE FROM INVOICE_DETAIL WHERE INVOICE_NUM = -9999 AND SKU = '" +
                    pSkuParent +
                    "' AND PACK_UNIT = '" +
                    saleMeasureUnit +
                    "'";

                  tx.executeSql(pSQL);
                }

                pSeq = parseInt(pNextParentSeq) + 1;

                pSQL =
                  "INSERT INTO INVOICE_DETAIL(INVOICE_NUM, SKU, SKU_NAME, QTY, PRICE, DISCOUNT, TOTAL_LINE, REQUERIES_SERIE, SERIE, SERIE_2, LINE_SEQ, IS_ACTIVE, COMBO_REFERENCE, PARENT_SEQ, EXPOSURE, PHONE, TAX_CODE, IS_BONUS, PACK_UNIT, CODE_PACK_UNIT_STOCK, CONVERSION_FACTOR) ";
                pSQL +=
                  " VALUES(-9999,'" +
                  results.rows.item(0).SKU +
                  "','" +
                  pSkuName +
                  "', " +
                  paramQty +
                  ", " +
                  skuPrice;
                pSQL +=
                  ", 0, " +
                  parseFloat(skuPrice) * parseInt(paramQty) +
                  "," +
                  pRequeriesSerie +
                  ",'0','0'," +
                  pSeq +
                  ", 3, '" +
                  pSkuParent +
                  "'," +
                  pNextParentSeq +
                  "," +
                  pExposure +
                  ",'', '" +
                  results.rows.item(0).TAX_CODE +
                  "', 0, '" +
                  saleMeasureUnit +
                  "', '" +
                  stockMeasureUnit +
                  "', " +
                  convertionFactor +
                  ")";
                tx.executeSql(pSQL);

                window.vieneDeIngresoCantidad = false;

                callBack();

                my_dialog("", "", "close");
              },
              function(err) {
                my_dialog("", "", "close");
                if (err.code !== 0) {
                  notify(
                    "Error al insertar el detalle de factura debido a: " +
                      err.message
                  );
                }
              }
            );
          });
        } catch (e) {
          notify(
            "Error al insertar el detalle de factura debido a: " + e.message
          );
        }
      },
      function(err, tx) {
        notify(
          "Error al insertar el detalle de factura debido a: " + err.message
        );
      }
    );
  } catch (e) {
    notify("Error al insertar el detalle de factura debido a: " + e.message);
  }
}
function GetNextSKUSeq() {
  var pSEQ = 1;

  pSEQ = Number(localStorage.getItem("POS_ITEM_SEQ"));
  return pSEQ;
}

function ConfirmedInvoice() {
  $.mobile.changePage("#menu_page", {
    transition: "pop",
    reverse: true,
    changeHash: false,
    showLoadMsg: false
  });
}

function PopulateSKUSeriesGrid(pSKU, pLINE_SEQ) {
  //my_dialog("Cargando listado Series", "Espere...", "open");

  try {
    SONDA_DB_Session.transaction(
      function(tx) {
        var pDoc = "";
        var pImg = "";
        var pSQL =
          "SELECT * FROM SKU_SERIES WHERE SKU= '" + pSKU + "' AND STATUS=0"; //
        //console.log(pSQL);
        tx.executeSql(
          pSQL,
          [],
          function(tx, results) {
            $("#series_listview_panel")
              .children()
              .remove("li");
            $("#divSeriesSKU").attr("LineSeq", pLINE_SEQ);
            for (i = 0; i <= results.rows.length - 1; i++) {
              var xonclick2 =
                "UpdateSKUSeries(" +
                "'" +
                pSKU +
                "'," +
                pLINE_SEQ +
                ",'" +
                results.rows.item(i).SERIE +
                "','" +
                results.rows.item(i).ICC +
                "','" +
                results.rows.item(i).PHONE +
                "'" +
                ");";

              //tx.executeSql('CREATE TABLE IF NOT EXISTS SKU_SERIES(SKU, IMEI, SERIE, PHONE, ICC, STATUS, LOADED_LAST_UPDATED)');
              var vLi = "";
              vLi += '<li class="ui-nodisc-icon ui-alt-icon">';
              vLi += '<a href="#" onclick="' + xonclick2 + '">';
              vLi +=
                '<p><span class="title">' +
                results.rows.item(i).SERIE +
                "</span></p>";
              vLi += '<p><div class="ui-nodisc-icon ui-alt-icon">';

              xonclick2 = "notify('IMEI: " + results.rows.item(i).ICC + "');";
              vLi +=
                '<a style="text-align:center" href="#" class="ui-corner-all ui-btn-icon-notext ui-btn-inline ui-btn-icon-left ui-btn ui-btn-c ui-shadow ui-icon-tag ui-nodisc-icon" onclick="' +
                xonclick2 +
                '">IMEI</a>';

              xonclick2 =
                "notify('Celular: " + results.rows.item(i).PHONE + "');";
              vLi +=
                '<a style="text-align:center" href="#" class="ui-corner-all ui-btn-icon-notext ui-btn-inline ui-btn-icon-left ui-btn ui-btn-c ui-shadow ui-icon-phone ui-nodisc-icon" onclick="' +
                xonclick2 +
                '">' +
                results.rows.item(i).PHONE +
                "</a>";
              vLi += "</div></a></li>";

              //  console.log(vLI);

              $("#series_listview_panel").append(vLi);
              $("#series_listview_panel").listview("refresh");
              my_dialog("", "", "close");
            }
            //console.log("termino.");
            //$("#series_listview_panel").listview('refresh');
            //my_dialog("", "", "close");
          },
          function(err) {
            //console.log("01.40.99:" + err.code);

            my_dialog("", "", "close");
            if (err.code !== 0) {
              alert("Error processing SQL: " + err.code);
            }
          }
        );
      },
      function(err) {
        //console.log("01.40.100:" + err.code);
        if (err.code !== 0) {
          alert("Error processing SQL: " + err.code);
        }
      }
    );
  } catch (e) {
    alert(e.message);
    my_dialog("", "", "close");
    console.log(e.message);
  }
}
function exploredevices() {
  try {
    //my_dialog("Obteniendo dispositivos", "Espere...", "open");
    try {
      bluetoothSerial.list(
        function(devices) {
          devices.forEach(function(device) {
            xdevname = device.name;

            //if (xdevname.substring(1, 2) === "X") {
            var xxitem = $("#item-" + device.name);

            if (xxitem.length <= 0) {
              var pHtml = "";
              if (device.address === gPrintAddress) {
                pHtml =
                  pHtml +
                  "<input type='radio' name='itemDev' id='item-" +
                  device.name +
                  "' value='" +
                  device.address +
                  "' checked='checked'>";
              } else {
                pHtml =
                  pHtml +
                  "<input type='radio' name='itemDev' id='item-" +
                  device.name +
                  "' value='" +
                  device.address +
                  "'>";
              }

              pHtml =
                pHtml +
                "<label class='medium' for='item-" +
                device.name +
                "'>" +
                device.name +
                " " +
                device.address +
                "</label>";

              $("#cmbDevices").append(pHtml);
              $("#item-" + device.name)
                .checkboxradio()
                .checkboxradio("refresh");
            }
            // }
          });
          $("#cmbDevices")
            .controlgroup()
            .controlgroup("refresh");
        },
        function(err) {}
      );
    } catch (e) {
      alert(e.message);
    }
    my_dialog("", "", "close");
  } catch (e) {
    my_dialog("", "", "close");
    alert("cannot print " + e.message);
  }
}

function TryPrinter() {
  try {
    var lheader = "";
    lheader = "! 0 50 50 450 1\r\n";
    lheader =
      lheader +
      "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
    lheader = lheader + "LEFT 5 T 0 2 0 90 Usuario: " + gLastLogin + " \r\n";
    lheader = lheader + "LEFT 5 T 0 2 0 120 Ruta: " + gCurrentRoute + " \r\n";
    lheader =
      lheader +
      "LEFT 5 T 0 2 0 150 Estatus: " +
      $("#login_isonline").text() +
      " " +
      $("#svr_addr").text() +
      " \r\n";
    lheader = lheader + "L 5 180 570 180 1\r\nPRINT\r\n";

    bluetoothSerial.isConnected(
      function() {
        bluetoothSerial.write(
          lheader,
          function() {},
          function() {
            alert("unable to write to printer");
          }
        );
        bluetoothSerial.disconnect(
          function() {},
          function() {
            alert("Printer is unable to get disconnected");
          }
        );

        gPrinterIsAvailable = 1;
      },
      function() {
        gPrintAddress = $("input[name=itemDev]:checked").val();

        bluetoothSerial.connect(
          gPrintAddress,
          function() {
            bluetoothSerial.write(
              lheader,
              function() {},
              function() {
                alert("unable to write to printer");
              }
            );
            bluetoothSerial.disconnect(
              function() {},
              function() {
                alert("Printer is unable to get disconnected");
              }
            );
            gPrinterIsAvailable = 1;
          },
          function() {
            notify(
              "ERROR, No se pudo conectar a la impresora:" + gPrintAddress
            );
            my_dialog("", "", "close");
            gPrinterIsAvailable = 0;
          }
        );
      }
    );
  } catch (e) {
    notify("TryPrinter: " + e.message);
  }
}

function SavePrinter() {
  try {
    gPrintAddress = $("input[name=itemDev]:checked").val();

    localStorage.setItem("PRINTER_ADDRESS", gPrintAddress);
    $("#lblPrinterAddress").text(gPrintAddress);

    var pVisible = $("#btnStartPOS").css("Visibility");

    if (pVisible === "hidden") {
      $("#btnStartPOS").show();
    }
    $.mobile.changePage("#menu_page", {
      transition: "none",
      reverse: true,
      showLoadMsg: false
    });
  } catch (e) {
    notify("SavePrinter: " + e.message);
  }
}
function UpdateInventory(pCombo, pSku, pQty, tx) {
  try {
    pSQL = "";
    pSQL =
      "UPDATE SKUS SET ON_HAND = ON_HAND - " +
      pQty +
      " WHERE PARENT_SKU = '" +
      pCombo +
      "' AND EXPOSURE = 1 AND SKU = '" +
      pSku +
      "'";
    console.log(pSQL);

    tx.executeSql(pSQL, [], function(tx, results) {
      if (results.rowsAffected === 1) {
        //alert('actualizo!');
        //PopulateSKUGrid();
      }
    });
  } catch (e) {
    notify("UpdateInventory: " + e.message);
  }
}
function Process_SKUsToInvoice(pInvoiceID, pUpdateInventory, pResolution) {
  var pDetailResults = Array();
  var pHeaderResults = "";
  var pCombo = "";
  var singlesku = "";
  try {
    SONDA_DB_Session.transaction(
      function(tx) {
        var pSql = "";
        pSql =
          "SELECT A.INVOICE_NUM" +
          ", A.SKU" +
          ", A.PRICE" +
          ", A.SKU_NAME" +
          ", A.QTY" +
          ", A.TOTAL_LINE" +
          ", A.COMBO_REFERENCE" +
          ",A.REQUERIES_SERIE" +
          ", A.LINE_SEQ" +
          ", 1 AS IS_KIT" +
          ", A.SERIE" +
          ", A.SERIE_2" +
          ", A.PARENT_SEQ" +
          ", A.EXPOSURE " +
          "FROM INVOICE_DETAIL A " +
          "WHERE A.INVOICE_NUM = " +
          pInvoiceID;

        console.log(pSql);
        tx.executeSql(
          pSql,
          [],
          function(tx, results) {
            var invoiceDetail = {};

            for (var i = 0; i <= results.rows.length - 1; i++) {
              invoiceDetail = {
                INVOICE_NUM: results.rows.item(i).INVOICE_NUM,
                SKU: results.rows.item(i).SKU,
                QTY: results.rows.item(i).QTY,
                PRICE: results.rows.item(i).PRICE,
                TOTAL_LINE: results.rows.item(i).TOTAL_LINE,
                REQUERIES_SERIE: results.rows.item(i).REQUERIES_SERIE,
                SERIE: results.rows.item(i).SERIE,
                SERIE_2: results.rows.item(i).SERIE_2,
                COMBO_REFERENCE: results.rows.item(i).COMBO_REFERENCE,
                PARENT_SEQ: results.rows.item(i).PARENT_SEQ,
                EXPOSURE: results.rows.item(i).EXPOSURE,
                LINE_SEQ: results.rows.item(i).LINE_SEQ,
                INVOICE_RESOLUTION: pResolution
              };
              pDetailResults.push(invoiceDetail);
              pCombo = results.rows.item(i).COMBO_REFERENCE;
              singlesku = results.rows.item(i).SKU;

              if (pUpdateInventory === 1) {
                //UpdateInventory(pCombo, singlesku, 1, tx);
              }
            }

            SONDA_DB_Session.transaction(
              function(tx) {
                pSql = "";
                pSql = "SELECT * FROM INVOICE_HEADER WHERE  ";
                pSql += " INVOICE_NUM = " + pInvoiceID;
                console.log(pSql);

                tx.executeSql(
                  pSql,
                  [],
                  function(tx, results) {
                    var invoiceHeader = {
                      INVOICE_NUM: results.rows.item(0).INVOICE_NUM,
                      CLIENT_ID: results.rows.item(0).CLIENT_ID,
                      POS_TERMINAL: results.rows.item(0).POS_TERMINAL,
                      GPS: results.rows.item(0).GPS,
                      TOTAL_AMOUNT: results.rows.item(0).TOTAL_AMOUNT,
                      POSTED_DATETIME: results.rows.item(0).POSTED_DATETIME,
                      CLIENT_NAME: results.rows.item(0).CLIENT_NAME,
                      AUTH_ID: results.rows.item(0).AUTH_ID,
                      SAT_SERIE: results.rows.item(0).SAT_SERIE,
                      CDF_NIT: results.rows.item(0).ERP_INVOICE_ID,
                      IMG1: results.rows.item(0).IMG1,
                      IMG2: results.rows.item(0).IMG2,
                      IMG3: results.rows.item(0).IMG3,
                      CONSIGNMENT_ID: results.rows.item(0).CONSIGNMENT_ID,
                      IS_PAID_CONSIGNMENT: results.rows.item(0)
                        .IS_PAID_CONSIGNMENT,
                      INITIAL_TASK_IMAGE: results.rows.item(0)
                        .INITIAL_TASK_IMAGE,
                      IN_ROUTE_PLAN: results.rows.item(0).IN_ROUTE_PLAN
                    };
                    pHeaderResults = JSON.stringify(invoiceHeader);

                    var xDetailData1 = JSON.stringify(pDetailResults);

                    var data = {
                      data_header: pHeaderResults,
                      data_detail: xDetailData1,
                      routeid: gCurrentRoute,
                      batt: gBatteryLevel,
                      dbuser: gdbuser,
                      CURRENT_INVOICE_NUM:
                        parseInt(
                          localStorage.getItem("POS_CURRENT_INVOICE_ID")
                        ) + 1,
                      dbuserpass: gdbuserpass,
                      default_warehouse: gDefaultWhs,
                      loginid: gLastLogin
                    };

                    if (gIsOnline == EstaEnLinea.Si) {
                      if (pUpdateInventory === 1) {
                        SocketControlador.socketIo.emit("post_invoice", data);
                        ShowInvoiceConfirmation();
                      } else {
                        SocketControlador.socketIo.emit(
                          "post_invoice_offline",
                          data
                        );
                        EnviarResolucion("SendInvoice");
                      }
                    } else {
                      ShowInvoiceConfirmation();
                    }
                  },
                  function(err) {
                    my_dialog("", "", "close");
                    if (err.code !== 0) {
                      alert("Error processing SQL: " + err.code);
                    }
                  }
                );
                my_dialog("", "", "close");
              },
              function(err) {
                my_dialog("", "", "close");
                if (err.code !== 0) {
                  alert("Error processing SQL: " + err.code);
                }
              }
            );
          },
          function(err) {
            my_dialog("", "", "close");
            if (err.code !== 0) {
              alert("Error processing SQL: " + err.code);
            }
          }
        );
        my_dialog("", "", "close");
      },
      function(err) {
        my_dialog("", "", "close");
        if (err.code !== 0) {
          alert("Error processing SQL: " + err.code);
        }
      }
    );
  } catch (e) {
    console.log(e);
    notify("Process_SKUsToInvoice: " + e.message);
  }
}
function UpdateInvoiceCounter() {
  localStorage.setItem("POS_CURRENT_INVOICE_ID", gInvoiceNUM);
  $("#lblSumm_CurrentDoc").text(gInvoiceNUM);
  localStorage.setItem("POS_TOTAL_INVOICED", gTotalInvoiced);
  localStorage.setItem("POS_TOTAL_INVOICES_PROC", Number(gTotalInvoicesProc));
  localStorage.setItem("POS_ITEM_SEQ", Number(0));
}

function print_remote_invoice_joininfo(rows) {
  var lheader = "";
  var ldetail = "";
  var lfooter = "";
  var ppassed = 0;

  try {
    SocketControlador.socketIo.emit("debug_on_server", {
      data: rows,
      msg: "entro impresion",
      dir_data: true,
      save_to_file: true,
      file_name: "reprint_" + rows[0].INVOICE_ID
    });

    var print_doc_len = new Number();

    print_doc_len = 430; //header;
    print_doc_len += parseInt(parseInt(rows.length) * 150); //detail
    print_doc_len += parseInt(290); //footer

    lheader = "! 0 50 50 " + print_doc_len + " 1\r\n";
    lheader +=
      "! U1 LMARGIN 10\r\n! U\r\n! U1 PAGE-WIDTH 1400\r\nON-FEED IGNORE\r\n";
    /* ENE212016 FRM
            CAMBIAR EL NOMBRE DE LA EMPRESA DE FIJO A DINAMICO
         lheader += "CENTER 550 T 1 2 0 10 Ways, S.A / " + rows[0].AUTH_BRANCH_NAME + "\r\n";

         */

    lheader +=
      "CENTER 550 T 1 2 0 10 " +
      rows[0].ENTERPRISE_NAME +
      " / " +
      rows[0].AUTH_BRANCH_NAME +
      "\r\n";

    lheader += "CENTER 550 T 0 2 0 60 " + rows[0].AUTH_BRANCH_ADDRESS + "\r\n";
    lheader += "CENTER 550 T 0 2 0 90 SUJETO A PAGOS TRIMESTRALES\r\n";
    lheader += "CENTER 550 T 0 2 0 120 NIT: 3517713-6\r\n";
    lheader +=
      "CENTER 550 T 0 2 0 150 Resolución #: " +
      rows[0].CDF_RESOLUCION +
      " \r\n";
    lheader +=
      "CENTER 550 T 0 2 0 180 Fecha Auto. : " +
      rows[0].AUTH_POST_DATETIME +
      " \r\n";
    lheader +=
      "CENTER 550 T 0 2 0 210 Resol.Vence : " +
      rows[0].AUTH_LIMIT_DATETIME +
      " \r\n";
    lheader +=
      "CENTER 550 T 0 2 0 240 Del: " +
      rows[0].AUTH_DOC_FROM +
      " Al: " +
      rows[0].AUTH_DOC_TO +
      "\r\n";
    lheader +=
      "CENTER 550 T 0 3 0 280 Factura Serie " +
      rows[0].INVOICE_SERIAL +
      " # " +
      rows[0].INVOICE_ID +
      "\r\n";
    lheader += "L 5 310 570 310 1\r\n";
    lheader +=
      "CENTER 550 T 0 2 0 340 A NOMBRE DE: NIT:" +
      rows[0].CDF_NIT +
      "-" +
      rows[0].CDF_NOMBRECLIENTE +
      "\r\n";
    lheader += "L 5 370 570 370 1\r\n";
    lheader +=
      "CENTER 550 T 0 2 0 400 *** " +
      $("#cmbRemoteInvoiceType").val() +
      " ***\r\n";

    var pRow = 470;

    ldetail = "";
    var pImei = 0;
    var pImeiPrint = 0;

    for (i = 0; i <= rows.length - 1; i++) {
      ldetail =
        ldetail +
        "LEFT 5 T 0 2 0 " +
        pRow +
        " " +
        rows[i].SKU +
        "- " +
        rows[i].SKU_NAME +
        "\r\n";
      pRow += parseInt(30);

      ldetail =
        ldetail +
        "LEFT 5 T 0 2 0 " +
        pRow +
        " CANTIDAD: " +
        rows[i].QTY +
        " / PREC.UNIT. : Q" +
        format_number(rows[i].PRICE, 2) +
        "\r\n";
      pRow += parseInt(30);

      pImei = rows[i].SERIE_2;
      if (isNaN(pImei)) {
        pImeiPrint = 0;
      } else {
        pImeiPrint = pImei;
      }

      ldetail =
        ldetail +
        "LEFT 5 T 0 2 0 " +
        pRow +
        " SERIE: " +
        rows[i].SERIE +
        "/ IMEI: " +
        pImeiPrint +
        "\r\n";
      pRow += parseInt(30);

      ldetail =
        ldetail +
        "RIGHT 550 T 0 2 0 " +
        (pRow - 90) +
        " Q" +
        format_number(parseFloat(rows[i].PRICE) * parseFloat(rows[i].QTY), 2) +
        "\r\n";

      ldetail = ldetail + "L 5 " + pRow + " 570 " + pRow + " 1\r\n";
      pRow += parseInt(10);
    }

    pRow += parseInt(30);
    lfooter = "LEFT 5 T 0 2 0 " + pRow + " TOTAL: \r\n";
    lfooter =
      lfooter +
      "RIGHT 550 T 0 2 0 " +
      pRow +
      " Q" +
      format_number(rows[0].TOTAL_AMOUNT, 2) +
      "\r\n";

    pRow += parseInt(30);
    lfooter += "LEFT 5 T 0 2 0 " + pRow + " EFECTIVO: \r\n";
    lfooter +=
      "RIGHT 550 T 0 2 0 " +
      pRow +
      " Q" +
      format_number(Number(rows[0].TOTAL_AMOUNT), 2) +
      "\r\n";

    pRow += parseInt(30);
    lfooter += "LEFT 5 T 0 2 0 " + pRow + " CAMBIO: \r\n";
    lfooter += "RIGHT 550 T 0 2 0 " + pRow + " Q0.00\r\n";

    pRow += parseInt(30);
    lfooter +=
      "CENTER 550 T 0 2 0 " +
      pRow +
      " [" +
      gIsOnline +
      "] " +
      getDateTime() +
      " / RUTA " +
      gCurrentRoute +
      " \r\n";

    pRow += parseInt(30);
    lfooter += "CENTER 550 T 0 2 0 " + pRow + " *** RE IMPRESO *** \r\n";

    //pRow += parseInt(30);
    //lfooter += lfooter + "L 5  " + pRow + " 570 " + pRow + " 1\r\n";

    lfooter = lfooter + "L 5  80 570 80 1\r\nPRINT\r\n";

    pCpCl = lheader + ldetail + lfooter;

    SocketControlador.socketIo.emit("debug_on_server", {
      data: null,
      msg: "cpl:" + pCpCl,
      dir_data: false,
      save_to_file: false,
      file_name: "reprint_" + rows[0].INVOICE_ID
    });

    lheader = "";
    ldetail = "";
    lfooter = "";

    try {
      my_dialog(
        "Imprimiendo Factura",
        "#" + rows[0].INVOICE_ID + " Espere...",
        "open"
      );
      bluetoothSerial.isConnected(
        function() {
          bluetoothSerial.write(
            pCpCl,
            function() {},
            function() {
              alert("unable to write to printer");
            }
          );
        },
        function() {
          try {
            bluetoothSerial.connect(
              gPrintAddress,
              function() {
                bluetoothSerial.write(
                  pCpCl,
                  function() {},
                  function() {
                    alert("unable to write to printer");
                  }
                );
              },
              function() {
                my_dialog("", "", "close");
                notify(
                  "ERROR, Unable to connect to the printer.(" +
                    gPrintAddress +
                    ")"
                );
              }
            );
          } catch (e) {
            my_dialog("", "", "close");
            notify(e.message);
          }
        }
      );
    } catch (e) {
      my_dialog("", "", "close");
      alert("cannot print " + e.message);
    }

    my_dialog("", "", "close");
  } catch (e) {
    my_dialog("", "", "close");
    notify(e.message);
    return e.message;
  }
  return "";
}

function ObtenerDetalleDeFacturaPorSku(tx, invoiceId, callback, errCallback) {
  try {
    pSQL = "";
    pSQL =
      "SELECT * FROM INVOICE_DETAIL WHERE INVOICE_NUM = " + invoiceId + " ";
    tx.executeSql(
      pSQL,
      [],
      function(tx, results) {
        callback(results);
      },
      function(err) {
        if (err.code !== 0) {
          errCallback(err);
        }
      }
    );
  } catch (e) {
    errCallback({ code: -1, Message: err.Message });
  }
}

function AnularFactura(
  invoice,
  serie,
  resolution,
  detalle,
  voidReason,
  isPaidConsignment,
  imgConsignment,
  seq,
  isFromDelivery
) {
  var serieServicio = new SerieServicio();
  if (seq === 1) {
    var data = {
      invoice: invoice,
      serie: serie,
      resolution: resolution,
      status: 0,
      voidReason: voidReason,
      default_warehouse: gDefaultWhs,
      routeid: gCurrentRoute,
      loginid: gLastLogin,
      dbuser: gdbuser,
      dbuserpass: gdbuserpass,
      paidconsignment: isPaidConsignment,
      imgconsignment: imgConsignment
    };
    SocketControlador.socketIo.emit("UpdateStatusInvoice", data);
  } else {
    var i;
    if (isPaidConsignment === 1) {
      for (i = 0; i < detalle.rows.length; i++) {
        var skuTemporal = detalle.rows.item(i);
        skuTemporal.QTY_CONSIGNMENT = skuTemporal.QTY;
        InsertarConsignacionDetalle(null, skuTemporal, i, 0, function(index) {
          //...
        });
      }
    } else if (isFromDelivery == 1) {
      if (guardarInventarioDeFacturaCancelada) {
        var entregaServicio = new EntregaServicio();
        entregaServicio.agregarSkusDeFacturaCanceladaAInventario(detalle);
      }
    } else {
      for (i = 0; i < detalle.rows.length; i++) {
        var data2 = {
          sku: detalle.rows.item(i).SKU,
          serie: detalle.rows.item(i).SERIE,
          qty: detalle.rows.item(i).QTY,
          default_warehouse: gDefaultWhs,
          routeid: gCurrentRoute,
          loginid: gLastLogin,
          dbuser: gdbuser,
          dbuserpass: gdbuserpass
        };

        serieServicio.ActualizarEstadoDeSerie(
          detalle.rows.item(i).SKU,
          [detalle.rows.item(i).SERIE],
          SerieUtilizada.No,
          function() {},
          function(err) {
            notify("Error al habilitar la serie: " + err);
          }
        );

        SocketControlador.socketIo.emit("AddInventoryByVoidInvoice", data2);
      }
    }
    my_dialog("", "", "close");
  }
}

function EnviarResolucion(request) {
  var currentInvoiceNum = localStorage.getItem("POS_CURRENT_INVOICE_ID");
  currentInvoiceNum = parseInt(currentInvoiceNum);

  var data = {
    AuthId: localStorage.getItem("POS_SAT_RESOLUTION"),
    AuthSerial: localStorage.getItem("POS_SAT_RES_SERIE"),
    InvoiceId: currentInvoiceNum + 1,
    request: request,
    loginid: gLastLogin,
    dbuser: gdbuser,
    dbuserpass: gdbuserpass,
    deviceId: device.uuid
  };
  SocketControlador.socketIo.emit("SendResolution", data);
}

function VerificarLimiteDeCreditoExcedidoPorVentaActual(callBack) {
  if (gClientCode === "C00000" || vieneDeListadoDeDocumentosDeEntrega) {
    callback();
    return;
  }

  var reglaServicio = new ReglaServicio();
  reglaServicio.obtenerRegla(
    ReglaTipo.NoVenderAlContadoConLimiteExcedido,
    function(regla) {
      if (
        regla.rows.length > 0 &&
        regla.rows.item(0).ENABLED.toUpperCase() === "SI"
      ) {
        var cliente = new Cliente();
        cliente.clientId = gClientCode;
        cliente.paymentType = TipoDePagoDeFactura.FacturaAbierta;

        cliente.creditAmount =
          clienteProcesadoConInformacionDeCuentaCorrienteParaPagoDeFacturasAbiertas.creditAmount;
        cliente.cashAmount =
          clienteProcesadoConInformacionDeCuentaCorrienteParaPagoDeFacturasAbiertas.cashAmount;

        var cuentaCorrienteServicio = new CuentaCorrienteServicio();

        cuentaCorrienteServicio.obtenerCuentaCorrienteDeCliente(
          cliente,
          function(cuentaCorriente) {
            cliente.currentAccountingInformation = cuentaCorriente;

            if (
              cuentaCorrienteServicio.verificarSiElClienteTieneLimiteDeCreditoYDiasDeCreditoConfigurados(
                cliente
              )
            ) {
              cuentaCorrienteServicio.obtenerFacturasVencidasDeCliente(
                cliente,
                function(facturasVencidas) {
                  cliente.overdueInvoices = facturasVencidas;

                  cuentaCorrienteServicio.obtenerSumatoriaTotalDeFacturasAbiertas(
                    cliente,
                    function(sumaDeFacturasAbiertas) {
                      cliente.totalAmountOfOpenInvoices = sumaDeFacturasAbiertas;

                      cuentaCorrienteServicio.obtenerSumatoriaTotalDeFacturasEnRutaDeCliente(
                        cliente,
                        function(clienteCompleto) {
                          cliente.totalAmountOfOpenInvoices +=
                            clienteCompleto.currentAccountingInformation.currentAmountOnCredit;
                          if (
                            cliente.overdueInvoices.length > 0 &&
                            cliente.totalAmountOfOpenInvoices +
                              parseFloat(gInvocingTotal) >
                              cliente.currentAccountingInformation.creditLimit
                          ) {
                            var actualizacionDeInformacionDePagoDeFacturasVencidasMensaje = new ActualizacionDeInformacionDePagoDeFacturasVencidasMensaje(
                              this
                            );
                            actualizacionDeInformacionDePagoDeFacturasVencidasMensaje.montoCubiertoPorUltimoPagoProcesado = 0;
                            mensajero.publish(
                              actualizacionDeInformacionDePagoDeFacturasVencidasMensaje,
                              getType(
                                ActualizacionDeInformacionDePagoDeFacturasVencidasMensaje
                              )
                            );

                            var mensaje = new ClienteMensaje(this);
                            mensaje.cliente = cliente;
                            mensaje.vistaCargandosePorPrimeraVez = true;
                            mensaje.tipoDePagoAProcesar = cliente.paymentType;

                            mensajero.publish(mensaje, getType(ClienteMensaje));

                            $.mobile.changePage(
                              "#UiOverdueInvoicePaymentPage",
                              {
                                transition: "flip",
                                reverse: false,
                                changeHash: false,
                                showLoadMsg: false
                              }
                            );
                          } else {
                            callBack();
                          }
                        },
                        function(resultado) {
                          notify(
                            "No se ha podido obtener la suma de facturas en ruta del cliente debido a: " +
                              resultado.mensaje
                          );
                          estaEnConfirmacionDeFacturacion = false;
                        }
                      );
                    },
                    function(resultado) {
                      notify(
                        "No se ha podido obtener la suma de facturas abiertas del cliente debido a: " +
                          resultado.mensaje
                      );
                      estaEnConfirmacionDeFacturacion = false;
                    }
                  );
                },
                function(resultado) {
                  notify(
                    "No se ha podido obtener la lista de facturas vencidas del cliente debido a: " +
                      resultado.mensaje
                  );
                  estaEnConfirmacionDeFacturacion = false;
                }
              );
            } else {
              callBack();
            }
          },
          function(resultado) {
            notify(
              "No se ha podido obtener la cuenta corriente del cliente debido a: " +
                resultado.mensaje
            );
            estaEnConfirmacionDeFacturacion = false;
          }
        );
      } else {
        callBack();
      }
    },
    function(error) {
      notify(error);
      estaEnConfirmacionDeFacturacion = false;
    }
  );
}
