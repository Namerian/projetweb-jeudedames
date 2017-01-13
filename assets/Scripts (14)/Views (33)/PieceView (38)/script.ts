class PieceViewBehavior extends Sup.Behavior {
  private pieceId: number;
  private owner: PlayerName;
  
  private isSelected: boolean = false;
  private halo: Sup.Actor = null;
  
  private isMoving: boolean = false;
  private tweens: Sup.Tween[];
  private tweenPositions: Sup.Math.XY[];
  
  //========================================================
  //
  //========================================================
  
  //***********
  // INITIALIZE
  public Initialize(pieceId: number, player:PlayerName, boardPos:Sup.Math.XY){
    this.pieceId = pieceId;
    this.owner = player;
    
    this.tweens = new Array<Sup.Tween>();
    this.tweenPositions = new Array<Sup.Math.XY>();
    
    //set Position
    let screenPos = {x:boardPos.x + 0.5, y:boardPos.y + 0.5, z:1};
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
  
  //***********
  // MOVE PIECE
  public MovePiece(origin: Sup.Math.XY, destination: Sup.Math.XY){
    //Sup.log("PieceView:MovePiece:called! pieceId: " + this.pieceId + " origin:" + JSON.stringify(origin) + " destination:" + JSON.stringify(destination));
    
    let originWorldPos = {x:origin.x + 0.5, y:origin.y + 0.5};
    let destinationWorldPos = {x:destination.x + 0.5, y:destination.y + 0.5};
    
    let distance = Math.sqrt(Math.pow(destinationWorldPos.x - originWorldPos.x, 2) + Math.pow(destinationWorldPos.y - originWorldPos.y, 2));
    
    let tween = new Sup.Tween(this.actor, originWorldPos).to(destinationWorldPos, 1000);
    this.tweens.push(tween);
    this.tweenPositions.push(originWorldPos);
    
    if(!this.isMoving){
      tween.onUpdate(this.OnTweenUpdate.bind(this)).onComplete(this.OnTweenComplete.bind(this)).start();
      this.isMoving = true;
    }
  }
  
  //*************
  // SELECT PIECE
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
  
  //***************
  // DESELECT PIECE
  public DeselectPiece(){
    if(!this.isSelected){
      return;
    }
    
    this.halo.destroy();
    this.halo = null;
    
    this.isSelected = false;
  }
  
  //****************
  // UPGRADE TO KING
  public UpgradeToKing(){
    if(this.owner === PlayerName.Black){
      this.actor.spriteRenderer.setSprite("Sprites/BlackKingSprite");
    }
    else if(this.owner === PlayerName.Red){
      this.actor.spriteRenderer.setSprite("Sprites/RedKingSprite");
    }
  }
  
  //*************
  // SET POSITION
  public SetPosition(position: Sup.Math.XY){
    this.actor.setLocalPosition({x:position.x + 0.5, y:position.y + 0.5});
  }
  
  //========================================================
  //
  //========================================================
  
  public GetPieceId(): number{
    return this.pieceId;
  }
  
  //========================================================
  //
  //========================================================
  
  //****************
  // ON TWEEN UPDATE
  private OnTweenUpdate(){
    this.actor.setLocalPosition(this.tweenPositions[0]);
  }
  
  //******************
  // ON TWEEN COMPLETE
  private OnTweenComplete(){
    //Sup.log(this);
    //Sup.log("PieceController:OnTweenComplete:called! tweens.length=" + this.tweens.length + " tweenPositions.length=" + this.tweenPositions.length);
    //Sup.log("PieceController:OnTweenComplete:tweenPos=" + JSON.stringify(this.tweenPositions[0]));
    
    let destinationWorldPos = this.tweenPositions[0];
    this.SetPosition({x:destinationWorldPos.x - 0.5, y:destinationWorldPos.y - 0.5});
    
    this.tweens.splice(0, 1);
    this.tweenPositions.splice(0, 1);
    
    if(this.tweens.length > 0){
      //Sup.log("PieceController:OnTweenComplete:tweens remaining = " + this.tweens.length + " tweenPositions.length=" + this.tweenPositions.length);
      this.tweens[0].onUpdate(this.OnTweenUpdate.bind(this)).onComplete(this.OnTweenComplete.bind(this)).start();
    }
    else{
      this.isMoving = false;
      BoardManagerBehavior.instance.OnAnimationsDone(this);
    }
  }
}
Sup.registerBehavior(PieceViewBehavior);
