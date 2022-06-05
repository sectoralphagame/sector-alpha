import { BaseComponent } from "./component";

export interface Children extends BaseComponent<"children"> {
  entities: number[];
}
