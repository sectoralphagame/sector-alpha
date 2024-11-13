import type { RequireComponent } from "@core/tsHelpers";
import { findInAncestors } from "@core/utils/findInAncestors";
import type { Engine } from "@ogl-engine/engine/engine";
import { createPathMaterialProgram } from "@ogl-engine/materials/path/path";
import { Geometry, Mesh } from "ogl";

export class Path extends Mesh {
  constructor(engine: Engine) {
    super(engine.gl, {
      geometry: new Geometry(engine.gl, {
        position: {
          size: 3,
          data: new Float32Array(20 * 3),
          usage: engine.gl.DYNAMIC_DRAW,
        },
      }),
      mode: engine.gl.LINE_STRIP,
      program: createPathMaterialProgram(engine),
    });
  }

  static getPath = (
    entity: RequireComponent<"position" | "orders">,
    scale: number
  ) => {
    const origin = findInAncestors(entity, "position");
    const waypoints: number[][] = [
      [
        origin.cp.position.coord[0] * scale,
        0,
        origin.cp.position.coord[1] * scale,
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
          targetWithPosition.cp.position.coord[0] * scale,
          0,
          targetWithPosition.cp.position.coord[1] * scale,
        ]);
      }
    }

    return waypoints;
  };

  update = (waypoints: number[][]) => {
    (this.geometry.attributes.position.data as Float32Array).set(
      waypoints.flat()
    );
    for (let i = waypoints.length; i < 20; i++) {
      (this.geometry.attributes.position.data as Float32Array).set(
        waypoints.at(-1)!,
        i * 3
      );
    }
    this.geometry.attributes.position.needsUpdate = true;
  };
}
