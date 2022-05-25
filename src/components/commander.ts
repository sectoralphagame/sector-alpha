import { NonNullableFields } from "../tsHelpers";
import { BaseComponent } from "./component";
import { EntityId } from "./utils/entityId";

export interface Commander
  extends BaseComponent<"commander">,
    NonNullableFields<EntityId> {}
