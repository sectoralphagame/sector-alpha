import type { MissionOffer } from "@ui/components/MissionDialog";
import type { BaseComponent } from "./component";

type Mission = void;

export interface Missions extends BaseComponent<"missions"> {
  offer: MissionOffer | null;
  value: Mission[];
}
