import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import type { Engine } from "@ogl-engine/engine/engine";
import type { Material } from "@ogl-engine/materials/material";
import { Plane, Vec3 } from "ogl";

export class Billboard<
  TMaterial extends Material = Material
> extends BaseMesh<TMaterial> {
  meshScale: Vec3;
  scaling: boolean;

  constructor(engine: Engine, scale?: Vec3, scaling?: boolean) {
    super(engine, {
      geometry: new Plane(engine.gl),
    });

    this.meshScale = scale ?? new Vec3(1, 1, 1);
    this.scale.set(this.meshScale.x, this.meshScale.y, this.meshScale.z);
    this.setScaling(!!scaling);
  }

  update = () => {
    this.lookAt(this.engine.camera.position);

    if (this.scaling) {
      this.scale
        .set(
          this.engine.camera.position.distance(this.position),
          this.engine.camera.position.distance(this.position),
          this.engine.camera.position.distance(this.position)
        )
        .multiply(this.meshScale);
    }
  };

  setScaling = (scaling: boolean) => {
    this.scaling = scaling;
    if (scaling) {
      this.meshScale.set(this.scale.x, this.scale.y, this.scale.z);
    } else {
      this.scale.set(this.meshScale);
    }
  };
}
