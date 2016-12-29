class EndTurnButtonBehavior extends Sup.Behavior {
  awake() {
    this.actor.fMouseInput.emitter.on("leftClickReleased", () => { this.onLeftCLick(); });
  }
  
  public onLeftCLick() {
    BoardManagerBehavior.instance.onEndTurnButtonPressed();
  }
}
Sup.registerBehavior(EndTurnButtonBehavior);
