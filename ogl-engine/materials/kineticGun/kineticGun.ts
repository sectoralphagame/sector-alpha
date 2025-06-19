import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Vec4 } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "../orb/shader.vert.glsl";
import { Material } from "../material";

interface KineticGunMaterialArgs {
  color: string;
}

export class KineticGunMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uColor: { value: Vec4 };
  };

  constructor(engine: Engine3D, args: KineticGunMaterialArgs) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {},
      {
        cullFace: false,
        transparent: true,
        depthWrite: false,
      }
    );

    this.program.setBlendFunc(
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.ONE,
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.DST_ALPHA
    );

    this.uniforms.uColor = { value: new Vec4() };

    Material.colorToVec4(args.color, this.uniforms.uColor);
  }
}
