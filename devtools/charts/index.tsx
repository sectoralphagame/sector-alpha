import { Route, Routes, Link } from "react-router-dom";
import React from "react";
import styles from "./styles.scss";
import { EvasionChart } from "./EvasionChart";

export const Index: React.FC = () => (
  <div className={styles.root}>
    <ul>
      <li>
        <Link to="/dev/charts/evasion">Evasion</Link>
      </li>
    </ul>
  </div>
);

export const Charts: React.FC = () => (
  <Routes>
    <Route path="evasion" element={<EvasionChart />} />
    <Route path="" element={<Index />} />
  </Routes>
);
