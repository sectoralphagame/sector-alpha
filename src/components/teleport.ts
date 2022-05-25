import { RequireComponent } from "../tsHelpers";
import { BaseComponent } from "./component";
import { EntityId, setEntity } from "./utils/entityId";

export type WithTeleport = RequireComponent<"teleport">;

export interface Teleport
  extends BaseComponent<"teleport">,
    EntityId<WithTeleport> {}

export function linkTeleportModules(a: WithTeleport, b: WithTeleport) {
  setEntity(a.cp.teleport, b);
  setEntity(b.cp.teleport, a);
}
