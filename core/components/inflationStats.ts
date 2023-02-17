import type { BaseComponent } from "./component";

export interface InflationStats extends BaseComponent<"inflationStats"> {
  basketPrices: number[];
}
