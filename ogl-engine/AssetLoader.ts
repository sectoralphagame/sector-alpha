import models from "@assets/models";
import type {
  Geometry,
  GLTFMaterial,
  ImageRepresentation,
  OGLRenderingContext,
  Vec3,
} from "ogl";
import { Euler, GLTFLoader } from "ogl";
import { chunk, fromEntries, keys, map, pipe, values } from "@fxts/core";
import { skyboxes } from "@assets/textures/skybox";
import smoke from "@assets/textures/particle/smoke.png";
import fire from "@assets/textures/particle/fire.png";
import asteroidGrunge from "@assets/textures/world/asteroidGrunge.png";
import asteroidNormal from "@assets/textures/world/asteroidNormal.png";
import spaceMonoTexture from "@assets/fonts/SpaceMono/SpaceMono-Regular.png";
import firaSansTexture from "@assets/fonts/FiraSans/FiraSans-Light.png";
import { renderLogger } from "@core/log";
import { getParticleType } from "./particles";
import { TextureEngine } from "./engine/engine2d";
import smokeShader from "./procedural/smoke.frag.glsl";

export type ModelName = keyof typeof models;

const textures = {
  "particle/smoke": smoke,
  "particle/fire": fire,
  "font/spaceMono": spaceMonoTexture,
  "font/firaSans": firaSansTexture,
  "world/asteroidGrunge": asteroidGrunge,
  "world/asteroidNormal": asteroidNormal,
};
export type TextureName = keyof typeof textures | "prop/smoke";

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
  textures: Partial<Record<TextureName, ImageRepresentation>> = {};
  logger = renderLogger.sub("assetLoader");

  // eslint-disable-next-line class-methods-use-this
  async preload(onAssetLoad: (_progress: number) => void) {
    await this.generateTextures();

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
        this.logger.log(`Loaded ${path}`);
        resources[path] = true;

        if (path in Object.values(textures)) {
          await this.loadTexture(path as TextureName);
        }
      }),
      chunk(3)
    );

    for (const jobChunk of queue) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(jobChunk.map((job) => job()));
      updateProgress();
    }

    this.logger.log("All assets loaded");
    this.logger.log(`Loaded ${Object.keys(resources).length} assets`);
  }

  async generateTextures() {
    this.logger.log("Generating textures");
    const start = performance.now();
    const textureEngine = new TextureEngine();
    textureEngine.size = 4096;
    textureEngine.init(new OffscreenCanvas(512, 512));
    textureEngine.setShader(smokeShader);
    textureEngine.update();

    const name = "prop/smoke";
    textureEngine.seed();
    textureEngine.render();
    const img = new Image();
    // eslint-disable-next-line no-await-in-loop
    await textureEngine.image(img);
    this.addTexture(name as TextureName, img);
    this.logger.log(`Generated ${name}`);

    this.logger.log(`Textures generated in ${performance.now() - start}ms`);
  }

  load(gl: OGLRenderingContext) {
    this.readyPromise = Promise.all(
      Object.entries(models).map(([modelName, modelInfo]) =>
        this.getGltf(gl, modelName, modelInfo)
      )
    ).then(() => {
      this.ready = true;
    });

    return this.readyPromise;
  }

  async getGltf(
    gl: OGLRenderingContext,
    modelName: string,
    modelInfo: string | { model: string; material: string }
  ) {
    const model = await GLTFLoader.load(
      gl,
      typeof modelInfo === "string" ? modelInfo : modelInfo.model
    );
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

  addTexture(name: TextureName, image: ImageRepresentation) {
    this.textures[name] = image;
  }

  addTextureByUrl(url: string, image: ImageRepresentation) {
    for (const [textureName, textureUrl] of Object.entries(textures)) {
      if (url === textureUrl) {
        this.textures[textureName] = image;
      }
    }
  }

  loadTexture(name: TextureName): Promise<HTMLImageElement> {
    const image = new Image();
    const promise = new Promise<HTMLImageElement>((resolve) => {
      image.onload = () => {
        resolve(image);
      };
    });
    image.src = textures[name];
    this.addTexture(name, image);

    return promise;
  }

  getTexture(name: TextureName) {
    if (!this.textures[name]) {
      this.logger.log(`Accessing not loaded texture ${name}, loading`, "warn");
      this.loadTexture(name);
    }
    return this.textures[name];
  }
}

export const assetLoader = new AssetLoader();
