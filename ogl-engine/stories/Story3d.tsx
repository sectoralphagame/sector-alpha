import { skyboxes } from "@assets/textures/skybox";
import { Engine3D } from "@ogl-engine/engine/engine3d";
import { TacticalMapScene } from "@ogl-engine/engine/Scene";
import { MapControl } from "@ogl-engine/MapControl";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { getPane } from "@ui/context/Pane";
import { Orbit } from "ogl";
import React from "react";

export interface Story3dArgs {
  postProcessing: boolean;
  skybox: keyof typeof skyboxes;
  control?: "orbit" | "map";
  pane: boolean;
  grid: boolean;
}

interface Story3dProps extends Story3dArgs {
  onEngineInit: (_engine: Engine3D) => void;
  onEngineUpdate: (_engine: Engine3D, _time: number) => void;
}

export const Story3d: React.FC<Story3dProps> = ({
  postProcessing,
  skybox,
  control,
  pane,
  grid,
  onEngineInit,
  onEngineUpdate,
}) => {
  const engine = React.useMemo(() => {
    const e = new Engine3D<TacticalMapScene>();
    e.setScene(new TacticalMapScene(e));

    return e;
  }, []);
  const controlRef = React.useRef<{ update: (_delta?: number) => void }>();
  const skyboxRef = React.useRef<Skybox>();

  React.useEffect(() => {
    getPane().hidden = !pane;
  }, [pane]);

  React.useEffect(() => {
    engine.hooks.subscribe("init", () => {
      onEngineInit(engine);

      controlRef.current =
        control === "map"
          ? new MapControl(engine.camera, engine.canvas)
          : new Orbit(engine.camera);
      skyboxRef.current = new Skybox(engine, skybox);
      skyboxRef.current.setParent(engine.scene);
    });

    engine.hooks.subscribe("update", ({ delta }) => {
      controlRef.current?.update(engine.originalDelta);
      onEngineUpdate(engine, delta);
    });
  }, [engine]);

  React.useEffect(() => {
    engine.postProcessing = postProcessing;
  }, [engine, postProcessing]);

  React.useEffect(() => {
    if (engine.initialized) {
      if (skyboxRef.current?.light) {
        engine.removeLight(skyboxRef.current.light);
      }
      skyboxRef.current?.destroy();
      skyboxRef.current?.setParent(null);
      skyboxRef.current = new Skybox(engine, skybox);
      skyboxRef.current.setParent(engine.scene);
    }
  }, [engine, skybox]);

  React.useEffect(() => {
    if (grid && engine.initialized) {
      engine.scene.addGrid();
    } else {
      engine.scene.ui.children
        .find((child) => child.name === "Grid")
        ?.setParent(null);
    }
  }, [grid]);

  return <OglCanvas engine={engine} />;
};

export const story3dMeta = {
  parameters: {
    layout: "fullscreen",
  },
  args: {
    postProcessing: true,
    skybox: skyboxes.deepspace1,
    pane: false,
    grid: false,
  },
  argTypes: {
    postProcessing: {
      control: {
        type: "boolean",
      },
    },
    skybox: {
      options: Object.keys(skyboxes),
      control: { type: "select" },
    },
    pane: {
      control: {
        type: "boolean",
      },
    },
    grid: {
      control: {
        type: "boolean",
      },
    },
  },
};
