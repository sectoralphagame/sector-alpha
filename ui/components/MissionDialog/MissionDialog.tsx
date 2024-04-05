import { useGameDialog, useSim } from "@ui/atoms";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import React from "react";
import { MissionSystem } from "@core/systems/mission";
import type { ModalProps } from "../ConfigDialog";
import { ConversationDialog } from "../ConversationDialog";

export interface MissionDialogProps {
  type: "missionOffer";
}

export const MissionDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();
  const [settings] = useGameSettings();

  React.useEffect(() => {
    if (dialog?.type === "missionOffer" && settings.pauseOnMissionOffer) {
      sim.pause();
    }
  }, [dialog]);

  if (dialog?.type !== "missionOffer") return null;

  return (
    <ConversationDialog
      conversation={
        sim.queries.player.get()[0]!.cp.missions.offer!.conversation
      }
      open={open}
      onEnd={(flags) => {
        if (flags.status === "accepted") {
          const player = sim.queries.player.get()[0]!;
          const missionSystem = sim.systems.find(
            (s) => s instanceof MissionSystem
          ) as MissionSystem;
          player.cp.missions.value.push({
            ...missionSystem.handlers.mission[
              player.cp.missions.offer!.type
            ].accept(sim, player.cp.missions.offer!),
            accepted: sim.getTime(),
          });
        } else {
          sim.queries.player.get()[0]!.cp.missions.declined = sim.getTime();
        }
      }}
      onClose={() => {
        onClose();
        sim.queries.player.get()[0]!.cp.missions.offer = null;
        if (settings.pauseOnMissionOffer) {
          sim.unpause();
        }
      }}
    />
  );
};
MissionDialog.displayName = "MissionDialog";
