class VictoryScreenViewBehavior extends Sup.Behavior {
  awake() {
    BoardManagerBehavior.instance.victoryScreenView = this;
  }
  
  public activate(winner: PlayerName){
    this.actor.setVisible(true);
    
    if(winner === PlayerName.Black){
      this.actor.textRenderer.setText("Black\nWins!");
    }
    else if(winner === PlayerName.Red){
      this.actor.textRenderer.setText("Red\nWins!");
    }
    
    this.actor.fMouseInput.emitter.on("leftClickReleased", () => { this.onLeftCLick(); });
  }
  
  public onLeftCLick() {
    Sup.exit();
  }
}
Sup.registerBehavior(VictoryScreenViewBehavior);
