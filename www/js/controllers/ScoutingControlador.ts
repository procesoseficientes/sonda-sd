class ScoutingControlador {
  cliente: Cliente = new Cliente();
  clienteServicio: ClienteServicio = new ClienteServicio();
  reglaServicio: ReglaServicio = new ReglaServicio();
  etiquetaServicio: EtiquetaServicio = new EtiquetaServicio();
  reglasDeScouting: SqlResultSet;
  constructor(public mensajero: Messenger) {}

  delegarScoutingControlador(): void {
    const este: ScoutingControlador = this;

    $("#UiScoutingPage").on("pageshow", () => {
      InteraccionConUsuarioServicio.bloquearPantalla();
      este.cliente = new Cliente();
      $("input[data-type=\"search\"]").val("");
      este.limpiarCamposDeScouting(() => {
        este.reglaServicio.obtenerRegla(
          ReglaTipo.Scouting.toString(),
          reglasDeScouting => {
            este.reglasDeScouting = reglasDeScouting;
            este.cargarEtiquetasParaNuevoCliente(
              () => {
                DispositivoServicio.obtenerUbicacion(() => {
                  InteraccionConUsuarioServicio.desbloquearPantalla();
                });
              },
              resultado => {
                notify(resultado.mensaje);
              }
            );
          },
          error => {
            notify(error);
          }
        );
      });
    });

    $("#UiBtnBackFromScoutingPage").on("click", () => {
      este.usuarioDeseaVolverAPantallaAnterior();
    });

    $("#UiBtnTituloDeScouting").on("click", () => {
      notify("Ingreso de prospecto de cliente");
    });

    $("#UiBtnSaveScouting").on("click", () => {
      este.recogerDatosDeNuevoClienteYGuardarlo(este);
    });

    $("#UiBtnShowScoutingPage").on("click", () => {
      $.mobile.changePage("#UiScoutingPage", {
        transition: "flow",
        reverse: true,
        changeHash: true,
        showLoadMsg: false
      });
    });

    $("#UiBtnTakePicture1Scouting").on("click", () => {
      DispositivoServicio.TomarFoto(
        imgUrl => {
          let imgOneScouting: JQuery = $("#UiImg1Scouting");
          este.cliente.photo1 = `data:image/jpeg;base64,${imgUrl}`;
          imgOneScouting.attr("src", `data:image/jpeg;base64,${imgUrl}`);
          imgOneScouting.css("display", "block");
          imgOneScouting = null;
        },
        err => {
          notify(err);
        }
      );
    });

    $("#UiBtnClearPicture1Scouting").on("click", () => {
      let imgOneScouting: JQuery = $("#UiImg1Scouting");
      imgOneScouting.attr("src", "");
      imgOneScouting.css("display", "none");
      imgOneScouting = null;
      este.cliente.photo1 = "";
    });

    $("#UiBtnTakePicture2Scouting").on("click", () => {
      DispositivoServicio.TomarFoto(
        imgUrl => {
          let imgTwoScouting: JQuery = $("#UiImg2Scouting");
          este.cliente.photo2 = `data:image/jpeg;base64,${imgUrl}`;
          imgTwoScouting.attr("src", `data:image/jpeg;base64,${imgUrl}`);
          imgTwoScouting.css("display", "block");
          imgTwoScouting = null;
        },
        err => {
          notify(err);
        }
      );
    });

    $("#UiBtnClearPicture2Scouting").on("click", () => {
      let imgTwoScouting: JQuery = $("#UiImg2Scouting");
      imgTwoScouting.attr("src", "");
      imgTwoScouting.css("display", "none");
      imgTwoScouting = null;
      este.cliente.photo2 = "";
    });

    $("#UiBtnTakePicture3Scouting").on("click", () => {
      DispositivoServicio.TomarFoto(
        imgUrl => {
          let imgThreeScouting: JQuery = $("#UiImg3Scouting");
          este.cliente.photo3 = `data:image/jpeg;base64,${imgUrl}`;
          imgThreeScouting.attr("src", `data:image/jpeg;base64,${imgUrl}`);
          imgThreeScouting.css("display", "block");
          imgThreeScouting = null;
        },
        err => {
          notify(err);
        }
      );
    });

    $("#UiBtnClearPicture3Scouting").on("click", () => {
      let imgThreeScouting: JQuery = $("#UiImg3Scouting");
      imgThreeScouting.attr("src", "");
      imgThreeScouting.css("display", "none");
      imgThreeScouting = null;
      este.cliente.photo3 = "";
    });

    $("#UiTxtNameScouting").on("paste keyup", () => {
      $("#UiTxtNameContactScouting").val($("#UiTxtNameScouting").val());
      $("#UiTxtTaxInviceName").val($("#UiTxtNameScouting").val());
    });

    // comentar esto para Diprocom
    $("#UiTxtDirectionScouting").on("paste keyup", () => {
      $("#UiTxtTaxAddress").val($("#UiTxtDirectionScouting").val());
    });

    /**
     * Buscar el control "UiTxtDirectionScouting" en el HTML y cambiar su label por "Identificación:", actualmente tiene "Dirección:"
     * Y tambien cambiar el placeholder a "Identificación del cliente", actualmente tiene "Dirección del cliente"
     */

    // fin de cambios de Diprocom
  }

  limpiarCamposDeScouting(callback: () => void): void {
    let nameScouting: JQuery = $("#UiTxtNameScouting");
    let taxidScouting: JQuery = $("#UiTxtTaxIdScouting");
    let directionScouting: JQuery = $("#UiTxtDirectionScouting");
    let nameContactScouting: JQuery = $("#UiTxtNameContactScouting");
    let telephoneContactScouting: JQuery = $("#UiTxtTelephoneContactScouting");
    let invoiceNameScouting: JQuery = $("#UiTxtTaxInviceName");
    let invoiceAddressScouting: JQuery = $("#UiTxtTaxAddress");
    let imgOneScouting: JQuery = $("#UiImg1Scouting");
    let imgTwoScouting: JQuery = $("#UiImg2Scouting");
    let imgThreeScouting: JQuery = $("#UiImg3Scouting");
    let uiLabelTaxId: JQuery = $("#UiLabelTaxId");
    let etiquetaDeImpuesto: any = localStorage.getItem("TAX_ID");

    nameScouting.val("");
    // comentar esto para Diprocom
    taxidScouting.val("C/F");
    // habilitar esto
    // taxidScouting.val("");
    // fin de cambios de Diprocom
    taxidScouting.attr("placeholder", etiquetaDeImpuesto);
    uiLabelTaxId.text(etiquetaDeImpuesto);
    directionScouting.val("");
    nameContactScouting.val("");
    telephoneContactScouting.val("");
    invoiceNameScouting.val("");
    invoiceAddressScouting.val("");
    invoiceAddressScouting.val("");
    imgOneScouting.attr("src", "");
    imgOneScouting.css("display", "none");
    imgTwoScouting.attr("src", "");
    imgTwoScouting.css("display", "none");
    imgThreeScouting.attr("src", "");
    imgThreeScouting.css("display", "none");

    nameScouting.focus();

    nameScouting = null;
    taxidScouting = null;
    directionScouting = null;
    nameContactScouting = null;
    telephoneContactScouting = null;
    invoiceNameScouting = null;
    invoiceAddressScouting = null;
    imgOneScouting = null;
    imgTwoScouting = null;
    imgThreeScouting = null;
    uiLabelTaxId = null;

    callback();
  }

  usuarioDeseaVolverAPantallaAnterior(): void {
    let este: ScoutingControlador = this;
    switch ($.mobile.activePage[0].id) {
      case "UiScoutingPage":
        navigator.notification.confirm(
          "Esta seguro de cancelar el scouting? \n",
          buttonIndex => {
            if (buttonIndex === 2) {
              este.limpiarCamposDeScouting(() => {
                $.mobile.changePage("#menu_page", {
                  transition: "flow",
                  reverse: true,
                  changeHash: true,
                  showLoadMsg: false
                });
              });
            }
          },
          `Sonda® SD ${SondaVersion}`,
          ["No", "Si"]
        );
        break;
    }
  }

  recolectarInformacionBasicaDeNuevoCliente(
    callback: (nuevoCliente: Cliente) => void,
    errorCallback: (resultado: Operacion) => void
  ): void {
    let _this: ScoutingControlador = this;
    try {
      PagoConsignacionesServicio.ValidarSequenciaDeDocumentos(
        SecuenciaDeDocumentoTipo.Scouting,
        isValidSequence => {
          if (isValidSequence) {
            PagoConsignacionesServicio.ObtenerSiguienteSecuenciaDeDocumento(
              SecuenciaDeDocumentoTipo.Scouting,
              (docSerie, docNum) => {
                GetNexSequence(
                  "SCOUTING",
                  (seq: string) => {
                    let nameClient: JQuery = $("#UiTxtNameScouting");
                    let taxIdClient: JQuery = $("#UiTxtTaxIdScouting");
                    let addressClient: JQuery = $("#UiTxtDirectionScouting");
                    let contactNameClient: JQuery = $(
                      "#UiTxtNameContactScouting"
                    );
                    let telephoneContactNameClient: JQuery = $(
                      "#UiTxtTelephoneContactScouting"
                    );
                    let invoiceNameClient: JQuery = $("#UiTxtTaxInviceName");
                    let invoiceAddressClient: JQuery = $("#UiTxtTaxAddress");
                    let imgOneClient: JQuery = $("#UiImg1Scouting");
                    let imgTwoClient: JQuery = $("#UiImg2Scouting");
                    let imgThreeClient: JQuery = $("#UiImg3Scouting");

                    _this.cliente.clientId = seq;
                    _this.cliente.clientHhIdOld = seq;
                    _this.cliente.docSerie = docSerie;
                    _this.cliente.docNum = docNum;
                    _this.cliente.gps = gCurrentGPS;
                    if (nameClient.val() === "") {
                      $("#UiTxtNameScouting").focus();
                      errorCallback({
                        codigo: -1,
                        resultado: ResultadoOperacionTipo.Error,
                        mensaje: "Debe proporcionar el nombre del cliente."
                      } as Operacion);
                      return;
                    } else {
                      _this.cliente.clientName = nameClient.val();
                    }
                    _this.cliente.clientTaxId = taxIdClient.val();
                    _this.cliente.address =
                      addressClient.val() === "" ? "..." : addressClient.val();
                    _this.cliente.contactCustomer =
                      contactNameClient.val() === ""
                        ? "..."
                        : contactNameClient.val();
                    _this.cliente.contactPhone =
                      telephoneContactNameClient.val() === ""
                        ? "..."
                        : telephoneContactNameClient.val();
                    _this.cliente.billingName = invoiceNameClient.val();
                    _this.cliente.billingAddress = invoiceAddressClient.val();
                    _this.cliente.photo1 = imgOneClient.attr("src");
                    _this.cliente.photo2 = imgTwoClient.attr("src");
                    _this.cliente.photo3 = imgThreeClient.attr("src");

                    nameClient = null;
                    taxIdClient = null;
                    addressClient = null;
                    contactNameClient = null;
                    telephoneContactNameClient = null;
                    invoiceNameClient = null;
                    invoiceAddressClient = null;
                    imgOneClient = null;
                    imgTwoClient = null;
                    imgThreeClient = null;

                    callback(_this.cliente);
                  },
                  (err: any) => {
                    errorCallback({
                      codigo: -1,
                      resultado: ResultadoOperacionTipo.Error,
                      mensaje: err.message
                    } as Operacion);
                    return;
                  }
                );
              },
              error => {
                errorCallback({
                  codigo: -1,
                  resultado: ResultadoOperacionTipo.Error,
                  mensaje: error
                } as Operacion);
                return;
              }
            );
          } else {
            errorCallback({
              codigo: -1,
              resultado: ResultadoOperacionTipo.Error,
              mensaje:
                "No tiene una secuencia valida para crear el nuevo cliente, por favor, comuníquese con su Administrador."
            } as Operacion);
            return;
          }
        },
        error => {
          errorCallback({
            codigo: -1,
            resultado: ResultadoOperacionTipo.Error,
            mensaje: error
          } as Operacion);
          return;
        }
      );
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
      return;
    }
  }

  recolectarInformacionDeEtiquetasDeNuevoCliente(
    cliente: Cliente,
    callback: (clienteCompleto: Cliente) => void,
    errorCallback: (resultado: Operacion) => void
  ): void {
    try {
      let contenedorDeEtiquetas: JQuery = $("input[type=checkbox]:checked");
      let etiquetasDeCliente: Etiqueta[] = new Array<Etiqueta>();
      if (contenedorDeEtiquetas) {
        etiquetasDeCliente = contenedorDeEtiquetas
          .map((index: number, element: any) => {
            let control: any = element;
            return <Etiqueta>{
              tagColor: $(control).attr("id"),
              docSerieClient: cliente.docSerie,
              docNumClient: cliente.docNum
            };
          })
          .get();
        cliente.tags = etiquetasDeCliente;
        callback(cliente);
        contenedorDeEtiquetas = null;
      } else {
        cliente.tags = etiquetasDeCliente;
        callback(cliente);
      }
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
      return;
    }
  }

  recogerDatosDeNuevoClienteYGuardarlo(este: ScoutingControlador): void {
    este.recolectarInformacionBasicaDeNuevoCliente(
      clienteTemp => {
        este.recolectarInformacionDeEtiquetasDeNuevoCliente(
          clienteTemp,
          clienteCompleto => {
            este.validarReglasDeScouting(
              clienteCompleto,
              este.reglasDeScouting,
              0,
              clienteRetornado => {
                este.clienteServicio.guardarScouting(
                  clienteRetornado,
                  clienteCompletoRegresado => {
                    este.limpiarCamposDeScouting(() => {
                      ToastThis("Cliente guardado exitosamente...");
                      EnviarData();
                      $.mobile.changePage("#menu_page", {
                        transition: "flow",
                        reverse: true,
                        changeHash: true,
                        showLoadMsg: false
                      });
                    });
                  },
                  resultado => {
                    notify(resultado.mensaje);
                  }
                );
              },
              resultado => {
                notify(resultado.mensaje);
              }
            );
          },
          resultado => {
            notify(resultado.mensaje);
          }
        );
      },
      resultado => {
        notify(resultado.mensaje);
      }
    );
  }

  validarReglasDeScouting(
    cliente: Cliente,
    reglasDeScouting: any,
    indiceDeReglaActual: any,
    callback: (cliente: Cliente) => void,
    errorCallback: (resultado: Operacion) => void
  ): void {
    let este: ScoutingControlador = this;
    try {
      if (reglasDeScouting == null) {
        callback(cliente);
        return;
      }

      if (indiceDeReglaActual < reglasDeScouting.rows.length) {
        let reglaAct: any = reglasDeScouting.rows.item(indiceDeReglaActual);

        switch (reglaAct.TYPE_ACTION) {
          case "FotografiaObligatoria":
            if (reglaAct.ENABLED.toUpperCase() === "SI") {
              if (
                cliente.photo1 === "" &&
                cliente.photo2 === "" &&
                cliente.photo3 === ""
              ) {
                throw new Error("Debe tomar como mínimo dos fotografías");
              } else if (cliente.photo1 === "" && cliente.photo2 === "") {
                throw new Error("Debe tomar como mínimo dos fotografías");
              } else if (cliente.photo2 === "" && cliente.photo3 === "") {
                throw new Error("Debe tomar como mínimo dos fotografías");
              } else if (cliente.photo1 === "" && cliente.photo3 === "") {
                throw new Error("Debe tomar como mínimo dos fotografías");
              } else {
                callback(cliente);
              }
            } else {
              callback(cliente);
            }
            break;
          default:
            este.validarReglasDeScouting(
              cliente,
              reglasDeScouting,
              indiceDeReglaActual + 1,
              clienteReturn => {
                callback(clienteReturn);
              },
              resultado => {
                errorCallback(resultado);
              }
            );
            break;
        }
      } else {
        callback(cliente);
      }
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
      return;
    }
  }

  cargarEtiquetasParaNuevoCliente(
    callback: () => void,
    errorCallback: (resultado: any) => void
  ): void {
    let este: ScoutingControlador = this;
    try {
      este.etiquetaServicio.obtenerEtiquetas(
        etiquetas => {
          let li: string = "";
          let contenedorEtiquetas: JQuery = $("#UiListTagsForScouting");
          contenedorEtiquetas.children().remove("li");

          etiquetas.map(etiqueta => {
            li += "<li>";
            li += `<label for="${etiqueta.tagColor}">${
              etiqueta.tagValueText
            }</label>`;
            li += `<input type="checkbox" id="${etiqueta.tagColor}">`;
            li += "</li>";
          });
          if (li !== "") {
            contenedorEtiquetas.append(li);
            contenedorEtiquetas.listview("refresh");
            contenedorEtiquetas.trigger("create");
            contenedorEtiquetas = null;
            callback();
          } else {
            contenedorEtiquetas = null;
            callback();
          }
        },
        resultado => {
          errorCallback(resultado);
          return;
        }
      );
    } catch (e) {
      errorCallback({
        codigo: -1,
        resultado: ResultadoOperacionTipo.Error,
        mensaje: e.message
      } as Operacion);
    }
  }
}
