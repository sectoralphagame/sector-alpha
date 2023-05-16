import type { BaseComponent } from "./component";
import type {
  BaseOrder,
  EscortOrder,
  HoldOrder,
  MineOrder,
  PatrolOrder,
  PillageOrder,
  TradeOrder,
} from "./orders";

export interface AutoOrder extends BaseComponent<"autoOrder"> {
  default:
    | Omit<MineOrder, keyof BaseOrder>
    | Omit<TradeOrder, keyof BaseOrder>
    | Omit<HoldOrder, keyof BaseOrder>
    | Omit<PatrolOrder, keyof BaseOrder>
    | Omit<PillageOrder, keyof BaseOrder>
    | Omit<EscortOrder, keyof BaseOrder | "ordersForSector">;
}
