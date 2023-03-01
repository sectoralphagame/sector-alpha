import type { ShipRole } from "./world/ships";
import { shipRoles } from "./world/ships";

const tags = [
  "player",
  "destroyAfterUsage",
  "selection",
  "ship",
  "facility",
  ...shipRoles.map<`role:${ShipRole}`>((role) => `role:${role}`),
] as const;

export type EntityTag = (typeof tags)[number];
export const EntityTags = tags.reduce(
  (obj, key) => ({
    ...obj,
    [key]: key,
  }),
  {} as Record<EntityTag, string>
);
