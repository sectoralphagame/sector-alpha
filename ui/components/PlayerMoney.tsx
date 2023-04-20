import { IconButton } from "@kit/IconButton";
import React from "react";
import SVG from "react-inlinesvg";
import fleetIcon from "@assets/ui/fleet.svg";
import journalIcon from "@assets/ui/journal.svg";
import { useGameOverlay, useSim } from "../atoms";
import { useRerender } from "../hooks/useRerender";
import styles from "./PlayerMoney.scss";

export const PlayerMoney: React.FC = () => {
  const [sim] = useSim();
  const [player, setPlayer] = React.useState(sim.queries.player.get()[0]);
  const [, setOverlay] = useGameOverlay();

  useRerender(1000);

  React.useEffect(() => {
    const handle = setInterval(
      () => setPlayer(sim.queries.player.get()[0]),
      1000
    );

    return () => clearInterval(handle);
  }, []);

  return (
    <div id="money" className={styles.root}>
      <span className={styles.money}>
        {player.cp.budget!.available.toFixed(0)} UTT
      </span>
      <IconButton variant="naked" onClick={() => setOverlay("fleet")}>
        <SVG src={fleetIcon} />
      </IconButton>
      <IconButton variant="naked" onClick={() => setOverlay("missions")}>
        <SVG src={journalIcon} />
      </IconButton>
    </div>
  );
};

PlayerMoney.displayName = "PlayerMoney";
