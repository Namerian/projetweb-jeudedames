class BoardManagerBehavior extends Sup.Behavior {
  pawn: Sup.Actor[];
  
  awake() {
    
  }
  
  start(){
    this.pawn= Sup.appendScene("Prefabs/PawnPrefab", this.actor);
    
    this.pawn[0].getBehavior(PawnControllerBehavior).initialize();
    this.pawn[0].setLocalPosition(0.5,0.5,1);
  }

  update() {
    
  }
}
Sup.registerBehavior(BoardManagerBehavior);
