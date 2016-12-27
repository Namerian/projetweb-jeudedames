class PawnControllerBehavior extends Sup.Behavior {
  awake() {
    
  }

  update() {
    
  }
  
  public initialize(){
    let spriteName = "Sprites/BlackPawnSprite";
    
    this.actor.spriteRenderer.setSprite(spriteName);
  }
}
Sup.registerBehavior(PawnControllerBehavior);
