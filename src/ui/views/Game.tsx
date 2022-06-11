import React from "react";
import { nano } from "../../style";
import { Panel } from "../components/Panel";

const styles = nano.sheet({
  root: {
    display: "grid",
    gridTemplateColumns: "450px 1fr",
  },
});

export const Game: React.FC = () => (
  <div className={styles.root}>
    <Panel />
    {/* This div is managed by react so each render would override
      any changes made by pixi, like cursor property. That's why rendering
      system creates own canvas here */}
    <div id="canvasRoot" />
  </div>
);
