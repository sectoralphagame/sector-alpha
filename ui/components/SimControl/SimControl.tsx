import { IconButton } from "@kit/IconButton";
import React from "react";
import { useSim } from "@ui/atoms";
import { isDev } from "@core/settings";
import Stack from "@kit/Stack";
import { getGameDate } from "@core/utils/misc";
import Text from "@kit/Text";
import { FFIcon, PauseIcon, PlayIcon } from "@assets/ui/icons";
import styles from "./styles.scss";

export interface SimControlComponentProps {
  date: string;
  progress: number;
  onPause: () => void;
  onPlay: () => void;
  onSpeed: () => void;
  onTurbo?: () => void;
}

export const SimControlComponent: React.FC<SimControlComponentProps> = ({
  date,
  progress,
  onPause,
  onPlay,
  onSpeed,
  onTurbo,
}) => (
  <Stack id="control" className={styles.root}>
    <Text
      id={styles.date}
      component="span"
      color="text-1"
      // @ts-expect-error
      style={{ "--progress": progress }}
    >
      {date}
    </Text>
    <IconButton variant="naked" onClick={onPause}>
      <PauseIcon />
    </IconButton>
    <IconButton variant="naked" onClick={onPlay}>
      <PlayIcon />
    </IconButton>
    <IconButton variant="naked" onClick={onSpeed}>
      <FFIcon />
    </IconButton>
    {!!onTurbo && (
      <IconButton variant="naked" className={styles.turbo} onClick={onTurbo}>
        <FFIcon />
      </IconButton>
    )}
  </Stack>
);

export const SimControl: React.FC = () => {
  const [sim] = useSim();

  return (
    <SimControlComponent
      date={getGameDate(sim.getTime())}
      progress={sim.getTime() % 24}
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
