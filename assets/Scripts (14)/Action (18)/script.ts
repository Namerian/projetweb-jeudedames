enum ActionType{
      Move,
      Take
}

class Action {
  type: ActionType;
  piece: PieceControllerBehavior;
  destination: Sup.Math.XY;
  
  constructor(type: ActionType, piece: PieceControllerBehavior, destination: Sup.Math.XY){
    this.type = type;
    this.piece = piece;
    this.destination = destination;
  }
}
