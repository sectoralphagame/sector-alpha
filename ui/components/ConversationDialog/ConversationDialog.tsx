import { Button } from "@kit/Button";
import type { DialogProps } from "@kit/Dialog";
import { Dialog } from "@kit/Dialog";
import { DialogActions } from "@kit/DialogActions";
import Text from "@kit/Text";
import clsx from "clsx";
import React from "react";
import type {
  ConversationLine,
  MissionConversation,
} from "@core/systems/mission/types";
import { Scrollbar } from "@kit/Scrollbar";
import styles from "./styles.scss";

export interface ConversationDialogProps extends DialogProps {
  conversation: MissionConversation;
  onEnd: (_flags: Record<string, string>) => void;
}

export const ConversationDialog: React.FC<ConversationDialogProps> = ({
  conversation,
  onClose,
  onEnd,
  ...dialogProps
}) => {
  const logRef = React.useRef<HTMLDivElement>(null);
  const [flags, setFlags] = React.useState<Record<string, string>>({});
  const [log, setLog] = React.useState<
    { line: ConversationLine; actor: string }[]
  >(() => {
    const [actor, line] = conversation.Start.split(".");

    return [
      {
        line: conversation.Actors[actor].lines[line],
        actor,
      },
    ];
  });
  const [responses, setResponses] = React.useState<ConversationLine[]>([]);
  const canClose = responses.length === 0;

  React.useEffect(() => {
    const nextNodes = log.at(-1)!.line.next;
    if (nextNodes === undefined) {
      onEnd(flags);
      return;
    }

    const [actor, line] = nextNodes[0].split(".");
    const isResponse = actor === "player";
    if (!isResponse && conversation.Actors[actor].lines[line].set) {
      setFlags((prevFlags) => ({
        ...prevFlags,
        ...conversation.Actors[actor].lines[line].set,
      }));
    }
    if (isResponse) {
      setResponses(
        nextNodes.map(
          (node) => conversation.Actors[actor].lines[node.split(".")[1]]
        )
      );
    } else {
      setLog((prevLog) => [
        ...prevLog,
        {
          line: conversation.Actors[actor].lines[line],
          actor,
        },
      ]);
      if (!conversation.Actors[actor].lines[line].next) {
        setResponses([]);
      }
    }

    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <Dialog
      {...dialogProps}
      onClose={canClose ? onClose : null}
      title="Conversation"
      width="650px"
    >
      <Scrollbar
        className={clsx(styles.scrollable, {
          [styles.scrollableNoResponses]: responses.length === 0,
        })}
      >
        <div className={styles.log} ref={logRef}>
          {log.map((l, lIndex) => (
            <React.Fragment key={lIndex}>
              {log[lIndex - 1]?.actor === l.actor ? (
                <div />
              ) : (
                <Text
                  color={l.actor === "player" ? "primary" : "default"}
                  component="b"
                >
                  {l.actor === "player"
                    ? "You"
                    : conversation.Actors[l.actor].name}
                </Text>
              )}
              <Text>
                {!!l.line.action && <b>[{l.line.action}] </b>}
                {l.line.text}
              </Text>
            </React.Fragment>
          ))}
        </div>
      </Scrollbar>

      {responses.length > 0 && (
        <div className={styles.responses}>
          <ol>
            {responses.map((response, rIndex) => (
              <li key={rIndex}>
                <button
                  type="button"
                  onClick={() => {
                    setLog((prevLog) => [
                      ...prevLog,
                      { actor: "player", line: response },
                    ]);
                    setResponses([]);
                    if (response.set) {
                      setFlags((prevFlags) => ({
                        ...prevFlags,
                        ...response.set,
                      }));
                    }
                  }}
                >
                  {!!response.action && <b>[{response.action}] </b>}
                  {response?.text}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      {canClose && (
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
