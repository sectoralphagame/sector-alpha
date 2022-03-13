import { sum } from "mathjs";
import map from "lodash/map";
import { InsufficientStorage } from "../errors";
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
    const availableSpace = this.max - sum(map(this.stored));

    if (availableSpace >= quantity) {
      this.stored[commodity] += quantity;
      return 0;
    }

    this.stored[commodity] = this.max;

    return quantity - availableSpace;
  };

  removeStorage = (commodity: Commodity, quantity: number) => {
    if (!this.hasSufficientStorage(commodity, quantity)) {
      throw new InsufficientStorage(quantity, this.stored[commodity]);
    }

    this.stored[commodity] -= quantity;
  };
}
