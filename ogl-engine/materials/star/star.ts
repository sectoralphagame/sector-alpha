import type { Texture } from "ogl";
import { Vec3, Program, TextureLoader } from "ogl";
import smoke from "@assets/textures/smoke.jpg";
import type { Engine } from "@ogl-engine/engine/engine";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class StarMaterial extends Material {
  uniforms: Material["uniforms"] & {
    vColor: { value: Vec3 };
    tSmoke: { value: Texture };
  };

  constructor(engine: Engine) {
    super(engine);

    const tSmoke = TextureLoader.load(engine.gl, {
      src: {
        jpg: smoke,
      },
      wrapS: engine.gl.REPEAT,
      wrapT: engine.gl.REPEAT,
    });

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
    });
    this.uniforms.tSmoke = { value: tSmoke };
    this.uniforms.vColor = { value: new Vec3() };
  }

  setColor(color: Vec3) {
    this.uniforms.vColor.value = color;
  }

  getColor(): Vec3 {
    return this.uniforms.vColor.value;
  }
}
