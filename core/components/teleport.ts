import type { RequireComponent } from "../tsHelpers";
import type { BaseComponent } from "./component";

export type WithTeleport = RequireComponent<"teleport">;

export interface Teleport extends BaseComponent<"teleport"> {
  destinationId: number | null;
}

export function linkTeleportModules(a: WithTeleport, b: WithTeleport) {
  a.cp.teleport.destinationId = b.id;
  b.cp.teleport.destinationId = a.id;
}
