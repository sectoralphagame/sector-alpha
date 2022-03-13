import { Matrix } from "mathjs";
import { Facility, TransactionInput } from "../../economy/factility";

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
