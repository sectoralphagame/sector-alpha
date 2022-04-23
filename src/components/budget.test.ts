import { Budget } from "./budget";

describe("Budget", () => {
  it("properly adds money", () => {
    const budget = new Budget();

    budget.changeMoney(1);

    expect(budget.getAvailableMoney()).toBe(1);
  });

  it("cannot be negative", () => {
    const budget = new Budget();

    expect(() => budget.changeMoney(-1)).toThrow();
  });

  it("properly transfers money", () => {
    const budgetA = new Budget();
    budgetA.changeMoney(100);
    const budgetB = new Budget();

    budgetA.transferMoney(10, budgetB);

    expect(budgetA.getAvailableMoney()).toBe(90);
    expect(budgetB.getAvailableMoney()).toBe(10);
  });

  it("cannot transfer more money than available", () => {
    const budgetA = new Budget();
    budgetA.changeMoney(100);
    const budgetB = new Budget();

    expect(() => budgetA.transferMoney(1000, budgetB)).toThrow();
  });
});
