enum PlayerName{
      Red,
      Black
}

class BoardManagerBehavior extends Sup.Behavior {
  static instance: BoardManagerBehavior;
  
  //=====================
  
  camera: Sup.Camera;
  currentPlayerView: CurrentPlayerViewBehavior;
  
  //=====================
  
  piecesArray: PieceControllerBehavior[];
  
  currentPlayer: PlayerName;
  playerPossibleMoveActions: Action[];
  
  isPieceSelected: boolean;
  selectedPiece: PieceControllerBehavior;
  piecePossibleMoveActions: Action[];
  
  isActionSelected: boolean;
  selectedAction: Action;
  
  //======================================================================================
  //======================================================================================
  // behaviour methods
  //======================================================================================
  //======================================================================================
  
  awake() {
    BoardManagerBehavior.instance = this;
    
    this.camera = null;
    
    this.piecesArray = new Array<PieceControllerBehavior>();
    
    this.currentPlayer = null;
    this.playerPossibleMoveActions = null;
    
    this.isPieceSelected = false;
    this.selectedPiece =null;
    this.piecePossibleMoveActions = null;
    
    this.isActionSelected = false;
    this.selectedAction = null;
  }
  
  start(){
    this.camera = Sup.getActor("Camera").camera;
    this.actor.fMouseInput.emitter.on("leftClickReleased", () => { this.onClickOnBoard(); });
    
    this.SetupGame();
    
    this.startTurn(PlayerName.Red);
  }
  
  //======================================================================================
  //======================================================================================
  // gameflow methods
  //======================================================================================
  //======================================================================================
  
  
  // START TURN
  private startTurn(playerName: PlayerName){
    this.DeselectCurrentPiece();
    this.playerPossibleMoveActions = null;
    
    this.currentPlayer = playerName;
    this.currentPlayerView.setText(this.currentPlayer);
    this.playerPossibleMoveActions = this.computePossibleMoveActions(this.currentPlayer);
  }
  
  // SELECT PIECE
  private SelectPiece(piece:PieceControllerBehavior){
    //Sup.log("BoardManager:SelectPiece:called!");
    this.DeselectCurrentPiece();
    
    this.selectedPiece = piece;
    this.selectedPiece.selectPiece();
    this.isPieceSelected = true;
    
    this.piecePossibleMoveActions = new Array<Action>();
    for(let moveAction of this.playerPossibleMoveActions){
      //Sup.log("BoardManager:SelectPiece:piecePos="+JSON.stringify(piece.position)+" moveActionPiecePos="+JSON.stringify(moveAction.piece.position));
      if(moveAction.piece === piece){
        this.piecePossibleMoveActions.push(moveAction);
        moveAction.show();
      }
    }
    //Sup.log("BoardManager:SelectPiece:numOfPossibleMoves="+this.piecePossibleMoveActions.length);
    
    this.selectedAction = null;
    this.isActionSelected = false;
  }
  
  // DESELECT CURRENT PIECE
  private DeselectCurrentPiece(){
    if(this.isPieceSelected){
      this.selectedPiece.deselectPiece();
      
      for(let moveAction of this.piecePossibleMoveActions){
        moveAction.hide();
      }
      
      this.selectedPiece = null;
      this.isPieceSelected = false;
    }
  }
  
  // SELECT ACTION
  private selectAction(selectedAction: Action){
    for(let moveAction of this.piecePossibleMoveActions){
      moveAction.hide();
    }
    
    this.selectedAction = selectedAction;
    selectedAction.select();
    this.isActionSelected = true;
  }
  
  // ON END TURN BUTTON PRESSED
  public onEndTurnButtonPressed(){
    //Sup.log("BoardManager:onEndTurnButtonPressed:called!");
    
    if(this.isPieceSelected && this.isActionSelected){
      this.selectedPiece.deselectPiece();
      this.selectedAction.hide();
      this.selectedPiece.move(this.selectedAction.destination);
      
      this.startTurn(this.getOtherPlayer(this.currentPlayer));
    }
  }
  
  // ON CLICK ON BOARD
  public onClickOnBoard(){
    //Sup.log("BoardManager:onClickOnBoard:called!");
    
    let mousePos = Sup.Input.getMousePosition();
    //Sup.log("BoardManager:update:mouse clicked! pos="+JSON.stringify(mousePos));
    let mouseWorldPos = this.computeWorldPosFromScreenPos(mousePos);
    //Sup.log("BoardManager:update:mouseWorldPos="+JSON.stringify(mouseWorldPos));
    let mousedOverTile = {x:Math.floor(mouseWorldPos.x + 5), y:Math.floor(mouseWorldPos.y + 5)};
    
    let clickedPiece = this.GetPawnByPos(mousedOverTile);
    let clickedDestinationAction = null;

    if(this.isPieceSelected && this.piecePossibleMoveActions.length > 0){
      for(let moveAction of this.piecePossibleMoveActions){
        if(moveAction.destination.x === mousedOverTile.x && moveAction.destination.y === mousedOverTile.y){
          clickedDestinationAction = moveAction;
          //Sup.log("BoardManager:update:found move destination on clicked tile!");
          break;
        }
      }
    }

    if(clickedPiece !== null && clickedPiece.player === this.currentPlayer){
      this.SelectPiece(clickedPiece);
    }
    else if(clickedDestinationAction !== null){
      //Sup.log("BoardManager:update:click on move destination! pos="+JSON.stringify(clickedDestinationAction.destination));
      this.selectAction(clickedDestinationAction);           
    }
    else{
      this.DeselectCurrentPiece();
    }
  }
  
  //======================================================================================
  //======================================================================================
  // helper methods
  //======================================================================================
  //======================================================================================
  
  private computePossibleMoveActions(playerName: PlayerName) :Action[]{
    let result = new Array<Action>();
    
    for(let piece of this.piecesArray){
      if(piece.player === playerName){
        let pieceMoves = this.computePossibleMovesForPiece(piece);
        
        if(pieceMoves.length > 0){
          result = result.concat(pieceMoves);
        }
      }
    }
    
    //Sup.log("BoardManager:computePossibleMoveActions:numOfPossibleMoves="+result.length);
    return result;
  }
  
  private computePossibleMovesForPiece(piece: PieceControllerBehavior) :Action[]{
    //Sup.log("BoardManager:computePossibleMoves:called!")
    const redPossibleDeltas = [{x:-1,y:1}, {x:1,y:1}];
    const blackPossibleDeltas = [{x:-1,y:-1}, {x:1,y:-1}];
    
    let result = new Array<Action>();
    let deltas;
    let piecePos = piece.position;
    
    if(piece.player === PlayerName.Red){
      deltas = redPossibleDeltas;
    }
    else if(piece.player === PlayerName.Black){
      deltas = blackPossibleDeltas;
    }
    
    for(let i = 0; i < 2; i++){
      let possiblePos = {x:piecePos.x + deltas[i].x, y:piecePos.y + deltas[i].y};
      
      if(this.isPosLegal(possiblePos) && this.isTileEmpty(possiblePos)){
        result.push(new Action(ActionType.Move, piece, possiblePos));
      }
    }
    
    //Sup.log("BoardManager:computePossibleMoves:piecePos="+JSON.stringify(piecePos)+" numOfPossibleMoves="+result.length);
    return result;
  }
  
  private GetPawnByPos(pos:Sup.Math.XY) :PieceControllerBehavior{
    //Sup.log("BoardManager:GetPawnByPos:called! pos="+JSON.stringify(pos));
    
    for(let pawn of this.piecesArray){
      if(pawn.position.x === pos.x && pawn.position.y === pos.y){
        return pawn;
      }
    }
    
    return null;
  }
  
  private isTileEmpty(pos: Sup.Math.XY) :boolean{
    let piece = this.GetPawnByPos(pos);
    
    if(piece !== null){
      return false;
    }
    
    return true;
  }
  
  private computeWorldPosFromScreenPos(screenPos:Sup.Math.Vector2) :Sup.Math.XY{
    let screenSize = Sup.Input.getScreenSize();
    let pixelPos = {x:screenPos.x * (screenSize.x * 0.5), y:screenPos.y * (screenSize.y * 0.5)};
    let pixelToUnitRatio = this.camera.getOrthographicScale() / screenSize.y;
    let unitPos = {x:pixelPos.x * pixelToUnitRatio, y:pixelPos.y * pixelToUnitRatio};
    
    return unitPos;
  }
  
  private isPosLegal(pos: Sup.Math.XY) :boolean{
    if(pos.x >= 0 && pos.x <= 9 && pos.y >= 0 && pos.y <= 9){
      return true;
    }
    
    return false;
  }
  
  private getOtherPlayer(player: PlayerName) :PlayerName{
    if(player === PlayerName.Black){
      return PlayerName.Red;
    }
    else if(player === PlayerName.Red){
      return PlayerName.Black;
    }
  }
  
  //======================================================================================
  //======================================================================================
  // initialization methods
  //======================================================================================
  //======================================================================================
  
  private SetupGame(){
    this.CreatePawn(PlayerName.Red, {x:2, y:0});
    
    this.CreatePawn(PlayerName.Black, {x:1, y:9});
  }
  
  private CreatePawn(playerName:PlayerName, tilePosition:Sup.Math.XY){
    let actors = Sup.appendScene("Prefabs/PiecePrefab", this.actor);
    if(actors.length === 1 && actors[0].getName() === "Piece"){
      let newPawnController = actors[0].getBehavior(PieceControllerBehavior);
      newPawnController.initialize(playerName, tilePosition);
      this.piecesArray.push(newPawnController);
    }
  }
  
  //======================================================================================
  //======================================================================================
  //
  //======================================================================================
  //======================================================================================
  
  public createEmptyHalo(tilePos: Sup.Math.XY) :Sup.Actor{
    let actors = Sup.appendScene("Prefabs/EmptyHaloPrefab", this.actor);
    actors[0].setLocalPosition({x:tilePos.x + 0.5, y:tilePos.y + 0.5, z:0.5});
    return actors[0];
  }
  
  public createFilledHalo(tilePos: Sup.Math.XY) :Sup.Actor{
    let actors = Sup.appendScene("Prefabs/FilledHaloPrefab", this.actor);
    actors[0].setLocalPosition({x:tilePos.x + 0.5, y:tilePos.y + 0.5, z:0.5});
    return actors[0];
  }
  
  //======================================================================================
  //
  //======================================================================================
  
  
}
Sup.registerBehavior(BoardManagerBehavior);
