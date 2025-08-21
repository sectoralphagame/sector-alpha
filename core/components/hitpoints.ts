import type { RequireComponent } from "@core/tsHelpers";
import type { BaseComponent } from "./component";

export interface HitPoints extends BaseComponent<"hitpoints"> {
  hp: {
    base: number;
    max: number;
    value: number;
    regen: number;
    modifiers: Record<string, number>;
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
    entity.cp.hitpoints.shield.value -= delta;
    if (entity.cp.hitpoints.shield.value < 0) {
      delta = -entity.cp.hitpoints.shield.value;
      entity.cp.hitpoints.shield.value = 0;
    } else {
      return; // shield absorbed all damage
    }
  }

  entity.cp.hitpoints.hp.value -= delta;
}

export function dealDamageToEntity(
  entity: RequireComponent<"hitpoints">,
  value: number,
  attackerId: number
): void {
  subtractHp(entity, value);
  entity.cp.hitpoints.hitBy[attackerId] = entity.sim.getTime();
}

export function recalculate(cp: HitPoints): void {
  let multiplier = 1;
  for (const mod of Object.values(cp.hp.modifiers)) {
    multiplier += mod;
  }

  const diff = cp.hp.base * multiplier - cp.hp.max;
  cp.hp.max = cp.hp.base * multiplier;
  if (multiplier > 1) {
    cp.hp.value += diff;
  }
}
