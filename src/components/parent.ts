import { BaseComponent } from "./component";
import { Entity } from "./entity";
import { EntityId } from "./utils/entityId";

export interface Parent<T extends Entity = Entity>
  extends BaseComponent<"parent">,
    EntityId<T> {}
