import type { BaseComponent } from "./component";

export interface DestroyAfterUsage extends BaseComponent<"destroyAfterUsage"> {
  owner: number;
}
