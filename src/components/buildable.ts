import { Commodity } from "../economy/commodity";
import { BaseComponent } from "./component";

export interface Buildable extends BaseComponent<"buildable"> {
  cost: Partial<Record<Commodity, number>>;
  time: number;
}
