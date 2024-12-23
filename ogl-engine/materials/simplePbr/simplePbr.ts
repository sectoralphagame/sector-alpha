import { Program } from "ogl";
import type { GLTFMaterial, Texture } from "ogl";
import type { Engine } from "@ogl-engine/engine/engine";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class SimplePbrMaterial extends Material {
  uniforms: Material["uniforms"] & {
    tDiffuse: { value: Texture };
    tNormal: { value: Texture };
    tRoughness: { value: Texture };
    uNormalScale: { value: number };
    uNormalUVScale: { value: number };
  };

  constructor(engine: Engine, gltfMaterial: GLTFMaterial) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
    });
    this.uniforms.tDiffuse = { value: gltfMaterial.baseColorTexture.texture };
    this.uniforms.tNormal = { value: gltfMaterial.normalTexture.texture };
    this.uniforms.tRoughness = {
      value:
        gltfMaterial.metallicRoughnessTexture?.texture ??
        // FIXME: This is a hack to make the material work with the current model data
        gltfMaterial.normalTexture.texture,
    };
    this.uniforms.uNormalScale = { value: 1 };
    this.uniforms.uNormalUVScale = { value: 1 };
  }
}
