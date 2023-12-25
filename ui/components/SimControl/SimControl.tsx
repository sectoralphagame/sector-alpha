import { IconButton } from "@kit/IconButton";
import React from "react";
import SVG from "react-inlinesvg";
import ffIcon from "@assets/ui/ff.svg";
import playIcon from "@assets/ui/play.svg";
import pauseIcon from "@assets/ui/pause.svg";
import { useSim } from "@ui/atoms";
import { isDev } from "@core/settings";
import Stack from "@kit/Stack";
import styles from "./styles.scss";

export interface SimControlComponentProps {
  onPause: () => void;
  onPlay: () => void;
  onSpeed: () => void;
  onTurbo?: () => void;
}

export const SimControlComponent: React.FC<SimControlComponentProps> = ({
  onPause,
  onPlay,
  onSpeed,
  onTurbo,
}) => (
  <Stack id="money" className={styles.root}>
    <IconButton variant="naked" onClick={onPause}>
      <SVG src={pauseIcon} />
    </IconButton>
    <IconButton variant="naked" onClick={onPlay}>
      <SVG src={playIcon} />
    </IconButton>
    <IconButton variant="naked" onClick={onSpeed}>
      <SVG src={ffIcon} />
    </IconButton>
    {!!onTurbo && (
      <IconButton variant="naked" className={styles.turbo} onClick={onTurbo}>
        <SVG src={ffIcon} />
      </IconButton>
    )}
  </Stack>
);

export const SimControl: React.FC = () => {
  const [sim] = useSim();

  return (
    <SimControlComponent
      onPause={sim?.pause}
      onPlay={() => {
        sim.setSpeed(1);
        sim.start();
      }}
      onSpeed={() => {
        sim.setSpeed(5);
        sim.start();
      }}
      onTurbo={
        isDev
          ? () => {
              sim.setSpeed(50);
              sim.start();
            }
          : undefined
      }
    />
  );
};

SimControl.displayName = "SimControl";
