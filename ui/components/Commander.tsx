import React from "react";
import type { Entity } from "@core/entity";
import type { RequireComponent } from "@core/tsHelpers";
import { IconButton } from "@kit/IconButton";
import { removeCommander } from "@core/components/commander";
import { CloseIcon, RedoIcon } from "@assets/ui/icons";
import { useSim } from "../atoms";
import styles from "./Commander.scss";

export interface CommanderProps {
  commander: Entity;
  ship: RequireComponent<"commander" | "orders">;
}

export const Commander: React.FC<CommanderProps> = ({ commander, ship }) => {
  const [sim] = useSim();
  const isOwned = sim.index.player.get()[0].id === ship.cp.owner?.id;

  return (
    <div className={styles.root}>
      <span>{`Commander: ${commander.cp.name!.value}`}</span>
      <div>
        <IconButton
          className={styles.btn}
          onClick={() => {
            const { selectionManager } = ship.sim
              .find((e) => e.hasComponents(["selectionManager"]))!
              .requireComponents(["selectionManager"]).cp;

            selectionManager.id = commander.id;
            selectionManager.focused = true;
          }}
        >
          <RedoIcon />
        </IconButton>
        {isOwned && (
          <IconButton
            className={styles.btn}
            onClick={() => {
              removeCommander(ship);
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </div>
    </div>
  );
};
