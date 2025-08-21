import type { RequirePureComponent } from "@core/tsHelpers";
import { PubSub } from "@core/utils/pubsub";

export type ShootEvent = {
  type: "shoot";
  entity: RequirePureComponent<"damage" | "transform">;
};

export type ExplodeEvent = {
  type: "explode";
  entity: RequirePureComponent<"position">;
};
export type StartMiningEvent = {
  type: "startMining";
  entity: RequirePureComponent<"position">;
};
export type StopMiningEvent = {
  type: "stopMining";
  entity: RequirePureComponent<"position">;
};
export type DeployFacilityEvent = {
  type: "deployFacility";
  entity: RequirePureComponent<"position">;
};

export type Event3D =
  | ShootEvent
  | ExplodeEvent
  | StartMiningEvent
  | StopMiningEvent
  | DeployFacilityEvent;

export const transport3D = new PubSub<Event3D>();
