enum ActionType{
      Move,
      Take
}

class Action {
  private type: ActionType;
  private piece: PieceControllerBehavior;
  
  private destination: Sup.Math.XY;
  private takenPiecePos: Sup.Math.XY;
  private previousAction: Action;

  //=========================================================
  //
  //=========================================================
  
  constructor(type: ActionType, piece: PieceControllerBehavior, destination: Sup.Math.XY, takenPiecePos: Sup.Math.XY=null){
    this.type = type;
    this.piece = piece;
    this.destination = destination;
    
    if(type === ActionType.Take && takenPiecePos === null){
      Sup.log("ERROR:Action:created Take Action with no taken pieces!");
    }
    else{
      this.takenPiecePos = takenPiecePos;
    }
    
    this.previousAction = null;
  }

  //=========================================================
  //
  //=========================================================

  public GetType(): ActionType{
    return this.type;
  }

  public GetPiece(): PieceControllerBehavior{
    return this.piece;
  }

  public GetDestination(): Sup.Math.XY{
    return this.destination;
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

  public SetPreviousAction(action: Action){
    this.previousAction = action;
  }
}
