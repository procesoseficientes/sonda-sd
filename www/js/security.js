function UpdateLoginInfo(pAction)//set/get
{
    var userLogged = "";

    

    if(pAction == "set")
    {
        localStorage.setItem('POS_LAST_LOGIN_ID', gLastLogin);
        localStorage.setItem('POS_CURRENT_ROUTE', gCurrentRoute);
        localStorage.setItem('POS_DEFAULT_WHS', gDefaultWhs);
        localStorage.setItem('POS_DBUSER', gdbuser);
        localStorage.setItem('POS_DBPASSWORD', gdbuserpass);

        localStorage.setItem('ROUTE_RETURN_WAREHOUSE', gRouteReturnWarehouse);
    }
    else
    {

        gLastLogin= localStorage.getItem('POS_LAST_LOGIN_ID');
        gCurrentRoute = localStorage.getItem('POS_CURRENT_ROUTE');
        gDefaultWhs = localStorage.getItem('POS_DEFAULT_WHS');
        gdbuser = localStorage.getItem('POS_DBUSER');
        gdbuserpass = localStorage.getItem('POS_DBPASSWORD');

        gRouteReturnWarehouse = localStorage.getItem('ROUTE_RETURN_WAREHOUSE');
    }

    userLogged = gCurrentRoute.split('@', 1);

    $("#lblLoginID").text(gLastLogin);
    $("#lblCurrentRoute").text(gCurrentRoute);

    $("#lblCurrentLoggedRoute").text(userLogged);

    $("#lblCurrentLoggedRouteSumm").text(userLogged);
    $("#lblCurrentLogged").text(gLastLogin);

    $("#lblCurrentLoggedRouteMenu").text(userLogged);

    $("#lblCurrentLoggedRouteCust").text(userLogged);
    $("#lblCurrentLoggedRouteSkusPOS").text(userLogged);

    $("#lblCurrentLoggedRouteSkusPOS_1").text(userLogged);
    
    $("#lblTotalDeposited").text(gTotalDeposited);
    //--
    $("#lblCurrentLoggedRouteDevolucion").text(userLogged);



}

