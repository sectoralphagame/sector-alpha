import { Order } from "./orders";

export class AutoOrder {
  default: Order["type"];

  constructor(defaultOrder: Order["type"] = "hold") {
    this.default = defaultOrder;
  }
}
