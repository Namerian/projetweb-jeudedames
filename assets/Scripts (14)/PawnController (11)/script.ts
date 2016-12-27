class PawnControllerBehavior extends Sup.Behavior {
  player :Player;
  position :Sup.Math.XY;
  
  awake() {
    
  }

  update() {
    
  }
  
  public initialize(player:Player, boardPos:Sup.Math.XY){
    this.player = player;
    this.position = {x:boardPos.x, y:boardPos.y};
    
    //set Position
    let screenPos = {x:this.position.x + 0.5, y:this.position.y + 0.5, z:1};
    this.actor.setLocalPosition(screenPos);
    
    //set Sprite
    let spriteName;
    
    if(player === Player.Red){
      spriteName = "Sprites/RedPawnSprite";
    }
    else if(player === Player.Black){
      spriteName = "Sprites/BlackPawnSprite";
    }
    
    this.actor.spriteRenderer.setSprite(spriteName);
  }
}
Sup.registerBehavior(PawnControllerBehavior);
