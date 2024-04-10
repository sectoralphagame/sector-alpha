import { CircleFilledIcon, HeartIcon } from "@assets/ui/icons";
import type { HitPoints } from "@core/components/hitpoints";
import React from "react";
import clsx from "clsx";
import styles from "./styles.scss";

export interface HitPointsProps {
  hp: HitPoints;
}

export const HitPointsInfo: React.FC<HitPointsProps> = ({ hp }) => (
  <>
    <div className={styles.root}>
      {!!hp.shield && (
        <>
          <CircleFilledIcon className={clsx(styles.icon, styles.shield)} />
          {hp.shield.value.toFixed(0)} / {hp.shield.max}
        </>
      )}
      <HeartIcon className={clsx(styles.icon, styles.hp)} />
      {hp.hp.value.toFixed(0)}/{hp.hp.max}
    </div>
    <hr />
  </>
);
