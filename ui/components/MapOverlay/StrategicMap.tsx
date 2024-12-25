import type { Faction } from "@core/archetypes/faction";
// import type { Sector } from "@core/archetypes/sector";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { Sim } from "@core/sim";
import { defaultIndexer } from "@core/systems/utils/default";
import { BaseMesh2D } from "@ogl-engine/engine/BaseMesh2D";
import { StrategicMapEngine } from "@ogl-engine/engine/engine2d";
import { MapControl } from "@ogl-engine/MapControl";
import type { ColorMaterial2D } from "@ogl-engine/materials/color/color";
import { OglCanvas } from "@ogl-engine/OglCanvas";
// import type { MouseButton } from "@ogl-engine/Orbit";
// import { contextMenuObservable } from "@ui/state/contextMenu";
// import { sectorObservable } from "@ui/state/sector";
import type { OGLRenderingContext } from "ogl";
import { Vec2, Geometry, Raycast, Vec3, Text } from "ogl";
import React from "react";
import spaceMono from "@assets/fonts/SpaceMono/SpaceMono-Regular.json";
import spaceMonoTexture from "@assets/fonts/SpaceMono/SpaceMono-Regular.png";
import { loadTexture } from "@ogl-engine/utils/texture";
import { MSDFMaterial } from "@ogl-engine/materials/msdf/msdf";

const tempVec2 = new Vec2();
// const tempVec3 = new Vec3();

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

    const fontTexture = await loadTexture(this.engine, spaceMonoTexture, {
      generateMipmaps: false,
    });

    for (const sector of this.sim.index.sectors.getIt()) {
      const sectorMesh = new BaseMesh2D<ColorMaterial2D>(this.engine, {
        geometry: new SectorGeometry(this.engine.gl),
      });
      sectorMesh.name = `Sector:${sector.id}`;
      sectorMesh.geometry.computeBoundingBox();
      let color = "#1f1f1f";
      if (sector.cp.owner) {
        color = this.sim.getOrThrow<Faction>(sector.cp.owner.id).cp.color.value;
      }
      sectorMesh.material.setColor(color);
      const hecsPos = hecsToCartesian(sector.cp.hecsPosition.value, 1);

      sectorMesh.position.set(hecsPos[0], 0, hecsPos[1]);
      sectorMesh.setParent(this.engine.scene.sectors);

      const text = new Text({
        font: spaceMono,
        text: sector.cp.name.value,
        // text: sector.cp.name.value,
        width: 40,
        align: "center",
        letterSpacing: 0.05,
        size: 1,
        lineHeight: 1.1,
      });

      const sectorNameMesh = new BaseMesh2D<MSDFMaterial>(this.engine, {
        geometry: new Geometry(this.engine.gl, {
          position: { size: 3, data: text.buffers.position },
          uv: { size: 2, data: text.buffers.uv },
          id: { size: 1, data: text.buffers.id },
          index: { data: text.buffers.index },
        }),
      });
      sectorNameMesh.position.z -= 0.85;
      sectorNameMesh.rotation.set(-Math.PI / 2, 0, 0);
      sectorNameMesh.scale.set(0.08);
      sectorNameMesh.applyMaterial(new MSDFMaterial(this.engine, fontTexture));
      sectorNameMesh.setParent(sectorMesh);
    }

    // this.control.onClick = this.onClick.bind(this);
  }

  // onClick(mousePosition: Vec2, button: MouseButton) {
  // const scale = 1;
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

  // const ray = this.engine.camera.getRay(position);
  // const hits = this.engine.scene.raycast(ray);
  // if (hits.length > 0) {
  //   const sector = pipe(
  //     hits,
  //     sortBy((hit) => hit.distance),
  //     first
  //   ).object as BaseMesh2D;
  //   const sectorId = sector.name.split(":")[1];
  //   this.changeSector(this.sim.getOrThrow<Sector>(sectorId));
  // }
  // }

  onUpdate() {
    this.control.update();
    this.updateRaycast();

    this.updateHover();
  }

  updateRaycast() {
    const normalisedMousePos = new Vec2(
      2.0 * (this.control!.mouse.x / this.engine.gl.renderer.width) - 1.0,
      2.0 * (1.0 - this.control!.mouse.y / this.engine.gl.renderer.height) - 1.0
    );
    this.raycast.castMouse(this.engine.camera, normalisedMousePos);
  }

  updateHover() {
    if (!this.control.moved) return;

    const mouseWorldPos = this.raycast.intersectPlane({
      origin: new Vec3(0),
      normal: new Vec3(0, 1, 0),
    }) as Vec3 | 0;

    if (mouseWorldPos === 0) return;

    for (const sector of defaultIndexer.sectors.getIt()) {
      const sectorWorldPos = new Vec2(
        ...hecsToCartesian(sector.cp.hecsPosition.value, 1)
      );

      const mouseWorldPos2 = tempVec2.set(mouseWorldPos.x, mouseWorldPos.z);
      const pos = mouseWorldPos2.sub(sectorWorldPos);

      if (isInHexagon(pos)) {
        const sectorMesh = this.engine.scene.getSector(
          sector.id
        ) as BaseMesh2D<ColorMaterial2D>;
        sectorMesh.material.setColor("#f1f1f1");
      } else {
        const sectorMesh = this.engine.scene.getSector(
          sector.id
        ) as BaseMesh2D<ColorMaterial2D>;
        let color = "#1f1f1f";
        if (sector.cp.owner) {
          color = this.sim.getOrThrow<Faction>(sector.cp.owner.id).cp.color
            .value;
        }
        sectorMesh.material.setColor(color);
      }
    }
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
