import { Transform } from "ogl";
import type { FolderApi } from "tweakpane";
import { getPane } from "@ui/context/Pane";
import type { Engine3D } from "../../engine/engine3d";
import type { Engine } from "../../engine/engine";

export abstract class BackgroundProp extends Transform {
  engine: Engine;
  name = "BackgroundProp";

  paneFolder: FolderApi;

  constructor(engine: Engine3D) {
    super();

    this.engine = engine;
  }

  createPaneFolder() {
    this.paneFolder = getPane().addOrReplaceFolder({
      title: this.name,
    });

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
