var ListaDeTareasControlador = (function () {
    function ListaDeTareasControlador(mensajero) {
        this.mensajero = mensajero;
        this.seGeneroListaDeTareas = false;
    }
    ListaDeTareasControlador.prototype.delegadoListaDeTareasControlador = function () {
        $("#pickupplan_page").on("pageshow", function () {
            $("#UiBotonTabTareasAsignadas").addClass("ui-btn-active");
        });
    };
    return ListaDeTareasControlador;
}());
//# sourceMappingURL=ListaDeTareasControlador.js.map