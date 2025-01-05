import type { Vec2 } from "ogl";
import { Plane } from "ogl";
import { SelectionBoxMaterial } from "@ogl-engine/materials/selectionBox/selectionBox";
import { BaseMesh } from "./BaseMesh";
import type { Engine3D } from "./engine3d";

export class SelectionBox extends BaseMesh<SelectionBoxMaterial> {
  frustumCulled = false;
  visible = false;

  constructor(engine: Engine3D) {
    super(engine, {
      geometry: new Plane(engine.gl),
    });
    this.applyMaterial(new SelectionBoxMaterial(engine));
  }

  updateGeometry(start: Vec2, end: Vec2) {
    const { position } = this.geometry.attributes;
    position.data!.set([
      start.x,
      start.y,
      0,

      end.x,
      start.y,
      0,

      start.x,
      end.y,
      0,

      end.x,
      end.y,
      0,
    ]);
    position.needsUpdate = true;

    this.material.uniforms.lineWidthX.value = 0.001 / Math.abs(start.x - end.x);
    this.material.uniforms.lineWidthY.value = 0.001 / Math.abs(start.y - end.y);
  }
}
