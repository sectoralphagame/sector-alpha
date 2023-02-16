import React from "react";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import ffIcon from "@assets/ui/ff.svg";
import pauseIcon from "@assets/ui/pause.svg";
import locationIcon from "@assets/ui/location.svg";
import configIcon from "@assets/ui/config.svg";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import playIcon from "@assets/ui/play.svg";
import { IconButton } from "@kit/IconButton";
import styles from "./Panel.scss";

export interface PanelComponentProps {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onConfig: () => void;
  onPause: () => void;
  onPlay: () => void;
  onSpeed: () => void;
  onFocus: (() => void) | undefined;
}

export const PanelComponent: React.FC<PanelComponentProps> = ({
  isCollapsed,
  onCollapseToggle,
  onConfig,
  onPause,
  onPlay,
  onSpeed,
  onFocus,
  children,
}) => (
  <div
    className={clsx(styles.root, {
      [styles.rootCollapsed]: isCollapsed,
    })}
    id="toolbar"
  >
    <div
      className={clsx(styles.iconBar, {
        [styles.iconBarCollapsed]: isCollapsed,
      })}
    >
      {isCollapsed ? (
        <IconButton className={styles.rotate} onClick={onCollapseToggle}>
          <SVG src={arrowLeftIcon} />
        </IconButton>
      ) : (
        <IconButton onClick={onConfig}>
          <SVG src={configIcon} />
        </IconButton>
      )}
      <IconButton onClick={onPause}>
        <SVG src={pauseIcon} />
      </IconButton>
      <IconButton onClick={onPlay}>
        <SVG src={playIcon} />
      </IconButton>
      <IconButton onClick={onSpeed}>
        <SVG src={ffIcon} />
      </IconButton>
      {!!onFocus && (
        <IconButton onClick={onFocus}>
          <SVG src={locationIcon} />
        </IconButton>
      )}
      {!isCollapsed ? (
        <>
          <div className={styles.spacer} />
          <IconButton onClick={onCollapseToggle}>
            <SVG src={arrowLeftIcon} />
          </IconButton>
        </>
      ) : (
        <IconButton onClick={onConfig}>
          <SVG src={configIcon} />
        </IconButton>
      )}
    </div>
    {!isCollapsed && <div className={styles.scrollArea}>{children}</div>}
  </div>
);
PanelComponent.displayName = "PanelComponent";
