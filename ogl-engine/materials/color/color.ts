import type { Engine } from "@ogl-engine/engine/engine";
import type { Vec3 } from "ogl";
import { Program } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class ColorMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uColor: { value: Vec3 };
    fEmissive: { value: number };
  };

  constructor(engine: Engine, color: Vec3) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
    });
    this.uniforms.uColor = { value: color };
    this.uniforms.fEmissive = { value: 0 };
  }

  setColor(color: Vec3) {
    this.uniforms.uColor.value = color;
  }

  getColor(): Vec3 {
    return this.uniforms.uColor.value;
  }
}
