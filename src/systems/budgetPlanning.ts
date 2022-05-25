import { transferMoney } from "../components/budget";
import { getPlannedBudget, WithTrade } from "../economy/utils";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { limitMax } from "../utils/limit";
import { Query } from "./query";
import { System } from "./system";

function settleBudget(entity: WithTrade) {
  const budgetChange =
    getPlannedBudget(entity) - entity.components.budget.available;

  if (budgetChange < 0) {
    transferMoney(
      entity.components.budget,
      limitMax(-budgetChange, entity.components.budget.available),
      entity.components.owner.value!.budget
    );
  } else {
    transferMoney(
      entity.components.owner.value!.budget,
      limitMax(budgetChange, entity.components.owner.value!.budget.available),
      entity.components.budget
    );
  }
}

export class BudgetPlanningSystem extends System {
  cooldowns: Cooldowns<"settle">;
  query: Query<"budget" | "owner" | "trade">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("settle");
    this.query = new Query(sim, ["budget", "owner", "trade"]);
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("settle")) {
      this.cooldowns.use("settle", 60);
      this.query.get().forEach(settleBudget);
    }
  };
}
