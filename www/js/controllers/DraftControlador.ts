/// <reference path="../vertical/procesartipodetareamensaje.ts" />
/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="../modelo/tiposyestados/tipos.ts" />
/// <reference path="../modelo/entidades/operacion.ts" />
/// <reference path="../services/DraftServicio.ts" />
/// <reference path="../vertical/facturadraftmensaje.ts" />
/// <reference path="../vertical/ordendeventadraftmensaje.ts" />

declare function notify(pMessage: string): void;

class DraftControlador {
    draftServicio = new DraftServicio();
    clienteServicio = new ClienteServicio();

    ordenesDeVentaDraft: OrdenDeVenta[];
    facturasDraft: Factura[];
    sePublicoSoDraft: boolean;
    tareaServicio = new TareaServcio();

    constructor(public mensajero: Messenger) {

    }

    delegarDraftControlador() {

        $("#UiBtnListadoDocumentosDraft").bind("touchstart", () => {
            this.usuarioDeseaVerListadoDeDraft();
        });

        $("#UiPageDocsDraft").on("pageshow", () => {
            this.obtenerDrafts();
        });

        $("#UiPageDocsDraft").on("click", "#UiListaOrdenDeVentaDraft li", (event) => {
            var id = (<any>event).currentTarget.attributes["id"].nodeValue;
            this.usuarioDeseaVerDocumentoDeDraft(id);
        });

        //$("#UiPageDocsDraft").on("click", "#UiListaFacturasDraft li", (event) => {
        //    var id = (<any>event).currentTarget.attributes["id"].nodeValue;
        //    this.usuarioDeseaVerDocumentoDeDraft(id);
        //});

    }

    usuarioDeseaVerListadoDeDraft() {
        $.mobile.changePage("#UiPageDocsDraft",
            {
                transition: "pop",
                reverse: true,
                changeHash: true,
                showLoadMsg: false
            });
    }

    obtenerDrafts() {
        var listaSalesOrderDraft = $("#UiListaOrdenDeVentaDraft");
        listaSalesOrderDraft.children().remove("li");
        listaSalesOrderDraft = null;

        //var listaInvoiceDraft = $("#UiListaFacturasDraft");
        //listaInvoiceDraft.children().remove("li");
        //listaInvoiceDraft = null;

        this.draftServicio.obtenerDraftsOrdenDeVenta((ordenes: OrdenDeVenta[]) => {
            this.draftServicio.obtenerDetalleDeOrdenDeVentaDraft(ordenes, (ordenes: OrdenDeVenta[]) => {

                this.ordenesDeVentaDraft = ordenes;
                this.cargarLista(null, ordenes);
                this.actualizarTareaIdABorradorOrdeDeVenta();
            }, (resultado: Operacion) => {
                this.mostrarMsjDeVacio(resultado.mensaje, "OrdenesDeVenta");
            });
        }, (resultado: Operacion) => {
            this.mostrarMsjDeVacio(resultado.mensaje, "OrdenesDeVenta");
        });

        //this.draftServicio.obtenerDraftDeFacturas((facturas: Factura[]) => {
        //    this.facturasDraft = facturas;
        //    this.cargarLista(facturas, null);
        //}, (resultado: Operacion) => {
        //    this.mostrarMsjDeVacio(resultado.mensaje,"Facturas");
        //});

    }

    actualizarTareaIdABorradorOrdeDeVenta() {
        try {
            for (var i = 0; i < this.ordenesDeVentaDraft.length; i++) {
                if (this.ordenesDeVentaDraft[i].taskId === 0) {
                    this.draftServicio.obtenerTaskIdParaBorradorDeOrdenDeVenta(this.ordenesDeVentaDraft[i], i, (ordenDeVenta: OrdenDeVenta, indice: number) => {
                        this.ordenesDeVentaDraft[indice] = ordenDeVenta;
                        if (this.ordenesDeVentaDraft[indice].taskId !== 0) {
                            this.draftServicio.actualizarTareaIdParaBorradorDeOrdenDeVenta(this.ordenesDeVentaDraft[indice], () => {
                                //--
                            }, (resultado: Operacion) => {
                                this.mostrarMsjDeVacio(resultado.mensaje, "OrdenesDeVenta");
                            });
                        }
                    }, (resultado: Operacion) => {
                        this.mostrarMsjDeVacio(resultado.mensaje, "OrdenesDeVenta");
                    });
                }
            }
        } catch (err) {
            notify("Erro al actualizar la tarea id para el borrador: " + err.message);
        }
    }

    cargarLista(facturas: Factura[], ordenDeVenta: OrdenDeVenta[]) {
        var objetoUl = null; //$('#UiListaFacturasDraft');
        var esFactura = true;
        if (facturas === null || facturas === undefined) {
            esFactura = false;
            objetoUl = $("#UiListaOrdenDeVentaDraft");
        }

        // ReSharper disable once QualifiedExpressionMaybeNull
        for (var i = 0; i < (esFactura ? facturas.length : ordenDeVenta.length); i++) {
            var li: string = "";

            li += "<li data-icon='false' id='" + (esFactura ? ("IV" + facturas[i].invoiceNum) : ("SO" + ordenDeVenta[i].salesOrderId)) + "'>";
            li += "<span class='title'>Documento No. " + (esFactura ? facturas[i].invoiceNum : ordenDeVenta[i].salesOrderId) + "</span>";
            li += "<p>";
            li += "<span class='ui-content'>" + "<b>" + "CLIENTE: " + "</b>" + (esFactura ? facturas[i].clientName : ordenDeVenta[i].clientName) + "</span> <br>";
            li += "<span class='ui-content'>" + "<b>" + "MONTO: " + "</b>" + DarFormatoAlMonto((esFactura ? facturas[i].totalAmount : ordenDeVenta[i].totalAmount)) + "</span><br>";
            li += "<span class='ui-content'>" + "<b>" + "CREADA EL: " + "</b>" + (esFactura ? facturas[i].postedDatetime : ordenDeVenta[i].postedDatetime) + "</span>";
            li += "</p>";
            li += "</li>";

            objetoUl.append(li);
            objetoUl.listview("refresh");
            objetoUl.trigger("create");
        }
        objetoUl = null;
    }

    mostrarMsjDeVacio(mensaje: string, objeto: string) {
        var objetoUl = objeto === "Facturas" ? $("#UiListaFacturasDraft") : $("#UiListaOrdenDeVentaDraft");
        objetoUl.children().remove("li");
        var li: string = "";
        li += "<li style='text-align:center'>";
        li += "<span style='text-align:center;font-size:10px;'>" + mensaje + "</span>";
        li += "</li>";
        objetoUl.append(li);
        objetoUl.listview("refresh");
        objetoUl.trigger("create");
        objetoUl = null;
    }

    usuarioDeseaVerDocumentoDeDraft(id: string) {
        if (id !== undefined && id !== null) {
            var esFactura = (id.substring(0, 2) === "IV");

            var listaDeDocumentos = esFactura ? this.facturasDraft : this.ordenesDeVentaDraft;
            var idDoc = parseInt(id.substring(2));

            for (var i = 0; i < listaDeDocumentos.length; i++) {
                if (esFactura) {
                    if ((<Factura>listaDeDocumentos[i]).invoiceNum === idDoc) {
                        //this.publicarFacturaDraft(<Factura>listaDeDocumentos[i]);
                    }
                } else {
                    if ((<OrdenDeVenta>listaDeDocumentos[i]).salesOrderId === idDoc) {

                        var documentoSoDraft = (<OrdenDeVenta>listaDeDocumentos[i]);

                        gtaskid = (documentoSoDraft.taskId === 0 ? 0 : documentoSoDraft.taskId);
                        gTaskType = TareaTipo.Preventa;
                        gClientID = documentoSoDraft.clientId;

                        if (gtaskid !== 0) {
                            var tarea = new Tarea();
                            tarea.taskId = gtaskid;
                            this.tareaServicio.obtenerTarea(tarea, (tarea: Tarea) => {
                                switch (tarea.taskStatus) {
                                    case TareaEstado.Aceptada:
                                        this.publicarSolicitudDeMetodoCargarTarea(TipoTarea.Preventa);
                                        break;
                                    case TareaEstado.Asignada:
                                        $.mobile.changePage("#taskdetail_page", {
                                            transition: "flow",
                                            reverse: true,
                                            changeHash: false,
                                            showLoadMsg: false
                                        });
                                        break;
                                }
                            }, (resultado: Operacion) => {
                                notify(resultado.mensaje);
                            });
                        } else {
                            this.publicarSolicitudDeMetodoCargarTarea(TipoTarea.Preventa);
                            this.publicarOrdenDeVentaDraft(documentoSoDraft);
                        }
                    }
                }

            }
        }

        // ReSharper disable once NotAllPathsReturnValue
    }

    publicarOrdenDeVentaDraft(ordenDeVenta: OrdenDeVenta) {
        var msg = new OrdenDeVentaDraftMensaje(this);
        msg.ordenDeVenta = ordenDeVenta;
        this.mensajero.publish(msg, getType(OrdenDeVentaDraftMensaje));
        this.sePublicoSoDraft = true;
    }

    //publicarFacturaDraft(factura: Factura) {
    //    var msg = new FacturaDraftMensaje(this);
    //    msg.factura = factura;
    //    this.mensajero.publish(msg, getType(FacturaDraftMensaje));
    //}

    publicarSolicitudDeMetodoCargarTarea(tipoTarea: TipoTarea) {
        var msg = new ProcesarTipoDeTareaMensaje(this);
        msg.tipoTarea = tipoTarea;
        this.mensajero.publish(msg, getType(ProcesarTipoDeTareaMensaje));
    }

}