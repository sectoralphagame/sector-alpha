import models from "@assets/models";
import type { Geometry, GLTFMaterial, OGLRenderingContext, Vec3 } from "ogl";
import { Euler, GLTFLoader } from "ogl";
import { chunk, fromEntries, keys, map, pipe, values } from "@fxts/core";
import { skyboxes } from "@assets/textures/skybox";
import smoke from "@assets/textures/particle/smoke.png";
import fire from "@assets/textures/particle/fire.png";
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
  scale: Vec3;
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

  // eslint-disable-next-line class-methods-use-this
  async preload(onAssetLoad: (_progress: number) => void) {
    const resources = pipe(
      {
        ...models,
        ...Object.values(skyboxes).flatMap(Object.values),
        ...textures,
      },
      values,
      map((path) => [path, false] as [string, boolean]),
      fromEntries
    );

    const updateProgress = () =>
      onAssetLoad(
        Object.values(resources).filter(Boolean).length /
          Object.values(resources).length
      );

    const queue = pipe(
      resources,
      keys,
      map((path) => async () => {
        await fetch(path);
        console.log(`Loaded ${path}`);
        resources[path] = true;
      }),
      chunk(3)
    );

    for (const jobChunk of queue) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(jobChunk.map((job) => job()));
      updateProgress();
    }
  }

  load(gl: OGLRenderingContext) {
    this.readyPromise = Promise.all(
      Object.entries(models).map(([modelName, modelPath]) =>
        this.getGltf(gl, modelName, modelPath)
      )
    ).then(() => {
      this.ready = true;
    });

    return this.readyPromise;
  }

  async getGltf(gl: OGLRenderingContext, modelName: string, modelPath: string) {
    const model = await GLTFLoader.load(gl, modelPath);

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
          scale: node.scale.clone(),
        });
      }
    }

    this.models[modelName].geometry.computeBoundingBox();
    return this.models[modelName];
  }

  model(name: ModelName) {
    return this.models[name];
  }
}

export const assetLoader = new AssetLoader();
