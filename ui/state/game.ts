import type { Sector } from "@core/archetypes/sector";
import type { RequireComponent } from "@core/tsHelpers";
import { useMobx } from "@ui/hooks/useMobx";
import { action, makeObservable, observable } from "mobx";

export type GameOverlayType = "fleet" | "missions" | "map" | "dev" | null;
export type Selectable = RequireComponent<"position">;

export class GameStore {
  sector: Sector = undefined!;
  selectedUnits: Selectable[] = [];
  focused = false;
  overlay: GameOverlayType = null;

  constructor() {
    makeObservable(this, {
      sector: observable,
      setSector: action.bound,

      selectedUnits: observable,
      setSelectedUnits: action.bound,
      addSelectedUnit: action.bound,
      unselectUnit: action.bound,
      clearSelection: action.bound,
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

  setSelectedUnits(units: Selectable[]) {
    this.unfocus();
    this.selectedUnits = units;
    window.selected = this.selectedUnits[0];
  }

  addSelectedUnit(unit: Selectable) {
    if (this.selectedUnits.includes(unit)) return;

    this.selectedUnits = [...this.selectedUnits, unit];
    window.selected = this.selectedUnits[0];
  }

  unselectUnit(unit: Selectable) {
    this.selectedUnits = this.selectedUnits.filter((e) => e !== unit);
    window.selected = this.selectedUnits[0];
  }

  clearSelection() {
    this.selectedUnits = [];
    window.selected = null;
    this.unfocus();
  }

  focus() {
    if (!this.selectedUnits.length) return;

    const inTheSameSector = this.selectedUnits.every(
      (e) => e.cp.position?.sector === this.selectedUnits[0].cp.position!.sector
    );
    if (!inTheSameSector) return;

    this.focused = true;
    this.setSector(
      this.selectedUnits[0].sim.getOrThrow(
        this.selectedUnits[0].cp.position!.sector
      )
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
