import { Matrix } from "mathjs";
import { Facility, TransactionInput } from "../../economy/factility";
import { NegativeQuantity } from "../../errors";

export interface MoveOrder {
  type: "move";
  position: Matrix;
}

export interface TradeOrder {
  type: "trade";
  offer: TransactionInput;
  target: Facility;
}

export type Order = MoveOrder | TradeOrder;

export function tradeOrder(order: Omit<TradeOrder, "type">): TradeOrder | null {
  if (order.offer.quantity <= 0) {
    throw new NegativeQuantity(order.offer.quantity);
  }

  return {
    ...order,
    type: "trade",
  };
}
