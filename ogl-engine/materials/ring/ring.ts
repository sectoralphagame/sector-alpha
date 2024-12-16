import { Mesh, Plane, Program, Vec3, Vec4 } from "ogl";
import type { Engine } from "@ogl-engine/engine/engine";
import Color from "color";
import type { DockSize } from "@core/components/dockable";
import fragment from "./shader.frag.glsl";
import vertex from "./shader.vert.glsl";

const sizes: Record<DockSize, Vec4> = {
  small: new Vec4(0, 0.3, 0.42, 0.44),
  medium: new Vec4(0.1, 0.35, 0.42, 0.47),
  large: new Vec4(0.3, 0.3999, 0.42, 0.49),
};

export class SelectionRing extends Mesh {
  engine: Engine;
  name = "SelectionRing";

  color: Vec3;
  ringSizes: Vec4;
  selected: number;

  constructor(
    engine: Engine,
    colorNumber: number,
    size: number,
    entitySize: DockSize
  ) {
    const geometry = new Plane(engine.gl, {
      height: size,
      width: size,
    });

    const color = new Vec3(...Color(colorNumber).array()).divide(255);
    const ringSizes = new Vec4().copy(sizes[entitySize]);

    super(engine.gl, {
      geometry,
      program: new Program(engine.gl, {
        vertex,
        fragment,
        uniforms: {
          uColor: { value: color },
          uRings: { value: ringSizes },
          uSelected: { value: 0 },
        },
        transparent: true,
        cullFace: false,
      }),
    });
    this.engine = engine;

    this.color = color;
    this.ringSizes = ringSizes;

    this.rotation.x = -Math.PI / 2;
  }

  setSelected = (selected: boolean) => {
    this.program.uniforms.uSelected.value = selected ? 1 : 0;
  };
}
