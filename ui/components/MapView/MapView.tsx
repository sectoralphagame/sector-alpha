import React from "react";
import { useSim } from "../../atoms";
import { MapViewComponent } from "./MapViewComponent";

export const MapView: React.FC = () => {
  const [sim] = useSim();

  return <MapViewComponent factions={sim.index.ai.get()} />;
};

MapView.displayName = "MapView";
