import { Faction } from "../economy/faction";
import { BaseComponent } from "./component";

export interface Owner extends BaseComponent<"owner"> {
  value: Faction | null;
}
