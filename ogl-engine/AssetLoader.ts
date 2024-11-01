import models from "@assets/models";
import type { Geometry, GLTFMaterial, OGLRenderingContext } from "ogl";
import { GLTFLoader } from "ogl";

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

  load = async (gl: OGLRenderingContext) => {
    this.readyPromise = Promise.all(
      Object.entries(models).map(([modelName, modelPath]) =>
        GLTFLoader.load(gl, modelPath).then((model) => {
          this.models[modelName] = {
            geometry: model.meshes[0].primitives[0].geometry,
            material: model.materials?.[0],
          };
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
