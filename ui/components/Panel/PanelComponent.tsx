import React from "react";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import locationIcon from "@assets/ui/location.svg";
import configIcon from "@assets/ui/config.svg";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import journalIcon from "@assets/ui/journal.svg";
import { IconButton } from "@kit/IconButton";
import styles from "./Panel.scss";

export interface PanelComponentProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onConfig: () => void;
  onPlayerAssets: () => void;
  onFocus: (() => void) | undefined;
}

export const PanelComponent: React.FC<PanelComponentProps> = ({
  isCollapsed,
  onCollapseToggle,
  onConfig,
  onPlayerAssets,
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
        <IconButton onClick={onCollapseToggle}>
          <SVG className={styles.rotate} src={arrowLeftIcon} />
        </IconButton>
      ) : (
        <IconButton onClick={onConfig}>
          <SVG src={configIcon} />
        </IconButton>
      )}
      <IconButton onClick={onPlayerAssets}>
        <SVG src={journalIcon} />
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
