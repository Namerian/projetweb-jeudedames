enum PlayerName{
      Red,
      Black
}

class BoardManagerBehavior extends Sup.Behavior {
  camera :Sup.Camera;
  
  piecesArray :PieceControllerBehavior[];
  
  currentPlayer :PlayerName;
  selectedPiece :PieceControllerBehavior;
  
  awake() {
    this.piecesArray = new Array<PieceControllerBehavior>();
  }
  
  start(){
    this.camera = Sup.getActor("Camera").camera;
    
    this.SetupGame();
    
    this.currentPlayer = PlayerName.Red;
  }

  update() {
    if(Sup.Input.wasMouseButtonJustPressed(0)){
      let mousePos = Sup.Input.getMousePosition();
      //Sup.log("BoardManager:update:mouse clicked! pos="+JSON.stringify(mousePos));
      let mouseWorldPos = this.computeWorldPosFromScreenPos(mousePos);
      //Sup.log("BoardManager:update:mouseWorldPos="+JSON.stringify(mouseWorldPos));
      
      
      if(mouseWorldPos.x >= -5 && mouseWorldPos.x <= 5 && mouseWorldPos.y >= -5 && mouseWorldPos.y <= 5){
        let mousedOverTile = {x:Math.floor(mouseWorldPos.x + 5), y:Math.floor(mouseWorldPos.y + 5)};
        let clickedPiece = this.GetPawnByPos(mousedOverTile);
        
        if(clickedPiece !== null && clickedPiece.player === this.currentPlayer){
          this.SelectPiece(clickedPiece);
        }
        else{
          this.DeselectCurrentPiece();
        }
      }
    }
  }
  
  //======================================================================================
  //
  //======================================================================================
  
  private SelectPiece(piece:PieceControllerBehavior){
    //Sup.log("BoardManager:SelectPiece:called!");
    
    this.DeselectCurrentPiece();
    
    this.selectedPiece = piece;
    this.selectedPiece.selectPiece();
  }
  
  private DeselectCurrentPiece(){
    if(this.selectedPiece != undefined && this.selectedPiece != null){
      this.selectedPiece.deselectPiece();
      this.selectedPiece = null;
    }
  }
  
  //======================================================================================
  //
  //======================================================================================
  
  private GetPawnByPos(pos:Sup.Math.XY) :PieceControllerBehavior{
    //Sup.log("BoardManager:GetPawnByPos:called! pos="+JSON.stringify(pos));
    
    for(let pawn of this.piecesArray){
      if(pawn.position.x === pos.x && pawn.position.y === pos.y){
        return pawn;
      }
    }
    
    return null;
  }
  
  private computeWorldPosFromScreenPos(screenPos:Sup.Math.Vector2) :Sup.Math.XY{
    let screenSize = Sup.Input.getScreenSize();
    let pixelPos = {x:screenPos.x * (screenSize.x * 0.5), y:screenPos.y * (screenSize.y * 0.5)};
    let pixelToUnitRatio = this.camera.getOrthographicScale() / screenSize.y;
    let unitPos = {x:pixelPos.x * pixelToUnitRatio, y:pixelPos.y * pixelToUnitRatio};
    
    return unitPos;
  }
  
  //======================================================================================
  // initialization methods
  //======================================================================================
  
  private SetupGame(){
    this.CreatePawn(PlayerName.Red, {x:2, y:0});
  }
  
  private CreatePawn(playerName:PlayerName, tilePosition:Sup.Math.XY){
    let actors = Sup.appendScene("Prefabs/PiecePrefab", this.actor);
    if(actors.length === 1 && actors[0].getName() === "Piece"){
      let newPawnController = actors[0].getBehavior(PieceControllerBehavior);
      newPawnController.initialize(playerName, tilePosition);
      this.piecesArray.push(newPawnController);
    }
  }
}
Sup.registerBehavior(BoardManagerBehavior);
