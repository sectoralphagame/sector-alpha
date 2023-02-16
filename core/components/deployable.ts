import { BaseComponent } from "./component";

export type DeployableType = "facility" | "builder";

export interface Deployable extends BaseComponent<"deployable"> {
  active: boolean;
  type: DeployableType;
  cancel: boolean;
}
