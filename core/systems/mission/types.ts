import type { Mission } from "@core/components/missions";
import type { Sim } from "@core/sim";
import type { MissionOffer } from "@ui/components/MissionDialog";

export interface MissionHandler {
  isCompleted: (_mission: Mission, _sim: Sim) => boolean;
  isFailed: (_mission: Mission, _sim: Sim) => boolean;
  generate: (_sim: Sim) => MissionOffer | null;
  update: (_mission: Mission, _sim: Sim) => void;
  formatProgress: (_mission: Mission) => string;
}
