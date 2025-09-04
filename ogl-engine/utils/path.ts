import type { Entity } from "@core/entity";
import type { RequireComponent } from "@core/tsHelpers";
import { findInAncestors } from "@core/utils/findInAncestors";
import { BaseMesh } from "@ogl-engine/engine/BaseMesh";
import { CrossGeometry } from "@ogl-engine/engine/CrossGeometry";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import { ColorMaterial } from "@ogl-engine/materials/color/color";
import { distanceScale } from "@ui/components/TacticalMap/EntityMesh";
import { gameStore } from "@ui/state/game";
import { Vec3, Transform } from "ogl";

const tempZero = new Vec3(0, 0, 0);

export type PathColor = "default" | "warning";
const colors: Record<PathColor, string> = {
  default: "#a9cffc",
  warning: "#ff0000",
};

export class Path extends Transform {
  engine: Engine3D;
  name = "Path";
  owner: Entity;

  constructor(engine: Engine3D, owner: Entity) {
    super();

    this.engine = engine;
    this.owner = owner;
  }

  createSegment = (): void => {
    const geometry = new CrossGeometry(this.engine.gl);
    const plane = new BaseMesh(this.engine, {
      geometry,
      material: new ColorMaterial(this.engine, {
        color: colors.default,
        shaded: false,
        layer: "2",
        depthWrite: false,
        depthTest: false,
      }),
    });
    plane.rotation.x = Math.PI / 2;
    plane.material.uniforms.fEmissive.value = 0.05;
    this.addChild(plane);
  };

  update = (waypoints: [Vec3, PathColor][]) => {
    for (let i = this.children.length; i < waypoints.length - 1; i++) {
      this.createSegment();
    }
    if (waypoints.length) {
      for (let i = waypoints.length - 1; i < this.children.length; i++) {
        this.removeChild(this.children[i]);
      }
    }

    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = waypoints[i][0].distance(waypoints[i + 1][0]);
      const focusPoint = this.engine.camera.focus();
      const scale = focusPoint.distance(this.engine.camera.position) * 0.001;

      this.children[i].scale.set(scale, distance, scale);

      this.children[i].position.set(
        waypoints[i + 1][0].clone().add(waypoints[i][0]).divide(2)
      );
      this.children[i].rotation.y = Math.atan2(
        waypoints[i][0].x - waypoints[i + 1][0].x,
        waypoints[i][0].z - waypoints[i + 1][0].z
      );

      (this.children[i] as BaseMesh<ColorMaterial>).material.setColor(
        colors[waypoints[i + 1][1]]
      );
    }
  };

  getPath(
    entity: RequireComponent<"position" | "orders">
  ): [Vec3, PathColor][] {
    const origin = findInAncestors(entity, "position");
    const waypoints: [Vec3, PathColor][] =
      origin.cp.position.sector === gameStore.sector.id
        ? [
            [
              this.engine.getByEntityId(origin.id)?.position ?? tempZero,
              "default" as PathColor,
            ],
          ]
        : [];

    for (const order of entity.cp.orders.value) {
      for (const action of order.actions) {
        if (
          !(
            action.type === "dock" ||
            action.type === "teleport" ||
            action.type === "move" ||
            action.type === "attack"
          )
        )
          continue;

        const target = entity.sim.get(action.targetId);
        if (!target || target.cp.position!.sector !== gameStore.sector.id)
          continue;

        const targetWithPosition = findInAncestors(target!, "position");

        waypoints.push([
          this.engine.getByEntityId(targetWithPosition.id)?.position ??
            new Vec3(
              targetWithPosition.cp.position.coord.x,
              0,
              targetWithPosition.cp.position.coord.y
            ).multiply(distanceScale),
          action.type === "attack" ? "warning" : "default",
        ]);
      }
    }

    return waypoints;
  }
}
