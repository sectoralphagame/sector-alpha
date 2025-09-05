import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { type Texture } from "ogl";
import { assetLoader } from "@ogl-engine/AssetLoader";
import fragment from "./shader.frag.glsl";
import vertex from "../pbr/shader.vert.glsl";
import type { Uniforms } from "../material";
import { Material } from "../material";

interface AsteroidRockMaterialArgs {
  instanced?: boolean;
}

export class AsteroidRockMaterial extends Material {
  uniforms: Material["uniforms"] &
    Uniforms<{
      tGrunge: Texture;
      tNormal: Texture;
    }>;

  constructor(engine: Engine3D, args: AsteroidRockMaterialArgs = {}) {
    super(engine);

    const defines: Record<string, string> = {};

    if (args.instanced) {
      defines.USE_INSTANCING = "1";
    }

    this.uniforms.tGrunge = {
      value: assetLoader.tx(this.engine.gl, "world/asteroidGrunge"),
    };
    this.uniforms.tNormal = {
      value: assetLoader.tx(this.engine.gl, "world/asteroidNormal"),
    };

    this.createProgram(vertex, fragment, defines);
  }
}
