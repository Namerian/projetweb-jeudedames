class HaloManagerBehavior extends Sup.Behavior {
  private static instance: HaloManagerBehavior;
  
  public static GetInstance(): HaloManagerBehavior{
    return this.instance;
  }
  
  //=====================================================================
  //
  //=====================================================================
  
  private possibleActionHalos: Sup.Actor[];
  private selectedActionHalos: Sup.Actor[];
  
  //=====================================================================
  //
  //=====================================================================
  
  awake() {
    HaloManagerBehavior.instance = this;
    
    this.possibleActionHalos = new Array<Sup.Actor>();
    this.selectedActionHalos = new Array<Sup.Actor>();
  }
  
  //=====================================================================
  //
  //=====================================================================
  
  public CreatePossibleActionsHalos(possibleActions: Action[]){
    for(let action of possibleActions){
      let halos = this.CreatePossibleActionHalos(action);
      
      if(halos.length > 0){
        this.possibleActionHalos = this.possibleActionHalos.concat(halos);
      }
    }
  }
  
  public DestroyPossibleActionHalos(){
    //Sup.log("HaloManager:destroyPossibleActionHalos:called! numOfActors="+this.possibleActionHalos.length);
    if(this.possibleActionHalos.length > 0){      
      for(let halo of this.possibleActionHalos){
        if(halo != null){
          halo.destroy();
        }
      }
      this.possibleActionHalos.length = 0;
    }
    //Sup.log("HaloManager:destroyPossibleActionHalos:finished! numOfActors="+this.possibleActionHalos.length);
  }
  
  private CreatePossibleActionHalos(possibleAction: Action): Sup.Actor[]{
    let result = new Array<Sup.Actor>();
    
    //create destination halo
    let destinationPrefab = Sup.appendScene("Prefabs/EmptyHaloPrefab", this.actor);
    let destinationHalo = destinationPrefab[0];
    let destinationBoardPos: Sup.Math.XY = BoardState.GetBoardPos(possibleAction.GetDestinationId());
    destinationHalo.setLocalPosition({x:destinationBoardPos.x + 0.5, y:destinationBoardPos.y + 0.5, z:0.5});
    result.push(destinationHalo);
    
    //create take halo
    if(possibleAction.GetType() === ActionType.Take){
      let takePrefab = Sup.appendScene("Prefabs/CrossPrefab", this.actor);
      let takeHalo = takePrefab[0];
      takeHalo.setLocalPosition({x:possibleAction.GetTakenPiecePos().x + 0.5, y:possibleAction.GetTakenPiecePos().y + 0.5, z:1.5});
      result.push(takeHalo);
    }
    
    return result;
  }
  
  public CreateSelectedActionHalos(selectedAction: Action){
    //create destination halo
    let destinationPrefab = Sup.appendScene("Prefabs/FilledHaloPrefab", this.actor);
    let destinationHalo = destinationPrefab[0];
    let destinationBoardPos: Sup.Math.XY = BoardState.GetBoardPos(selectedAction.GetDestinationId());
    destinationHalo.setLocalPosition({x:destinationBoardPos.x + 0.5, y:destinationBoardPos.y + 0.5, z:0.5});
    this.selectedActionHalos.push(destinationHalo);
    
    //create take halo
    if(selectedAction.GetType() === ActionType.Take){
      let takePrefab = Sup.appendScene("Prefabs/CrossPrefab", this.actor);
      let takeHalo = takePrefab[0];
      takeHalo.setLocalPosition({x:selectedAction.GetTakenPiecePos().x + 0.5, y:selectedAction.GetTakenPiecePos().y + 0.5, z:1.5});
      this.selectedActionHalos.push(takeHalo);
    }
  }
  
  public DestroySelectedActionHalos(){
    if(this.selectedActionHalos.length > 0){
      for(let halo of this.selectedActionHalos){
        if(halo !== null){
          halo.destroy();
        }
      }
      this.selectedActionHalos.length = 0;
    }
  }
}
Sup.registerBehavior(HaloManagerBehavior);
