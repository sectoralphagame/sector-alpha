import React from "react";
import styles from "./Relations.scss";

export interface RelationsComponentProps {
  factions: Array<{
    slug: string;
    color: string;
    relation: number;
  }>;
}

export const RelationsComponent: React.FC<RelationsComponentProps> = ({
  factions,
}) => (
  <div className={styles.root}>
    <div className={styles.barHorizontal} />
    {factions.map(({ slug, color, relation }) => (
      <div key={slug} className={styles.barContainer}>
        <span
          className={styles.bar}
          style={{
            color,
            height: Math.abs(relation) * 2,
            top: relation > 0 ? 100 - relation * 2 : 100 - relation * 0,
          }}
        />
        <span className={styles.label}>
          {slug}
          <br />
          {relation}
        </span>
      </div>
    ))}
  </div>
);
RelationsComponent.displayName = "RelationsComponent";
