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
  
  movingPieces: PieceControllerBehavior[];
  
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
    
    this.movingPieces = new Array<PieceControllerBehavior>();
  }
  
  start(){
    this.camera = Sup.getActor("Camera").camera;
    this.actor.fMouseInput.emitter.on("leftClickReleased", () => { this.OnClickOnBoard(); });
    
    this.SetupGame();
    
    this.isGameRunning = true;
    
    this.StartTurn(PlayerName.Red);
  }
  
  //======================================================================================
  //======================================================================================
  // gameflow methods
  //======================================================================================
  //======================================================================================
  
  //***********
  // START TURN
  private StartTurn(playerName: PlayerName){
    this.DeselectCurrentPiece();
    this.playerPossibleActions = null;
    
    let redPlayerDead = true;
    let blackPlayerDead = true;
    
    for(let piece of this.piecesArray){
      if(piece.GetPlayerName() === PlayerName.Black && !piece.CheckIsDead()){
        blackPlayerDead = false;
      }
      else if(piece.GetPlayerName() === PlayerName.Red && !piece.CheckIsDead()){
        redPlayerDead = false;
      }
    }
    
    if(blackPlayerDead){
      this.isGameRunning = false;
      this.victoryScreenView.Activate(PlayerName.Red);
    }
    else if(redPlayerDead){
      this.isGameRunning = false;
      this.victoryScreenView.Activate(PlayerName.Black);
    }
    else{
      this.currentPlayer = playerName;
      this.currentPlayerView.SetText(this.currentPlayer);

      this.playerPossibleActions = this.ComputePossibleTakeActions(this.currentPlayer);

      if(this.playerPossibleActions.length === 0){
        this.playerPossibleActions = this.ComputePossibleMoveActions(this.currentPlayer);
      }
    }
  }
  
  //*************
  // SELECT PIECE
  private SelectPiece(piece:PieceControllerBehavior){
    this.DeselectCurrentPiece();
    
    this.selectedPiece = piece;
    this.selectedPiece.SelectPiece();
    this.isPieceSelected = true;
    
    this.possibleActions = new Array<Action>();
    
    for(let action of this.playerPossibleActions){
      if(action.GetPiece() === piece){
        this.possibleActions.push(action);
      }
    }
    
    HaloManagerBehavior.GetInstance().CreatePossibleActionsHalos(this.possibleActions);
        
    this.selectedAction = null;
    this.isActionSelected = false;
  }
  
  //***********************
  // DESELECT CURRENT PIECE
  private DeselectCurrentPiece(){
    if(this.isPieceSelected){
      this.selectedPiece.DeselectPiece();
      this.selectedPiece = null;
      this.possibleActions.length = 0;
      
      if(this.isActionSelected){
        this.isActionSelected = false;
        this.selectedAction = null;
        HaloManagerBehavior.GetInstance().DestroySelectedActionHalos();
      }
      
      HaloManagerBehavior.GetInstance().DestroyPossibleActionHalos();
      
      this.isPieceSelected = false;
    }
  }
  
  //**************
  // SELECT ACTION
  private SelectAction(action: Action){
    this.possibleActions.length = 0;
    HaloManagerBehavior.GetInstance().DestroyPossibleActionHalos();
    
    this.selectedAction = action;
    HaloManagerBehavior.GetInstance().CreateSelectedActionHalos(this.selectedAction);
    this.isActionSelected = true;
    
    if(this.selectedAction.GetType() === ActionType.Take){
      //Sup.log("===================");
      let piecePos = this.selectedAction.GetDestination();
      let pieceOwner = this.selectedPiece.GetPlayerName();
      let pieceIsKing = this.selectedPiece.CheckIsKing();
      
      let possibleActions: Action[];
      let legalActions = new Array<Action>();
      
      let previousTakePositions = new Array<Sup.Math.XY>();
      let previousAction: Action;
      
      possibleActions = this.ComputePossibleTakesForPiece(this.selectedPiece, piecePos, pieceOwner, pieceIsKing);
      //Sup.log("found "+possibleActions.length+" possible take actions");
      
      if(possibleActions.length === 0){
        return;
      }
      
      previousAction = this.selectedAction;
      while(true){
        previousTakePositions.push(previousAction.GetTakenPiecePos());
        //Sup.log("previous take pos="+JSON.stringify(previousAction.takenPiecePos));

        if(previousAction.HasPreviousAction()){
          previousAction = previousAction.GetPreviousAction();
        }
        else{
          break;
        }
      }
      
      //Sup.log("found "+previousTakePositions.length+" previous take positions");
      
      for(let possibleAction of possibleActions){
        //Sup.log("possible action: takePos="+JSON.stringify(possibleAction.GetTakenPiecePos())+" destination="+JSON.stringify(possibleAction.GetDestination()));
        let isActionLegal = true;
        
        for(let previousTakePos of previousTakePositions){
          let pos = possibleAction.GetTakenPiecePos();
          
          //Sup.log("check: pos.x="+pos.x+" prev.x="+previousTakePos.x+" pos.y="+pos.y+" prev.y="+previousTakePos.y);
          if(pos.x === previousTakePos.x && pos.y === previousTakePos.y){
            isActionLegal = false;
          } 
        }
        
        if(isActionLegal){
          possibleAction.SetPreviousAction(this.selectedAction);
          legalActions.push(possibleAction);
        }
      }
      
      //Sup.log("found "+legalActions.length+" legal take actions");
      
      if(legalActions.length === 0){
        return;
      }
      
      this.possibleActions = legalActions;
      HaloManagerBehavior.GetInstance().CreatePossibleActionsHalos(this.possibleActions);
    }
  }
  
  //***************************
  // ON END TURN BUTTON PRESSED
  public OnEndTurnButtonPressed(){    
    if(!this.isGameRunning){
      return;
    }
    
    if(this.isPieceSelected && this.isActionSelected && this.possibleActions.length === 0){
      
      // execute the action
      if(this.selectedAction.GetType() === ActionType.Move){
        this.selectedPiece.MovePiece(this.selectedPiece.GetPosition(), this.selectedAction.GetDestination());
        this.movingPieces.push(this.selectedPiece);
      }
      else if(this.selectedAction.GetType() === ActionType.Take){
        let destinations = new Array<Sup.Math.XY>();
        let takePositions = new Array<Sup.Math.XY>();
        let takeAction = this.selectedAction;
        
        while(true){
          destinations.push(takeAction.GetDestination());
          takePositions.push(takeAction.GetTakenPiecePos());
          
          if(takeAction.HasPreviousAction()){
            takeAction = takeAction.GetPreviousAction();
          }
          else{
            break;
          }
        }
        
        destinations = destinations.reverse();
        for(let i = 0; i < destinations.length; i++){
          let destination = destinations[i];
          let origin = this.selectedPiece.GetPosition();
          
          if(i > 0){
            origin = destinations[i-1];
          }
          
          this.selectedPiece.MovePiece(origin, destination);
        }
        this.movingPieces.push(this.selectedPiece);
        
        for(let takePosition of takePositions){
          let takenPiece = this.GetPieceByPos(takePosition);
          takenPiece.SetIsDead(true);
          takenPiece.SetPosition({x:-10, y:-10});
        }
      }
      
      // upgrade to king
      if(this.selectedPiece.GetPlayerName() === PlayerName.Black && this.selectedPiece.GetPosition().y === 0){
        this.selectedPiece.UpgradeToKing();
      }
      else if(this.selectedPiece.GetPlayerName() === PlayerName.Red && this.selectedPiece.GetPosition().y === 9){
        this.selectedPiece.UpgradeToKing();
      }
      
      //
      this.DeselectCurrentPiece();
      //this.StartTurn(this.GetOtherPlayer(this.currentPlayer));
    }
  }
  
  //******************
  // ON CLICK ON BOARD
  public OnClickOnBoard(){
    if(!this.isGameRunning || this.movingPieces.length > 0){
      return;
    }
    
    let mousePos = Sup.Input.getMousePosition();
    let mouseWorldPos = this.ComputeWorldPosFromScreenPos(mousePos);
    let mousedOverTile = {x:Math.floor(mouseWorldPos.x + 5), y:Math.floor(mouseWorldPos.y + 5)};
    
    let clickedPiece = this.GetPieceByPos(mousedOverTile);
    let clickedDestinationAction = null;

    if(this.isPieceSelected && this.possibleActions.length > 0){
      for(let moveAction of this.possibleActions){
        if(moveAction.GetDestination().x === mousedOverTile.x && moveAction.GetDestination().y === mousedOverTile.y){
          clickedDestinationAction = moveAction;
          break;
        }
      }
    }

    if(clickedPiece !== null && clickedPiece.GetPlayerName() === this.currentPlayer){
      this.SelectPiece(clickedPiece);
    }
    else if(clickedDestinationAction !== null){
      this.SelectAction(clickedDestinationAction);           
    }
    else{
      this.DeselectCurrentPiece();
    }
  }
  
  //*******************
  // ON ANIMATIONS DONE
  public OnAnimationsDone(piece: PieceControllerBehavior){
    Sup.log("BoardManager:OnAnimationsDone:called");
    let index = this.movingPieces.indexOf(piece);
    
    if(index > -1){
      this.movingPieces.splice(index, 1);
      
      if(this.movingPieces.length === 0){
        this.StartTurn(this.GetOtherPlayer(this.currentPlayer));
      }
    }
  }
  
  //======================================================================================
  //======================================================================================
  // helper methods
  //======================================================================================
  //======================================================================================
  
  private ComputePossibleMoveActions(playerName: PlayerName) :Action[]{
    let result = new Array<Action>();
    
    for(let piece of this.piecesArray){
      if(piece.GetPlayerName() === playerName){
        let pieceMoves = this.ComputePossibleMovesForPiece(piece);
        
        if(pieceMoves.length > 0){
          result = result.concat(pieceMoves);
        }
      }
    }
    
    return result;
  }
  
  //*********************************
  // COMPUTE POSSIBLE MOVES FOR PIECE
  private ComputePossibleMovesForPiece(piece: PieceControllerBehavior) :Action[]{
    const redPossibleDeltas = [{x:-1,y:1}, {x:1,y:1}];
    const blackPossibleDeltas = [{x:-1,y:-1}, {x:1,y:-1}];
    const kingPossibleDeltas = [{x:-1,y:1}, {x:1,y:1}, {x:-1,y:-1}, {x:1,y:-1}];
    
    let result = new Array<Action>();
    let deltas;
    let piecePos = piece.GetPosition();
    
    if(piece.CheckIsKing()){
      deltas = kingPossibleDeltas;
      
      for(let i = 0; i < 4; i++){
        let possiblePos = piecePos;
        
        while(true){
          possiblePos = {x:possiblePos.x + deltas[i].x, y:possiblePos.y + deltas[i].y};
          
          if(!this.CheckIfPosLegal(possiblePos) || !this.CheckIfTileEmpty(possiblePos)){
            break;
          }
          
          result.push(new Action(ActionType.Move, piece, possiblePos));
        }
      }
    }
    else{
      if(piece.GetPlayerName() === PlayerName.Red){
        deltas = redPossibleDeltas;
      }
      else if(piece.GetPlayerName() === PlayerName.Black){
        deltas = blackPossibleDeltas;
      }

      for(let i = 0; i < 2; i++){
        let possiblePos = {x:piecePos.x + deltas[i].x, y:piecePos.y + deltas[i].y};

        if(this.CheckIfPosLegal(possiblePos) && this.CheckIfTileEmpty(possiblePos)){
          result.push(new Action(ActionType.Move, piece, possiblePos));
        }
      }
    }
    
    return result;
  }
  
  //******************************
  // COMPUTE POSSIBLE TAKE ACTIONS
  private ComputePossibleTakeActions(playerName: PlayerName): Action[]{
    let result = new Array<Action>();
    
    for(let piece of this.piecesArray){
      if(piece.GetPlayerName() === playerName){
        let pieceTakes = this.ComputePossibleTakesForPiece(piece, piece.GetPosition(), piece.GetPlayerName(), piece.CheckIsKing());
        
        if(pieceTakes.length > 0){
          result = result.concat(pieceTakes);
        }
      }
    }
    
    return result;
  }
  
  //*********************************
  // COMPUTE POSSIBLE TAKES FOR PIECE
  private ComputePossibleTakesForPiece(piece: PieceControllerBehavior, piecePos: Sup.Math.XY, pieceOwner: PlayerName, pieceIsKing: boolean): Action[]{
    const deltas = [{x:-1,y:1}, {x:1,y:1}, {x:-1,y:-1}, {x:1,y:-1}];
    
    let result = new Array<Action>();
    
    for(let i = 0; i < 4; i++){
      let possibleTakePos = {x:piecePos.x + deltas[i].x, y:piecePos.y + deltas[i].y};
      let pieceToTake = null;
      
      if(!this.CheckIfPosLegal(possibleTakePos)){
        continue;
      }
      else if(!this.CheckIfTileEmpty(possibleTakePos)){
        let otherPiece = this.GetPieceByPos(possibleTakePos);
        
        if(otherPiece.GetPlayerName() !== pieceOwner){
          pieceToTake = otherPiece;
        }
      }
      else if(pieceIsKing){
        while(true){
          possibleTakePos = {x:possibleTakePos.x + deltas[i].x, y:possibleTakePos.y + deltas[i].y};
          
          if(!this.CheckIfPosLegal(possibleTakePos)){
            break;
          }
          else if(!this.CheckIfTileEmpty(possibleTakePos)){
            let otherPiece = this.GetPieceByPos(possibleTakePos);
            
            if(otherPiece.GetPlayerName() !== pieceOwner){
              pieceToTake = otherPiece;
              break;
            }
          }
        }
      }
      
      if(pieceToTake !== null){
        let possibleDestinationPos = {x:possibleTakePos.x + deltas[i].x, y:possibleTakePos.y + deltas[i].y};
        
        if(!this.CheckIfPosLegal(possibleDestinationPos) || !this.CheckIfTileEmpty(possibleDestinationPos)){
          continue;
        }
        else{
          result.push(new Action(ActionType.Take, piece, possibleDestinationPos, possibleTakePos));
          
          if(pieceIsKing){
            while(true){
              possibleDestinationPos = {x:possibleDestinationPos.x + deltas[i].x, y:possibleDestinationPos.y + deltas[i].y};
              
              if(!this.CheckIfPosLegal(possibleDestinationPos) || !this.CheckIfTileEmpty(possibleDestinationPos)){
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
  
  //*****************
  // GET PIECE BY POS
  private GetPieceByPos(pos:Sup.Math.XY) :PieceControllerBehavior{
    //Sup.log("BoardManager:GetPawnByPos:called! pos="+JSON.stringify(pos));
    
    for(let pawn of this.piecesArray){
      if(pawn.GetPosition().x === pos.x && pawn.GetPosition().y === pos.y){
        return pawn;
      }
    }
    
    return null;
  }
  
  //********************
  // CHECK IF TILE EMPTY
  private CheckIfTileEmpty(pos: Sup.Math.XY) :boolean{
    let piece = this.GetPieceByPos(pos);
    
    if(piece !== null){
      return false;
    }
    
    return true;
  }
  
  //**********************************
  // COMPUTE WORLD POS FROM SCREEN POS
  private ComputeWorldPosFromScreenPos(screenPos:Sup.Math.Vector2) :Sup.Math.XY{
    let screenSize = Sup.Input.getScreenSize();
    let pixelPos = {x:screenPos.x * (screenSize.x * 0.5), y:screenPos.y * (screenSize.y * 0.5)};
    let pixelToUnitRatio = this.camera.getOrthographicScale() / screenSize.y;
    let unitPos = {x:pixelPos.x * pixelToUnitRatio, y:pixelPos.y * pixelToUnitRatio};
    
    return unitPos;
  }
  
  //*******************
  // CHECK IF POS LEGAL
  private CheckIfPosLegal(pos: Sup.Math.XY) :boolean{
    if(pos.x >= 0 && pos.x <= 9 && pos.y >= 0 && pos.y <= 9){
      return true;
    }
    
    return false;
  }
  
  //*****************
  // GET OTHER PLAYER
  private GetOtherPlayer(player: PlayerName) :PlayerName{
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
    this.CreatePawn(PlayerName.Red, {x:0, y:0});
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
    this.CreatePawn(PlayerName.Red, {x:7, y:3});
    this.CreatePawn(PlayerName.Red, {x:9, y:3});
    
    this.CreatePawn(PlayerName.Black, {x:1, y:9});
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
    this.CreatePawn(PlayerName.Black, {x:9, y:7});
    
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
      newPawnController.Initialize(playerName, tilePosition);
      this.piecesArray.push(newPawnController);
    }
  }
}
Sup.registerBehavior(BoardManagerBehavior);
