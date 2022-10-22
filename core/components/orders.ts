import { NegativeQuantity } from "../errors";
import { BaseComponent } from "./component";
import { TransactionInput } from "./trade";

export interface DockOrder {
  type: "dock";
  targetId: number;
}

export interface TeleportOrder {
  type: "teleport";
  targetId: number;
}

export interface MoveOrder {
  type: "move";
  targetId: number;
}

export interface TradeOrder {
  type: "trade";
  offer: TransactionInput;
  targetId: number;
}

export interface MineOrder {
  type: "mine";
  targetFieldId: number;
  targetRockId: number | null;
}

export interface HoldPositionOrder {
  type: "hold";
}

export type Order =
  | MoveOrder
  | TradeOrder
  | MineOrder
  | HoldPositionOrder
  | TeleportOrder
  | DockOrder;
export interface BaseOrderGroup {
  origin: "auto" | "manual";
  orders: Order[];
}

export interface FollowOrderGroup extends BaseOrderGroup {
  type: "follow";
  targetId: number;
  /** Used to prevent endless path recalculations */
  ordersForSector: number;
}

export type OrderGroup =
  | ({
      type: "mine" | "trade" | "hold" | "move" | "dock";
    } & BaseOrderGroup)
  | FollowOrderGroup;

export function tradeOrder(order: Omit<TradeOrder, "type">): TradeOrder {
  if (order.offer.quantity <= 0) {
    throw new NegativeQuantity(order.offer.quantity);
  }

  return {
    ...order,
    type: "trade",
  };
}

export function mineOrder(order: Omit<MineOrder, "type">): MineOrder {
  return {
    ...order,
    type: "mine",
  };
}

export interface Orders extends BaseComponent<"orders"> {
  value: OrderGroup[];
}
