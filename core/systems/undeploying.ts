import { changeBudgetMoney } from "@core/components/budget";
import type { DeployableType } from "@core/components/deployable";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { Cooldowns } from "@core/utils/cooldowns";
import { Query } from "./query";
import { System } from "./system";

const handlers: Partial<
  Record<DeployableType, (_entity: RequireComponent<"deployable">) => void>
> = {
  builder: (entity) => {
    const builder = entity.requireComponents([
      "budget",
      "owner",
      "deployable",
      "storage",
      "storageBonus",
    ]);
    const ownerBudget = builder.sim.get(builder.cp.owner.id)?.cp.budget;
    if (ownerBudget) {
      changeBudgetMoney(ownerBudget, builder.cp.budget.money);
    }

    builder.cp.storage.max -= builder.cp.storageBonus.value;

    builder
      .addComponent({
        name: "autoOrder",
        default: { type: "hold" },
      })
      .addComponent({ name: "orders", value: [] })
      .removeComponent("budget")
      .removeComponent("trade")
      .removeComponent("docks")
      .removeComponent("storageBonus")
      .removeComponent("builder");

    builder.sim.queries.commendables.get().forEach((commendable) => {
      if (commendable.cp.commander.id === builder.id) {
        commendable.removeComponent("commander");
      }
    });

    builder.cp.deployable.cancel = false;
    builder.cp.deployable.active = false;
  },
};

export class UndeployingSystem extends System {
  cooldowns: Cooldowns<"exec">;
  query: Query<"deployable">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("exec");
    this.query = new Query(sim, ["deployable"]);
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 1);
      this.query.get().forEach((entity) => {
        if (entity.cp.deployable.cancel) {
          handlers[entity.cp.deployable.type]?.(entity);
        }
      });
    }
  };
}
