import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { TextureLoader, Vec3, type Texture } from "ogl";
import asteroidGrunge from "@assets/textures/world/asteroidGrunge.png";
import asteroidNormal from "@assets/textures/world/asteroidNormal.png";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

interface AsteroidNewMaterialArgs {
  color: string;
  instanced?: boolean;
}

export class AsteroidNewMaterial extends Material {
  uniforms: Material["uniforms"] & {
    tGrunge: { value: Texture };
    tNormal: { value: Texture };
    uMask: { value: number };
    uColor: { value: Vec3 };
    uEmissive: { value: number };
  };

  constructor(engine: Engine3D, { color, instanced }: AsteroidNewMaterialArgs) {
    super(engine);

    const defines: Record<string, string> = {};

    if (instanced) {
      defines.USE_INSTANCING = "1";
    }

    this.uniforms.tGrunge = {
      value: TextureLoader.load(this.engine.gl, {
        src: asteroidGrunge,
      }),
    };
    this.uniforms.tNormal = {
      value: TextureLoader.load(this.engine.gl, {
        src: asteroidNormal,
      }),
    };
    this.uniforms.uMask = { value: 0.02 };
    this.uniforms.uColor = { value: new Vec3() };
    this.uniforms.uEmissive = { value: 0.3 };
    this.setColor(color);

    this.createProgram(vertex, fragment, defines);
  }

  setColor(color: string) {
    Material.colorToVec3(color, this.uniforms.uColor);
  }
}
