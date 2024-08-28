import type { BaseComponent } from "./component";

export interface Policies extends BaseComponent<"policies"> {
  enemySpotted: Record<"civilian" | "military", "attack" | "ignore">;
}
