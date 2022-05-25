import { BaseComponent } from "./component";
import { EntityIds } from "./utils/entityId";

export interface Children extends BaseComponent<"children">, EntityIds {}
