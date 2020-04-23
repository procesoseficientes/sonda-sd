function UpdateLoginInfo(pAction)//set/get
{
    if(pAction === "set")
    {
        localStorage.setItem('LAST_LOGIN_ID', gLastLogin);
        localStorage.setItem('POS_CURRENT_ROUTE', gCurrentRoute);
        localStorage.setItem('LAST_USER_CODE', gUserCode);
        localStorage.setItem('LAST_USER_CD', gUserCD);
        localStorage.setItem('POS_DEFAULT_WHS', gDefaultWhs);
        localStorage.setItem('PRESALE_WHS', gPreSaleWhs);
    }
    else
    {
        gLastLogin= localStorage.getItem('LAST_LOGIN_ID');
        gCurrentRoute = localStorage.getItem('POS_CURRENT_ROUTE');
        gLoggedUser=gLastLogin;
        gLoginStatus=localStorage.getItem('LOGIN_STATUS');
        gUserCode = localStorage.getItem('LAST_USER_CODE');
        gUserCD = localStorage.getItem('LAST_USER_CD');
        gDefaultWhs = localStorage.getItem('POS_DEFAULT_WHS');
        gPreSaleWhs = localStorage.getItem('PRESALE_WHS');
    }
    $("#lblLoginID").text(gLastLogin);
    $(".loggedclass").text(gCurrentRoute);

}
function ValidateCredentials()
{
    pUserID = $("#txtUserID").val();
    var pPINCode = $("#txtPin").val();

    try
    {
        my_dialog("Espere...","validando usuario y password","open");

        if(isNaN(pPINCode))
        {
            my_dialog("", "", "close");
            notify('ERROR, Debe ingresar un valor numerico');
            $("#txtUserID").val('');
            $("#txtUserID").focus();
        }else
        {
            if (pPINCode === "") {
                my_dialog("", "", "close");
                notify("ERROR, ingrese usuario/pin.");
                return -1;
            }
            console.log("validatecredentials: "+pUserID);

            socket.emit('validatecredentials', {'loginid': pUserID, 'pin':pPINCode});
        }
    }catch(e)
    {
        my_dialog("", "", "close");
        console.log(e.message);    
    }

}

