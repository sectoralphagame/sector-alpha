import clsx from "clsx";
import React from "react";
import { nano } from "../../style";
import { Panel } from "../components/Panel";
import { LayoutProvider, useLayout } from "../context/Layout";

const styles = nano.sheet({
  root: {
    display: "grid",
    gridTemplateColumns: "450px 1fr",
  },
  collapsed: {
    gridTemplateColumns: "80px 1fr",
  },
});

const GameView: React.FC = () => {
  const { isCollapsed } = useLayout();

  return (
    <div
      className={clsx(styles.root, {
        [styles.collapsed]: isCollapsed,
      })}
    >
      <Panel />
      {/* This div is managed by react so each render would override
      any changes made by pixi, like cursor property. That's why rendering
      system creates own canvas here */}
      <div id="canvasRoot" />
    </div>
  );
};

export const Game: React.FC = () => (
  <LayoutProvider>
    <GameView />
  </LayoutProvider>
);
