import type { Sector } from "@core/archetypes/sector";
import type { Entity } from "@core/entity";
import { useMobx } from "@ui/hooks/useMobx";
import { action, makeObservable, observable } from "mobx";

export type GameOverlayType = "fleet" | "missions" | "map" | "dev" | null;

export class GameStore {
  sector: Sector = undefined!;
  selectedUnit: Entity | null = null;
  focused = false;
  overlay: GameOverlayType = null;

  constructor() {
    makeObservable(this, {
      sector: observable,
      setSector: action.bound,

      selectedUnit: observable,
      setSelectedUnit: action.bound,
      unselectUnit: action.bound,
      focused: observable,
      focus: action.bound,
      unfocus: action.bound,

      overlay: observable,
      setOverlay: action.bound,
      closeOverlay: action.bound,
    });
  }

  setSector(sector: Sector) {
    this.sector = sector;
  }

  setSelectedUnit(unit: Entity) {
    this.selectedUnit = unit;
    window.selected = unit;
  }

  unselectUnit() {
    this.selectedUnit = null;
    this.focused = false;
    window.selected = null;
  }

  focus() {
    if (!this.selectedUnit) return;

    this.focused = true;
    this.setSector(
      this.selectedUnit.sim.getOrThrow(this.selectedUnit.cp.position!.sector)
    );
  }

  unfocus() {
    this.focused = false;
  }

  setOverlay(overlay: GameOverlayType) {
    this.overlay = overlay;
  }

  closeOverlay() {
    this.overlay = null;
  }
}

export const gameStore = new GameStore();
export const useGameStore = <TResult extends Array<any>>(
  selector: (_store: GameStore) => TResult
) => useMobx(gameStore, selector);
