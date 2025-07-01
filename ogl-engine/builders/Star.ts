import { StarMaterial } from "@ogl-engine/materials/star/star";
import { Sphere } from "ogl";
import { AtmosphereMaterial } from "@ogl-engine/materials/atmosphere/atmosphere";
import type { Engine3D } from "../engine/engine3d";
import { BaseMesh } from "../engine/BaseMesh";
import type { Engine } from "../engine/engine";
import { BackgroundProp } from "./templates/BackgroundProp";

export class Star extends BackgroundProp {
  engine: Engine;
  name = "Star";

  corona: BaseMesh<AtmosphereMaterial>;
  body: BaseMesh<StarMaterial>;

  constructor(engine: Engine3D, color: string) {
    super(engine);

    this.body = new BaseMesh(engine, {
      geometry: new Sphere(engine.gl, {
        heightSegments: 32,
        widthSegments: 32,
        radius: 1,
      }),
      frustumCulled: false,
      material: new StarMaterial(engine),
    });
    this.body.material.setColor(color);
    this.body.setParent(this);

    this.corona = new BaseMesh(engine, {
      geometry: new Sphere(engine.gl, {
        heightSegments: 64,
        widthSegments: 64,
      }),
      material: new AtmosphereMaterial(engine, {
        color,
      }),
      frustumCulled: false,
    });
    this.corona.scale.set(2.3);
    this.corona.setParent(this);
  }

  createPaneFolder() {
    super.createPaneFolder();
    this.body.material.createPaneSettings(this.paneFolder);
    this.corona.material.createPaneSettings(this.paneFolder);
  }
}
