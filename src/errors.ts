export const notImplemented = new Error("Not implemented");

export class InsufficientStorage extends Error {
  wanted: number;
  actual: number;

  constructor(wanted: number, actual: number) {
    super(`Insufficient storage, wanted: ${wanted}, actual: ${actual}`);
    this.wanted = wanted;
    this.actual = actual;
  }
}

export class InsufficientMoney extends Error {
  wanted: number;
  actual: number;

  constructor(wanted: number, actual: number) {
    super(`Insufficient money, wanted: ${wanted}, actual: ${actual}`);
    this.wanted = wanted;
    this.actual = actual;
  }
}

export class NegativeQuantity extends Error {
  quantity: number;

  constructor(quantity: number) {
    super(`Negative quantity: ${quantity}`);
    this.quantity = quantity;
  }
}

export class NegativeBudget extends Error {
  quantity: number;

  constructor(quantity: number) {
    super(`Negative budget: ${quantity}`);
    this.quantity = quantity;
  }
}

export class NotFound extends Error {
  id: number;

  constructor(id: number) {
    super(`ID not found: ${id}`);
    this.id = id;
  }
}
