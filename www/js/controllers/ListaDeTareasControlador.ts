class ListaDeTareasControlador {

    seGeneroListaDeTareas = false;

    constructor(public mensajero: Messenger) {
        
    }

    delegadoListaDeTareasControlador() {
        $("#pickupplan_page").on("pageshow", () => {
            $("#UiBotonTabTareasAsignadas").addClass("ui-btn-active");
        });
    }
}