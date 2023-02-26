import type { BaseComponent } from "./component";

export interface Damage extends BaseComponent<"damage"> {
  targetId: number | null;
  range: number;
  value: number;
}
