import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Vec3, type Texture } from "ogl";
import { assetLoader } from "@ogl-engine/AssetLoader";
import fragment from "./shader.frag.glsl";
import vertex from "../pbr/shader.vert.glsl";
import type { Uniform } from "../material";
import { Material } from "../material";

interface AsteroidNewMaterialArgs {
  color?: string;
  instanced?: boolean;
}

export class AsteroidNewMaterial extends Material {
  uniforms: Material["uniforms"] & {
    tGrunge: Uniform<Texture>;
    tNormal: Uniform<Texture>;
    uMask: Uniform<number>;
    uColor: Uniform<Vec3>;
    uEmissive: Uniform<number>;
  };

  constructor(engine: Engine3D, args: AsteroidNewMaterialArgs = {}) {
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
    this.uniforms.uMask = { value: 0.02 };
    this.uniforms.uColor = { value: new Vec3() };
    this.uniforms.uEmissive = { value: 0.4 };
    this.setColor(args.color ?? "#ff00ff");

    this.createProgram(vertex, fragment, defines);
  }

  setColor(color: string) {
    Material.colorToVec3(color, this.uniforms.uColor);
  }
}
