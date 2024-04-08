import type { Faction } from "@core/archetypes/faction";
import { changeBudgetMoney } from "@core/components/budget";
import type { Reward } from "@core/components/missions";
import { changeRelations } from "@core/components/relations";
import type { Sim } from "@core/sim";
import { first } from "@fxts/core";
import { gameDialog } from "@ui/atoms";
import { MissionSystem } from "./mission";
import type { MissionConversation } from "./types";

export interface MoneyReward {
  type: "money";
  amount: number;
}

export function isMoneyReward(reward: Reward): reward is MoneyReward {
  return reward.type === "money";
}

export function moneyRewardHandler(reward: Reward, sim: Sim): void {
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

export function relationRewardHandler(reward: Reward, sim: Sim): void {
  if (!isRelationReward(reward))
    throw new Error("Reward is not a relation reward");

  changeRelations(
    first(sim.queries.player.getIt())!,
    sim.getOrThrow<Faction>(reward.factionId),
    reward.amount
  );
}

export interface MissionReward {
  type: "mission";
  mission: string;
}

export function isMissionReward(reward: Reward): reward is MissionReward {
  return reward.type === "mission";
}

export function missionRewardHandler(reward: Reward, sim: Sim): void {
  if (!isMissionReward(reward))
    throw new Error("Reward is not a mission reward");

  const missionSystem = sim.systems.find(
    (s) => s instanceof MissionSystem
  ) as MissionSystem;
  missionSystem.generate(true, reward.mission);
}

export interface ConversationReward {
  type: "conversation";
  conversation: MissionConversation;
}

export function isConversationReward(
  reward: Reward
): reward is ConversationReward {
  return reward.type === "conversation";
}

export function conversationRewardHandler(reward: Reward, _sim: Sim): void {
  if (!isConversationReward(reward))
    throw new Error("Reward is not a conversation reward");

  gameDialog.notify({
    type: "conversation",
    conversation: reward.conversation,
  });
}
