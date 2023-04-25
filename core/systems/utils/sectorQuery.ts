import type { CoreComponents } from "@core/components/component";
import type { Sim } from "@core/sim";
import type { EntityTag } from "@core/tags";
import type { RequireComponent } from "@core/tsHelpers";
import { SyncHook } from "tapable";
import { Query } from "./query";

const hook = new SyncHook<[number, number, RequireComponent<"position">]>([
  "oldSector",
  "newSector",
  "entity",
]);

export class SectorQuery<T extends keyof CoreComponents> {
  sectors: Map<number, ReturnType<Query<T | "position">["get"]>>;
  query: Query<T | "position">;

  constructor(
    sim: Sim,
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = []
  ) {
    this.sectors = new Map();
    this.query = new Query(
      sim,
      [...requiredComponents, "position"],
      requiredTags
    );

    this.query.hooks.add.tap("SectorQuery", (entity) => {
      this.add(entity.cp.position.sector, entity);
    });
    this.query.hooks.remove.tap("SectorQuery", (entityId) => {
      this.remove(entityId);
    });

    this.query.init();
  }

  changePosition = (
    entity: RequireComponent<T | "position">,
    oldSector: number,
    newSector: number
  ) => {
    if (oldSector !== newSector) {
      this.remove(entity.id, oldSector);
      this.add(newSector, entity);
    }
  };

  add = (sector: number, entity: RequireComponent<T | "position">) => {
    this.sectors.set(sector, (this.sectors.get(sector) ?? []).concat(entity));
  };

  remove = (entityId: number, sector?: number) => {
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

  static call(
    oldSector: number,
    newSector: number,
    entity: RequireComponent<"position">
  ) {
    hook.call(oldSector, newSector, entity);
  }
}
