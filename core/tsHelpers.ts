import type { Component } from "react";
import type { CoreComponents } from "./components/component";
import type { Entity } from "./components/entity";

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

export type RequirePureComponent<T extends keyof CoreComponents> = Pick<
  Entity,
  "id" | "tags"
> & {
  components: Components<T>;
  cp: Components<T>;
};

export type NonNullableFields<T extends {}> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type PropsOf<T> = T extends Component<infer P> ? P : never;
