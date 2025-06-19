// import { StarMaterial } from "@ogl-engine/materials/star/star";
// import { Plane } from "ogl";
// import { StarCoronaMaterial } from "@ogl-engine/materials/starCorona/starCorona";
import { assetLoader } from "@ogl-engine/AssetLoader";
import { PbrMaterial } from "@ogl-engine/materials/pbr/pbr";
import type { Engine3D } from "../engine/engine3d";
import { BaseMesh } from "../engine/BaseMesh";
import type { Engine } from "../engine/engine";
import { BackgroundProp } from "./templates/BackgroundProp";

export class Planet extends BackgroundProp {
  engine: Engine;
  name = "Planet";

  //   atmosphere: BaseMesh<StarCoronaMaterial>;
  body: BaseMesh<PbrMaterial>;

  constructor(engine: Engine3D, textureSet: "ansura") {
    super(engine);

    this.position.z = 1e2;
    this.scale.set(1e2);

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

    // this.corona = new BaseMesh(engine, {
    //   geometry: new Plane(engine.gl, {
    //     heightSegments: 16,
    //     widthSegments: 16,
    //   }),
    //   material: new StarCoronaMaterial(
    //     engine,
    //     this.body.material.uniforms.uColor.value
    //   ),
    //   frustumCulled: false,
    // });
    // this.corona.scale.set(2.5);
    // this.corona.setParent(this);
    // this.corona.lookAt(this.engine.camera.position, false, true);
  }

  createPaneFolder() {
    super.createPaneFolder();
    this.body.material.createPaneSettings(this.paneFolder);
    // this.corona.material.createPaneSettings(this.paneFolder);
  }
}
