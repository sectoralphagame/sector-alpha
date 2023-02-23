import { NotFound } from "../../errors";

export type AllocationMeta = Record<string, string>;

export interface Allocation {
  id: number;
  issued: number;
  meta: AllocationMeta;
}

export interface CreateAllocationManagerOpts<T> {
  // eslint-disable-next-line no-unused-vars
  validate: (allocation: T) => boolean;
  onChange: () => void;
}

export interface Allocations<T extends Allocation> {
  allocations: T[];
  allocationIdCounter: number;
}

export function newAllocation<T extends Allocation>(
  manager: Allocations<T>,
  input: Omit<T, "id">,
  // eslint-disable-next-line no-unused-vars
  validate: (allocation: T) => boolean
): T {
  const allocation = {
    ...input,
    id: manager.allocationIdCounter,
  } as T;
  if (validate(allocation)) {
    manager.allocations.push(allocation);
    manager.allocationIdCounter += 1;

    return allocation;
  }

  throw new Error("Allocation validation failed");
}

export function getAllocation<T extends Allocation>(
  manager: Allocations<T>,
  id: number
): T {
  const allocation = manager.allocations.find((a) => a.id === id);

  if (!allocation) {
    throw new NotFound(id);
  }

  return allocation;
}

export function releaseAllocation<T extends Allocation>(
  manager: Allocations<T>,
  id: number
): T {
  const allocation = getAllocation(manager, id);

  const index = manager.allocations.findIndex((a) => a.id === id);
  manager.allocations.splice(index, 1);

  return allocation;
}
