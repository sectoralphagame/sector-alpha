import { IconButton } from "@kit/IconButton";
import React from "react";
import Stack from "@kit/Stack";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import {
  ConfigIcon,
  FleetIcon,
  FullscreenIcon,
  JournalIcon,
  LockIcon,
} from "@assets/ui/icons";
import { gameStore } from "@ui/state/game";
import useFullscreen from "@ui/hooks/useFullscreen";
import { Tooltip } from "@kit/Tooltip";
import { useGameDialog, useSim } from "../atoms";
import styles from "./PlayerMoney.scss";

export const PlayerMoney: React.FC = () => {
  const [sim] = useSim();
  const [player, setPlayer] = React.useState(sim.index.player.get()[0]);
  const [gameSettings] = useGameSettings();
  const [, setDialog] = useGameDialog();
  const { fullscreenEnabled, toggle } = useFullscreen();

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
      <IconButton variant="naked" onClick={() => gameStore.setOverlay("fleet")}>
        <FleetIcon />
      </IconButton>
      <IconButton
        variant="naked"
        onClick={() => gameStore.setOverlay("missions")}
      >
        <JournalIcon />
      </IconButton>
      {gameSettings.dev && (
        <IconButton
          className={styles.dev}
          variant="naked"
          onClick={() => gameStore.setOverlay("dev")}
        >
          <LockIcon />
        </IconButton>
      )}
      <IconButton onClick={() => setDialog({ type: "config" })} variant="naked">
        <ConfigIcon />
      </IconButton>
      {!fullscreenEnabled && (
        <Tooltip
          // eslint-disable-next-line react/no-unstable-nested-components
          anchor={(ref) => (
            <IconButton ref={ref} onClick={toggle} variant="naked">
              <FullscreenIcon />
            </IconButton>
          )}
        >
          Go fullscreen
        </Tooltip>
      )}
    </Stack>
  );
};

PlayerMoney.displayName = "PlayerMoney";
