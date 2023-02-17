import type { BaseComponent } from "./component";

export interface Color extends BaseComponent<"color"> {
  value: string;
}
