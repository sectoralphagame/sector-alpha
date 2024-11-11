import models from "@assets/models";
import type { Geometry, GLTFMaterial, OGLRenderingContext } from "ogl";
import { GLTFLoader } from "ogl";
import { fromEntries, keys, map, pipe } from "@fxts/core";
import { skyboxes } from "@assets/textures/skybox";

export type ModelName = keyof typeof models;

class AssetLoader {
  ready: boolean = false;
  readyPromise: Promise<void>;
  models: Record<
    string,
    {
      geometry: Geometry;
      material: GLTFMaterial;
    }
  > = {};

  // eslint-disable-next-line class-methods-use-this
  preload = async (onModelLoad: (_progress: number) => void) => {
    const state = pipe(
      { ...models, ...skyboxes },
      keys,
      map((model) => [model, false] as [string, boolean]),
      fromEntries
    );

    return Promise.all([
      ...Object.entries(models).map(async ([name, modelPath]) => {
        await fetch(modelPath);
        state[name] = true;
        onModelLoad(
          Object.values(state).filter(Boolean).length /
            Object.values(state).length
        );
      }),
      ...Object.entries(skyboxes).map(async ([name, imagePaths]) => {
        await Promise.all(Object.values(imagePaths).map((p) => fetch(p)));
        state[name] = true;
        onModelLoad(
          Object.values(state).filter(Boolean).length /
            Object.values(state).length
        );
      }),
    ]);
  };

  load = async (gl: OGLRenderingContext) => {
    this.readyPromise = Promise.all(
      Object.entries(models).map(([modelName, modelPath]) =>
        GLTFLoader.load(gl, modelPath).then((model) => {
          this.models[modelName] = {
            geometry: model.meshes[0].primitives[0].geometry,
            material: model.materials?.[0],
          };
          this.models[modelName].geometry.computeBoundingBox();
        })
      )
    ).then(() => {
      this.ready = true;
    });

    return this.readyPromise;
  };

  model = (name: ModelName) => this.models[name];
}

export const assetLoader = new AssetLoader();
