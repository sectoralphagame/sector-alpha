import React from "react";
import { useGameOverlay, useSim } from "@ui/atoms";
import type { StrategicMapEngine } from "@ogl-engine/engine/engine2d";
import { useOverlayRegister } from "../Overlay/Overlay";
import { StrategicMap } from "./StrategicMap";

export const MapOverlay: React.FC = () => {
  useOverlayRegister("map");
  const [overlay, setOverlay] = useGameOverlay();
  const [sim] = useSim();
  const engine = React.useRef<StrategicMapEngine>();

  const close = React.useCallback(() => {
    setOverlay(null);
  }, [setOverlay]);

  React.useEffect(() => {
    if (overlay === "map") {
      engine.current?.resize();
    }
  }, [overlay]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={{
        height: "100%",
        visibility: overlay === "map" ? "visible" : "hidden",
      }}
    >
      <StrategicMap sim={sim} close={close} engineRef={engine} />
    </div>
  );
};
