import type { Mission, MissionOffer } from "@core/components/missions";
import type { Sim } from "@core/sim";

export interface MissionHandler {
  isCompleted: (_mission: Mission, _sim: Sim) => boolean;
  isFailed: (_mission: Mission, _sim: Sim) => boolean;
  generate: (_sim: Sim) => MissionOffer | null;
  accept: (_sim: Sim, _mission: MissionOffer) => Mission;
  update: (_mission: Mission, _sim: Sim) => void;
  formatProgress: (_mission: Mission) => string;
}

export interface ConversationLine {
  text: string;
  next?: string[];
  set?: Record<string, string>;
}

export interface MissionConversation {
  Start: string;
  Actors: Record<
    string,
    {
      name?: string;
      lines: Record<string, ConversationLine>;
    }
  >;
}
