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
import { AllocationManager } from "../components/utils/allocations";
import { Commodity } from "../economy/commodity";
import { sim } from "../sim";

export type StorageAllocationType = "incoming" | "outgoing";

interface StorageAllocation {
  id: number;
  amount: Record<Commodity, number>;
  type: StorageAllocationType;
}

interface CommodityStorageHistoryEntry {
  commodity: Commodity;
  quantity: number;
  time: number;
}

export class CommodityStorage {
  private stored: Record<Commodity, number>;
  private availableWares: Record<Commodity, number>;

  allocationManager: AllocationManager<StorageAllocation>;

  max: number;
  quota: Record<Commodity, number>;
  history: CommodityStorageHistoryEntry[] = [];

  changeHandler: () => void;

  constructor(onChange = () => undefined) {
    this.max = 0;
    this.stored = perCommodity(() => 0);
    this.quota = perCommodity(() => 0);
    this.allocationManager = new AllocationManager<StorageAllocation>({
      validate: (allocation) => {
        if (allocation.type === "incoming") {
          return (
            sum(Object.values(allocation.amount)) <= this.getAvailableSpace()
          );
        }

        return Object.entries(allocation.amount)
          .map(
            ([commodity, quantity]) =>
              this.getAvailableWares()[commodity] >= quantity
          )
          .every(Boolean);
      },
      onChange: () => {
        this.changeHandler();
        this.updateAvailableWares();
      },
    });
    this.changeHandler = onChange;
    this.updateAvailableWares();
  }

  onChange = (entry: Omit<CommodityStorageHistoryEntry, "time">) => {
    this.addHitoryEntry({ ...entry, time: sim ? sim.getTime() : 0 });
    this.updateAvailableWares();
    this.changeHandler();
  };

  addHitoryEntry = (entry: CommodityStorageHistoryEntry) => {
    this.history.unshift(entry);
    if (this.history.length > 50) {
      this.history.pop();
    }
  };

  getAvailableSpace = () =>
    this.max -
    sum(map(this.stored)) -
    sum(
      this.allocationManager
        .all()
        .filter((allocation) => allocation.type === "incoming")
        .map((allocation) => sum(map(allocation.amount)))
    );

  updateAvailableWares = () => {
    this.availableWares = [
      ...toPairs(this.stored)
        .map(([commodity, stored]) => ({
          commodity,
          stored,
        }))
        .flat(),
      ...this.allocationManager
        .all()
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
  };

  updateQuota = (quota: Record<Commodity, number>) => {
    this.quota = quota;
    this.changeHandler();
  };

  getAvailableWares = () => this.availableWares;

  hasSufficientStorageSpace = (quantity: number) => {
    if (quantity < 0) {
      throw new NegativeQuantity(quantity);
    }

    return this.getAvailableSpace() >= quantity;
  };

  hasSufficientStorage = (commodity: Commodity, quantity: number): boolean =>
    this.getAvailableWares()[commodity] >= quantity;

  addStorage = (
    commodity: Commodity,
    quantity: number,
    exact = true
  ): number => {
    if (quantity < 0) {
      throw new NegativeQuantity(quantity);
    }
    if (!Number.isInteger(quantity)) {
      throw new NonIntegerQuantity(quantity);
    }
    if (quantity === 0) {
      return 0;
    }

    const availableSpace = this.getAvailableSpace();

    if (availableSpace >= quantity) {
      this.stored[commodity] += quantity;
      this.onChange({ commodity, quantity });
      return 0;
    }
    if (exact) {
      throw new InsufficientStorageSpace(quantity, availableSpace);
    }

    this.stored[commodity] += availableSpace;
    this.onChange({ commodity, quantity: availableSpace });

    return quantity - availableSpace;
  };

  removeStorage = (commodity: Commodity, quantity: number) => {
    if (quantity < 0) {
      throw new NegativeQuantity(quantity);
    }
    if (!Number.isInteger(quantity)) {
      throw new NonIntegerQuantity(quantity);
    }
    if (quantity === 0) {
      return;
    }
    if (!this.hasSufficientStorage(commodity, quantity)) {
      throw new InsufficientStorage(
        quantity,
        this.getAvailableWares()[commodity]
      );
    }

    this.stored[commodity] -= quantity;
    this.onChange({ commodity, quantity: -quantity });
  };

  transfer = (
    commodity: Commodity,
    quantity: number,
    target: CommodityStorage,
    exact: boolean
  ): number => {
    let quantityToTransfer = quantity;
    const available = this.getAvailableWares();
    if (available[commodity] < quantity) {
      if (exact) {
        throw new InsufficientStorage(quantity, available[commodity]);
      }
    } else {
      quantityToTransfer = min(available[commodity], quantity);
    }

    const transferred =
      quantityToTransfer -
      target.addStorage(commodity, quantityToTransfer, exact);
    this.removeStorage(commodity, transferred);

    return transferred;
  };
}
