import { changeBudgetMoney } from "@core/components/budget";
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

export const coreActions: DevAction[] = [
  addMoney,
  destroy,
  // {
  //     type:"target",
  //   name: "addCommodity",
  //   description: "Add commodity to targeted storage",
  //   category: "cheats",
  //   fn: (commodity: Commodity, quantity: number, id?: number) => {
  //     const entity = id ? sim.getOrThrow(id) : (window.selected as Entity);
  //     if (entity) {
  //       addStorage(entity.cp.storage!, commodity, quantity);
  //     }
  //   }
  // },
];
