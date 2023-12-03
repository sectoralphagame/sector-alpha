import type { Faction } from "@core/archetypes/faction";
import { changeBudgetMoney } from "@core/components/budget";
import type { Mission, Reward } from "@core/components/missions";
import { changeRelations } from "@core/components/relations";
import type { Sim } from "@core/sim";
import { first } from "@fxts/core";

export interface MoneyReward {
  type: "money";
  amount: number;
}

export function isMoneyReward(reward: Reward): reward is MoneyReward {
  return reward.type === "money";
}

export function moneyRewardHandler(reward: Mission, sim: Sim): void {
  if (!isMoneyReward(reward)) throw new Error("Reward is not a money reward");

  changeBudgetMoney(
    first(sim.queries.player.getIt())!.cp.budget,
    reward.amount
  );
}

export interface RelationReward {
  type: "relation";
  amount: number;
  factionId: number;
}

export function isRelationReward(reward: Reward): reward is RelationReward {
  return reward.type === "relation";
}

export function relationRewardHandler(reward: Mission, sim: Sim): void {
  if (!isRelationReward(reward))
    throw new Error("Reward is not a relation reward");

  changeRelations(
    first(sim.queries.player.getIt())!,
    sim.getOrThrow<Faction>(reward.factionId),
    reward.amount
  );
}
