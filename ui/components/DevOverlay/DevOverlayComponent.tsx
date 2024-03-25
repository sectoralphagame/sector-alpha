import type { DevAction } from "@core/actions/types";
import { Button } from "@kit/Button";
import { useSim } from "@ui/atoms";
import React from "react";
import styles from "./styles.scss";

function getLabel(action: DevAction) {
  if (action.type === "target") {
    return `${action.name} (target)`;
  }

  return action.name;
}

export interface DevOverlayComponentProps {
  actions: DevAction[];
  target: number | null;
  // eslint-disable-next-line react/no-unused-prop-types
  onReload: () => void;
  onClose: () => void;
}

export const DevOverlayComponent: React.FC<DevOverlayComponentProps> = ({
  actions: actionsProp,
  target,
  onClose,
}) => {
  const [sim] = useSim();
  const actionsByCategory = React.useMemo(
    () =>
      actionsProp.reduce((acc, action) => {
        if (!acc[action.category]) {
          acc[action.category] = [];
        }
        acc[action.category].push(action);
        return acc;
      }, {} as Record<string, DevAction[]>),
    [actionsProp]
  );

  return (
    <div className={styles.root}>
      {Object.entries(actionsByCategory).map(([category, actions]) => (
        <div className={styles.category} key={category}>
          <h4>{category}</h4>
          <div className={styles.actions}>
            {actions.map((action) => (
              <Button
                title={action.description}
                key={action.slug + action.category}
                disabled={action.type === "target" && !target}
                onClick={() => {
                  if (action.type === "basic") {
                    action.fn(sim);
                  } else if (action.type === "player") {
                    action.fn(sim, ...action.variants[0]);
                  } else if (action.type === "target" && target) {
                    action.fn(sim, target);
                    onClose();
                  }
                }}
              >
                {getLabel(action)}
              </Button>
            ))}
          </div>
        </div>
      ))}
      {/* eslint-disable-next-line react/button-has-type */}
      {/* <button onClick={onReload}>Reload</button> */}
    </div>
  );
};
