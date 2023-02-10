import { BaseComponent } from "./component";

export type DeployableType = "facility";

export interface Deployable extends BaseComponent<"deployable"> {
  type: DeployableType;
}
