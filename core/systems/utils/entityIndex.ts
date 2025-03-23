import type { EntityTag } from "@core/tags";

import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import type { CoreComponents } from "../../components/component";

/**
 * @deprecated
 */
export class EntityIndex<T extends keyof CoreComponents> {
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

  getIt() {
    return entityIndexer.search(this.components, this.tags);
  }

  get() {
    return Array.from(this.getIt());
  }

  // eslint-disable-next-line class-methods-use-this
  apply() {}
}
