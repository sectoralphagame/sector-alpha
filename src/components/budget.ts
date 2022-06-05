import { sum } from "mathjs";
import { InsufficientMoney, NegativeBudget, NegativeQuantity } from "../errors";
import { AllocationManager } from "./utils/allocations";

export interface BudgetAllocation {
  id: number;
  amount: number;
}

export class Budget {
  private money: number = 0;
  private available: number = 0;

  allocations: AllocationManager<BudgetAllocation>;

  constructor() {
    this.allocations = new AllocationManager<BudgetAllocation>({
      validate: (allocation) => allocation.amount <= this.getAvailableMoney(),
      onChange: this.updateAvailableMoney,
    });
  }

  updateAvailableMoney = () => {
    this.available =
      this.money - sum(this.allocations.all().map((a) => a.amount));
  };

  getAvailableMoney = () => this.available;

  getAllMoney = () => this.money;

  changeMoney = (value: number) => {
    this.money += value;

    if (this.money < 0) {
      throw new NegativeBudget(this.money);
    }

    this.updateAvailableMoney();
  };

  set = (value: number) => {
    if (value < 0) {
      throw new NegativeBudget(value);
    }

    this.money = value;

    this.updateAvailableMoney();
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
