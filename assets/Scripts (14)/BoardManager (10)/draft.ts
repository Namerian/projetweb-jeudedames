enum PlayerName{
      Red,
      Black
}

class BoardManagerBehavior extends Sup.Behavior {
  static instance: BoardManagerBehavior;
  
  //=====================
  
  camera: Sup.Camera;
  currentPlayerView: CurrentPlayerViewBehavior;
  victoryScreenView: VictoryScreenViewBehavior;
  
  //=====================
  
  piecesArray: PieceControllerBehavior[];
  isGameRunning: boolean;
  
  currentPlayer: PlayerName;
  playerPossibleActions: Action[];
  
  isPieceSelected: boolean;
  selectedPiece: PieceControllerBehavior;
  
  possibleActions: Action[];
  
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
    this.isGameRunning = false;
    
    this.currentPlayer = null;
    this.playerPossibleActions = null;
    
    this.isPieceSelected = false;
    this.selectedPiece =null;
    
    this.possibleActions = null;
    
    this.isActionSelected = false;
    this.selectedAction = null;
  }
  
  start(){
    this.camera = Sup.getActor("Camera").camera;
    this.actor.fMouseInput.emitter.on("leftClickReleased", () => { this.onClickOnBoard(); });
    
    this.SetupGame();
    
    this.isGameRunning = true;
    
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
    this.playerPossibleActions = null;
    
    let redPlayerDead = true;
    let blackPlayerDead = true;
    
    for(let piece of this.piecesArray){
      if(piece.player === PlayerName.Black && !piece.isDead){
        blackPlayerDead = false;
      }
      else if(piece.player === PlayerName.Red && !piece.isDead){
        redPlayerDead = false;
      }
    }
    
    if(blackPlayerDead){
      this.isGameRunning = false;
      this.victoryScreenView.activate(PlayerName.Red);
    }
    else if(redPlayerDead){
      this.isGameRunning = false;
      this.victoryScreenView.activate(PlayerName.Black);
    }
    else{
      this.currentPlayer = playerName;
      this.currentPlayerView.setText(this.currentPlayer);

      this.playerPossibleActions = this.computePossibleTakeActions(this.currentPlayer);

      if(this.playerPossibleActions.length === 0){
        this.playerPossibleActions = this.computePossibleMoveActions(this.currentPlayer);
      }
    }
  }
  
  //*************
  // SELECT PIECE
  private SelectPiece(piece:PieceControllerBehavior){
    this.DeselectCurrentPiece();
    
    this.selectedPiece = piece;
    this.selectedPiece.selectPiece();
    this.isPieceSelected = true;
    
    this.possibleActions = new Array<Action>();
    
    for(let action of this.playerPossibleActions){
      if(action.piece === piece){
        this.possibleActions.push(action);
      }
    }
    
    HaloManagerBehavior.instance.createPossibleActionsHalos(this.possibleActions);
        
    this.selectedAction = null;
    this.isActionSelected = false;
  }
  
  //***********************
  // DESELECT CURRENT PIECE
  private DeselectCurrentPiece(){
    if(this.isPieceSelected){
      this.selectedPiece.deselectPiece();
      this.selectedPiece = null;
      
      if(this.isActionSelected){
        this.isActionSelected = false;
        this.selectedAction = null;
        HaloManagerBehavior.instance.destroySelectedActionHalos();
      }
      
      HaloManagerBehavior.instance.destroyPossibleActionHalos();
      
      this.isPieceSelected = false;
    }
  }
  
  //**************
  // SELECT ACTION
  private selectAction(action: Action){
    this.possibleActions.length = 0;
    HaloManagerBehavior.instance.destroyPossibleActionHalos();
    
    this.selectedAction = action;
    HaloManagerBehavior.instance.createSelectedActionHalos(this.selectedAction);
    this.isActionSelected = true;
    
    if(this.selectedAction.type === ActionType.Take){
      Sup.log("===================");
      let piecePos = this.selectedAction.destination;
      let pieceOwner = this.selectedPiece.player;
      let pieceIsKing = this.selectedPiece.isKing;
      
      let possibleActions: Action[];
      let legalActions = new Array<Action>();
      
      let previousTakePositions = new Array<Sup.Math.XY>();
      let previousAction: Action;
      
      if(!pieceIsKing){
        if(pieceOwner === PlayerName.Black && piecePos.y === 0){
          pieceIsKing = true;
        }
        else if(pieceOwner === PlayerName.Red && piecePos.y === 9){
          pieceIsKing = true;
        }
      }
      
      possibleActions = this.computePossibleTakesForPiece(this.selectedPiece, piecePos, pieceOwner, pieceIsKing);
      Sup.log("found "+possibleActions.length+" possible take actions");
      
      if(possibleActions.length === 0){
        return;
      }
      
      previousAction = this.selectedAction;
      while(true){
        previousTakePositions.push(previousAction.takenPiecePos);
        Sup.log("previous take pos="+JSON.stringify(previousAction.takenPiecePos));

        if(previousAction.previousAction !== null){
          previousAction = previousAction.previousAction;
        }
        else{
          break;
        }
      }
      
      Sup.log("found "+previousTakePositions.length+" previous take positions");
      
      for(let possibleAction of possibleActions){
        Sup.log("possible action: takePos="+JSON.stringify(possibleAction.takenPiecePos)+" destination="+JSON.stringify(possibleAction.destination));
        for(let previousTakePos of previousTakePositions){
          let pos = possibleAction.takenPiecePos;
          
          Sup.log("check: pos.x="+pos.x+" prev.x="+previousTakePos.x+" pos.y="+pos.y+" prev.y="+previousTakePos.y);
          if(pos.x !== previousTakePos.x || pos.y !== previousTakePos.y){
            possibleAction.previousAction
            legalActions.push(possibleAction);
          }
        }
      }
      
      Sup.log("found "+legalActions.length+" legal take actions");
      
      if(legalActions.length === 0){
        return;
      }
      
      this.possibleActions = legalActions;
      HaloManagerBehavior.instance.createPossibleActionsHalos(this.possibleActions);
    }
  }
  
  //***************************
  // ON END TURN BUTTON PRESSED
  public onEndTurnButtonPressed(){    
    if(!this.isGameRunning){
      return;
    }
    
    if(this.isPieceSelected && this.isActionSelected){
      
      // execute the action
      if(this.selectedAction.type === ActionType.Move){
        this.selectedPiece.move(this.selectedAction.destination);
      }
      else if(this.selectedAction.type === ActionType.Take){
        let takePositions = new Array<Sup.Math.XY>();
        let takeAction = this.selectedAction;
        while(true){
          takePositions.push(takeAction.takenPiecePos);
          
          if(takeAction.previousAction !== null){
            takeAction = takeAction.previousAction;
          }
          else{
            break;
          }
        }
        
        for(let takePosition of takePositions){
          let takenPiece = this.GetPawnByPos(takePosition);
          takenPiece.isDead = true;
          takenPiece.move({x:-1, y:-1});
        }
        
        this.selectedPiece.move(this.selectedAction.destination);
      }
      
      // upgrade to king
      if(this.selectedPiece.player === PlayerName.Black && this.selectedPiece.position.y === 0){
        this.selectedPiece.upgradeToKing();
      }
      else if(this.selectedPiece.player === PlayerName.Red && this.selectedPiece.position.y === 9){
        this.selectedPiece.upgradeToKing();
      }
      
      //
      this.DeselectCurrentPiece();
      this.startTurn(this.getOtherPlayer(this.currentPlayer));
    }
  }
  
  //******************
  // ON CLICK ON BOARD
  public onClickOnBoard(){    
    if(!this.isGameRunning){
      return;
    }
    
    let mousePos = Sup.Input.getMousePosition();
    let mouseWorldPos = this.computeWorldPosFromScreenPos(mousePos);
    let mousedOverTile = {x:Math.floor(mouseWorldPos.x + 5), y:Math.floor(mouseWorldPos.y + 5)};
    
    let clickedPiece = this.GetPawnByPos(mousedOverTile);
    let clickedDestinationAction = null;

    if(this.isPieceSelected && this.possibleActions.length > 0){
      for(let moveAction of this.possibleActions){
        if(moveAction.destination.x === mousedOverTile.x && moveAction.destination.y === mousedOverTile.y){
          clickedDestinationAction = moveAction;
          break;
        }
      }
    }

    if(clickedPiece !== null && clickedPiece.player === this.currentPlayer){
      this.SelectPiece(clickedPiece);
    }
    else if(clickedDestinationAction !== null){
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
    
    return result;
  }
  
  //*********************************
  // COMPUTE POSSIBLE MOVES FOR PIECE
  private computePossibleMovesForPiece(piece: PieceControllerBehavior) :Action[]{
    const redPossibleDeltas = [{x:-1,y:1}, {x:1,y:1}];
    const blackPossibleDeltas = [{x:-1,y:-1}, {x:1,y:-1}];
    const kingPossibleDeltas = [{x:-1,y:1}, {x:1,y:1}, {x:-1,y:-1}, {x:1,y:-1}];
    
    let result = new Array<Action>();
    let deltas;
    let piecePos = piece.position;
    
    if(piece.isKing){
      deltas = kingPossibleDeltas;
      
      for(let i = 0; i < 4; i++){
        let possiblePos = piecePos;
        
        while(true){
          possiblePos = {x:possiblePos.x + deltas[i].x, y:possiblePos.y + deltas[i].y};
          
          if(!this.isPosLegal(possiblePos) || !this.isTileEmpty(possiblePos)){
            break;
          }
          
          result.push(new Action(ActionType.Move, piece, possiblePos));
        }
      }
    }
    else{
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
    }
    
    return result;
  }
  
  //******************************
  // COMPUTE POSSIBLE TAKE ACTIONS
  private computePossibleTakeActions(playerName: PlayerName): Action[]{
    let result = new Array<Action>();
    
    for(let piece of this.piecesArray){
      if(piece.player === playerName){
        let pieceTakes = this.computePossibleTakesForPiece(piece, piece.position, piece.player, piece.isKing);
        
        if(pieceTakes.length > 0){
          result = result.concat(pieceTakes);
        }
      }
    }
    
    return result;
  }
  
  //*********************************
  // COMPUTE POSSIBLE TAKES FOR PIECE
  private computePossibleTakesForPiece(piece: PieceControllerBehavior, piecePos: Sup.Math.XY, pieceOwner: PlayerName, pieceIsKing: boolean): Action[]{
    const deltas = [{x:-1,y:1}, {x:1,y:1}, {x:-1,y:-1}, {x:1,y:-1}];
    
    let result = new Array<Action>();
    
    for(let i = 0; i < 4; i++){
      let possibleTakePos = {x:piecePos.x + deltas[i].x, y:piecePos.y + deltas[i].y};
      let pieceToTake = null;
      
      if(!this.isPosLegal(possibleTakePos)){
        continue;
      }
      else if(!this.isTileEmpty(possibleTakePos)){
        let otherPiece = this.GetPawnByPos(possibleTakePos);
        
        if(otherPiece.player !== pieceOwner){
          pieceToTake = otherPiece;
        }
      }
      else if(pieceIsKing){
        while(true){
          possibleTakePos = {x:possibleTakePos.x + deltas[i].x, y:possibleTakePos.y + deltas[i].y};
          
          if(!this.isPosLegal(possibleTakePos)){
            break;
          }
          else if(!this.isTileEmpty(possibleTakePos)){
            let otherPiece = this.GetPawnByPos(possibleTakePos);
            
            if(otherPiece.player !== pieceOwner){
              pieceToTake = otherPiece;
              break;
            }
          }
        }
      }
      
      if(pieceToTake !== null){
        let possibleDestinationPos = {x:possibleTakePos.x + deltas[i].x, y:possibleTakePos.y + deltas[i].y};
        
        if(!this.isPosLegal(possibleDestinationPos) || !this.isTileEmpty(possibleDestinationPos)){
          continue;
        }
        else{
          result.push(new Action(ActionType.Take, piece, possibleDestinationPos, possibleTakePos));
          
          if(pieceIsKing){
            while(true){
              possibleDestinationPos = {x:possibleDestinationPos.x + deltas[i].x, y:possibleDestinationPos.y + deltas[i].y};
              
              if(!this.isPosLegal(possibleDestinationPos) || !this.isTileEmpty(possibleDestinationPos)){
                break;
              }
              else{
                result.push(new Action(ActionType.Take, piece, possibleDestinationPos, possibleTakePos));
              }
            }
          }
        }
      }
    }
    
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
    /*this.CreatePawn(PlayerName.Red, {x:0, y:0});
    this.CreatePawn(PlayerName.Red, {x:2, y:0});
    this.CreatePawn(PlayerName.Red, {x:4, y:0});
    this.CreatePawn(PlayerName.Red, {x:6, y:0});
    this.CreatePawn(PlayerName.Red, {x:8, y:0});
    
    this.CreatePawn(PlayerName.Red, {x:1, y:1});
    this.CreatePawn(PlayerName.Red, {x:3, y:1});
    this.CreatePawn(PlayerName.Red, {x:5, y:1});
    this.CreatePawn(PlayerName.Red, {x:7, y:1});
    this.CreatePawn(PlayerName.Red, {x:9, y:1});
    
    this.CreatePawn(PlayerName.Red, {x:0, y:2});
    this.CreatePawn(PlayerName.Red, {x:2, y:2});
    this.CreatePawn(PlayerName.Red, {x:4, y:2});
    this.CreatePawn(PlayerName.Red, {x:6, y:2});
    this.CreatePawn(PlayerName.Red, {x:8, y:2});
    
    this.CreatePawn(PlayerName.Red, {x:1, y:3});
    this.CreatePawn(PlayerName.Red, {x:3, y:3});
    this.CreatePawn(PlayerName.Red, {x:5, y:3});
    this.CreatePawn(PlayerName.Red, {x:7, y:3});*/
    this.CreatePawn(PlayerName.Red, {x:9, y:3});
    
    /*this.CreatePawn(PlayerName.Black, {x:1, y:9});
    this.CreatePawn(PlayerName.Black, {x:3, y:9});
    this.CreatePawn(PlayerName.Black, {x:5, y:9});
    this.CreatePawn(PlayerName.Black, {x:7, y:9});
    this.CreatePawn(PlayerName.Black, {x:9, y:9});
    
    this.CreatePawn(PlayerName.Black, {x:0, y:8});
    this.CreatePawn(PlayerName.Black, {x:2, y:8});
    this.CreatePawn(PlayerName.Black, {x:4, y:8});
    this.CreatePawn(PlayerName.Black, {x:6, y:8});
    this.CreatePawn(PlayerName.Black, {x:8, y:8});
    
    this.CreatePawn(PlayerName.Black, {x:1, y:7});
    this.CreatePawn(PlayerName.Black, {x:3, y:7});
    this.CreatePawn(PlayerName.Black, {x:5, y:7});
    this.CreatePawn(PlayerName.Black, {x:7, y:7});
    this.CreatePawn(PlayerName.Black, {x:9, y:7});*/
    
    this.CreatePawn(PlayerName.Black, {x:0, y:6});
    this.CreatePawn(PlayerName.Black, {x:2, y:6});
    this.CreatePawn(PlayerName.Black, {x:4, y:6});
    this.CreatePawn(PlayerName.Black, {x:6, y:6});
    this.CreatePawn(PlayerName.Black, {x:8, y:6});
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
  
  /*private createEmptyHalos(actions: Action[]) :Sup.Actor[]{
    let result = new Array<Sup.Actor>();
    
    for(let action of actions){
      result.push(this.createEmptyHalo(action.destination));
    }
    
    return result;
  }*/
  
  /*private createEmptyHalo(tilePos: Sup.Math.XY) :Sup.Actor{
    let actors = Sup.appendScene("Prefabs/EmptyHaloPrefab", this.actor);
    actors[0].setLocalPosition({x:tilePos.x + 0.5, y:tilePos.y + 0.5, z:0.5});
    return actors[0];
  }*/
  
  /*private createFilledHalo(tilePos: Sup.Math.XY) :Sup.Actor{
    let actors = Sup.appendScene("Prefabs/FilledHaloPrefab", this.actor);
    actors[0].setLocalPosition({x:tilePos.x + 0.5, y:tilePos.y + 0.5, z:0.5});
    return actors[0];
  }*/
  
  /*private destroyActors(actors: Sup.Actor[]){
    if(actors === null){
      return;
    }
    
    for(let actor of actors){
      actor.destroy();
    }
  }*/
}
Sup.registerBehavior(BoardManagerBehavior);
