class InteraccionConUsuarioServicio implements IInteraccionConUsuarioServicio {
  static pantallaEstaBloqueada = false;

  static bloquearPantalla(): void {
    BloquearPantalla();
  }

  static desbloquearPantalla(): void {
    DesBloquearPantalla();
  }
}
