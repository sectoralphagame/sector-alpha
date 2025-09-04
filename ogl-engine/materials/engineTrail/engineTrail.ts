import { Program, Vec3 } from "ogl";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import Color from "color";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import type { Uniform } from "../material";
import { Material } from "../material";

export class EngineTrailMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uColor: Uniform<Vec3>;
  };

  constructor(engine: Engine3D, color: string) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
      cullFace: false,
      transparent: true,
      depthWrite: false,
    });

    this.uniforms.uColor = { value: new Vec3() };
    this.setColor(color);
  }

  setColor(color: string) {
    const c = Color(color).rgb().array();
    this.uniforms.uColor.value.set(c[0], c[1], c[2]).divide(255);
  }
}
