import { min, sum } from "mathjs";
import map from "lodash/map";
import toPairs from "lodash/toPairs";
import {
  InsufficientStorage,
  InsufficientStorageSpace,
  NegativeQuantity,
  NonIntegerQuantity,
} from "../errors";
import { perCommodity } from "../utils/perCommodity";
import {
  Allocation,
  Allocations,
  newAllocation,
  releaseAllocation,
} from "../components/utils/allocations";
import { Commodity } from "../economy/commodity";
import { BaseComponent } from "./component";

export type StorageAllocationType = "incoming" | "outgoing";

interface StorageAllocation extends Allocation {
  amount: Record<Commodity, number>;
  type: StorageAllocationType;
}

export interface CommodityStorage
  extends Allocations<StorageAllocation>,
    BaseComponent<"storage"> {
  stored: Record<Commodity, number>;
  availableWares: Record<Commodity, number>;

  max: number;
  quota: Record<Commodity, number>;
}

export function hasSufficientStorage(
  storage: CommodityStorage,
  commodity: Commodity,
  quantity: number
): boolean {
  return storage.availableWares[commodity] >= quantity;
}

export function updateAvailableWares(storage: CommodityStorage) {
  storage.availableWares = [
    ...toPairs(storage.stored)
      .map(([commodity, stored]) => ({
        commodity,
        stored,
      }))
      .flat(),
    ...storage.allocations
      .filter((allocation) => allocation.type === "outgoing")
      .map((allocation) =>
        toPairs(allocation.amount).map(([commodity, stored]) => ({
          commodity,
          stored: -stored,
        }))
      )
      .flat(),
  ].reduce(
    (acc, val) => ({
      ...acc,
      [val.commodity]: acc[val.commodity] + val.stored,
    }),
    perCommodity(() => 0)
  );
}

export function getAvailableSpace(storage: CommodityStorage) {
  return (
    storage.max -
    sum(map(storage.stored)) -
    sum(
      storage.allocations
        .filter((allocation) => allocation.type === "incoming")
        .map((allocation) => sum(map(allocation.amount)))
    )
  );
}

export function hasSufficientStorageSpace(
  storage: CommodityStorage,
  quantity: number
) {
  if (quantity < 0) {
    throw new NegativeQuantity(quantity);
  }

  return getAvailableSpace(storage) >= quantity;
}

export function onStorageChange(storage: CommodityStorage) {
  updateAvailableWares(storage);
}

export function validateStorageAllocation(
  storage: CommodityStorage,
  allocation: StorageAllocation
) {
  if (allocation.type === "incoming") {
    return sum(Object.values(allocation.amount)) <= getAvailableSpace(storage);
  }

  return Object.entries(allocation.amount)
    .map(
      ([commodity, quantity]) => storage.availableWares[commodity] >= quantity
    )
    .every(Boolean);
}

export function addStorage(
  storage: CommodityStorage,
  commodity: Commodity,
  quantity: number,
  exact = true
): number {
  if (quantity < 0) {
    throw new NegativeQuantity(quantity);
  }
  if (!Number.isInteger(quantity)) {
    throw new NonIntegerQuantity(quantity);
  }
  if (quantity === 0) {
    return 0;
  }

  const availableSpace = getAvailableSpace(storage);

  if (availableSpace >= quantity) {
    storage.stored[commodity] += quantity;
    updateAvailableWares(storage);
    return 0;
  }
  if (exact) {
    throw new InsufficientStorageSpace(quantity, availableSpace);
  }

  storage.stored[commodity] += availableSpace;
  updateAvailableWares(storage);

  return quantity - availableSpace;
}

export function removeStorage(
  storage: CommodityStorage,
  commodity: Commodity,
  quantity: number
) {
  if (quantity < 0) {
    throw new NegativeQuantity(quantity);
  }
  if (!Number.isInteger(quantity)) {
    throw new NonIntegerQuantity(quantity);
  }
  if (quantity === 0) {
    return;
  }
  if (!hasSufficientStorage(storage, commodity, quantity)) {
    throw new InsufficientStorage(quantity, storage.availableWares[commodity]);
  }

  storage.stored[commodity] -= quantity;
  updateAvailableWares(storage);
}

export function transfer(
  storage: CommodityStorage,
  commodity: Commodity,
  quantity: number,
  target: CommodityStorage,
  exact: boolean
): number {
  let quantityToTransfer = quantity;
  if (storage.availableWares[commodity] < quantity) {
    if (exact) {
      throw new InsufficientStorage(
        quantity,
        storage.availableWares[commodity]
      );
    }
  } else {
    quantityToTransfer = min(storage.availableWares[commodity], quantity);
  }

  const transferred =
    quantityToTransfer -
    addStorage(target, commodity, quantityToTransfer, exact);
  removeStorage(storage, commodity, transferred);

  return transferred;
}

export function newStorageAllocation(
  storage: CommodityStorage,
  input: Omit<StorageAllocation, "id" | "meta">,
  meta: object = {}
) {
  const allocation = newAllocation(storage, { ...input, meta }, (a) =>
    validateStorageAllocation(storage, a)
  );
  updateAvailableWares(storage);

  return allocation;
}

export function releaseStorageAllocation(
  storage: CommodityStorage,
  id: number
): StorageAllocation {
  const allocation = releaseAllocation(storage, id);
  updateAvailableWares(storage);

  return allocation;
}

export function createCommodityStorage(): CommodityStorage {
  const storage: CommodityStorage = {
    allocationIdCounter: 1,
    allocations: [],
    max: 0,
    availableWares: perCommodity(() => 0),
    stored: perCommodity(() => 0),
    quota: perCommodity(() => 0),
    name: "storage",
  };
  updateAvailableWares(storage);

  return storage;
}
