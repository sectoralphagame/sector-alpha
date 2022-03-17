import { sum } from "mathjs";
import map from "lodash/map";
import { InsufficientStorage, NegativeQuantity } from "../errors";
import { perCommodity } from "../utils/perCommodity";
import { Commodity } from "./commodity";

export class CommodityStorage {
  max: number;
  stored: Record<Commodity, number>;

  constructor() {
    this.max = 0;
    this.stored = perCommodity(() => 0);
  }

  hasSufficientStorage = (commodity: Commodity, quantity: number): boolean =>
    this.stored[commodity] >= quantity;

  addStorage = (commodity: Commodity, quantity: number): number => {
    if (quantity < 0) {
      throw new NegativeQuantity(quantity);
    }
    const availableSpace = this.max - sum(map(this.stored));

    if (availableSpace >= quantity) {
      this.stored[commodity] += quantity;
      return 0;
    }

    this.stored[commodity] += availableSpace;

    return quantity - availableSpace;
  };

  removeStorage = (commodity: Commodity, quantity: number) => {
    if (quantity < 0) {
      throw new NegativeQuantity(quantity);
    }
    if (!this.hasSufficientStorage(commodity, quantity)) {
      throw new InsufficientStorage(quantity, this.stored[commodity]);
    }

    this.stored[commodity] -= quantity;
  };

  transfer = (
    commodity: Commodity,
    quantity: number,
    target: CommodityStorage,
    exact: boolean
  ): number => {
    let quantityToTransfer = quantity;
    if (exact && this.stored[commodity] < quantity) {
      throw new InsufficientStorage(quantity, this.stored[commodity]);
    } else {
      quantityToTransfer = this.stored[commodity];
    }

    const transferred =
      quantityToTransfer - target.addStorage(commodity, quantityToTransfer);
    this.removeStorage(commodity, transferred);

    return transferred;
  };
}
