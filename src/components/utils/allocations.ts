import { NotFound } from "../../errors";

export interface Allocation {
  id: number;
}

export interface CreateAllocationManagerOpts<T> {
  // eslint-disable-next-line no-unused-vars
  validate: (allocation: T) => boolean;
  onChange: () => void;
}

export class AllocationManager<T extends Allocation> {
  private allocations: T[] = [];
  private allocationIdCounter: number = 1;
  // eslint-disable-next-line no-unused-vars
  private validate: (allocation: T) => boolean;
  private onChange: () => void;

  constructor({ validate, onChange }: CreateAllocationManagerOpts<T>) {
    this.validate = validate;
    this.onChange = onChange;
  }

  new = (input: Omit<T, keyof Allocation>): T => {
    const allocation = {
      ...input,
      id: this.allocationIdCounter,
    } as T;
    if (this.validate(allocation)) {
      this.allocations.push(allocation);
      this.allocationIdCounter += 1;
      this.onChange();

      return allocation;
    }

    throw new Error("Allocation validation failed");
  };

  get = (id: number): T => {
    const allocation = this.allocations.find((a) => a.id === id);

    if (!allocation) {
      throw new NotFound(id);
    }

    return allocation;
  };

  all = () => this.allocations;

  release = (id: number): T => {
    const allocation = this.get(id);

    this.allocations = this.allocations.filter((a) => a.id !== id);
    this.onChange();

    return allocation;
  };
}
