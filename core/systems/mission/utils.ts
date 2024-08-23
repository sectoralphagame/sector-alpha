import type { Faction } from "@core/archetypes/faction";
import { first } from "@fxts/core";

const relationFactorA = (1 - 1.5) / (-10 - 50);
const relationFactorB = 1 - relationFactorA * -10;

export function getRelationFactor(faction: Faction): number {
  const player = first(faction.sim.index.player.getIt())!;

  return (
    relationFactorA * player.cp.relations.values[faction.id] + relationFactorB
  );
}
