import settings from "@core/settings";
import type { Engine } from "@ogl-engine/engine/engine";
import type { Light } from "@ogl-engine/engine/Light";
import type { Vec3, Mesh, Program } from "ogl";

export abstract class Material {
  engine: Engine;
  protected program: Program;
  protected uniforms: {
    ambient: { value: Vec3 };
    lights: Light["uniforms"][];
    uTime: { value: number };
    fCameraNear: { value: number };
    fCameraFar: { value: number };
  };

  constructor(engine: Engine) {
    this.engine = engine;
    this.uniforms = {
      ambient: engine.uniforms.env.ambient,
      lights: engine.uniforms.env.lights,
      uTime: engine.uniforms.uTime,
      fCameraNear: { value: settings.camera.near },
      fCameraFar: { value: settings.camera.far },
    };
  }

  apply(mesh: Mesh) {
    mesh.program = this.program;
  }
}
