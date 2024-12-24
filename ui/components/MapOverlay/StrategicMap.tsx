import type { Faction } from "@core/archetypes/faction";
import type { Sector } from "@core/archetypes/sector";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Sim } from "@core/sim";
import { first, pipe, sortBy } from "@fxts/core";
import { BaseMesh2D } from "@ogl-engine/engine/BaseMesh2D";
import { Engine2D } from "@ogl-engine/engine/engine2d";
import { MapControl } from "@ogl-engine/MapControl";
import type { ColorMaterial2D } from "@ogl-engine/materials/color/color";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import { sectorObservable } from "@ui/state/sector";
import type { OGLRenderingContext } from "ogl";
import { Geometry, Transform } from "ogl";
import React from "react";

class SectorGeometry extends Geometry {
  constructor(gl: OGLRenderingContext) {
    super(gl);

    const position = new Float32Array(12 * 3);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      position.set([Math.cos(angle), 0, Math.sin(angle)], i * 3);
    }
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 0.98;
      position.set([Math.cos(angle) * r, 0, Math.sin(angle) * r], 18 + i * 3);
    }

    this.addAttribute("position", {
      size: 3,
      data: position,
    });
    this.addAttribute("index", {
      data: new Uint16Array([
        0, 1, 6, 1, 2, 7, 2, 3, 8, 3, 4, 9, 4, 5, 10, 5, 0, 11,

        6, 7, 1, 7, 8, 2, 8, 9, 3, 9, 10, 4, 10, 11, 5, 11, 6, 0,
      ]),
    });
  }
}

interface StrategicMapProps {
  sim: Sim;
  close: () => void;
}

export class StrategicMap extends React.PureComponent<StrategicMapProps> {
  engine: Engine2D;
  control: MapControl;
  sim: Sim;

  constructor(props: StrategicMapProps) {
    super(props);
    this.engine = new Engine2D();
    this.sim = props.sim;
  }

  componentDidMount(): void {
    this.engine.hooks.onInit.subscribe("StrategicMap", this.onInit.bind(this));
    this.engine.hooks.onUpdate.subscribe(
      "StrategicMap",
      this.onUpdate.bind(this)
    );
  }

  onInit() {
    this.control = new MapControl(this.engine.camera, this.engine.canvas);
    this.engine.camera.position.y = 20;
    this.control.minDistance = 1;
    this.control.maxDistance = 20;

    const sectors = new Transform();
    sectors.name = "Sectors";
    sectors.setParent(this.engine.scene);

    for (const sector of this.sim.index.sectors.getIt()) {
      const sectorMesh = new BaseMesh2D<ColorMaterial2D>(this.engine, {
        geometry: new SectorGeometry(this.engine.gl),
      });
      sectorMesh.name = `Sector:${sector.id}`;
      let color = "#1f1f1f";
      if (sector.cp.owner) {
        color = this.sim.getOrThrow<Faction>(sector.cp.owner.id).cp.color.value;
      }
      sectorMesh.material.setColor(color);
      const hecsPos = hecsToCartesian(sector.cp.hecsPosition.value, 1);

      sectorMesh.position.set(hecsPos[0], 0, hecsPos[1]);
      sectorMesh.setParent(sectors);
    }
  }

  onUpdate() {
    this.control.update();

    if (this.control.target.distance(this.engine.camera.position) <= 1.1) {
      // eslint-disable-next-line react/destructuring-assignment
      this.props.close();

      const selectedSector = pipe(
        this.engine.scene.children.find((c) => c.name === "Sectors")!.children,
        sortBy((c) => c.position.distance(this.control.target)),
        first
      );

      sectorObservable.notify(
        this.sim.getOrThrow<Sector>(Number(selectedSector!.name!.slice(7)))
      );
    }
  }

  render() {
    return <OglCanvas engine={this.engine} fpsCounter={false} />;
  }
}
