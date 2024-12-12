import models from "@assets/models";
import type {
  Geometry,
  GLTFMaterial,
  ImageRepresentation,
  OGLRenderingContext,
} from "ogl";
import { GLTFLoader } from "ogl";
import { chunk, entries, fromEntries, keys, map, pipe } from "@fxts/core";
import { skyboxes } from "@assets/textures/skybox";
import smoke from "@assets/textures/particle/smoke.png";
import fire from "@assets/textures/particle/fire.png";
import { loadTextureImage } from "./utils/texture";

export type ModelName = keyof typeof models;

const textures = {
  "particle/smoke": smoke,
  "particle/fire": fire,
};
export type TextureName = keyof typeof textures;

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
  textures: Record<TextureName, ImageRepresentation> = {};

  // eslint-disable-next-line class-methods-use-this
  preload = async (onAssetLoad: (_progress: number) => void) => {
    const state = pipe(
      { ...models, ...skyboxes, ...textures },
      keys,
      map((model) => [model, false] as [string, boolean]),
      fromEntries
    );

    const updateProgress = () =>
      onAssetLoad(
        Object.values(state).filter(Boolean).length /
          Object.values(state).length
      );

    return Promise.all([
      ...Object.entries(models).map(async ([name, modelPath]) => {
        await fetch(modelPath);
        state[name] = true;
        updateProgress();
      }),
      ...Object.entries(skyboxes).map(async ([name, imagePaths]) => {
        await Promise.all(Object.values(imagePaths).map((p) => fetch(p)));
        state[name] = true;
        updateProgress();
      }),
      ...Object.entries(textures).map(async ([name, path]) => {
        const texture = await loadTextureImage(path);
        state[name] = true;
        textures[name] = texture;
        updateProgress();
      }),
    ]);
  };

  loadTextures = async (onAssetLoad: () => void) => {
    const queue = pipe(
      textures,
      entries,
      map(([name, path]) => async () => {
        const image = await loadTextureImage(path);
        this.textures[name] = image;
      }),
      chunk(3)
    );

    for (const batch of queue) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(batch.map((fn) => fn()));
      onAssetLoad();
    }
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
