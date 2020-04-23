class EncuestaMensaje {
  encuestas: Microencuesta[];
  numeroDeEncuestaAProcesar: number;
  callbackAction: () => void;
  isFromDraft: boolean;

  constructor(public sender: any) {}
}
