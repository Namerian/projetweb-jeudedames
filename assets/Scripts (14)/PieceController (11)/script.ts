class PieceControllerBehavior extends Sup.Behavior {
  player :PlayerName;
  position :Sup.Math.XY;
  isKing :boolean;
  isDead :boolean;
  
  isSelected :boolean;
  halo :Sup.Actor;
  
  awake() {
    
  }

  update() {
    
  }
  
  public initialize(player:PlayerName, boardPos:Sup.Math.XY){
    this.player = player;
    this.position = {x:boardPos.x, y:boardPos.y};
    this.isKing = false;
    this.isDead = false;
    this.isSelected = false;
    this.halo = null;
    
    //set Position
    let screenPos = {x:this.position.x + 0.5, y:this.position.y + 0.5, z:1};
    this.actor.setLocalPosition(screenPos);
    
    //set Sprite
    let spriteName;
    
    if(player === PlayerName.Red){
      spriteName = "Sprites/RedPawnSprite";
    }
    else if(player === PlayerName.Black){
      spriteName = "Sprites/BlackPawnSprite";
    }
    
    this.actor.spriteRenderer.setSprite(spriteName);
  }
  
  public selectPiece(){
    if(this.isSelected){
      return;
    }
    
    let actors = Sup.appendScene("Prefabs/HaloPrefab", this.actor);
    if(actors.length === 1 && actors[0].getName() === "Halo"){
      this.halo = actors[0];
    }
    
    this.isSelected = true;
    Sup.log("Piece selected");
  }
  
  public deselectPiece(){
    if(!this.isSelected){
      return;
    }
    
    this.halo.destroy();
    this.halo = null;
    
    this.isSelected = false;
  }
}
Sup.registerBehavior(PieceControllerBehavior);
