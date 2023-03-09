import React from "react";
import type { RequirePureComponent } from "@core/tsHelpers";
import styles from "./MapView.scss";

export interface MapViewComponentProps {
  factions: RequirePureComponent<"color" | "name">[];
}

export const MapViewComponent: React.FC<MapViewComponentProps> = ({
  factions,
}) => (
  <>
    <div className={styles.faction}>
      <div
        className={styles.factionColor}
        style={{ background: "rgb(151, 255, 125)" }}
      />
      <span>Player</span>
    </div>
    {factions.map((ai) => (
      <div key={ai.id} className={styles.faction}>
        <div
          className={styles.factionColor}
          style={{ background: ai.cp.color.value }}
        />
        <span>{ai.cp.name.value}</span>
      </div>
    ))}
  </>
);

MapViewComponent.displayName = "MapViewComponent";
