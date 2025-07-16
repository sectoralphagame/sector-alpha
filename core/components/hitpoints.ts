import type { RequireComponent } from "@core/tsHelpers";
import type { BaseComponent } from "./component";

export interface HitPoints extends BaseComponent<"hitpoints"> {
  hp: {
    max: number;
    value: number;
    regen: number;
  };
  shield?: {
    max: number;
    value: number;
    regen: number;
  };
  hitBy: Record<number, number>; // entityId: timestamp
}

export function subtractHp(
  entity: RequireComponent<"hitpoints">,
  value: number
): void {
  let delta = value;
  if (entity.cp.hitpoints.shield?.value) {
    entity.cp.hitpoints.shield.value = Math.max(
      0,
      entity.cp.hitpoints.shield.value - delta
    );
    delta += Math.min(entity.cp.hitpoints.shield.value, value);
  }

  entity.cp.hitpoints.hp.value -= delta;
}

export function dealDamageToEntity(
  entity: RequireComponent<"hitpoints">,
  value: number,
  attackerId: number
): void {
  subtractHp(entity, -value);
  entity.cp.hitpoints.hitBy[attackerId] = entity.sim.getTime();
}
