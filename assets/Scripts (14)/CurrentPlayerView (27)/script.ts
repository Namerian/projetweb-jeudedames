class CurrentPlayerViewBehavior extends Sup.Behavior {
  awake() {
    BoardManagerBehavior.instance.currentPlayerView = this;
  }

  public setText(player: PlayerName){
    if(player === PlayerName.Black){
      this.actor.textRenderer.setText("Player: Black");
    }
    else if(player === PlayerName.Red){
      this.actor.textRenderer.setText("Player: Red");
    }
  }
}
Sup.registerBehavior(CurrentPlayerViewBehavior);
