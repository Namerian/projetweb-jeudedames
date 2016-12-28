enum ActionType{
      Move,
      Take
}

abstract class Action {
  type: ActionType;
  piece: PieceControllerBehavior;
  
  constructor(type: ActionType, piece: PieceControllerBehavior){
    this.type = type;
    this.piece = piece;
  }
  
  public select(){
  }
  
  public deselect(){
  }
  
  public show(){
  }
  
  public hide(){
  }
}
