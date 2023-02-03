import { IconButton } from "@kit/IconButton";
import React from "react";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import { useSim } from "../../atoms";
import styles from "./MapView.scss";

export const MapView: React.FC = () => {
  const [sim] = useSim();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.caption}>
        <span>Legend</span>
        <IconButton
          className={styles.expand}
          onClick={() => setExpanded(!expanded)}
        >
          <SVG
            className={clsx({
              [styles.rotate]: !expanded,
            })}
            src={arrowLeftIcon}
          />
        </IconButton>
      </div>
      {expanded && (
        <>
          <div className={styles.faction}>
            <div
              className={styles.factionColor}
              style={{ background: "rgb(151, 255, 125)" }}
            />
            <span>Player</span>
          </div>
          {sim.queries.ai.get().map((ai) => (
            <div key={ai.id} className={styles.faction}>
              <div
                className={styles.factionColor}
                style={{ background: ai.cp.color.value }}
              />
              <span>{ai.cp.name.value}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

MapView.displayName = "MapView";
