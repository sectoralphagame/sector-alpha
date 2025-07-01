import { assetLoader } from "@ogl-engine/AssetLoader";
import { PbrMaterial } from "@ogl-engine/materials/pbr/pbr";
import { AtmosphereMaterial } from "@ogl-engine/materials/atmosphere/atmosphere";
import { Sphere } from "ogl";
import type { OnBeforeRenderTask } from "@ogl-engine/engine/task";
import type { Engine3D } from "../engine/engine3d";
import { BaseMesh } from "../engine/BaseMesh";
import { BackgroundProp } from "./templates/BackgroundProp";

export class Planet extends BackgroundProp {
  engine: Engine3D;
  name = "Planet";

  atmosphere: BaseMesh<AtmosphereMaterial>;
  body: BaseMesh<PbrMaterial>;
  task: OnBeforeRenderTask;

  constructor(engine: Engine3D, textureSet: "ansura" | "gaia") {
    super(engine);

    this.body = new BaseMesh(engine, {
      geometry: assetLoader.model("world/planet").geometry,
      frustumCulled: false,
      material: new PbrMaterial(engine, {
        diffuse: assetLoader.tx(this.engine.gl, `world/${textureSet}Diffuse`),
        normal: assetLoader.tx(this.engine.gl, `world/${textureSet}Normal`),
        metallic: 0.05,
        roughnessFactor: 0.97,
      }),
    });
    this.body.setParent(this);

    this.atmosphere = new BaseMesh(engine, {
      geometry: new Sphere(engine.gl, {
        heightSegments: 64,
        widthSegments: 64,
      }),
      material: new AtmosphereMaterial(engine, {
        color: "#ffd1bf",
      }),
      frustumCulled: false,
    });
    this.atmosphere.scale.set(2.3);
    this.atmosphere.setParent(this);

    this.task = this.engine.addOnBeforeRenderTask(() => {
      this.rotation.y += this.engine.delta * 0.007;
    }, 0);
  }

  createPaneFolder() {
    super.createPaneFolder();
    this.body.material.createPaneSettings(this.paneFolder);
    this.atmosphere.material.createPaneSettings(this.paneFolder);
  }
}
