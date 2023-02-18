import type { Faction } from "@core/archetypes/faction";
import type { BaseComponent } from "./component";

export interface Relations extends BaseComponent<"relations"> {
  values: Record<number, number>;
}

export const relationThresholds = {
  trade: -20,
} as const;

export function changeRelations(a: Faction, b: Faction, change: number) {
  if (a.cp.relations.values[b.cp.name.slug!]) {
    a.cp.relations.values[b.cp.name.slug!] = 0;
  }
  if (b.cp.relations.values[a.cp.name.slug!]) {
    b.cp.relations.values[a.cp.name.slug!] = 0;
  }
  a.cp.relations.values[b.cp.name.slug!] += change;
  b.cp.relations.values[a.cp.name.slug!] += change;
}
