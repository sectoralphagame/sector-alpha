import { Route, Routes, Link } from "react-router-dom";
import React from "react";
import styles from "../charts/styles.scss";
import { Dogfight } from "./dogfight";
import { FrigateUnderAttack } from "./frigateUnderAttack";

export const Index: React.FC = () => (
  <div className={styles.root}>
    <ul>
      <li>
        <Link to="/dev/scenarios/dogfight">Dogfight</Link>
      </li>
      <li>
        <Link to="/dev/scenarios/frigate">Frigate</Link>
      </li>
    </ul>
  </div>
);

export const Scenarios: React.FC = () => {
  // Hack to delay rendering by one cycle, until the pane is mounted
  const [mount, setMount] = React.useState(false);
  React.useEffect(() => {
    setMount(true);
  }, []);

  if (!mount) {
    return null;
  }

  return (
    <div
      style={{
        height:
          "calc(100vh - var(--header-height) - var(--body-bottom-padding))",
      }}
    >
      <Routes>
        <Route path="dogfight" element={<Dogfight />} />
        <Route path="frigate" element={<FrigateUnderAttack />} />
        <Route path="" element={<Index />} />
      </Routes>
    </div>
  );
};
