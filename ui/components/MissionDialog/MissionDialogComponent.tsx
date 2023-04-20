import type { Mission } from "@core/components/missions";
import { Button } from "@kit/Button";
import type { DialogProps } from "@kit/Dialog";
import { Dialog } from "@kit/Dialog";
import { DialogActions } from "@kit/DialogActions";
import React from "react";
import styles from "./MissionDialog.scss";

interface PlayerResponse {
  actor: "player";
  text: string;
  next: string;
  type: "accept" | "decline" | "neutral";
}

interface NPCResponse {
  actor: "npc";
  name: string;
  text: string;
}

interface WorldResponse {
  actor: "world";
  text: string;
}

export interface MissionOffer {
  actorName: string;
  title: string;
  prompt: string;
  responses: PlayerResponse[];
  data: Mission;
}

export interface MissionDialogComponentProps extends DialogProps {
  mission: MissionOffer;
  onAccept: () => void;
  onDecline: () => void;
}

export const MissionDialogComponent: React.FC<MissionDialogComponentProps> = ({
  mission,
  onAccept,
  onDecline,
  ...dialogProps
}) => {
  const [log, setLog] = React.useState<
    Array<PlayerResponse | NPCResponse | WorldResponse>
  >([
    {
      actor: "npc",
      name: mission.actorName,
      text: mission.prompt,
    },
  ]);
  const [responses, setResponses] = React.useState<PlayerResponse[]>([]);
  const availableResponses =
    responses.length > 0 && responses.at(-1)?.type !== "neutral"
      ? []
      : mission.responses.filter((r) => !responses.includes(r));

  return (
    <Dialog {...dialogProps} title={mission.title} width="550px">
      <div className={styles.log}>
        {log.map((l, lIndex) => (
          <p key={lIndex}>
            {l.actor !== "world" && (
              <b>{l.actor === "npc" ? l.name : "You"}: </b>
            )}
            {l.text}
          </p>
        ))}
      </div>

      {availableResponses.length > 0 && (
        <div className={styles.responses}>
          <ol>
            {availableResponses.map((r, rIndex) => (
              <li key={rIndex}>
                <button
                  type="button"
                  onClick={() => {
                    setLog((prevLog) => [
                      ...prevLog,
                      r,
                      { actor: "npc", name: mission.actorName, text: r.next },
                    ]);
                    setResponses((prevResponses) => [...prevResponses, r]);

                    if (r.type === "accept") onAccept();
                    if (r.type === "decline") onDecline();
                  }}
                >
                  {r.type !== "neutral" && (
                    <b>[{r.type === "accept" ? "Accept" : "Decline"}] </b>
                  )}
                  {r.text}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <DialogActions>
        {responses.at(-1)?.type !== "neutral" && (
          <Button onClick={dialogProps.onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
