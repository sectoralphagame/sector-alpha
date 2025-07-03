import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { Vec3 } from "ogl";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

interface AtmosphereMaterialArgs {
  color: string;
  uX?: number;
  uY?: number;
}

export class AtmosphereMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uColor: { value: Vec3 };
    uX: { value: number };
    uY: { value: number };
  };

  constructor(engine: Engine3D, args: AtmosphereMaterialArgs) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {},
      {
        depthWrite: false,
        transparent: true,
        cullFace: this.engine.gl.FRONT,
      }
    );
    this.program.setBlendFunc(
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.ONE,
      this.engine.gl.SRC_ALPHA,
      this.engine.gl.DST_ALPHA
    );

    this.uniforms.uColor = {
      value: new Vec3(),
    };
    this.uniforms.uX = {
      value: args.uX ?? -0.3,
    };
    this.uniforms.uY = {
      value: args.uY ?? -0.75,
    };

    this.setColor(args.color);
  }

  setColor(color: string) {
    Material.colorToVec3(color, this.uniforms.uColor);
  }
}
