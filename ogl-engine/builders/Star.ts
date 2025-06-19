import { StarMaterial } from "@ogl-engine/materials/star/star";
import { Plane, Sphere } from "ogl";
import { StarCoronaMaterial } from "@ogl-engine/materials/starCorona/starCorona";
import type { Engine3D } from "../engine/engine3d";
import { BaseMesh } from "../engine/BaseMesh";
import type { Engine } from "../engine/engine";
import { BackgroundProp } from "./templates/BackgroundProp";

export class Star extends BackgroundProp {
  engine: Engine;
  name = "Star";

  corona: BaseMesh<StarCoronaMaterial>;
  body: BaseMesh<StarMaterial>;

  constructor(engine: Engine3D, color: string) {
    super(engine);

    this.position.z = 1e2;
    this.scale.set(1e2);

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
      geometry: new Plane(engine.gl, {
        heightSegments: 16,
        widthSegments: 16,
      }),
      material: new StarCoronaMaterial(
        engine,
        this.body.material.uniforms.uColor.value
      ),
      frustumCulled: false,
    });
    this.corona.scale.set(2.5);
    this.corona.setParent(this);
    this.corona.lookAt(this.engine.camera.position, false, true);
  }

  createPaneFolder() {
    super.createPaneFolder();
    this.body.material.createPaneSettings(this.paneFolder);
    this.corona.material.createPaneSettings(this.paneFolder);
  }
}
