import type { CoreComponents } from "@core/components/component";
import type { EntityTag } from "@core/tags";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";

/**
 * @deprecated
 */
export class SectorIndex<T extends keyof CoreComponents> {
  components: readonly T[];
  tags: readonly EntityTag[] = [];

  constructor(
    components: readonly T[],
    tags?: readonly EntityTag[],
    _isStatic?: boolean
  ) {
    this.components = components;
    if (tags) this.tags = tags;
  }

  getIt(id: number) {
    return entityIndexer.searchBySector(id, this.components, this.tags);
  }

  get(id: number) {
    return Array.from(this.getIt(id));
  }

  // eslint-disable-next-line class-methods-use-this
  apply() {}
}
