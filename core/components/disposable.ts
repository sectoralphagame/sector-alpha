import type { BaseComponent } from "./component";

export interface Disposable extends BaseComponent<"disposable"> {
  owner: number;
}
