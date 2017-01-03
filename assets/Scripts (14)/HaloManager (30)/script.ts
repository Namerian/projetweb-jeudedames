class HaloManagerBehavior extends Sup.Behavior {
  static instance: HaloManagerBehavior;
  
  possibleActionHalos: Sup.Actor[];
  selectedActionHalos: Sup.Actor[];
  
  awake() {
    HaloManagerBehavior.instance = this;
    
    this.possibleActionHalos = new Array<Sup.Actor>();
    this.selectedActionHalos = new Array<Sup.Actor>();
  }
  
  public createPossibleActionsHalos(possibleActions: Action[]){
    for(let action of possibleActions){
      let halos = this.createPossibleActionHalos(action);
      
      if(halos.length > 0){
        this.possibleActionHalos = this.possibleActionHalos.concat(halos);
      }
    }
  }
  
  public destroyPossibleActionHalos(){
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
  
  private createPossibleActionHalos(possibleAction: Action): Sup.Actor[]{
    let result = new Array<Sup.Actor>();
    
    //create destination halo
    let destinationPrefab = Sup.appendScene("Prefabs/EmptyHaloPrefab", this.actor);
    let destinationHalo = destinationPrefab[0];
    destinationHalo.setLocalPosition({x:possibleAction.destination.x + 0.5, y:possibleAction.destination.y + 0.5, z:0.5});
    result.push(destinationHalo);
    
    //create take halo
    if(possibleAction.type === ActionType.Take){
      let takePrefab = Sup.appendScene("Prefabs/CrossPrefab", this.actor);
      let takeHalo = takePrefab[0];
      takeHalo.setLocalPosition({x:possibleAction.takenPiecePos.x + 0.5, y:possibleAction.takenPiecePos.y + 0.5, z:1.5});
      result.push(takeHalo);
    }
    
    return result;
  }
  
  public createSelectedActionHalos(selectedAction: Action){
    //create destination halo
    let destinationPrefab = Sup.appendScene("Prefabs/FilledHaloPrefab", this.actor);
    let destinationHalo = destinationPrefab[0];
    destinationHalo.setLocalPosition({x:selectedAction.destination.x + 0.5, y:selectedAction.destination.y + 0.5, z:0.5});
    this.selectedActionHalos.push(destinationHalo);
    
    //create take halo
    if(selectedAction.type === ActionType.Take){
      let takePrefab = Sup.appendScene("Prefabs/CrossPrefab", this.actor);
      let takeHalo = takePrefab[0];
      takeHalo.setLocalPosition({x:selectedAction.takenPiecePos.x + 0.5, y:selectedAction.takenPiecePos.y + 0.5, z:1.5});
      this.selectedActionHalos.push(takeHalo);
    }
  }
  
  public destroySelectedActionHalos(){
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
