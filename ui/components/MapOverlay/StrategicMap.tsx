// import type { Sector } from "@core/archetypes/sector";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Sim } from "@core/sim";
import { defaultIndexer } from "@core/systems/utils/default";
import { StrategicMapEngine } from "@ogl-engine/engine/engine2d";
import { MapControl } from "@ogl-engine/MapControl";
import { OglCanvas } from "@ogl-engine/OglCanvas";
// import type { MouseButton } from "@ogl-engine/Orbit";
// import { contextMenuObservable } from "@ui/state/contextMenu";
// import { sectorObservable } from "@ui/state/sector";
import { Vec2, Raycast, Vec3 } from "ogl";
import React from "react";
import { SectorMesh } from "@ogl-engine/engine/Sector";
import { STATE, type MouseButton } from "@ogl-engine/Orbit";
import { strategicMapStore } from "@ui/state/strategicMap";

const tempVec2 = new Vec2();
// const tempVec3 = new Vec3();

function sign(p1: Vec2, p2: Vec2, p3: Vec2) {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

function isInTriangle(pos: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const d1 = sign(pos, a, b);
  const d2 = sign(pos, b, c);
  const d3 = sign(pos, c, a);

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(hasNeg && hasPos);
}

function isInHexagon(pos: Vec2): boolean {
  const v: Vec2[] = [
    new Vec2(),
    new Vec2(),
    new Vec2(),
    new Vec2(),
    new Vec2(),
    new Vec2(),
  ];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    v[i].set(Math.cos(angle), Math.sin(angle));
  }

  return (
    isInTriangle(pos, v[0], v[1], v[5]) ||
    isInTriangle(pos, v[4], v[1], v[5]) ||
    isInTriangle(pos, v[4], v[1], v[2]) ||
    isInTriangle(pos, v[4], v[3], v[2])
  );
}

interface StrategicMapProps {
  sim: Sim;
  engineRef: React.MutableRefObject<StrategicMapEngine | undefined>;
  // eslint-disable-next-line react/no-unused-prop-types
  close: () => void;
}

export class StrategicMap extends React.PureComponent<StrategicMapProps> {
  engine: StrategicMapEngine;
  control: MapControl;
  sim: Sim;
  raycast = new Raycast();
  mouseWorldPos = new Vec2();
  // raycastHits: BaseMesh2D[];

  constructor(props: StrategicMapProps) {
    super(props);
    this.engine = new StrategicMapEngine();
    this.sim = props.sim;
    // this.raycastHits = [];
  }

  componentDidMount(): void {
    this.engine.hooks.onInit.subscribe("StrategicMap", this.onInit.bind(this));
    this.engine.hooks.onUpdate.subscribe(
      "StrategicMap",
      this.onUpdate.bind(this)
    );
  }

  async onInit() {
    // eslint-disable-next-line react/destructuring-assignment
    this.props.engineRef.current = this.engine;
    this.control = new MapControl(this.engine.camera, this.engine.canvas);
    this.control.isFocused = () => {
      const overlay = document.querySelector("#overlay");
      return (
        overlay?.getAttribute("data-open") === "true" &&
        overlay?.getAttribute("data-active") === "map"
      );
    };
    this.engine.camera.position.y = 20;
    this.control.minDistance = 1;
    this.control.maxDistance = 20;

    for (const sector of this.sim.index.sectors.getIt()) {
      const sectorMesh = new SectorMesh(this.engine, sector);
      sectorMesh.setParent(this.engine.scene.sectors);
    }

    this.control.onClick = this.onClick.bind(this);
  }

  onClick(_mousePosition: Vec2, button: MouseButton) {
    // if (button === 2) {
    //   const worldPos = this.raycast.intersectPlane({
    //     origin: new Vec3(0),
    //     normal: new Vec3(0, 1, 0),
    //   });
    //   console.log(this.raycast.origin);
    //   const worldPosition = [worldPos.x / scale, worldPos.z / scale];

    //   const data = {
    //     active: true,
    //     position: mousePosition.clone(),
    //     worldPosition,
    //     // sector: sectorObservable.value,
    //   };
    //   contextMenuObservable.notify(data);
    // }

    if (button === 0) {
      if (this.control.state !== STATE.NONE) return;

      let selected = false;
      for (const sector of defaultIndexer.sectors.getIt()) {
        const sectorWorldPos = new Vec2(
          ...hecsToCartesian(sector.cp.hecsPosition.value, 1)
        );

        const pos = sectorWorldPos.sub(this.mouseWorldPos).multiply(-1);

        const mesh = this.engine.scene.getSector(sector.id) as SectorMesh;

        mesh.setSelected(isInHexagon(pos));
        if (mesh.selected) selected = true;
      }

      if (!selected && strategicMapStore.selected) {
        const sectorMesh = this.engine.scene.getSector(
          strategicMapStore.selected.id
        ) as SectorMesh;
        sectorMesh.setSelected(true);
      }
    }
  }

  onUpdate() {
    this.control.update();
    this.updateRaycast(this.control.mouse);

    this.updateHover();
  }

  updateHover() {
    if (!this.control.cursorMoved) return;

    const mouseWorldPos = this.raycast.intersectPlane({
      origin: new Vec3(0),
      normal: new Vec3(0, 1, 0),
    }) as Vec3 | 0;

    if (mouseWorldPos === 0) {
      this.mouseWorldPos.set(Infinity, Infinity);
      return;
    }

    for (const sector of defaultIndexer.sectors.getIt()) {
      const sectorWorldPos = tempVec2.set(
        ...hecsToCartesian(sector.cp.hecsPosition.value, 1)
      );

      this.mouseWorldPos.set(mouseWorldPos.x, mouseWorldPos.z);
      const pos = sectorWorldPos.sub(this.mouseWorldPos).multiply(-1);

      const mesh = this.engine.scene.getSector(sector.id) as SectorMesh;

      mesh.setHovered(isInHexagon(pos));
    }
  }

  updateRaycast(mousePosition: Vec2) {
    const normalisedMousePos = new Vec2(
      2.0 * (mousePosition.x / this.engine.gl.renderer.width) - 1.0,
      2.0 * (1.0 - mousePosition.y / this.engine.gl.renderer.height) - 1.0
    );
    this.raycast.castMouse(this.engine.camera, normalisedMousePos);
  }

  // changeSector(sector: Sector) {
  //   sectorObservable.notify(sector);

  //   // eslint-disable-next-line react/destructuring-assignment
  //   this.props.close();
  // }

  render() {
    return <OglCanvas engine={this.engine} fpsCounter={false} />;
  }
}