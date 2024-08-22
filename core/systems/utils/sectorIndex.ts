import type { CoreComponents } from "@core/components/component";
import type { Sim } from "@core/sim";
import type { EntityTag } from "@core/tags";
import type { RequireComponent } from "@core/tsHelpers";
import { Observable } from "@core/utils/observer";
import { flatMap, pipe } from "@fxts/core";
import type { IndexEntities } from "./entityIndex";
import { BaseEntityIndex } from "./entityIndex";

const hook = new Observable<{
  oldSectorId: number;
  newSectorId: number;
  entity: RequireComponent<"position">;
}>("sectorIndex");

export class SectorIndex<T extends keyof CoreComponents> {
  sectors: Map<number, IndexEntities<T | "position">>;
  index: BaseEntityIndex<T | "position">;

  constructor(
    sim: Sim,
    requiredComponents: readonly T[],
    requiredTags: readonly EntityTag[] = []
  ) {
    this.sectors = new Map();
    this.index = new BaseEntityIndex(
      sim,
      [...requiredComponents, "position"],
      requiredTags
    );
    this.index.enableHooks();

    hook.subscribe(this.constructor.name, this.changePosition);
    this.index.hooks.add.subscribe(this.constructor.name, (entity) => {
      this.add(entity.cp.position.sector, entity);
    });
    this.index.hooks.remove.subscribe(this.constructor.name, ({ id }) => {
      this.remove(id);
    });
    this.index.collect();
  }

  all = (): IterableIterator<RequireComponent<T>> =>
    pipe(
      this.sectors.keys(),
      flatMap((sector) => this.get(sector))
    );

  changePosition = ({
    entity,
    newSectorId,
    oldSectorId,
  }: {
    oldSectorId: number;
    newSectorId: number;
    entity: RequireComponent<T | "position">;
  }) => {
    if (oldSectorId !== newSectorId && this.index.canBeAdded(entity)) {
      this.remove(entity.id, oldSectorId);
      this.add(newSectorId, entity);
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
    oldSectorId: number,
    newSectorId: number,
    entity: RequireComponent<"position">
  ) {
    hook.notify({ oldSectorId, newSectorId, entity });
  }
}
