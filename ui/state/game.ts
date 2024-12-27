import type { Sector } from "@core/archetypes/sector";
import { useMobx } from "@ui/hooks/useMobx";
import { action, makeObservable, observable } from "mobx";

export type GameOverlayType = "fleet" | "missions" | "map" | "dev" | null;

export class GameStore {
  sector: Sector = undefined!;
  overlay: GameOverlayType = null;

  constructor() {
    makeObservable(this, {
      sector: observable,
      setSector: action.bound,

      overlay: observable,
      setOverlay: action.bound,
      closeOverlay: action.bound,
    });
  }

  setSector(sector: Sector) {
    this.sector = sector;
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
