class Piece {
  private id: number;
  private owner: PlayerName;
  private tileId: number;
  private isKing: boolean = false;
  private isDead: boolean = false;
  
  //===================================================
  //
  //===================================================
  
  constructor(id: number, owner: PlayerName, tileId: number){
    this.id = id;    
    this.owner = owner;
    this.tileId = tileId;
  }
  
  public GetCopy(): Piece{
    let copy = new Piece(this.id, this.owner, this.tileId);
    copy.SetIsKing(this.isKing);
    copy.SetIsDead(this.isDead);
    
    return copy;
  }
  
  //===================================================
  //
  //===================================================
  
  public GetId(): number{
    return this.id;
  }
  
  public GetOwner(): PlayerName{
    return this.owner;
  }
  
  public GetTileId(): number{
    return this.tileId;
  }
  
  public GetIsKing(): boolean{
    return this.isKing;
  }
  
  public GetIsDead(): boolean{
    return this.isDead;
  }
  
  //===================================================
  //
  //===================================================
  
  public SetTileId(tileId: number){
    this.tileId = tileId;
  }
  
  public SetIsKing(isKing: boolean){
    this.isKing = isKing;
  }
  
  public SetIsDead(isDead: boolean){
    this.isDead = isDead;
  }
}
