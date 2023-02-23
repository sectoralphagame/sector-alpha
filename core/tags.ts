const tags = ["player"] as const;

export type EntityTag = (typeof tags)[number];
export const EntityTags = tags.reduce(
  (obj, key) => ({
    ...obj,
    [key]: key,
  }),
  {} as Record<EntityTag, string>
);
