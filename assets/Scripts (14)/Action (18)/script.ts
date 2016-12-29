enum ActionType{
      Move,
      Take
}

class Action {
  type: ActionType;
  piece: PieceControllerBehavior;
  destination: Sup.Math.XY;

  isVisible: boolean;
  isSelected: boolean;
  halo: Sup.Actor;
  
  constructor(type: ActionType, piece: PieceControllerBehavior, destination: Sup.Math.XY){
    this.type = type;
    this.piece = piece;
    this.destination = destination;
    
    this.isVisible = false;
    this.isSelected = false;
    this.halo = null;
  }
  
  public select(){
    //Sup.log("MoveAction:select:called!");
    if(!this.isSelected){
      if(this.isVisible){
        this.halo.destroy();
      }
      
      this.halo = BoardManagerBehavior.instance.createFilledHalo(this.destination);
      this.isSelected = true;
      this.isVisible = true;
    }
  }
  
  public deselect(){
    if(this.isSelected){
      this.halo.destroy();

      this.halo = BoardManagerBehavior.instance.createEmptyHalo(this.destination);
      this.isSelected = false;
    }
  }
  
  public show(){
    //Sup.log("MoveAction:show:called!");
    if(!this.isVisible){
      this.halo = BoardManagerBehavior.instance.createEmptyHalo(this.destination);
      this.isVisible = true;
    }
  }
  
  public hide(){
    if(this.isVisible){
      this.halo.destroy();
      this.isVisible = false;
      this.isSelected = false;
    }
  }
}
