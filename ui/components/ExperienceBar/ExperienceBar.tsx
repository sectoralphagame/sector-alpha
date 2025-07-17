import { getRank, ranks } from "@core/components/experience";
import React from "react";
import styles from "./styles.scss";

export interface ExperienceBarProps {
  amount: number;
}

export const ExperienceBar: React.FC<ExperienceBarProps> = ({ amount }) => {
  const rank = getRank(amount);
  const progress = rank === 5 ? 0 : amount / ranks[rank];
  const expLabel = rank === 5 ? "Max Rank" : `${amount}/${ranks[rank]}`;
  const rankLabel = rank ? `Rank ${rank}` : "No Rank";

  return (
    <>
      <div>{rankLabel}</div>
      <div
        className={styles.root}
        style={{ "--percent": `${progress * 100}%` } as React.CSSProperties}
      >
        <span className={styles.label}>{expLabel}</span>
      </div>
    </>
  );
};
