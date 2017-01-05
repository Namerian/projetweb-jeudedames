class PieceControllerBehavior extends Sup.Behavior {
  private player :PlayerName;
  private position :Sup.Math.XY;
  private isKing :boolean;
  private isDead :boolean;
  
  private isSelected :boolean;
  private halo :Sup.Actor;
  
  //========================================================
  //
  //========================================================
  
  public Initialize(player:PlayerName, boardPos:Sup.Math.XY){
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
  
  public MovePiece(boardPos: Sup.Math.XY){
    this.position = boardPos;
    this.actor.setLocalPosition({x:boardPos.x + 0.5, y:boardPos.y + 0.5});
  }
  
  public SelectPiece(){
    //Sup.log("PieceController:selectPiece:called!");
    if(this.isSelected){
      return;
    }
    
    let actors = Sup.appendScene("Prefabs/FilledHaloPrefab", this.actor);
    if(actors.length === 1 && actors[0].getName() === "Halo"){
      this.halo = actors[0];
    }
    
    this.isSelected = true;
  }
  
  public DeselectPiece(){
    if(!this.isSelected){
      return;
    }
    
    this.halo.destroy();
    this.halo = null;
    
    this.isSelected = false;
  }
  
  public UpgradeToKing(){
    if(!this.isKing){
      this.isKing = true;
      
      if(this.player === PlayerName.Black){
        this.actor.spriteRenderer.setSprite("Sprites/BlackKingSprite");
      }
      else if(this.player === PlayerName.Red){
        this.actor.spriteRenderer.setSprite("Sprites/RedKingSprite");
      }
    }
  }
  
  //========================================================
  //
  //========================================================
  
  public GetPlayerName(): PlayerName{
    return this.player;
  }
  
  public GetPosition(): Sup.Math.XY{
    return this.position;
  }
  
  public CheckIsKing(): boolean{
    return this.isKing;
  }
  
  public SetIsKing(isKing: boolean){
    this.isKing = isKing;
  }
  
  public CheckIsDead(): boolean{
    return this.isDead;
  }
  
  public SetIsDead(isDead: boolean){
    this.isDead = isDead;
  }
}
Sup.registerBehavior(PieceControllerBehavior);
