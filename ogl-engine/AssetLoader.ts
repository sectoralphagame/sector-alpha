import models from "@assets/models";
import type {
  Geometry,
  GLTFMaterial,
  ImageRepresentation,
  OGLRenderingContext,
  Vec3,
} from "ogl";
import { Euler, GLTFLoader } from "ogl";
import { chunk, entries, fromEntries, keys, map, pipe } from "@fxts/core";
import { skyboxes } from "@assets/textures/skybox";
import smoke from "@assets/textures/particle/smoke.png";
import fire from "@assets/textures/particle/fire.png";
import { loadTextureImage } from "./utils/texture";
import { getParticleType } from "./particles";

export type ModelName = keyof typeof models;

const textures = {
  "particle/smoke": smoke,
  "particle/fire": fire,
};
export type TextureName = keyof typeof textures;

export interface ParticleGeneratorInput {
  name: string;
  position: Vec3;
  rotation: Euler;
}

class AssetLoader {
  ready: boolean = false;
  readyPromise: Promise<void>;
  models: Record<
    string,
    {
      geometry: Geometry;
      material: GLTFMaterial;
      particles?: Array<ParticleGeneratorInput>;
    }
  > = {};
  textures: Record<TextureName, ImageRepresentation> = {
    "particle/smoke": new Image(),
    "particle/fire": new Image(),
  };

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
        const image = await loadTextureImage(path, textures[name]);
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

  load = (gl: OGLRenderingContext) => {
    this.readyPromise = Promise.all(
      Object.entries(models).map(([modelName, modelPath]) =>
        GLTFLoader.load(gl, modelPath).then((model) => {
          this.models[modelName] = {
            geometry: model.meshes[0].primitives[0].geometry,
            material: model.materials?.[0],
          };

          for (const node of model.nodes) {
            const particleType = getParticleType(node.name!);
            if (particleType) {
              this.models[modelName].particles ??= [];
              this.models[modelName].particles!.push({
                name: node.name!,
                position: node.position.clone().sub(model.nodes[0].position),
                rotation: new Euler().copy(node.rotation),
              });
            }
          }

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
