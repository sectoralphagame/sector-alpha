import React from "react";
import { useSim } from "../../atoms";
import { MapViewComponent } from "./MapViewComponent";

export const MapView: React.FC = () => {
  const [sim] = useSim();

  return <MapViewComponent factions={sim.queries.ai.get()} />;
};

MapView.displayName = "MapView";
