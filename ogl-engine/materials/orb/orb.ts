import type { Engine } from "@ogl-engine/engine/engine";
import type { Vec4 } from "ogl";
import { Program } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class OrbMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uStart: { value: Vec4 };
    uEnd: { value: Vec4 };
    uT: { value: number };
    fEmissive: { value: number };
  };

  constructor(engine: Engine, start: Vec4, end: Vec4) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
    });
    this.uniforms.uStart = { value: start };
    this.uniforms.uEnd = { value: end };
    this.uniforms.fEmissive = { value: 0 };
    this.uniforms.uT = { value: 0 };
  }
}
