import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Vec3 } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "../base.vert.glsl";
import type { Uniforms } from "../material";
import { Material } from "../material";

interface LaserMaterialArgs {
  color: string;
}

export class LaserMaterial extends Material {
  uniforms: Material["uniforms"] &
    Uniforms<{
      uColor: Vec3;
      uIntensity: number;
      uAspectRatio: number;
    }>;

  constructor(engine: Engine3D, { color }: LaserMaterialArgs) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {},
      {
        cullFace: null,
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
    this.uniforms.uAspectRatio = {
      value: 1,
    };

    this.program.setBlendFunc(
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.ONE,
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.DST_ALPHA
    );
  }
}
