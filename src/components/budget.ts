import { sum } from "mathjs";
import { InsufficientMoney, NegativeBudget, NegativeQuantity } from "../errors";
import { BaseComponent } from "./component";
import {
  Allocation,
  Allocations,
  newAllocation,
  releaseAllocation,
} from "./utils/allocations";

export interface BudgetTransaction {
  amount: number;
  time: number;
}

export interface BudgetAllocation extends Allocation {
  amount: number;
}

export interface Budget
  extends BaseComponent<"budget">,
    Allocations<BudgetAllocation> {
  money: number;
  available: number;
  transactions: BudgetTransaction[];
}

export function validateBudgetAllocation(
  budget: Budget,
  allocation: BudgetAllocation
): boolean {
  return allocation.amount <= budget.available;
}

export function updateAvailableMoney(budget: Budget) {
  budget.available =
    budget.money - sum(budget.allocations.map((a) => a.amount));
}

export function newBudgetAllocation(
  budget: Budget,
  input: Omit<BudgetAllocation, "id" | "meta">,
  meta: object = {}
) {
  const allocation = newAllocation(budget, { ...input, meta }, (a) =>
    validateBudgetAllocation(budget, a)
  );
  updateAvailableMoney(budget);

  return allocation;
}

export function releaseBudgetAllocation(
  budget: Budget,
  id: number
): BudgetAllocation {
  const allocation = releaseAllocation(budget, id);
  updateAvailableMoney(budget);

  return allocation;
}

export function setMoney(budget: Budget, value: number) {
  if (value < 0) {
    throw new NegativeBudget(value);
  }

  budget.money = value;

  updateAvailableMoney(budget);
}

/**
 * Changes budget money by value and adds transaction entry
 * @param value Amount that budget should be increased or decreased, eg. -100
 * would decrease budget's money by 100
 */
export function changeBudgetMoney(budget: Budget, value: number) {
  budget.money += value;

  if (budget.money < 0) {
    throw new NegativeBudget(budget.money);
  }

  budget.transactions.unshift({
    amount: value,
    time: window.sim ? window.sim.getTime() : 0,
  });
  if (budget.transactions.length > 50) {
    budget.transactions.pop();
  }
  updateAvailableMoney(budget);
}

export function transferMoney(budget: Budget, value: number, target: Budget) {
  if (value < 0) {
    throw new NegativeQuantity(value);
  }
  if (budget.money < value) {
    throw new InsufficientMoney(value, budget.money);
  }

  changeBudgetMoney(budget, -value);
  changeBudgetMoney(target, value);
}

export function createBudget(): Budget {
  return {
    allocationIdCounter: 1,
    allocations: [],
    available: 0,
    money: 0,
    name: "budget",
    transactions: [],
  };
}
