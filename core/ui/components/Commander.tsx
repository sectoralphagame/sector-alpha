import React from "react";
import SVG from "react-inlinesvg";
import { Entity } from "../../components/entity";
import { nano, theme } from "../../style";
import { RequireComponent } from "../../tsHelpers";
import { IconButton } from "./IconButton";
import locationIcon from "../../../assets/ui/location.svg";
import closeIcon from "../../../assets/ui/close.svg";
import { useSim } from "../atoms";

export interface CommanderProps {
  commander: Entity;
  ship: RequireComponent<"commander">;
}

const styles = nano.sheet({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  btn: {
    marginLeft: theme.spacing(1),
  },
});

export const Commander: React.FC<CommanderProps> = ({ commander, ship }) => {
  const [sim] = useSim();
  const isOwned = sim.queries.player.get()[0].id === ship.cp.owner?.id;

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
          <SVG src={locationIcon} />
        </IconButton>
        {isOwned && (
          <IconButton
            className={styles.btn}
            onClick={() => {
              ship.removeComponent("commander");
            }}
          >
            <SVG src={closeIcon} />
          </IconButton>
        )}
      </div>
    </div>
  );
};
