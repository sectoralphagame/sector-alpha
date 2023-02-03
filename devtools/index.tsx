import React from "react";
import { Route, Routes, Link } from "react-router-dom";
import { Card, CardHeader } from "@kit/Card";
import { Ships } from "./ships";
import "@alenaksu/json-viewer";
import { UniverseMap } from "./map";
import styles from "./index.scss";

const DevToolsCard: React.FC<{
  link: string;
  name: string;
  description: string;
}> = ({ link, name, description }) => (
  <Link to={link} className={styles.cardLink}>
    <Card>
      <CardHeader>{name}</CardHeader>
      {description}
    </Card>
  </Link>
);

const DevToolsIndex: React.FC = () => (
  <div className={styles.root}>
    <div className={styles.grid}>
      <DevToolsCard
        name="Ship Editor"
        description="Manage ships blueprints, their costs and other properties"
        link="/dev/ships"
      />
      <DevToolsCard
        name="Map"
        description="See nearest stars map and distances between them"
        link="/dev/map"
      />
    </div>
  </div>
);

export const DevTools: React.FC = () => (
  <Routes>
    <Route path="ships" element={<Ships />} />
    <Route path="map" element={<UniverseMap />} />
    <Route path="/" element={<DevToolsIndex />} />
  </Routes>
);
