enum ActionType{
      Move,
      Take
}

class Action {
  private type: ActionType;
  private pieceId: number;
  
  private newBoardState: BoardState;
  private originId: number;
  private destinationId: number;

  private takenPiecePos: Sup.Math.XY = null;
  private previousAction: Action = null;

  //=========================================================
  //
  //=========================================================
  
  constructor(type: ActionType, pieceId: number, originId: number, destinationId: number, boardState: BoardState, takenPiecePos: Sup.Math.XY = null, previousAction: Action = null){
    this.type = type;
    this.pieceId = pieceId;
    this.newBoardState = boardState.GetCopy();
    this.originId = originId;
    this.destinationId = destinationId;
    
    if(type === ActionType.Take && takenPiecePos === null){
      Sup.log("ERROR:Action:created Take Action with no taken pieces!");
    }
    
    this.takenPiecePos = takenPiecePos;
    this.previousAction = previousAction;

    this.newBoardState.ExecuteAction(this);
  }

  //=========================================================
  //
  //=========================================================

  public GetActionChainLength(): number{
    if(this.previousAction === null){
      return 1;
    }
    
    return this.previousAction.GetActionChainLength() + 1;
  }

  //=========================================================
  //
  //=========================================================

  public GetType(): ActionType{
    return this.type;
  }

  public GetPieceId(): number{
    return this.pieceId;
  }

  public GetNewBoardState(): BoardState{
    return this.newBoardState;
  }

  public GetOriginId(): number{
    return this.originId;
  }

  public GetDestinationId(): number{
    return this.destinationId;
  }

  public GetTakenPiecePos(): Sup.Math.XY{
    return this.takenPiecePos;
  }

  public GetPreviousAction(): Action{
    return this.previousAction;
  }

  public HasPreviousAction(): boolean{
    return this.previousAction !== null;
  }
}
