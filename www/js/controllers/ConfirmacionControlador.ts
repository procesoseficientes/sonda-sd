class ConfirmacionControlador {
  menuControlador: MenuControlador = new MenuControlador();
  invoiceHeader: FacturaEncabezado = new FacturaEncabezado();
  invoiceDetail: FacturaDetalle = new FacturaDetalle();
  felData: DatosFelParaFactura = new DatosFelParaFactura();
  socketIo: SocketIOClient.Socket = null;
  resumenTareaServicio: ResumenDeTareaServicio = new ResumenDeTareaServicio();
  facturaServicio: FacturaServicio = new FacturaServicio();
  facturacionElectronicaServicio: FacturacionElectronicaServicio = new FacturacionElectronicaServicio();
  shipmentDateTime;
  isContingencyDocument;
  controlDeSecuenciaServicio: ControlDeSecuenciaServicio = new ControlDeSecuenciaServicio();

  /**
   * Método que valida si se implementará FEL
   * y realiza validaciones correspondientes
   */
  validarSiImplementaraFEL(callback?: () => void) {
    this.menuControlador.cargarInformacionFel(
      localStorage.getItem(`user_type`),
      (display, implementaFel) => {
        this.ejecutarMetodosPrincipales(display, implementaFel, callback);
      },
      (error: Operacion) => {
        notify(`Error al validar si usará FEL: ${error.mensaje}`);
      }
    );
  }

  /**
   * Método que proporciona el socket para comunicación con
   * server
   * @param socketIo socket para comunicarse con el server
   */
  delegarSockets(socketIo: SocketIOClient.Socket) {
    this.socketIo = socketIo;

    this.socketIo.on(`get_e-signature_fail`, data => {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      this.reintentarSolicitudDeFirmaElectronica();
      notify(`Error al intentar obtener firma en el API: ${data.response}`);
    });

    this.socketIo.on(`get_e-signature_error`, data => {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      this.reintentarSolicitudDeFirmaElectronica();
      notify(`Error enviando solicitud de firma: ${data.response}`);
    });

    this.socketIo.on(`get_e-signature_success`, data => {
      this.validarSiSeObtuvoFirmaElectronica(data.response);
    });

    this.socketIo.on(`get_e-signature_for_contingency_doc_success`, data => {
      this.validarSiSeObtuvoFirmaElectronica(data.response, 1);
    });

    this.socketIo.on(`contingency_document_exist`, data => {
      this.felData.ElectronicSignature =
        data.response.invoice.electronicSignature;
      this.felData.DocumentSeries = data.response.invoice.documentSeries;
      this.felData.DocumentNumber = data.response.invoice.documentNumber;
      this.felData.DocumentUrl = data.response.invoice.documentUrl;
      this.felData.Shipment = data.response.invoice.shipment;
      this.felData.ValidationResult = data.response.invoice.validationResult;
      this.felData.ShipmentDatetime = data.response.invoice.shipmentDatetime;
      this.felData.ShipmentResponse = data.response.invoice.shipmentResponse;
      this.felData.ContingencyDocSerie =
        data.response.invoice.contingencyDocSerie;
      this.felData.ContingencyDocNum = data.response.invoice.contingencyDocNum;
      this.facturacionElectronicaServicio.actualizarDocumentoDeContingencia(
        data.response.invoice.invoiceId,
        this.felData,
        resultado => {
          notify(`No se pudo actualizar factura debido a ${resultado.mensaje}`);
        },
        () => {
          this.felData = new DatosFelParaFactura();
          listallinvoices();
        }
      );
      InteraccionConUsuarioServicio.desbloquearPantalla();
    });

    this.socketIo.on(`get_e-signature_for_contingency_doc_error`, data => {
      notify(`${data.response}`);
    });

    this.socketIo.on(`get_e-signature_fail_cd`, data => {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify(`Error al obtener firma: ${data.response}`);
      listallinvoices();
    });

    this.socketIo.on(`get_e-signature_error_cd`, data => {
      InteraccionConUsuarioServicio.desbloquearPantalla();
      notify(`${data.response}`);
      listallinvoices();
    });
  }

  /**
   * Método que valida la obtención de firma
   * electrónica de factura
   * @param response respuesta del server
   * @param isContingencyDocument validar si viene de documento de contingencia
   */
  validarSiSeObtuvoFirmaElectronica(response, isContingencyDoc: number = 0) {
    const url = `https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=`;
    const errorMsg =
      response.errorDescription || `Error en la petición de firma electrónica`;
    const resultMsg = `Resultado de firma: `;
    const resultIsSuccess = response.resultado || false;

    let message;
    let result;
    response.resultado
      ? ((result = response.descripcion), (message = resultMsg))
      : response.isSuccess
      ? ((result = response.descripcion_errores[0].mensaje_error),
        (message = resultMsg))
      : ((result = ``), (message = errorMsg));

    console.log(`${message}${result}`);

    if (resultIsSuccess) {
      this.felData.ElectronicSignature = response.uuid;
      this.felData.DocumentSeries = response.serie;
      this.felData.DocumentUrl = `${url}${response.uuid}`;
      this.felData.Shipment = response.resultado ? 1 : 0;
      this.felData.ValidationResult = response.resultado;
      this.felData.ShipmentDatetime = this.shipmentDateTime || "";
      this.felData.ShipmentResponse = response.descripcion;
      this.felData.DocumentNumber = response.numero;
      this.felData.FelDocumentType = localStorage.getItem("FEL_DOCUMENT_TYPE");
      this.felData.FelStablishmentCode = parseInt(
        localStorage.getItem("FEL_STABLISHMENT_CODE")
      );
      if (isContingencyDoc === 1) {
        this.facturacionElectronicaServicio.actualizarDocumentoDeContingencia(
          gInvoiceNUM,
          this.felData,
          resultado => {
            notify(`${resultado.mensaje}`);
          },
          () => {
            this.felData = new DatosFelParaFactura();
            listallinvoices();
          }
        );
      } else {
        this.facturaServicio.InsertarFactura(
          this.invoiceHeader,
          this.felData,
          resultado => {
            notify(`${resultado.mensaje}`);
          },
          () => {
            this.felData = new DatosFelParaFactura();
          }
        );
      }
      this.shipmentDateTime = "";
      this.invoiceHeader = null;
      InteraccionConUsuarioServicio.desbloquearPantalla();
      //gInvoiceNUM = 0;
      this.isContingencyDocument = 0;
    } else {
      this.felData.ElectronicSignature = "";
      this.felData.DocumentSeries = "";
      this.felData.DocumentUrl = "";
      this.felData.Shipment = 2;
      this.felData.ValidationResult = false;
      this.felData.ShipmentDatetime = this.shipmentDateTime || "";
      this.felData.ShipmentResponse = response.descripcion;
      this.felData.DocumentNumber = 0;
      this.felData.FelDocumentType = localStorage.getItem("FEL_DOCUMENT_TYPE");
      this.felData.FelStablishmentCode = parseInt(
        localStorage.getItem("FEL_STABLISHMENT_CODE")
      );
      if (isContingencyDoc === 1) {
        this.facturacionElectronicaServicio.actualizarDocumentoDeContingencia(
          gInvoiceNUM,
          this.felData,
          resultado => {
            notify(`${resultado.mensaje}`);
          },
          () => {
            this.felData = new DatosFelParaFactura();
            listallinvoices();
          }
        );
      }
    }

    if (message && message !== "") {
      notify(`${message}${result}`);
    }
    this.habilitarDeshabilitarBotones(!resultIsSuccess);
  }

  /**
   * Método para reintentar solicitud de firma electrónica
   */
  reintentarSolicitudDeFirmaElectronica(
    response?: any,
    isContingencyDoc: number = 0
  ) {
    navigator.notification.confirm(
      `¿Desea reintentar?`,
      btnIndex => {
        if (btnIndex == 2) {
          this.usuarioDeseaSolicitarFirmaElectronica(isContingencyDoc);
        } else if (isContingencyDoc == 0) {
          if (response) {
            this.iniciarProcesoDocumentoContingencia("", response);
          } else {
            this.iniciarProcesoDocumentoContingencia();
          }
        }
      },
      `Sonda® SD ${SondaVersion}`,
      [`NO`, `SI`]
    );
  }

  /**
   *Método para generar documentos de contingencia si el operador lo solicita
   * @param extraMessage mensaje extra si entra por un error
   * @param response solo si se mandó a firmar y no se pudo
   * completar solicitud por algún motivo.
   */
  iniciarProcesoDocumentoContingencia(
    extraMessage: string = "",
    response?: any
  ) {
    navigator.notification.confirm(
      `${extraMessage}¿Desea generar documento de contingencia?`,
      buttonIndex => {
        if (buttonIndex == 2) {
          InteraccionConUsuarioServicio.bloquearPantalla();
          this.controlDeSecuenciaServicio.obtenerSecuenciaDeDocumento(
            SecuenciaDeDocumentoTipo.DocumentoDeContingencia,
            (secuencia: any) => {
              if (secuencia.CURRENT_DOC < secuencia.DOC_TO) {
                this.invoiceHeader = (Object as any).assign(
                  new FacturaEncabezado(),
                  gInvoiceHeader
                );
                this.felData.ContingencyDocSerie = secuencia.SERIE;
                this.facturaServicio.ObtenerDetallesDeFacturaPorNumeroDeTarea(
                  this.invoiceHeader.invoiceNum,
                  (facturaDetalles: FacturaDetalle[]) => {
                    TareaServicio.obtenerTareaPorCodigoYTipo(
                      gTaskId,
                      "SALE",
                      tarea => {
                        this.invoiceHeader.clientAddress = tarea.taskAddress;
                        this.invoiceHeader.invoiceDetail = facturaDetalles;
                        this.invoiceHeader.department = tarea.department;
                        this.invoiceHeader.municipality = tarea.municipality;
                        this.invoiceHeader.nit = tarea.nit;
                        this.invoiceHeader.felData.FelDocumentType = localStorage.getItem(
                          "FEL_DOCUMENT_TYPE"
                        );
                        this.invoiceHeader.felData.FelStablishmentCode = parseInt(
                          localStorage.getItem("FEL_STABLISHMENT_CODE")
                        );
                        console.log(this.invoiceHeader);

                        this.felData.ContingencyDocNum =
                          secuencia.CURRENT_DOC < secuencia.DOC_FROM
                            ? secuencia.DOC_FROM
                            : secuencia.CURRENT_DOC + 1;
                        this.felData.DocumentUrl = null;
                        this.felData.Shipment = response ? 1 : 0;
                        this.felData.ValidationResult = response
                          ? response.resultado
                            ? true
                            : false
                          : false;
                        this.felData.ShipmentDatetime =
                          this.shipmentDateTime || "";
                        this.felData.ShipmentResponse = response
                          ? response.descripcion
                          : "";
                        this.felData.FelDocumentType = localStorage.getItem(
                          "FEL_DOCUMENT_TYPE"
                        );
                        this.felData.ElectronicSignature = null;
                        this.felData.DocumentSeries = null;
                        this.felData.IsContingencyDocument = true;
                        this.felData.FelStablishmentCode = parseInt(
                          localStorage.getItem("FEL_STABLISHMENT_CODE")
                        );
                        this.felData.DocumentNumber = 0;
                        this.facturaServicio.InsertarFactura(
                          this.invoiceHeader,
                          this.felData,
                          resultado => {
                            notify(
                              `Error insertando documento de contingencia: ${resultado.mensaje}`
                            );
                          },
                          () => {
                            this.felData = new DatosFelParaFactura();
                          }
                        );
                        this.controlDeSecuenciaServicio.actualizarSecuenciaDeDocumento(
                          SecuenciaDeDocumentoTipo.DocumentoDeContingencia,
                          this.felData.ContingencyDocNum,
                          (resultado: Operacion) => {
                            notify(resultado.mensaje);
                          }
                        );
                        this.shipmentDateTime = null;
                        this.invoiceHeader = null;
                        this.habilitarDeshabilitarBotones(false);
                      },
                      (resultado: string) => {
                        InteraccionConUsuarioServicio.desbloquearPantalla();
                        notify(resultado);
                      }
                    );
                  },
                  (error: Operacion) => {
                    InteraccionConUsuarioServicio.desbloquearPantalla();
                    notify(`${error.mensaje}`);
                  }
                );
              } else {
                InteraccionConUsuarioServicio.desbloquearPantalla();
                notify(
                  "Ya no cuenta con secuencia para documentos de contingencia disponibles. Consulte con su administrador."
                );
              }
            },
            errorMsg => {
              InteraccionConUsuarioServicio.desbloquearPantalla();
              notify(errorMsg);
            }
          );
          InteraccionConUsuarioServicio.desbloquearPantalla();
        }
      },
      `Sonda® SD ${SondaVersion}`,
      [`NO`, `SI`]
    );
  }

  /**
   * Método que arma la petición y solicita firma electrónica si hay
   * conexión con el server
   */
  usuarioDeseaSolicitarFirmaElectronica(IsContingencyDocument: number = 0) {
    if (gIsOnline === 0) {
      notify("No hay conexión con el servidor");
    } else {
      InteraccionConUsuarioServicio.bloquearPantalla();

      let self = this;

      let procesarFactura = function procesarFactura(factura) {
        self.facturaServicio.ObtenerDetallesDeFacturaPorNumeroDeTarea(
          gInvoiceNUM,
          (facturaDetalles: FacturaDetalle[]) => {
            TareaServicio.obtenerTareaPorCodigoYTipo(
              gTaskId,
              `SALE`,
              tarea => {
                self.facturacionElectronicaServicio.obtenerFrasesYEscenariosPorTipoDeDocumentoFel(
                  localStorage.getItem("FEL_DOCUMENT_TYPE"),
                  (frasesEscenarios: FraseEscenario[]) => {
                    factura.clientAddress = tarea.taskAddress;
                    factura.invoiceDetail = facturaDetalles;
                    factura.department = tarea.department;
                    factura.municipality = tarea.municipality;
                    factura.nit = tarea.nit;

                    factura.felData.FelDocumentType = localStorage.getItem(
                      "FEL_DOCUMENT_TYPE"
                    );

                    factura.felData.FelStablishmentCode = parseInt(
                      localStorage.getItem("FEL_STABLISHMENT_CODE")
                    );

                    self.shipmentDateTime = getDateTime();

                    let data = {
                      dbuser: gdbuser,
                      dbuserpass: gdbuserpass,
                      deviceId: device.uuid,
                      invoiceH: self.invoiceHeader,
                      phrasesScenarios: frasesEscenarios,
                      routeId: gCurrentRoute,
                      shipmentDatetime: self.shipmentDateTime
                    };

                    if (IsContingencyDocument === 0) {
                      SocketControlador.socketIo.emit(
                        `get_electronic_signature`,
                        data
                      );
                    } else {
                      SocketControlador.socketIo.emit(
                        `get_e-signature_for_contingency_doc`,
                        data
                      );
                    }
                  },
                  error => {
                    notify(error.mensaje);
                  }
                );
              },
              (resultado: string) => {
                notify(resultado);
              }
            );
          },
          (error: Operacion) => {
            InteraccionConUsuarioServicio.desbloquearPantalla();
            notify(`${error.mensaje}`);
          }
        );
      };

      if (IsContingencyDocument === 0) {
        this.invoiceHeader = (Object as any).assign(
          new FacturaEncabezado(),
          gInvoiceHeader
        );

        procesarFactura(this.invoiceHeader);
      } else {
        this.facturacionElectronicaServicio.obtenerDocumentoDeContingenciaPorNumeroDeFactura(
          gInvoiceNUM,
          (factura: FacturaEncabezado) => {
            self.invoiceHeader = (Object as any).assign(
              new FacturaEncabezado(),
              factura
            );

            procesarFactura(self.invoiceHeader);
          },
          (resultado: Operacion) => {
            notify(
              "No se pudo obtener documento de contingencia: " + resultado
            );
          }
        );
      }
    }
  }
  /**
   * Método que ejecuta las acciones iniciales cuando se valida si usa FEL
   * @param display Indica si se muestra o no el botón de solicitar firma
   * @param habilitar Indica si se habilitan, o deshabilitan, los botones
   */
  ejecutarMetodosPrincipales(
    display: string,
    habilitar: boolean,
    callback?: () => void
  ) {
    this.habilitarDeshabilitarBotones(habilitar);
    this.mostrarUOcultarBotonSolicitarFirma(display);

    if (callback) {
      let to = setTimeout(() => {
        clearTimeout(to);
        callback();
      }, 500);
    }
  }

  /**
   * Método que asigna el método de solicitar firma
   * electónica al botón correspondiente.
   */
  asignarEventoABotonSolicitarFirma() {
    $("#btnRequestElectronicSignature").on("click", () => {
      this.iniciarProcesoSolicitudDeFirmaElectronica();
    });
  }

  /**
   * Método que solicita la firma electrónica al
   * servidor.
   */
  iniciarProcesoSolicitudDeFirmaElectronica() {
    navigator.notification.confirm(
      `¿Desea solicitar firma electrónica?`,
      (buttonIndex: number) => {
        if (buttonIndex === 2) {
          if (gIsOnline === 1) {
            this.usuarioDeseaSolicitarFirmaElectronica();
          } else {
            this.iniciarProcesoDocumentoContingencia(
              `No hay conección con el servidor\n`
            );
          }
        } else {
          this.iniciarProcesoDocumentoContingencia();
        }
      },
      `Sonda® SD ${SondaVersion}`,
      [`NO`, `SI`]
    );
  }

  /**
   * Método que habilita o deshabilita los botones si
   * solicitó o no firma electrónica y la obtuvo.
   * @param isActive parámetro que valida si
   * se deshabilitan los botones
   */
  habilitarDeshabilitarBotones(isActive: boolean) {
    var prop = `pointer-events`;
    var propVal = isActive ? `` : `none`,
      propVal1 = isActive ? `none` : ``;
    var opacity1 = isActive ? (1).toString() : (0.5).toString(),
      opacity2 = isActive ? (0.5).toString() : (1).toString();

    // SET ACTIVE-INACTIVE
    $("#btnRequestElectronicSignature").css(prop, propVal);
    $("#btnConfirmedInvoice").css(prop, propVal1);
    $("#btnPrintIT").css(prop, propVal1);
    $("#btnInquest").css(prop, propVal1);

    // SET OPACITY
    $("#btnRequestElectronicSignature").css({ opacity: opacity1 });
    $("#UiContenedorControlesFacturacionConfirmada").css({ opacity: opacity2 });
  }

  /**
   * Método que sirve para mostrar u ocultar el botón
   * de solicitar firma electrónica
   * @param display Atributo display del botón
   */
  mostrarUOcultarBotonSolicitarFirma(display: string) {
    $("#requestElectronicSignature").css("display", display);
  }
}
