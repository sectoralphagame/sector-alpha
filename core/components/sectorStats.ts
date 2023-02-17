import type { Commodity, MineableCommodity } from "../economy/commodity";
import type { BaseComponent } from "./component";

export type SectorPriceStats = Record<
  Commodity,
  Record<"buy" | "sell", number[]>
>;

export interface SectorStats extends BaseComponent<"sectorStats"> {
  availableResources: Record<MineableCommodity, number[]>;
  prices: SectorPriceStats;
}
