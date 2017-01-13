class BoardState {
  static BOARD_SIZE: number = 10;
  
  private tiles: Tile[][];
  private pieces: Piece[];
  
  //===================================================
  //
  //===================================================
  
  constructor(tiles: Tile[][], pieces: Piece[]){
    this.tiles = tiles;
    this.pieces = pieces;
  }
  
  public GetCopy(): BoardState{
    Sup.log("BoardState:GetCopy:called!");
    
    let copy: BoardState;
    let newTiles: Tile[][] = new Array<Array<Tile>>();
    let newPieces = new Array<Piece>();
    
    for(let x = 0; x < BoardState.BOARD_SIZE; x++){
      newTiles[x] = new Array<Tile>(BoardState.BOARD_SIZE);
      for(let y = 0; y < BoardState.BOARD_SIZE; y++){
        newTiles[x][y] = this.tiles[x][y].GetCopy();
      }
    }
    
    for(let piece of this.pieces){
      newPieces.push(piece.GetCopy());
    }
    
    copy = new BoardState(newTiles, newPieces);
    return copy;
  }
  
  //===================================================
  //
  //===================================================
  
  public static CheckIfBoardPosLegal(boardPos: Sup.Math.XY): boolean{
    if(boardPos.x < 0 || boardPos.x >= BoardState.BOARD_SIZE || boardPos.y < 0 || boardPos.y >= BoardState.BOARD_SIZE){
      return false;
    }
    
    return true;
  }
  
  public static GetTileId(boardPos: Sup.Math.XY): number{
    if(!BoardState.CheckIfBoardPosLegal(boardPos)){
      return -1;
    }
    
    let id: number = boardPos.x * BoardState.BOARD_SIZE + boardPos.y;
    
    return id;
  }
  
  public static CheckIfTileIdLegal(tileId: number): boolean{
    if(tileId < 0 || tileId >= BoardState.BOARD_SIZE * BoardState.BOARD_SIZE){
      return false;
    }
    
    return true;
  }
  
  public static GetBoardPos(tileId: number): Sup.Math.XY{
    if(!BoardState.CheckIfTileIdLegal(tileId)){
      return null;
    }
    
    let boardPos: Sup.Math.XY = {x:Math.floor(tileId / BoardState.BOARD_SIZE), y:tileId % BoardState.BOARD_SIZE};
    
    return boardPos;
  }

  //===================================================
  //
  //===================================================

  public GetPieceIdFromTileId(tileId: number): number{
    if(!BoardState.CheckIfTileIdLegal(tileId)){
      return -1;
    }
    
    let boardPos: Sup.Math.XY = BoardState.GetBoardPos(tileId);
    
    return this.GetPieceIdFromBoardPos(boardPos);
  }

  public GetPieceIdFromBoardPos(boardPos: Sup.Math.XY): number{
    if(!BoardState.CheckIfBoardPosLegal(boardPos)){
      Sup.log("BoardState:GetPieceIdFromBoardPos:pos not legal");
      return -1;
    }
    
    if(this.tiles === null){
      Sup.log("test 1");
    }
    else if(this.tiles[boardPos.x] === null){
      Sup.log("test 2");
    }
    
    Sup.log("test 3: x=" + boardPos.x + " y=" + boardPos.y);
    
    let tile: Tile = this.tiles[boardPos.x][boardPos.y];
    
    return tile.GetPieceId();
  }

  public GetPiecePos(pieceId: number): Sup.Math.XY{
    let piece: Piece = this.GetPiece(pieceId);
    
    return BoardState.GetBoardPos(piece.GetTileId());
  }

  public GetPieceOwner(pieceId: number): PlayerName{
    for(let piece of this.pieces){
      if(piece.GetId() === pieceId){
        return piece.GetOwner();
      }
    }
    
    return null;
  }

  public GetPieceIsKing(pieceId: number): boolean{
    let piece: Piece = this.GetPiece(pieceId);
    
    return piece.GetIsKing();
  }
    
  //===================================================
  //
  //===================================================

  public SetPieceIsKing(pieceId: number){
    let piece: Piece = this.GetPiece(pieceId);
    
    piece.SetIsKing(true);
  }

  //===================================================
  //
  //===================================================
  
  public CheckIfPlayerDead(player: PlayerName): boolean{
    for(let piece of this.pieces){
      if(piece.GetOwner() === player && !piece.GetIsDead()){
        return false;
      }
    }
    
    return true;
  }

  public ExecuteAction(action: Action){
    let pieceId: number = action.GetPieceId();
    let piece: Piece = this.GetPiece(pieceId);
    let originTile: Tile = this.GetTile(action.GetOriginId());
    let destinationTile: Tile = this.GetTile(action.GetDestinationId());
    
    piece.SetTileId(action.GetDestinationId());
    originTile.SetPieceId(-1);
    destinationTile.SetPieceId(pieceId);
    
    if(action.GetType() === ActionType.Take){
      let takenPiece: Piece = this.GetPiece(this.GetPieceIdFromBoardPos(action.GetTakenPiecePos()));
      let takenPieceTile: Tile = this.GetTile(BoardState.GetTileId(action.GetTakenPiecePos()));
      
      takenPiece.SetIsDead(true);
      takenPiece.SetTileId(-1);
      takenPieceTile.SetPieceId(-1);
    }
  }

  public GetPlayerPieceIds(player: PlayerName): number[]{
    let result: number[] = new Array<number>();
    
    for(let piece of this.pieces){
      if(piece.GetOwner() === player){
        result.push(piece.GetId());
      }
    }
    
    return result;
  }

  public CheckIfTileEmpty(tileId: number): boolean{
    if(!BoardState.CheckIfTileIdLegal(tileId)){
      return false;
    }
    
    let tile: Tile = this.GetTile(tileId);
    
    if(tile.GetPieceId() == -1){
      return true;
    }
    
    return false;
  }

  //===================================================
  //
  //===================================================

  private GetPiece(pieceId: number): Piece{
    for(let piece of this.pieces){
      if(piece.GetId() === pieceId){
        return piece;
      }
    }
    
    return null;
  }

  private GetTile(tileId: number): Tile{
    let boardPos: Sup.Math.XY = BoardState.GetBoardPos(tileId);
    
    if(boardPos === null){
      return null;
    }
    
    return this.tiles[boardPos.x][boardPos.y];
  }
}
