import { Order } from "../entities/ship";

export class AutoOrder {
  default: Order["type"];

  constructor(defaultOrder: Order["type"] = "hold") {
    this.default = defaultOrder;
  }
}
