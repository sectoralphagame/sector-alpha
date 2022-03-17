import { InsufficientMoney, NegativeBudget } from "../errors";

export class Budget {
  private money: number = 0;

  getAvailableMoney = () => this.money;

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
