import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { TextureLoader, type Texture } from "ogl";
import asteroidGrunge from "@assets/textures/world/asteroidGrunge.png";
import asteroidNormal from "@assets/textures/world/asteroidNormal.png";
import fragment from "./shader.frag.glsl";
import vertex from "../pbr/shader.vert.glsl";
import { Material } from "../material";

interface AsteroidRockMaterialArgs {
  instanced?: boolean;
}

export class AsteroidRockMaterial extends Material {
  uniforms: Material["uniforms"] & {
    tDiffuse: { value: Texture };
    tNormal: { value: Texture };
  };

  constructor(engine: Engine3D, args: AsteroidRockMaterialArgs = {}) {
    super(engine);

    const defines: Record<string, string> = {};

    if (args.instanced) {
      defines.USE_INSTANCING = "1";
    }

    this.uniforms.tDiffuse = {
      value: TextureLoader.load(this.engine.gl, {
        src: asteroidGrunge,
      }),
    };
    this.uniforms.tNormal = {
      value: TextureLoader.load(this.engine.gl, {
        src: asteroidNormal,
      }),
    };

    this.createProgram(vertex, fragment, defines);
  }
}
