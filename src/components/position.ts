import { Matrix } from "mathjs";
import { Sector } from "../archetypes/sector";
import { NonNullableFields } from "../tsHelpers";
import { BaseComponent } from "./component";
import { EntityId } from "./utils/entityId";

export interface Position
  extends BaseComponent<"position">,
    NonNullableFields<EntityId<Sector>> {
  angle: number;
  coord: Matrix;
}
