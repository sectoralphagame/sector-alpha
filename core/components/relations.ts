import type { Faction } from "@core/archetypes/faction";
import type { BaseComponent } from "./component";

export interface Relations extends BaseComponent<"relations"> {
  values: Record<number, number>;
}

export const relationThresholds = {
  attack: -60,
  trade: -20,
  shipyard: 0,
} as const;

export function changeRelations(a: Faction, b: Faction, change: number) {
  if (!a.cp.relations.values[b.id]) {
    a.cp.relations.values[b.id] = 0;
  }
  if (!b.cp.relations.values[a.id]) {
    b.cp.relations.values[a.id] = 0;
  }
  a.cp.relations.values[b.id] += change;
  b.cp.relations.values[a.id] += change;
}
