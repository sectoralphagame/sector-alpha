import { changeBudgetMoney } from "@core/components/budget";
import { transferOwnership } from "@core/utils/ownership";
import type { DevAction, PlayerAction, TargetAction } from "./types";

const addMoney: PlayerAction<[number]> = {
  type: "player",
  slug: "addMoney",
  name: "Add Money",
  description: "Add money to targeted entity",
  category: "core",
  variants: [[1e4], [1e6], [1e9]],
  fn: (sim, quantity: number) => {
    const player = sim.queries.player.get()[0];
    changeBudgetMoney(player.cp.budget!, quantity);
  },
};

const destroy: TargetAction<[]> = {
  type: "target",
  slug: "destroy",
  name: "Destroy",
  description: "Destroy targeted entity",
  category: "core",
  variants: [],
  fn: (sim, targetId: number) => {
    const entity = sim.getOrThrow(targetId);
    entity.unregister();
  },
};

const takeOwnership: TargetAction<[]> = {
  type: "target",
  slug: "take",
  name: "Take ownership",
  description: "Take ownership over targeted entity",
  category: "core",
  variants: [],
  fn: (sim, targetId: number) => {
    const entity = sim.getOrThrow(targetId).requireComponents(["owner"]);
    transferOwnership(entity, sim.queries.player.get()[0].id);
  },
};

const heal: TargetAction<[]> = {
  type: "target",
  slug: "heal",
  name: "Heal",
  description: "Restore hitpoints of targeted entity",
  category: "core",
  variants: [],
  fn: (sim, targetId: number) => {
    const entity = sim.getOrThrow(targetId);
    if (entity.hasComponents(["hitpoints"])) {
      entity.cp.hitpoints.hp.value = entity.cp.hitpoints.hp.max;
      if (entity.cp.hitpoints.shield) {
        entity.cp.hitpoints.shield.value = entity.cp.hitpoints.shield.max;
      }
    }
  },
};

export const coreActions: DevAction[] = [
  addMoney,
  destroy,
  takeOwnership,
  heal,
];
