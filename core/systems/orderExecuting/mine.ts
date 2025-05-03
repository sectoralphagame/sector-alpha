import { createWaypoint } from "@core/archetypes/waypoint";
import { Vec2 } from "ogl";
import {
  asteroidField,
  getRandomPositionInField,
} from "../../archetypes/asteroidField";
import type { MineAction } from "../../components/orders";
import { getAvailableSpace } from "../../components/storage";
import type { RequireComponent } from "../../tsHelpers";
import { moveToActions } from "../../utils/moving";
import { transport3D } from "../transport3d";

const tempVec2 = new Vec2(0, 0);

export function mineAction(
  entity: RequireComponent<
    "drive" | "mining" | "movable" | "position" | "storage"
  >,
  order: MineAction
): boolean {
  const targetField = asteroidField(entity.sim.getOrThrow(order.targetFieldId));

  if (
    entity.cp.position.sector !== targetField.cp.position.sector ||
    !targetField.cp.mineable.fPoints.some(([pos, size]) => {
      const distance = tempVec2
        .copy(pos)
        .add(targetField.cp.position.coord)
        .distance(entity.cp.position.coord);

      return distance <= size;
    })
  ) {
    entity.cp.orders!.value[0].actions.unshift(
      ...moveToActions(
        entity,
        createWaypoint(entity.sim, {
          owner: entity.id,
          value: tempVec2
            .copy(targetField.cp.position.coord)
            .add(getRandomPositionInField(targetField)),
          sector: targetField.cp.position.sector,
        })
      )
    );
  }

  entity.cp.mining.entityId = order.targetFieldId;
  entity.cp.mining.resource = order.resource;

  if (!targetField.cp.mineable.mountPoints.used.includes(entity.id)) {
    targetField.cp.mineable.mountPoints.used.push(entity.id);
    transport3D.hooks.startMining.notify(entity);
  }

  if (getAvailableSpace(entity.cp.storage) === 0) {
    entity.cp.mining.entityId = null;
    entity.cp.mining.resource = null;

    targetField.cp.mineable.mountPoints.used =
      targetField.cp.mineable.mountPoints.used.filter((id) => id !== entity.id);
    transport3D.hooks.stopMining.notify(entity);

    return true;
  }

  return false;
}
