import { BaseComponent } from "./component";

export interface Name extends BaseComponent<"name"> {
  value: string;
}
