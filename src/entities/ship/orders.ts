import { Matrix } from "mathjs";
import { Facility, TransactionInput } from "../../economy/factility";
import { Asteroid, Field } from "../../economy/field";
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

export interface MineOrder {
  type: "mine";
  target: Field;
  targetRock: Asteroid;
}

export type Order = MoveOrder | TradeOrder | MineOrder;

export function tradeOrder(order: Omit<TradeOrder, "type">): TradeOrder | null {
  if (order.offer.quantity <= 0) {
    throw new NegativeQuantity(order.offer.quantity);
  }

  return {
    ...order,
    type: "trade",
  };
}

export function mineOrder(order: Omit<MineOrder, "type">): MineOrder | null {
  return {
    ...order,
    type: "mine",
  };
}
