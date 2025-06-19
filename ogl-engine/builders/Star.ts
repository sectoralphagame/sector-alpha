import { StarMaterial } from "@ogl-engine/materials/star/star";
import { Plane, Sphere, Transform } from "ogl";
import type { FolderApi } from "tweakpane";
import { StarCoronaMaterial } from "@ogl-engine/materials/starCorona/starCorona";
import { getPane } from "@ui/context/Pane";
import type { Engine3D } from "../engine/engine3d";
import { BaseMesh } from "../engine/BaseMesh";
import type { Engine } from "../engine/engine";

export class Star extends Transform {
  engine: Engine;
  name = "Star";

  corona: BaseMesh<StarCoronaMaterial>;
  body: BaseMesh<StarMaterial>;

  paneFolder: FolderApi;

  constructor(engine: Engine3D, color: string) {
    super();

    this.engine = engine;

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
    this.paneFolder = getPane().addOrReplaceFolder({
      title: this.name,
    });

    this.body.material.createPaneSettings(this.paneFolder);
    this.corona.material.createPaneSettings(this.paneFolder);

    const params = {
      distance: this.position.len(),
      azimuth: Math.atan2(this.position.z, this.position.x),
      altitude: Math.asin(this.position.y / this.position.len()),
      scale: Math.max(...this.scale),
    };

    this.paneFolder
      .addBinding(params, "distance", {
        min: 5000,
        max: 100000,
      })
      .on("change", ({ value }) =>
        this.updatePositionFromSphericalCoords(
          value,
          params.azimuth,
          params.altitude
        )
      );
    this.paneFolder
      .addBinding(params, "azimuth", {
        min: 0,
        max: Math.PI * 2,
      })
      .on("change", ({ value }) =>
        this.updatePositionFromSphericalCoords(
          params.distance,
          value,
          params.altitude
        )
      );
    this.paneFolder
      .addBinding(params, "altitude", {
        min: -Math.PI / 2,
        max: Math.PI / 2,
      })
      .on("change", ({ value }) =>
        this.updatePositionFromSphericalCoords(
          params.distance,
          params.azimuth,
          value
        )
      );
    this.paneFolder
      .addBinding(params, "scale", {
        min: 200,
        max: 10000,
      })
      .on("change", ({ value }) => {
        this.scale.set(Number(value));
      });
  }

  updatePositionFromSphericalCoords(
    distance: number,
    azimuth: number,
    altitude: number
  ) {
    this.position.set(
      distance * Math.cos(altitude) * Math.cos(azimuth),
      distance * Math.sin(altitude),
      distance * Math.cos(altitude) * Math.sin(azimuth)
    );
  }

  setName(name: string) {
    this.name = name;
    this.paneFolder.title = name;
  }

  destroy(): void {
    this.paneFolder.dispose();
  }
}
