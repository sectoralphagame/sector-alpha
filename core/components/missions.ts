import type { MissionConversation } from "@core/systems/mission/types";
import type { BaseComponent } from "./component";

export type Reward = {
  type: string;
  [key: string]: any;
};

export interface MissionCommon {
  /**
   * Time at which the mission was accepted
   */
  accepted: number;
  title: string;
  description: string;
  rewards: Reward[];
  /**
   * Ids and names of the entities that are referenced by this mission
   */
  references: Array<{ id: number; name: string }>;
  progress: {
    current: number;
    max: number;
    label?: string;
  };
  cancellable: boolean;
}
export type Mission = MissionCommon & {
  type: string;
  [key: string]: any;
};

export interface MissionOffer {
  conversation: MissionConversation;
  rewards: Reward[];
  type: string;
}

export interface Missions extends BaseComponent<"missions"> {
  /**
   * Time at which the last mission was declined
   */
  declined: number;
  offer: MissionOffer | null;
  value: Mission[];
}
