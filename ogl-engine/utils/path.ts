import type { RequireComponent } from "@core/tsHelpers";
import { findInAncestors } from "@core/utils/findInAncestors";
import type { Engine } from "@ogl-engine/engine/engine";
import { createPathMaterialProgram } from "@ogl-engine/materials/path/path";
import { Mesh, Plane, Transform, Vec3 } from "ogl";

const defaultColor = new Vec3(169, 207, 252);
const warningColor = new Vec3(255, 0, 0);

export class Path extends Transform {
  engine: Engine;

  constructor(engine: Engine) {
    super();

    this.engine = engine;
  }

  static getPath = (
    entity: RequireComponent<"position" | "orders">,
    scale: number
  ): [Vec3, Vec3][] => {
    const origin = findInAncestors(entity, "position");
    const waypoints: [Vec3, Vec3][] = [
      [
        new Vec3(
          origin.cp.position.coord[0] * scale,
          0,
          origin.cp.position.coord[1] * scale
        ),
        defaultColor,
      ],
    ];

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
        if (!target || target.cp.position!.sector !== origin.cp.position.sector)
          continue;

        const targetWithPosition = findInAncestors(target!, "position");

        waypoints.push([
          new Vec3(
            targetWithPosition.cp.position.coord[0] * scale,
            0,
            targetWithPosition.cp.position.coord[1] * scale
          ),
          action.type === "attack" ? warningColor : defaultColor,
        ]);
      }
    }

    return waypoints;
  };

  createSegment = (): void => {
    const plane = new Mesh(this.engine.gl, {
      geometry: new Plane(this.engine.gl),
      program: createPathMaterialProgram(this.engine),
    });
    plane.rotation.x = -Math.PI / 2;
    this.addChild(plane);
  };

  update = (waypoints: [Vec3, Vec3][]) => {
    for (let i = this.children.length; i < waypoints.length - 1; i++) {
      this.createSegment();
    }
    for (let i = waypoints.length - 1; i < this.children.length; i++) {
      this.removeChild(this.children[i]);
    }
    this.children.splice(
      waypoints.length - 1,
      this.children.length - (waypoints.length - 1)
    );

    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = waypoints[i][0].distance(waypoints[i + 1][0]);
      this.children[i].scale.set(
        (0.02 * this.engine.camera.position.y) / 5,
        distance,
        0
      );

      this.children[i].position.set(
        waypoints[i + 1][0].clone().add(waypoints[i][0]).divide(2)
      );
      this.children[i].rotation.y = Math.atan2(
        waypoints[i][0].x - waypoints[i + 1][0].x,
        waypoints[i][0].z - waypoints[i + 1][0].z
      );
      (this.children[i] as Mesh).program.uniforms.uColor.value =
        waypoints[i + 1][1];
    }
  };
}
