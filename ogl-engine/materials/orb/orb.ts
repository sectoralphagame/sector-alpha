import type { Vec4 } from "ogl";
import { Program } from "ogl";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class OrbMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uStart: { value: Vec4 };
    uEnd: { value: Vec4 };
    fEmissive: { value: number };
  };

  constructor(engine: Engine3D, start: Vec4, end: Vec4) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
      cullFace: false,
    });
    this.uniforms.uStart = { value: start };
    this.uniforms.uEnd = { value: end };
    this.uniforms.fEmissive = { value: 0 };
  }
}
