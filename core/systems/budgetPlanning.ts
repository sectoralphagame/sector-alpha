import { faction } from "../archetypes/faction";
import { transferMoney } from "../components/budget";
import type { WithTrade } from "../economy/utils";
import { getPlannedBudget } from "../economy/utils";
import type { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { limitMax } from "../utils/limit";
import { Query } from "./query";
import { System } from "./system";

function settleBudget(entity: WithTrade) {
  const budgetChange =
    getPlannedBudget(entity) - entity.components.budget.available;
  const owner = faction(entity.sim.getOrThrow(entity.components.owner.id));

  if (budgetChange < 0) {
    transferMoney(
      entity.components.budget,
      limitMax(-budgetChange, entity.components.budget.available),
      owner.cp.budget
    );
  } else {
    transferMoney(
      owner.cp.budget,
      limitMax(budgetChange, owner.cp.budget.available),
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
      this.cooldowns.use("settle", 5 * 60);
      this.query
        .get()
        .filter((entity) => entity.sim.getOrThrow(entity.cp.owner.id).cp.ai)
        .forEach(settleBudget);
    }
  };
}
