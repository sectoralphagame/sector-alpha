import React from "react";
import { RenderingSystem } from "@core/systems/rendering";
import { useContextMenu } from "@ui/state/contextMenu";
import { useGameOverlay, useSim } from "@ui/atoms";
import { useOverlayRegister } from "../Overlay/Overlay";

export const MapOverlay: React.FC = () => {
  useOverlayRegister("map");
  const [overlay] = useGameOverlay();
  const system = React.useRef<RenderingSystem>();
  const [menu, setMenu] = useContextMenu();
  const [sim] = useSim();

  React.useEffect(() => {
    if (overlay === "map") {
      system.current = new RenderingSystem([menu, setMenu]);
      system.current.apply(sim);
    }

    return () => {
      system.current?.destroy();
    };
  }, [overlay]);

  if (overlay !== "map") return null;

  return <div id="map-overlay" />;
};
