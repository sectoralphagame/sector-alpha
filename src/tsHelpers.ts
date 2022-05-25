import type { CoreComponents, Entity } from "./components/entity";

export type KeyOf<T> = keyof T;
export type Values<T> = T[keyof T];

export type Components<T extends keyof CoreComponents> = Required<
  Pick<CoreComponents, T>
> &
  Partial<Omit<CoreComponents, T>>;

export type RequireComponent<T extends keyof CoreComponents> = Entity & {
  components: Components<T>;
  cp: Components<T>;
};

export type NonNullableFields<T extends {}> = {
  [P in keyof T]: NonNullable<T[P]>;
};
