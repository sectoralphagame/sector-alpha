import { BaseComponent } from "./component";
import { EntityId } from "./utils/entityId";

export interface Children extends BaseComponent<"children">, EntityId {}
