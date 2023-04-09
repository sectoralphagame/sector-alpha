import type { BaseComponent } from "./component";

export interface CreationDate extends BaseComponent<"creationDate"> {
  date: number;
}
