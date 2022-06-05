import { Asteroid } from "../archetypes/asteroid";
import { AsteroidField } from "../archetypes/asteroidField";
import { Marker } from "../archetypes/marker";
import { WithTrade } from "../economy/utils";
import { NegativeQuantity } from "../errors";
import { WithDock } from "./dockable";
import { TransactionInput } from "./trade";

export type OrderGroupType = "mine" | "trade" | "hold" | "move" | "dock";

export interface DockOrder {
  type: "dock";
  target: WithDock;
}

export interface TeleportOrder {
  type: "teleport";
  position: Marker;
}

export interface MoveOrder {
  type: "move";
  position: Marker;
}

export interface TradeOrder {
  type: "trade";
  offer: TransactionInput;
  target: WithTrade;
}

export interface MineOrder {
  type: "mine";
  target: AsteroidField;
  targetRock: Asteroid;
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
export interface OrderGroup {
  type: OrderGroupType;
  orders: Order[];
}

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

export class Orders {
  value: OrderGroup[] = [];
}
