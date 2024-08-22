import { sum } from "mathjs";
import {
  InsufficientMoney,
  NegativeBudget,
  NegativeQuantity,
  NotFiniteMoney,
} from "../errors";
import type { BaseComponent } from "./component";
import type {
  Allocation,
  AllocationMeta,
  Allocations,
} from "./utils/allocations";
import { newAllocation, releaseAllocation } from "./utils/allocations";

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
  meta: AllocationMeta = {}
) {
  const allocation = newAllocation(budget, { ...input, meta }, (a) =>
    validateBudgetAllocation(budget, a)
  );
  updateAvailableMoney(budget);

  return allocation;
}

export function releaseBudgetAllocation(
  budget: Budget,
  id: number,
  reason: string
): BudgetAllocation {
  const allocation = releaseAllocation(budget, id, reason);
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
 * Changes budget money by value
 * @param value Amount that budget should be increased or decreased, eg. -100
 * would decrease budget's money by 100
 */
export function changeBudgetMoney(budget: Budget, value: number) {
  budget.money += value;

  if (!Number.isFinite(value)) {
    throw new NotFiniteMoney();
  }
  if (budget.money < 0) {
    throw new NegativeBudget(budget.money);
  }
  if (Number.isNaN(budget.money)) {
    throw new NotFiniteMoney();
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
    allocationReleaseLog: [],
    allocations: [],
    available: 0,
    money: 0,
    name: "budget",
  };
}
