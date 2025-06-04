import type { Sector } from "@core/archetypes/sector";
import type { RequireComponent } from "@core/tsHelpers";
import { getPane } from "@ui/context/Pane";
import { useMobx } from "@ui/hooks/useMobx";
import { action, makeObservable, observable } from "mobx";
import type { Vec2 } from "ogl";
import type { FolderApi } from "tweakpane";

export type GameOverlayType = "fleet" | "missions" | "map" | "dev" | null;
export type Selectable = RequireComponent<"position">;
const updateInterval = 100;

export class GameStore {
  selectionBox: boolean = false;
  sector: Sector = undefined!;
  selectedUnits: Selectable[] = [];
  focused = false;
  focusType: "lookAt" | "transition" = "lookAt";
  overlay: GameOverlayType = null;
  isPanelExpanded = false;

  paneFolder: FolderApi | null;

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

      selectionBox: observable,
      setSelectionBoxState: action.bound,

      isPanelExpanded: observable,
      setPanelExpanded: action.bound,
      togglePanelExpanded: action.bound,
    });
  }

  setSector(sector: Sector) {
    this.sector = sector;
  }

  private clearSelectedPane() {
    this.paneFolder?.dispose();
    this.paneFolder = null;
  }

  setSelectedUnits(units: Selectable[]) {
    this.unfocus();
    this.clearSelectedPane();
    this.selectedUnits = units;
    window.selected = this.selectedUnits[0];

    if (units.length === 1) {
      const unit = units[0];

      this.paneFolder = getPane().addOrReplaceFolder({
        title: "Selected Unit",
      });

      if (unit.hasComponents(["hitpoints"])) {
        this.paneFolder.addBinding(unit.cp.hitpoints.hp, "value", {
          max: unit.cp.hitpoints.hp.max,
          min: 0,
        });
        this.paneFolder.addBinding(unit.cp.hitpoints.hp, "max", {
          min: 0,
        });

        if (unit.cp.hitpoints.shield) {
          this.paneFolder.addBinding(unit.cp.hitpoints.shield, "value", {
            max: unit.cp.hitpoints.shield.max,
            min: 0,
          });
          this.paneFolder.addBinding(unit.cp.hitpoints.shield, "max", {
            min: 0,
          });
        }
      }

      if (unit.hasComponents(["position"])) {
        this.paneFolder.addBinding(unit.cp.position, "coord", {
          interval: updateInterval,
          readonly: true,
        });
        this.paneFolder.addBinding(unit.cp.position, "angle", {
          interval: updateInterval,
          readonly: true,
        });
      }

      if (unit.hasComponents(["movable", "position"])) {
        this.paneFolder.addBinding(unit.cp.movable, "velocity", {
          interval: updateInterval,
          readonly: true,
        });
        this.paneFolder.addBinding(unit.cp.movable, "velocity", {
          interval: updateInterval,
          readonly: true,
          format: (v: Vec2) => v.len().toFixed(3),
          label: "speed",
        });
        this.paneFolder.addBinding(unit.cp.movable, "acceleration", {
          interval: updateInterval,
          readonly: true,
        });
        this.paneFolder.addBinding(unit.cp.movable, "drag", {
          interval: updateInterval,
          readonly: true,
          format: (v) => v.toFixed(3),
        });
      }

      if (unit.hasComponents(["drive"])) {
        this.paneFolder.addBinding(unit.cp.drive, "state", {
          interval: updateInterval,
          readonly: true,
        });
        this.paneFolder.addBinding(unit.cp.drive, "mode", {
          interval: updateInterval,
          readonly: true,
        });
      }
    }
  }

  addSelectedUnit(unit: Selectable) {
    if (this.selectedUnits.includes(unit)) return;

    this.selectedUnits = [...this.selectedUnits, unit];
    window.selected = this.selectedUnits[0];
  }

  unselectUnit(unit: Selectable) {
    this.clearSelectedPane();
    this.selectedUnits = this.selectedUnits.filter((e) => e !== unit);
    window.selected = this.selectedUnits[0];
  }

  clearSelection() {
    this.selectedUnits = [];
    window.selected = null;
    this.unfocus();
    this.clearSelectedPane();
  }

  focus() {
    if (!this.selectedUnits.length) return;

    const inTheSameSector = this.selectedUnits.every(
      (e) => e.cp.position?.sector === this.selectedUnits[0].cp.position!.sector
    );
    if (!inTheSameSector) return;

    this.focused = true;
    this.focusType = "transition";
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

  setSelectionBoxState(state: boolean) {
    this.selectionBox = state;
  }

  setPanelExpanded(state: boolean) {
    this.isPanelExpanded = state;
  }

  togglePanelExpanded() {
    this.isPanelExpanded = !this.isPanelExpanded;
  }
}

export const gameStore = new GameStore();
export const useGameStore = <TResult extends any[]>(
  selector: (_store: GameStore) => TResult
) => useMobx(gameStore, selector);
