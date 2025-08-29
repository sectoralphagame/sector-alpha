import type { RequireComponent } from "@core/tsHelpers";
import type { Entity } from "@core/entity";
import type { BaseComponent } from "./component";

export interface Experience extends BaseComponent<"experience"> {
  amount: number;
  rank: number;
}

export const ranks = [200, 600, 1400, 3000, 6200, Infinity];

export function getRank(exp: number): number {
  return ranks.findIndex((threshold) => exp < threshold);
}

function rankUp(entity: Entity, rank: number) {
  if (entity.hasComponents(["damage"])) {
    entity.cp.damage.modifiers.rank = 0.1 * rank;
  }
  if (entity.hasComponents(["hitpoints"])) {
    entity.cp.hitpoints.hp.modifiers.rank = 0.1 * rank;
  }
  entity.addTag("recalculate:modifiers");

  for (const child of entity.cp.children?.entities ?? []) {
    const childEntity = entity.sim.getOrThrow(child.id);
    if (childEntity.hasComponents(["experience"])) {
      rankUp(childEntity, rank);
    }
  }
}

export function addExperience(
  entity: RequireComponent<"experience">,
  value: number
): void {
  entity.cp.experience.amount += value;
  const newRank = getRank(entity.cp.experience.amount);
  if (newRank > entity.cp.experience.rank) {
    entity.cp.experience.rank = newRank;

    rankUp(entity, newRank);
  }
}
