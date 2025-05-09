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
  onEngineInit,
  onEngineUpdate,
}) => {
  const engine = React.useMemo(() => new Engine3D<TacticalMapScene>(), []);
  const controlRef = React.useRef<{ update: (_delta?: number) => void }>();
  const skyboxRef = React.useRef<Skybox>();

  React.useEffect(() => {
    getPane().hidden = !pane;
  }, [pane]);

  React.useEffect(() => {
    engine.hooks.onInit.subscribe("Story3d", async () => {
      onEngineInit(engine);
      engine.setScene(new TacticalMapScene(engine));

      controlRef.current =
        control === "map"
          ? new MapControl(engine.camera, engine.canvas)
          : new Orbit(engine.camera);
      skyboxRef.current = new Skybox(engine, skybox);
      skyboxRef.current.setParent(engine.scene);
    });

    engine.hooks.onUpdate.subscribe("Story3d", (time) => {
      controlRef.current!.update(engine.originalDelta);
      onEngineUpdate(engine, time);
    });
  }, [engine]);

  React.useEffect(() => {
    engine.postProcessing = postProcessing;
  }, [engine, postProcessing]);

  React.useEffect(() => {
    if (engine.initialized) {
      skyboxRef.current?.destroy();
      skyboxRef.current?.setParent(null);
      skyboxRef.current = new Skybox(engine, skybox);
      skyboxRef.current.setParent(engine.scene);
    }
  }, [engine, skybox]);

  return <OglCanvas engine={engine} />;
};

export const story3dMeta = {
  parameters: {
    layout: "fullscreen",
  },
  args: {
    postProcessing: false,
    skybox: Object.keys(skyboxes)[0],
    pane: false,
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
  },
};
