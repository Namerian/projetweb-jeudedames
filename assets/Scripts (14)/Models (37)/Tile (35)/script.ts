class Tile {
  private id: number;
  private boardPos: Sup.Math.XY;
  private pieceId: number = -1;

  //===================================================
  //
  //===================================================

  constructor(boardPos: Sup.Math.XY){
    this.id = boardPos.x * BoardState.BOARD_SIZE + boardPos.y;
    this.boardPos = boardPos;
  }

  public GetCopy(): Tile{
    let copy = new Tile(this.boardPos);
    copy.SetPieceId(this.pieceId);
    
    return copy;
  }

  //===================================================
  //
  //===================================================

  public GetId(): number{
    return this.id;
  }

  public GetBoardPosition(): Sup.Math.XY{
    return this.boardPos;
  }

  public GetPieceId(): number{
    return this.pieceId;
  }

  public GetScreenPosition(): Sup.Math.XY{
    return {x:this.boardPos.x + 0.5, y:this.boardPos.y + 0.5};
  }

  //===================================================
  //
  //===================================================

  public SetPieceId(pieceId: number){
    this.pieceId = pieceId;
  }
}
