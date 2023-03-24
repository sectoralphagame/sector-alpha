import { min, sum } from "mathjs";
import map from "lodash/map";
import toPairs from "lodash/toPairs";
import { filter, pipe, map as fxtsMap, sum as fxtsSum } from "@fxts/core";
import {
  InsufficientStorage,
  InsufficientStorageSpace,
  NegativeQuantity,
  NonIntegerQuantity,
} from "../errors";
import { perCommodity } from "../utils/perCommodity";
import type {
  Allocation,
  AllocationMeta,
  Allocations,
} from "../components/utils/allocations";
import {
  newAllocation,
  releaseAllocation,
} from "../components/utils/allocations";
import type { Commodity } from "../economy/commodity";
import { commoditiesArray } from "../economy/commodity";
import type { BaseComponent } from "./component";

export type StorageAllocationType = "incoming" | "outgoing";

export interface StorageAllocation extends Allocation {
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
  const outgoingAllocations = storage.allocations.filter(
    (a) => a.type === "outgoing"
  );

  commoditiesArray.forEach((commodity) => {
    storage.availableWares[commodity] = Math.max(
      0,
      storage.stored[commodity] -
        (pipe(
          outgoingAllocations,
          fxtsMap((a) => a.amount[commodity]),
          fxtsSum
        ) || 0)
    );
  });
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

export function validateStorageAllocation(
  storage: CommodityStorage,
  allocation: StorageAllocation
) {
  if (allocation.type === "incoming") {
    return (
      sum(Object.values(allocation.amount)) <=
      getAvailableSpace(storage) +
        sum(
          storage.allocations
            .filter((a) => a.type === "outgoing")
            .map((a) => sum(Object.values(a.amount)))
        )
    );
  }

  const result = Object.entries(allocation.amount)
    .map(
      ([commodity, quantity]) =>
        storage.availableWares[commodity] +
          sum(
            storage.allocations
              .filter((a) => a.type === "incoming")
              .map((a) => a.amount[commodity])
          ) >=
        quantity
    )
    .every(Boolean);

  return result;
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
  meta: AllocationMeta = {}
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

export function createCommodityStorage(max?: number): CommodityStorage {
  const storage: CommodityStorage = {
    allocationIdCounter: 1,
    allocations: [],
    max: max ?? 0,
    availableWares: perCommodity(() => 0),
    stored: perCommodity(() => 0),
    quota: perCommodity(() => 0),
    name: "storage",
  };
  updateAvailableWares(storage);

  return storage;
}

export interface SimpleCommodityStorage
  extends BaseComponent<"simpleCommodityStorage"> {
  commodity: Commodity;
  stored: number;
}
