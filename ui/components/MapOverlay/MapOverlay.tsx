import React from "react";
import { useGameOverlay, useSim } from "@ui/atoms";
import { useOverlayRegister } from "../Overlay/Overlay";
import { StrategicMap } from "./StrategicMap";

export const MapOverlay: React.FC = () => {
  useOverlayRegister("map");
  const [overlay, setOverlay] = useGameOverlay();
  const [sim] = useSim();

  const close = React.useCallback(() => {
    setOverlay(null);
  }, [setOverlay]);

  if (overlay !== "map") return null;

  return <StrategicMap sim={sim} close={close} />;
};
