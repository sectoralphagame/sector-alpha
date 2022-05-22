import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";
import { EntityIds } from "./utils/entityId";

export interface Modules
  extends BaseComponent<"modules">,
    EntityIds<RequireComponent<"parent" | "name">> {}
