import { CircleFilledIcon, HeartIcon } from "@assets/ui/icons";
import type { HitPoints } from "@core/components/hitpoints";
import React from "react";
import clsx from "clsx";
import { Tooltip } from "@kit/Tooltip";
import styles from "./styles.scss";

export interface HitPointsProps {
  hp: HitPoints;
}

export const HitPointsInfo: React.FC<HitPointsProps> = ({ hp }) => {
  const HealthTooltip = React.useCallback(
    (ref: React.LegacyRef<HTMLSpanElement>) => (
      <span ref={ref}>
        <HeartIcon className={clsx(styles.icon, styles.hp)} />
        {hp.hp.value.toFixed(0)}/{hp.hp.max}
      </span>
    ),
    [hp.hp.value, hp.hp.max]
  );

  const ShieldTooltip = React.useCallback(
    (ref: React.LegacyRef<HTMLSpanElement>) => (
      <span ref={ref}>
        <CircleFilledIcon className={clsx(styles.icon, styles.shield)} />
        {hp.shield!.value.toFixed(0)}/{hp.shield!.max}
      </span>
    ),
    [hp.shield?.value, hp.shield?.max]
  );

  return (
    <div className={styles.root}>
      {!!hp.shield && <Tooltip anchor={ShieldTooltip}>Shield</Tooltip>}
      <Tooltip anchor={HealthTooltip}>Health</Tooltip>
    </div>
  );
};
