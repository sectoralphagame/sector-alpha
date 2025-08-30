import type { RequireComponent } from "@core/tsHelpers";
import { PubSub } from "@core/utils/pubsub";

export type ShootEvent = {
  type: "shoot";
  entity: RequireComponent<"damage" | "transform">;
};

export type ExplodeEvent = {
  type: "explode";
  entity: RequireComponent<"position">;
};
export type StartMiningEvent = {
  type: "startMining";
  entity: RequireComponent<"position">;
};
export type StopMiningEvent = {
  type: "stopMining";
  entity: RequireComponent<"position">;
};
export type DeployFacilityEvent = {
  type: "deployFacility";
  entity: RequireComponent<"position">;
};

export type Event3D =
  | ShootEvent
  | ExplodeEvent
  | StartMiningEvent
  | StopMiningEvent
  | DeployFacilityEvent;

export const transport3D = new PubSub<Event3D>();
