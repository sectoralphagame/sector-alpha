import { MineableCommodity } from "../economy/commodity";
import { BaseComponent } from "./component";
import { EntityId } from "./utils/entityId";

export interface Minable extends BaseComponent<"minable">, EntityId {
  commodity: MineableCommodity;
}
