import { BaseComponent } from "./component";

export interface Owner extends BaseComponent<"owner"> {
  id: number;
}
