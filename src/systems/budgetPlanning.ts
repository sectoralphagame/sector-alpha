import { Entity } from "../components/entity";
import { getPlannedBudget } from "../economy/utils";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { limitMax } from "../utils/limit";
import { System } from "./system";

function settleBudget(entity: Entity) {
  const budgetChange =
    getPlannedBudget(entity) - entity.components.budget.getAvailableMoney();

  if (budgetChange < 0) {
    entity.components.budget.transferMoney(
      limitMax(-budgetChange, entity.components.budget.getAvailableMoney()),
      entity.components.owner.value.budget
    );
  } else {
    entity.components.owner.value.budget.transferMoney(
      limitMax(
        budgetChange,
        entity.components.owner.value.budget.getAvailableMoney()
      ),
      entity.components.budget
    );
  }
}

export class BudgetPlanningSystem extends System {
  cooldowns: Cooldowns<"settle">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("settle");
  }

  query = () =>
    this.sim.entities.filter((e) =>
      e.hasComponents(["budget", "owner", "trade"])
    );

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("settle")) {
      this.cooldowns.use("settle", 60);
      this.query().forEach((entity) => settleBudget(entity));
    }
  };
}