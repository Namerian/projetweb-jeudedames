class EndTurnButtonBehavior extends Sup.Behavior {
  awake() {
    this.actor.fMouseInput.emitter.on("leftClickReleased", () => { this.OnLeftCLick(); });
  }
  
  public OnLeftCLick() {
    BoardManagerBehavior.instance.OnEndTurnButtonPressed();
  }
}
Sup.registerBehavior(EndTurnButtonBehavior);
