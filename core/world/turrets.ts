import { fromEntries, map, pipe } from "@fxts/core";
import type { DamageType } from "@core/components/damage";
import turretClasses from "./data/turrets.json";

const turretClassesMap = pipe(
  turretClasses,
  map(
    (t) =>
      [
        t.slug,
        {
          ...t,
          type: t.type as DamageType,
        },
      ] as const
  ),
  fromEntries
);

export function listTurrets() {
  return turretClasses;
}

export function getTurretBySlug(slug: string) {
  return turretClassesMap[slug];
}
