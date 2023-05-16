import type { BaseComponent } from "./component";

export interface Model extends BaseComponent<"model"> {
  slug: string;
  value: string;
}
