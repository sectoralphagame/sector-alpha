import { BaseComponent } from "./component";

export type AiType = "territorial" | "travelling";

export interface Ai extends BaseComponent<"ai"> {
  type: AiType;
  stockpiling: number;
  priceModifier: number;
}
