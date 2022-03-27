import { sum } from "mathjs";
import {
  InsufficientMoney,
  NegativeBudget,
  NonPositiveAmount,
  NotFound,
} from "../errors";

interface Allocation {
  id: number;
  amount: number;
}

export class Budget {
  private money: number = 0;
  allocations: Allocation[] = [];
  allocationIdCounter: number = 0;

  getAvailableMoney = () =>
    this.money - sum(this.allocations.map((a) => a.amount));

  allocate = (amount: number): number => {
    if (amount <= 0) {
      throw new NonPositiveAmount(amount);
    }

    const allocation = {
      amount,
      id: this.allocationIdCounter,
    };
    this.allocations.push(allocation);
    this.allocationIdCounter += 1;

    return allocation.id;
  };

  getAllocation = (id: number) => {
    const allocation = this.allocations.find((a) => a.id === id);

    if (!allocation) {
      throw new NotFound(id);
    }

    return allocation;
  };

  release = (id: number) => {
    this.getAllocation(id);
    this.allocations = this.allocations.filter((a) => a.id !== id);
  };

  fulfill = (id: number, target: Budget) => {
    const allocation = this.getAllocation(id);

    this.transferMoney(allocation.amount, target);
    this.allocations = this.allocations.filter((a) => a.id !== id);
  };

  changeMoney = (value: number) => {
    this.money += value;

    if (this.money < 0) {
      throw new NegativeBudget(this.money);
    }
  };

  transferMoney = (value: number, target: Budget) => {
    if (this.money < value) {
      throw new InsufficientMoney(value, this.money);
    }

    this.changeMoney(-value);
    target.changeMoney(value);
  };
}
