import { RequireComponent } from "../tsHelpers";

export class Modules {
  modules: Array<RequireComponent<"parent" | "name">> = [];
}
