import React from "react";
import SVG from "react-inlinesvg";
import type { Entity } from "@core/components/entity";
import type { RequireComponent } from "@core/tsHelpers";
import locationIcon from "@assets/ui/location.svg";
import { IconButton } from "@kit/IconButton";
import { isOwnedByPlayer } from "@core/components/player";
import { Button } from "@kit/Button";
import clsx from "clsx";
import styles from "./Undeploy.scss";

export interface UndeployProps {
  facility: Entity | undefined;
  deployable: RequireComponent<"deployable">;
}

export const Undeploy: React.FC<UndeployProps> = ({ facility, deployable }) => {
  const isOwned = isOwnedByPlayer(deployable);

  if (!deployable.cp.deployable.active) return null;

  if (facility && deployable.cp.deployable.type === "builder") {
    return (
      <>
        <div className={styles.root}>
          <span>{`Building: ${facility.cp.name!.value}`}</span>
          <div>
            <IconButton
              className={styles.btn}
              onClick={() => {
                const { selectionManager } = deployable.sim
                  .find((e) => e.hasComponents(["selectionManager"]))!
                  .requireComponents(["selectionManager"]).cp;

                selectionManager.id = facility.id;
                selectionManager.focused = true;
              }}
            >
              <SVG src={locationIcon} />
            </IconButton>
          </div>
        </div>
        {isOwned && (
          <Button
            className={clsx(styles.btn, styles.btnDetach)}
            onClick={() => {
              deployable.cp.deployable.cancel = true;
            }}
          >
            Detach from facility
          </Button>
        )}
        <hr />
      </>
    );
  }

  return (
    <div className={styles.root}>
      <Button
        className={styles.btn}
        onClick={() => {
          deployable.cp.deployable.cancel = true;
        }}
      >
        Deactivate
      </Button>
    </div>
  );
};
