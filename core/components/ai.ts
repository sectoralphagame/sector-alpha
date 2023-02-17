import type { BaseComponent } from "./component";

export type AiType = "territorial" | "travelling";

export interface Ai extends BaseComponent<"ai"> {
  type: AiType;
  /**
   * When above 1 AI needs to have 1-stockpiling percent margin before
   * satisfied, whereas lower than 1 allows resources to be allocated without
   * strictly meeting requirements.
   *
   * With stockpiling = 1.2 AI cannot build module that consumes 20
   * food per minute if has a balance of food production 21 per minute. Its
   * minimum requiremenent would be to produce at least 24 food per minute.
   */
  stockpiling: number;
  priceModifier: number;
}
