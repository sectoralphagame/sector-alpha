import type { BaseComponent } from "./component";

export interface Damage extends BaseComponent<"damage"> {
  cooldown: number;
  targetId: number | null;
  range: number;
  value: number;
}
