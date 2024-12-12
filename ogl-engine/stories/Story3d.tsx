import { skyboxes } from "@assets/textures/skybox";
import { Engine } from "@ogl-engine/engine/engine";
import { Skybox } from "@ogl-engine/materials/skybox/skybox";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { Orbit } from "ogl";
import React from "react";

export interface Story3dArgs {
  postProcessing: boolean;
  skybox: keyof typeof skyboxes;
}

interface Story3dProps extends Story3dArgs {
  onEngineInit: (_engine: Engine) => void;
  onEngineUpdate: (_engine: Engine, _time: number) => void;
}

export const Story3d: React.FC<Story3dProps> = ({
  postProcessing,
  skybox,
  onEngineInit,
  onEngineUpdate,
}) => {
  const engine = React.useMemo(() => new Engine(), []);
  const controlRef = React.useRef<Orbit>();
  const skyboxRef = React.useRef<Skybox>();

  React.useEffect(() => {
    engine.hooks.onInit.subscribe("Story3d", async () => {
      onEngineInit(engine);

      controlRef.current = new Orbit(engine.camera);
      skyboxRef.current = new Skybox(engine, engine.scene, skybox);
    });

    engine.hooks.onUpdate.subscribe("Story3d", (time) => {
      controlRef.current!.update();
      onEngineUpdate(engine, time);
    });
  }, [engine]);

  React.useEffect(() => {
    engine.postProcessing = postProcessing;
  }, [engine, postProcessing]);

  React.useEffect(() => {
    if (engine.initialized) {
      skyboxRef.current?.destroy();
      skyboxRef.current = new Skybox(engine, engine.scene, skybox);
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
  },
};