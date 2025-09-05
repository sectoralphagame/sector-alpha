import type { GLTFMaterial, Texture } from "ogl";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import type { Uniforms } from "../material";
import { Material } from "../material";

export class PbrMaterial extends Material {
  uniforms: Material["uniforms"] &
    Uniforms<{
      tDiffuse: Texture;
      tNormal: Texture;
      tRoughness: Texture;
      uRoughness: number;
      tEmissive: Texture;
      uMetallic: number;
    }>;

  constructor(
    engine: Engine3D,
    args: {
      instanced?: boolean;
      diffuse: Texture;
      normal: Texture;
      roughness?: Texture;
      roughnessFactor: number;
      emissive?: Texture;
      metallic: number;
    }
  ) {
    super(engine);

    const defines: Record<string, string> = {};

    if (args.instanced) {
      defines.USE_INSTANCING = "1";
    }

    this.uniforms.tDiffuse = { value: args.diffuse };
    this.uniforms.tNormal = { value: args.normal };
    this.uniforms.uMetallic = { value: args.metallic };

    if (args.roughness) {
      this.uniforms.tRoughness = {
        value: args.roughness,
      };
      defines.USE_ROUGHNESS = "1";
    } else {
      this.uniforms.uRoughness = { value: args.roughnessFactor };
    }

    if (args.emissive) {
      this.uniforms.tEmissive = {
        value: args.emissive,
      };
      defines.USE_EMISSIVE = "1";
    }

    this.createProgram(vertex, fragment, defines);
  }

  static fromGltfMaterial(
    engine: Engine3D,
    gltfMaterial: GLTFMaterial,
    instanced = false
  ): PbrMaterial {
    return new PbrMaterial(engine, {
      instanced,
      diffuse: gltfMaterial.baseColorTexture.texture,
      normal: gltfMaterial.normalTexture.texture,
      roughness: gltfMaterial.metallicRoughnessTexture?.texture,
      roughnessFactor: gltfMaterial.roughnessFactor,
      emissive: gltfMaterial.emissiveTexture?.texture,
      metallic: gltfMaterial.metallicFactor,
    });
  }
}
