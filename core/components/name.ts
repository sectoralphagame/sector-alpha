import { BaseComponent } from "./component";

export interface Name extends BaseComponent<"name"> {
  slug?: string;
  value: string;
}
