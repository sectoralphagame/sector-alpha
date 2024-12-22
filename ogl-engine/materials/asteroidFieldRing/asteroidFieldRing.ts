import { Program, Vec4 } from "ogl";
import type { Engine } from "@ogl-engine/engine/engine";
import Color from "color";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class AsteroidFieldRingMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uColor: { value: Vec4 };
  };

  constructor(engine: Engine) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
      cullFace: null,
      transparent: true,
    });
    this.uniforms.uColor = { value: new Vec4(1) };
  }

  setColor(color: string) {
    const c = Color(color).array();
    this.uniforms.uColor.value.set(c[0], c[1], c[2], 255).multiply(1 / 255);
  }
}
