import type { RequireComponent } from "@core/tsHelpers";
import type { BaseComponent } from "./component";

export interface Experience extends BaseComponent<"experience"> {
  amount: number;
  rank: number;
}

const ranks = [200, 600, 1400, 3000, 6200, Infinity];

function getRank(exp: number): number {
  return ranks.findIndex((threshold) => exp < threshold);
}

export function addExperience(
  entity: RequireComponent<"experience">,
  value: number
): void {
  entity.cp.experience.amount += value;
  const newRank = getRank(entity.cp.experience.amount);
  if (newRank > entity.cp.experience.rank) {
    entity.cp.experience.rank = newRank;

    if (entity.hasComponents(["damage"])) {
      entity.cp.damage.modifiers.rank = 0.1 * entity.cp.experience.rank;
    }
    if (entity.hasComponents(["hitpoints"])) {
      entity.cp.hitpoints.hp.modifiers.rank = 0.1 * entity.cp.experience.rank;
    }
    entity.addTag("recalculate:modifiers");
  }
}
