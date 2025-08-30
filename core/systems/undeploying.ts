import { changeBudgetMoney } from "@core/components/budget";
import type { DeployableType } from "@core/components/deployable";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { removeSubordinate } from "@core/components/subordinates";
import { entityIndexer } from "@core/entityIndexer/entityIndexer";
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
      "facilityModuleBonus",
      "subordinates",
    ]);
    const ownerBudget = builder.sim.get(builder.cp.owner.id)?.cp.budget;
    if (ownerBudget) {
      changeBudgetMoney(ownerBudget, builder.cp.budget.money);
    }

    builder.cp.storage.max -= builder.cp.facilityModuleBonus.storage!;

    builder.cp.subordinates.ids.forEach((id) => {
      removeSubordinate(builder, builder.sim.getOrThrow(id));
    });

    builder
      .addComponent({
        name: "autoOrder",
        default: { type: "hold" },
      })
      .addComponent({ name: "orders", value: [] })
      .removeComponent("budget")
      .removeComponent("trade")
      .removeComponent("docks")
      .removeComponent("facilityModuleBonus")
      .removeComponent("builder");

    builder.cp.deployable.cancel = false;
    builder.cp.deployable.active = false;
  },
};

export class UndeployingSystem extends System<"exec"> {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.subscribe("phase", ({ phase }) => {
      if (phase === "update") {
        this.exec();
      }
    });
  };

  exec = (): void => {
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 1);
      for (const entity of entityIndexer.search(["deployable"])) {
        if (entity.cp.deployable.cancel) {
          handlers[entity.cp.deployable.type]?.(entity);
        }
      }
    }
  };
}

export const undeployingSystem = new UndeployingSystem();
