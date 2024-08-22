import { IconButton } from "@kit/IconButton";
import React from "react";
import Stack from "@kit/Stack";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import { ConfigIcon, FleetIcon, JournalIcon, LockIcon } from "@assets/ui/icons";
import { useGameDialog, useGameOverlay, useSim } from "../atoms";
import styles from "./PlayerMoney.scss";

export const PlayerMoney: React.FC = () => {
  const [sim] = useSim();
  const [player, setPlayer] = React.useState(sim.index.player.get()[0]);
  const [, setOverlay] = useGameOverlay();
  const [gameSettings] = useGameSettings();
  const [, setDialog] = useGameDialog();

  React.useEffect(() => {
    const handle = setInterval(
      () => setPlayer(sim.index.player.get()[0]),
      1000
    );

    return () => clearInterval(handle);
  }, []);

  return (
    <Stack id="money" className={styles.root}>
      <span className={styles.money}>
        {player.cp.budget!.available.toFixed(0)} UTT
      </span>
      <IconButton variant="naked" onClick={() => setOverlay("fleet")}>
        <FleetIcon />
      </IconButton>
      <IconButton variant="naked" onClick={() => setOverlay("missions")}>
        <JournalIcon />
      </IconButton>
      {gameSettings.dev && (
        <IconButton
          className={styles.dev}
          variant="naked"
          onClick={() => setOverlay("dev")}
        >
          <LockIcon />
        </IconButton>
      )}
      <IconButton onClick={() => setDialog({ type: "config" })} variant="naked">
        <ConfigIcon />
      </IconButton>
    </Stack>
  );
};

PlayerMoney.displayName = "PlayerMoney";
