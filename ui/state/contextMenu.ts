import type { Sector } from "@core/archetypes/sector";
import type { Position2D } from "@core/components/position";
import type { Entity } from "@core/entity";
import { useMobx } from "@ui/hooks/useMobx";
import { action, computed, makeObservable, observable } from "mobx";

export class ContextMenuStore {
  active = false;
  position = [0, 0];
  worldPosition = [0, 0];
  sector: Sector | null = null;
  target: Entity | null = null;

  constructor() {
    makeObservable(this, {
      active: observable,
      position: observable,
      worldPosition: observable,
      sector: observable,
      target: observable,
      state: computed,
      open: action.bound,
      close: action.bound,
    });
  }

  open({
    position,
    sector,
    target,
    worldPosition,
  }: {
    position: Position2D;
    worldPosition: Position2D;
    sector: Sector | null;
    target?: Entity | null;
  }) {
    this.active = true;
    this.position = position;
    this.worldPosition = worldPosition;
    this.sector = sector;
    this.target = target ?? null;
  }

  close() {
    this.active = false;
  }

  get state() {
    return {
      active: this.active,
      position: this.position,
      worldPosition: this.worldPosition,
      sector: this.sector,
      target: this.target,
    };
  }
}

export const contextMenuStore = new ContextMenuStore();
export const useContextMenuStore = <TResult extends Array<any>>(
  selector: (_store: ContextMenuStore) => TResult
) => useMobx(contextMenuStore, selector);
