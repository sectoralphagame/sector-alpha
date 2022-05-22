import { Matrix } from "mathjs";
import { Sector } from "../archetypes/sector";
import { BaseComponent } from "./component";
import { EntityId } from "./utils/entityId";

export interface Position extends BaseComponent<"position">, EntityId<Sector> {
  angle: number;
  coord: Matrix;
  sector: Sector;
  sectorId: number;
}
