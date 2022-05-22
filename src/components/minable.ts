import { MineableCommodity } from "../economy/commodity";
import { MissingEntityError } from "../errors";
import { Sim } from "../sim";
import { BaseComponent } from "./component";
import { Entity } from "./entity";
import { EntityId } from "./utils/entityId";

export interface Minable extends BaseComponent<"minable">, EntityId {
  commodity: MineableCommodity;
}
