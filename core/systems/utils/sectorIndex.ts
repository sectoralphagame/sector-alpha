import type { CoreComponents } from "@core/components/component";
import type { Sim } from "@core/sim";
import type { EntityTag } from "@core/tags";
import type { RequireComponent } from "@core/tsHelpers";
import { Observable } from "@core/utils/observer";
import type { IndexEntities } from "./entityIndex";
import { BaseIndex } from "./entityIndex";

// Old sector, new sector and entity
const hook = new Observable<[number, number, RequireComponent<"position">]>(
  "sectorIndex"
);

export class SectorIndex<T extends keyof CoreComponents> {
  sectors: Map<number, IndexEntities<T | "position">>;
  index: BaseIndex<T | "position">;

  constructor(
    sim: Sim,
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = []
  ) {
    this.sectors = new Map();
    this.index = new BaseIndex(
      sim,
      [...requiredComponents, "position"],
      requiredTags
    );
    this.index.enableHooks();

    hook.subscribe(this.constructor.name, this.changePosition);
    this.index.hooks.add.subscribe(this.constructor.name, (entity) => {
      this.add(entity.cp.position.sector, entity);
    });
    this.index.hooks.remove.subscribe(this.constructor.name, (entityId) => {
      this.remove(entityId);
    });
  }

  changePosition = (
    oldSector: number,
    newSector: number,
    entity: RequireComponent<T | "position">
  ) => {
    if (oldSector !== newSector && this.index.canBeAdded(entity)) {
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

  // get = (sectorId: number): QueryEntities<T> =>
  //   this.sim.filter(
  //     (entity) =>
  //       this.canBeAdded(entity) && entity.cp.position!.sector === sectorId
  //   ) as any;

  // getIt = (sectorId: number): IterableIterator<RequireComponent<T>> =>
  //   filter(
  //     (entity) =>
  //       this.canBeAdded(entity) && entity.cp.position!.sector === sectorId,
  //     this.sim.entities.values()
  //   ) as any;

  get = (sectorId: number): IndexEntities<T> => {
    if (!this.sectors.get(sectorId)) {
      this.sectors.set(sectorId, []);
      this.index.collect();
    }

    return this.sectors.get(sectorId)!;
  };

  reset = () => {
    this.sectors.clear();
  };

  static notify(
    oldSector: number,
    newSector: number,
    entity: RequireComponent<"position">
  ) {
    hook.notify(oldSector, newSector, entity);
  }
}
