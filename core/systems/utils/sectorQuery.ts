import type { CoreComponents } from "@core/components/component";
import type { Sim } from "@core/sim";
import type { EntityTag } from "@core/tags";
import type { RequireComponent } from "@core/tsHelpers";
import { SyncHook } from "tapable";
import type { QueryEntities } from "./query";
import { BaseQuery } from "./query";

const hook = new SyncHook<[number, number, RequireComponent<"position">]>([
  "oldSector",
  "newSector",
  "entity",
]);

export class SectorQuery<T extends keyof CoreComponents> {
  sectors: Map<number, QueryEntities<T | "position">>;
  query: BaseQuery<T | "position">;

  constructor(
    sim: Sim,
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = []
  ) {
    this.sectors = new Map();
    this.query = new BaseQuery(
      sim,
      [...requiredComponents, "position"],
      requiredTags
    );

    hook.tap(this.constructor.name, this.changePosition);
    this.query.hooks.add.tap(this.constructor.name, (entity) => {
      this.add(entity.cp.position.sector, entity);
    });
    this.query.hooks.remove.tap(this.constructor.name, (entityId) => {
      this.remove(entityId);
    });
  }

  changePosition = (
    oldSector: number,
    newSector: number,
    entity: RequireComponent<T | "position">
  ) => {
    if (oldSector !== newSector && this.query.canBeAdded(entity)) {
      this.remove(entity.id, oldSector);
      this.add(newSector, entity);
    }
  };

  add = (sector: number, entity: RequireComponent<T | "position">) => {
    this.sectors.set(sector, (this.sectors.get(sector) ?? []).concat(entity));
  };

  remove = (entityId: number, sector?: number) => {
    if (sector && !this.sectors.get(sector)) return;

    if (sector) {
      this.sectors.set(
        sector,
        this.sectors.get(sector)!.filter((e) => e.id !== entityId)
      );
    } else {
      for (const sectorId of this.sectors.keys()) {
        this.sectors.set(
          sectorId,
          this.sectors.get(sectorId)!.filter((e) => e.id !== entityId)
        );
      }
    }
  };

  get = (sectorId: number) => {
    if (!this.sectors.get(sectorId)) {
      this.sectors.set(sectorId, []);
      this.query.collect();
    }

    return this.sectors.get(sectorId)!;
  };

  reset = () => this.sectors.clear();

  static call(
    oldSector: number,
    newSector: number,
    entity: RequireComponent<"position">
  ) {
    hook.call(oldSector, newSector, entity);
  }
}
