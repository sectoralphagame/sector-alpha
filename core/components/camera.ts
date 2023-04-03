import type { BaseComponent } from "./component";

export interface Camera extends BaseComponent<"camera"> {
  zoom: number;
  position: [number, number];
}
