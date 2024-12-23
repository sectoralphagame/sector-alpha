import type { Texture } from "ogl";
import { Vec3, Program } from "ogl";
import type { Engine } from "@ogl-engine/engine/engine";
import Color from "color";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class TintedTextureMaterial extends Material {
  uniforms: Material["uniforms"] & {
    tMap: { value: Texture };
    uColor: { value: Vec3 };
    fEmissive: { value: number };
  };

  constructor(engine: Engine, texture: Texture, color?: string) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
      transparent: true,
    });
    this.uniforms.tMap = { value: texture };
    this.uniforms.uColor = {
      value: color
        ? new Vec3(...Color(color).array()).divide(255)
        : new Vec3(1, 1, 1),
    };
    this.uniforms.fEmissive = { value: 0.1 };
  }
}
