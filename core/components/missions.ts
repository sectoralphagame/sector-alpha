import type { MissionOffer } from "@ui/components/MissionDialog";
import type { BaseComponent } from "./component";

export type Reward = {
  type: string;
  [key: string]: any;
};

export interface MissionCommon {
  title: string;
  description: string;
  rewards: Reward[];
}
export type Mission = MissionCommon & {
  type: string;
  [key: string]: any;
};

export interface Missions extends BaseComponent<"missions"> {
  offer: MissionOffer | null;
  value: Mission[];
}
