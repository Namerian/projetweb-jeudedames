enum PlayerName{
      Red,
      Black
}

class BoardManagerBehavior extends Sup.Behavior {
  public static instance: BoardManagerBehavior;
  
  //=====================
  
  public camera: Sup.Camera = null;
  public currentPlayerView: CurrentPlayerViewBehavior = null;
  public victoryScreenView: VictoryScreenViewBehavior = null;
  
  //=====================
  
  private pieceViews: PieceViewBehavior[] = new Array<PieceViewBehavior>();
  
  private isGameRunning: boolean = false;
  private currentBoardState: BoardState = null;
  
  private currentPlayer: PlayerName = null;
  private playerPossibleActions: Action[] = new Array<Action>();
  
  private isPieceSelected: boolean = false;
  private selectedPieceId: number = -1;
  private piecePossibleActions: Action[] = new Array<Action>();
  
  private isActionSelected: boolean = false;
  private selectedAction: Action = null;
  
  private movingPieces: PieceViewBehavior[] = new Array<PieceViewBehavior>();
  private piecesToKill: number[] = new Array<number>();
  
  //======================================================================================
  //======================================================================================
  // behaviour methods
  //======================================================================================
  //======================================================================================
  
  // AWAKE
  awake() {
    BoardManagerBehavior.instance = this;
  }
  
  // START
  start(){
    this.camera = Sup.getActor("Camera").camera;
    this.actor.fMouseInput.emitter.on("leftClickReleased", () => { this.OnClickOnBoard(); });
    
    this.SetupGame();
    
    this.isGameRunning = true;
    
    this.StartTurn(PlayerName.Red);
  }
  
  //======================================================================================
  //======================================================================================
  // public gameflow methods
  //======================================================================================
  //======================================================================================
  
  //***************************
  // ON END TURN BUTTON PRESSED
  public OnEndTurnButtonPressed(){    
    if(!this.isGameRunning){
      return;
    }
    
    if(this.isPieceSelected && this.isActionSelected && this.piecePossibleActions.length === 0){
      
      // execute the action
      if(this.selectedAction.GetType() === ActionType.Move){
        //Sup.log("BoardManager:OnEndTurnButtonPressed:selectedPieceId=" + this.selectedPieceId + " selectedActionPieceId=" + this.selectedAction.GetPieceId());
        
        //animation
        let pieceView: PieceViewBehavior = this.GetPieceView(this.selectedAction.GetPieceId());
        let originPos: Sup.Math.XY = BoardState.GetBoardPos(this.selectedAction.GetOriginId());
        let destinationPos: Sup.Math.XY = BoardState.GetBoardPos(this.selectedAction.GetDestinationId());
        
        pieceView.MovePiece(originPos, destinationPos);
        this.movingPieces.push(pieceView);
        
        //
        this.currentBoardState = this.selectedAction.GetNewBoardState();
      }
      else if(this.selectedAction.GetType() === ActionType.Take){
        let destinationIds = new Array<number>();
        let takePositions = new Array<Sup.Math.XY>();
        let takeAction = this.selectedAction;
        
        while(true){
          destinationIds.push(takeAction.GetDestinationId());
          takePositions.push(takeAction.GetTakenPiecePos());
          
          if(takeAction.HasPreviousAction()){
            takeAction = takeAction.GetPreviousAction();
          }
          else{
            break;
          }
        }
        
        destinationIds = destinationIds.reverse();
        
        for(let i = 0; i < destinationIds.length; i++){
          let destinationId: number = destinationIds[i];
          let origin: number = this.selectedAction.GetOriginId();
          
          if(i > 0){
            origin = destinationIds[i-1];
          }
          
          this.GetPieceView(this.selectedPieceId).MovePiece(BoardState.GetBoardPos(origin), BoardState.GetBoardPos(destinationId));
        }
        
        this.movingPieces.push(this.GetPieceView(this.selectedPieceId));
        
        //
        for(let takePosition of takePositions){
          let takenPieceId = this.currentBoardState.GetPieceIdFromBoardPos(takePosition);
          this.piecesToKill.push(takenPieceId);
          
        }
        
        //
        this.currentBoardState = this.selectedAction.GetNewBoardState();
      }
      
      //
      this.DeselectCurrentPiece();
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
    
    let clickedPieceId = this.currentBoardState.GetPieceIdFromBoardPos(mousedOverTile);
    let clickedDestinationAction: Action = null;
    
    if(this.isPieceSelected && this.piecePossibleActions.length > 0){
      for(let action of this.piecePossibleActions){
        let destinationPos: Sup.Math.XY = BoardState.GetBoardPos(action.GetDestinationId());
        
        if(destinationPos.x === mousedOverTile.x && destinationPos.y === mousedOverTile.y){
          clickedDestinationAction = action;
          break;
        }
      }
    }
    
    //Sup.log("BoardManager:OnClickOnBoard:mousedOverTile: " + JSON.stringify(mousedOverTile));
    //Sup.log("BoardManager:OnClickOnBoard:clickedPieceId: " + clickedPieceId);

    if(clickedPieceId !== -1 && this.currentBoardState.GetPieceOwner(clickedPieceId) === this.currentPlayer){
      this.SelectPiece(clickedPieceId);
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
  public OnAnimationsDone(piece: PieceViewBehavior){
    //Sup.log("BoardManager:OnAnimationsDone:called");
    let index = this.movingPieces.indexOf(piece);
    
    if(index > -1){
      this.movingPieces.splice(index, 1);
      
      if(this.movingPieces.length === 0){
        //takenPiece.SetIsDead(true);
        //takenPiece.SetPosition({x:-10, y:-10});
        
        // kill taken pieces
        for(let takenPieceId of this.piecesToKill){
          this.GetPieceView(takenPieceId).SetPosition({x:-10, y:-10});
        }
        
        this.piecesToKill.length = 0;
        
        // upgrade to king
        let pieceId: number = piece.GetPieceId();
        let piecePos: Sup.Math.XY = this.currentBoardState.GetPiecePos(pieceId);
        let pieceOwner: PlayerName = this.currentBoardState.GetPieceOwner(pieceId);
        
        if(pieceOwner === PlayerName.Black && piecePos.y === 0){
          piece.UpgradeToKing();
          this.currentBoardState.SetPieceIsKing(piece.GetPieceId());
        }
        else if(pieceOwner === PlayerName.Red && piecePos.y === 9){
          piece.UpgradeToKing();
          this.currentBoardState.SetPieceIsKing(piece.GetPieceId());
        }
        
        this.StartTurn(this.GetOtherPlayer(this.currentPlayer));
      }
    }
  }
  
  //======================================================================================
  //======================================================================================
  // private gameflow methods
  //======================================================================================
  //======================================================================================
  
  //***********
  // START TURN
  private StartTurn(playerName: PlayerName){
    this.DeselectCurrentPiece();
    this.playerPossibleActions.length = 0;
    
    let redPlayerDead = this.currentBoardState.CheckIfPlayerDead(PlayerName.Red);
    let blackPlayerDead = this.currentBoardState.CheckIfPlayerDead(PlayerName.Black);
    
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

      let possibleTakes: Action[] = BoardManagerBehavior.ComputeAllPossibleTakeActions(this.currentPlayer, this.currentBoardState);

      if(this.playerPossibleActions.length === 0){
        this.playerPossibleActions = BoardManagerBehavior.ComputePossibleMoveActions(this.currentPlayer, this.currentBoardState.GetCopy());
      }
      else{
        let bestTakes: Action[] = new Array<Action>();
        let bestTakeLength: number = 0;
        
        for(let action of possibleTakes){
          if(action.GetActionChainLength() > bestTakeLength){
            bestTakes.length = 0;
            bestTakes.push(action);
            bestTakeLength = action.GetActionChainLength();
          }
          else if(action.GetActionChainLength() === bestTakeLength){
            bestTakes.push(action);
          }
        }
        
        for(let action of bestTakes){
          this.playerPossibleActions.push(action);
          let previousAction: Action = action.GetPreviousAction();
          
          while(previousAction !== null){
            this.playerPossibleActions.push(previousAction);
            previousAction = previousAction.GetPreviousAction();
          }
        }
      }
      
      //Sup.log("BoardManager:StartTurn:numOfPossibleMoves= " + this.playerPossibleActions.length);
    }
  }
  
  //*************
  // SELECT PIECE
  private SelectPiece(pieceId: number){
    //Sup.log("BoardManager:SelectPiece:called! pieceId=" + pieceId);
    this.DeselectCurrentPiece();
    
    this.selectedPieceId = pieceId;
    this.GetPieceView(pieceId).SelectPiece();
    this.isPieceSelected = true;
        
    for(let action of this.playerPossibleActions){
      if(action.GetPieceId() === pieceId){
        this.piecePossibleActions.push(action);
        //Sup.log("BoardManager:SelectPiece:possibleAction:pieceId=" + action.GetPieceId());
      }
    }
    
    //Sup.log("BoardManager:SelectPiece:num of possible action = " + this.piecePossibleActions.length);
    
    HaloManagerBehavior.GetInstance().CreatePossibleActionsHalos(this.piecePossibleActions);
  }
  
  //***********************
  // DESELECT CURRENT PIECE
  private DeselectCurrentPiece(){
    if(this.isPieceSelected){
      
      if(this.isActionSelected){
        this.isActionSelected = false;
        this.selectedAction = null;
        HaloManagerBehavior.GetInstance().DestroySelectedActionHalos();
      }
      
      this.GetPieceView(this.selectedPieceId).DeselectPiece();
      this.piecePossibleActions.length = 0;
      HaloManagerBehavior.GetInstance().DestroyPossibleActionHalos();
      
      this.selectedPieceId = -1;
      this.isPieceSelected = false;
    }
  }
  
  //**************
  // SELECT ACTION
  private SelectAction(action: Action){
    //Sup.log("BoardManager:SelectAction:actionPieceId=" + action.GetPieceId());
    
    this.piecePossibleActions.length = 0;
    HaloManagerBehavior.GetInstance().DestroyPossibleActionHalos();
    
    this.selectedAction = action;
    HaloManagerBehavior.GetInstance().CreateSelectedActionHalos(this.selectedAction);
    this.isActionSelected = true;
    
    if(this.selectedAction.GetType() === ActionType.Take){
      for(let possibleAction of this.playerPossibleActions){
        if(possibleAction.GetPreviousAction() === this.selectedAction){
          this.piecePossibleActions.push(possibleAction);
        }
      }
      
      HaloManagerBehavior.GetInstance().CreatePossibleActionsHalos(this.piecePossibleActions);
    }
    
    /*if(this.selectedAction.GetType() === ActionType.Take){
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
    }*/
  }
  
  //======================================================================================
  //======================================================================================
  // helper methods
  //======================================================================================
  //======================================================================================
  
  
  //******************************
  // COMPUTE POSSIBLE MOVE ACTIONS
  private static ComputePossibleMoveActions(playerName: PlayerName, boardState: BoardState) :Action[]{
    let result = new Array<Action>();
    let pieceIds: number[] = boardState.GetPlayerPieceIds(playerName);
    
    for(let pieceId of pieceIds){
      let moves: Action[] = BoardManagerBehavior.ComputePossibleMovesForPiece(pieceId, boardState);
      
      if(moves.length > 0){
        result = result.concat(moves);
      }
    }
    
    return result;
  }
  
  //*********************************
  // COMPUTE POSSIBLE MOVES FOR PIECE
  private static ComputePossibleMovesForPiece(pieceId: number, boardState: BoardState): Action[]{
    const redPossibleDeltas = [{x:-1,y:1}, {x:1,y:1}];
    const blackPossibleDeltas = [{x:-1,y:-1}, {x:1,y:-1}];
    const kingPossibleDeltas = [{x:-1,y:1}, {x:1,y:1}, {x:-1,y:-1}, {x:1,y:-1}];
    
    let result = new Array<Action>();
    let deltas;
    let piecePos = boardState.GetPiecePos(pieceId);
    let pieceTileId: number = BoardState.GetTileId(piecePos);
    let pieceIsKing: boolean = boardState.GetPieceIsKing(pieceId);
    
    if(pieceIsKing){
      deltas = kingPossibleDeltas;
      
      for(let i = 0; i < 4; i++){
        let possiblePos = piecePos;
        
        while(true){
          possiblePos = {x:possiblePos.x + deltas[i].x, y:possiblePos.y + deltas[i].y};
          
          let isPosLegal: boolean = BoardState.CheckIfBoardPosLegal(possiblePos);
          let possiblePosId: number = BoardState.GetTileId(possiblePos);
          let isTileEmpty: boolean = boardState.CheckIfTileEmpty(possiblePosId);
          
          if(!isPosLegal || !isTileEmpty){
            break;
          }
          
          result.push(new Action(ActionType.Move, pieceId, pieceTileId, possiblePosId, boardState));
        }
      }
    }
    else{
      let pieceOwner: PlayerName = boardState.GetPieceOwner(pieceId);
      
      if(pieceOwner === PlayerName.Red){
        deltas = redPossibleDeltas;
      }
      else if(pieceOwner === PlayerName.Black){
        deltas = blackPossibleDeltas;
      }

      for(let i = 0; i < 2; i++){
        let possiblePos = {x:piecePos.x + deltas[i].x, y:piecePos.y + deltas[i].y};
        
        let isPosLegal: boolean = BoardState.CheckIfBoardPosLegal(possiblePos);
        let possiblePosId: number = BoardState.GetTileId(possiblePos);
        let isTileEmpty: boolean = boardState.CheckIfTileEmpty(possiblePosId);

        if(isPosLegal && isTileEmpty){
          result.push(new Action(ActionType.Move, pieceId, pieceTileId, possiblePosId, boardState));
        }
      }
    }
    
    return result;
  }
  
  //******************************
  // COMPUTE POSSIBLE TAKE ACTIONS
  private static ComputeAllPossibleTakeActions(playerName: PlayerName, boardState: BoardState): Action[]{
    let result: Action[] = new Array<Action>();
    let actionsToExpand: Action[] = new Array<Action>();
    let pieceIds: number[] = boardState.GetPlayerPieceIds(playerName);
    
    for(let pieceId of pieceIds){
      let takes: Action[] = BoardManagerBehavior.ComputePossibleTakeActions(pieceId, boardState);
      
      if(takes.length > 0){
        actionsToExpand = actionsToExpand.concat(takes);
      }
    }
    
    while(actionsToExpand.length > 0){
      let actionToExpand: Action = actionsToExpand[0];
      actionsToExpand.splice(0, 1);
      result.push(actionToExpand);
      
      let takes: Action[] = BoardManagerBehavior.ComputePossibleTakeActions(actionToExpand.GetPieceId(), actionToExpand.GetNewBoardState(), actionToExpand);
      
      if(takes.length > 0){
        actionsToExpand = actionsToExpand.concat(takes);
      }
    }
    
    return result;
  }
  
  //*********************************
  // COMPUTE POSSIBLE TAKES FOR PIECE
  private static ComputePossibleTakeActions(pieceId: number, boardState: BoardState, previousAction: Action = null): Action[]{
    const deltas = [{x:-1,y:1}, {x:1,y:1}, {x:-1,y:-1}, {x:1,y:-1}];
    
    let result = new Array<Action>();
    let piecePos: Sup.Math.XY = boardState.GetPiecePos(pieceId);
    let piecePosId: number = BoardState.GetTileId(piecePos);
    let pieceOwner: PlayerName = boardState.GetPieceOwner(pieceId);
    let pieceIsKing: boolean = boardState.GetPieceIsKing(pieceId);
    
    for(let i = 0; i < 4; i++){
      let possibleTakePos: Sup.Math.XY = {x:piecePos.x + deltas[i].x, y:piecePos.y + deltas[i].y};
      let possibleTakePosId: number = BoardState.GetTileId(possibleTakePos);
      let pieceToTake: number = -1;
      
      if(!BoardState.CheckIfBoardPosLegal(possibleTakePos)){
        continue;
      }
      else if(!boardState.CheckIfTileEmpty(possibleTakePosId)){
        let otherPieceId = boardState.GetPieceIdFromBoardPos(possibleTakePos);
        
        if(boardState.GetPieceOwner(otherPieceId) !== pieceOwner){
          pieceToTake = otherPieceId;
        }
      }
      else if(pieceIsKing){
        while(true){
          possibleTakePos = {x:possibleTakePos.x + deltas[i].x, y:possibleTakePos.y + deltas[i].y};
          possibleTakePosId = BoardState.GetTileId(possibleTakePos);
          
          if(!BoardState.CheckIfBoardPosLegal(possibleTakePos)){
            break;
          }
          else if(!boardState.CheckIfTileEmpty(possibleTakePosId)){
            let otherPieceId = boardState.GetPieceIdFromBoardPos(possibleTakePos);
            
            if(boardState.GetPieceOwner(otherPieceId) !== pieceOwner){
              pieceToTake = otherPieceId;
              break;
            }
          }
        }
      }
      
      if(pieceToTake !== -1){
        let possibleDestinationPos = {x:possibleTakePos.x + deltas[i].x, y:possibleTakePos.y + deltas[i].y};
        let possibleDestinationPosId: number = BoardState.GetTileId(possibleDestinationPos);
        
        if(!BoardState.CheckIfBoardPosLegal(possibleDestinationPos) || !boardState.CheckIfTileEmpty(possibleDestinationPosId)){
          continue;
        }
        else{
          result.push(new Action(ActionType.Take, pieceId, piecePosId, possibleDestinationPosId, boardState, possibleTakePos, previousAction));
          
          if(pieceIsKing){
            while(true){
              possibleDestinationPos = {x:possibleDestinationPos.x + deltas[i].x, y:possibleDestinationPos.y + deltas[i].y};
              possibleDestinationPosId = BoardState.GetTileId(possibleDestinationPos);
              
              if(!BoardState.CheckIfBoardPosLegal(possibleDestinationPos) || !boardState.CheckIfTileEmpty(possibleDestinationPosId)){
                break;
              }
              else{
                result.push(new Action(ActionType.Take, pieceId, piecePosId, possibleDestinationPosId, boardState, possibleTakePos, previousAction));
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
  /*private GetPieceByPos(pos:Sup.Math.XY) :PieceControllerBehavior{
    //Sup.log("BoardManager:GetPawnByPos:called! pos="+JSON.stringify(pos));
    
    for(let pawn of this.piecesArray){
      if(pawn.GetPosition().x === pos.x && pawn.GetPosition().y === pos.y){
        return pawn;
      }
    }
    
    return null;
  }*/
  
  //********************
  // CHECK IF TILE EMPTY
  /*private CheckIfTileEmpty(pos: Sup.Math.XY) :boolean{
    let piece = this.GetPieceByPos(pos);
    
    if(piece !== null){
      return false;
    }
    
    return true;
  }*/
  
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
  /*private CheckIfPosLegal(pos: Sup.Math.XY) :boolean{
    if(pos.x >= 0 && pos.x <= 9 && pos.y >= 0 && pos.y <= 9){
      return true;
    }
    
    return false;
  }*/
  
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
  
  //***************
  // GET PIECE VIEW
  private GetPieceView(pieceId: number): PieceViewBehavior{
    for(let pieceView of this.pieceViews){
      if(pieceView.GetPieceId() === pieceId){
        return pieceView;
      }
    }
    
    return null;
  }
  
  //======================================================================================
  //======================================================================================
  // initialization methods
  //======================================================================================
  //======================================================================================
  
  //***********
  // SETUP GAME
  private SetupGame(){
    let tiles: Tile[][] = new Array<Array<Tile>>();
    let pieces: Piece[] = new Array<Piece>();
    let pieceIdCounter: number = 0;
    
    for(let x = 0; x < BoardState.BOARD_SIZE; x++){
      tiles[x] = new Array<Tile>(BoardState.BOARD_SIZE);
      for(let y = 0; y < BoardState.BOARD_SIZE; y++){
        tiles[x][y] = new Tile({x:x, y:y});
      }
    }
    
    for(let y = 0; y < 4; y++){
      for(let x = 0; x < BoardState.BOARD_SIZE; x++){
        if(y % 2 === 0 && x % 2 === 0){
          let tileId = BoardState.GetTileId({x:x, y:y});
          let pieceId = pieceIdCounter++;
          pieces.push(new Piece(pieceId, PlayerName.Red, tileId));
          tiles[x][y].SetPieceId(pieceId);
        }
        else if(y % 2 === 1 && x % 2 === 1){
          let tileId = BoardState.GetTileId({x:x, y:y});
          let pieceId = pieceIdCounter++;
          pieces.push(new Piece(pieceId, PlayerName.Red, tileId));
          tiles[x][y].SetPieceId(pieceId);
        }
      }
    }
    
    for(let y = 6; y < 10; y++){
      for(let x = 0; x < BoardState.BOARD_SIZE; x++){
        if(y % 2 === 0 && x % 2 === 0){
          let tileId = BoardState.GetTileId({x:x, y:y});
          let pieceId = pieceIdCounter++;
          pieces.push(new Piece(pieceId, PlayerName.Black, tileId));
          tiles[x][y].SetPieceId(pieceId);
        }
        else if(y % 2 === 1 && x % 2 === 1){
          let tileId = BoardState.GetTileId({x:x, y:y});
          let pieceId = pieceIdCounter++;
          pieces.push(new Piece(pieceId, PlayerName.Black, tileId));
          tiles[x][y].SetPieceId(pieceId);
        }
      }
    }
    
    this.currentBoardState = new BoardState(tiles, pieces);
    
    for(let piece of pieces){
      let actors = Sup.appendScene("Prefabs/PiecePrefab", this.actor);
      if(actors.length === 1 && actors[0].getName() === "Piece"){
        let newPieceView = actors[0].getBehavior(PieceViewBehavior);
        newPieceView.Initialize(piece.GetId(), piece.GetOwner(), BoardState.GetBoardPos(piece.GetTileId()));
        this.pieceViews.push(newPieceView);
      }
    }
    
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
    this.CreatePawn(PlayerName.Red, {x:8, y:2});*/
    
    /*this.CreatePawn(PlayerName.Red, {x:1, y:3});
    this.CreatePawn(PlayerName.Red, {x:3, y:3});
    this.CreatePawn(PlayerName.Red, {x:5, y:3});
    this.CreatePawn(PlayerName.Red, {x:7, y:3});
    this.CreatePawn(PlayerName.Red, {x:9, y:3});*/
    
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
    
    /*this.CreatePawn(PlayerName.Black, {x:0, y:6});
    this.CreatePawn(PlayerName.Black, {x:2, y:6});
    this.CreatePawn(PlayerName.Black, {x:4, y:6});
    this.CreatePawn(PlayerName.Black, {x:6, y:6});
    this.CreatePawn(PlayerName.Black, {x:8, y:6});*/
  }
  
  /*private CreatePawn(playerName:PlayerName, tilePosition:Sup.Math.XY){
    let actors = Sup.appendScene("Prefabs/PiecePrefab", this.actor);
    if(actors.length === 1 && actors[0].getName() === "Piece"){
      let newPawnController = actors[0].getBehavior(PieceControllerBehavior);
      newPawnController.Initialize(playerName, tilePosition);
      this.piecesArray.push(newPawnController);
    }
  }*/
}
Sup.registerBehavior(BoardManagerBehavior);
