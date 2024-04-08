import { useGameDialog, useSim } from "@ui/atoms";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import React from "react";
import type { MissionConversation } from "@core/systems/mission/types";
import type { ModalProps } from "./ConfigDialog";
import { ConversationDialog } from "./ConversationDialog";

export interface ImmediateConversationDialogProps {
  conversation: MissionConversation;
  type: "conversation";
}

export const ImmediateConversationDialog: React.FC<ModalProps> = ({
  open,
  onClose,
}) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();
  const [settings] = useGameSettings();

  React.useEffect(() => {
    if (dialog?.type === "conversation" && settings.pauseOnMissionOffer) {
      sim.pause();
    }
  }, [dialog]);

  if (dialog?.type !== "conversation") return null;

  return (
    <ConversationDialog
      conversation={dialog.conversation}
      open={open}
      onEnd={(flags) => {
        if (Object.keys(flags).length > 0) {
          console.warn("Immediate conversation ended with flags", flags);
        }
      }}
      onClose={() => {
        onClose();
        if (settings.pauseOnMissionOffer) {
          sim.unpause();
        }
      }}
    />
  );
};
ImmediateConversationDialog.displayName = "ImmediateConversationDialog";
