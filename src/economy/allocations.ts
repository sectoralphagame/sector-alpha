import { NotFound } from "../errors";

export interface Allocation {
  id: number;
}

export class AllocationManager<T extends Allocation> {
  private allocations: T[] = [];
  private allocationIdCounter: number = 0;

  new = (input: Omit<T, keyof Allocation>): T => {
    const allocation = {
      ...input,
      id: this.allocationIdCounter,
    } as T;
    this.allocations.push(allocation);
    this.allocationIdCounter += 1;

    return allocation;
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

    return allocation;
  };
}
