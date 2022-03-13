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
    super(`Insufficient storage, wanted: ${wanted}, actual: ${actual}`);
    this.wanted = wanted;
    this.actual = actual;
  }
}
