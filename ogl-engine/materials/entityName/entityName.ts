import type { Texture } from "ogl";
import { Vec3 } from "ogl";
import Color from "color";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import type { DockSize } from "@core/components/dockable";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class EntityNameMaterial extends Material {
  uniforms: Material["uniforms"] & {
    tMap: { value: Texture };
    uOffset: { value: number };
    uColor: { value: Vec3 };
  };

  constructor(engine: Engine3D, texture: Texture) {
    super(engine);

    this.createProgram(
      vertex,
      fragment,
      {
        vertex,
        fragment,
      },
      {
        depthTest: false,
        transparent: true,
      }
    );

    this.uniforms.tMap = { value: texture };
    this.uniforms.uOffset = { value: 1 };
    this.uniforms.uColor = { value: new Vec3(255) };
  }

  setOffset(size: DockSize) {
    this.uniforms.uOffset.value = {
      small: 3.9,
      medium: 5.3,
      large: 8,
    }[size ?? "small"];
  }

  setColor(color: string) {
    const c = Color(color).rgb().array();
    this.uniforms.uColor.value.set(c[0], c[1], c[2]).divide(255);
  }
}
