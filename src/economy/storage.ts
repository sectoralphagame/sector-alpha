import { min, sum } from "mathjs";
import map from "lodash/map";
import each from "lodash/each";
import {
  InsufficientStorage,
  InsufficientStorageSpace,
  NegativeQuantity,
} from "../errors";
import { perCommodity } from "../utils/perCommodity";
import { Commodity } from "./commodity";
import { AllocationManager } from "./allocations";

interface StorageAllocation {
  id: number;
  amount: Record<Commodity, number>;
  target: CommodityStorage;
}

interface CommodityStorageHistoryEntry {
  commodity: Commodity;
  quantity: number;
}

export class CommodityStorage {
  private stored: Record<Commodity, number>;

  allocationManager: AllocationManager<StorageAllocation>;

  max: number;
  history: CommodityStorageHistoryEntry[] = [];

  // eslint-disable-next-line no-unused-vars
  changeHandler: (entry: CommodityStorageHistoryEntry) => void;

  constructor(onChange = () => undefined) {
    this.max = 0;
    this.stored = perCommodity(() => 0);
    this.allocationManager = new AllocationManager<StorageAllocation>();
    this.changeHandler = onChange;
  }

  onChange = (entry: CommodityStorageHistoryEntry) => {
    this.addHitoryEntry(entry);
    this.changeHandler(entry);
  };

  addHitoryEntry = (entry: CommodityStorageHistoryEntry) => {
    this.history.unshift(entry);
    if (this.history.length > 50) {
      this.history.pop();
    }
  };

  getAvailableSpace = () => this.max - sum(map(this.stored));

  getAvailableWares = () => this.stored;

  hasSufficientStorageSpace = (quantity: number) => {
    if (quantity < 0) {
      throw new NegativeQuantity(quantity);
    }

    return this.getAvailableSpace() >= quantity;
  };

  hasSufficientStorage = (commodity: Commodity, quantity: number): boolean =>
    this.stored[commodity] >= quantity;

  addStorage = (
    commodity: Commodity,
    quantity: number,
    exact = true
  ): number => {
    if (quantity < 0) {
      throw new NegativeQuantity(quantity);
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
    if (quantity === 0) {
      return;
    }
    if (!this.hasSufficientStorage(commodity, quantity)) {
      throw new InsufficientStorage(quantity, this.stored[commodity]);
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
    if (this.stored[commodity] < quantity) {
      if (exact) {
        throw new InsufficientStorage(quantity, this.stored[commodity]);
      }
    } else {
      quantityToTransfer = min(this.stored[commodity], quantity);
    }

    const transferred =
      quantityToTransfer -
      target.addStorage(commodity, quantityToTransfer, exact);
    this.removeStorage(commodity, transferred);

    return transferred;
  };
}
