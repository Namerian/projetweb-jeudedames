enum Player{
      Red,
      Black
}

class BoardManagerBehavior extends Sup.Behavior {
  pawn: PawnControllerBehavior[];
  
  awake() {
    this.pawn = new Array<PawnControllerBehavior>();
  }
  
  start(){
    let actors = Sup.appendScene("Prefabs/PawnPrefab", this.actor);
    if(actors.length === 1){
      let newPawnController = actors[0].getBehavior(PawnControllerBehavior);
      newPawnController.initialize(Player.Red, {x:0,y:0});
      this.pawn.push(newPawnController);
    }
  }

  update() {
    if(Sup.Input.wasMouseButtonJustPressed(0)){
      let mousePos = Sup.Input.getMousePosition();
      if(mousePos.x >= -5 && mousePos.x <= 5 && mousePos.y >= -5 && mousePos.y <= 5){
        let mousedOverTile = {x:Math.floor(mousePos.x + 5), y:Math.floor(mousePos.y + 5)};
      }
    }
  }
  
  private GetPawnByPos(pos:Sup.Math.XY) :PawnControllerBehavior{
    for(let pawn of this.pawn){
      if(pawn.position.x === pos.x && pawn.position.y === pos.y){
        return pawn;
      }
    }
  }
}
Sup.registerBehavior(BoardManagerBehavior);
