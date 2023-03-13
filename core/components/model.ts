import type { BaseComponent } from "./component";

export interface Model extends BaseComponent<"model"> {
  value: string;
}
