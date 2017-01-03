enum ActionType{
      Move,
      Take
}

class Action {
  type: ActionType;
  piece: PieceControllerBehavior;
  
  destination: Sup.Math.XY;
  takenPiecePos: Sup.Math.XY;
  
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
  }
}
