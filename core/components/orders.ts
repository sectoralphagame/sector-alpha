import { NegativeQuantity } from "../errors";
import type { BaseComponent } from "./component";
import type { TransactionInput } from "./trade";

export interface DockAction {
  type: "dock";
  targetId: number;
}

export interface TeleportAction {
  type: "teleport";
  targetId: number;
}

export interface MoveAction {
  type: "move";
  targetId: number;
  onlyManeuver?: boolean;
}

export interface TradeAction {
  type: "trade";
  offer: TransactionInput;
  targetId: number;
}

export interface MineAction {
  type: "mine";
  targetFieldId: number;
  targetRockId: number | null;
}

export interface HoldPositionAction {
  type: "hold";
}

export interface FacilityDeployAction {
  type: "deployFacility";
}

export interface BuilderDeployAction {
  type: "deployBuilder";
  targetId: number;
}

export type Action =
  | MoveAction
  | TradeAction
  | MineAction
  | HoldPositionAction
  | TeleportAction
  | DockAction
  | FacilityDeployAction
  | BuilderDeployAction;
export interface BaseOrder {
  origin: "auto" | "manual";
  actions: Action[];
}

export interface AttackOrder extends BaseOrder {
  type: "attack";
  targetId: number;
  /** Used to prevent endless path recalculations */
  ordersForSector: number;
}

export interface FollowOrder extends BaseOrder {
  type: "follow";
  targetId: number;
  /** Used to prevent endless path recalculations */
  ordersForSector: number;
}

export type Order =
  | ({
      type:
        | "mine"
        | "trade"
        | "hold"
        | "move"
        | "dock"
        | "deployFacility"
        | "deployBuilder";
    } & BaseOrder)
  | AttackOrder
  | FollowOrder;

export function tradeAction(action: Omit<TradeAction, "type">): TradeAction {
  if (action.offer.quantity <= 0) {
    throw new NegativeQuantity(action.offer.quantity);
  }

  return {
    ...action,
    type: "trade",
  };
}

export function mineAction(action: Omit<MineAction, "type">): MineAction {
  return {
    ...action,
    type: "mine",
  };
}

export interface Orders extends BaseComponent<"orders"> {
  value: Order[];
}
