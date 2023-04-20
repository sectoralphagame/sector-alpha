import type { MissionOffer } from "@ui/components/MissionDialog";
import type { BaseComponent } from "./component";

export type Reward = {
  type: string;
  [key: string]: any;
};

export type Mission = {
  type: string;
  rewards: Reward[];
  [key: string]: any;
};

export interface Missions extends BaseComponent<"missions"> {
  offer: MissionOffer | null;
  value: Mission[];
}
