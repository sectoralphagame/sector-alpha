import type { Engine } from "@ogl-engine/engine/engine";
import type { Mesh, Program, Vec3 } from "ogl";

export abstract class Material {
  engine: Engine;
  protected program: Program;
  protected uniforms: {
    fLightPower: { value: number };
    vLightColor: { value: Vec3 };
    vLightDirection: { value: Vec3 };
    uTime: { value: number };
  };

  constructor(engine: Engine) {
    this.engine = engine;
    this.uniforms = {
      vLightColor: engine.uniforms.env.vLightColor,
      vLightDirection: engine.uniforms.env.vLightDirection,
      fLightPower: engine.uniforms.env.fLightPower,
      uTime: engine.uniforms.uTime,
    };
  }

  apply(mesh: Mesh) {
    mesh.program = this.program;
  }
}
