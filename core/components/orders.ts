import { NegativeQuantity } from "../errors";
import type { BaseComponent } from "./component";
import type { TransactionInput } from "./trade";

export interface AttackAction {
  type: "attack";
  targetId: number;
}

export interface DockAction {
  type: "dock";
  targetId: number;
}

export interface UndockAction {
  type: "undock";
}

export interface TeleportAction {
  type: "teleport";
  targetId: number;
}

export interface MoveAction {
  type: "move";
  targetId: number;
  onlyManeuver?: boolean;
  ignoreReached?: boolean;
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

export interface CollectAction {
  type: "collect";
  targetId: number;
}

export type Action =
  | AttackAction
  | MoveAction
  | TradeAction
  | MineAction
  | HoldPositionAction
  | TeleportAction
  | DockAction
  | UndockAction
  | FacilityDeployAction
  | BuilderDeployAction
  | CollectAction;
export interface BaseOrder {
  origin: string;
  actions: Action[];
  interrupt?: boolean;
}

export interface HoldOrder extends BaseOrder {
  type: "hold";
}

export interface AttackOrder extends BaseOrder {
  type: "attack";
  targetId: number;
  /** Used to prevent endless path recalculations */
  ordersForSector: number;
  followOutsideSector: boolean;
  maxDistance?: number;
}

export interface FollowOrder extends BaseOrder {
  type: "follow";
  targetId: number;
  /** Used to prevent endless path recalculations */
  ordersForSector: number;
}

export interface PatrolOrder extends BaseOrder {
  type: "patrol";
  sectorId: number;
  clockwise: boolean;
}

export interface PillageOrder extends BaseOrder {
  type: "pillage";
  sectorId: number;
  clockwise: boolean;
}

export interface EscortOrder extends BaseOrder {
  type: "escort";
  targetId: number;
  /** Used to prevent endless path recalculations */
  ordersForSector: number;
}

export interface MineOrder extends BaseOrder {
  type: "mine";
  sectorId?: number;
}

export interface TradeOrder extends BaseOrder {
  type: "trade";
  sectorId?: number;
}

export type Order =
  | ({
      type:
        | "hold"
        | "move"
        | "dock"
        | "deployFacility"
        | "deployBuilder"
        | "collect";
    } & BaseOrder)
  | AttackOrder
  | FollowOrder
  | PatrolOrder
  | PillageOrder
  | EscortOrder
  | MineOrder
  | TradeOrder;

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
