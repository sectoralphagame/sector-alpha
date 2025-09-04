import { Vec3, Program } from "ogl";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import type { Engine2D } from "@ogl-engine/engine/engine2d";
import { colorToVec3 } from "@core/utils/maps";
import fragment from "./shader.frag.glsl";
import fragment2d from "./shader2d.frag.glsl";
import vertex from "./shader.vert.glsl";
import vertex2d from "./shader2d.vert.glsl";
import type { Uniform } from "../material";
import { Material, Material2D } from "../material";

export class ColorMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uColor: Uniform<Vec3>;
    fEmissive: Uniform<number>;
    bShaded: { value: boolean };
  };

  constructor(
    engine: Engine3D,
    opts: {
      color?: string;
      shaded?: boolean;
    } = {}
  ) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {},
      {
        cullFace: false,
      }
    );

    this.uniforms.uColor = { value: new Vec3() };
    this.uniforms.fEmissive = { value: 0 };
    this.uniforms.bShaded = { value: opts.shaded ?? true };

    if (opts.color) {
      this.setColor(opts.color);
    }
  }

  setColor(color: string) {
    colorToVec3(color, this.uniforms.uColor.value);
  }

  getColor(): Vec3 {
    return this.uniforms.uColor.value;
  }
}

export class ColorMaterial2D extends Material2D {
  uniforms: Material["uniforms"] & {
    uColor: Uniform<Vec3>;
  };

  constructor(engine: Engine2D, color: string) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex: vertex2d,
      fragment: fragment2d,
      uniforms: this.uniforms,
      cullFace: false,
    });
    this.uniforms.uColor = { value: new Vec3() };

    this.setColor(color);
  }

  setColor(color: string) {
    colorToVec3(color, this.uniforms.uColor.value);
  }
}
