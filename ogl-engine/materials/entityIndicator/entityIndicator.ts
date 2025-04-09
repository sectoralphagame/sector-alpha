import { Program, Vec4 } from "ogl";
import Color from "color";
import type { DockSize } from "@core/components/dockable";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";
import { Material } from "../material";

export class EntityIndicatorMaterial extends Material {
  uniforms: Material["uniforms"] & {
    uSize: { value: number };
    uColor: { value: Vec4 };
    uHp: { value: number };
    uShield: { value: number };
    uHovered: { value: number };
    uSelected: { value: number };
  };

  constructor(engine: Engine3D) {
    super(engine);

    this.program = new Program(engine.gl, {
      vertex,
      fragment,
      uniforms: this.uniforms,
      depthTest: false,
      transparent: true,
    });
    this.uniforms.uColor = { value: new Vec4(1) };
    this.uniforms.uSize = { value: 1 };
    this.uniforms.uHp = { value: 0 };
    this.uniforms.uShield = { value: 0 };
    this.uniforms.uHovered = { value: 0 };
    this.uniforms.uSelected = { value: 0 };
  }

  setColor(color: number) {
    const c = Color(color).array();
    this.uniforms.uColor.value.set(c[0], c[1], c[2], 255).multiply(1 / 255);
  }

  setSize(size: DockSize) {
    this.uniforms.uSize.value = {
      small: 2.5,
      medium: 4,
      large: 7,
    }[size];
  }

  setSelected(selected: boolean) {
    this.uniforms.uSelected.value = selected ? 1 : 0;
  }

  setHovered(hovered: boolean) {
    this.uniforms.uHovered.value = hovered ? 1 : 0;
  }
}
