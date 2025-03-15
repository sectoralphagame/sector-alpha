import { filter, intersection } from "@fxts/core";
import type { RequireComponent } from "@core/tsHelpers";
import type { CoreComponents } from "@core/components/component";
import { componentMask } from "@core/components/masks";
import type { Entity } from "@core/entity";
import { teleportHook } from "@core/hooks";
import type { EntityTag } from "@core/tags";
import { BitwiseTrie } from "./bitwiseTrie";

function getMask(components: readonly (keyof CoreComponents)[]): bigint {
  return components.reduce((m, name) => m | componentMask[name], 0n);
}

export class EntityIndexer {
  trie: BitwiseTrie<Entity>;
  entityToSector: Map<number, Set<RequireComponent<"position">>>;

  constructor() {
    this.trie = new BitwiseTrie();
    this.entityToSector = new Map();

    teleportHook.subscribe("entityIndexer", ({ entity }) => {
      this.updateSector(entity);
    });
  }

  search<T extends keyof CoreComponents>(
    components: readonly T[],
    tags: readonly EntityTag[] = []
  ): Iterable<RequireComponent<T>> {
    const mask = getMask(components);
    const searchIt = this.trie.search(mask) as Iterable<RequireComponent<T>>;

    if (tags.length > 0) {
      return filter((entity) => entity.hasTags(tags), searchIt);
    }

    return searchIt;
  }

  searchBySector<T extends keyof CoreComponents>(
    sectorId: number,
    components: readonly (T | "position")[],
    tags: readonly EntityTag[] = []
  ): Iterable<RequireComponent<T | "position">> {
    if (!this.entityToSector.has(sectorId)) return [];

    return intersection(
      this.entityToSector.get(sectorId)!,
      this.search(components, tags)
    ) as Iterable<RequireComponent<T | "position">>;
  }

  updateMask(entity: Entity) {
    this.trie.remove(entity);
    this.trie.insert(entity);
  }

  updateSector(entity: RequireComponent<"position">) {
    for (const sectorId of this.entityToSector.keys()) {
      this.entityToSector.get(sectorId)!.delete(entity);
    }
    this.entityToSector.get(entity.cp.position.sector)!.add(entity);
  }

  insert(entity: Entity) {
    this.trie.insert(entity);
    if (entity.cp.position) {
      if (!this.entityToSector.has(entity.cp.position.sector)) {
        this.entityToSector.set(entity.cp.position.sector, new Set());
      }
      this.entityToSector
        .get(entity.cp.position.sector)!
        .add(entity.requireComponents(["position"]));
    }
  }

  remove(entity: Entity) {
    this.trie.remove(entity);
    if (entity.hasComponents(["position"])) {
      for (const sectorId of this.entityToSector.keys()) {
        this.entityToSector.get(sectorId)?.delete(entity);
      }
    }
  }

  clear() {
    this.trie.clear();
    this.entityToSector.clear();
  }
}

export const entityIndexer = new EntityIndexer();
if (window) {
  window.indexer = entityIndexer as any;
}
