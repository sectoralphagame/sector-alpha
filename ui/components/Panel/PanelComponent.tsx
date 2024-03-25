import React from "react";
import clsx from "clsx";
import { IconButton } from "@kit/IconButton";
import { AnimatedBackdrop } from "@kit/AnimatedBackdrop";
import {
  ArrowLeftIcon,
  ConfigIcon,
  JournalIcon,
  LocationIcon,
} from "@assets/ui/icons";
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
  <AnimatedBackdrop
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
          <ArrowLeftIcon className={styles.rotate} />
        </IconButton>
      ) : (
        <IconButton onClick={onConfig}>
          <ConfigIcon />
        </IconButton>
      )}
      <IconButton onClick={onPlayerAssets}>
        <JournalIcon />
      </IconButton>
      {!!onFocus && (
        <IconButton onClick={onFocus}>
          <LocationIcon />
        </IconButton>
      )}
      {!isCollapsed ? (
        <>
          <div className={styles.spacer} />
          <IconButton onClick={onCollapseToggle}>
            <ArrowLeftIcon />
          </IconButton>
        </>
      ) : (
        <IconButton onClick={onConfig}>
          <ConfigIcon />
        </IconButton>
      )}
    </div>
    {!isCollapsed && <div className={styles.scrollArea}>{children}</div>}
  </AnimatedBackdrop>
);
PanelComponent.displayName = "PanelComponent";
