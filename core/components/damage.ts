import type { BaseComponent } from "./component";

export interface Damage extends BaseComponent<"damage"> {
  cooldown: number;
  targetId: number | null;
  range: number;
  angle: number;
  modifiers: Record<string, number>;
  output: {
    base: number;
    current: number;
  };
}

export function recalculate(cp: Damage): void {
  let multiplier = 1;
  for (const mod of Object.values(cp.modifiers)) {
    multiplier += mod;
  }

  cp.output.current = cp.output.base * multiplier;
}
