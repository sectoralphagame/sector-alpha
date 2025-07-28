import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Vec3 } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "../base.vert.glsl";
import type { Uniform } from "../material";
import { Material } from "../material";

interface LaserImpactMaterialArgs {
  color: string;
}

export class LaserImpactMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uColor: Uniform<Vec3>;
    uIntensity: Uniform<number>;
  };

  constructor(engine: Engine3D, { color }: LaserImpactMaterialArgs) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {},
      {
        transparent: true,
        depthWrite: false,
      }
    );

    this.uniforms.uColor = { value: new Vec3() };
    Material.colorToVec3(color, this.uniforms.uColor);

    this.uniforms.uIntensity = {
      value: 1,
      meta: { pane: { min: 0, max: 1 } },
    };

    this.program.setBlendFunc(
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.ONE,
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.DST_ALPHA
    );
  }
}
