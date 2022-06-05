import { changeBudgetMoney, createBudget, transferMoney } from "./budget";

describe("Budget", () => {
  it("properly adds money", () => {
    const budget = createBudget();

    changeBudgetMoney(budget, 1);

    expect(budget.available).toBe(1);
  });

  it("cannot be negative", () => {
    const budget = createBudget();

    expect(() => changeBudgetMoney(budget, -1)).toThrow();
  });

  it("properly transfers money", () => {
    const budgetA = createBudget();
    changeBudgetMoney(budgetA, 100);
    const budgetB = createBudget();

    transferMoney(budgetA, 10, budgetB);

    expect(budgetA.available).toBe(90);
    expect(budgetB.available).toBe(10);
  });

  it("cannot transfer more money than available", () => {
    const budgetA = createBudget();
    changeBudgetMoney(budgetA, 100);
    const budgetB = createBudget();

    expect(() => transferMoney(budgetA, 1000, budgetB)).toThrow();
  });
});
