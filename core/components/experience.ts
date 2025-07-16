import type { RequireComponent } from "@core/tsHelpers";
import type { BaseComponent } from "./component";

export interface Experience extends BaseComponent<"experience"> {
  amount: number;
  rank: number;
}

const ranks = [200, 600, 1400, 3000, 6200];

function getRank(exp: number): number {
  return ranks.findIndex((threshold) => exp < threshold) + 1;
}

export function addExperience(
  entity: RequireComponent<"experience">,
  value: number
): void {
  entity.cp.experience.amount += value;
  entity.cp.experience.rank = getRank(entity.cp.experience.amount);
}
