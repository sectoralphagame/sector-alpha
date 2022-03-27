import { sum } from "mathjs";
import {
  InsufficientMoney,
  NegativeBudget,
  NegativeQuantity,
  NonPositiveAmount,
  NotFound,
} from "../errors";
import { AllocationManager } from "./allocations";

interface BudgetAllocation {
  id: number;
  amount: number;
}

export class Budget {
  private money: number = 0;

  allocations: AllocationManager<BudgetAllocation>;

  constructor() {
    this.allocations = new AllocationManager<BudgetAllocation>();
  }

  getAvailableMoney = () =>
    this.money - sum(this.allocations.all().map((a) => a.amount));

  getAllMoney = () => this.money;

  changeMoney = (value: number) => {
    this.money += value;

    if (this.money < 0) {
      throw new NegativeBudget(this.money);
    }
  };

  set = (value: number) => {
    if (value < 0) {
      throw new NegativeBudget(value);
    }

    this.money = value;
  };

  transferMoney = (value: number, target: Budget) => {
    if (value < 0) {
      throw new NegativeQuantity(value);
    }
    if (this.money < value) {
      throw new InsufficientMoney(value, this.money);
    }

    this.changeMoney(-value);
    target.changeMoney(value);
  };
}
